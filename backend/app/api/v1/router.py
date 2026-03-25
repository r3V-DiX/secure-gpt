# backend/app/api/v1/router.py
# ─────────────────────────────────────────────────────────────────────────────
# V1 API Router — registers all active routes.
# Admin routes (users, reports, orgs) are excluded — separate backend later.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter

from app.api.v1 import auth, logs, policy, alerts, devices, redaction
from app.api.v1.extension import log as extension_log
from app.api.v1.extension import policy as extension_policy

api_router = APIRouter()

# ── Core auth ─────────────────────────────────────────────────────────────────
api_router.include_router(auth.router)

# ── User data ─────────────────────────────────────────────────────────────────
api_router.include_router(logs.router)
api_router.include_router(alerts.router)
api_router.include_router(policy.router)
api_router.include_router(devices.router)

# ── Extension APIs ────────────────────────────────────────────────────────────
api_router.include_router(extension_log.router)
api_router.include_router(extension_policy.router)

# ── Utilities ─────────────────────────────────────────────────────────────────
api_router.include_router(redaction.router)