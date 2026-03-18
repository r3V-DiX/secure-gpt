# ─────────────────────────────────────────────
# Dependencies
# FastAPI dependency injection
# ─────────────────────────────────────────────

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.device import Device

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT and return current user."""
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def require_role(*roles: str):
    """Factory — returns a dependency that checks user role."""
    def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}",
            )
        return current_user
    return _check_role


def get_device(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Device:
    """Validate device token for extension API calls."""
    from app.core.security import hash_device_token
    token_hash = hash_device_token(credentials.credentials)

    device = db.query(Device).filter(
        Device.token_hash == token_hash,
        Device.is_active == True,
    ).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked device token",
        )

    return device


# ── Role shortcuts ────────────────────────────
require_super_admin = require_role("SUPER_ADMIN")
require_security_admin = require_role("SUPER_ADMIN", "SECURITY_ADMIN")
require_auditor = require_role("SUPER_ADMIN", "SECURITY_ADMIN", "AUDITOR")
require_hr = require_role("SUPER_ADMIN", "SECURITY_ADMIN", "AUDITOR", "HR_MANAGER")
