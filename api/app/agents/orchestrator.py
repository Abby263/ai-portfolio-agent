from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from ..connectors.github import GitHubConnector, now_utc
from ..models.profile import Profile
from .profile_builder import synthesize_profile


class AgentState(TypedDict, total=False):
    username: str
    github_user: dict
    github_repos: list[dict]
    profile: Profile


async def fetch_github_node(state: AgentState) -> AgentState:
    gh = GitHubConnector()
    user = await gh.fetch_user(state["username"])
    repos = await gh.fetch_repos(state["username"])
    return {"github_user": user, "github_repos": repos}


async def synthesize_node(state: AgentState) -> AgentState:
    profile = synthesize_profile(
        username=state["username"],
        user=state["github_user"],
        repos=state["github_repos"],
        fetched_at=now_utc(),
    )
    return {"profile": profile}


def _build_graph():
    g = StateGraph(AgentState)
    g.add_node("fetch_github", fetch_github_node)
    g.add_node("synthesize", synthesize_node)
    g.add_edge(START, "fetch_github")
    g.add_edge("fetch_github", "synthesize")
    g.add_edge("synthesize", END)
    return g.compile()


_graph = None


def graph():
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


async def build_profile(username: str) -> Profile:
    result = await graph().ainvoke({"username": username})
    profile = result.get("profile")
    if profile is None:
        raise ValueError("Failed to build profile")
    return profile
