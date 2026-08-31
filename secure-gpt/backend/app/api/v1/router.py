# backend/app/api/v1/router.py
# ─────────────────────────────────────────────────────────────────────────────
# V1 API Router — registers all active routes.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter

from app.api.v1 import auth, logs, policy, devices, redaction, users, orgs, incidents
from app.api.v1.extension import log as extension_log
from app.api.v1.extension import policy as extension_policy

api_router = APIRouter()

# ── Core auth ─────────────────────────────────────────────────────────────────
api_router.include_router(auth.router)

# ── User & Org data ───────────────────────────────────────────────────────────
api_router.include_router(logs.router)
api_router.include_router(policy.router)
api_router.include_router(devices.router)
api_router.include_router(users.router)
api_router.include_router(orgs.router)
api_router.include_router(incidents.router)

# ── Extension APIs ────────────────────────────────────────────────────────────
api_router.include_router(extension_log.router)
api_router.include_router(extension_policy.router)

# ── Utilities ─────────────────────────────────────────────────────────────────
api_router.include_router(redaction.router)