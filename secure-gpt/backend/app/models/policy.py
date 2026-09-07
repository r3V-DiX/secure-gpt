# backend/app/models/policy.py

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PolicyAction(str, PyEnum):
    BLOCK = "BLOCK"
    MASK = "MASK"
    WARN_ALLOW = "WARN_ALLOW"
    ALLOW = "ALLOW"


class PolicyCategory(str, PyEnum):
    PII = "PII"
    FINANCIAL = "FINANCIAL"
    SECRETS_KEYS = "SECRETS_KEYS"
    SOURCE_CODE = "SOURCE_CODE"
    CUSTOM_REGEX = "CUSTOM_REGEX"


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Scoping
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    department_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Category & Action
    category: Mapped[PolicyCategory] = mapped_column(Enum(PolicyCategory), default=PolicyCategory.CUSTOM_REGEX)
    action: Mapped[PolicyAction] = mapped_column(Enum(PolicyAction), default=PolicyAction.BLOCK)
    severity: Mapped[str] = mapped_column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL

    # Full PIIConfig stored as JSON
    config: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Versioning & Status
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_disabled_by_org: Mapped[bool] = mapped_column(Boolean, default=False)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="policies")  # noqa: F821
    organisation: Mapped["Organisation | None"] = relationship("Organisation", back_populates="policies")  # noqa: F821
    department: Mapped["Department | None"] = relationship("Department", back_populates="policies")  # noqa: F821
    incidents: Mapped[list["DLPIncident"]] = relationship("DLPIncident", back_populates="policy")  # noqa: F821