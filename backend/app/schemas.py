import uuid
from datetime import datetime

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
