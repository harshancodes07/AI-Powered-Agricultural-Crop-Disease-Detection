"""FastAPI backend — the centre of the platform.

Responsibilities: validation, image storage, database access, calling the ML
microservice, verified treatment lookup, offline sync and dashboard data.

Run it with:
    uvicorn app.main:app --reload --port 8000
Interactive API docs: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import dashboard, reports
from app.core.config import settings
from app.database.seed import ensure_schema, seed
from app.database.session import SessionLocal
from app.services import ml_client

# Importing the models module registers every table on Base.metadata.
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and refresh reference data on startup.
    # NOTE: an MVP shortcut. A real deployment uses Alembic migrations. The
    # reference tables (diseases, treatments) are rebuilt from source each time,
    # which is safe because no report points at them by foreign key.
    ensure_schema()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Agri-AI Crop Disease Platform API",
    description=(
        "Backend for crop disease reporting, verified treatment lookup, offline "
        "synchronisation and geospatial monitoring."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Local dev + LAN testing, plus a Vercel-hosted frontend pointed at
    # this backend (see frontend VITE_API_URL / DEPLOY.md). *.vercel.app
    # covers both the stable project domain and per-deploy preview URLs.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+|https://[a-zA-Z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)
app.include_router(dashboard.router)

# Serve uploaded crop images. The database stores only these paths, never bytes.
settings.storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.storage_dir), name="uploads")


@app.get("/api/health", tags=["health"])
async def health() -> dict:
    """Reports backend health and whether AI inference is currently available.

    The frontend uses `ml_service.available` to warn the farmer honestly instead
    of silently failing.
    """
    try:
        ml = await ml_client.health()
        ml_status = {"available": True, **ml}
    except ml_client.MLServiceError as exc:
        ml_status = {"available": False, "error": str(exc)}

    return {
        "status": "ok",
        "database": "postgres+postgis" if settings.is_postgres else "sqlite",
        "ml_service": ml_status,
    }
