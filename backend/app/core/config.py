# backend/app/core/config.py
# ─────────────────────────────────────────────────────────────────────────────
# Application configuration loaded from environment variables / .env file.
# ─────────────────────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────────
    app_name: str = "DLP Shield"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-this-secret-key"

    # ── Database ───────────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/dlp_shield"

    # ── Session ────────────────────────────────────────────────────────────────
    session_secret_key: str = "change-this-session-secret"
    session_max_age: int = 86400  # 24 hours

    # ── Google OAuth ───────────────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    # ── CORS ───────────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    # ── API ────────────────────────────────────────────────────────────────────
    api_v1_prefix: str = "/api/v1"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()