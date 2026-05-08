from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..agents.readme_writer import DraftReadme, draft_readme
from ..config import settings
from ..connectors.github import GitHubConnector

router = APIRouter()


class DraftReadmeRequest(BaseModel):
    owner: str
    repo: str


class DraftReadmeResponse(BaseModel):
    owner: str
    repo: str
    default_branch: str
    file_path: str
    current: str | None
    current_sha: str | None
    proposed: str
    summary: str


class CreatePullRequestRequest(BaseModel):
    owner: str
    repo: str
    branch: str = Field(..., min_length=1, max_length=120)
    file_path: str = Field(default="README.md")
    content: str
    sha: str | None = None
    commit_message: str
    pr_title: str
    pr_body: str
    base: str | None = None


class CreatePullRequestResponse(BaseModel):
    pr_url: str
    pr_number: int
    branch: str


@router.post("/actions/draft-readme", response_model=DraftReadmeResponse)
async def draft_readme_action(body: DraftReadmeRequest) -> DraftReadmeResponse:
    gh = GitHubConnector()
    try:
        repo = await gh.fetch_repo(body.owner, body.repo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    default_branch = repo["default_branch"]
    file_path = "README.md"
    current = await gh.fetch_file(
        body.owner, body.repo, file_path, ref=default_branch
    )
    draft: DraftReadme = draft_readme(
        repo, current["content"] if current else None
    )
    return DraftReadmeResponse(
        owner=body.owner,
        repo=body.repo,
        default_branch=default_branch,
        file_path=file_path,
        current=current["content"] if current else None,
        current_sha=current["sha"] if current else None,
        proposed=draft.proposed,
        summary=draft.summary,
    )


@router.post("/actions/create-pr", response_model=CreatePullRequestResponse)
async def create_pr_action(
    body: CreatePullRequestRequest,
) -> CreatePullRequestResponse:
    gh = GitHubConnector()
    if not gh.has_write_token:
        raise HTTPException(
            status_code=400,
            detail=(
                "Server has no GITHUB_TOKEN configured. "
                "Set one with `repo` scope to enable PR creation."
            ),
        )
    if (
        settings.github_write_owner
        and body.owner.lower() != settings.github_write_owner.lower()
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                f"PR creation restricted to repos owned by "
                f"'{settings.github_write_owner}' on this server."
            ),
        )
    try:
        repo = await gh.fetch_repo(body.owner, body.repo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    base = body.base or repo["default_branch"]
    try:
        base_sha = await gh.fetch_branch_sha(body.owner, body.repo, base)
        await gh.create_branch(body.owner, body.repo, body.branch, base_sha)
        await gh.put_file(
            body.owner,
            body.repo,
            body.file_path,
            content=body.content,
            message=body.commit_message,
            branch=body.branch,
            sha=body.sha,
        )
        pr = await gh.open_pull_request(
            body.owner,
            body.repo,
            title=body.pr_title,
            body=body.pr_body,
            head=body.branch,
            base=base,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}")

    return CreatePullRequestResponse(
        pr_url=pr["html_url"], pr_number=pr["number"], branch=body.branch
    )
