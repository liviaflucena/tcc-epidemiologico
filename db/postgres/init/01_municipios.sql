CREATE TABLE IF NOT EXISTS municipios (
  ibge_id   INTEGER PRIMARY KEY,   -- ex.: 2304400
  uf        VARCHAR(2) NOT NULL,   -- CE, PB, SP...
  nome      VARCHAR(120)           -- opcional (se não tivermos seed com nomes)
);

CREATE INDEX IF NOT EXISTS idx_municipios_uf ON municipios(uf);