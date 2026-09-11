# backend/app/api/v1/system.py
# ─────────────────────────────────────────────────────────────────────────────
# Public system metadata & release version endpoints.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["system"])


RELEASES_LOG = [
    {
        "version": "1.0.0",
        "date": "2026-09-11",
        "tag": "Current Release",
        "status": "Production Stable",
        "environment": "ap-south-1",
        "commit": "prod-v1.0.0",
        "summary": "Baseline production release establishing central release tracking, telemetry, policy engine, and enterprise controls.",
        "changes": [
            {
                "category": "Core & Architecture",
                "items": [
                    "Public system version endpoint (/api/v1/system/version) reporting live deployed builds.",
                    "Single source of truth release tracker (RELEASE_TRACKER.md) with deployment verification checklist.",
                    "Automated post-deployment verification hooks in deployment and update scripts.",
                ],
            },
            {
                "category": "Security & DLP Engine",
                "items": [
                    "Browser-native DLP interception for web-based LLMs with zero cloud data exposure.",
                    "Real-time regex and token pattern matching for PII, API secrets, credentials, and financial identifiers.",
                    "Configurable DLP actions: ALLOW, MASK (redaction), WARN, and BLOCK.",
                ],
            },
            {
                "category": "Dashboard & Administration",
                "items": [
                    "Interactive release tracker and live version inspection console.",
                    "Live violation telemetry and analytics with policy activity charts.",
                    "Multi-tenant organization policy hierarchy and device management.",
                ],
            },
        ],
        "components": {
            "backend": "1.0.0",
            "extension": "1.2.0",
            "dashboard": "1.0.0",
        },
    }
]


@router.get("/version", summary="Get application build & release version")
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
            "backend": settings.app_version,
            "extension": "1.2.1",
            "dashboard": "1.1.2",
        },
    }


@router.get("/releases", summary="Get release history and changelog")
async def get_releases():
    """Returns detailed production release history, changelog, and component matrices."""
    return {
        "status": "ok",
        "currentVersion": settings.app_version,
        "releases": RELEASES_LOG,
    }

