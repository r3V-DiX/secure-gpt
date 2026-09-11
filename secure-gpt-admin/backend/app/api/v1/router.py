# backend/app/api/v1/router.py
# ─────────────────────────────────────────────────────────────────────────────
# V1 API Router — registers all active routes.
# Admin routes (users, reports, orgs) are excluded — separate backend later.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter

from app.api.v1 import auth, logs, policy, admin_rbac, system

api_router = APIRouter()

# ── System metadata & release version ─────────────────────────────────────────
api_router.include_router(system.router)

# ── Core auth ─────────────────────────────────────────────────────────────────
api_router.include_router(auth.router)

# ── Admin Panel RBAC ──────────────────────────────────────────────────────────
api_router.include_router(admin_rbac.router)

# ── User data ─────────────────────────────────────────────────────────────────
api_router.include_router(logs.router)
api_router.include_router(policy.router)