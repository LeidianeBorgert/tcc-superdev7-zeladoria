import hashlib
import os  
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx  
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from src.database.conexao import Base, engine, get_db
from src.database.models import Usuario
import src.repositorios.relato_repositorio as repositorio

Base.metadata.create_all(bind=engine)

app = FastAPI()

if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
    foto: Optional[str] = None
    usuario_nome: Optional[str] = "Anônimo"


class RelatoEditarSchema(BaseModel):
    descricao: str


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
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()


def criar_admin_padrao():
    try:
        db = next(get_db())
        admin_existente = (
            db.query(Usuario)
            .filter(Usuario.email == "admin@zeladoria.com")
            .first()
        )

        if not admin_existente:
            novo_admin = Usuario(
                nome="Administrador",
                email="admin@zeladoria.com",
                senha=hash_senha("admin123"),
                role="ADMIN",
            )
            db.add(novo_admin)
            db.commit()
            print("Admin padrão criado: admin@zeladoria.com / admin123")
    except Exception as e:
        print(f"Aviso ao verificar admin: {e}")


criar_admin_padrao()



@app.get("/api/geocodificar-reversa")
async def geocodificar_reversa(lat: str, lon: str):
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}"
    headers = {"User-Agent": "ZeladoriaUrbanaApp/1.0"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            return response.json()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Erro ao buscar endereço: {e}"
            )


# LISTA
@app.get("/api/relatos")
def listar_todos_relatos(db: Session = Depends(get_db)):
    return repositorio.obter_todos(db)


# CADASTRO
@app.post("/api/relatos", status_code=201)
def cadastrar_novo_relato(
    dados: RelatoCriarSchema, db: Session = Depends(get_db)
):
    return repositorio.criar(
        db=db,
        categoria=dados.categoria,
        descricao=dados.descricao,
        latitude=dados.latitude,
        longitude=dados.longitude,
        foto=dados.foto,
        usuario_nome=dados.usuario_nome,
    )


# ATUALIZA STATUS
@app.put("/api/relatos/{id}/status")
def mudar_status_relato(
    id: int, dados: StatusAtualizarSchema, db: Session = Depends(get_db)
):
    relato_atualizado = repositorio.atualizar_status(db, id, dados.status)
    if not relato_atualizado:
        raise HTTPException(
            status_code=404, detail="Ocorrência não encontrada."
        )
    return {"message": "Status atualizado com sucesso!"}


# DELETA
@app.delete("/api/relatos/{id}")
def deletar_relato(id: int, db: Session = Depends(get_db)):
    sucesso = repositorio.deletar(db, id)
    if not sucesso:
        raise HTTPException(
            status_code=404, detail="Ocorrência não encontrada."
        )
    return {"message": "Ocorrência excluída com sucesso!"}


# EDITA
@app.put("/api/relatos/{id}")
def editar_relato(
    id: int, dados: RelatoEditarSchema, db: Session = Depends(get_db)
):
    relato_atualizado = repositorio.atualizar_descricao(
        db, id, dados.descricao
    )
    if not relato_atualizado:
        raise HTTPException(
            status_code=404, detail="Ocorrência não encontrada."
        )
    return {"message": "Ocorrência atualizada com sucesso!"}


@app.post("/api/usuarios/cadastro", status_code=201)
def cadastrar_usuario(
    dados: UsuarioCadastroSchema, db: Session = Depends(get_db)
):
    usuario_existente = (
        db.query(Usuario).filter(Usuario.email == dados.email).first()
    )
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    senha_hash = hash_senha(dados.senha)

    novo_usuario = Usuario(
        nome=dados.nome, email=dados.email, senha=senha_hash, role="USER"
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {"message": "Usuário cadastrado com sucesso!"}


@app.post("/api/usuarios/login")
def login_usuario(dados: UsuarioLoginSchema, db: Session = Depends(get_db)):
    senha_hash = hash_senha(dados.senha)

    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == dados.email, Usuario.senha == senha_hash)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=401, detail="E-mail ou senha incorretos."
        )

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "role": usuario.role,
    }