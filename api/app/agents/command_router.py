import re

from pydantic import BaseModel, Field

from ..config import settings
from ..models.profile import Profile

MAX_RESUME_CONTEXT_CHARS = 12_000
MAX_SNIPPETS = 6


class SuggestedAction(BaseModel):
    """A write-side action the developer might want to take next."""

    label: str = Field(..., description="Short button-style label (3-6 words).")
    description: str = Field(
        ...,
        description="One-line explanation of what would happen.",
    )
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


def _clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _profile_brief(profile: Profile, resume_text: str | None = None) -> str:
    top = sorted(profile.projects, key=lambda p: p.stars, reverse=True)[:8]
    project_lines = "\n".join(
        (
            f"- {p.name} ({p.language or '?'}, {p.stars} stars, "
            f"topics={p.topics[:4]}, deployed={p.deployment_url or p.homepage or 'none'}): "
            f"{p.description or ''}"
        )
        for p in top
    )
    resume_lines = _resume_context(profile, resume_text)
    return (
        f"Developer: {profile.display_name or profile.username} (@{profile.username})\n"
        f"Tagline: {profile.tagline or ''}\n"
        f"Bio: {profile.bio or ''}\n"
        f"Skills and stack: {', '.join(profile.skills[:25])}\n"
        f"Themes: {', '.join(profile.themes)}\n"
        f"\nResume and work history:\n{resume_lines}\n\n"
        f"GitHub projects and deployed apps:\n{project_lines}"
    )


def _format_experience(profile: Profile) -> list[str]:
    lines: list[str] = []
    for e in profile.experiences[:8]:
        dates = " - ".join(part for part in (e.start, e.end) if part)
        heading = " ".join(
            part
            for part in (
                _clean(e.role) or "Role",
                f"at {_clean(e.company)}" if _clean(e.company) else "",
                f"({dates})" if dates else "",
            )
            if part
        )
        details = [_clean(e.summary), *[_clean(h) for h in e.highlights[:3]]]
        detail = "; ".join(item for item in details if item)
        lines.append(f"- {heading}: {detail}" if detail else f"- {heading}")
    return lines


def _format_education(profile: Profile) -> list[str]:
    lines: list[str] = []
    for item in profile.education[:5]:
        program = ", ".join(
            part for part in (_clean(item.degree), _clean(item.field)) if part
        )
        dates = " - ".join(part for part in (item.start, item.end) if part)
        suffix = " ".join(
            part for part in (program, f"({dates})" if dates else "") if part
        )
        lines.append(
            f"- {_clean(item.institution)}{': ' + suffix if suffix else ''}"
        )
    return lines


def _resume_context(profile: Profile, resume_text: str | None = None) -> str:
    sections: list[str] = []
    if profile.resume_summary:
        sections.append(f"Summary: {_clean(profile.resume_summary)}")
    if profile.experiences:
        sections.append("Experience:\n" + "\n".join(_format_experience(profile)))
    if profile.education:
        sections.append("Education:\n" + "\n".join(_format_education(profile)))
    if profile.links:
        link_lines = "\n".join(
            f"- {label}: {value}" for label, value in sorted(profile.links.items())
        )
        sections.append(f"Resume/contact links:\n{link_lines}")
    if resume_text:
        trimmed = resume_text.strip()
        if len(trimmed) > MAX_RESUME_CONTEXT_CHARS:
            trimmed = trimmed[:MAX_RESUME_CONTEXT_CHARS].rsplit("\n", 1)[0]
        sections.append(f"Uploaded resume text excerpt:\n{trimmed}")
    return "\n\n".join(sections) if sections else "No resume data is connected."


def _question_tokens(command: str) -> set[str]:
    stop = {
        "about",
        "after",
        "also",
        "and",
        "are",
        "can",
        "did",
        "does",
        "for",
        "from",
        "has",
        "have",
        "his",
        "how",
        "into",
        "resume",
        "show",
        "tell",
        "that",
        "the",
        "their",
        "this",
        "was",
        "what",
        "when",
        "where",
        "which",
        "with",
        "work",
    }
    return {
        token
        for token in re.findall(r"[a-z0-9+#.-]{3,}", command.lower())
        if token not in stop
    }


