import hashlib
import os 
import boto3
from typing import Optional, List

from fastapi import Depends, FastAPI, HTTPException, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx 
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime

from src.database.conexao import Base, engine, get_db
from src.database.models import Usuario, Relato, Apoio, Comentario
import src.repositorios.relato_repositorio as repositorio

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CONFIG AWS S3 


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


class StatusAtualizarSchema(BaseModel):
    status: str


class ObservacaoAdminSchema(BaseModel):
    observacao_admin: str


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
    relatos = repositorio.obter_todos(db)
    resultado = []
    
    for r in relatos:
        relato_id = r["id"] if isinstance(r, dict) else r.id
        
        total_apoios = db.query(Apoio).filter(Apoio.relato_id == relato_id).count()
        
        if isinstance(r, dict):
            extras = r.get("fotos_extras", "").split(",") if r.get("fotos_extras") else []
            resultado.append({
                "id": r.get("id"),
                "categoria": r.get("categoria"),
                "descricao": r.get("descricao"),
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
                "dataCriacao": r.get("dataCriacao", "22/08/2026"),
                "status": r.get("status"),
                "foto": r.get("foto"),
                "fotos": extras,
                "usuario_nome": r.get("usuario_nome", "Anônimo") or "Anônimo",
                "observacao_admin": r.get("observacao_admin"),
                "totalCurtidas": total_apoios
            })
        else:
            extras = r.fotos_extras.split(",") if r.fotos_extras else []
            resultado.append({
                "id": r.id,
                "categoria": r.categoria,
                "descricao": r.descricao,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "dataCriacao": getattr(r, 'dataCriacao', '22/08/2026'),
                "status": r.status,
                "foto": r.foto,
                "fotos": extras,
                "usuario_nome": getattr(r, 'usuario_nome', 'Anônimo') or 'Anônimo',
                "observacao_admin": getattr(r, 'observacao_admin', None),
                "totalCurtidas": total_apoios
            })
        
    return resultado

