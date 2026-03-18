# ─────────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    code: str                   # OAuth authorization code from Google


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    role: str
    org_id: str
    department: str | None
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
