from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from ..connectors.github import GitHubConnector, now_utc
from ..connectors.vercel import VercelConnector
from ..models.profile import Profile, Resume
from .profile_builder import synthesize_profile
from .resume_parser import parse_resume
from .storyteller import tell_story


class AgentState(TypedDict, total=False):
    username: str
    resume_text: str | None
    vercel_token: str | None
    github_user: dict
    github_repos: list[dict]
    vercel_deployments: list[dict]
    resume: Resume | None
    profile: Profile


async def fetch_github_node(state: AgentState) -> AgentState:
    gh = GitHubConnector()
    user = await gh.fetch_user(state["username"])
    repos = await gh.fetch_repos(state["username"])
    return {"github_user": user, "github_repos": repos}


async def parse_resume_node(state: AgentState) -> AgentState:
    text = state.get("resume_text")
    if not text:
        return {"resume": None}
    return {"resume": parse_resume(text, fetched_at=now_utc())}


async def fetch_vercel_node(state: AgentState) -> AgentState:
    token = state.get("vercel_token")
    if not token:
        return {"vercel_deployments": []}
    try:
        deployments = await VercelConnector(token).fetch_deployments()
    except Exception:
        deployments = []
    return {"vercel_deployments": deployments}


async def synthesize_node(state: AgentState) -> AgentState:
    profile = synthesize_profile(
        username=state["username"],
        user=state["github_user"],
        repos=state["github_repos"],
        resume=state.get("resume"),
        vercel_deployments=state.get("vercel_deployments") or [],
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
    g.add_node("fetch_vercel", fetch_vercel_node)
    g.add_node("synthesize", synthesize_node)
    g.add_node("tell_story", tell_story_node)
    g.add_edge(START, "fetch_github")
    g.add_edge(START, "parse_resume")
    g.add_edge(START, "fetch_vercel")
    g.add_edge("fetch_github", "synthesize")
    g.add_edge("parse_resume", "synthesize")
    g.add_edge("fetch_vercel", "synthesize")
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
    vercel_token: str | None = None,
) -> Profile:
    result = await graph().ainvoke(
        {
            "username": username,
            "resume_text": resume_text,
            "vercel_token": vercel_token,
        }
    )
    profile = result.get("profile")
    if profile is None:
        raise ValueError("Failed to build profile")
    return profile
