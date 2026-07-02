# backend/app/schemas/auth_schema.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth schemas — Google OAuth only.
# Email/password schemas removed. Routes use inline Pydantic models.
# This file kept for any future schema reuse.
# ─────────────────────────────────────────────────────────────────────────────

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str | None
    avatarUrl: str | None
    role: str
    isActive: bool
    orgId: str | None
    createdAt: str
    lastLoginAt: str | None

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    user: UserResponse
    message: str = "Login successful"