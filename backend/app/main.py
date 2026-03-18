# ─────────────────────────────────────────────
# SecureGPT Backend
# FastAPI application entry point
# ─────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import router as v1_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Startup / shutdown ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.APP_ENV}")

    # Create tables (use Alembic in production)
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created")

    yield

    # Shutdown
    logger.info("Shutting down...")


# ── App ───────────────────────────────────────
app = FastAPI(
    title="SecureGPT API",
    description="Enterprise DLP backend for SecureGPT browser extension",
    version=settings.APP_VERSION,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Trusted hosts (production) ────────────────
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["api.securegpt.app", "*.securegpt.app"],
    )

# ── Routes ────────────────────────────────────
app.include_router(v1_router)


# ── Health check ──────────────────────────────
@app.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/")
def root() -> dict:
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION}
