-- Conectar a coleccion_cartuchos. Pasa el id de entero a UUID.
-- Las filas que ya existen reciben un UUID nuevo.

ALTER TABLE cartucho ALTER COLUMN id DROP IDENTITY;

ALTER TABLE cartucho
    ALTER COLUMN id TYPE UUID USING gen_random_uuid();

ALTER TABLE cartucho
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
