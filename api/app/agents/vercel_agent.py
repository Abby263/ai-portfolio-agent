from datetime import datetime

from ..models.profile import Project, Source


def _repo_key(deployment: dict) -> str | None:
    """Extract the GitHub repo name a Vercel deployment was built from."""
    meta = deployment.get("meta") or {}
    git_source = deployment.get("gitSource") or {}
    candidates = (
        meta.get("githubCommitRepo"),
        meta.get("githubRepo"),
        git_source.get("repo"),
        deployment.get("name"),
    )
    for c in candidates:
        if c:
            return str(c).lower()
    return None


def _pick_best(deployments: list[dict]) -> dict:
    """Prefer the most recent production deployment, else the most recent ready one."""
    prod = [d for d in deployments if d.get("target") == "production"]
    pool = prod or deployments
    return max(pool, key=lambda d: d.get("created", 0))


def enrich_projects_with_deployments(
    projects: list[Project],
    deployments: list[dict],
    *,
    fetched_at: datetime,
) -> list[Project]:
    """Mutates projects in place; returns the same list for chaining."""
    if not deployments:
        return projects

    by_repo: dict[str, list[dict]] = {}
    for d in deployments:
        key = _repo_key(d)
        if key:
            by_repo.setdefault(key, []).append(d)

    for project in projects:
        matches = by_repo.get(project.name.lower())
        if not matches:
            continue
        best = _pick_best(matches)
        url = best.get("url")
        if url and not url.startswith("http"):
            url = f"https://{url}"
        project.deployment_url = url
        project.deployment_target = best.get("target") or "preview"
        project.deployment_count = len(matches)
        project.sources.append(
            Source(
                connector="vercel",
                source_id=str(best.get("uid") or url or project.name),
                fetched_at=fetched_at,
            )
        )
    return projects
