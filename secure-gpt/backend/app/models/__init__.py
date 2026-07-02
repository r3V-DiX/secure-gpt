# backend/app/models/__init__.py
# Import all models so Alembic and Base.metadata can discover them

from app.models.org import Organisation
from app.models.user import User, UserRole
from app.models.deleted_user_log import DeletedUserLog
from app.models.session import Session
from app.models.auth_event import AuthEvent, AuthEventType
from app.models.audit_log import AuditLog, ActionType, SeverityLevel
from app.models.device import Device
from app.models.policy import Policy
from app.models.rbac import Role, Permission, RolePermission, UserRoleAssignment, AdminAuditLog, PermissionModule, RiskLevel, AuditStatus
from app.models.otp_code import OTPCode

__all__ = [
    "Organisation",
    "User",
    "UserRole",
    "DeletedUserLog",
    "Session",
    "AuthEvent",
    "AuthEventType",
    "AuditLog",
    "ActionType",
    "SeverityLevel",
    "Device",
    "Policy",
    "Role",
    "Permission",
    "RolePermission",
    "UserRoleAssignment",
    "AdminAuditLog",
    "PermissionModule",
    "RiskLevel",
    "AuditStatus",
    "OTPCode",
]