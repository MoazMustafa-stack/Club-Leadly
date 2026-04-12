# Security Rules

Non-negotiable rules enforced across the codebase.

## Authentication
- Passwords are **never stored in plaintext** — always bcrypt hashed via `passlib`
- JWTs are signed with HS256 using a secret from environment variables
- Token expiry defaults to 60 minutes
- `JWT_SECRET` must be a long random string in production (never the example value)

## Multi-Tenant Isolation
- Every query on `Membership`, `Task`, `PointLog` **must** filter by `club_id`
- `club_id` comes from the JWT — not from request body or URL params
- No endpoint ever accepts `club_id` as user input for scoped queries

## Authorization
- `organiser` role is checked via `require_organiser` dependency
- Role is embedded in JWT and validated server-side
- Creating/joining a club issues a **new token** — stale tokens with `club_id=None` cannot access club data

## Input Validation
- Pydantic v2 validates all request bodies
- Email format enforced
- Password minimum 8 characters
- Join code exactly 6 characters, uppercased

## CORS
- Development: `localhost:5173` and `localhost:3000`
- Production: must be locked to actual domain/app scheme
- Credentials enabled for cookie-based flows if needed later
