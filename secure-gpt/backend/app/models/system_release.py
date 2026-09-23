# backend/app/models/system_release.py
# ─────────────────────────────────────────────────────────────────────────────
# SystemRelease model — Stores version releases, changelogs, and component history
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SystemRelease(Base):
    __tablename__ = "system_releases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Component category: 'baseline', 'admin', 'extension'
    component: Mapped[str] = mapped_column(String(32), nullable=False, index=True, default="baseline")
    
    # Semver release string: '1.1.5'
    version: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    
    # Human-readable release date string: 'September 23, 2026'
    release_date: Mapped[str] = mapped_column(String(64), nullable=False)
    
    # Status: 'Production Stable', 'LTS', 'Pre-release'
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="Production Stable")
    
    # Tag headline: 'Dynamic Changelog Architecture & Enterprise UI Refinement'
    tag: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    
    # Commit or release hash: 'prod-v1.1.5'
    commit_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    
    # Short summary text
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    
    # Detailed info paragraph
    info: Mapped[str] = mapped_column(Text, nullable=False, default="")
    
    # Structured changelog sections stored as JSON lists of strings
    whats_new: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    changed_functionality: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    improvements: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    problems_solved: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    
    # Whether this release is publicly visible
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Sorting order / sequence number
    order_index: Mapped[int] = mapped_column(nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "component": self.component,
            "version": self.version,
            "date": self.release_date,
            "status": self.status,
            "tag": self.tag,
            "commit": self.commit_hash,
            "summary": self.summary,
            "info": self.info,
            "whatsNew": self.whats_new or [],
            "changedFunctionality": self.changed_functionality or [],
            "improvements": self.improvements or [],
            "problemsSolved": self.problems_solved or [],
            "isActive": self.is_active,
            "orderIndex": self.order_index,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
