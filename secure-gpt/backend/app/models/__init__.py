# backend/app/models/__init__.py
# Import all models so Alembic and Base.metadata can discover them

from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.deleted_user_log import DeletedUserLog
from app.models.session import Session
from app.models.impersonation_handoff import ImpersonationHandoff
from app.models.auth_event import AuthEvent, AuthEventType
from app.models.audit_log import AuditLog, ActionType, SeverityLevel
from app.models.device import Device
from app.models.policy import Policy, PolicyAction, PolicyCategory
from app.models.dlp_incident import DLPIncident
from app.models.rbac import (
    Role,
    Permission,
    RolePermission,
    UserRoleAssignment,
    AdminAuditLog,
    PermissionModule,
    RiskLevel,
    AuditStatus,
)
from app.models.otp_code import OTPCode
from app.models.org_invitation import OrgInvitation, InvitationStatus
from app.models.system_release import SystemRelease

__all__ = [
    "Organisation",
    "OrgStatus",
    "OrgInvitation",
    "InvitationStatus",
    "Department",
    "User",
    "UserRole",
    "DeletedUserLog",
    "Session",
    "ImpersonationHandoff",
    "AuthEvent",
    "AuthEventType",
    "AuditLog",
    "ActionType",
    "SeverityLevel",
    "Device",
    "Policy",
    "PolicyAction",
    "PolicyCategory",
    "DLPIncident",
    "Role",
    "Permission",
    "RolePermission",
    "UserRoleAssignment",
    "AdminAuditLog",
    "PermissionModule",
    "RiskLevel",
    "AuditStatus",
    "OTPCode",
    "SystemRelease",
]
