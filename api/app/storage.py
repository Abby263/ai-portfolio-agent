"""Vercel KV (Upstash Redis REST) storage for owner customizations.

Gracefully no-ops when KV env vars aren't configured so the rest of the
API keeps working.
"""

import json
from typing import Any

import httpx

from .config import settings


def kv_enabled() -> bool:
    return bool(settings.kv_rest_api_url and settings.kv_rest_api_token)


def _key(username: str) -> str:
    return f"customizations:{username.lower()}"


async def _kv_get(key: str) -> str | None:
    if not kv_enabled():
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{settings.kv_rest_api_url}/get/{key}",
            headers={"Authorization": f"Bearer {settings.kv_rest_api_token}"},
        )
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json().get("result")


async def _kv_set(key: str, value: str) -> None:
    if not kv_enabled():
        return
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.kv_rest_api_url}/set/{key}",
            content=value,
            headers={"Authorization": f"Bearer {settings.kv_rest_api_token}"},
        )
        r.raise_for_status()


async def get_customizations(username: str) -> dict[str, Any]:
    """Returns the saved customizations for a user, or {} if none / KV off."""
    raw = await _kv_get(_key(username))
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


async def save_customizations(
    username: str, patch: dict[str, Any]
) -> dict[str, Any]:
    """Merges the patch onto existing customizations and persists. Returns
    the merged dict. No-ops when KV is disabled."""
    if not kv_enabled():
        return patch
    existing = await get_customizations(username)
    merged: dict[str, Any] = {**existing}
    for k, v in patch.items():
        # None means clear the field; "" also clears.
        if v is None or v == "":
            merged.pop(k, None)
        else:
            merged[k] = v
    await _kv_set(_key(username), json.dumps(merged))
    return merged
