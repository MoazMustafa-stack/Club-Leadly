import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import and_, select

from app.database import AsyncSessionLocal
from app.models import Task, TaskStatusEnum
from app.services.push import notify_task_due_soon

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_due_soon_tasks() -> None:
    """Find pending tasks due within 24 hours and notify the assignee."""
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        window_end = now + timedelta(hours=24)
        result = await db.execute(
            select(Task).where(
                and_(
                    Task.status == TaskStatusEnum.pending,
                    Task.assigned_to_user_id.isnot(None),
                    Task.due_at.isnot(None),
                    Task.due_at >= now,
                    Task.due_at <= window_end,
                )
            )
        )
        tasks = result.scalars().all()
        for task in tasks:
            try:
                await notify_task_due_soon(
                    task_title=task.title,
                    assigned_to_user_id=str(task.assigned_to_user_id),
                    club_id=str(task.club_id),
                    task_id=str(task.id),
                    db=db,
                )
            except Exception:
                logger.exception("Failed to notify due-soon for task %s", task.id)


def start_scheduler() -> None:
    scheduler.add_job(
        check_due_soon_tasks,
        trigger=IntervalTrigger(hours=1),
        id="due_soon_check",
        replace_existing=True,
    )
    scheduler.start()
