# ai-portfolio-agent

> **Live demo** · Web: <https://web-xi-roan-10.vercel.app> · API: <https://api-seven-omega-54.vercel.app>
>
> Try it: <https://web-xi-roan-10.vercel.app/torvalds>

`ai-portfolio-agent` is an AI-powered developer portfolio and project control platform.

It connects with apps like GitHub, Vercel, LinkedIn, Instagram, uploaded resumes, blogs, and project documents to automatically build a rich developer profile. The platform understands a developer's work, creates a professional storyline, generates project summaries, and keeps the portfolio updated as new projects are added.

Beyond showcasing work, it also acts as an agentic command center. Developers can ask the agent to perform actions such as updating README files across repositories, generating case studies for deployed projects, creating pull requests, improving portfolio content, and validating deployment updates.

The backend uses LangGraph-based AI agents to retrieve, reason, generate, and act across the developer's connected ecosystem.

---

## Stack

- **Frontend** — Next.js (App Router, TypeScript, Tailwind) in [web/](web/)
- **Backend** — FastAPI (Python 3.11+) in [api/](api/)
- **Agents** — LangGraph orchestrator with per-domain agents (Profile Builder, GitHub, Vercel, …)
- **Connectors** — GitHub, Vercel, LinkedIn, Instagram, resume parser (added incrementally)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the agent topology and slice plan.

## Repo layout

```
ai-portfolio-agent/
├── web/        # Next.js frontend
├── api/        # FastAPI + LangGraph backend
└── docs/       # Architecture & design docs
```

## Quickstart

### Backend

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env   # then fill in any API keys you have
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Try:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/profile/torvalds
```

### Frontend

```bash
cd web
npm install
npm run dev
```

The app runs at `http://localhost:3000` and proxies API calls to `http://localhost:8000`.

## Current slice

The first vertical slice wires:

```
GitHub username → GitHub connector → Profile Builder Agent (LangGraph) → /api/profile/{username} → web UI
```

Subsequent slices layer on Vercel, resume parsing, the agent command bar, and write-side actions (README updates, PRs, case study generation).
