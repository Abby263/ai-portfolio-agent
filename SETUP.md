# Setup

End-to-end guide to running `ai-portfolio-agent` — locally and on Vercel. The project ships as a monorepo with two services:

- `web/` — Next.js (App Router) frontend
- `api/` — FastAPI + LangGraph backend

You can run them locally with no API keys (every agent has a deterministic fallback), or deploy to Vercel with the keys below for the full experience.

---

## Table of contents

1. [Local development](#1-local-development)
2. [Environment variables](#2-environment-variables)
3. [How to get each secret](#3-how-to-get-each-secret)
4. [Deploying to Vercel](#4-deploying-to-vercel)
5. [Enabling write-side actions safely](#5-enabling-write-side-actions-safely)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Local development

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- A GitHub account (for the demo). No tokens required for read-only browsing.

### Backend

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env   # edit values you have
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Smoke test:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/profile/torvalds
```

### Frontend

```bash
cd web
npm install
cp .env.local.example .env.local   # default API URL points at localhost:8000
npm run dev
```

The app runs at `http://localhost:3000`. Try `http://localhost:3000/torvalds`.

---

## 2. Environment variables

### `api/` (FastAPI on Vercel Python)

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `OPENAI_API_KEY` | Optional | Enables LLM-backed Storyteller, Resume Parser, Command Router, and README Writer. Each agent falls back to a deterministic implementation when this is unset. |
| `GITHUB_TOKEN` | Required for write actions | Personal Access Token with `repo` scope. Used for higher GitHub rate limits on read endpoints **and** for opening pull requests via `/api/actions/create-pr`. |
| `GITHUB_WRITE_OWNER` | Required when `GITHUB_TOKEN` is set | Locks PR creation to repos owned by this single GitHub user. Without it, the shared `GITHUB_TOKEN` could be abused via the public endpoint. **Do not skip this.** |
| `CORS_ORIGINS` | Recommended | JSON list of allowed browser origins, e.g. `["http://localhost:3000","https://ai-portfolio-agent.vercel.app"]`. |
| `KV_REST_API_URL` | Optional (auto-set by Vercel KV) | Upstash REST endpoint. Auto-populated when you enable Storage → KV on the api project. |
| `KV_REST_API_TOKEN` | Optional (auto-set by Vercel KV) | Upstash REST auth token. Auto-populated alongside `KV_REST_API_URL`. |
| `CLERK_SECRET_KEY` | Optional | Clerk backend key. Required to validate ownership on `POST /api/profile/{username}` so only the GitHub-matching owner can save customizations. |
| `CLERK_JWKS_URL` | Optional | Clerk's JWKS endpoint, e.g. `https://YOUR-INSTANCE.clerk.accounts.dev/.well-known/jwks.json`. Find it on the Clerk dashboard under **API Keys → Show JWKS URL**. |

### `web/` (Next.js)

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | URL of the FastAPI backend, e.g. `https://ai-portfolio-agent-api.vercel.app`. Inlined at build time. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional | Clerk publishable key. When set with `CLERK_SECRET_KEY`, sign-in becomes available; signed-in users whose GitHub login matches the URL username can edit that profile. Without these, the site stays public-read-only. |
| `CLERK_SECRET_KEY` | Optional | Server-side Clerk secret. Pairs with the publishable key above. |

### Per-user secrets (handed in via the UI)

Some sources are too sensitive — or too account-specific — to live as a server-wide secret. The UI accepts these inline:

| Source | Where the user enters it | What it unlocks |
|--------|--------------------------|-----------------|
| Vercel access token | "Connect Vercel" row on the profile page | The Vercel Agent fetches the user's deployments and matches them to repos so live URLs render on each project. The token is sent with one request and not persisted by the API. |

---

## 3. How to get each secret

### `OPENAI_API_KEY`

1. Sign in at <https://platform.openai.com>.
2. Navigate to **API keys** → **Create new secret key**.
3. Give it a name like `ai-portfolio-agent` and copy the value (starts with `sk-…`). The key is shown only once.
4. Pricing: agents in this repo use `gpt-4o-mini`. A typical full profile build costs cents. Set a usage limit under **Settings → Limits** to cap spend.

The app works without this key; LLM features fall back to deterministic behavior.

### `GITHUB_TOKEN`

The token is needed for two things: lifting GitHub's rate limits on read calls (60/hour anonymous → 5,000/hour authenticated), and opening real PRs from the README Update Agent.

**Recommended: Fine-grained PAT**

1. Go to <https://github.com/settings/personal-access-tokens/new>.
2. **Token name:** `ai-portfolio-agent`.
3. **Expiration:** 90 days (rotate on schedule).
4. **Resource owner:** your GitHub username.
5. **Repository access:** *Only select repositories* → pick the repos you want the agent to be able to update.
6. **Permissions → Repository permissions:**
   - **Contents:** Read and write (needed to create branches/commits)
   - **Pull requests:** Read and write
   - **Metadata:** Read-only (auto-included)
7. Click **Generate token** and copy the value (starts with `github_pat_…`).

**Alternative: Classic PAT** (broader access; only use if fine-grained doesn't fit)

1. Go to <https://github.com/settings/tokens/new>.
2. Note: `ai-portfolio-agent`.
3. Scopes: `repo` (full control of private and public repos).
4. Generate, copy.

### `GITHUB_WRITE_OWNER`

This is just your GitHub username (e.g. `Abby263`). Set it as a string. It's the safety guardrail — the API server refuses PR creation against any other owner's repos, even if the token would technically allow it.

### Clerk (auth)

Clerk handles sign-in via GitHub OAuth and tells the server "this signed-in user is @abby263 on GitHub". The web app then unlocks the **Sources** card and write-side actions only on the matching `/abby263` profile.

1. Sign up at <https://clerk.com> (free).
2. Create a new application. Suggested name: `ai-portfolio-agent`.
3. **Authentication → Social Connections → GitHub** → enable. Use Clerk's shared OAuth credentials for development; for production, click *Use custom credentials* and register your own GitHub OAuth app at <https://github.com/settings/developers> with the callback URL Clerk shows you.
4. **API Keys** → copy:
   - `Publishable key` → set as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on the **web** Vercel project (production scope).
   - `Secret key` → set as `CLERK_SECRET_KEY` on the **web** Vercel project (production scope).
5. **Domains** → add `https://ai-portfolio-agent.vercel.app` so Clerk allows callbacks there.
6. Redeploy the web project. The "Sign in" button appears in the header; signing in with GitHub now unlocks edit mode on the matching profile URL.

Without Clerk keys set, the site keeps working as a public read-only demo (the Sources card stays hidden for everyone).

### Vercel KV (persistence)

Owner customizations (resume text, Vercel token) persist across requests so the public portfolio stays enriched after the owner edits it.

1. On the Vercel dashboard, open the **ai-portfolio-agent-api** project.
2. **Storage → Create Database → KV** (the Upstash-backed one). Pick the region closest to your function deployments (`iad1` works for the default).
3. Vercel auto-creates four env vars on the project: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`. The API only needs `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. Redeploy. Customizations now save under `customizations:<github-username>` and are merged into the profile build for every visitor.

The persistence layer no-ops cleanly when these env vars aren't set — POSTs still work session-only and GETs build from sources without saved overrides.

### Vercel access token (per-user, UI-only)

Used by the Vercel Agent to list the visiting user's deployments and match them to their GitHub repos. There is **no** server-side `VERCEL_TOKEN` env var — each user enters their own token in the **Connect Vercel** row on the profile page.

1. Sign in at <https://vercel.com>.
2. Go to **Account Settings → Tokens** (<https://vercel.com/account/tokens>).
3. **Create Token** with the default *Full Account* scope and a short expiration (24h is enough for a one-time demo). If you trust the deployment long-term, choose 30 days and rotate.
4. Copy the value (starts with `vercel_…`) and paste it into the Connect Vercel row on the profile page.

The token is sent once with the build-profile request and is **not persisted** by the server.

---

## 4. Deploying to Vercel

The repo deploys as **two Vercel projects**, both pointing at the same GitHub repo.

### One-time setup

You can do everything from the Vercel dashboard, or use the CLI:

```bash
npm i -g vercel
vercel login
```

### Project 1 — `ai-portfolio-agent-api`

1. **Import** the GitHub repo at <https://vercel.com/new>.
2. **Framework preset:** *Other* (the project is configured via `api/vercel.json`).
3. **Root Directory:** **`api`** &nbsp;← critical. Without this, paths in `api/vercel.json` won't resolve and every route will 404.
4. **Project Name:** `ai-portfolio-agent-api`.
5. **Environment Variables** (production scope):
   - `OPENAI_API_KEY` — optional
   - `GITHUB_TOKEN` — required for write actions
   - `GITHUB_WRITE_OWNER` — required when `GITHUB_TOKEN` is set
   - `CORS_ORIGINS` — `["http://localhost:3000","https://ai-portfolio-agent.vercel.app"]`
6. **Deployment Protection:** disabled (Settings → Deployment Protection → off, or set `ssoProtection: null` on the project). Otherwise public requests get a 401.
7. **Deploy.** The production URL will be `https://ai-portfolio-agent-api.vercel.app`.

Smoke test:

```bash
curl https://ai-portfolio-agent-api.vercel.app/health
# → {"status":"ok"}
```

### Project 2 — `ai-portfolio-agent`

1. **Import** the same GitHub repo.
2. **Framework preset:** *Next.js* (auto-detected).
3. **Root Directory:** **`web`** &nbsp;← critical.
4. **Project Name:** `ai-portfolio-agent`.
5. **Environment Variables** (production scope):
   - `NEXT_PUBLIC_API_URL` = `https://ai-portfolio-agent-api.vercel.app`
6. **Deployment Protection:** disabled.
7. **Deploy.** The production URL will be `https://ai-portfolio-agent.vercel.app`.

### Auto-deploy on push

Both projects are connected to the GitHub repo, so:

- Push to `main` → production deploy on both projects.
- Open a PR → preview deploys with branch-named URLs (great for testing slices before merge).

---

## 5. Enabling write-side actions safely

`POST /api/actions/create-pr` is the only endpoint that mutates state outside this stack. It uses the server's `GITHUB_TOKEN` to branch + commit + open PRs. That means the token's scope is shared across every caller of the public API — so:

- **Always set `GITHUB_WRITE_OWNER`.** The endpoint returns 403 for any other owner.
- **Use a fine-grained PAT scoped to the specific repos** the agent should touch.
- **Set a short expiration** on the token (90 days) and rotate on schedule.
- **Monitor the token's audit log** under <https://github.com/settings/security-log>.

If you don't set `GITHUB_TOKEN`, every other feature still works; only the "Open PR" button in the README Update flow returns a clear 400 with the missing-token message.

---

## 6. Troubleshooting

### Every API route returns 404

The `api` Vercel project is missing **Root Directory = `api`**. Without it, the relative paths in `api/vercel.json` resolve at the repo root and Vercel's router can't find the function. Fix it under Settings → General → Root Directory.

### `/torvalds` returns 404 in production

The web app's server-side fetch couldn't reach the API:
- Check `NEXT_PUBLIC_API_URL` on the `web` project points at the live API URL (not `localhost:8000`).
- Confirm the API project has Deployment Protection **off**, otherwise the `web` build sees 401s.

### Resume parsing returns no skills

The deterministic parser splits on common section headers (Summary / Skills / Experience / Education). If your resume uses other headers, paste a version that does, or set `OPENAI_API_KEY` to fall back to the LLM parser.

### "Server has no GITHUB_TOKEN configured" on Open PR

Set `GITHUB_TOKEN` (and `GITHUB_WRITE_OWNER`) on the `api` Vercel project, then redeploy. See section 5.

### Cold starts feel slow on the first request

`@vercel/python` cold starts are 1–3 seconds for this dep set. Subsequent requests in the same warm container are fast. For consistently low latency, host the API on a long-running runtime (Render / Fly / Railway) instead.
