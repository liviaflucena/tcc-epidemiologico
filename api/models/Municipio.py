from helpers.database import Base
from sqlalchemy import Column, Integer, String

class Municipio(Base):
    __tablename__ = "municipios"

    ibge_id = Column(Integer, primary_key=True)
    uf      = Column(String(2), nullable=False)