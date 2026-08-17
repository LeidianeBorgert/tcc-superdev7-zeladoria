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
            "status": r.status,
            "foto": r.foto,
            "usuario_nome": getattr(r, 'usuario_nome', 'Anônimo') or 'Anônimo'
        })
    return resultado

def criar(db: Session, categoria: str, descricao: str, latitude: str, 
          longitude: str, foto: str = None, usuario_nome: str = "Anônimo"):
    data_atual = datetime.now().strftime('%d/%m/%Y')
    novo_relato = Relato(
        categoria=categoria,
        descricao=descricao,
        latitude=latitude,
        longitude=longitude,
        dataCriacao=data_atual,
        status="Pendente",
        foto=foto,
        usuario_nome=usuario_nome if usuario_nome else "Anônimo"
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
        "status": novo_relato.status,
        "foto": novo_relato.foto,
        "usuario_nome": novo_relato.usuario_nome
    }

def atualizar_status(db: Session, id: int, novo_status: str):
    relato = db.query(Relato).filter(Relato.id == id).first()
    if relato:
        relato.status = novo_status
        db.commit()
        db.refresh(relato)
        return relato
    return None

def deletar(db: Session, id: int):
    relato = db.query(Relato).filter(Relato.id == id).first()
    if relato:
        db.delete(relato)
        db.commit()
        return True
    return False

def atualizar_completo(db: Session, id: int, dados):
    relato = db.query(Relato).filter(Relato.id == id).first()
    if relato:
        relato.categoria = dados.categoria
        relato.descricao = dados.descricao
        relato.latitude = dados.latitude
        relato.longitude = dados.longitude
        relato.foto = dados.foto
        relato.usuario_nome = dados.usuario_nome
        db.commit()
        db.refresh(relato)
        return relato
    return None