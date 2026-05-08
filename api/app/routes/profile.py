from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..agents.orchestrator import build_profile
from ..auth import authenticated_github_username, clerk_enabled
from ..models.profile import Profile
from ..storage import (
    get_customizations,
    kv_enabled,
    save_customizations,
)

router = APIRouter()


class BuildProfileRequest(BaseModel):
    resume_text: str | None = Field(default=None, max_length=200_000)
    vercel_token: str | None = Field(
        default=None,
        max_length=200,
        description="Per-user Vercel access token. Saved (encrypted at rest by KV) when the request is owner-authenticated; otherwise used in-session only.",
    )


@router.get("/profile/{username}", response_model=Profile)
async def get_profile(username: str) -> Profile:
    customizations = await get_customizations(username) if kv_enabled() else {}
    try:
        return await build_profile(
            username,
            resume_text=customizations.get("resume_text"),
            vercel_token=customizations.get("vercel_token"),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/profile/{username}", response_model=Profile)
async def build_profile_endpoint(
    username: str,
    body: BuildProfileRequest | None = None,
    authorization: str | None = Header(default=None),
) -> Profile:
    body = body or BuildProfileRequest()
    has_changes = body.resume_text is not None or body.vercel_token is not None

    requester = await authenticated_github_username(authorization)
    is_owner = (
        requester is not None and requester == username.lower()
    )

    # If KV is on and the caller has changes to save, require owner auth.
    if has_changes and kv_enabled():
        if not clerk_enabled():
            # Clerk not set up — accept but don't persist (session-only).
            customizations = {
                "resume_text": body.resume_text,
                "vercel_token": body.vercel_token,
            }
        else:
            if not authorization:
                raise HTTPException(
                    status_code=401,
                    detail="Sign in to save customizations.",
                )
            if not is_owner:
                raise HTTPException(
                    status_code=403,
                    detail="Only the profile owner can save customizations.",
                )
            customizations = await save_customizations(
                username,
                {
                    "resume_text": body.resume_text,
                    "vercel_token": body.vercel_token,
                },
            )
    elif kv_enabled():
        customizations = await get_customizations(username)
    else:
        customizations = {
            "resume_text": body.resume_text,
            "vercel_token": body.vercel_token,
        }

    try:
        return await build_profile(
            username,
            resume_text=customizations.get("resume_text"),
            vercel_token=customizations.get("vercel_token"),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
