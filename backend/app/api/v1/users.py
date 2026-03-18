# ─────────────────────────────────────────────
# Users Routes
# User management + profile
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_security_admin,
    require_super_admin,
)
from app.services.user.service import (
    get_users_by_org,
    get_user_by_id,
    update_user_profile,
    update_user_role,
    deactivate_user,
    get_high_risk_users,
)
from app.models.user import User
import math

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """List all users in the org. Security admin only."""
    users, total = get_users_by_org(
        db,
        org_id=current_user.org_id,
        page=page,
        limit=limit,
        search=search,
        role=role,
    )

    return {
        "success": True,
        "data": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "avatar_url": u.avatar_url,
                "role": u.role,
                "department": u.department,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
                "last_seen_at": u.last_seen_at.isoformat() if u.last_seen_at else None,
            }
            for u in users
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": math.ceil(total / limit),
            "has_next": page * limit < total,
            "has_prev": page > 1,
        },
    }


@router.get("/high-risk")
def list_high_risk_users(
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get users who exceeded the block threshold."""
    from app.models.org import Org
    org = db.query(Org).filter(Org.id == current_user.org_id).first()

    users = get_high_risk_users(
        db,
        org_id=current_user.org_id,
        threshold=org.high_risk_threshold if org else 5,
        window_days=org.high_risk_window_days if org else 7,
    )
    return {"success": True, "data": users}


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get current user's own profile."""
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "avatar_url": current_user.avatar_url,
            "role": current_user.role,
            "org_id": current_user.org_id,
            "department": current_user.department,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat(),
        },
    }


@router.put("/me")
def update_my_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Update current user's own profile."""
    user = update_user_profile(
        db,
        user_id=current_user.id,
        name=payload.get("name"),
        department=payload.get("department"),
        avatar_url=payload.get("avatar_url"),
    )
    return {"success": True, "data": {"id": user.id, "name": user.name}, "message": "Profile updated"}


@router.get("/{user_id}")
def get_user(
    user_id: str,
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get a specific user by ID. Security admin only."""
    user = get_user_by_id(db, user_id)
    if not user or user.org_id != current_user.org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
        },
    }


@router.put("/{user_id}/role")
def change_user_role(
    user_id: str,
    payload: dict,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Change a user's role. Super admin only."""
    try:
        user = update_user_role(db, user_id, payload["role"])
        return {"success": True, "data": {"id": user.id, "role": user.role}, "message": "Role updated"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}")
def deactivate(
    user_id: str,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Deactivate a user. Super admin only."""
    try:
        deactivate_user(db, user_id)
        return {"success": True, "message": "User deactivated"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
