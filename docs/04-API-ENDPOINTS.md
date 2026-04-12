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

## Future Endpoints (Phase 2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tasks` | Create a task (organiser only) |
| GET | `/tasks` | List club tasks |
| PATCH | `/tasks/{id}/complete` | Mark task complete |
| POST | `/points/award` | Award points (organiser only) |
| GET | `/leaderboard` | Club leaderboard |

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
