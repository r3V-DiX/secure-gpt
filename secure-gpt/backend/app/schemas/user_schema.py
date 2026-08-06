from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserInviteRequest(BaseModel):
    email: str

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: Optional[str]
    avatarUrl: Optional[str]
    role: str
    isActive: bool
    orgId: Optional[str]
    createdAt: datetime
    lastLoginAt: Optional[datetime]
