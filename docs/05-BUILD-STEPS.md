# Build Steps — Execution Plan

Each step produces a working commit pushed to GitHub. We build incrementally — never break the trunk.

---

## Step 1: Project Scaffold + Dependencies
**Commit:** `feat: project scaffold with requirements and env config`

- Create folder structure: `backend/app/`, `backend/app/routers/`, `backend/alembic/`
- Create `requirements.txt` with pinned versions
- Create `.env.example` with database URL, JWT secret, expiry
- Create `__init__.py` files
- Create `.gitignore` for Python projects

**Verify:** Folder structure exists, deps can be pip-installed

---

## Step 2: Database Layer + ORM Models
**Commit:** `feat: database engine, session factory, and all ORM models`

- `database.py` — async engine, session maker, Base, `get_db` dependency
- `models.py` — User, Club, Membership, Task, PointLog with full relationships

**Verify:** `python -c "from app.models import *"` runs without error

---

## Step 3: Auth Helpers + Pydantic Schemas
**Commit:** `feat: JWT/password helpers, Pydantic schemas, auth dependencies`

- `auth.py` — hash_password, verify_password, create_access_token, decode_access_token
- `schemas.py` — all request/response models
- `dependencies.py` — get_current_user, require_organiser

**Verify:** All imports resolve cleanly

---

## Step 4: Auth Router
**Commit:** `feat: POST /auth/register and /auth/login endpoints`

- `routers/auth.py` — register + login with full validation
- Avatar initials derivation logic
- JWT issued on register (no club) and login (with club if membership exists)

**Verify:** Can curl `/auth/register` and get a token back

---

## Step 5: Club Router
**Commit:** `feat: club create, join, detail, and members endpoints`

- `routers/clubs.py` — POST /clubs, POST /clubs/join, GET /clubs/me, GET /clubs/members
- Join code generation with collision check
- Token refresh on create/join

**Verify:** Full auth → create club → get club details flow works

---

## Step 6: Main App Assembly
**Commit:** `feat: FastAPI app with CORS, routers, and health check`

- `main.py` — app creation, CORS, router mounting, startup table creation, /health
- Wire everything together

**Verify:** `uvicorn app.main:app --reload` starts, `/health` returns ok, `/docs` shows Swagger

---

## Step 7: Alembic Scaffold
**Commit:** `feat: alembic migration scaffold`

- `alembic init alembic`
- Configure `alembic.ini` and `env.py` for async

**Verify:** `alembic check` runs without error

---

## Future Steps

| Step | Phase | Description |
|------|-------|-------------|
| 8 | 2 | Task CRUD endpoints |
| 9 | 2 | Point awarding + leaderboard |
| 10 | 3 | React Native project init (Expo) |
| 11 | 3 | Auth screens (Login, Register) |
| 12 | 3 | Club screens (Create, Join, Dashboard) |
| 13 | 4 | Push notifications |
