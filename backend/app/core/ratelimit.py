# backend/app/core/ratelimit.py
# ─────────────────────────────────────────────────────────────────────────────
# Rate limiting via slowapi (FastAPI-native limiter).
# Key is user_id from session — NOT IP address.
# Falls back to user-agent for unauthenticated routes (auth endpoints).
# ─────────────────────────────────────────────────────────────────────────────

from slowapi import Limiter
from fastapi import Request


def _rate_limit_key(request: Request) -> str:
    """
    Use session user_id as the rate limit key for authenticated routes.
    For unauthenticated routes (auth flow), fall back to user-agent
    since we explicitly avoid IP-based limiting.
    """
    user_id: str | None = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Unauthenticated — use user-agent as a soft identifier
    ua = request.headers.get("user-agent", "unknown")
    return f"ua:{ua[:64]}"


limiter = Limiter(
    key_func=_rate_limit_key,
    default_limits=["200/minute"],
)

# ─── Per-endpoint limit strings ───────────────────────────────────────────────

LIMIT_AUTH = "10/minute"
LIMIT_AUTH_ME = "60/minute"
LIMIT_LOGOUT = "10/minute"
LIMIT_EXTENSION_LOG = "100/minute"
LIMIT_EXTENSION_POLICY = "10/minute"
LIMIT_LOGS = "60/minute"
LIMIT_LOGS_STATS = "30/minute"
LIMIT_POLICY = "30/minute"
LIMIT_DEVICES = "30/minute"
LIMIT_REDACT = "10/minute"