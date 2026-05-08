from datetime import datetime

from pydantic import BaseModel, Field


class Source(BaseModel):
    """Provenance for a piece of profile data — which connector produced it, and when."""

    connector: str
    source_id: str
    fetched_at: datetime


class Project(BaseModel):
    name: str
    description: str | None = None
    repo_url: str | None = None
    homepage: str | None = None
    pinned: bool = False
    language: str | None = None
    stars: int = 0
    topics: list[str] = []
    highlights: list[str] = []
    deployment_url: str | None = None
    deployment_target: str | None = None
    deployment_count: int = 0
    sources: list[Source] = Field(default_factory=list)


class Experience(BaseModel):
    company: str
    role: str
    start: str | None = None
    end: str | None = None
    location: str | None = None
    summary: str | None = None
    highlights: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str | None = None
    field: str | None = None
    start: str | None = None
    end: str | None = None


class Resume(BaseModel):
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    experiences: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    links: dict[str, str] = Field(default_factory=dict)
    raw_text: str
    sources: list[Source] = Field(default_factory=list)


class Profile(BaseModel):
    username: str
    display_name: str | None = None
    headline: str | None = None
    tagline: str | None = None
    bio: str | None = None
    story: str | None = None
    themes: list[str] = Field(default_factory=list)
    avatar_url: str | None = None
    location: str | None = None
    skills: list[str] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    experiences: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    resume_summary: str | None = None
    resume_file_available: bool = False
    links: dict[str, str] = Field(default_factory=dict)
    sources: list[Source] = Field(default_factory=list)
    generated_at: datetime
