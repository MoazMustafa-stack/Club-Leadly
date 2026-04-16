from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import CurrentUser, get_current_user
from ..models import NotificationPreference, PushToken
from ..schemas import (
    NotificationPreferenceResponse,
    RegisterTokenRequest,
    UpdateNotificationPreferenceRequest,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/register-token")
async def register_token(
    body: RegisterTokenRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register or update an Expo push token for the current user + club.

    Uses an upsert pattern — if a row exists for the same (user_id, club_id),
    the token is updated instead of creating a duplicate.
    """
    if current_user.club_id is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in a club",
        )

    platform = body.platform or "unknown"

    # Check for existing row
    result = await db.execute(
        select(PushToken).where(
            PushToken.user_id == current_user.user_id,
            PushToken.club_id == current_user.club_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.token = body.push_token
        existing.platform = platform
    else:
        db.add(
            PushToken(
                user_id=current_user.user_id,
                club_id=current_user.club_id,
                token=body.push_token,
                platform=platform,
            )
        )

    await db.commit()
    return {"status": "registered"}


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's notification preferences (defaults to all enabled)."""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.user_id,
        )
    )
    pref = result.scalar_one_or_none()
    if pref is None:
        return NotificationPreferenceResponse()
    return pref


@router.patch("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    body: UpdateNotificationPreferenceRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update notification preferences for the current user (partial update)."""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.user_id,
        )
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        pref = NotificationPreference(user_id=current_user.user_id)
        db.add(pref)

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(pref, field, value)

    await db.commit()
    await db.refresh(pref)
    return pref
