from fastapi import APIRouter, HTTPException

from ..agents.orchestrator import build_profile
from ..models.profile import Profile

router = APIRouter()


@router.get("/profile/{username}", response_model=Profile)
async def get_profile(username: str) -> Profile:
    try:
        return await build_profile(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
