"""Synchronize system releases for v1.3.0 and baseline history.

Revision ID: d3cb567bfdc7
Revises: e91c7b32a405
Create Date: 2026-09-30 14:06:00
"""

from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime, timezone

# revision identifiers, used by Alembic.
revision = 'd3cb567bfdc7'
down_revision = 'e91c7b32a405'
branch_labels = None
depends_on = None

NEW_RELEASES = [
    {
        "component": "extension",
        "version": "1.3.0",
        "release_date": "September 30, 2026",
        "status": "Production Stable",
        "tag": "New Tab Dashboard Override, Google AI Mode Interception & Dynamic Tab Activation",
        "commit_hash": "prod-v1.3.0-ext",
        "summary": "Introduced dedicated Chrome new-tab dashboard override, native Google AI Mode interception, background tab activation on login, and dynamic SPA state reconciliation.",
        "info": "SecureGPT Chrome Extension v1.3.0 significantly elevates platform coverage with Google AI Mode detection, brings a native high-speed New Tab experience, dynamically activates inspection on already-open tabs upon login, and introduces responsive SPA navigation watchers.",
        "whats_new": [
            "Chrome New Tab Override: fast, secure, native dashboard launcher right inside every new browser tab.",
            "Google AI Mode Interception: custom input guard on google.com targeting AI Mode queries before dispatch.",
            "Dynamic Open Tab Activation: automatic injection and listener activation on previously unmonitored tabs immediately upon enterprise authentication.",
            "Expanded AI Platform Routing: broadened support for alternate domains across Copilot, v0, and Perplexity.",
        ],
        "changed_functionality": [
            "Refactored content interceptor lifecycle to observe SPA client-side navigations (popstate, hashchange, navigation entry change).",
            "Pruned legacy retired AI domains across manifest permissions and platform registries.",
            "Standardized ONNX worker initialization directly on WebAssembly runtime for reliable offscreen execution.",
        ],
        "improvements": [
            "Instant synchronization of policy alterations from browser storage without tab reloads.",
            "Streamlined memory and event teardown when navigating away from monitored AI platforms.",
        ],
        "problems_solved": [
            "Resolved issue where users logging in with pre-existing tabs open had unprotected prompts.",
            "Eliminated WebGPU adapter probe warnings and failures inside Chrome offscreen documents.",
        ],
        "order_index": 1,
    },
    {
        "component": "extension",
        "version": "1.2.4",
        "release_date": "September 29, 2026",
        "status": "Production Stable",
        "tag": "Image OCR Bounding Box Transformation & Upload Policy Enforcement",
        "commit_hash": "prod-v1.2.4-ext",
        "summary": "Fixed OCR bounding box mapping across rotated and scaled documents, and enforced strict policy actions and masking banners during image uploads and pastes.",
        "info": "SecureGPT Chrome Extension v1.2.4 resolves document scan coordinate mapping across transformed canvas spaces and guarantees full policy action enforcement for image and document drag-and-drop / paste workflows.",
        "whats_new": [
            "Multi-parameter coordinate alignment: forwarded scale, rotation, and dimensions into bbox post-processors for 100% pixel-accurate redaction.",
            "Enforced policy governance on image/document uploads: strict BLOCK, MASK, or WARN_ALLOW evaluation prior to re-injection.",
            "Active upload blocking: immediately removes attachments and displays blocking banners upon detecting critical PII in scanned cards.",
        ],
        "changed_functionality": [
            "Updated file-scanner to evaluate getMostRestrictiveAction across all OCR findings before dispatching images.",
            "Synchronized offscreen document OCR pipeline argument signature with detection engine.",
        ],
        "improvements": [
            "Pixel-perfect Aadhaar, PAN, and identity card black-box redaction overlays.",
            "Accurate notification banners reflecting exact policy actions on image uploads.",
        ],
        "problems_solved": [
            "Fixed bug where rotated or scaled identity cards failed to redact detected PII numbers.",
            "Prevented unredacted image uploads from bypassing policy restrictions when pasted into LLM chats.",
        ],
        "order_index": 2,
    },
]


def upgrade() -> None:
    connection = op.get_bind()

    releases_table = sa.table(
        'system_releases',
        sa.column('id', sa.String(36)),
        sa.column('component', sa.String(32)),
        sa.column('version', sa.String(32)),
        sa.column('release_date', sa.String(64)),
        sa.column('status', sa.String(64)),
        sa.column('tag', sa.String(255)),
        sa.column('commit_hash', sa.String(64)),
        sa.column('summary', sa.Text),
        sa.column('info', sa.Text),
        sa.column('whats_new', sa.JSON),
        sa.column('changed_functionality', sa.JSON),
        sa.column('improvements', sa.JSON),
        sa.column('problems_solved', sa.JSON),
        sa.column('order_index', sa.Integer),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime(timezone=True)),
        sa.column('updated_at', sa.DateTime(timezone=True)),
    )

    existing = connection.execute(
        sa.select(releases_table.c.id, releases_table.c.component, releases_table.c.version)
    ).mappings().all()
    existing_map = {(row['component'], row['version']): row['id'] for row in existing}

    now = datetime.now(timezone.utc)

    # Shift order_index of any pre-existing extension releases >= 2 up by 2 to accommodate 1.3.0 & 1.2.4
    connection.execute(
        releases_table.update()
        .where(
            sa.and_(
                releases_table.c.component == 'extension',
                releases_table.c.version.notin_(['1.3.0', '1.2.4'])
            )
        )
        .values(order_index=releases_table.c.order_index + 2)
    )

    for item in NEW_RELEASES:
        key = (item["component"], item["version"])
        values = {
            "release_date": item["release_date"],
            "status": item["status"],
            "tag": item["tag"],
            "commit_hash": item["commit_hash"],
            "summary": item["summary"],
            "info": item["info"],
            "whats_new": item["whats_new"],
            "changed_functionality": item["changed_functionality"],
            "improvements": item["improvements"],
            "problems_solved": item["problems_solved"],
            "order_index": item["order_index"],
            "is_active": True,
            "updated_at": now,
        }

        if key in existing_map:
            connection.execute(
                releases_table.update()
                .where(releases_table.c.id == existing_map[key])
                .values(**values)
            )
        else:
            values["id"] = str(uuid.uuid4())
            values["component"] = item["component"]
            values["version"] = item["version"]
            values["created_at"] = now
            connection.execute(releases_table.insert().values(**values))


def downgrade() -> None:
    pass
