# Architecture

## Goals

`ai-portfolio-agent` builds a living developer profile from connected sources and lets the developer act on their ecosystem (repos, deployments, content) through natural language commands. It is both a portfolio (read side) and a command center (write side).

## High-level shape

```
                              ┌─────────────────────────────────┐
                              │           Next.js (web/)        │
                              │  Public profile + control panel │
                              └──────────────┬──────────────────┘
                                             │  HTTPS (JSON)
                              ┌──────────────▼──────────────────┐
                              │         FastAPI (api/)          │
                              │  Routes · Auth · Agent runner   │
                              └──────┬──────────────────┬───────┘
                                     │                  │
                       ┌─────────────▼──────┐   ┌───────▼──────────┐
                       │   LangGraph        │   │   RAG store      │
                       │   Orchestrator     │◀─▶│  (vectors + KV)  │
                       └─────────────┬──────┘   └──────────────────┘
                                     │
   ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
   ▼              ▼                  ▼                  ▼              ▼
GitHub         Vercel            Resume             LinkedIn        Instagram
connector      connector         parser             connector       connector
```

## Agent topology (LangGraph)

The orchestrator decides which agent(s) to invoke for a given request. Each agent has a narrow responsibility and uses connectors + the RAG store as tools.

| Agent                          | Responsibility                                                     |
|--------------------------------|--------------------------------------------------------------------|
| **Orchestrator**               | Routes requests, plans multi-step actions, aggregates results.     |
| **Profile Builder**            | Assembles the developer profile from indexed sources.              |
| **GitHub Agent**               | Reads repos, READMEs, commits; later writes branches/PRs.          |
| **Vercel Agent**               | Lists deployments, matches them to repos, reads project metadata.  |
| **Resume Parser**              | Extracts skills/experience/achievements from uploaded resumes.     |
| **Storytelling Agent**         | Generates the developer's narrative, project summaries, taglines.  |
| **README Update Agent**        | Drafts README improvements with diagrams placeholders.             |
| **PR Creation Agent**          | Opens branches and PRs against connected repos.                    |
| **Deployment Validation Agent**| Confirms Vercel deployments are healthy after changes.             |
| **Review/Approval Agent**      | Summarizes proposed changes for the developer to approve.          |

Read-only agents are safe to run autonomously. Write-side agents (README Update, PR Creation) always go through Review/Approval before hitting the user's GitHub.

## Vertical slice plan

Build one slice end-to-end, then fan out.

1. **Slice 1 — GitHub → Profile (current).** Public GitHub username → repos + READMEs → Profile Builder → JSON profile served at `/api/profile/{username}` → Next.js renders.
2. **Slice 2 — Resume.** Upload PDF/Markdown → Resume Parser → merged into profile.
3. **Slice 3 — Vercel.** OAuth → Vercel Agent → match deployments to repos → enrich projects.
4. **Slice 4 — Storytelling.** Run Storytelling Agent over the merged profile → narrative + project summaries.
5. **Slice 5 — Command bar.** Free-form commands routed through the Orchestrator.
6. **Slice 6 — Write actions.** README Update + PR Creation, gated by Review/Approval.
7. **Slice 7 — LinkedIn / Instagram / blogs.** Add remaining connectors.

## Data model (initial)

- `Profile` — identity, headline, story, skills, projects, links.
- `Project` — repo, deployment, summary, tech stack, highlights, screenshots.
- `Source` — provenance for any field (which connector produced it, when).

Provenance matters because the agent will rewrite content; we need to know what came from where to avoid hallucinating over user-supplied facts.

## RAG store

For now: a single vector store (Chroma in dev, pgvector in prod) keyed by `(user_id, source_type, source_id)`. Each connector pushes documents on sync; agents retrieve with metadata filters.

## Deferred decisions

- Auth (likely Clerk or Auth.js once we add user accounts).
- Multi-tenancy & background workers (Celery / Arq) once syncs get heavy.
- Diagram generation strategy (Mermaid vs. Excalidraw vs. AI-rendered).
- Hosting (Vercel for `web/`, Fly/Render for `api/` is the likely default).
