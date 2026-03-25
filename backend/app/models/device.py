# backend/app/models/device.py
# ─────────────────────────────────────────────────────────────────────────────
# Fixed: added `name` column and `created_at` column.
# devices.py API uses both fields — they were missing from the original model.
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Owner
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True
    )

    # FIX: name column was missing — devices.py creates Device(name=body.name)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Device info from extension
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    os_platform: Mapped[str | None] = mapped_column(String(100), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extension_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # FIX: created_at was missing — devices.py orders by Device.created_at
    # enrolled_at kept as alias for semantic clarity
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="devices")  # noqa: F821
    organisation: Mapped["Organisation | None"] = relationship(  # noqa: F821
        "Organisation", back_populates="devices"
    )