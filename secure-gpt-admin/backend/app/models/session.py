# backend/app/models/session.py
#
# CHANGE: fingerprint_hash is now nullable.
#
# Sessions created via the OAuth BFF proxy start with fingerprint_hash = None
# (unbound). The session_service binds it lazily on the first real browser
# request. After binding, fingerprint_hash is always set and validated.

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True  # secrets.token_urlsafe(32) = 43 chars
    )

    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Fingerprint hash — HMAC-SHA256 of stable browser signals.
    # NULL = unbound (session just created via OAuth BFF proxy).
    # Will be set on the first real authenticated browser request.
    fingerprint_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="sessions")  # noqa: F821

    __table_args__ = (
        Index("ix_sessions_user_id_active", "user_id", "is_revoked"),
    )

    @property
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) >= self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_revoked and not self.is_expired