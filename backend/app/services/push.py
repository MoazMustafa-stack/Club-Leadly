import logging
from typing import Literal

import httpx
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import NotificationPreference, PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

NotificationType = Literal[
    "task_assigned",
    "points_awarded",
    "task_due_soon",
    "member_joined",
]


async def _get_push_tokens_for_users(
    user_ids: list[str],
    club_id: str,
) -> list[str]:
    """Return Expo push token strings for the given users in a club.

    Opens its own DB session so it is safe to call from background tasks.
    """
    from uuid import UUID

    uid_uuids = [UUID(u) for u in user_ids]
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(PushToken.token).where(
                PushToken.club_id == UUID(club_id),
                PushToken.user_id.in_(uid_uuids),
            )
        )
        return list(result.scalars().all())


async def _filter_opted_in_users(
    user_ids: list[str],
    notification_type: NotificationType,
) -> list[str]:
    """Return only user_ids that have the given notification type enabled."""
    from uuid import UUID

    uid_uuids = [UUID(u) for u in user_ids]
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id.in_(uid_uuids),
            )
        )
        prefs = {str(p.user_id): p for p in result.scalars().all()}

    opted_in = []
    for uid in user_ids:
        pref = prefs.get(uid)
        # No preference row means all defaults (True)
        if pref is None or getattr(pref, notification_type, True):
            opted_in.append(uid)
    return opted_in


async def send_push_notifications(
    tokens: list[str],
    title: str,
    body: str,
    data: dict,
) -> None:
    """Send push notifications via the Expo Push API. Failures are logged, never raised."""
    if not tokens:
        return

    messages = [
        {
            "to": tok,
            "title": title,
            "body": body,
            "data": data,
            "sound": "default",
            "badge": 1,
            "priority": "high",
        }
        for tok in tokens
    ]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Expo accepts batches of up to 100
            for i in range(0, len(messages), 100):
                batch = messages[i : i + 100]
                resp = await client.post(
                    EXPO_PUSH_URL,
                    json=batch,
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code != 200:
                    logger.error("Expo push API returned %s: %s", resp.status_code, resp.text)
                else:
                    resp_data = resp.json().get("data", [])
                    for ticket in resp_data:
                        if ticket.get("status") == "error":
                            logger.error("Expo push error: %s", ticket)
    except Exception:
        logger.exception("Failed to send push notifications")


# ── Convenience functions called from route handlers ──────────────────────


async def notify_task_assigned(
    task_title: str,
    point_value: int,
    assigned_to_user_id: str,
    club_id: str,
    task_id: str,
) -> None:
    opted_in = await _filter_opted_in_users([assigned_to_user_id], "task_assigned")
    if not opted_in:
        return
    tokens = await _get_push_tokens_for_users(opted_in, club_id)
    await send_push_notifications(
        tokens=tokens,
        title="New task assigned",
        body=f'"{task_title}" — worth {point_value} pts',
        data={"type": "task_assigned", "taskId": task_id, "clubId": club_id},
    )


async def notify_points_awarded(
    recipient_user_id: str,
    delta: int,
    reason: str,
    club_id: str,
) -> None:
    opted_in = await _filter_opted_in_users([recipient_user_id], "points_awarded")
    if not opted_in:
        return
    tokens = await _get_push_tokens_for_users(opted_in, club_id)
    verb = "awarded" if delta > 0 else "deducted"
    await send_push_notifications(
        tokens=tokens,
        title=f"{abs(delta)} points {verb}",
        body=reason,
        data={"type": "points_awarded", "clubId": club_id},
    )


async def notify_member_joined(
    new_member_name: str,
    organiser_user_id: str,
    club_id: str,
) -> None:
    opted_in = await _filter_opted_in_users([organiser_user_id], "member_joined")
    if not opted_in:
        return
    tokens = await _get_push_tokens_for_users(opted_in, club_id)
    await send_push_notifications(
        tokens=tokens,
        title="New member joined",
        body=f"{new_member_name} just joined your club",
        data={"type": "member_joined", "clubId": club_id},
    )


async def notify_task_due_soon(
    task_title: str,
    assigned_to_user_id: str,
    club_id: str,
    task_id: str,
) -> None:
    opted_in = await _filter_opted_in_users([assigned_to_user_id], "task_due_soon")
    if not opted_in:
        return
    tokens = await _get_push_tokens_for_users(opted_in, club_id)
    await send_push_notifications(
        tokens=tokens,
        title="Task due soon",
        body=f'"{task_title}" is due within 24 hours',
        data={"type": "task_due_soon", "taskId": task_id, "clubId": club_id},
    )
