from collections import Counter
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cartucho import Cartucho
from app.schemas.cartucho import CartuchoRead, CartuchoSaveItem, CartuchoSaveRequest

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
    incoming_ids = [item.id for item in payload.items if item.id is not None]
    if len(incoming_ids) != len(set(incoming_ids)) or set(incoming_ids) != set(by_id):
        raise HTTPException(status_code=400, detail="El listado no coincide con los cartuchos guardados.")
    if len({item.orden for item in payload.items}) != len(payload.items):
        raise HTTPException(status_code=400, detail="Hay números de orden repetidos.")
    _rechazar_numeros_repetidos(rows, payload.items)

    for offset, item in enumerate(payload.items, start=1):
        if item.id is not None:
            by_id[item.id].orden = -offset
    db.flush()

    ordered: list[Cartucho] = []
    for offset, item in enumerate(payload.items, start=1):
        precio = None if item.precio is None else Decimal(f"{item.precio:.2f}")
        if item.id is None:
            row = Cartucho(
                numero=item.numero,
                descripcion=item.descripcion,
                precio=precio,
                orden=-(len(payload.items) + offset),
            )
            db.add(row)
        else:
            row = by_id[item.id]
            row.numero = item.numero
            row.descripcion = item.descripcion
            row.precio = precio
        ordered.append(row)
    db.flush()

    for item, row in zip(payload.items, ordered, strict=True):
        row.orden = item.orden
    db.commit()

    saved = db.scalars(select(Cartucho).order_by(Cartucho.orden.asc(), Cartucho.id.asc())).all()
    return [_read(row) for row in saved]


def _rechazar_numeros_repetidos(rows: list[Cartucho], items: list[CartuchoSaveItem]) -> None:
    """Una fila nueva no puede usar un número que ya esté. Los repetidos que ya había se conservan."""
    actuales = Counter(row.numero for row in rows)
    propuesta = Counter(item.numero for item in items)
    for numero, veces in propuesta.items():
        if veces > max(actuales[numero], 1):
            raise HTTPException(status_code=400, detail=f"El número {numero} ya está en el listado.")


def _read(row: Cartucho) -> CartuchoRead:
    return CartuchoRead(
        id=row.id,
        numero=row.numero,
        descripcion=row.descripcion,
        precio=None if row.precio is None else float(row.precio),
        orden=row.orden,
    )
