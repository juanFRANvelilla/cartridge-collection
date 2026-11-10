from decimal import Decimal

from sqlalchemy import Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Cartucho(Base):
    __tablename__ = "cartucho"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    numero: Mapped[str] = mapped_column(Text, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    precio: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
