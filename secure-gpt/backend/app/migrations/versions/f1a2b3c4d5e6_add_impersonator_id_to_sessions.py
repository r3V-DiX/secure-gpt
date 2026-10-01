"""Add impersonator_id to sessions table for tenant impersonation

Revision ID: f1a2b3c4d5e6
Revises: d3cb567bfdc7
Create Date: 2026-09-30 16:41:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'd3cb567bfdc7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use execute with IF NOT EXISTS for resilience across postgres / sqlite
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS impersonator_id VARCHAR"))
    try:
        conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_sessions_impersonator_id ON sessions (impersonator_id)"))
    except Exception:
        pass


def downgrade() -> None:
    conn = op.get_bind()
    try:
        conn.execute(sa.text("DROP INDEX IF EXISTS ix_sessions_impersonator_id"))
        conn.execute(sa.text("ALTER TABLE sessions DROP COLUMN IF EXISTS impersonator_id"))
    except Exception:
        pass
