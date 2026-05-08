from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from ..connectors.github import GitHubConnector, now_utc
from ..models.profile import Profile, Resume
from .profile_builder import synthesize_profile
from .resume_parser import parse_resume
from .storyteller import tell_story


class AgentState(TypedDict, total=False):
    username: str
    resume_text: str | None
    github_user: dict
    github_repos: list[dict]
    resume: Resume | None
    profile: Profile


async def fetch_github_node(state: AgentState) -> AgentState:
    gh = GitHubConnector()
    user = await gh.fetch_user(state["username"])
    repos = await gh.fetch_repos(state["username"])
    pinned_names = await gh.fetch_pinned_repo_names(state["username"])
    pinned_keys = {name.lower() for name in pinned_names}

    seen = {repo.get("name", "").lower() for repo in repos}
    for pinned_name in pinned_names:
        if pinned_name.lower() in seen:
            continue
        try:
            repos.append(await gh.fetch_repo(state["username"], pinned_name))
        except Exception:
            continue
    for repo in repos:
        repo["_pinned"] = repo.get("name", "").lower() in pinned_keys
    return {"github_user": user, "github_repos": repos}


async def parse_resume_node(state: AgentState) -> AgentState:
    text = state.get("resume_text")
    if not text:
        return {"resume": None}
    return {"resume": parse_resume(text, fetched_at=now_utc())}


async def synthesize_node(state: AgentState) -> AgentState:
    profile = synthesize_profile(
        username=state["username"],
        user=state["github_user"],
        repos=state["github_repos"],
        resume=state.get("resume"),
        fetched_at=now_utc(),
    )
    return {"profile": profile}


async def tell_story_node(state: AgentState) -> AgentState:
    profile = state["profile"]
    return {"profile": tell_story(profile)}


def _build_graph():
    g = StateGraph(AgentState)
    g.add_node("fetch_github", fetch_github_node)
    g.add_node("parse_resume", parse_resume_node)
    g.add_node("synthesize", synthesize_node)
    g.add_node("tell_story", tell_story_node)
    g.add_edge(START, "fetch_github")
    g.add_edge(START, "parse_resume")
    g.add_edge("fetch_github", "synthesize")
    g.add_edge("parse_resume", "synthesize")
    g.add_edge("synthesize", "tell_story")
    g.add_edge("tell_story", END)
    return g.compile()


_graph = None


def graph():
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


async def build_profile(
    username: str,
    *,
    resume_text: str | None = None,
) -> Profile:
    result = await graph().ainvoke(
        {
            "username": username,
            "resume_text": resume_text,
        }
    )
    profile = result.get("profile")
    if profile is None:
        raise ValueError("Failed to build profile")
    return profile
