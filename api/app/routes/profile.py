from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..agents.orchestrator import build_profile
from ..models.profile import Profile

router = APIRouter()


class BuildProfileRequest(BaseModel):
    resume_text: str | None = Field(default=None, max_length=200_000)
    vercel_token: str | None = Field(
        default=None,
        max_length=200,
        description="Per-user Vercel access token. Used once for this request and not persisted.",
    )


@router.get("/profile/{username}", response_model=Profile)
async def get_profile(username: str) -> Profile:
    try:
        return await build_profile(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/profile/{username}", response_model=Profile)
async def build_profile_endpoint(
    username: str, body: BuildProfileRequest | None = None
) -> Profile:
    try:
        return await build_profile(
            username,
            resume_text=(body.resume_text if body else None),
            vercel_token=(body.vercel_token if body else None),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
