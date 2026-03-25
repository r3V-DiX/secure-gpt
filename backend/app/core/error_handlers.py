# backend/app/core/error_handlers.py
# ─────────────────────────────────────────────────────────────────────────────
# Global exception handlers registered on the FastAPI app.
# Nothing ever leaks a raw Python traceback to the client.
# ─────────────────────────────────────────────────────────────────────────────

import logging
import traceback

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.core.response import error

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    """Register all global error handlers on the FastAPI app."""

    # ── 1. Our custom AppException hierarchy ──────────────────────────────────
    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error(
                code=exc.code,
                message=exc.message,
                details=exc.details,
            ),
        )

    # ── 2. Pydantic / FastAPI request validation errors ───────────────────────
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Group field errors by field name
        field_errors: dict[str, list[str]] = {}
        for e in exc.errors():
            loc = e.get("loc", [])
            # Skip 'body' prefix
            field = ".".join(str(p) for p in loc if p != "body") or "request"
            field_errors.setdefault(field, []).append(e["msg"])

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                details=field_errors,
            ),
        )

    # ── 3. Starlette / FastAPI HTTPException ──────────────────────────────────
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        # Map common HTTP status codes to our error codes
        code_map = {
            400: "BAD_REQUEST",
            401: "AUTH_REQUIRED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "ALREADY_EXISTS",
            422: "VALIDATION_ERROR",
            429: "RATE_LIMITED",
            500: "INTERNAL_ERROR",
            503: "SERVICE_UNAVAILABLE",
        }
        code = code_map.get(exc.status_code, "INTERNAL_ERROR")
        return JSONResponse(
            status_code=exc.status_code,
            content=error(
                code=code,
                message=str(exc.detail),
            ),
        )

    # ── 4. Catch-all for unexpected exceptions ────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Always log the full traceback server-side
        logger.error(
            "Unhandled exception on %s %s\n%s",
            request.method,
            request.url.path,
            traceback.format_exc(),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred. Please try again later.",
            ),
        )