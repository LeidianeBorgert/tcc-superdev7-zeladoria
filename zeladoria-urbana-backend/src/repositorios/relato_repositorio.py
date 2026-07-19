from sqlalchemy.orm import Session
from src.database.models import Relato
from datetime import datetime

def obter_todos(db: Session):
    lista_relatos = db.query(Relato).order_by(Relato.id.desc()).all()
    
    resultado = []
    for r in lista_relatos:
        resultado.append({
            "id": r.id,
            "categoria": r.categoria,
            "descricao": r.descricao,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "dataCriacao": r.dataCriacao,  
            "status": r.status
        })
    return resultado

def criar(db: Session, categoria: str, descricao: str, latitude: str, longitude: str):
    data_atual = datetime.now().strftime('%d/%m/%Y')
    novo_relato = Relato(
        categoria=categoria,
        descricao=descricao,
        latitude=latitude,
        longitude=longitude,
        dataCriacao=data_atual,
        status="Pendente"
    )
    db.add(novo_relato)
    db.commit()
    db.refresh(novo_relato)
    
    return {
        "id": novo_relato.id,
        "categoria": novo_relato.categoria,
        "descricao": novo_relato.descricao,
        "latitude": novo_relato.latitude,
        "longitude": novo_relato.longitude,
        "dataCriacao": novo_relato.dataCriacao,
        "status": novo_relato.status
    }

def atualizar_status(db: Session, id: int, novo_status: str):
    relato = db.query(Relato).filter(Relato.id == id).first()
    if relato:
        relato.status = novo_status
        db.commit()
        db.refresh(relato)
        return relato
    return None