# API Endpoints

## Base URL
```
http://localhost:8000
```

## Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{"status": "ok"}` |

---

## Auth Routes — `/auth`

### POST /auth/register
**Auth:** None  
**Body:**
```json
{
  "email": "user@college.edu",
  "password": "securepass123",
  "full_name": "John Doe"
}
```
**Returns:** `TokenResponse` — JWT with `club_id=None`, `role=None`  
**Errors:** `400` if email already registered

### POST /auth/login
**Auth:** None  
**Body:**
```json
{
  "email": "user@college.edu",
  "password": "securepass123"
}
```
**Returns:** `TokenResponse` — JWT with `club_id` and `role` if user has a membership  
**Errors:** `401` if invalid credentials

---

## Club Routes — `/clubs`

> All routes require `Authorization: Bearer <token>` header

### POST /clubs
**Auth:** Any logged-in user  
**Body:**
```json
{
  "name": "Coding Club"
}
```
**Returns:** `TokenResponse` — **new JWT** with `club_id` set, `role=organiser`  
**Note:** Frontend must replace stored token with this one

### POST /clubs/join
**Auth:** Any logged-in user  
**Body:**
```json
{
  "join_code": "A1B2C3"
}
```
**Returns:** `TokenResponse` — **new JWT** with `club_id` set, `role=member`  
**Errors:** `404` invalid join code, `400` already a member

### GET /clubs/me
**Auth:** Must have `club_id` in token  
**Returns:** `ClubDetailResponse` — club info + full member list sorted by points DESC  
**Errors:** `400` if not in a club

### GET /clubs/members
**Auth:** Must have `club_id` in token  
**Returns:** `list[MemberResponse]` sorted by `full_name` ASC

---

## Task Routes — `/tasks`

> All routes require `Authorization: Bearer <token>` with a valid `club_id`.

### POST /tasks
**Auth:** Organiser only  
**Body:**
```json
{
  "title": "Design club logo",
  "description": "Create a 512x512 PNG logo for the club",
  "point_value": 20,
  "assigned_to_user_id": "user-uuid-or-null",
  "due_at": "2026-04-20T23:59:00"
}
```
**Returns:** `TaskResponse` (201 Created)  
**Errors:** `400` if assigned user is not a member, `403` if not organiser

### GET /tasks
**Auth:** Any club member  
**Returns:** `list[TaskResponse]` — all tasks in the club, newest first

### GET /tasks/{task_id}
**Auth:** Any club member  
**Returns:** `TaskResponse`  
**Errors:** `404` if task not found or not in current club

### PATCH /tasks/{task_id}
**Auth:** Organiser only  
**Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "New description",
  "point_value": 30,
  "assigned_to_user_id": "user-uuid",
  "due_at": "2026-05-01T12:00:00"
}
```
**Returns:** `TaskResponse`  
**Errors:** `404` task not found, `400` assigned user not a member, `403` not organiser

### DELETE /tasks/{task_id}
**Auth:** Organiser only  
**Returns:** `204 No Content`  
**Errors:** `404` task not found, `403` not organiser

### POST /tasks/{task_id}/complete
**Auth:** The assigned member or any organiser  
**Body:** None  
**Returns:** `TaskResponse` with `status: "completed"`  
**Side effects:** Automatically awards `point_value` to the assigned user's `total_points` and creates a `PointLog` entry  
**Errors:** `400` already completed, `403` not assigned and not organiser, `404` task not found

---

## Point Routes — `/points`

> All routes require `Authorization: Bearer <token>` with a valid `club_id`.

### POST /points
**Auth:** Organiser only  
**Body:**
```json
{
  "user_id": "target-user-uuid",
  "delta": 25,
  "reason": "Extra credit for event organisation"
}
```
**Note:** Positive `delta` = award, negative `delta` = deduction  
**Returns:** `PointLogResponse` (201 Created)  
**Errors:** `400` if user is not a member, `403` not organiser

### GET /points/leaderboard
**Auth:** Any club member  
**Returns:** `list[LeaderboardEntry]` ranked by `total_points` descending
```json
[
  {
    "user_id": "uuid",
    "full_name": "John Doe",
    "avatar_initials": "JD",
    "total_points": 45,
    "rank": 1
  }
]
```

### GET /points/log
**Auth:** Any club member  
**Returns:** `list[PointLogResponse]` — full audit log, newest first
```json
[
  {
    "id": "uuid",
    "club_id": "uuid",
    "user_id": "uuid",
    "delta": 20,
    "reason": "Completed task: Design club logo",
    "created_at": "2026-04-12T15:30:00"
  }
]
```

---

## JWT Payload Structure
```json
{
  "sub": "user-uuid-string",
  "club_id": "club-uuid-string-or-null",
  "role": "organiser|member|null",
  "email": "user@college.edu",
  "exp": 1234567890
}
```
