import re as _re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------



class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not _re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not _re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not _re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Club schemas
# ---------------------------------------------------------------------------

class CreateClubRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class JoinClubRequest(BaseModel):
    join_code: str = Field(min_length=6, max_length=6)

    @field_validator("join_code")
    @classmethod
    def uppercase_join_code(cls, v: str) -> str:
        return v.upper()


class ClubResponse(BaseModel):
    id: uuid.UUID
    name: str
    join_code: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberResponse(BaseModel):
    user_id: uuid.UUID
    full_name: str
    avatar_initials: str
    role: str
    total_points: int
    joined_at: datetime


class ClubDetailResponse(BaseModel):
    club: ClubResponse
    members: list[MemberResponse]
    total_members: int


# ---------------------------------------------------------------------------
# Task schemas
# ---------------------------------------------------------------------------

class CreateTaskRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    point_value: int = Field(default=10, ge=1, le=10000)
    assigned_to_user_id: uuid.UUID | None = None
    category: str | None = Field(default=None, max_length=50)
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high)$")
    due_at: datetime | None = None

    @field_validator("due_at", mode="after")
    @classmethod
    def strip_tz(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        return v


class UpdateTaskRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    point_value: int | None = Field(default=None, ge=1, le=10000)
    assigned_to_user_id: uuid.UUID | None = None
    category: str | None = Field(default=None, max_length=50)
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high)$")
    due_at: datetime | None = None

    @field_validator("due_at", mode="after")
    @classmethod
    def strip_tz(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        return v


class TaskResponse(BaseModel):
    id: uuid.UUID
    club_id: uuid.UUID
    title: str
    description: str | None
    assigned_to_user_id: uuid.UUID | None
    assigned_to_name: str | None = None
    point_value: int
    status: str
    category: str | None = None
    priority: str | None = None
    due_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Point schemas
# ---------------------------------------------------------------------------

class AwardPointsRequest(BaseModel):
    user_id: uuid.UUID
    delta: int = Field(ge=-10000, le=10000)
    reason: str = Field(min_length=3, max_length=300)

    @field_validator("delta")
    @classmethod
    def delta_must_be_nonzero(cls, v: int) -> int:
        if v == 0:
            raise ValueError("delta must be non-zero")
        return v


class PointLogResponse(BaseModel):
    id: uuid.UUID
    club_id: uuid.UUID
    user_id: uuid.UUID
    awarded_by_user_id: uuid.UUID | None = None
    delta: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    full_name: str
    avatar_initials: str
    total_points: int
    tasks_completed: int


class LeaderboardResponse(BaseModel):
    club_id: uuid.UUID
    entries: list[LeaderboardEntry]
    generated_at: datetime


# ---------------------------------------------------------------------------
# Activity schemas
# ---------------------------------------------------------------------------

class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    club_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    activity_type: str
    description: str
    target_user_id: uuid.UUID | None = None
    target_user_name: str | None = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Notification schemas
# ---------------------------------------------------------------------------

class RegisterTokenRequest(BaseModel):
    push_token: str = Field(min_length=1, max_length=200)
    platform: str | None = Field(default=None, max_length=10)

    @field_validator("push_token")
    @classmethod
    def valid_expo_push_token(cls, v: str) -> str:
        if not v.startswith("ExponentPushToken[") or not v.endswith("]"):
            raise ValueError("push_token must be a valid ExponentPushToken[…] string")
        return v


# ---------------------------------------------------------------------------
# Password reset schemas
# ---------------------------------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=1, max_length=64)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not _re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not _re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not _re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


# ---------------------------------------------------------------------------
# Notification preference schemas
# ---------------------------------------------------------------------------

class NotificationPreferenceResponse(BaseModel):
    task_assigned: bool = True
    points_awarded: bool = True
    task_due_soon: bool = True
    member_joined: bool = True

    model_config = {"from_attributes": True}


class UpdateNotificationPreferenceRequest(BaseModel):
    task_assigned: bool | None = None
    points_awarded: bool | None = None
    task_due_soon: bool | None = None
    member_joined: bool | None = None
