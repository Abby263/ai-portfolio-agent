# ai-portfolio-agent

> **Live demo:** <https://ai-portfolio-agent.vercel.app> · **API:** <https://ai-portfolio-agent-api.vercel.app>
>
> Try it: <https://ai-portfolio-agent.vercel.app/torvalds>

`ai-portfolio-agent` is an AI-powered developer portfolio and project control platform.

The current product builds a rich developer profile from GitHub repos, deployed
app URLs stored on repos, and owner-uploaded resumes. It understands a developer's
work, creates a professional storyline, generates project summaries, and keeps
the portfolio updated as new projects are added.

Beyond showcasing work, it acts as an agentic command center. Developers can
ask the agent to perform actions such as updating README files across
repositories, generating case studies for published projects, creating pull
requests, and improving portfolio content.

The backend uses **LangGraph**-based AI agents to retrieve, reason, generate, and act across the developer's connected ecosystem.

---

## Features

- **Profile from GitHub** — repos, languages, topics, stars merged into a structured profile.
- **Project live apps from GitHub** — pinned repos are featured first, and deployed URLs come from each repo's Website field; no per-user Vercel token is needed in the UI.
- **Resume parser** — upload PDF, DOCX, Markdown, or plain text; experience, education, and skills are extracted and merged with provenance.
- **Saved portfolio snapshots** — the first generated portfolio is cached in KV; owners refresh it from `/sources` after source changes.
- **Storytelling agent** — generates a tagline, narrative, recurring themes, and per-project highlights from the merged profile.
- **Conversational command bar** — "Ask my portfolio" UI plus a `POST /api/command` endpoint with structured suggested actions.
- **README Update Agent** — drafts a structured README for any of your repos and opens a real pull request after explicit human review.
- **Deterministic fallbacks everywhere** — no API key required to run the demo end-to-end.

## Stack

| Layer       | Choice                                          |
|-------------|-------------------------------------------------|
| Frontend    | Next.js 15 (App Router) · React 19 · Tailwind v4 |
| Backend     | FastAPI · Python 3.11+                           |
| Agents      | LangGraph orchestrator + per-domain agents       |
| LLM         | OpenAI (`gpt-4o-mini`) — optional                |
| Hosting     | Vercel (web) + Vercel Python serverless (api)    |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the agent topology and slice plan.

## LangGraph topology

```
START ─┬─→ fetch_github ─┐
       └─→ parse_resume ─┴─→ synthesize ─→ tell_story ─→ END
```

Plus the read-side `route_command` and write-side `draft_readme` + `create_pr` agents triggered through API endpoints.

## Repo layout

```
ai-portfolio-agent/
├── api/        # FastAPI + LangGraph backend
├── web/        # Next.js frontend
├── docs/       # Architecture & design docs
├── SETUP.md    # End-to-end deployment guide
└── LICENSE     # PolyForm Noncommercial 1.0.0
```

## Quickstart

For local development and full deployment instructions — including how to obtain each secret — see **[SETUP.md](SETUP.md)**.

This repo deploys as two Vercel projects. Put browser-facing variables on
`ai-portfolio-agent` (`web/`) and API/server secrets on
`ai-portfolio-agent-api` (`api/`). Clerk GitHub sign-in needs keys on both
projects; adding Clerk only to the API project will not render the web sign-in
button.

```bash
# backend
cd api && python -m venv .venv && source .venv/bin/activate && pip install -e . && uvicorn app.main:app --reload --port 8000

# frontend (in another terminal)
cd web && npm install && npm run dev
# → open http://localhost:3000
```

## API

| Method | Path                              | Purpose                                                     |
|--------|-----------------------------------|-------------------------------------------------------------|
| GET    | `/health`                         | Liveness check.                                             |
| GET    | `/api/profile/{username}`         | Returns the cached profile, building one on first request.  |
| POST   | `/api/profile/{username}`         | Regenerates the profile, optionally merging resume text.    |
| POST   | `/api/command`                    | Runs the command-router agent against a profile.            |
| POST   | `/api/actions/draft-readme`       | Drafts a proposed README for a repo. Read-only.             |
| POST   | `/api/actions/create-pr`          | Branches, commits, opens a PR. Requires `GITHUB_TOKEN`.     |

Interactive OpenAPI docs: <https://ai-portfolio-agent-api.vercel.app/docs>

## Contributing

All changes land via PRs against `main`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — free for personal, educational, research, and other non-commercial use. **Commercial use requires a separate license.** Open an issue or contact the repository owner if you'd like to discuss a commercial arrangement.
