# Copilot Prompt — Club Management App: Project Scaffold + Auth + Club Endpoints

Paste this entire prompt into GitHub Copilot Chat (or any AI coding assistant) at the start of your session.

---

## Prompt

You are helping me build a multi-tenant college club management web application. I will describe the full project, the folder structure, the tech stack, the database schema, and the exact endpoints I need. Generate all the code unless I say otherwise.

---

### Project overview

This is a platform where college club leaders can manage their club members, assign tasks, award points, and display a leaderboard. Multiple clubs share one deployment — this is a multi-tenant architecture. Each club is isolated by a `club_id` that is baked into the user's JWT at login. Every database query that touches club-scoped data must be filtered by `club_id`.

There are two roles:
- `organiser` — the club leader. Can create tasks, assign tasks to members, manually award points, and view all club data.
- `member` — a regular club member. Can view their own tasks, mark tasks complete, and view the leaderboard.

---

### Tech stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, python-jose (JWT), passlib (bcrypt), asyncpg, python-dotenv
- **Database:** PostgreSQL 16
- **Frontend (separate — do not generate yet):** React 18, TypeScript, Vite, TailwindCSS, React Query, React Router v6, Axios

---

### Monorepo folder structure to generate

```
clubapp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app, CORS, router registration
│   │   ├── database.py           # Async SQLAlchemy engine + session
│   │   ├── models.py             # All SQLAlchemy ORM models
│   │   ├── schemas.py            # All Pydantic v2 request/response schemas
│   │   ├── auth.py               # JWT encode/decode, password hashing helpers
│   │   ├── dependencies.py       # get_current_user FastAPI dependency
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py           # /auth/register, /auth/login
│   │       └── clubs.py          # /clubs, /clubs/join, /clubs/me, /clubs/members
│   ├── alembic/
│   │   └── (standard alembic scaffold)
│   ├── .env.example
│   ├── requirements.txt
│   └── alembic.ini
└── frontend/
    └── (do not generate yet — leave empty)
```

---

### Database models (generate in `app/models.py`)

Use SQLAlchemy 2.0 declarative style with `mapped_column` and `Mapped` type annotations. All primary keys are UUIDs generated server-side. All tables have a `created_at` timestamp defaulting to `func.now()`.

**User**
```
id: UUID (PK)
email: str (unique, not null)
hashed_password: str (not null)
full_name: str (not null)
avatar_initials: str (2 chars, derived at creation from full_name, stored)
created_at: datetime
```

**Club**
```
id: UUID (PK)
name: str (not null)
join_code: str (6 chars, unique, not null)
created_at: datetime
```

**Membership** (junction between User and Club — also carries role and points)
```
id: UUID (PK)
club_id: UUID (FK → Club.id, not null)
user_id: UUID (FK → User.id, not null)
role: Enum('organiser', 'member') (not null)
total_points: int (default 0, not null)
joined_at: datetime
UniqueConstraint(club_id, user_id)
```

**Task** (generate the model but do not wire endpoints yet — just define the table)
```
id: UUID (PK)
club_id: UUID (FK → Club.id, not null)
assigned_to_user_id: UUID (FK → User.id, nullable)
title: str (not null)
description: str (nullable)
point_value: int (default 10, not null)
status: Enum('pending', 'completed') (default 'pending')
due_at: datetime (nullable)
created_at: datetime
```

**PointLog** (immutable ledger — never update, only insert)
```
id: UUID (PK)
club_id: UUID (FK → Club.id, not null)
user_id: UUID (FK → User.id, not null)
delta: int (not null — positive for awards, negative for deductions)
reason: str (not null)
created_at: datetime
```

---

### database.py

Use async SQLAlchemy with `asyncpg`. Read `DATABASE_URL` from environment. Provide:
- `async_engine`
- `AsyncSessionLocal` (sessionmaker)
- `Base` (declarative base)
- `get_db` async generator dependency that yields a session and closes it after

---

### auth.py (helpers — not a router)

Use `passlib` with `bcrypt` for password hashing. Use `python-jose` with `HS256` for JWT.

Provide:
- `hash_password(plain: str) -> str`
- `verify_password(plain: str, hashed: str) -> bool`
- `create_access_token(data: dict) -> str` — reads `JWT_SECRET` and `JWT_EXPIRE_MINUTES` from env, defaults expire to 60 minutes
- `decode_access_token(token: str) -> dict` — raises `HTTPException(401)` on invalid/expired token

