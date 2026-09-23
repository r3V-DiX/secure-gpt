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
from app.core.seed_releases import INITIAL_RELEASES

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/version", summary="Get application build & release version")
async def get_system_version(db: AsyncSession = Depends(get_db)):
    """Returns live deployed build version, environment, and latest component versions."""
    # Query latest versions from database with fallback
    backend_ver = "1.1.5"
    extension_ver = "1.2.2"
    dashboard_ver = "1.1.5"

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
        "commit": settings.git_commit or "prod-v1.1.5",
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
            latest_baseline = grouped["baseline"][0]["version"] if grouped["baseline"] else "1.1.5"
            latest_extension = grouped["extension"][0]["version"] if grouped["extension"] else "1.2.2"
            latest_admin = grouped["admin"][0]["version"] if grouped["admin"] else "1.1.5"
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

    # Fallback to static initial releases structure if database is warming up
    fallback_grouped = {"baseline": [], "admin": [], "extension": []}
    for item in INITIAL_RELEASES:
        cat = item.get("component", "baseline")
        if cat not in fallback_grouped:
            fallback_grouped[cat] = []
        fallback_grouped[cat].append({
            "id": f"seed-{cat}-{item['version']}",
            "component": cat,
            "version": item["version"],
            "date": item["release_date"],
            "status": item["status"],
            "tag": item["tag"],
            "commit": item["commit_hash"],
            "summary": item["summary"],
            "info": item["info"],
            "whatsNew": item.get("whats_new", []),
            "changedFunctionality": item.get("changed_functionality", []),
            "improvements": item.get("improvements", []),
            "problemsSolved": item.get("problems_solved", []),
            "isActive": True,
            "orderIndex": item.get("order_index", 0),
        })

    return {
        "status": "ok",
        "currentVersion": "1.1.5",
        "components": {
            "baseline": "1.1.5",
            "admin": "1.1.5",
            "extension": "1.2.2",
        },
        "releases": fallback_grouped,
    }
