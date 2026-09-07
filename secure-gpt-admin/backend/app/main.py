# backend/app/main.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI application entrypoint.
# ─────────────────────────────────────────────────────────────────────────────

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.error_handlers import register_error_handlers
from app.core.ratelimit import limiter
from app.core.response import error as make_error
from app.api.v1.router import api_router

import app.models  # noqa: F401

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s [%s]", settings.app_name, settings.app_env)
    async with engine.begin() as conn:
        if settings.debug:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables synced (dev mode)")
        else:
            # Ensure newly added tables and columns exist in production
            await conn.run_sync(Base.metadata.create_all)
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivation_reason VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pre_deletion_email_sent BOOLEAN DEFAULT FALSE;"))
    yield
    await engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="DLP Shield — Data Loss Prevention API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ─── Rate limiter ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=429,
        content=make_error(
            code="RATE_LIMITED",
            message="Too many requests. Please slow down.",
            details={"retry_after": str(exc.retry_after) if hasattr(exc, "retry_after") else "60"},
        ),
    )

# ─── Middleware ───────────────────────────────────────────────────────────────

# Custom CORS handler for Chrome Extensions
@app.middleware("http")
async def extension_cors_interceptor(request, call_next):
    origin = request.headers.get("origin")
    # Allow chrome extensions to communicate with the API in both dev and prod
    if origin and origin.startswith("chrome-extension://"):
        if request.method == "OPTIONS":
            from fastapi.responses import Response
            response = Response(status_code=200)
        else:
            response = await call_next(request)
            
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# ─── Error handlers ───────────────────────────────────────────────────────────
register_error_handlers(app)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["meta"])
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": "1.0.0",
    }