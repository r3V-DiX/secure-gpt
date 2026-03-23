# backend/app/models/audit_log.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, JSON, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum as PyEnum
from app.core.database import Base


class ActionType(str, PyEnum):
    MASK = "mask"
    ALLOW = "allow"
    CANCEL = "cancel"
    BLOCK = "block"


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
    action: Mapped[ActionType] = mapped_column(Enum(ActionType), nullable=False)
    domain: Mapped[str] = mapped_column(String(253), nullable=False)
    entity_types: Mapped[list] = mapped_column(JSON, default=list)
    severities: Mapped[list] = mapped_column(JSON, default=list)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pipeline_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    org_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")  # noqa: F821