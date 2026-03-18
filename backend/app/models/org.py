# ─────────────────────────────────────────────
# Org Model
# ─────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Org(Base):
    __tablename__ = "orgs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(
        Enum("free", "pro", "enterprise", name="org_plan"),
        nullable=False,
        default="free",
    )

    # SSO config stored as JSON
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sso_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Extension settings
    allow_pause: Mapped[bool] = mapped_column(Boolean, default=True)
    log_user_email: Mapped[bool] = mapped_column(Boolean, default=False)
    log_retention_days: Mapped[int] = mapped_column(Integer, default=90)

    # Alert thresholds
    high_risk_threshold: Mapped[int] = mapped_column(Integer, default=5)
    high_risk_window_days: Mapped[int] = mapped_column(Integer, default=7)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────
    users: Mapped[list["User"]] = relationship("User", back_populates="org")
    policies: Mapped[list["Policy"]] = relationship("Policy", back_populates="org")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="org")
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="org")

    def __repr__(self) -> str:
        return f"<Org id={self.id} name={self.name} plan={self.plan}>"
