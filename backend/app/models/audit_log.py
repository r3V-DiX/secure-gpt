# ─────────────────────────────────────────────
# AuditLog Model
# IMPORTANT: Never store raw PII text
# Only metadata + SHA-256 hashes
# ─────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)

    # ── Who ───────────────────────────────────
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)  # optional
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id"), nullable=False, index=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("devices.id"), nullable=True)

    # ── What ──────────────────────────────────
    action_taken: Mapped[str] = mapped_column(
        Enum("BLOCK", "MASK", "WARN_ALLOW", "ALLOW", name="policy_action"),
        nullable=False,
        index=True,
    )
    category_triggered: Mapped[str] = mapped_column(
        Enum("FINANCIAL", "PII", "CONFIDENTIAL", "IP", name="pii_category"),
        nullable=False,
        index=True,
    )
    detection_type: Mapped[str] = mapped_column(String(100), nullable=False)
    detection_tier: Mapped[str] = mapped_column(
        Enum("regex", "ner", "ocr", name="detection_tier"),
        nullable=False,
        default="regex",
    )
    match_count: Mapped[int] = mapped_column(Integer, default=1)
    snippet_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 only

    # ── Where ─────────────────────────────────
    llm_platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # ── Context ───────────────────────────────
    extension_version: Mapped[str] = mapped_column(String(20), nullable=False)
    os_platform: Mapped[str] = mapped_column(String(50), nullable=False)
    browser: Mapped[str] = mapped_column(String(100), nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── When ──────────────────────────────────
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ─────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="audit_logs")
    org: Mapped["Org"] = relationship("Org", back_populates="audit_logs")
    device: Mapped["Device"] = relationship("Device", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action_taken} category={self.category_triggered}>"
