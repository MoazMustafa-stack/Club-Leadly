from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token, hash_password, verify_password
from ..database import get_db
from ..models import Membership, User
from ..schemas import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _derive_initials(full_name: str) -> str:
    """Derive 2-char avatar initials from a full name.

    - Two or more words: first letter of first word + first letter of last word.
    - Single word: first two letters.
    Always uppercased.
    """
    parts = full_name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return full_name[:2].upper()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account.

    Anyone can call this. Returns a JWT with club_id=None (user hasn't
    joined a club yet).
    """
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        avatar_initials=_derive_initials(body.full_name),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(
        {
            "sub": str(user.id),
            "club_id": None,
            "role": None,
            "email": user.email,
        }
    )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Log in with email and password.

    Anyone can call this. Returns a JWT containing the user's most recent
    club_id and role if they have a membership, otherwise both are None.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Find the user's most recent membership to embed club context in the JWT
    membership_result = await db.execute(
        select(Membership)
        .where(Membership.user_id == user.id)
        .order_by(Membership.joined_at.desc())
        .limit(1)
    )
    membership = membership_result.scalar_one_or_none()

    club_id = str(membership.club_id) if membership else None
    role = membership.role.value if membership else None

    token = create_access_token(
        {
            "sub": str(user.id),
            "club_id": club_id,
            "role": role,
            "email": user.email,
        }
    )
    return TokenResponse(access_token=token)
