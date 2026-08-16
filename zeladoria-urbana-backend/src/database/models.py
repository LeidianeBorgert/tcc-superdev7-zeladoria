from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .conexao import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="USER") 


class Relato(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=False)
    latitude = Column(String(50), nullable=False)
    longitude = Column(String(50), nullable=False)
    dataCriacao = Column("dataCriacao", String(20), nullable=False)
    status = Column(String(50), nullable=False, default="Pendente")
    foto = Column(String, nullable=True)
    usuario_nome = Column(String, nullable=True, default="Anônimo")
    
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)