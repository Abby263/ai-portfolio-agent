from pydantic import BaseModel, Field

from ..config import settings


class DraftReadme(BaseModel):
    proposed: str = Field(..., description="The full proposed README markdown.")
    summary: str = Field(
        ...,
        description="A 1-2 sentence summary of what changed compared to the existing README.",
    )


def _llm_draft(repo: dict, current_readme: str | None) -> DraftReadme | None:
    if not settings.openai_api_key:
        return None
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.2,
        ).with_structured_output(DraftReadme)
        return llm.invoke(
            [
                SystemMessage(
                    content=(
                        "You are a README Update Agent. Produce a clear, well-structured "
                        "README in markdown for a developer's GitHub repo. "
                        "Sections in order: title (H1), one-paragraph summary, 'Why' or context "
                        "if available, 'Architecture' (with a Mermaid diagram placeholder if appropriate), "
                        "'Quickstart' with shell commands, and 'Status'. "
                        "Preserve any badges, license, or contributor sections present in the existing README. "
                        "Do not invent features; ground every claim in the supplied repo metadata or existing README."
                    )
                ),
                HumanMessage(
                    content=(
                        f"Repo: {repo.get('full_name')}\n"
                        f"Description: {repo.get('description')}\n"
                        f"Language: {repo.get('language')}\n"
                        f"Topics: {repo.get('topics') or []}\n"
                        f"Homepage: {repo.get('homepage') or ''}\n"
                        f"Stars: {repo.get('stargazers_count')}\n\n"
                        f"--- Current README ---\n{current_readme or '(none)'}\n--- end ---"
                    )
                ),
            ]
        )
    except Exception:
        return None


def _deterministic_draft(repo: dict, current_readme: str | None) -> DraftReadme:
    name = repo.get("name", "project")
    description = repo.get("description") or "TODO: short description."
    language = repo.get("language") or ""
    topics = repo.get("topics") or []
    homepage = repo.get("homepage") or ""

    arch_section = (
        "## Architecture\n\n"
        "```mermaid\nflowchart LR\n  user[User] --> app[App] --> svc[Services]\n```\n"
    )
    topics_line = (
        f"\n**Topics:** {', '.join(topics)}\n" if topics else ""
    )
    homepage_line = f"\n**Homepage:** <{homepage}>\n" if homepage else ""

    proposed = (
        f"# {name}\n\n"
        f"{description}\n"
        f"{topics_line}{homepage_line}\n"
        f"## Quickstart\n\n"
        f"```bash\ngit clone https://github.com/{repo.get('full_name')}.git\ncd {name}\n"
        + (f"# {language} project\n" if language else "")
        + "# install + run instructions go here\n```\n\n"
        f"{arch_section}\n"
        f"## Status\n\nMaintained — see issues for current roadmap.\n"
    )
    summary = (
        "Added a structured README with summary, quickstart, "
        "architecture placeholder, and status."
    )
    return DraftReadme(proposed=proposed, summary=summary)


def draft_readme(repo: dict, current_readme: str | None) -> DraftReadme:
    return _llm_draft(repo, current_readme) or _deterministic_draft(
        repo, current_readme
    )
