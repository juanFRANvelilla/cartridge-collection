from pydantic import BaseModel, ConfigDict


class CartuchoRead(BaseModel):
    id: int
    numero: str
    descripcion: str
    precio: float | None
    orden: int

    model_config = ConfigDict(from_attributes=True)
