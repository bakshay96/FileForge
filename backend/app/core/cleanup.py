"""
FileForge — Auto-Cleanup Scheduler
─────────────────────────────────────────────────────────────────────────────
Runs as an APScheduler background job that:
  1. Queries MongoDB for all jobs where expires_at < utcnow()
  2. Deletes the physical output file from disk
  3. Removes the document from MongoDB

Runs every CLEANUP_INTERVAL_MINUTES (default: 5 minutes).
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Module-level scheduler instance
_scheduler: AsyncIOScheduler | None = None


async def cleanup_expired_jobs() -> None:
    """
    Core cleanup coroutine.
    Finds all expired job documents and deletes their files + DB records.
    """
    # Import here to avoid circular imports at module load time
    from app.db.mongodb import get_database

    try:
        db = await get_database()
        collection = db["file_jobs"]
        now = datetime.now(timezone.utc)

        # Find all expired jobs
        expired_cursor = collection.find({"expires_at": {"$lt": now}})
        expired_jobs = await expired_cursor.to_list(length=500)

        if not expired_jobs:
            logger.debug("Cleanup: no expired jobs found.")
            return

        deleted_files = 0
        failed_deletes = 0

        for job in expired_jobs:
            job_id = str(job.get("job_id", job.get("_id", "unknown")))
            output_path_str: str | None = job.get("output_path")

            # Delete physical file from disk
            if output_path_str:
                output_path = Path(output_path_str)
                try:
                    if output_path.exists():
                        output_path.unlink()
                        logger.info(f"Cleanup: deleted file {output_path}")
                        deleted_files += 1
                    else:
                        logger.warning(f"Cleanup: file already missing at {output_path}")
                except OSError as e:
                    logger.error(f"Cleanup: failed to delete {output_path}: {e}")
                    failed_deletes += 1

            # Remove DB document
            await collection.delete_one({"_id": job["_id"]})

        logger.info(
            f"Cleanup cycle complete — "
            f"processed={len(expired_jobs)}, "
            f"files_deleted={deleted_files}, "
            f"failures={failed_deletes}"
        )

    except Exception as e:
        logger.error(f"Cleanup scheduler error: {e}", exc_info=True)


def start_cleanup_scheduler() -> AsyncIOScheduler:
    """
    Initialize and start the APScheduler AsyncIOScheduler.
    Should be called once during FastAPI startup.

    Returns:
        The running scheduler instance.
    """
    global _scheduler

    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(
        func=cleanup_expired_jobs,
        trigger=IntervalTrigger(minutes=settings.cleanup_interval_minutes),
        id="cleanup_expired_jobs",
        name="FileForge Auto-Cleanup",
        replace_existing=True,
        misfire_grace_time=60,  # Allow up to 60s delay before skipping
    )
    _scheduler.start()
    logger.info(
        f"Cleanup scheduler started — "
        f"interval={settings.cleanup_interval_minutes}min, "
        f"expiry={settings.file_expiry_minutes}min"
    )
    return _scheduler


def stop_cleanup_scheduler() -> None:
    """Gracefully shut down the scheduler on FastAPI shutdown."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Cleanup scheduler stopped.")
