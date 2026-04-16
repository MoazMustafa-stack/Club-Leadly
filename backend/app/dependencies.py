import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import decode_access_token
from .database import get_db
from .models import RevokedToken

security = HTTPBearer()


class CurrentUser(BaseModel):
    user_id: uuid.UUID
    club_id: uuid.UUID | None = None
    role: str | None = None
    email: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    """Extract and validate the Bearer token, returning the current user context."""
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Check token revocation (logout blacklist)
    jti = payload.get("jti")
    if jti:
        revoked = await db.execute(
            select(RevokedToken.jti).where(RevokedToken.jti == jti)
        )
        if revoked.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )

    club_id_str = payload.get("club_id")
    return CurrentUser(
        user_id=uuid.UUID(user_id),
        club_id=uuid.UUID(club_id_str) if club_id_str else None,
        role=payload.get("role"),
        email=payload.get("email", ""),
    )


async def require_organiser(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Dependency that ensures the current user has the 'organiser' role."""
    if current_user.role != "organiser":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organiser role required",
        )
    return current_user
