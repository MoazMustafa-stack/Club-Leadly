# Club Leadly — Project Overview

## What Is This?

A **multi-tenant mobile app** for college clubs. Club leaders manage members, assign tasks, award points, and display leaderboards. Multiple clubs share one backend — isolated by `club_id` in every JWT and database query.

## Platform

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.14, FastAPI 0.135, SQLAlchemy 2.0 (async), asyncpg |
| Mobile App | React Native (Expo) + TypeScript *(future phase)* |
| Auth | JWT (HS256) via python-jose, bcrypt 4.3 (direct) |
| Database | Supabase PostgreSQL, managed via Alembic migrations |

> **Note:** The original spec mentioned a React web frontend. This project targets **mobile first** using React Native. The backend API is identical — only the client changes.

## Roles

| Role | Permissions |
|------|------------|
| `organiser` | Create tasks, assign to members, award/deduct points, view all club data |
| `member` | View own tasks, mark tasks complete, view leaderboard |

## Multi-Tenancy Model

- Every user gets a JWT containing `club_id` after joining/creating a club
- Every DB query on club-scoped tables (`Membership`, `Task`, `PointLog`) filters by `club_id`
- A user with no club gets `club_id=None` in their token — limited access until they join/create

## Build Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project scaffold, DB models, Auth + Club endpoints | ✅ Complete |
| 2 | Task CRUD, Point awarding, Leaderboard | ✅ Complete |
| 3 | React Native mobile app (auth screens, club screens) | ⏳ Planned |
| 4 | Push notifications, email, polish | ⏳ Planned |
