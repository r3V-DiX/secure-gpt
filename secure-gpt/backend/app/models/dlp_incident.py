# backend/app/models/dlp_incident.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.policy import PolicyAction


class DLPIncident(Base):
    __tablename__ = "dlp_incidents"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    org_id: Mapped[str] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    department_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("departments.id", ondelete="SET NULL"), index=True, nullable=True
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    policy_id: Mapped[str] = mapped_column(
        String, ForeignKey("policies.id", ondelete="CASCADE"), index=True, nullable=False
    )

    target_app: Mapped[str] = mapped_column(String(100), nullable=False)  # ChatGPT, Claude, etc.
    action_taken: Mapped[PolicyAction] = mapped_column(Enum(PolicyAction), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    redacted_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    organisation: Mapped["Organisation"] = relationship("Organisation", back_populates="incidents")  # noqa: F821
    department: Mapped["Department | None"] = relationship("Department", back_populates="incidents")  # noqa: F821
    user: Mapped["User"] = relationship("User", back_populates="incidents")  # noqa: F821
    policy: Mapped["Policy"] = relationship("Policy", back_populates="incidents")  # noqa: F821
