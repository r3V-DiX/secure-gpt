# ─────────────────────────────────────────────
# V1 Router
# Registers all v1 routes
# ─────────────────────────────────────────────

from fastapi import APIRouter
from app.api.v1 import auth, logs, policy, users, devices, reports, alerts, redaction

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(logs.router)
router.include_router(policy.router)
router.include_router(users.router)
router.include_router(devices.router)
router.include_router(reports.router)
router.include_router(alerts.router)
router.include_router(redaction.router)
