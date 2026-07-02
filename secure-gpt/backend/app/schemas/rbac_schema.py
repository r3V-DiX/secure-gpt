# backend/app/schemas/rbac_schema.py

from pydantic import BaseModel, Field
from datetime import datetime
from app.models.rbac import PermissionModule, RiskLevel, AuditStatus


class PermissionResponse(BaseModel):
    id: str
    action: str
    module: PermissionModule
    name: str
    description: str | None
    riskLevel: RiskLevel = Field(validation_alias="risk_level")
    isActive: bool = Field(validation_alias="is_active")

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    isSystem: bool = Field(validation_alias="is_system")
    isActive: bool = Field(validation_alias="is_active")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")

    model_config = {"from_attributes": True}


class RoleDetailResponse(RoleResponse):
    permissions: list[PermissionResponse] = []



class RoleCreateRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None


class RoleUpdateRequest(BaseModel):
    name: str
    description: str | None = None
    isActive: bool | None = None


class RolePermissionsUpdateRequest(BaseModel):
    permissionActions: list[str]


class UserRoleAssignmentRequest(BaseModel):
    roleSlugs: list[str]


class AdminUserResponse(BaseModel):
    id: str
    email: str
    fullName: str | None = Field(validation_alias="full_name")
    avatarUrl: str | None = Field(validation_alias="avatar_url")
    role: str  # Legacy role enum string
    isActive: bool = Field(validation_alias="is_active")
    orgId: str | None = Field(validation_alias="org_id")
    createdAt: datetime = Field(validation_alias="created_at")
    lastLoginAt: datetime | None = Field(validation_alias="last_login_at")
    roles: list[RoleResponse] = []

    model_config = {"from_attributes": True}


class AdminAuditLogResponse(BaseModel):
    id: str
    userId: str | None = Field(validation_alias="user_id")
    userEmail: str | None = Field(validation_alias="user_email")
    userName: str | None = Field(validation_alias="user_name")
    userRoles: list[str] | None = Field(validation_alias="user_roles")
    action: str
    module: PermissionModule
    description: str | None
    entityId: str | None = Field(validation_alias="entity_id")
    entityType: str | None = Field(validation_alias="entity_type")
    entityName: str | None = Field(validation_alias="entity_name")
    beforeState: dict | None = Field(validation_alias="before_state")
    afterState: dict | None = Field(validation_alias="after_state")
    ipAddress: str | None = Field(validation_alias="ip_address")
    userAgent: str | None = Field(validation_alias="user_agent")
    status: AuditStatus
    reason: str | None
    riskLevel: RiskLevel = Field(validation_alias="risk_level")
    createdAt: datetime = Field(validation_alias="created_at")

    model_config = {"from_attributes": True}

