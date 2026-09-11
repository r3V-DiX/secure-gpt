"""add_missing_user_policy_columns

Revision ID: e7f1b2c3d4e5
Revises: bca7c4a947d7
Create Date: 2026-09-11 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7f1b2c3d4e5'
down_revision = 'bca7c4a947d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'deactivated_at' not in user_columns:
        op.add_column('users', sa.Column('deactivated_at', sa.DateTime(timezone=True), nullable=True))
    if 'deactivation_reason' not in user_columns:
        op.add_column('users', sa.Column('deactivation_reason', sa.String(length=50), nullable=True))
    if 'pre_deletion_email_sent' not in user_columns:
        op.add_column('users', sa.Column('pre_deletion_email_sent', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'pre_deletion_email_sent')
    op.drop_column('users', 'deactivation_reason')
    op.drop_column('users', 'deactivated_at')
