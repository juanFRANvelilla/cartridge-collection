# Colección de cartuchos

Listado del Excel de cartuchos. El front muestra las filas por `orden` y busca por número o descripción. Solo hay entorno de pre.

## Base de datos

1. Conectado a `postgres`, ejecuta `backend/sql/00_create_database.sql`.
2. Conectado a `coleccion_cartuchos`, ejecuta `backend/sql/01_schema.sql` y `backend/sql/02_seed.sql`.

## API en local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Carga `backend/env.example` si no existe `.env`. La URL apunta a `coleccion_cartuchos` en `db.postgres.local:30432`.

- Salud: http://127.0.0.1:8000/api/health
- Listado: http://127.0.0.1:8000/api/cartuchos
- Búsqueda: http://127.0.0.1:8000/api/cartuchos?q=parabellum
- Docs: http://127.0.0.1:8000/docs

## Front en local

En otra terminal, con la API ya arrancada:

```bash
cd frontend
npm start
```

Abre http://localhost:4200. El `proxy.conf.json` reenvía `/api` a `127.0.0.1:8000`.

## Kubernetes

Helm en `backend/k8s` y `frontend/k8s`, solo `values-pre.yaml`. Namespaces: `cartridge-catalog-back` y `cartridge-catalog-front`. El secreto `coleccion-cartuchos-secrets` del back debe tener `DATABASE_URL`. El gateway `lab` necesita el listener `https-cartuchos-pre` para `pre.cartuchos.juanfranciscoperez.es`. La pipeline compartida publica `ghcr.io/juanfranvelilla/cartridge-collection-backend` y `ghcr.io/juanfranvelilla/cartridge-collection-frontend`.
