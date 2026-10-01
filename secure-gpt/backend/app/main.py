# backend/app/main.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI application entrypoint.
# ─────────────────────────────────────────────────────────────────────────────

import time
import secrets
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.error_handlers import register_error_handlers
from app.core.ratelimit import limiter
from app.core.response import error as make_error
from app.core.logging import setup_logging, set_request_id, get_request_id
from app.api.v1.router import api_router

import app.models  # noqa: F401

setup_logging(settings)
logger = logging.getLogger(__name__)
http_logger = logging.getLogger("http")


from app.core.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s [%s]", settings.app_name, settings.app_env)
    async with engine.begin() as conn:
        # Create any missing tables safely
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new schema columns exist on previously created tables
        from sqlalchemy import text
        await conn.execute(
            text("ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS impersonator_id VARCHAR")
        )
        await conn.execute(
            text("ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS previous_session_id VARCHAR(64)")
        )
        await conn.execute(
            text("ALTER TABLE IF EXISTS impersonation_handoffs ADD COLUMN IF NOT EXISTS org_id VARCHAR")
        )
        if settings.app_env == "development":
            # Auto-ensure super admin test accounts are marked SUPER_ADMIN
            await conn.execute(
                text("UPDATE users SET role = 'SUPER_ADMIN'::userrole WHERE email IN ('admin@superadmin.com', 'superadmin@blackvector.online')")
            )
        logger.info("Database tables and columns verified/synced")

    yield
    await engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
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

@app.middleware("http")
async def request_logging_and_correlation_middleware(request: Request, call_next):
    # Extract existing X-Request-ID or generate new 12-char hex ID
    incoming_req_id = request.headers.get("x-request-id")
    req_id = incoming_req_id if incoming_req_id else secrets.token_hex(6)
    set_request_id(req_id)
    request.state.request_id = req_id

    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id

        http_logger.info(
            "method=%s path=%s status=%d duration_ms=%.2f",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        http_logger.error(
            "method=%s path=%s error=%s duration_ms=%.2f",
            request.method,
            request.url.path,
            str(exc),
            duration_ms,
        )
        raise
    finally:
        set_request_id(None)

# Custom CORS handler for Chrome Extensions
@app.middleware("http")
async def extension_cors_interceptor(request: Request, call_next):
    origin = request.headers.get("origin")
    # Allow approved chrome extensions to communicate with the API
    if origin and origin.startswith("chrome-extension://"):
        # In dev mode, allow any local extension; in production, strictly enforce allowlisted IDs
        is_allowed = settings.debug or (origin in settings.allowed_extension_origins)
        if not is_allowed:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content=make_error(
                    code="FORBIDDEN_ORIGIN",
                    message="Origin not permitted",
                ),
            )

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
        "portal_mode": settings.portal_mode,
        "version": settings.app_version,
    }
