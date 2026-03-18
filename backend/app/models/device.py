# ─────────────────────────────────────────────
# Device Model
# Enrolled devices (extension installations)
# ─────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id"), nullable=False, index=True)

    # Hashed device token — never store raw
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)

    # Device metadata
    os_platform: Mapped[str] = mapped_column(String(50), nullable=False)
    browser: Mapped[str] = mapped_column(String(100), nullable=False)
    extension_version: Mapped[str] = mapped_column(String(20), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ─────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="devices")
    org: Mapped["Org"] = relationship("Org", back_populates="devices")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="device")

    def __repr__(self) -> str:
        return f"<Device id={self.id} user={self.user_id} os={self.os_platform}>"
