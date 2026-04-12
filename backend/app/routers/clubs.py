import asyncio
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token
from ..database import get_db
from ..dependencies import CurrentUser, get_current_user
from ..models import Club, Membership, RoleEnum, User
from ..services.push import notify_member_joined
from ..schemas import (
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
async def join_club(
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
                db=db,
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
