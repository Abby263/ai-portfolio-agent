from datetime import datetime, timezone

import httpx

from ..config import settings

GITHUB_API = "https://api.github.com"


class GitHubConnector:
    def __init__(self, token: str | None = None) -> None:
        self.token = token or settings.github_token

    @property
    def _headers(self) -> dict[str, str]:
        h = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def fetch_user(self, username: str) -> dict:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(f"{GITHUB_API}/users/{username}", headers=self._headers)
            if r.status_code == 404:
                raise ValueError(f"GitHub user not found: {username}")
            r.raise_for_status()
            return r.json()

    async def fetch_repos(self, username: str, *, limit: int = 30) -> list[dict]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{GITHUB_API}/users/{username}/repos",
                params={"sort": "updated", "per_page": limit, "type": "owner"},
                headers=self._headers,
            )
            r.raise_for_status()
            return r.json()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
