"""add_enterprise_hierarchy_and_dlp_models

Revision ID: c8a91f34e201
Revises: b68b2d18c769
Create Date: 2026-08-29 10:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c8a91f34e201'
down_revision = 'b68b2d18c769'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Update Organisations table with domain verification & SIEM configs
    op.add_column('organisations', sa.Column('domain', sa.String(length=255), nullable=True))
    op.add_column('organisations', sa.Column('status', sa.String(length=50), server_default='ACTIVE', nullable=False))
    op.add_column('organisations', sa.Column('dns_txt_token', sa.String(length=100), nullable=True))
    op.add_column('organisations', sa.Column('domain_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('organisations', sa.Column('siem_webhook_url', sa.String(length=500), nullable=True))
    op.add_column('organisations', sa.Column('siem_webhook_secret', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_organisations_domain'), 'organisations', ['domain'], unique=True)

    # 2. Create Departments table (Tier 3 employee categories)
    op.create_table('departments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_departments_org_id'), 'departments', ['org_id'], unique=False)

    # 3. Update Users table with department_id FK
    op.add_column('users', sa.Column('department_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_users_department_id', 'users', 'departments', ['department_id'], ['id'], ondelete='SET NULL')

    # 4. Update Policies table with department scoping, category, action, and is_disabled_by_org
    op.add_column('policies', sa.Column('department_id', sa.String(), nullable=True))
    op.add_column('policies', sa.Column('category', sa.String(length=50), server_default='CUSTOM_REGEX', nullable=False))
    op.add_column('policies', sa.Column('action', sa.String(length=50), server_default='BLOCK', nullable=False))
    op.add_column('policies', sa.Column('severity', sa.String(length=20), server_default='HIGH', nullable=False))
    op.add_column('policies', sa.Column('is_disabled_by_org', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.create_foreign_key('fk_policies_department_id', 'policies', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_policies_department_id'), 'policies', ['department_id'], unique=False)

    # 5. Create DLP Incidents table (Incident audit stream)
    op.create_table('dlp_incidents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('department_id', sa.String(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('policy_id', sa.String(), nullable=False),
        sa.Column('target_app', sa.String(length=100), nullable=False),
        sa.Column('action_taken', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('redacted_snippet', sa.Text(), nullable=False),
        sa.Column('override_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['org_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dlp_incidents_org_id'), 'dlp_incidents', ['org_id'], unique=False)
    op.create_index(op.f('ix_dlp_incidents_department_id'), 'dlp_incidents', ['department_id'], unique=False)
    op.create_index(op.f('ix_dlp_incidents_user_id'), 'dlp_incidents', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('dlp_incidents')
    op.drop_index(op.f('ix_policies_department_id'), table_name='policies')
    op.drop_constraint('fk_policies_department_id', 'policies', type_='foreignkey')
    op.drop_column('policies', 'is_disabled_by_org')
    op.drop_column('policies', 'severity')
    op.drop_column('policies', 'action')
    op.drop_column('policies', 'category')
    op.drop_column('policies', 'department_id')
    
    op.drop_constraint('fk_users_department_id', 'users', type_='foreignkey')
    op.drop_column('users', 'department_id')
    
    op.drop_index(op.f('ix_departments_org_id'), table_name='departments')
    op.drop_table('departments')
    
    op.drop_index(op.f('ix_organisations_domain'), table_name='organisations')
    op.drop_column('organisations', 'siem_webhook_secret')
    op.drop_column('organisations', 'siem_webhook_url')
    op.drop_column('organisations', 'domain_verified_at')
    op.drop_column('organisations', 'dns_txt_token')
    op.drop_column('organisations', 'status')
    op.drop_column('organisations', 'domain')
