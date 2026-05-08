import base64
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

    @property
    def has_write_token(self) -> bool:
        return bool(self.token)

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

    async def fetch_repo(self, owner: str, repo: str) -> dict:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}", headers=self._headers
            )
            if r.status_code == 404:
                raise ValueError(f"Repo not found: {owner}/{repo}")
            r.raise_for_status()
            return r.json()

    async def fetch_file(
        self, owner: str, repo: str, path: str, *, ref: str | None = None
    ) -> dict | None:
        """Returns {content, sha} or None if the file doesn't exist."""
        params = {"ref": ref} if ref else None
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                params=params,
                headers=self._headers,
            )
            if r.status_code == 404:
                return None
            r.raise_for_status()
            data = r.json()
            content_b64 = data.get("content", "")
            try:
                text = base64.b64decode(content_b64).decode("utf-8", errors="replace")
            except Exception:
                text = ""
            return {"content": text, "sha": data["sha"]}

    async def fetch_branch_sha(self, owner: str, repo: str, branch: str) -> str:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}",
                headers=self._headers,
            )
            r.raise_for_status()
            return r.json()["object"]["sha"]

    async def create_branch(
        self, owner: str, repo: str, new_branch: str, base_sha: str
    ) -> dict:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"{GITHUB_API}/repos/{owner}/{repo}/git/refs",
                json={"ref": f"refs/heads/{new_branch}", "sha": base_sha},
                headers=self._headers,
            )
            if r.status_code in (201, 200):
                return r.json()
            r.raise_for_status()
            return r.json()

    async def put_file(
        self,
        owner: str,
        repo: str,
        path: str,
        *,
        content: str,
        message: str,
        branch: str,
        sha: str | None = None,
    ) -> dict:
        body: dict = {
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
            "branch": branch,
        }
        if sha:
            body["sha"] = sha
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.put(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                json=body,
                headers=self._headers,
            )
            r.raise_for_status()
            return r.json()

    async def open_pull_request(
        self,
        owner: str,
        repo: str,
        *,
        title: str,
        body: str,
        head: str,
        base: str,
    ) -> dict:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
                json={"title": title, "body": body, "head": head, "base": base},
                headers=self._headers,
            )
            r.raise_for_status()
            return r.json()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
