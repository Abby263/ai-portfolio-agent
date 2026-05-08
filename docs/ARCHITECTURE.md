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
| **Vercel Agent**               | Lists deployments (via per-user token), matches them to repos, surfaces live URLs.  |
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
2. **Slice 2 — Resume.** Upload PDF/DOCX/Markdown/plain text → Resume Parser → merged into profile.
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

## Deployment

The repo deploys as **two Vercel projects** sharing one GitHub repo:

| Project | Vercel root directory | Notes |
|---------|-----------------------|-------|
| `web`   | `web`                 | Next.js, autodetected. Needs `NEXT_PUBLIC_API_URL` env. |
| `api`   | `api`                 | FastAPI on `@vercel/python`, configured via `api/vercel.json`. |

Both projects are connected to GitHub for auto-deploy on `main` and previews on PRs. `rootDirectory` must be set on each project; otherwise Vercel walks the repo root and the paths in `api/vercel.json` do not resolve.

Optional API env vars:
- `OPENAI_API_KEY` — enables LLM modes for Storytelling, Resume Parser, Command Router, README Writer. Each agent has a deterministic fallback when unset.
- `GITHUB_TOKEN` — required for write-side actions (`POST /api/actions/create-pr`). Read-only endpoints work without it.
- `GITHUB_WRITE_OWNER` — locks PR creation to a single GitHub username. Required when a shared token is in use.
- `CORS_ORIGINS` — JSON list of allowed browser origins.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — persist owner customizations.
- `CLERK_SECRET_KEY` / `CLERK_JWKS_URL` — verify owner writes from Clerk sessions.

The web project separately needs `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`. Clerk keys placed
only on the API project cannot render GitHub sign-in in the browser.

## Why direct REST instead of MCP

MCP (Model Context Protocol) servers exist for GitHub, Vercel, and similar — they expose tools that AI assistants like Claude Desktop or Cursor call locally on the user's machine. We chose **direct REST** in this product for three reasons:

1. **Server-side, not client-assistant.** MCP shines when an AI client wants to call tools on the *user's* behalf with the user's credentials. Our backend is a multi-tenant service that holds and rotates its own credentials for read paths and uses per-user tokens for write paths. The MCP host/client model doesn't map cleanly.
2. **Latency and surface area.** Each MCP hop adds a process boundary. Our agents already need narrow, predictable behavior (rate limits, retries, structured errors). Wrapping the GitHub REST API ourselves keeps that surface tight.
3. **No extra runtime to deploy.** Serverless on Vercel doesn't host long-running MCP servers naturally — we'd need a separate process or sidecar.

MCP is still interesting in the *other direction*: exposing this product **as** an MCP server so Claude Desktop / Cursor users can ask their assistant "show me my portfolio agent's view of repo X" or "have it open a PR." That's tracked under deferred decisions.

## Deferred decisions

- Multi-tenancy & background workers (Celery / Arq) once syncs get heavy.
- Diagram generation strategy (Mermaid vs. Excalidraw vs. AI-rendered).
- Per-user OAuth tokens for write-side actions (replaces the shared `GITHUB_TOKEN` model).
- Exposing this product **as** an MCP server so AI assistants can interact with the portfolio.
