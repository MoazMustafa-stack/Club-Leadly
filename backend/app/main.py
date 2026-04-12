import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, clubs, notifications, points, tasks
from .scheduler import scheduler, start_scheduler

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(title="Club Leadly API", version="0.1.0", lifespan=lifespan)

# ---------------------------------------------------------------------------
# CORS
# Note: React Native apps do not enforce CORS (it's a browser concept).
# CORS errors on mobile usually mean a network configuration issue,
# not a real CORS problem. These rules are for the web dev frontend.
# ---------------------------------------------------------------------------
allowed_origins = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
    os.getenv("FRONTEND_ORIGIN", ""),
]
allowed_origins = [o for o in allowed_origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.expo\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(clubs.router)
app.include_router(tasks.router)
app.include_router(points.router)
app.include_router(notifications.router)


# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint. Returns {\"status\": \"ok\"} if the server is running."""
    return {"status": "ok"}
