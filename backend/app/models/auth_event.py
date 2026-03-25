# backend/app/models/auth_event.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth event model — immutable audit trail of every auth-related action.
# Never deleted, append-only. Used for security monitoring and compliance.
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AuthEventType(str, PyEnum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    SESSION_CREATED = "session_created"
    SESSION_EXPIRED = "session_expired"
    SESSION_INVALIDATED = "session_invalidated"
    FINGERPRINT_MISMATCH = "fingerprint_mismatch"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    OAUTH_FAILED = "oauth_failed"
    USER_INACTIVE = "user_inactive"


class AuthEvent(Base):
    __tablename__ = "auth_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # user_id is nullable — failed logins may not have a resolved user
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    event_type: Mapped[AuthEventType] = mapped_column(
        Enum(AuthEventType), nullable=False
    )

    success: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Request metadata
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    fingerprint_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Extra context (session_id, error reason, etc.) — renamed from 'metadata' (reserved by SQLAlchemy)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    user: Mapped["User | None"] = relationship("User", back_populates="auth_events")  # noqa: F821

    __table_args__ = (
        Index("ix_auth_events_user_created", "user_id", "created_at"),
        Index("ix_auth_events_type", "event_type"),
    )