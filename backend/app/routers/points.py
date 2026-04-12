from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import CurrentUser, get_current_user, require_organiser
from ..models import Membership, PointLog, Task, TaskStatusEnum, User
from ..schemas import (
    AwardPointsRequest,
    LeaderboardEntry,
    LeaderboardResponse,
    PointLogResponse,
)

router = APIRouter(prefix="/points", tags=["points"])


def _require_club(current_user: CurrentUser) -> UUID:
    if current_user.club_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in a club",
        )
    return current_user.club_id


@router.post("/award", response_model=PointLogResponse, status_code=status.HTTP_201_CREATED)
async def award_points(
    body: AwardPointsRequest,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Manually award or deduct points. Organiser only.

    Positive delta = award, negative delta = deduction.
    """
    club_id = _require_club(current_user)

    mem_result = await db.execute(
        select(Membership).where(
            Membership.club_id == club_id,
            Membership.user_id == body.user_id,
        )
    )
    membership = mem_result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this club",
        )

    membership.total_points += body.delta

    log = PointLog(
        club_id=club_id,
        user_id=body.user_id,
        delta=body.delta,
        reason=body.reason,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/history", response_model=list[PointLogResponse])
async def point_history(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_id: UUID | None = Query(default=None),
):
    """Get point history for a member.

    Organiser can query any member via ?user_id=.
    Member can only query their own history (user_id omitted or matches self).
    """
    club_id = _require_club(current_user)

    target_id = user_id if user_id is not None else current_user.user_id

    if current_user.role != "organiser" and target_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this resource",
        )

    result = await db.execute(
        select(PointLog)
        .where(PointLog.club_id == club_id, PointLog.user_id == target_id)
        .order_by(PointLog.created_at.desc())
    )
    return result.scalars().all()


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def leaderboard(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the club leaderboard ordered by total_points descending."""
    club_id = _require_club(current_user)

    # Members + user info
    result = await db.execute(
        select(Membership, User)
        .join(User, Membership.user_id == User.id)
        .where(Membership.club_id == club_id)
        .order_by(Membership.total_points.desc())
    )

    # Completed tasks count per user in this club
    tasks_count_result = await db.execute(
        select(Task.assigned_to_user_id, func.count(Task.id))
        .where(
            Task.club_id == club_id,
            Task.status == TaskStatusEnum.completed,
            Task.assigned_to_user_id.isnot(None),
        )
        .group_by(Task.assigned_to_user_id)
    )
    tasks_completed_map = {row[0]: row[1] for row in tasks_count_result.all()}

    entries = []
    for rank, (mem, user) in enumerate(result.all(), start=1):
        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            full_name=user.full_name,
            avatar_initials=user.avatar_initials,
            total_points=mem.total_points,
            tasks_completed=tasks_completed_map.get(user.id, 0),
        ))

    return LeaderboardResponse(
        club_id=club_id,
        entries=entries,
        generated_at=datetime.now(timezone.utc),
    )
