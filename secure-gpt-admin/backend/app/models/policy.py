# backend/app/models/policy.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Owner — policy belongs to a user for now
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Org FK — nullable, schema only for future multi-tenant
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True
    )

    # Full PIIConfig stored as JSON
    config: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Versioning
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

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
    user: Mapped["User"] = relationship("User", back_populates="policies")  # noqa: F821
    organisation: Mapped["Organisation | None"] = relationship("Organisation", back_populates="policies")  # noqa: F821