@app.post("/api/relatos", status_code=201)
async def cadastrar_novo_relato(
    categoria: str = Form(...),
    descricao: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    usuario_nome: str = Form("Anônimo"),
    fotos: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    urls_fotos = []

    if fotos:
        for foto in fotos:
            nome_arquivo = f"relatos/{foto.filename}"
            try:
                s3_client.upload_fileobj(
                    foto.file,
                    S3_BUCKET_NAME,
                    nome_arquivo,
                    ExtraArgs={"ContentType": foto.content_type}
                )
                url_publica = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{nome_arquivo}"
                urls_fotos.append(url_publica)
            except Exception as e:
                print(f"Erro ao enviar arquivo para o S3: {e}")

    
    primeira_foto = urls_fotos[0] if urls_fotos else None

    string_fotos_extras = ",".join(urls_fotos) if urls_fotos else None

    return repositorio.criar(
        db=db,
        categoria=categoria,
        descricao=descricao,
        latitude=latitude,
        longitude=longitude,
        foto=primeira_foto, 
        fotos_extras=string_fotos_extras,
        usuario_nome=usuario_nome,
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


class ComentarioCriarSchema(BaseModel):
    texto: str
    usuario_id: int

@app.post("/api/relatos/{relato_id}/comentarios", status_code=201)
def criar_comentario(relato_id: int, dados: ComentarioCriarSchema, db: Session = Depends(get_db)):
    relato = db.query(Relato).filter(Relato.id == relato_id).first()
    if not relato:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    
    usuario = db.query(Usuario).filter(Usuario.id == dados.usuario_id).first()
    nome_usuario = usuario.nome if usuario else "Usuário"

    data_atual = datetime.now().strftime('%d/%m/%Y')

    novo_comentario = Comentario(
        texto=dados.texto,
        dataCriacao=data_atual,
        relato_id=relato_id,
        usuario_id=dados.usuario_id
    )
    db.add(novo_comentario)
    db.commit()
    db.refresh(novo_comentario)

    return {
        "id": novo_comentario.id,
        "texto": novo_comentario.texto,
        "usuario_nome": nome_usuario,
        "dataCriacao": novo_comentario.dataCriacao
    }


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
    id: int, dados: RelatoCriarSchema, db: Session = Depends(get_db)
):
    relato_atualizado = repositorio.atualizar_completo(db, id, dados)
    if not relato_atualizado:
        raise HTTPException(
            status_code=404, detail="Ocorrência não encontrada."
        )
    return {"message": "Ocorrência atualizada com sucesso!"}

@app.get("/api/relatos/{id}")
def buscar_relato_por_id(id: int, usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    r = repositorio.obter_por_id(db, id)
    if not r:
        raise HTTPException(
            status_code=404, detail="Ocorrência não encontrada."
        )
    
    relato_id = r["id"] if isinstance(r, dict) else r.id
    
    total_apoios = db.query(Apoio).filter(Apoio.relato_id == relato_id).count()

    comentarios_db = db.query(Comentario, Usuario.nome).join(Usuario, Comentario.usuario_id == Usuario.id).filter(Comentario.relato_id == relato_id).all()

    lista_comentarios = [
        {
            "id": c.Comentario.id,
            "texto": c.Comentario.texto,
            "usuario_nome": c.nome,
            "dataCriacao": c.Comentario.dataCriacao
        } for c in comentarios_db
    ]

    if isinstance(r, dict):
        extras = r.get("fotos_extras", "").split(",") if r.get("fotos_extras") else []
        ja_curtiu = False
        if usuario_id:
            apoio = db.query(Apoio).filter(Apoio.relato_id == relato_id, Apoio.usuario_id == usuario_id).first()
            ja_curtiu = apoio is not None
            
        return {
            "id": r.get("id"),
            "categoria": r.get("categoria"),
            "descricao": r.get("descricao"),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "dataCriacao": r.get("dataCriacao", "22/08/2026"),
            "status": r.get("status"),
            "foto": r.get("foto"),
            "fotos": extras,
            "usuario_nome": r.get("usuario_nome", "Anônimo") or "Anônimo",
            "observacao_admin": r.get("observacao_admin"),
            "totalCurtidas": total_apoios,
            "curtido": ja_curtiu,
            "comentarios": lista_comentarios
        }
    else:
        extras = r.fotos_extras.split(",") if r.fotos_extras else []
        ja_curtiu = False
        if usuario_id:
            apoio = db.query(Apoio).filter(Apoio.relato_id == id, Apoio.usuario_id == usuario_id).first()
            ja_curtiu = apoio is not None

        return {
            "id": r.id,
            "categoria": r.categoria,
            "descricao": r.descricao,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "dataCriacao": getattr(r, 'dataCriacao', '22/08/2026'),
            "status": r.status,
            "foto": r.foto,
            "fotos": extras,
            "usuario_nome": getattr(r, 'usuario_nome', 'Anônimo') or 'Anônimo',
            "observacao_admin": getattr(r, 'observacao_admin', None),
            "totalCurtidas": total_apoios,
            "curtido": ja_curtiu,
            "comentarios": lista_comentarios
        }
    
class CurtirSchema(BaseModel):
    usuario_id: int

@app.post("/api/relatos/{id}/curtir")
def curtir_relato(id: int, dados: CurtirSchema, db: Session = Depends(get_db)):
    r = repositorio.obter_por_id(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    
    apoio_existente = db.query(Apoio).filter(
        Apoio.relato_id == id, 
        Apoio.usuario_id == dados.usuario_id
    ).first()
    
    total_atual = r.totalCurtidas if r.totalCurtidas is not None else 0
    
    if apoio_existente:
        db.delete(apoio_existente)
        novo_total = max(0, total_atual - 1)
        ja_curtiu = False
    else:
        novo_apoio = Apoio(usuario_id=dados.usuario_id, relato_id=id)
        db.add(novo_apoio)
        novo_total = total_atual + 1
        ja_curtiu = True
        
    r.totalCurtidas = novo_total
    db.commit()
    db.refresh(r)
    
    return {
        "sucesso": True,
        "totalCurtidas": r.totalCurtidas,
        "curtido": ja_curtiu
    }

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