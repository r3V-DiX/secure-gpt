# backend/app/models/rbac.py

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PermissionModule(str, PyEnum):
    USER = "USER"
    POLICY = "POLICY"
    SYSTEM = "SYSTEM"
    AUDIT = "AUDIT"
    ROLE = "ROLE"
    ORGANISATION = "ORGANISATION"


class RiskLevel(str, PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AuditStatus(str, PyEnum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    DENIED = "DENIED"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_assignments: Mapped[list["UserRoleAssignment"]] = relationship("UserRoleAssignment", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    action: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    module: Mapped[PermissionModule] = mapped_column(Enum(PermissionModule), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.LOW)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    role_id: Mapped[str] = mapped_column(
        String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    permission_id: Mapped[str] = mapped_column(
        String, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="permissions")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="role_permissions")


class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_id: Mapped[str] = mapped_column(
        String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="role_assignments")
    role: Mapped["Role"] = relationship("Role", back_populates="user_assignments")


class AdminAuditLog(Base):
    """
    Tracks admin action configurations, distinct from DLP intercept logs.
    """
    __tablename__ = "admin_audit_logs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_roles: Mapped[list | None] = mapped_column(JSON, nullable=True)  # List of slugs

    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    module: Mapped[PermissionModule] = mapped_column(Enum(PermissionModule), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[AuditStatus] = mapped_column(Enum(AuditStatus), default=AuditStatus.SUCCESS)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.LOW)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="admin_audit_logs")
