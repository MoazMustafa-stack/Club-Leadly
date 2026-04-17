import asyncio
import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token
from ..database import get_db
from ..dependencies import CurrentUser, get_current_user, require_organiser
from ..limiter import limiter
from ..models import ActivityLog, ActivityTypeEnum, Club, Membership, RoleEnum, User
from ..services.push import notify_member_joined
from ..schemas import (
    ActivityLogResponse,
    ClubDetailResponse,
    ClubResponse,
    CreateClubRequest,
    JoinClubRequest,
    MemberResponse,
    TokenResponse,
)

router = APIRouter(prefix="/clubs", tags=["clubs"])


@router.post("", response_model=TokenResponse)
async def create_club(
    body: CreateClubRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new club.

    Any authenticated user can call this. The creator becomes the organiser.
    Returns a NEW JWT with club_id and role=organiser so subsequent requests
    are club-scoped.
    """
    # Generate a unique 6-char join code (retry once on collision)
    for _ in range(2):
        join_code = secrets.token_hex(3).upper()
        existing = await db.execute(
            select(Club).where(Club.join_code == join_code)
        )
        if existing.scalar_one_or_none() is None:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate unique join code, please retry",
        )

    club = Club(name=body.name, join_code=join_code)
    db.add(club)
    await db.flush()

    membership = Membership(
        club_id=club.id,
        user_id=current_user.user_id,
        role=RoleEnum.organiser,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(club)

    token = create_access_token(
        {
            "sub": str(current_user.user_id),
            "club_id": str(club.id),
            "role": RoleEnum.organiser.value,
            "email": current_user.email,
        }
    )
    return TokenResponse(access_token=token)


@router.post("/join", response_model=TokenResponse)
@limiter.limit("10/hour")
async def join_club(
    request: Request,
    body: JoinClubRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join an existing club via a 6-character join code.

    Any authenticated user can call this. Returns a NEW JWT with club_id
    and role=member.
    """
    result = await db.execute(
        select(Club).where(Club.join_code == body.join_code)
    )
    club = result.scalar_one_or_none()
    if club is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid join code",
        )

    existing_membership = await db.execute(
        select(Membership).where(
            Membership.club_id == club.id,
            Membership.user_id == current_user.user_id,
        )
    )
    if existing_membership.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member",
        )

    membership = Membership(
        club_id=club.id,
        user_id=current_user.user_id,
        role=RoleEnum.member,
    )
    db.add(membership)
    await db.commit()

    # Log the join activity
    user_result_name = await db.execute(
        select(User.full_name).where(User.id == current_user.user_id)
    )
    joining_name_for_log = user_result_name.scalar_one_or_none() or "Someone"
    db.add(ActivityLog(
        club_id=club.id,
        user_id=current_user.user_id,
        activity_type=ActivityTypeEnum.member_joined,
        description=f"{joining_name_for_log} joined the club",
    ))
    await db.commit()

    # Notify the organiser that a new member joined
    organiser_result = await db.execute(
        select(Membership).where(
            Membership.club_id == club.id,
            Membership.role == RoleEnum.organiser,
        )
    )
    organiser_mem = organiser_result.scalar_one_or_none()
    user_result = await db.execute(
        select(User.full_name).where(User.id == current_user.user_id)
    )
    joining_name = user_result.scalar_one_or_none() or "Someone"
    if organiser_mem:
        asyncio.create_task(
            notify_member_joined(
                new_member_name=joining_name,
                organiser_user_id=str(organiser_mem.user_id),
                club_id=str(club.id),
            )
        )

    token = create_access_token(
        {
            "sub": str(current_user.user_id),
            "club_id": str(club.id),
            "role": RoleEnum.member.value,
            "email": current_user.email,
        }
    )
    return TokenResponse(access_token=token)


def _require_club(current_user: CurrentUser) -> None:
    """Raise 400 if the user is not in a club."""
    if current_user.club_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in a club",
        )


