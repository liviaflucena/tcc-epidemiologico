#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Iniciando container API..."

# Variáveis com defaults (podem vir do docker-compose/.env)
: "${DATABASE_URL:=postgresql+psycopg2://postgres:postgres@db:5432/dengue_db}"
: "${CSV_PATH:=/app/data/DENGBR25.csv}"
: "${BIND_ADDR:=0.0.0.0:8000}"
: "${WORKERS:=3}"

# Aguarda Postgres (tenta conectar via python/SQLAlchemy)
echo "[entrypoint] Aguardando Postgres ficar disponível em: ${DATABASE_URL}"
python - <<'PY'
import os, sys, time
from sqlalchemy import create_engine, text
db = os.getenv("DATABASE_URL")
engine = create_engine(db, pool_pre_ping=True, future=True)
for i in range(60):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[entrypoint] Postgres OK.")
        sys.exit(0)
    except Exception as e:
        print(f"[entrypoint] Tentativa {i+1}/60: aguardando DB... ({e})")
        time.sleep(1)
sys.exit(1)
PY

# Verifica se dengue_stats existe e está vazia.
# Se existir e estiver vazia, roda o ETL.
echo "[entrypoint] Verificando necessidade de ETL..."
python - <<'PY'
import os
from sqlalchemy import create_engine, text
db = os.getenv("DATABASE_URL")
csv = os.getenv("CSV_PATH", "/app/data/DENGBR25.csv")
engine = create_engine(db, pool_pre_ping=True, future=True)

def table_exists(conn, name):
    q = text("""
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = :t
        )
    """)
    return conn.execute(q, {"t": name}).scalar()

with engine.connect() as conn:
    if not table_exists(conn, "dengue_stats"):
        print("[entrypoint] Tabela dengue_stats NÃO existe. Não vou rodar ETL automático aqui (ela deve ser criada pelos SQLs de init).")
        need_etl = False
    else:
        count = conn.execute(text("SELECT COUNT(*) FROM dengue_stats")).scalar()
        print(f"[entrypoint] Registros atuais em dengue_stats: {count}")
        need_etl = (count == 0)

if need_etl:
    print("[entrypoint] Rodando ETL (scripts/etl_load_csv.py)...")
    os.environ.setdefault("PYTHONPATH", "/app")
    os.execvp("python", ["python", "-m", "scripts.etl_load_csv"])
else:
    print("[entrypoint] ETL não necessário.")
PY

# Se o ETL não “tomou” o processo acima (os.execvp), seguimos para o gunicorn:
echo "[entrypoint] Subindo gunicorn..."
exec gunicorn -w "${WORKERS}" -b "${BIND_ADDR}" wsgi:app