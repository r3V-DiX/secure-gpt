"""
Telemetry generator helpers for test environment seeding.
"""
import hashlib
import random
import uuid
from datetime import timedelta
from app.models.audit_log import AuditLog
from app.commands.reset_and_seed_test_data import PLATFORMS, DETECTION_SCENARIOS


def make_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def generate_telemetry_logs(all_target_users, now):
    """Generate 260+ rich audit logs spread across 30 days."""
    logs = []
    for target in all_target_users:
        u = target["user"]
        org_id = target["org_id"]
        count = target["count"]

        for i in range(count):
            days_ago = random.choices(
                [random.randint(0, 3), random.randint(4, 10), random.randint(11, 20), random.randint(21, 29)],
                weights=[0.4, 0.3, 0.2, 0.1],
            )[0]
            hours_ago = random.randint(0, 23)
            mins_ago = random.randint(0, 59)
            event_time = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

            scen = random.choice(DETECTION_SCENARIOS)
            plat = random.choice(PLATFORMS)
            action = random.choice(scen["actions"])

            log = AuditLog(
                id=str(uuid.uuid4()),
                event_id=f"evt-{u.id[:8]}-{days_ago:02d}{hours_ago:02d}-{uuid.uuid4().hex[:6]}",
                user_id=u.id,
                user_email=u.email,
                org_id=org_id,
                action_taken=action,
                category_triggered=scen["cat"],
                detection_type=scen["det_type"],
                detection_tier=scen["tier"],
                llm_platform=plat["name"],
                domain=plat["domain"],
                match_count=random.randint(1, 4),
                snippet_hash=make_hash(f"{u.email}-{event_time}-{scen['det_type']}-{i}"),
                entity_types=scen["entities"],
                severities=scen["severities"],
                timestamp=event_time,
            )
            logs.append(log)
    return logs