def _resume_snippets(resume_text: str | None, command: str) -> list[str]:
    if not resume_text:
        return []
    tokens = _question_tokens(command)
    if not tokens:
        return []
    snippets: list[str] = []
    for raw_line in resume_text.splitlines():
        line = _clean(raw_line)
        if len(line) < 12:
            continue
        haystack = line.lower()
        if any(token in haystack for token in tokens):
            snippets.append(line)
        if len(snippets) >= MAX_SNIPPETS:
            break
    return snippets


def _resume_route(
    profile: Profile, command: str, resume_text: str | None
) -> CommandResponse | None:
    cmd = command.lower()
    resume_terms = (
        "resume",
        "experience",
        "work",
        "job",
        "role",
        "career",
        "education",
        "degree",
        "college",
        "school",
        "email",
        "phone",
        "contact",
        "linkedin",
        "certification",
    )
    if not any(term in cmd for term in resume_terms):
        snippets = _resume_snippets(resume_text, command)
        if not snippets:
            return None
    else:
        snippets = _resume_snippets(resume_text, command)

    parts: list[str] = []
    if "email" in cmd and profile.links.get("email"):
        parts.append(f"Email: {profile.links['email']}")
    if "phone" in cmd and profile.links.get("phone"):
        parts.append(f"Phone: {profile.links['phone']}")
    if "linkedin" in cmd and profile.links.get("linkedin"):
        parts.append(f"LinkedIn: {profile.links['linkedin']}")
    if any(term in cmd for term in ("education", "degree", "college", "school")):
        education = _format_education(profile)
        if education:
            parts.append("Education:\n" + "\n".join(education))
    if any(term in cmd for term in ("experience", "work", "job", "role", "career")):
        experience = _format_experience(profile)
        if experience:
            parts.append("Work experience:\n" + "\n".join(experience[:5]))
    if profile.resume_summary and any(
        term in cmd for term in ("resume", "summary", "career")
    ):
        parts.append(f"Resume summary: {_clean(profile.resume_summary)}")
    if snippets:
        parts.append(
            "Matching resume details:\n" + "\n".join(f"- {s}" for s in snippets)
        )

    if parts:
        return CommandResponse(answer="\n\n".join(parts))
    if any(term in cmd for term in resume_terms):
        return CommandResponse(
            answer="No resume details are connected to this portfolio yet."
        )
    return None


def _llm_route(
    profile: Profile, command: str, resume_text: str | None = None
) -> CommandResponse | None:
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
                        "Answer questions about the developer's GitHub projects, deployed apps, "
                        "resume, work experience, education, contact links, and tech stack using ONLY "
                        "the supplied profile and resume context. "
                        "Do not invent facts. If the user asks for an action you can't take from this read-only "
                        "context (e.g. 'update READMEs', 'open PRs', 'post to LinkedIn'), describe what you "
                        "would do and add a suggested_action with the matching `kind`. "
                        "Be concise — answers should fit in a few sentences."
                    )
                ),
                HumanMessage(
                    content=(
                        f"PROFILE AND INDEXED SOURCES:\n{_profile_brief(profile, resume_text)}\n\n"
                        f"COMMAND: {command}"
                    )
                ),
            ]
        )
    except Exception:
        return None


def _deterministic_route(
    profile: Profile, command: str, resume_text: str | None = None
) -> CommandResponse:
    cmd = command.lower().strip()

    def langs() -> list[str]:
        from collections import Counter

        c = Counter(p.language for p in profile.projects if p.language)
        return [name for name, _ in c.most_common(5)]

    resume_answer = _resume_route(profile, command, resume_text)
    if resume_answer:
        return resume_answer

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
            "I can answer questions about projects, skills, story, and "
            "resume-backed work history. Set OPENAI_API_KEY for free-form "
            "commands."
        )
    )


def route_command(
    profile: Profile, command: str, resume_text: str | None = None
) -> CommandResponse:
    command = command.strip()
    if not command:
        raise ValueError("Empty command")
    return _llm_route(profile, command, resume_text) or _deterministic_route(
        profile, command, resume_text
    )
