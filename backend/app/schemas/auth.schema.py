# backend/app/schemas/auth.schema.py

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    avatar_url: str | None
    role: str
    is_active: bool
    org_id: str | None

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    user: UserResponse
    message: str = "Login successful"


class GoogleCallbackRequest(BaseModel):
    code: str
    state: str | None = None