from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CartuchoRead(BaseModel):
    id: UUID
    numero: str
    descripcion: str
    precio: float | None
    orden: int

    model_config = ConfigDict(from_attributes=True)


class CartuchoSaveItem(BaseModel):
    id: UUID
    numero: str
    descripcion: str
    precio: float | None = None
    orden: int = Field(ge=1)

    @field_validator("numero", "descripcion")
    @classmethod
    def obligatorio(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("El número y la descripción son obligatorios.")
        return text

    @field_validator("precio")
    @classmethod
    def precio_valido(cls, value: float | None) -> float | None:
        if value is None:
            return None
        if value < 0:
            raise ValueError("El precio no puede ser negativo.")
        return round(value, 2)


class CartuchoSaveRequest(BaseModel):
    items: list[CartuchoSaveItem]
