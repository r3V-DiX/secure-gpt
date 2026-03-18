# ─────────────────────────────────────────────
# User Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel, EmailStr
from typing import Optional


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str]
    role: str
    org_id: str
    department: Optional[str]
    is_active: bool
    created_at: str
    last_seen_at: Optional[str]

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRoleUpdateRequest(BaseModel):
    role: str


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int
