# backend/app/schemas/org_schema.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.org import OrgStatus
from app.models.policy import PolicyAction, PolicyCategory


# ── Organisation Schemas ──────────────────────────────────────────────────────────

class OrgRegisterRequest(BaseModel):
    name: str
    admin_email: EmailStr


class OrgVerifyDomainRequest(BaseModel):
    org_id: str


class OrgResponse(BaseModel):
    id: str
    name: str
    domain: Optional[str]
    admin_email: str
    status: OrgStatus
    dns_txt_token: Optional[str]
    domain_verified_at: Optional[datetime]
    created_at: datetime


class OrgInviteUserRequest(BaseModel):
    email: EmailStr
    department_id: Optional[str] = None
    role: Optional[str] = "employee"


# ── Department Schemas ────────────────────────────────────────────────────────────

class DepartmentCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    org_id: str
    name: str
    description: Optional[str]
    created_at: datetime
    member_count: Optional[int] = 0


# ── DLP Incident Schemas ──────────────────────────────────────────────────────────

class DLPIncidentCreateRequest(BaseModel):
    target_app: str
    policy_id: str
    action_taken: PolicyAction
    severity: str = "HIGH"
    redacted_snippet: str
    override_reason: Optional[str] = None


class DLPIncidentResponse(BaseModel):
    id: str
    org_id: str
    department_id: Optional[str]
    user_id: str
    user_email: Optional[str]
    policy_id: str
    policy_name: Optional[str]
    target_app: str
    action_taken: PolicyAction
    severity: str
    redacted_snippet: str
    override_reason: Optional[str]
    created_at: datetime
