CREATE TABLE dengue_stats (
    id BIGSERIAL PRIMARY KEY,
    data_referencia DATE NOT NULL,
    uf VARCHAR(2) NOT NULL,
    municipio_ibge_id INT,
    casos INT DEFAULT 0,
    obitos INT DEFAULT 0
);

COMMENT ON COLUMN dengue_stats.data_referencia IS 'Data de referência (semana/ano ou data de notificação)';
COMMENT ON COLUMN dengue_stats.uf IS 'Sigla da unidade federativa';
COMMENT ON COLUMN dengue_stats.municipio_ibge_id IS 'Código IBGE do município';
COMMENT ON COLUMN dengue_stats.casos IS 'Número de casos de dengue';
COMMENT ON COLUMN dengue_stats.obitos IS 'Número de óbitos';