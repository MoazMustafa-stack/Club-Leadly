from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, clubs, points, tasks

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
app.include_router(tasks.router)
app.include_router(points.router)


# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint. Returns {\"status\": \"ok\"} if the server is running."""
    return {"status": "ok"}
