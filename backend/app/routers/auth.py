from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token, decode_access_token, hash_password, verify_password
from ..database import get_db
from ..dependencies import CurrentUser, get_current_user
from ..limiter import limiter
from ..models import Membership, PasswordResetToken, RevokedToken, User
from ..schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)

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
@limiter.limit("10/hour")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
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
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
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


# ---------------------------------------------------------------------------
# Logout & refresh
# ---------------------------------------------------------------------------

_bearer = HTTPBearer()


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Revoke the current access token (logout)."""
    payload = decode_access_token(credentials.credentials)
    jti = payload.get("jti")
    exp = payload.get("exp")
    if not jti or not exp:
        raise HTTPException(status_code=400, detail="Token missing jti/exp claims")

    from datetime import datetime, timezone

    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

    existing = await db.execute(
        select(RevokedToken.jti).where(RevokedToken.jti == jti)
    )
    if existing.scalar_one_or_none() is None:
        db.add(RevokedToken(jti=jti, expires_at=expires_at))
        await db.commit()

    return {"detail": "Logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Issue a fresh token and revoke the old one."""
    old_payload = decode_access_token(credentials.credentials)
    old_jti = old_payload.get("jti")
    old_exp = old_payload.get("exp")

    # Revoke old token
    if old_jti and old_exp:
        from datetime import datetime, timezone

        expires_at = datetime.fromtimestamp(old_exp, tz=timezone.utc)
        existing = await db.execute(
            select(RevokedToken.jti).where(RevokedToken.jti == old_jti)
        )
        if existing.scalar_one_or_none() is None:
            db.add(RevokedToken(jti=old_jti, expires_at=expires_at))

    # Re-fetch membership for up-to-date club context
    membership_result = await db.execute(
        select(Membership)
        .where(Membership.user_id == current_user.user_id)
        .order_by(Membership.joined_at.desc())
        .limit(1)
    )
    membership = membership_result.scalar_one_or_none()

    new_token = create_access_token(
        {
            "sub": str(current_user.user_id),
            "club_id": str(membership.club_id) if membership else None,
            "role": membership.role.value if membership else None,
            "email": current_user.email,
        }
    )
    await db.commit()
    return TokenResponse(access_token=new_token)


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request a password reset code.

    Always returns 200 to avoid leaking whether an email is registered.
    The 6-digit code is valid for 15 minutes.
    """
    import secrets
    from datetime import datetime, timedelta, timezone

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is not None:
        code = secrets.token_hex(3).upper()  # 6 hex chars
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.add(PasswordResetToken(
            user_id=user.id,
            code=code,
            expires_at=expires_at,
        ))
        await db.commit()

        # Send email (best-effort — log code in dev)
        import logging
        import os

        logger = logging.getLogger("password_reset")
        smtp_host = os.getenv("SMTP_HOST")
        if smtp_host:
            from email.message import EmailMessage
            import aiosmtplib

            msg = EmailMessage()
            msg["Subject"] = "Club Leadly — Password Reset Code"
            msg["From"] = os.getenv("SMTP_FROM", "noreply@clubleadly.com")
            msg["To"] = body.email
            msg.set_content(
                f"Your password reset code is: {code}\n\n"
                "This code expires in 15 minutes. If you didn't request this, "
                "you can safely ignore this email."
            )
            try:
                await aiosmtplib.send(
                    msg,
                    hostname=smtp_host,
                    port=int(os.getenv("SMTP_PORT", "587")),
                    username=os.getenv("SMTP_USER"),
                    password=os.getenv("SMTP_PASS"),
                    start_tls=True,
                )
            except Exception:
                logger.exception("Failed to send reset email to %s", body.email)
        else:
            logger.info("Password reset code for %s: %s (no SMTP configured)", body.email, code)

    return {"detail": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the emailed code."""
    from datetime import datetime, timezone

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    token_result = await db.execute(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.code == body.code,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
        .order_by(PasswordResetToken.created_at.desc())
        .limit(1)
    )
    reset_token = token_result.scalar_one_or_none()
    if reset_token is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    reset_token.used = True
    user.hashed_password = hash_password(body.new_password)
    await db.commit()

    return {"detail": "Password has been reset successfully"}
