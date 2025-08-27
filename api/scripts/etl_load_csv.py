import os
import math
import pandas as pd
from sqlalchemy import create_engine, text

# --- Config ---------------------------------------------------------------
CSV_PATH = os.getenv("CSV_PATH", "/app/data/DENGBR25.csv")
NROWS = int(os.getenv("NROWS", "0")) or None  # 0 => todos
CHUNK = int(os.getenv("CHUNK", "200000"))     # leitura em chunks pra não estourar memória

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@db:5432/dengue_db",
)

# Tabela destino (usa nomes em português conforme combinamos)
TABELA = "dengue_stats"
COL_DATA = "data_referencia"      # date
COL_UF = "uf"                      # varchar
COL_MUN = "municipio_ibge_id"     # int
COL_CASOS = "casos"               # int
COL_OBITOS = "obitos"             # int

# Colunas do CSV que precisamos
CSV_COLS = [
    "SG_UF",        # UF
    "ID_MN_RESI",   # IBGE município residência
    "DT_SIN_PRI",   # data início sintomas
    "EVOLUCAO",     # evolução: 2 geralmente é óbito
]

DTYPE = {
    "SG_UF": "string",
    "ID_MN_RESI": "Int64",
    "EVOLUCAO": "Int64",
}
PARSE_DATES = ["DT_SIN_PRI"]

# --- Conexão --------------------------------------------------------------
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

def prepara_destino():
    """Garante que a tabela existe com o esquema correto."""
    ddl = f"""
    CREATE TABLE IF NOT EXISTS {TABELA} (
        id BIGSERIAL PRIMARY KEY,
        {COL_DATA} DATE NOT NULL,
        {COL_UF} VARCHAR(2) NOT NULL,
        {COL_MUN} INTEGER NOT NULL,
        {COL_CASOS} INTEGER NOT NULL,
        {COL_OBITOS} INTEGER NOT NULL
    );
    """
    with engine.begin() as conn:
        conn.execute(text(ddl))

def processa_chunk(df: pd.DataFrame) -> pd.DataFrame:
    """Limpa, agrega e retorna dataframe pronto para inserir."""
    # manter apenas colunas necessárias
    df = df[CSV_COLS].copy()

    # normalizações
    # datas já vêm parseadas; drop linhas sem data/uf/mun
    df = df.dropna(subset=["DT_SIN_PRI", "SG_UF", "ID_MN_RESI"])

    # garantir tipos
    df["SG_UF"] = df["SG_UF"].astype(str).str.strip().str.upper()
    df["ID_MN_RESI"] = df["ID_MN_RESI"].astype("Int64")

    # obito: evolução == 2
    obito_mask = df["EVOLUCAO"].fillna(0).astype("Int64") == 2

    # agrega por dia/uf/mun
    grp = df.groupby(
        [df["DT_SIN_PRI"].dt.date, "SG_UF", "ID_MN_RESI"], dropna=False
    )

    out = grp.size().reset_index(name=COL_CASOS)
    out[COL_OBITOS] = grp.apply(lambda g: (g["EVOLUCAO"].fillna(0).astype("Int64") == 2).sum()).values

    # renomeia colunas para destino
    out = out.rename(
        columns={
            "DT_SIN_PRI": COL_DATA,
            "SG_UF": COL_UF,
            "ID_MN_RESI": COL_MUN,
        }
    )

    # cast final
    out[COL_MUN] = out[COL_MUN].astype("int64")
    out[COL_CASOS] = out[COL_CASOS].astype("int64")
    out[COL_OBITOS] = out[COL_OBITOS].astype("int64")

    return out[[COL_DATA, COL_UF, COL_MUN, COL_CASOS, COL_OBITOS]]

def insere_df(df_out: pd.DataFrame):
    """Insere em lote usando COPY (to_sql)"""
    if df_out.empty:
        return
    df_out.to_sql(
        TABELA, engine, index=False, if_exists="append", method="multi", chunksize=10000
    )

def main():
    print(f"[ETL] Lendo CSV: {CSV_PATH}")
    prepara_destino()

    total_linhas = NROWS
    lidas = 0

    reader = pd.read_csv(
        CSV_PATH,
        usecols=lambda c: c in CSV_COLS,
        dtype=DTYPE,
        parse_dates=PARSE_DATES,
        dayfirst=False,
        infer_datetime_format=True,
        encoding="utf-8",
        sep=",",
        chunksize=CHUNK,
        low_memory=False,
        nrows=total_linhas,
    )

    for i, chunk in enumerate(reader, start=1):
        lidas += len(chunk)
        print(f"[ETL] Chunk {i} (+{len(chunk)} linhas) — total lidas: {lidas}")
        df_out = processa_chunk(chunk)
        insere_df(df_out)

    print("[ETL] Concluído.")

if __name__ == "__main__":
    main()