import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Club schemas
# ---------------------------------------------------------------------------

class CreateClubRequest(BaseModel):
    name: str = Field(min_length=2)


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
    title: str = Field(min_length=2)
    description: str | None = None
    point_value: int = Field(default=10, ge=1)
    assigned_to_user_id: uuid.UUID | None = None
    due_at: datetime | None = None

    @field_validator("due_at", mode="before")
    @classmethod
    def strip_tz(cls, v: object) -> object:
        if isinstance(v, datetime) and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        if isinstance(v, str) and v.endswith(("Z", "+00:00", "+0000")):
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None)
        return v


class UpdateTaskRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2)
    description: str | None = None
    point_value: int | None = Field(default=None, ge=1)
    assigned_to_user_id: uuid.UUID | None = None
    due_at: datetime | None = None

    @field_validator("due_at", mode="before")
    @classmethod
    def strip_tz(cls, v: object) -> object:
        if isinstance(v, datetime) and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        if isinstance(v, str) and v.endswith(("Z", "+00:00", "+0000")):
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None)
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
    due_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Point schemas
# ---------------------------------------------------------------------------

class AwardPointsRequest(BaseModel):
    user_id: uuid.UUID
    delta: int
    reason: str = Field(min_length=3)

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
# Notification schemas
# ---------------------------------------------------------------------------

class RegisterTokenRequest(BaseModel):
    push_token: str = Field(min_length=1)
    platform: str | None = None
