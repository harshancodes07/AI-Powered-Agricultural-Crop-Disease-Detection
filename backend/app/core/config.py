"""Application settings, loaded from environment variables / .env.

Nothing here is hard-coded to a paid service, and no secret has a real default.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Default to SQLite so the project runs with zero infrastructure.
    # Switch to the PostgreSQL+PostGIS URL in .env once Docker is up.
    DATABASE_URL: str = "sqlite:///./agri.db"

    ML_SERVICE_URL: str = "http://localhost:8001"
    STORAGE_PATH: str = "./uploads"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Reserved for authentication, which is not part of the MVP.
    JWT_SECRET: str = "change-me-before-any-real-deployment"

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env"),
        extra="ignore",
    )

    @property
    def is_postgres(self) -> bool:
        """PostGIS features are only available on PostgreSQL."""
        return self.DATABASE_URL.startswith("postgresql")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def storage_dir(self) -> Path:
        p = Path(self.STORAGE_PATH)
        return p if p.is_absolute() else (BACKEND_DIR.parent / p).resolve()


settings = Settings()
