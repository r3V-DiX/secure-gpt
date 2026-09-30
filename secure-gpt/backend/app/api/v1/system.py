# backend/app/api/v1/system.py
# ─────────────────────────────────────────────────────────────────────────────
# Public system metadata & dynamic database-backed release version endpoints.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.system_release import SystemRelease

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/version", summary="Get application build & release version")
async def get_system_version(db: AsyncSession = Depends(get_db)):
    """Returns live deployed build version, environment, and latest component versions."""
    # Query latest versions from database with settings fallback
    backend_ver = settings.app_version
    extension_ver = settings.extension_version
    dashboard_ver = settings.dashboard_version

    try:
        # Latest baseline / backend
        res = await db.execute(
            select(SystemRelease.version)
            .where(SystemRelease.component == "baseline", SystemRelease.is_active == True)
            .order_by(SystemRelease.order_index.asc(), desc(SystemRelease.created_at))
            .limit(1)
        )
        b_ver = res.scalars().first()
        if b_ver:
            backend_ver = b_ver
            dashboard_ver = b_ver

        # Latest extension
        res_ext = await db.execute(
            select(SystemRelease.version)
            .where(SystemRelease.component == "extension", SystemRelease.is_active == True)
            .order_by(SystemRelease.order_index.asc(), desc(SystemRelease.created_at))
            .limit(1)
        )
        e_ver = res_ext.scalars().first()
        if e_ver:
            extension_ver = e_ver
    except Exception:
        pass

    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": backend_ver,
        "commit": settings.git_commit or f"prod-v{backend_ver}",
        "buildTime": settings.build_time,
        "components": {
            "backend": backend_ver,
            "extension": extension_ver,
            "dashboard": dashboard_ver,
        },
    }


@router.get("/releases", summary="Get release history and categorized changelogs")
async def get_releases(db: AsyncSession = Depends(get_db)):
    """Returns dynamic categorized releases grouped by component (baseline, admin, extension)."""
    try:
        stmt = (
            select(SystemRelease)
            .where(SystemRelease.is_active == True)
            .order_by(SystemRelease.order_index.asc(), desc(SystemRelease.created_at))
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        grouped = {
            "baseline": [],
            "admin": [],
            "extension": [],
        }

        for r in records:
            cat = r.component if r.component in grouped else "baseline"
            grouped[cat].append(r.to_dict())

        # If DB had entries, return them
        if any(len(v) > 0 for v in grouped.values()):
            latest_baseline = grouped["baseline"][0]["version"] if grouped["baseline"] else settings.app_version
            latest_extension = grouped["extension"][0]["version"] if grouped["extension"] else settings.extension_version
            latest_admin = grouped["admin"][0]["version"] if grouped["admin"] else settings.app_version
            return {
                "status": "ok",
                "currentVersion": latest_baseline,
                "components": {
                    "baseline": latest_baseline,
                    "admin": latest_admin,
                    "extension": latest_extension,
                },
                "releases": grouped,
            }
    except Exception:
        pass

    empty_grouped = {"baseline": [], "admin": [], "extension": []}
    return {
        "status": "ok",
        "currentVersion": settings.app_version,
        "components": {
            "baseline": settings.app_version,
            "admin": settings.app_version,
            "extension": settings.extension_version,
        },
        "releases": empty_grouped,
    }
