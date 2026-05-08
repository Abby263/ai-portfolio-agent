from collections import Counter

from pydantic import BaseModel, Field

from ..config import settings
from ..models.profile import Profile


class _ProjectHighlights(BaseModel):
    name: str
    highlights: list[str] = Field(
        ...,
        description="2 or 3 short bullets that explain why this project is interesting.",
    )


class _StoryOutput(BaseModel):
    tagline: str = Field(
        ...,
        description="One concise sentence (12 words or fewer) that frames the developer.",
    )
    narrative: str = Field(
        ...,
        description="A 2-3 paragraph first-person developer story, grounded in the supplied facts.",
    )
    themes: list[str] = Field(
        default_factory=list,
        description="3-6 short tags describing recurring themes (e.g. 'dev tools', 'systems programming').",
    )
    project_highlights: list[_ProjectHighlights] = Field(default_factory=list)


def _llm_tell(profile: Profile) -> _StoryOutput | None:
    if not settings.openai_api_key:
        return None
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.4,
        ).with_structured_output(_StoryOutput)

        top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:6]
        repo_lines = "\n".join(
            f"- {p.name} ({p.language or '?'}, {p.stars}★, topics={p.topics[:4]}): {p.description or ''}"
            for p in top
        )
        resume_block = (
            f"\nResume summary: {profile.resume_summary}\n"
            if profile.resume_summary
            else ""
        )
        exp_lines = ""
        if profile.experiences:
            exp_lines = "\nExperience:\n" + "\n".join(
                f"- {e.role} at {e.company}" for e in profile.experiences[:5]
            )

        return llm.invoke(
            [
                SystemMessage(
                    content=(
                        "You are a developer storytelling agent. "
                        "Generate a tagline, a 2-3 paragraph first-person narrative, "
                        "themes, and 2-3 highlights per top project. "
                        "Be specific and concrete. NEVER invent facts that aren't in the supplied data."
                    )
                ),
                HumanMessage(
                    content=(
                        f"Developer: {profile.display_name or profile.username}\n"
                        f"Bio: {profile.bio or ''}{resume_block}{exp_lines}\n"
                        f"Skills: {', '.join(profile.skills[:12])}\n\n"
                        f"Top projects:\n{repo_lines}"
                    )
                ),
            ]
        )
    except Exception:
        return None


def _deterministic_tell(profile: Profile) -> _StoryOutput:
    top_skills = profile.skills[:3]
    top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:5]

    skill_phrase = ", ".join(top_skills) if top_skills else "open-source"
    tagline = (
        f"{profile.display_name or profile.username}: "
        f"{skill_phrase} developer with {len(profile.projects)} public projects."
    )

    paragraphs: list[str] = []
    if profile.resume_summary:
        paragraphs.append(profile.resume_summary)
    elif profile.bio:
        paragraphs.append(profile.bio)
    if top:
        names = ", ".join(p.name for p in top[:3])
        paragraphs.append(
            f"Recent work spans {names}, with a focus on {skill_phrase}."
        )

    topic_counter: Counter[str] = Counter()
    for p in profile.projects:
        for t in p.topics:
            topic_counter[t] += 1
    themes = [t for t, _ in topic_counter.most_common(5)] or top_skills

    highlights: list[_ProjectHighlights] = []
    for p in top:
        bullets: list[str] = []
        if p.description:
            bullets.append(p.description)
        if p.language:
            bullets.append(f"Built primarily in {p.language}.")
        if p.stars > 0:
            bullets.append(f"{p.stars:,} stars on GitHub.")
        if bullets:
            highlights.append(
                _ProjectHighlights(name=p.name, highlights=bullets[:3])
            )

    return _StoryOutput(
        tagline=tagline,
        narrative="\n\n".join(paragraphs) or tagline,
        themes=themes,
        project_highlights=highlights,
    )


def tell_story(profile: Profile) -> Profile:
    """Enrich a profile with tagline, narrative, themes, and per-project highlights."""
    out = _llm_tell(profile) or _deterministic_tell(profile)
    profile.tagline = out.tagline
    profile.story = out.narrative
    profile.themes = out.themes

    by_name = {ph.name: ph.highlights for ph in out.project_highlights}
    for project in profile.projects:
        existing = by_name.get(project.name)
        if existing:
            project.highlights = existing
    return profile