The JWT payload must include: `sub` (user_id as string), `club_id` (string or None if user hasn't joined a club yet), `role` (string or None), `email`.

---

### dependencies.py

Provide a `get_current_user` async FastAPI dependency that:
1. Extracts the Bearer token from the `Authorization` header
2. Decodes it using `decode_access_token`
3. Returns a `CurrentUser` dataclass/Pydantic model with fields: `user_id: UUID`, `club_id: UUID | None`, `role: str | None`, `email: str`

Also provide a `require_organiser` dependency that calls `get_current_user` and raises `HTTPException(403)` if `role != 'organiser'`.

---

### Pydantic schemas (generate in `app/schemas.py`)

Use Pydantic v2. Generate the following:

**Auth schemas**
- `RegisterRequest`: email, password (min 8 chars), full_name
- `LoginRequest`: email, password
- `TokenResponse`: access_token (str), token_type (str, default "bearer")

**Club schemas**
- `CreateClubRequest`: name (str, min 2 chars)
- `JoinClubRequest`: join_code (str, exactly 6 chars, uppercased via validator)
- `ClubResponse`: id, name, join_code, created_at
- `MemberResponse`: user_id, full_name, avatar_initials, role, total_points, joined_at
- `ClubDetailResponse`: club (ClubResponse), members (list[MemberResponse]), total_members (int)

---

### Router: `routers/auth.py`

Prefix: `/auth`

**POST /auth/register**
- Body: `RegisterRequest`
- Check if email already exists — if so, raise `HTTPException(400, "Email already registered")`
- Hash the password
- Derive `avatar_initials` from `full_name`: take first letter of first word + first letter of last word, uppercased. If only one word, take first two letters.
- Insert User row
- Return `TokenResponse` with a JWT. At registration, `club_id` and `role` are `None` in the token — the user hasn't joined a club yet.

**POST /auth/login**
- Body: `LoginRequest`
- Look up user by email — if not found or password wrong, raise `HTTPException(401, "Invalid credentials")`
- Look up the user's most recent Membership row to get `club_id` and `role`. If no membership exists, both are `None`.
- Return `TokenResponse` with a JWT containing `sub`, `club_id`, `role`, `email`.

---

### Router: `routers/clubs.py`

Prefix: `/clubs`
All routes require authentication via `get_current_user`.

**POST /clubs** — Create a new club
- Requires auth (any logged-in user can create a club)
- Body: `CreateClubRequest`
- Generate `join_code`: `secrets.token_hex(3).upper()` — if collision exists in DB, retry once
- Insert Club row
- Insert Membership row for the creator with `role = 'organiser'`
- Return `TokenResponse` with a NEW JWT that now contains the `club_id` and `role = 'organiser'`. This is important — the frontend must replace the stored token with this new one so the user's subsequent requests are club-scoped.

**POST /clubs/join** — Join an existing club via join code
- Requires auth
- Body: `JoinClubRequest`
- Look up Club by `join_code` — if not found, raise `HTTPException(404, "Invalid join code")`
- Check if Membership already exists for this user + club — if so, raise `HTTPException(400, "Already a member")`
- Insert Membership row with `role = 'member'`
- Return `TokenResponse` with a NEW JWT containing the `club_id` and `role = 'member'`

**GET /clubs/me** — Get current club details + full member list
- Requires auth + must have a `club_id` in their token (raise `HTTPException(400, "Not in a club")` if `club_id` is None)
- Query Club by `current_user.club_id`
- Query all Memberships for that club, joined with User, ordered by `total_points DESC`
- Return `ClubDetailResponse`

**GET /clubs/members** — Get members list only (for dropdowns etc.)
- Requires auth + club_id
- Return `list[MemberResponse]` ordered by full_name ASC

---

### main.py

- Create FastAPI app with title "ClubApp API" and version "0.1.0"
- Add `CORSMiddleware` allowing origins `["http://localhost:5173", "http://localhost:3000"]`, all methods, all headers, allow credentials
- Include both routers
- On startup, run `Base.metadata.create_all(bind=engine)` using a sync engine just for table creation (note: in production this would be Alembic — add a comment saying so)
- Mount a health check route: `GET /health` returns `{"status": "ok"}`

---

### .env.example

```
DATABASE_URL=postgresql+asyncpg://postgres:dev@localhost:5432/clubapp
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE_MINUTES=60
```

---

### requirements.txt

Pin these versions:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic[email]==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
```

---

### Important implementation rules

1. All database queries that access club-scoped tables (Membership, Task, PointLog) must filter by `club_id`. Never return data from another club.
2. Never store raw passwords. Always use `hash_password` before inserting.
3. When a user creates or joins a club, always return a fresh JWT — the old token has `club_id = None` and is now stale.
4. Use `async with` for all database sessions — never use synchronous SQLAlchemy calls in route handlers.
5. All UUIDs should be generated using `uuid.uuid4()` in Python, not the database default — keeps it portable.
6. Add docstrings to every route function describing what it does, who can call it, and what it returns.

---

### What NOT to generate yet

- Frontend code
- Task endpoints (models are fine, no routers)
- Point awarding endpoints
- Email/notifications
- Alembic migration files (just the scaffold)

---

Generate all files now. After generating, summarise what was created and list the exact `uvicorn` command to run the dev server.
