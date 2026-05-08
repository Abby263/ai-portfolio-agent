import hashlib
import re
from datetime import datetime

from pydantic import BaseModel, Field

from ..config import settings
from ..models.profile import Education, Experience, Resume, Source

SECTION_HEADERS = {
    "summary": [
        "summary",
        "professional summary",
        "profile",
        "objective",
        "about",
        "about me",
    ],
    "skills": ["skills", "technical skills", "technologies", "tech stack"],
    "experience": [
        "experience",
        "work experience",
        "employment",
        "professional experience",
        "professional background",
        "work history",
        "career history",
        "employment history",
    ],
    "education": ["education", "academic", "qualifications", "academics"],
}

ROLE_WORDS = {
    "architect",
    "consultant",
    "developer",
    "engineer",
    "founder",
    "intern",
    "lead",
    "manager",
    "scientist",
    "specialist",
    "analyst",
    "director",
    "leader",
    "owner",
}

BULLET_RE = re.compile(r"^[\-\*•·●○◦▪▫‣∙]\s*")
SECTION_RULE_RE = re.compile(r"[—–-]{3,}")
SUMMARY_HEADER_RE = re.compile(
    r"\b(?:highlights?|summary|professional summary|skills?|technical skills|"
    r"programming languages?|experience|professional experience|education)\b",
    re.IGNORECASE,
)
SUMMARY_STOP_RE = re.compile(
    r"\b(?:skills?|technical skills|programming languages?|experience|"
    r"professional experience|education)\b",
    re.IGNORECASE,
)
DATE_RE = re.compile(
    r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|"
    r"january|february|march|april|june|july|august|september|october|"
    r"november|december|\d{4}|present|current)\b",
    re.IGNORECASE,
)


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
    links: dict[str, str] = Field(default_factory=dict)


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
                        "Skills should be discrete tokens (e.g. 'Python', 'React', 'PostgreSQL'), not phrases. "
                        "Extract contact links exactly when present: email, phone, linkedin, github, website."
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
        lower = re.sub(r"\s+", " ", line.lower().strip(" :-|"))
        matched = next(
            (
                k
                for k, aliases in SECTION_HEADERS.items()
                if lower in aliases
                or (
                    len(lower) <= 60
                    and any(
                        lower.startswith(f"{alias} ")
                        or lower.endswith(f" {alias}")
                        for alias in aliases
                    )
                )
            ),
            None,
        )
        if matched:
            current = matched
            sections.setdefault(current, [])
        else:
            sections[current].append(raw)
    return {k: "\n".join(v).strip() for k, v in sections.items() if v}


def _looks_like_role(value: str) -> bool:
    lower = " ".join(value.lower().split())
    if not lower or lower.startswith(("skill set", "skills", "technical skills")):
        return False
    if lower in {"prompt engineering", "engineering", "software development"}:
        return False
    return any(re.search(rf"\b{re.escape(word)}\b", lower) for word in ROLE_WORDS)


def _is_bullet_line(value: str) -> bool:
    return bool(BULLET_RE.match(value.strip()))


def _strip_bullet(value: str) -> str:
    return BULLET_RE.sub("", value).strip()


def _clean_summary_text(value: str) -> str:
    value = SECTION_RULE_RE.sub(" ", value)
    value = SUMMARY_HEADER_RE.sub(" ", value)
    value = re.sub(r"\s+", " ", value).strip(" :-|•●○")
    return value


def _summary_from_highlights(text: str) -> str | None:
    normalized = SECTION_RULE_RE.sub(" ", text)
    pieces = re.split(r"[●•○◦▪▫‣∙]\s*", normalized)
    highlights: list[str] = []
    for piece in pieces:
        piece = SUMMARY_STOP_RE.split(piece, maxsplit=1)[0]
        cleaned = _clean_summary_text(piece)
        lower = cleaned.lower()
        if len(cleaned) < 45:
            continue
        if lower.startswith(("programming", "skill set", "tools", "frameworks")):
            continue
        if re.search(r"\b(?:and|or|to|for|with|into|of|in|at)$", cleaned, re.I):
            continue
        highlights.append(cleaned)
        if len(highlights) >= 3:
            break
    summary = " ".join(highlights).strip()
    return summary[:600] if summary else None


