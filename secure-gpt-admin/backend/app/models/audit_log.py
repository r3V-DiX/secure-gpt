# backend/app/models/audit_log.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, JSON, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum as PyEnum
from app.core.database import Base


class ActionType(str, PyEnum):
    BLOCK = "BLOCK"
    MASK = "MASK"
    WARN_ALLOW = "WARN_ALLOW"
    ALLOW = "ALLOW"


class SeverityLevel(str, PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Dedup key — extension generates a unique event ID per capture
    event_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)

    # Who
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Org — nullable, schema only for now
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True
    )

    # What happened
    action_taken: Mapped[ActionType] = mapped_column(Enum(ActionType), nullable=False)
    category_triggered: Mapped[str] = mapped_column(String(50), nullable=False)  # FINANCIAL | PII | CONFIDENTIAL | IP
    detection_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. credit_card, email
    detection_tier: Mapped[str] = mapped_column(String(20), default="regex")  # regex | ner | ocr

    # Where
    llm_platform: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(253), nullable=True)

    # Detection details
    match_count: Mapped[int] = mapped_column(Integer, default=1)
    snippet_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)  # SHA-256, never raw text
    entity_types: Mapped[list] = mapped_column(JSON, default=list)
    severities: Mapped[list] = mapped_column(JSON, default=list)

    # Extension metadata
    extension_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    os_platform: Mapped[str | None] = mapped_column(String(100), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # User acknowledgement (for WARN_ALLOW)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)

    # Performance
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pipeline_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")  # noqa: F821
    organisation: Mapped["Organisation | None"] = relationship("Organisation", back_populates="audit_logs")  # noqa: F821