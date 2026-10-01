# backend/app/models/user.py

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, PyEnum):
    # Tier 1
    PLATFORM_SUPER_ADMIN = "platform_super_admin"
    # Legacy / general roles
    SUPER_ADMIN = "super_admin"
    # Tier 2
    ORG_ADMIN = "org_admin"
    SECURITY_ADMIN = "security_admin"
    AUDITOR = "auditor"
    # Tier 3
    DEPARTMENT_ADMIN = "department_admin"
    # Tier 4
    EMPLOYEE = "employee"
    USER = "user"


from sqlalchemy.types import TypeDecorator


class UserRoleType(TypeDecorator):
    """
    Resilient role type that handles Enum, lowercase strings,
    and binds to Postgres native uppercase 'userrole' enum.
    """
    impl = Enum(UserRole, name="userrole", values_callable=lambda x: [e.name for e in x], native_enum=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.name
        if isinstance(value, str):
            val_clean = value.upper()
            try:
                return UserRole[val_clean].name
            except KeyError:
                try:
                    return UserRole(value.lower()).name
                except ValueError:
                    return val_clean
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value
        val_clean = str(value).upper()
        try:
            return UserRole[val_clean]
        except KeyError:
            try:
                return UserRole(str(value).lower())
            except ValueError:
                return UserRole.USER


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Google OAuth only — no password
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)

    # Role & Status
    role: Mapped[UserRole] = mapped_column(
        UserRoleType,
        default=UserRole.USER,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_high_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    privacy_accepted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Organisation & Department FKs
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Deactivation & Deletion Hold Policies
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    deactivation_reason: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    pre_deletion_email_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    organisation: Mapped["Organisation | None"] = relationship("Organisation", back_populates="users")  # noqa: F821
    department: Mapped["Department | None"] = relationship("Department", back_populates="members")  # noqa: F821
    sessions: Mapped[list["Session"]] = relationship("Session", foreign_keys="Session.user_id", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    impersonated_sessions: Mapped[list["Session"]] = relationship("Session", foreign_keys="Session.impersonator_id", back_populates="impersonator")  # noqa: F821
    auth_events: Mapped[list["AuthEvent"]] = relationship("AuthEvent", back_populates="user")  # noqa: F821
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")  # noqa: F821
    policies: Mapped[list["Policy"]] = relationship("Policy", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    role_assignments: Mapped[list["UserRoleAssignment"]] = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    admin_audit_logs: Mapped[list["AdminAuditLog"]] = relationship("AdminAuditLog", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    incidents: Mapped[list["DLPIncident"]] = relationship("DLPIncident", back_populates="user")  # noqa: F821