@router.delete("/leave", status_code=status.HTTP_200_OK)
async def leave_club(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave the current club.

    Members can always leave. Organisers can only leave if there is at
    least one other organiser remaining (to prevent orphaned clubs).
    Returns a new token without club_id so the user lands on the
    create/join flow.
    """
    _require_club(current_user)

    result = await db.execute(
        select(Membership).where(
            Membership.club_id == current_user.club_id,
            Membership.user_id == current_user.user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=404, detail="Membership not found")

    # If the user is an organiser, ensure there's at least one other organiser
    if membership.role == RoleEnum.organiser:
        other_organisers = await db.execute(
            select(Membership).where(
                Membership.club_id == current_user.club_id,
                Membership.role == RoleEnum.organiser,
                Membership.user_id != current_user.user_id,
            )
        )
        if other_organisers.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are the only organiser. Promote another member before leaving.",
            )

    # Log leave activity before deleting membership
    leave_name_result = await db.execute(
        select(User.full_name).where(User.id == current_user.user_id)
    )
    leave_name = leave_name_result.scalar_one_or_none() or "Someone"
    db.add(ActivityLog(
        club_id=current_user.club_id,
        user_id=current_user.user_id,
        activity_type=ActivityTypeEnum.member_left,
        description=f"{leave_name} left the club",
    ))

    await db.delete(membership)
    await db.commit()

    # Issue a new token without club_id so user returns to create/join screen
    token = create_access_token(
        {
            "sub": str(current_user.user_id),
            "email": current_user.email,
        }
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=ClubDetailResponse)
async def get_club_details(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current club details and full member list.

    Requires auth + club_id in token. Returns club info with members
    ordered by total_points DESC.
    """
    _require_club(current_user)

    club_result = await db.execute(
        select(Club).where(Club.id == current_user.club_id)
    )
    club = club_result.scalar_one_or_none()
    if club is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    members_result = await db.execute(
        select(Membership, User)
        .join(User, Membership.user_id == User.id)
        .where(Membership.club_id == current_user.club_id)
        .order_by(Membership.total_points.desc())
    )
    rows = members_result.all()

    members = [
        MemberResponse(
            user_id=m.user_id,
            full_name=u.full_name,
            avatar_initials=u.avatar_initials,
            role=m.role.value,
            total_points=m.total_points,
            joined_at=m.joined_at,
        )
        for m, u in rows
    ]

    return ClubDetailResponse(
        club=ClubResponse.model_validate(club),
        members=members,
        total_members=len(members),
    )


@router.get("/members", response_model=list[MemberResponse])
async def get_members(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Get members of the current club for dropdowns, etc.

    Requires auth + club_id in token. Returns members ordered by
    full_name ASC.
    """
    _require_club(current_user)

    result = await db.execute(
        select(Membership, User)
        .join(User, Membership.user_id == User.id)
        .where(Membership.club_id == current_user.club_id)
        .order_by(User.full_name.asc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    return [
        MemberResponse(
            user_id=m.user_id,
            full_name=u.full_name,
            avatar_initials=u.avatar_initials,
            role=m.role.value,
            total_points=m.total_points,
            joined_at=m.joined_at,
        )
        for m, u in rows
    ]


# ---------------------------------------------------------------------------
# Member management (organiser only)
# ---------------------------------------------------------------------------

@router.delete("/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_member(
    user_id: UUID,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the club. Organiser only.

    Cannot remove yourself (the organiser).
    """
    _require_club(current_user)

    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    result = await db.execute(
        select(Membership).where(
            Membership.club_id == current_user.club_id,
            Membership.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=404, detail="Member not found in this club")

    await db.delete(membership)
    await db.commit()
    return {"detail": "Member removed"}


@router.patch("/members/{user_id}/role", status_code=status.HTTP_200_OK)
async def promote_member(
    user_id: UUID,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Promote a member to organiser. Organiser only.

    Cannot promote yourself.
    """
    _require_club(current_user)

    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot promote yourself")

    result = await db.execute(
        select(Membership).where(
            Membership.club_id == current_user.club_id,
            Membership.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=404, detail="Member not found in this club")

    if membership.role == RoleEnum.organiser:
        raise HTTPException(status_code=400, detail="User is already an organiser")

    membership.role = RoleEnum.organiser

    # Log promote activity
    promoter_result = await db.execute(
        select(User.full_name).where(User.id == current_user.user_id)
    )
    promoter_name = promoter_result.scalar_one_or_none() or "An organiser"
    promoted_result = await db.execute(
        select(User.full_name).where(User.id == user_id)
    )
    promoted_name = promoted_result.scalar_one_or_none() or "a member"
    db.add(ActivityLog(
        club_id=current_user.club_id,
        user_id=current_user.user_id,
        activity_type=ActivityTypeEnum.member_promoted,
        description=f"{promoter_name} promoted {promoted_name} to organiser",
        target_user_id=user_id,
    ))

    await db.commit()
    return {"detail": "Member promoted to organiser"}


# ---------------------------------------------------------------------------
# Activity feed
# ---------------------------------------------------------------------------

@router.get("/me/activity", response_model=list[ActivityLogResponse])
async def get_activity_feed(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Get the activity feed for the current club."""
    _require_club(current_user)

    # Alias for target user join
    TargetUser = User.__table__.alias("target_user")

    result = await db.execute(
        select(ActivityLog, User.full_name, TargetUser.c.full_name)
        .join(User, ActivityLog.user_id == User.id)
        .outerjoin(TargetUser, ActivityLog.target_user_id == TargetUser.c.id)
        .where(ActivityLog.club_id == current_user.club_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    return [
        ActivityLogResponse(
            id=log.id,
            club_id=log.club_id,
            user_id=log.user_id,
            user_name=user_name,
            activity_type=log.activity_type.value,
            description=log.description,
            target_user_id=log.target_user_id,
            target_user_name=target_name,
            created_at=log.created_at,
        )
        for log, user_name, target_name in rows
    ]
