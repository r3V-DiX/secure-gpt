# backend/app/api/v1/admin/releases.py
# ─────────────────────────────────────────────────────────────────────────────
# Super Admin System Release Management Endpoints (CRUD)
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.system_release import SystemRelease
from app.schemas.release_schema import (
    SystemReleaseCreate,
    SystemReleaseUpdate,
    SystemReleaseResponse,
)

router = APIRouter(prefix="/releases", tags=["admin-releases"])


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower()
    if role_str not in ("super_admin", "platform_super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required to manage system releases.",
        )
    return user


@router.get("", response_model=List[SystemReleaseResponse], summary="List all system releases")
async def list_admin_releases(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    stmt = select(SystemRelease).order_by(SystemRelease.order_index.asc(), desc(SystemRelease.created_at))
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [r.to_dict() for r in records]


@router.post("", response_model=SystemReleaseResponse, status_code=status.HTTP_201_CREATED, summary="Create system release")
async def create_release(
    body: SystemReleaseCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    release = SystemRelease(
        component=body.component,
        version=body.version,
        release_date=body.release_date,
        status=body.status,
        tag=body.tag,
        commit_hash=body.commit_hash,
        summary=body.summary,
        info=body.info,
        whats_new=body.whats_new,
        changed_functionality=body.changed_functionality,
        improvements=body.improvements,
        problems_solved=body.problems_solved,
        is_active=body.is_active,
        order_index=body.order_index,
    )
    db.add(release)
    await db.commit()
    await db.refresh(release)
    return release.to_dict()


@router.put("/{release_id}", response_model=SystemReleaseResponse, summary="Update system release")
async def update_release(
    release_id: str,
    body: SystemReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    stmt = select(SystemRelease).where(SystemRelease.id == release_id)
    res = await db.execute(stmt)
    release = res.scalars().first()
    if not release:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Release not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(release, field, val)

    await db.commit()
    await db.refresh(release)
    return release.to_dict()


@router.delete("/{release_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete system release")
async def delete_release(
    release_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    stmt = select(SystemRelease).where(SystemRelease.id == release_id)
    res = await db.execute(stmt)
    release = res.scalars().first()
    if not release:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Release not found")

    await db.delete(release)
    await db.commit()
    return None
