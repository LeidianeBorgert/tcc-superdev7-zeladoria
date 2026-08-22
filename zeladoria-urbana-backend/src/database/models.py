from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, UniqueConstraint
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
    fotos_extras = Column(Text, nullable=True)
    usuario_nome = Column(String, nullable=True, default="Anônimo")
    totalCurtidas = Column(Integer, default=0)
    curtido = Column(Boolean, default=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

class Apoio(Base):
    __tablename__ = "apoios"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    relato_id = Column(Integer, ForeignKey("ocorrencias.id"))
    
    __table_args__ = (UniqueConstraint('usuario_id', 'relato_id', name='_usuario_relato_uc'),)

class Comentario(Base):
    __tablename__ = "comentarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    texto = Column(Text, nullable=False)
    dataCriacao = Column(String(20), nullable=False)
    relato_id = Column(Integer, ForeignKey("ocorrencias.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)