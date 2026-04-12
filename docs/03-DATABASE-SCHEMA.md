# Database Schema

## ER Diagram (Text)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users     │     │   memberships    │     │    clubs     │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id (PK,UUID)│◄────│ user_id (FK)     │────►│ id (PK,UUID)│
│ email       │     │ club_id (FK)     │     │ name        │
│ hashed_pw   │     │ role (enum)      │     │ join_code   │
│ full_name   │     │ total_points     │     │ created_at  │
│ avatar_init │     │ joined_at        │     └─────────────┘
│ created_at  │     │ UNIQUE(club,user)│           │
└──────┬──────┘     └──────────────────┘           │
       │                                           │
       │            ┌──────────────────┐           │
       │            │      tasks       │           │
       └───────────►│ assigned_to (FK) │◄──────────┘
                    │ club_id (FK)     │
                    │ title, desc      │
                    │ point_value      │
                    │ status (enum)    │
                    │ due_at           │
                    └──────────────────┘
       │
       │            ┌──────────────────┐
       └───────────►│   point_logs     │◄──────────┐
                    │ user_id (FK)     │           │
                    │ club_id (FK)     │───────────┘
                    │ delta (int)      │
                    │ reason           │
                    └──────────────────┘
```

## Tables

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, generated in Python |
| email | VARCHAR | UNIQUE, NOT NULL |
| hashed_password | VARCHAR | NOT NULL |
| full_name | VARCHAR | NOT NULL |
| avatar_initials | VARCHAR(2) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

### clubs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| join_code | VARCHAR(6) | UNIQUE, NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

### memberships
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| club_id | UUID | FK → clubs.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| role | ENUM('organiser','member') | NOT NULL |
| total_points | INTEGER | DEFAULT 0, NOT NULL |
| joined_at | TIMESTAMP | DEFAULT now() |
| | | UNIQUE(club_id, user_id) |

### tasks *(model only — no endpoints yet)*
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| club_id | UUID | FK → clubs.id, NOT NULL |
| assigned_to_user_id | UUID | FK → users.id, NULLABLE |
| title | VARCHAR | NOT NULL |
| description | TEXT | NULLABLE |
| point_value | INTEGER | DEFAULT 10, NOT NULL |
| status | ENUM('pending','completed') | DEFAULT 'pending' |
| due_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | DEFAULT now() |

### point_logs *(append-only ledger)*
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| club_id | UUID | FK → clubs.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| delta | INTEGER | NOT NULL |
| reason | VARCHAR | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

## Key Rules
- All PKs are UUID4, generated in Python (`uuid.uuid4()`)
- All timestamps default to `func.now()`
- `point_logs` is **immutable** — never UPDATE, only INSERT
- `memberships` has a unique constraint on `(club_id, user_id)` — one membership per user per club
