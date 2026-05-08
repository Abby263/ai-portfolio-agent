from collections import Counter
from datetime import datetime

from ..config import settings
from ..models.profile import Profile, Project, Source


def _project_from_repo(repo: dict, fetched_at: datetime) -> Project:
    return Project(
        name=repo["name"],
        description=repo.get("description"),
        repo_url=repo.get("html_url"),
        homepage=(repo.get("homepage") or None),
        language=repo.get("language"),
        stars=repo.get("stargazers_count", 0),
        topics=repo.get("topics") or [],
        sources=[
            Source(
                connector="github",
                source_id=str(repo["id"]),
                fetched_at=fetched_at,
            )
        ],
    )


def _skills_from_repos(repos: list[dict], k: int = 12) -> list[str]:
    languages = Counter(r["language"] for r in repos if r.get("language"))
    topics = Counter(t for r in repos for t in (r.get("topics") or []))
    combined = languages + topics
    return [name for name, _ in combined.most_common(k)]


def _llm_story(profile: Profile) -> str | None:
    if not settings.openai_api_key:
        return None
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key)
        top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:5]
        repo_lines = "\n".join(
            f"- {p.name} ({p.language or '?'}, {p.stars}★): {p.description or ''}"
            for p in top
        )
        messages = [
            SystemMessage(
                content=(
                    "You write short, engaging developer narratives. "
                    "2-3 paragraphs, first person, concrete and specific."
                )
            ),
            HumanMessage(
                content=(
                    f"Developer: {profile.display_name or profile.username}\n"
                    f"Bio: {profile.bio or ''}\n\n"
                    f"Top projects:\n{repo_lines}\n\n"
                    "Write a developer story."
                )
            ),
        ]
        return llm.invoke(messages).content
    except Exception:
        return None


def synthesize_profile(
    *,
    username: str,
    user: dict,
    repos: list[dict],
    fetched_at: datetime,
) -> Profile:
    projects = sorted(
        [_project_from_repo(r, fetched_at) for r in repos if not r.get("fork")],
        key=lambda p: p.stars,
        reverse=True,
    )
    links: dict[str, str] = {}
    if user.get("html_url"):
        links["github"] = user["html_url"]
    if user.get("blog"):
        links["blog"] = user["blog"]
    if user.get("twitter_username"):
        links["twitter"] = f"https://twitter.com/{user['twitter_username']}"

    profile = Profile(
        username=username,
        display_name=user.get("name") or username,
        headline=user.get("bio"),
        bio=user.get("bio"),
        avatar_url=user.get("avatar_url"),
        location=user.get("location"),
        skills=_skills_from_repos(repos),
        projects=projects,
        links=links,
        sources=[
            Source(
                connector="github",
                source_id=str(user["id"]),
                fetched_at=fetched_at,
            )
        ],
        generated_at=fetched_at,
    )
    profile.story = _llm_story(profile)
    return profile
