"""Update every stored policy version for the supported platform set.

Revision ID: e91c7b32a405
Revises: c8a91f34e201
"""

from alembic import op
import sqlalchemy as sa

revision = 'e91c7b32a405'
down_revision = 'c8a91f34e201'
branch_labels = None
depends_on = None

RETIRED = {'phind', 'notion', 'jasper', 'copy-ai'}


def migrate_platforms(config: dict) -> dict:
    if not isinstance(config.get('monitoredPlatforms'), list):
        return config
    updated = dict(config)
    platforms = [value for value in config['monitoredPlatforms'] if value not in RETIRED]
    if 'google-ai-mode' not in platforms and 'gemini' in platforms:
        platforms.insert(platforms.index('gemini') + 1, 'google-ai-mode')
    updated['monitoredPlatforms'] = platforms
    return updated


def upgrade() -> None:
    policies = sa.table('policies', sa.column('id', sa.String), sa.column('config', sa.JSON))
    connection = op.get_bind()
    rows = connection.execute(sa.select(policies.c.id, policies.c.config)).mappings()
    for row in rows:
        config = row['config']
        if not isinstance(config, dict):
            continue
        updated = migrate_platforms(config)
        if updated != config:
            connection.execute(
                policies.update().where(policies.c.id == row['id']).values(config=updated)
            )


def downgrade() -> None:
    # Historical platform choices cannot be reconstructed after removal.
    pass
