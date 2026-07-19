from sqlalchemy import Column, Integer, String, Text
from .conexao import Base

class Relato(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=False)
    latitude = Column(String(50), nullable=False)
    longitude = Column(String(50), nullable=False)
    dataCriacao = Column("dataCriacao", String(20), nullable=False)
    status = Column(String(50), nullable=False, default="Pendente")