def _clean_org_line(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(
        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)"
        r"[a-z]*\.?\s+\d{4}\b",
        "",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(r"\b(?:present|current)\b", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\b\d{4}\b", "", value)
    return value.strip(" ,-–—|")


def _experience_blocks(exp_text: str) -> list[list[str]]:
    lines = [line.strip() for line in exp_text.splitlines() if line.strip()]
    if not lines:
        return []

    blocks: list[list[str]] = []
    current: list[str] = []
    saw_detail = False
    for line in lines:
        is_bullet = _is_bullet_line(line)
        starts_new_role = (
            current
            and saw_detail
            and not is_bullet
            and len(line) < 120
            and (
                DATE_RE.search(line)
                or _looks_like_role(line)
                or len(current) >= 4
            )
        )
        if starts_new_role:
            blocks.append(current)
            current = [line]
            saw_detail = False
            continue

        current.append(line)
        if is_bullet or len(line) > 80:
            saw_detail = True

    if current:
        blocks.append(current)
    return blocks


def _parse_experience_block(lines: list[str]) -> Experience | None:
    clean_lines = [line for line in lines if line.strip()]
    if not clean_lines:
        return None

    non_bullets = [
        _strip_bullet(line)
        for line in clean_lines
        if not _is_bullet_line(line)
    ]
    bullet_lines = [
        _strip_bullet(line)
        for line in clean_lines
        if _is_bullet_line(line)
    ]
    if not non_bullets:
        return None

    first = _clean_org_line(non_bullets[0])
    second = _clean_org_line(non_bullets[1]) if len(non_bullets) > 1 else ""

    role = ""
    company = ""
    if re.search(r"\s+at\s+", first, re.IGNORECASE):
        role, company = [
            part.strip()
            for part in re.split(r"\s+at\s+", first, maxsplit=1, flags=re.IGNORECASE)
        ]
    else:
        parts = [
            _clean_org_line(part)
            for part in re.split(r"\s+[—–-]\s+|\s+\|\s+|@", first)
            if _clean_org_line(part)
        ]
        if len(parts) >= 2:
            if _looks_like_role(parts[0]) and not _looks_like_role(parts[1]):
                role, company = parts[0], parts[1]
            else:
                company, role = parts[0], parts[1]
        elif second:
            if _looks_like_role(first) and not _looks_like_role(second):
                role, company = first, second
            elif _looks_like_role(second) and not _looks_like_role(first):
                company, role = first, second
            else:
                company, role = first, second
        else:
            company = first

    remaining = non_bullets[2:] if second else non_bullets[1:]
    highlights = [
        h
        for h in bullet_lines
        + [
            line
            for line in remaining
            if len(line) > 30 and not DATE_RE.fullmatch(line)
        ]
        if h
    ]
    summary = None
    if not highlights and len(remaining) == 1 and len(remaining[0]) > 30:
        summary = remaining[0]

    if not company and not role:
        return None
    return Experience(
        company=company,
        role=role,
        summary=summary,
        highlights=highlights[:6],
    )


def _loose_experience_scan(text: str) -> list[Experience]:
    """Fallback for PDF text without reliable section headings."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    experiences: list[Experience] = []
    seen: set[str] = set()

    for index, line in enumerate(lines):
        lower = line.lower()
        if _is_bullet_line(line):
            continue
        if not _looks_like_role(line) or len(line) > 140:
            continue
        if any(
            marker in lower
            for marker in ("github.com", "linkedin.com", "technical skills")
        ):
            continue
        if lower.startswith(("skill set", "skills", "tools", "programming")):
            continue

        previous = lines[index - 1] if index > 0 else ""
        include_previous = (
            bool(previous)
            and len(previous) < 80
            and "." not in previous
            and not _looks_like_role(previous)
            and not _is_bullet_line(previous)
            and not SUMMARY_HEADER_RE.search(previous)
        )
        block_start = index - 1 if include_previous else index
        block_end = min(len(lines), index + 6)
        block = [
            candidate
            for candidate in lines[block_start:block_end]
            if "@" not in candidate
            and "linkedin.com" not in candidate.lower()
            and "github.com" not in candidate.lower()
        ]
        parsed = _parse_experience_block(block)
        if parsed is None:
            continue
        key = f"{parsed.company.lower()}::{parsed.role.lower()}"
        if key in seen:
            continue
        seen.add(key)
        experiences.append(parsed)
        if len(experiences) >= 6:
            break

    return experiences


def _fallback_summary(text: str) -> str | None:
    lines = []
    for line in text.splitlines():
        cleaned = _clean_summary_text(" ".join(line.split()).strip())
        lower = cleaned.lower()
        if not cleaned:
            continue
        if lower in {"summary", "highlights", "skills", "experience", "education"}:
            continue
        if any(token in lower for token in ("linkedin.com", "github.com", "email")):
            continue
        if re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", cleaned):
            continue
        if re.search(r"\+?\d[\d\s().-]{7,}\d", cleaned):
            continue
        if len(cleaned) < 24 and not _looks_like_role(cleaned):
            continue
        lines.append(cleaned)
        if len(lines) >= 4:
            break

    summary = " ".join(lines)
    return summary[:600] if len(summary) > 60 else None


def _normalize_url(value: str) -> str:
    value = value.strip().rstrip(".,;)")
    if re.match(r"^https?://", value, re.IGNORECASE):
        return value
    return f"https://{value.lstrip('/')}"


def _extract_links(text: str) -> dict[str, str]:
    links: dict[str, str] = {}

    email = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text
    )
    if email:
        links["email"] = email.group(0)

    phone_matches = re.finditer(
        r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)", text
    )
    for match in phone_matches:
        candidate = " ".join(match.group(0).split()).strip()
        digits = re.sub(r"\D", "", candidate)
        if 10 <= len(digits) <= 15:
            links["phone"] = candidate
            break

    url_pattern = re.compile(
        r"(?:https?://)?(?:www\.)?(?:linkedin\.com|github\.com)/[^\s<>)]+|https?://[^\s<>)]+",
        re.IGNORECASE,
    )
    for match in url_pattern.finditer(text):
        url = _normalize_url(match.group(0))
        lower = url.lower()
        if "linkedin.com/" in lower:
            links.setdefault("linkedin", url)
        elif "github.com/" in lower:
            links.setdefault("github", url)
        elif not any(skip in lower for skip in ("mailto:", "tel:")):
            links.setdefault("website", url)

    return links


def _deterministic_parse(text: str) -> _ParsedResume:
    sections = _split_sections(text)

    summary = sections.get("summary")
    if summary:
        summary = _summary_from_highlights(summary) or _clean_summary_text(summary)[:600]
    elif sections.get("_preamble"):
        preamble_lines = [
            line.strip()
            for line in sections["_preamble"].splitlines()
            if line.strip()
            and "@" not in line
            and "linkedin.com" not in line.lower()
            and "github.com" not in line.lower()
            and not re.search(r"\+?\d[\d\s().-]{7,}\d", line)
        ]
        summary_text = " ".join(preamble_lines[1:4] or preamble_lines[:3])
        summary = (
            _summary_from_highlights(summary_text)
            or (_clean_summary_text(summary_text)[:600] if len(summary_text) > 80 else None)
        )
    if not summary:
        summary = _summary_from_highlights(text)
    if not summary:
        summary = _fallback_summary(text)

    skills_text = sections.get("skills", "")
    skills_tokens = re.split(r"[,;\n•\-·•|/]+", skills_text)
    skills = [s.strip() for s in skills_tokens if 1 < len(s.strip()) < 40]
    skills = list(dict.fromkeys(skills))[:25]

    experiences = [
        exp
        for exp in (
            _parse_experience_block(block)
            for block in _experience_blocks(sections.get("experience", ""))
        )
        if exp is not None
    ]
    if not experiences:
        experiences = _loose_experience_scan(text)

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
        summary=summary,
        skills=skills,
        experiences=experiences[:8],
        education=education,
        links=_extract_links(text),
    )


def parse_resume(text: str, fetched_at: datetime) -> Resume:
    text = text.strip()
    if not text:
        raise ValueError("Resume text is empty")

    deterministic = _deterministic_parse(text)
    llm_parsed = _llm_parse(text)
    parsed = llm_parsed or deterministic
    links = {**deterministic.links, **parsed.links, **_extract_links(text)}
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]
    return Resume(
        summary=parsed.summary or deterministic.summary,
        skills=parsed.skills or deterministic.skills,
        experiences=parsed.experiences or deterministic.experiences,
        education=parsed.education or deterministic.education,
        links=links,
        raw_text=text,
        sources=[
            Source(connector="resume", source_id=digest, fetched_at=fetched_at)
        ],
    )
