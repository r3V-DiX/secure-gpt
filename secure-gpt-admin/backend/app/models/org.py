# backend/app/models/org.py

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Boolean, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class OrgStatus(str, PyEnum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class Organisation(Base):
    __tablename__ = "organisations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[OrgStatus] = mapped_column(Enum(OrgStatus), default=OrgStatus.ACTIVE)
    
    # DNS Domain Verification Challenge
    dns_txt_token: Mapped[str | None] = mapped_column(String(100), nullable=True)
    domain_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # SIEM / Webhook
    siem_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    siem_webhook_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)

    plan: Mapped[str] = mapped_column(String(50), default="free")  # free | pro | enterprise
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sso_config: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organisation")  # noqa: F821
    departments: Mapped[list["Department"]] = relationship("Department", back_populates="organisation", cascade="all, delete-orphan")  # noqa: F821
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="organisation")  # noqa: F821
    policies: Mapped[list["Policy"]] = relationship("Policy", back_populates="organisation")  # noqa: F821
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="organisation")  # noqa: F821
    incidents: Mapped[list["DLPIncident"]] = relationship("DLPIncident", back_populates="organisation", cascade="all, delete-orphan")  # noqa: F821