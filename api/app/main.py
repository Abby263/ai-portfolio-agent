from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import actions, command, health, profile

app = FastAPI(title="ai-portfolio-agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(profile.router, prefix="/api")
app.include_router(command.router, prefix="/api")
app.include_router(actions.router, prefix="/api")
