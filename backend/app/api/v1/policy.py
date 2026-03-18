# ─────────────────────────────────────────────
# Policy Routes
# Org policy CRUD + device sync endpoint
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_security_admin, get_current_user
from app.services.policy.service import (
    get_active_policy,
    get_policy_for_device,
    create_policy,
    update_policy,
    get_policy_history,
)
from app.models.user import User

router = APIRouter(prefix="/policy", tags=["Policy"])


@router.get("/device/{org_id}")
def get_policy_for_extension(
    org_id: str,
    device_token: str,
    db: Session = Depends(get_db),
) -> dict:
    """Extension polls this every 15 minutes to get latest policy.
    Authenticated via device token passed as query param."""
    from app.core.security import hash_device_token
    from app.models.device import Device

    token_hash = hash_device_token(device_token)
    device = db.query(Device).filter(
        Device.token_hash == token_hash,
        Device.org_id == org_id,
        Device.is_active == True,
    ).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device token",
        )

    policy_data = get_policy_for_device(db, org_id)
    return {"success": True, "data": policy_data}


@router.get("/current")
def get_current_policy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Get current active policy for the user's org."""
    policy = get_active_policy(db, current_user.org_id)
    if not policy:
        from app.services.policy.service import DEFAULT_CONFIG
        return {"success": True, "data": {"version": 1, "config": DEFAULT_CONFIG}}

    return {
        "success": True,
        "data": {
            "id": policy.id,
            "org_id": policy.org_id,
            "config": policy.config,
            "version": policy.version,
            "is_active": policy.is_active,
            "published_at": policy.published_at.isoformat() if policy.published_at else None,
            "created_at": policy.created_at.isoformat(),
        },
    }


@router.post("/")
def create_org_policy(
    payload: dict,
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Create or replace org policy. Security admin only."""
    policy = create_policy(
        db,
        org_id=current_user.org_id,
        created_by=current_user.id,
        config=payload.get("config", {}),
        publish_immediately=payload.get("publish_immediately", True),
    )
    return {
        "success": True,
        "data": {
            "id": policy.id,
            "version": policy.version,
            "published_at": policy.published_at.isoformat() if policy.published_at else None,
        },
        "message": "Policy published successfully",
    }


@router.put("/")
def update_org_policy(
    payload: dict,
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Update org policy — creates a new version."""
    policy = update_policy(
        db,
        org_id=current_user.org_id,
        updated_by=current_user.id,
        config=payload.get("config", {}),
        publish_immediately=payload.get("publish_immediately", True),
    )
    return {
        "success": True,
        "data": {"id": policy.id, "version": policy.version},
        "message": "Policy updated and published",
    }


@router.get("/history")
def get_history(
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get policy version history."""
    policies = get_policy_history(db, current_user.org_id)
    return {
        "success": True,
        "data": [
            {
                "id": p.id,
                "version": p.version,
                "is_active": p.is_active,
                "published_at": p.published_at.isoformat() if p.published_at else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in policies
        ],
    }
