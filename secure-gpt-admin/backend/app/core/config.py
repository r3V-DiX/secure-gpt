# backend/app/core/config.py
# ─────────────────────────────────────────────────────────────────────────────
# Application configuration loaded from environment variables / .env file.
# Sensitive fields have NO defaults — app will FAIL FAST at startup if they
# are missing, rather than silently running with insecure placeholder values.
# ─────────────────────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────────
    # Non-sensitive — safe defaults are fine here
    app_name: str = "DLP Shield"
    app_env: str = "development"
    debug: bool = False

    # SENSITIVE — no default, must be set in .env
    secret_key: str = Field(..., min_length=32)

    # ── Database ───────────────────────────────────────────────────────────────
    # SENSITIVE — no default, must be set in .env
    database_url: str = Field(...)

    # ── Session ────────────────────────────────────────────────────────────────
    # SENSITIVE — no default, must be set in .env
    session_secret_key: str = Field(..., min_length=32)
    session_max_age: int = 86400  # 24 hours in seconds — safe default

    # ── Google OAuth ───────────────────────────────────────────────────────────
    # SENSITIVE — no default, must be set in .env
    google_client_id: str = Field(...)
    google_client_secret: str = Field(...)

    # Non-sensitive — default is fine for local dev
    google_redirect_uri: str = Field(...)
    
    # ── CORS ───────────────────────────────────────────────────────────────────
    # Non-sensitive — default covers local dev
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["http://localhost:3000", "http://localhost:3001"]
            if v.startswith("["):
                import json
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    # ── API ────────────────────────────────────────────────────────────────────
    api_v1_prefix: str = "/api/v1"

    # ── Rate limiting ──────────────────────────────────────────────────────────
    rate_limit_enabled: bool = True

    # ── Computed properties ────────────────────────────────────────────────────
    @property
    def allowed_origins_list(self) -> list[str]:
        return self.allowed_origins

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def frontend_url(self) -> str:
        return self.allowed_origins_list[0]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()