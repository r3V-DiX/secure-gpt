# backend/app/models/department.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    org_id: Mapped[str] = mapped_column(
        String, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    organisation: Mapped["Organisation"] = relationship("Organisation", back_populates="departments")  # noqa: F821
    members: Mapped[list["User"]] = relationship("User", back_populates="department")  # noqa: F821
    policies: Mapped[list["Policy"]] = relationship("Policy", back_populates="department")  # noqa: F821
    incidents: Mapped[list["DLPIncident"]] = relationship("DLPIncident", back_populates="department")  # noqa: F821
