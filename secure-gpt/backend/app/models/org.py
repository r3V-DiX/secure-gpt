# backend/app/models/org.py
# ─────────────────────────────────────────────────────────────────────────────
# Organisation model — SCHEMA ONLY.
# No service, no routes, no business logic.
# Kept for future multi-tenant support.
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
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

    # Relationships (future use)
    users: Mapped[list["User"]] = relationship("User", back_populates="organisation")  # noqa: F821
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="organisation")  # noqa: F821
    policies: Mapped[list["Policy"]] = relationship("Policy", back_populates="organisation")  # noqa: F821
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="organisation")  # noqa: F821