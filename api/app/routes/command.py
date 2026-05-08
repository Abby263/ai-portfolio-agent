from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..agents.command_router import CommandResponse, route_command
from ..agents.orchestrator import build_profile
from ..models.profile import Profile

router = APIRouter()


class CommandRequest(BaseModel):
    username: str
    command: str = Field(..., min_length=1, max_length=2_000)
    profile: Profile | None = Field(
        default=None,
        description="Pre-built profile to use as context. When omitted, the API rebuilds it.",
    )


@router.post("/command", response_model=CommandResponse)
async def run_command(body: CommandRequest) -> CommandResponse:
    if body.profile is not None:
        profile = body.profile
    else:
        try:
            profile = await build_profile(body.username)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    return route_command(profile, body.command)
