CREATE TABLE IF NOT EXISTS estados (
    uf VARCHAR(2) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ibge_id INTEGER UNIQUE NOT NULL
);

INSERT INTO estados (uf, nome, ibge_id) VALUES
    ('AC', 'Acre', 12),
    ('AL', 'Alagoas', 27),
    ('AM', 'Amazonas', 13),
    ('AP', 'Amapá', 16),
    ('BA', 'Bahia', 29),
    ('CE', 'Ceará', 23),
    ('DF', 'Distrito Federal', 53),
    ('ES', 'Espírito Santo', 32),
    ('GO', 'Goiás', 52),
    ('MA', 'Maranhão', 21),
    ('MG', 'Minas Gerais', 31),
    ('MS', 'Mato Grosso do Sul', 50),
    ('MT', 'Mato Grosso', 51),
    ('PA', 'Pará', 15),
    ('PB', 'Paraíba', 25),
    ('PE', 'Pernambuco', 26),
    ('PI', 'Piauí', 22),
    ('PR', 'Paraná', 41),
    ('RJ', 'Rio de Janeiro', 33),
    ('RN', 'Rio Grande do Norte', 24),
    ('RO', 'Rondônia', 11),
    ('RR', 'Roraima', 14),
    ('RS', 'Rio Grande do Sul', 43),
    ('SC', 'Santa Catarina', 42),
    ('SE', 'Sergipe', 28),
    ('SP', 'São Paulo', 35),
    ('TO', 'Tocantins', 17)
ON CONFLICT (ibge_id) DO NOTHING;