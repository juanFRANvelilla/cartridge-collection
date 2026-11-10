from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cartucho import Cartucho
from app.schemas.cartucho import CartuchoRead, CartuchoSaveRequest

router = APIRouter(prefix="/api/cartuchos", tags=["cartuchos"])


def _like_pattern(term: str) -> str:
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@router.get("", response_model=list[CartuchoRead])
def list_cartuchos(q: str | None = None, db: Session = Depends(get_db)) -> list[CartuchoRead]:
    """Listado por orden del Excel. q busca en el número y en la descripción."""
    stmt = select(Cartucho)
    term = (q or "").strip()
    if term:
        pattern = _like_pattern(term)
        stmt = stmt.where(
            or_(
                Cartucho.numero.ilike(pattern, escape="\\"),
                Cartucho.descripcion.ilike(pattern, escape="\\"),
            )
        )
    rows = db.scalars(stmt.order_by(Cartucho.orden.asc(), Cartucho.id.asc())).all()
    return [_read(row) for row in rows]


@router.put("", response_model=list[CartuchoRead])
def save_cartuchos(payload: CartuchoSaveRequest, db: Session = Depends(get_db)) -> list[CartuchoRead]:
    """Guarda número, descripción, precio y orden de todo el listado."""
    rows = list(db.scalars(select(Cartucho)).all())
    by_id = {row.id: row for row in rows}
    incoming = {item.id for item in payload.items}
    if incoming != set(by_id):
        raise HTTPException(status_code=400, detail="El listado no coincide con los cartuchos guardados.")
    if len({item.orden for item in payload.items}) != len(payload.items):
        raise HTTPException(status_code=400, detail="Hay números de orden repetidos.")

    for offset, item in enumerate(payload.items, start=1):
        by_id[item.id].orden = -offset
    db.flush()

    for item in payload.items:
        row = by_id[item.id]
        row.numero = item.numero
        row.descripcion = item.descripcion
        row.precio = None if item.precio is None else Decimal(f"{item.precio:.2f}")
        row.orden = item.orden
    db.commit()

    saved = db.scalars(select(Cartucho).order_by(Cartucho.orden.asc(), Cartucho.id.asc())).all()
    return [_read(row) for row in saved]


def _read(row: Cartucho) -> CartuchoRead:
    return CartuchoRead(
        id=row.id,
        numero=row.numero,
        descripcion=row.descripcion,
        precio=None if row.precio is None else float(row.precio),
        orden=row.orden,
    )
