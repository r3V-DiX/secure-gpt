# backend/app/core/response.py
# ─────────────────────────────────────────────────────────────────────────────
# Consistent response builder. Every route must use these helpers.
# Shape is always predictable — frontend can rely on it unconditionally.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
from typing import Any


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def success(
    data: Any = None,
    message: str = "",
) -> dict:
    """
    Standard success response.

    {
        "success": true,
        "data": ...,
        "message": "...",
        "timestamp": "..."
    }
    """
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": _now(),
    }


def paginated(
    data: list,
    page: int,
    page_size: int,
    total: int,
    message: str = "",
) -> dict:
    """
    Paginated success response.

    {
        "success": true,
        "data": [...],
        "pagination": { page, page_size, total, total_pages, has_next, has_prev },
        "message": "...",
        "timestamp": "..."
    }
    """
    total_pages = max(1, -(-total // page_size))  # ceiling division
    return {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "message": message,
        "timestamp": _now(),
    }


def error(
    code: str,
    message: str,
    details: dict | None = None,
) -> dict:
    """
    Standard error response.

    {
        "success": false,
        "error": { "code": "...", "message": "...", "details": {} },
        "timestamp": "..."
    }
    """
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
        "timestamp": _now(),
    }