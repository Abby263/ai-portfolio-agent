import httpx

VERCEL_API = "https://api.vercel.com"


class VercelConnector:
    """Thin client around the Vercel REST API. Token is per-user — never persisted."""

    def __init__(self, token: str) -> None:
        if not token:
            raise ValueError("Vercel token required")
        self.token = token

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    async def fetch_deployments(self, *, limit: int = 100) -> list[dict]:
        """Returns recent READY deployments for the authenticated user."""
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{VERCEL_API}/v6/deployments",
                params={"limit": limit, "state": "READY"},
                headers=self._headers,
            )
            if r.status_code in (401, 403):
                raise ValueError("Vercel token rejected (check scopes/expiry)")
            r.raise_for_status()
            return r.json().get("deployments", [])

    async def fetch_user(self) -> dict:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{VERCEL_API}/v2/user", headers=self._headers
            )
            if r.status_code in (401, 403):
                raise ValueError("Vercel token rejected (check scopes/expiry)")
            r.raise_for_status()
            return r.json().get("user", {})
