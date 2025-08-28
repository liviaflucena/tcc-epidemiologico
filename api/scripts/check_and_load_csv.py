import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
import subprocess

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/dengue_db"
)
CSV_PATH = os.getenv("CSV_PATH", "/app/data/DENGBR25.csv")


def wait_for_db(max_retries=30, delay=2):
    """Tenta se conectar ao banco até ficar disponível."""
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            conn.close()
            print(f"[BOOT] DB acessível (tentativa {i+1}).")
            return True
        except psycopg2.OperationalError:
            print(f"[BOOT] Banco ainda não está pronto (tentativa {i+1}). Retentando...")
            time.sleep(delay)
    return False


def count_rows():
    """Conta registros em dengue_stats."""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS total FROM dengue_stats;")
        result = cur.fetchone()
        conn.close()
        return result["total"]
    except Exception as e:
        print(f"[BOOT] Erro ao contar registros: {e}")
        return 0


if _name_ == "_main_":
    if not wait_for_db():
        print("[BOOT] Banco não respondeu a tempo. Abortando.")
        exit(1)

    total = count_rows()
    print(f"[BOOT] Registros em dengue_stats: {total}")

    if total == 0:
        print("[BOOT] Banco vazio. Vou rodar o ETL...")
        try:
            subprocess.run(
                ["python", "-m", "scripts.etl_load_csv"],
                check=True
            )
            print("[BOOT] ETL concluído com sucesso.")
        except subprocess.CalledProcessError as e:
            print(f"[BOOT] Falha ao rodar ETL: {e}")
            exit(1)
    else:
        print("[BOOT] Banco já possui dados. Pulo a carga.")

    print("[BOOT] check_and_load_csv finalizado.")