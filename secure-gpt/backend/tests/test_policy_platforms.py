import pytest
from pydantic import ValidationError
import sqlalchemy as sa

from app.schemas.policy_schema import PIIConfig
from app.services.extension_service import DEFAULT_POLICY_CONFIG
from app.migrations.versions import e91c7b32a405_update_monitored_platforms as migration

migrate_platforms = migration.migrate_platforms


def test_default_policy_includes_separate_google_ai_mode():
    platforms = DEFAULT_POLICY_CONFIG['monitoredPlatforms']
    assert 'gemini' in platforms
    assert 'google-ai-mode' in platforms


@pytest.mark.parametrize('retired', ['phind', 'notion', 'jasper', 'copy-ai'])
def test_retired_platforms_cannot_be_saved(retired):
    config = dict(DEFAULT_POLICY_CONFIG)
    config['monitoredPlatforms'] = [retired]
    with pytest.raises(ValidationError):
        PIIConfig.model_validate(config)


def test_migration_copies_gemini_and_removes_retired_platforms():
    old = {'monitoredPlatforms': ['phind', 'gemini', 'claude', 'copy-ai'], 'version': 7}
    assert migrate_platforms(old) == {
        'monitoredPlatforms': ['gemini', 'google-ai-mode', 'claude'], 'version': 7,
    }
    assert old['monitoredPlatforms'] == ['phind', 'gemini', 'claude', 'copy-ai']


def test_migration_preserves_disabled_gemini_and_existing_ai_mode_choice():
    assert migrate_platforms({'monitoredPlatforms': ['claude']})['monitoredPlatforms'] == ['claude']
    assert migrate_platforms({'monitoredPlatforms': ['gemini', 'google-ai-mode']})['monitoredPlatforms'] == ['gemini', 'google-ai-mode']


def test_migration_rewrites_active_and_historical_policy_rows(monkeypatch):
    engine = sa.create_engine('sqlite:///:memory:')
    metadata = sa.MetaData()
    table = sa.Table(
        'policies', metadata,
        sa.Column('id', sa.String, primary_key=True),
        sa.Column('config', sa.JSON, nullable=False),
    )
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(table.insert(), [
            {'id': 'old', 'config': {'monitoredPlatforms': ['gemini', 'phind']}},
            {'id': 'active', 'config': {'monitoredPlatforms': ['notion', 'claude']}},
        ])
        monkeypatch.setattr(migration.op, 'get_bind', lambda: connection)
        migration.upgrade()
        rows = {row.id: row.config for row in connection.execute(sa.select(table))}
    assert rows['old']['monitoredPlatforms'] == ['gemini', 'google-ai-mode']
    assert rows['active']['monitoredPlatforms'] == ['claude']
