from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import CurrentUser, get_current_user, require_organiser
from ..models import Membership, PointLog, User
from ..schemas import AwardPointsRequest, LeaderboardEntry, PointLogResponse

router = APIRouter(prefix="/points", tags=["points"])


def _require_club(current_user: CurrentUser) -> UUID:
    if current_user.club_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in a club",
        )
    return current_user.club_id


@router.post("", response_model=PointLogResponse, status_code=status.HTTP_201_CREATED)
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this club",
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


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the club leaderboard ordered by total_points descending."""
    club_id = _require_club(current_user)

    result = await db.execute(
        select(Membership, User)
        .join(User, Membership.user_id == User.id)
        .where(Membership.club_id == club_id)
        .order_by(Membership.total_points.desc())
    )
    entries = []
    for rank, (mem, user) in enumerate(result.all(), start=1):
        entries.append(LeaderboardEntry(
            user_id=user.id,
            full_name=user.full_name,
            avatar_initials=user.avatar_initials,
            total_points=mem.total_points,
            rank=rank,
        ))
    return entries


@router.get("/log", response_model=list[PointLogResponse])
async def point_log(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the full point log for the current club, newest first."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(PointLog)
        .where(PointLog.club_id == club_id)
        .order_by(PointLog.created_at.desc())
    )
    return result.scalars().all()
