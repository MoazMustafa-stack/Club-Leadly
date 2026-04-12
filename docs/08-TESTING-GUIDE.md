# Testing Guide

## Prerequisites

- Python 3.14+ installed
- Backend dependencies installed: `pip install -r backend/requirements.txt`
- `.env` file configured in `backend/` with `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`
- Supabase database running with migrations applied

## Start the Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Server runs at `http://127.0.0.1:8000`.

---

## Option 1: Swagger UI (Recommended)

Open **http://127.0.0.1:8000/docs** in your browser. All endpoints are listed with "Try it out" buttons.

### Authenticate in Swagger

1. Call **POST /auth/register** or **POST /auth/login** → copy the `access_token` from the response
2. Click the **Authorize** button (🔒) at the top-right of the Swagger page
3. Enter: `Bearer <your-token>` → click Authorize
4. All subsequent requests will include the token automatically

> **Important:** After creating or joining a club, you get a **new token** with `club_id` embedded. You must replace your stored token with this new one (click Authorize again and paste the new token).

---

## Option 2: curl

### Full Walkthrough

**1. Register a user**
```bash
curl -s http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","full_name":"Alice Smith"}'
```
Response:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```
Save the token:
```bash
TOKEN="eyJ..."
```

**2. Login (if you already registered)**
```bash
curl -s http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

**3. Create a club**
```bash
curl -s http://127.0.0.1:8000/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Coding Club"}'
```
Response includes a **new token** with `club_id` and `role=organiser`. **Update your TOKEN variable:**
```bash
TOKEN="eyJ...new-club-token..."
```

**4. View club details**
```bash
curl -s http://127.0.0.1:8000/clubs/me \
  -H "Authorization: Bearer $TOKEN"
```

**5. Create a task (organiser only)**
```bash
curl -s http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Design club logo","description":"512x512 PNG","point_value":20}'
```

**6. List all tasks**
```bash
curl -s http://127.0.0.1:8000/tasks \
  -H "Authorization: Bearer $TOKEN"
```

**7. Complete a task (auto-awards points)**
```bash
TASK_ID="paste-task-uuid-here"
curl -s -X PATCH http://127.0.0.1:8000/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```
Note: Only the assigned member can complete their own task.

**8. Award points manually**
```bash
USER_ID="paste-user-uuid-here"
curl -s -X POST http://127.0.0.1:8000/points/award \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"$USER_ID\",\"delta\":25,\"reason\":\"Great presentation\"}"
```

**9. View leaderboard**
```bash
curl -s http://127.0.0.1:8000/points/leaderboard \
  -H "Authorization: Bearer $TOKEN"
```

**10. View point history**
```bash
curl -s http://127.0.0.1:8000/points/history \
  -H "Authorization: Bearer $TOKEN"
```
Organisers can filter by user: `?user_id=<uuid>`. Members see only their own history.

---

## Option 3: Postman

1. Import the base URL: `http://127.0.0.1:8000`
2. Create requests for each endpoint
3. For authenticated requests, go to the **Authorization** tab → choose **Bearer Token** → paste your token
4. Remember to swap tokens after creating/joining a club

---

## Multi-User Testing (Join Code Flow)

To test the join flow with two users:

1. **User A** registers and creates a club → saves the `join_code` from `GET /clubs/me`
2. **User B** registers → calls `POST /clubs/join` with `{"join_code": "A1B2C3"}` → gets a new token with `role=member`
3. **User A** (organiser) creates a task assigned to User B's `user_id`
4. **User B** calls `PATCH /tasks/{id}/complete` → points auto-awarded
5. Both users call `GET /points/leaderboard` to see rankings

---

## Token Flow Summary

```
Register/Login → token (no club_id)
       │
       ▼
Create or Join Club → NEW token (with club_id + role)
       │
       ▼
Use new token for all club-scoped endpoints
(tasks, points, leaderboard, members)
```

> **Key insight:** The token returned by `/clubs` or `/clubs/join` replaces your previous token. Always use the latest one — it contains the `club_id` needed for task and point operations.

---

## Endpoint Summary

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | GET | `/health` | None | Health check |
| 2 | POST | `/auth/register` | None | Register new user |
| 3 | POST | `/auth/login` | None | Login |
| 4 | POST | `/clubs` | User | Create club (returns new token) |
| 5 | POST | `/clubs/join` | User | Join club by code (returns new token) |
| 6 | GET | `/clubs/me` | Club member | Club details + members |
| 7 | GET | `/clubs/members` | Club member | Member list |
| 8 | POST | `/tasks` | Organiser | Create task |
| 9 | GET | `/tasks` | Club member | List tasks (role-based filtering) |
| 10 | GET | `/tasks/{id}` | Club member | Get single task (member sees own only) |
| 11 | PATCH | `/tasks/{id}` | Organiser | Update task |
| 12 | DELETE | `/tasks/{id}` | Organiser | Delete task (blocks if completed) |
| 13 | PATCH | `/tasks/{id}/complete` | Assigned member | Complete + auto-award points |
| 14 | POST | `/points/award` | Organiser | Award/deduct points manually |
| 15 | GET | `/points/leaderboard` | Club member | Ranked leaderboard with tasks_completed |
| 16 | GET | `/points/history` | Club member | Point history (role-based access) |
