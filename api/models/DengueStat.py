from sqlalchemy import Column, Integer, String, Date
from helpers.database import Base

class DengueStat(Base):
    _tablename_ = "dengue_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data_referencia = Column(Date, nullable=False)          # era ref_date
    uf = Column(String, nullable=False)
    municipio_ibge_id = Column(Integer, nullable=True)
    casos = Column(Integer, nullable=True)                  # era cases
    obitos = Column(Integer, nullable=True)                 # era deaths