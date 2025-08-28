CREATE INDEX idx_dengue_stats_data ON dengue_stats(data_referencia);
CREATE INDEX idx_dengue_stats_uf ON dengue_stats(uf);
CREATE INDEX idx_dengue_stats_municipio ON dengue_stats(municipio_ibge_id);