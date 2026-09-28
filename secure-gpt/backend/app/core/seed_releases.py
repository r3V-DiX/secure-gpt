# backend/app/core/seed_releases.py
# ─────────────────────────────────────────────────────────────────────────────
# Seeder for System Releases with complete v1.0.0 through v1.1.5 history
# ─────────────────────────────────────────────────────────────────────────────

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_release import SystemRelease
from app.core.seed_releases_baseline import BASELINE_RELEASES
from app.core.seed_releases_admin import ADMIN_RELEASES
from app.core.seed_releases_extension import EXTENSION_RELEASES

logger = logging.getLogger(__name__)

INITIAL_RELEASES = BASELINE_RELEASES + ADMIN_RELEASES + EXTENSION_RELEASES


async def seed_system_releases_if_empty(session: AsyncSession):
    """Seed or update initial system releases in system_releases table."""
    try:
        stmt = select(SystemRelease)
        res = await session.execute(stmt)
        existing_records = res.scalars().all()
        existing_map = {(r.component, r.version): r for r in existing_records}
        
        for item in INITIAL_RELEASES:
            key = (item["component"], item["version"])
            if key in existing_map:
                record = existing_map[key]
                record.release_date = item["release_date"]
                record.status = item["status"]
                record.tag = item["tag"]
                record.commit_hash = item["commit_hash"]
                record.summary = item["summary"]
                record.info = item["info"]
                record.whats_new = item["whats_new"]
                record.changed_functionality = item["changed_functionality"]
                record.improvements = item["improvements"]
                record.problems_solved = item["problems_solved"]
                record.order_index = item.get("order_index", 0)
                record.is_active = True
            else:
                release = SystemRelease(
                    component=item["component"],
                    version=item["version"],
                    release_date=item["release_date"],
                    status=item["status"],
                    tag=item["tag"],
                    commit_hash=item["commit_hash"],
                    summary=item["summary"],
                    info=item["info"],
                    whats_new=item["whats_new"],
                    changed_functionality=item["changed_functionality"],
                    improvements=item["improvements"],
                    problems_solved=item["problems_solved"],
                    order_index=item.get("order_index", 0),
                    is_active=True,
                )
                session.add(release)
        await session.commit()
        logger.info("Successfully synchronized %d system release records.", len(INITIAL_RELEASES))
    except Exception as e:
        logger.warning("Could not sync system releases: %s", str(e))
        await session.rollback()
