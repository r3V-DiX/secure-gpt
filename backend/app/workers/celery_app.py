# ─────────────────────────────────────────────
# Celery App
# Async task queue configuration
# ─────────────────────────────────────────────

from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "securegpt",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.alert.task",
        "app.workers.report.task",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# ── Scheduled tasks ───────────────────────────
celery_app.conf.beat_schedule = {
    # Check for high-risk users every hour
    "check-high-risk-users": {
        "task": "app.workers.alert.task.check_all_orgs_for_alerts",
        "schedule": crontab(minute=0),         # every hour
    },
    # Purge old logs based on retention policy
    "purge-old-logs": {
        "task": "app.workers.report.task.purge_old_logs",
        "schedule": crontab(hour=2, minute=0),  # daily at 2am UTC
    },
}
