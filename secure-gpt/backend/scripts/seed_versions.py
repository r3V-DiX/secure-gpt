#!/usr/bin/env python3
"""
Seed all historical versions (v1.0.0 through v1.1.5) into PostgreSQL system_releases table.
Usage: python3 backend/scripts/seed_versions.py
"""

import asyncio
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.system_release import SystemRelease
from app.core.seed_releases import INITIAL_RELEASES

async def main():
    print("Connecting to database and creating tables if not exists...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Checking existing records in system_releases...")
        stmt = select(SystemRelease)
        res = await session.execute(stmt)
        existing_records = res.scalars().all()
        existing_map = {(r.component, r.version): r for r in existing_records}

        inserted_count = 0
        updated_count = 0

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
                updated_count += 1
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
                inserted_count += 1

        await session.commit()
        print(f"Done! Inserted: {inserted_count}, Updated: {updated_count} system releases.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
