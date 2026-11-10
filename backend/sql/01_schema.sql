-- Conectar a la base `coleccion_cartuchos` y ejecutar.

CREATE TABLE IF NOT EXISTS cartucho (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero      TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio      NUMERIC(10, 2),
    orden       INTEGER NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_cartucho_numero ON cartucho (numero);

COMMENT ON TABLE cartucho IS 'Colección de cartuchos. numero es el código del listado (15.10, 96*); orden es el orden del Excel.';
COMMENT ON COLUMN cartucho.precio IS 'Precio opcional. NULL si todavía no se ha apuntado.';
