"""Add one-use impersonation handoffs and session restoration.

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
"""

from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "previous_session_id" not in {column["name"] for column in inspector.get_columns("sessions")}:
        op.add_column("sessions", sa.Column("previous_session_id", sa.String(64), nullable=True))
    if inspector.has_table("impersonation_handoffs"):
        return
    op.create_table(
        "impersonation_handoffs",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("target_user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("impersonator_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("org_id", sa.String(), sa.ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("impersonation_handoffs"):
        op.drop_table("impersonation_handoffs")
    if "previous_session_id" in {column["name"] for column in inspector.get_columns("sessions")}:
        op.drop_column("sessions", "previous_session_id")
