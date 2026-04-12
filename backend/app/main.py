import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine

from .database import Base
from .routers import auth, clubs

load_dotenv()

app = FastAPI(title="ClubApp API", version="0.1.0")

# ---------------------------------------------------------------------------
# CORS — allow the mobile dev server and local web dev servers
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8081",   # Expo dev server
        "http://localhost:19006",  # Expo web
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(clubs.router)


# ---------------------------------------------------------------------------
# Startup — create tables (in production, use Alembic migrations instead)
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    # Sync engine just for table creation; Alembic should handle this in prod
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:dev@localhost:5432/clubapp",
    )
    sync_url = database_url.replace("+asyncpg", "")
    sync_engine = create_engine(sync_url)
    Base.metadata.create_all(bind=sync_engine)
    sync_engine.dispose()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint. Returns {\"status\": \"ok\"} if the server is running."""
    return {"status": "ok"}
