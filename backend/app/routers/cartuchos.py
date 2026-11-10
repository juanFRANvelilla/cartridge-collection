from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cartucho import Cartucho
from app.schemas.cartucho import CartuchoRead

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
    return [
        CartuchoRead(
            id=row.id,
            numero=row.numero,
            descripcion=row.descripcion,
            precio=None if row.precio is None else float(row.precio),
            orden=row.orden,
        )
        for row in rows
    ]
