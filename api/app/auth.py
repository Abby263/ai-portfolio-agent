"""Clerk JWT verification + GitHub username lookup.

Used by write-side endpoints to confirm that a request to mutate
/user-X actually comes from user-X (signed in via Clerk's GitHub
social connection).

Falls through (returns None) when Clerk env vars aren't configured.
"""

import time
from typing import Any

import httpx
import jwt as pyjwt
from jwt.algorithms import RSAAlgorithm

from .config import settings

CLERK_API = "https://api.clerk.com/v1"


def clerk_enabled() -> bool:
    return bool(settings.clerk_secret_key and settings.clerk_jwks_url)


_jwks_cache: dict[str, Any] = {"keys": {}, "expires_at": 0.0}
_JWKS_TTL_SECONDS = 600


async def _fetch_jwks() -> dict[str, Any]:
    if (
        _jwks_cache["keys"]
        and time.time() < _jwks_cache["expires_at"]
    ):
        return _jwks_cache["keys"]
    if not settings.clerk_jwks_url:
        raise ValueError("CLERK_JWKS_URL not configured")
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(settings.clerk_jwks_url)
        r.raise_for_status()
        keys = {k["kid"]: k for k in r.json().get("keys", [])}
        _jwks_cache["keys"] = keys
        _jwks_cache["expires_at"] = time.time() + _JWKS_TTL_SECONDS
        return keys


async def verify_clerk_jwt(token: str) -> dict[str, Any]:
    """Verifies a Clerk session JWT signature against the JWKS. Returns
    the decoded payload. Raises on any failure."""
    headers = pyjwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        raise ValueError("JWT missing kid header")
    jwks = await _fetch_jwks()
    jwk = jwks.get(kid)
    if not jwk:
        # Refresh once in case keys rotated
        _jwks_cache["expires_at"] = 0.0
        jwks = await _fetch_jwks()
        jwk = jwks.get(kid)
    if not jwk:
        raise ValueError("JWT signing key not found in JWKS")
    public_key = RSAAlgorithm.from_jwk(jwk)
    return pyjwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        options={"verify_aud": False},
    )


async def get_github_username_for_user(user_id: str) -> str | None:
    if not settings.clerk_secret_key:
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{CLERK_API}/users/{user_id}",
            headers={
                "Authorization": f"Bearer {settings.clerk_secret_key}"
            },
        )
        if r.status_code != 200:
            return None
        user = r.json()
        for acc in user.get("external_accounts", []):
            if acc.get("provider") == "oauth_github":
                username = acc.get("username")
                return username.lower() if username else None
    return None


async def authenticated_github_username(
    authorization: str | None,
) -> str | None:
    """Given an Authorization header value, returns the GitHub username
    of the authenticated user, or None if Clerk isn't configured or the
    header is missing/invalid."""
    if not clerk_enabled() or not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    try:
        payload = await verify_clerk_jwt(token)
    except Exception:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return await get_github_username_for_user(user_id)
