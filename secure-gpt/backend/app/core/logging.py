# backend/app/core/logging.py
# ─────────────────────────────────────────────────────────────────────────────
# Structured, de-duplicated logging configuration with request correlation.
# ─────────────────────────────────────────────────────────────────────────────

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

from app.core.config import Settings

# Context variable for holding current Request ID across async tasks
request_id_ctx: ContextVar[str | None] = ContextVar("request_id_ctx", default=None)


def get_request_id() -> str | None:
    return request_id_ctx.get()


def set_request_id(req_id: str | None) -> None:
    request_id_ctx.set(req_id)


class RequestIdFilter(logging.Filter):
    """Injects current request_id into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


class TextFormatter(logging.Formatter):
    """Clean, human-readable key-value log formatter for development."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        req_id = getattr(record, "request_id", "-")
        req_str = f"[{req_id}] " if req_id and req_id != "-" else ""
        msg = record.getMessage()

        base = f"{timestamp} | {record.levelname:<8} | {record.name} | {req_str}{msg}"

        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
            if record.exc_text:
                base = f"{base}\n{record.exc_text}"
        return base


class JsonFormatter(logging.Formatter):
    """Structured JSON formatter for production log ingestion and analytics."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if passed in record.__dict__
        for key, val in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
                "request_id",
            } and not key.startswith("_"):
                try:
                    json.dumps(val)
                    payload[key] = val
                except (TypeError, OverflowError):
                    payload[key] = str(val)

        return json.dumps(payload)


def setup_logging(settings: Settings) -> None:
    """
    Configures the root logger and standard library/framework loggers.
    Prevents duplicate handler emission and silences noisy SQL query logs by default.
    """
    level_name = settings.log_level.upper()
    log_level = getattr(logging, level_name, logging.INFO)

    use_json = (
        settings.log_format == "json"
        or (settings.log_format == "auto" and settings.is_production)
    )
    formatter = JsonFormatter() if use_json else TextFormatter()

    # Clear root handlers to avoid duplicates
    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # ── SQLAlchemy Engine Logging ──────────────────────────────────────────
    # Prevent SQLAlchemy engine logger from attaching duplicate default handlers
    # or echoing queries unless explicitly enabled.
    sqla_logger = logging.getLogger("sqlalchemy.engine")
    sqla_logger.handlers.clear()

    if settings.sqlalchemy_echo:
        sqla_logger.setLevel(logging.INFO)
    else:
        sqla_logger.setLevel(logging.WARNING)

    # Keep propagation to root handler so formatting matches application logs
    sqla_logger.propagate = True

    # ── Uvicorn access log silencing if middleware handles HTTP access logs ──
    logging.getLogger("uvicorn.access").handlers.clear()
    logging.getLogger("uvicorn.access").propagate = False
