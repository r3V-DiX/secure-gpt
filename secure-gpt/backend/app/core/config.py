# backend/app/core/config.py
# ─────────────────────────────────────────────────────────────────────────────
# Application configuration loaded from environment variables / .env file.
# Sensitive fields have NO defaults — app will FAIL FAST at startup if they
# are missing, rather than silently running with insecure placeholder values.
# ─────────────────────────────────────────────────────────────────────────────

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    app_version: str = "1.1.5"
    git_commit: str = "unknown"
    build_time: str = "unknown"

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

    # ── Microsoft Entra ID (Azure AD) OAuth ───────────────────────────────────
    microsoft_client_id: str | None = None
    microsoft_client_secret: str | None = None
    microsoft_tenant_id: str = "common"
    microsoft_redirect_uri: str = "http://localhost:8000/api/v1/auth/microsoft/callback"
    
    # ── CORS ───────────────────────────────────────────────────────────────────
    # Non-sensitive — default covers local dev
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"
    allowed_extension_ids: str = ""  # Comma-separated Chrome Extension IDs

    # ── API ────────────────────────────────────────────────────────────────────
    api_v1_prefix: str = "/api/v1"

    # ── Rate limiting ──────────────────────────────────────────────────────────
    rate_limit_enabled: bool = True

    # ── Computed properties ────────────────────────────────────────────────────
    @property
    def allowed_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",")]
        
        # In development, automatically allow any chrome-extension origin
        # This prevents breakage when developers reload the extension and get a new ID
        if self.app_env == "development":
            # We can't use wildcards in allow_origins with allow_credentials=True
            # But the CORSMiddleware will check against this list.
            # However, Chrome Extension IDs are fixed unless changed in manifest.
            # For local dev, common practice is to allow a few or dynamically handle it.
            # Since we can't easily dynamic-inject here without custom middleware,
            # we'll rely on the user adding their specific ID to .env if it changes,
            # but we'll add a helper to ensure it's easy to debug.
            pass
            
        return origins

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def allowed_extension_origins(self) -> set[str]:
        if not self.allowed_extension_ids:
            return set()
        return {f"chrome-extension://{ext_id.strip()}" for ext_id in self.allowed_extension_ids.split(",") if ext_id.strip()}

    @property
    def frontend_url(self) -> str:
        return self.allowed_origins_list[0]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()