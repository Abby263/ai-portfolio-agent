from pydantic import BaseModel, Field

from ..config import settings
from ..models.profile import Profile


class SuggestedAction(BaseModel):
    """A write-side action the developer might want to take next."""

    label: str = Field(..., description="Short button-style label (3-6 words).")
    description: str = Field(..., description="One-line explanation of what would happen.")
    kind: str = Field(
        ...,
        description=(
            "Which write-side agent would handle this. One of: "
            "'readme_update', 'pr_creation', 'case_study', 'linkedin_post', 'other'."
        ),
    )


class CommandResponse(BaseModel):
    answer: str
    suggested_actions: list[SuggestedAction] = Field(default_factory=list)


def _profile_brief(profile: Profile) -> str:
    top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:8]
    project_lines = "\n".join(
        f"- {p.name} ({p.language or '?'}, {p.stars}★, topics={p.topics[:4]}): {p.description or ''}"
        for p in top
    )
    exp_lines = ""
    if profile.experiences:
        exp_lines = "\nExperience:\n" + "\n".join(
            f"- {e.role} at {e.company}" for e in profile.experiences[:5]
        )
    return (
        f"Developer: {profile.display_name or profile.username} (@{profile.username})\n"
        f"Tagline: {profile.tagline or ''}\n"
        f"Bio: {profile.bio or ''}\n"
        f"Skills: {', '.join(profile.skills[:15])}\n"
        f"Themes: {', '.join(profile.themes)}\n"
        f"{exp_lines}\n\n"
        f"Top projects:\n{project_lines}"
    )


def _llm_route(profile: Profile, command: str) -> CommandResponse | None:
    if not settings.openai_api_key:
        return None
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.2,
        ).with_structured_output(CommandResponse)
        return llm.invoke(
            [
                SystemMessage(
                    content=(
                        "You are an assistant inside a developer's AI-powered portfolio. "
                        "Answer questions about the developer's work using ONLY the supplied profile. "
                        "Do not invent facts. If the user asks for an action you can't take from this read-only "
                        "context (e.g. 'update READMEs', 'open PRs', 'post to LinkedIn'), describe what you "
                        "would do and add a suggested_action with the matching `kind`. "
                        "Be concise — answers should fit in a few sentences."
                    )
                ),
                HumanMessage(
                    content=(
                        f"PROFILE:\n{_profile_brief(profile)}\n\n"
                        f"COMMAND: {command}"
                    )
                ),
            ]
        )
    except Exception:
        return None


def _deterministic_route(profile: Profile, command: str) -> CommandResponse:
    cmd = command.lower().strip()

    def langs() -> list[str]:
        from collections import Counter

        c = Counter(p.language for p in profile.projects if p.language)
        return [name for name, _ in c.most_common(5)]

    if any(k in cmd for k in ("language", "tech", "stack", "skills")):
        top = langs() or profile.skills[:5]
        if not top:
            return CommandResponse(answer="No language data is available yet.")
        return CommandResponse(
            answer=f"Top languages and skills: {', '.join(top)}."
        )

    if any(k in cmd for k in ("project", "best", "strongest", "top")):
        top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:3]
        if not top:
            return CommandResponse(answer="No projects to summarise yet.")
        bullets = "\n".join(
            f"- {p.name} ({p.stars}★): {p.description or '—'}" for p in top
        )
        return CommandResponse(answer=f"Top projects:\n{bullets}")

    if "tagline" in cmd or "headline" in cmd:
        return CommandResponse(
            answer=profile.tagline or "No tagline has been generated yet."
        )

    if "story" in cmd or "summary" in cmd or "about" in cmd:
        return CommandResponse(
            answer=profile.story or "No story has been generated yet."
        )

    if "readme" in cmd:
        return CommandResponse(
            answer=(
                "I'd update READMEs across your repos with refreshed summaries and "
                "architecture sections. The write-side agent isn't wired up yet."
            ),
            suggested_actions=[
                SuggestedAction(
                    label="Update all READMEs",
                    description="Draft README improvements and open PRs for each repo.",
                    kind="readme_update",
                )
            ],
        )

    if "pr" in cmd or "pull request" in cmd:
        return CommandResponse(
            answer=(
                "Opening PRs requires the write-side agent. "
                "Tell me what change you want and I'll draft the proposal."
            ),
            suggested_actions=[
                SuggestedAction(
                    label="Draft a PR",
                    description="Plan a change and open a draft PR for review.",
                    kind="pr_creation",
                )
            ],
        )

    return CommandResponse(
        answer=(
            "I can answer questions about your projects, skills, and story. "
            "Set OPENAI_API_KEY for free-form commands."
        )
    )


def route_command(profile: Profile, command: str) -> CommandResponse:
    command = command.strip()
    if not command:
        raise ValueError("Empty command")
    return _llm_route(profile, command) or _deterministic_route(profile, command)
