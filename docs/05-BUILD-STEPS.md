# Build Steps — Execution Plan

Each step produces a working commit pushed to GitHub. We build incrementally — never break the trunk.

---

## Step 1: Project Scaffold + Dependencies ✅
**Commit:** `feat: project scaffold with requirements and env config`

- Create folder structure: `backend/app/`, `backend/app/routers/`, `backend/alembic/`
- Create `requirements.txt` with pinned versions
- Create `.env.example` with database URL, JWT secret, expiry
- Create `__init__.py` files
- Create `.gitignore` for Python projects

---

## Step 2: Database Layer + ORM Models ✅
**Commit:** `feat: database engine, session factory, and all ORM models`

- `database.py` — async engine, session maker, Base, `get_db` dependency
- `models.py` — User, Club, Membership, Task, PointLog with full relationships

---

## Step 3: Auth Helpers + Pydantic Schemas ✅
**Commit:** `feat: JWT/password helpers, Pydantic schemas, auth dependencies`

- `auth.py` — hash_password, verify_password, create_access_token, decode_access_token
- `schemas.py` — all request/response models
- `dependencies.py` — get_current_user, require_organiser

---

## Step 4: Auth Router ✅
**Commit:** `feat: POST /auth/register and /auth/login endpoints`

- `routers/auth.py` — register + login with full validation
- Avatar initials derivation logic
- JWT issued on register (no club) and login (with club if membership exists)

---

## Step 5: Club Router ✅
**Commit:** `feat: club create, join, detail, and members endpoints`

- `routers/clubs.py` — POST /clubs, POST /clubs/join, GET /clubs/me, GET /clubs/members
- Join code generation with collision check
- Token refresh on create/join

---

## Step 6: Main App Assembly ✅
**Commit:** `feat: FastAPI app with CORS, routers, and health check`

- `main.py` — app creation, CORS, router mounting, /health
- Wire everything together

---

## Step 7: Alembic Migration ✅
**Commit:** `feat: alembic migration scaffold` + `fix: Supabase connection + Alembic migration`

- Alembic configured for async with Supabase SSL
- Initial migration applied — 5 tables live in Supabase (users, clubs, memberships, tasks, point_logs)

---

## Step 8: Task CRUD ✅
**Commit:** `feat: Phase 2 — Task CRUD + Point awarding + Leaderboard`

- `routers/tasks.py` — 6 endpoints: create, list, get, update, delete, complete
- Task completion auto-awards `point_value` to the assigned user
- Organiser-only gating for create/update/delete
- Assignment validation (user must be a club member)

---

## Step 9: Point System + Leaderboard ✅
**Commit:** (included in Phase 2 commit)

- `routers/points.py` — 3 endpoints: manual award/deduct, leaderboard, audit log
- Leaderboard ranks members by `total_points` descending
- Full point history with reason tracking

---

## Step 10: React Native Mobile App ⏳
**Status:** Not started

- Auth screens (register, login)
- Club screens (create, join, details)
- Task screens (list, create, complete)
- Leaderboard screen

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
