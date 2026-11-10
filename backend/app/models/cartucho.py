from decimal import Decimal
from uuid import UUID

from sqlalchemy import Integer, Numeric, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Cartucho(Base):
    __tablename__ = "cartucho"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    numero: Mapped[str] = mapped_column(Text, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    precio: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
