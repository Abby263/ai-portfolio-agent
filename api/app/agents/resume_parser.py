import hashlib
import re
from datetime import datetime

from pydantic import BaseModel, Field

from ..config import settings
from ..models.profile import Education, Experience, Resume, Source

SECTION_HEADERS = {
    "summary": ["summary", "profile", "objective", "about"],
    "skills": ["skills", "technical skills", "technologies", "tech stack"],
    "experience": [
        "experience",
        "work experience",
        "employment",
        "professional experience",
    ],
    "education": ["education", "academic", "qualifications"],
}


class _ParsedResume(BaseModel):
    """Structured shape we ask the LLM to fill out."""

    summary: str | None = Field(
        default=None,
        description="A 2-3 sentence professional summary in first person.",
    )
    skills: list[str] = Field(
        default_factory=list,
        description="Discrete skills, tools, languages, frameworks. Deduplicated.",
    )
    experiences: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)


def _llm_parse(text: str) -> _ParsedResume | None:
    if not settings.openai_api_key:
        return None
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0
        ).with_structured_output(_ParsedResume)
        return llm.invoke(
            [
                SystemMessage(
                    content=(
                        "Extract structured data from a developer resume. "
                        "Be precise — do not invent details that aren't in the text. "
                        "Skills should be discrete tokens (e.g. 'Python', 'React', 'PostgreSQL'), not phrases."
                    )
                ),
                HumanMessage(content=text),
            ]
        )
    except Exception:
        return None


def _split_sections(text: str) -> dict[str, str]:
    """Tokenize the resume into named sections by header line."""
    lines = text.splitlines()
    sections: dict[str, list[str]] = {}
    current = "_preamble"
    sections[current] = []
    for raw in lines:
        line = raw.strip()
        lower = line.lower().rstrip(":")
        matched = next(
            (k for k, aliases in SECTION_HEADERS.items() if lower in aliases),
            None,
        )
        if matched:
            current = matched
            sections.setdefault(current, [])
        else:
            sections[current].append(raw)
    return {k: "\n".join(v).strip() for k, v in sections.items() if v}


def _deterministic_parse(text: str) -> _ParsedResume:
    sections = _split_sections(text)

    summary = sections.get("summary")
    if summary:
        summary = " ".join(summary.split())[:600]

    skills_text = sections.get("skills", "")
    skills_tokens = re.split(r"[,;\n•\-·•|/]+", skills_text)
    skills = [s.strip() for s in skills_tokens if 1 < len(s.strip()) < 40]
    skills = list(dict.fromkeys(skills))[:25]

    experiences: list[Experience] = []
    exp_text = sections.get("experience", "")
    for block in re.split(r"\n\s*\n", exp_text):
        block = block.strip()
        if not block:
            continue
        first_line, *rest = block.splitlines()
        parts = [p.strip() for p in re.split(r"[—–\-|@,]", first_line) if p.strip()]
        if not parts:
            continue
        company = parts[0]
        role = parts[1] if len(parts) > 1 else ""
        highlights = [
            re.sub(r"^[\-\*•·]\s*", "", line).strip()
            for line in rest
            if line.strip() and re.match(r"^\s*[\-\*•·]", line)
        ]
        experiences.append(
            Experience(company=company, role=role or "", highlights=highlights[:5])
        )

    education: list[Education] = []
    edu_text = sections.get("education", "")
    for block in re.split(r"\n\s*\n", edu_text):
        block = block.strip()
        if not block:
            continue
        first_line = block.splitlines()[0]
        parts = [p.strip() for p in re.split(r"[—–\-|@,]", first_line) if p.strip()]
        if parts:
            education.append(
                Education(
                    institution=parts[0],
                    degree=parts[1] if len(parts) > 1 else None,
                )
            )

    return _ParsedResume(
        summary=summary, skills=skills, experiences=experiences, education=education
    )


def parse_resume(text: str, fetched_at: datetime) -> Resume:
    text = text.strip()
    if not text:
        raise ValueError("Resume text is empty")

    parsed = _llm_parse(text) or _deterministic_parse(text)
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]
    return Resume(
        summary=parsed.summary,
        skills=parsed.skills,
        experiences=parsed.experiences,
        education=parsed.education,
        raw_text=text,
        sources=[
            Source(connector="resume", source_id=digest, fetched_at=fetched_at)
        ],
    )
