# Architecture

## System Diagram

```
┌──────────────────┐       HTTPS/JSON        ┌──────────────────┐
│  React Native    │  ◄──────────────────►   │   FastAPI         │
│  Mobile App      │                          │   Backend         │
│  (Expo + TS)     │                          │   (Python 3.11)   │
└──────────────────┘                          └────────┬─────────┘
                                                       │
                                                       │ asyncpg
                                                       ▼
                                              ┌──────────────────┐
                                              │  PostgreSQL 16   │
                                              │  Database        │
                                              └──────────────────┘
```

## Backend Structure

```
backend/
├── app/
│   ├── __init__.py           # Package marker
│   ├── main.py               # FastAPI app entry, CORS, routers
│   ├── database.py           # Async engine, session factory, Base
│   ├── models.py             # SQLAlchemy ORM models (5 tables)
│   ├── schemas.py            # Pydantic v2 request/response schemas
│   ├── auth.py               # JWT + password hashing helpers
│   ├── dependencies.py       # FastAPI dependencies (auth extraction)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py           # POST /auth/register, /auth/login
│       └── clubs.py          # POST /clubs, /clubs/join — GET /clubs/me, /clubs/members
├── alembic/                  # DB migration scaffold
├── alembic.ini
├── .env.example
└── requirements.txt
```

## Authentication Flow

```
Register → JWT (club_id=None) → Create/Join Club → New JWT (club_id=xxx) → Use API
```

1. User registers → gets token with no club context
2. User creates or joins a club → gets a **fresh token** with `club_id` and `role`
3. All subsequent requests use the new token → API scopes to that club

## Multi-Tenancy Enforcement

- `club_id` is embedded in JWT payload
- `get_current_user` dependency extracts it on every request
- Every query on `Membership`, `Task`, `PointLog` includes `.where(Table.club_id == current_user.club_id)`
- No cross-club data leakage is possible if this rule is followed

## Database Relationships

```
User ──┬── Membership ──┬── Club
       │                │
       ├── Task ────────┘
       │
       └── PointLog ────── Club
```

- `Membership` is the junction: carries `role` and `total_points`
- `Task` is assigned to a user within a club
- `PointLog` is an append-only ledger (never update, only insert)
