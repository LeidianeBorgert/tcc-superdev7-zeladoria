import hashlib
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from src.database.conexao import engine, Base, get_db
import src.repositorios.relato_repositorio as repositorio


Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  
    allow_credentials=True,
    allow_methods=["*"],                      
    allow_headers=["*"],                      
)


class RelatoCriarSchema(BaseModel):
    categoria: str
    descricao: str
    latitude: str
    longitude: str

class StatusAtualizarSchema(BaseModel):
    status: str

class UsuarioCadastroSchema(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class UsuarioLoginSchema(BaseModel):
    email: EmailStr
    senha: str


def hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode('utf-8')).hexdigest()


# LISTA
@app.get("/api/relatos")
def listar_todos_relatos(db: Session = Depends(get_db)):
    return repositorio.obter_todos(db)

#CADASTRO 
@app.post("/api/relatos", status_code=201)
def cadastrar_novo_relato(dados: RelatoCriarSchema, db: Session = Depends(get_db)):
    return repositorio.criar(
        db, 
        dados.categoria, 
        dados.descricao, 
        dados.latitude, 
        dados.longitude
    )

# ATUALIZA STATUS
@app.put("/api/relatos/{id}/status")
def mudar_status_relato(id: int, dados: StatusAtualizarSchema, db: Session = Depends(get_db)):
    relato_atualizado = repositorio.atualizar_status(db, id, dados.status)
    if not relato_atualizado:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return {"message": "Status atualizado com sucesso!"}

@app.post("/api/usuarios/cadastro", status_code=201)
def cadastrar_usuario(dados: UsuarioCadastroSchema, db: Session = Depends(get_db)):
    senha_criptografada = hash_senha(dados.senha)
    usuario_existente = getattr(repositorio, "obter_usuario_por_email", lambda d, e: None)(db, dados.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    if hasattr(repositorio, "criar_usuario"):
        return repositorio.criar_usuario(db, dados.nome, dados.email, senha_criptografada)
    return {"message": "Usuário cadastrado com sucesso!"}

@app.post("/api/usuarios/login")
def login_usuario(dados: UsuarioLoginSchema, db: Session = Depends(get_db)):
    senha_criptografada = hash_senha(dados.senha)
    usuario = getattr(repositorio, "autenticar_usuario", lambda d, e, s: None)(db, dados.email, senha_criptografada)
    if not usuario:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    return {
        "id": getattr(usuario, "id", 1),
        "nome": getattr(usuario, "nome", ""),
        "email": getattr(usuario, "email", dados.email),
        "perfil": getattr(usuario, "perfil", "cidadao")
    }