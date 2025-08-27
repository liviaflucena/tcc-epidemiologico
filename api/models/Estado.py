from helpers.database import Base
from sqlalchemy import Column, Integer, String

class Estado(Base):
    __tablename__ = "estados"

    id = Column(Integer, primary_key=True)
    uf = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    ibge_id = Column(Integer, nullable=False)