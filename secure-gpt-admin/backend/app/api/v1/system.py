# backend/app/api/v1/system.py
# ─────────────────────────────────────────────────────────────────────────────
# Public system metadata & release version endpoints for Admin API.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/version", summary="Get admin application build & release version")
async def get_system_version():
    """Returns live deployed build version, environment, and release metadata."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": settings.app_version,
        "commit": settings.git_commit,
        "buildTime": settings.build_time,
        "components": {
            "adminBackend": settings.app_version,
            "adminFrontend": "1.0.0",
        },
    }
