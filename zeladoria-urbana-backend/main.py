from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  
from sqlalchemy.orm import Session
from pydantic import BaseModel

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