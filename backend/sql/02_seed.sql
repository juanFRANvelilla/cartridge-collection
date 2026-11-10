-- Tres filas para probar. El precio de 15.10 es un ejemplo; el Excel no lo trae.
-- Ejecutar una vez, conectado a coleccion_cartuchos.

INSERT INTO cartucho (numero, descripcion, precio, orden) VALUES
    ('1', '22 Rem.', NULL, 1),
    ('15.10', '9 x 19 Parabellum plástico fogueo', 4.50, 2),
    ('96*', '7,62 x 51 CETME CSP-003', NULL, 3)
ON CONFLICT (orden) DO NOTHING;
