# Setup

`ai-portfolio-agent` is a monorepo with two deployable Vercel projects. Most
setup mistakes come from putting a variable on the wrong project.

| Vercel project | Root directory | Runtime | What belongs here |
|---|---:|---|---|
| `ai-portfolio-agent` | `web` | Next.js | Browser-facing config, API URL, Clerk web keys |
| `ai-portfolio-agent-api` | `api` | FastAPI | OpenAI, GitHub write token, CORS, KV, Clerk API verification |

If you added Clerk keys only to `ai-portfolio-agent-api`, the web UI cannot show
the GitHub sign-in button. The `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be on
the `ai-portfolio-agent` web project.

---

## 1. Local Development

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- A GitHub account

The app runs without any secrets. Missing LLM/auth/storage features fall back to
read-only or deterministic behavior.

### API

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Smoke test:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/profile/torvalds
```

### Web

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`, or try `http://localhost:3000/torvalds`.

When Clerk is not configured locally, you can open owner tools with
`http://localhost:3000/<github-username>?edit=1`. This fallback is for local
development and does not persist customizations unless the API is configured for
owner-authenticated KV writes.

---

## 2. Environment Variables By Project

### `ai-portfolio-agent` (`web/`)

Set these on the **web** Vercel project:

| Variable | Required? | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | Yes | Public URL of the API project, for example `https://ai-portfolio-agent-api.vercel.app`. This is bundled into the browser build. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required for sign-in | Clerk publishable key. This is what makes the GitHub sign-in button render in the web UI. |
| `CLERK_SECRET_KEY` | Required for edit mode | Clerk server key used by Next.js server components to identify the signed-in GitHub user. |

Do not put `OPENAI_API_KEY`, `GITHUB_TOKEN`, KV tokens, or a Vercel access token
on the web project.

### `ai-portfolio-agent-api` (`api/`)

Set these on the **API** Vercel project:

| Variable | Required? | Purpose |
|---|---:|---|
| `OPENAI_API_KEY` | Optional | Enables LLM-backed Storyteller, Resume Parser, Command Router, and README Writer. Without it, deterministic fallbacks run. |
| `GITHUB_TOKEN` | Required for PR creation | GitHub PAT used for higher rate limits and `/api/actions/create-pr`. |
| `GITHUB_WRITE_OWNER` | Required when `GITHUB_TOKEN` is set | Safety guardrail. PR creation is restricted to repos owned by this GitHub username. |
| `CORS_ORIGINS` | Recommended | JSON list of allowed web origins, for example `["http://localhost:3000","https://ai-portfolio-agent.vercel.app"]`. |
| `KV_REST_API_URL` | Optional | Vercel KV / Upstash REST URL. Auto-created when KV is attached to the API project. |
| `KV_REST_API_TOKEN` | Optional | Vercel KV / Upstash REST token. Auto-created with `KV_REST_API_URL`. |
| `CLERK_SECRET_KEY` | Required for saved owner writes | Clerk server key used by the API to fetch the signed-in user's GitHub account. |
| `CLERK_JWKS_URL` | Required for saved owner writes | Clerk JWKS URL used by the API to verify session JWTs from the web app. |

Do not set `NEXT_PUBLIC_API_URL` on the API project. Do not set a server-wide
`VERCEL_TOKEN`; each owner enters their own Vercel access token in the profile
UI.

### Per-user UI secrets

| Secret | Where it is entered | What it unlocks |
|---|---|---|
| Resume file | Profile page -> Owner tools -> Resume | Upload PDF, DOCX, Markdown, or text. The parser extracts skills, experience, education, and summary. |
| Vercel access token | Profile page -> Owner tools -> Vercel | Lists that user's deployments and matches live URLs to GitHub repos. |

The API saves owner customizations only when all of these are true:

- Vercel KV is configured on `ai-portfolio-agent-api`.
- Clerk is configured on both projects.
- The signed-in Clerk user has a GitHub account matching the profile URL.

---

## 3. Get The Secrets

### OpenAI

1. Open <https://platform.openai.com>.
2. Create an API key.
3. Set `OPENAI_API_KEY` on `ai-portfolio-agent-api`.

This is optional. The app still works without it.

### GitHub PAT

Use a fine-grained token when possible:

1. Open <https://github.com/settings/personal-access-tokens/new>.
2. Select only the repos the agent may update.
3. Grant repository permissions:
   - Contents: read and write
   - Pull requests: read and write
   - Metadata: read-only
4. Set `GITHUB_TOKEN` on `ai-portfolio-agent-api`.
5. Set `GITHUB_WRITE_OWNER` to your GitHub username.

The write owner guard is not optional when a shared server token exists.

### Clerk Auth

Clerk is what makes owner mode safe. It signs the user in with GitHub, then the
app checks that the Clerk GitHub username matches `/github-username`.

1. Create a Clerk application at <https://clerk.com>.
2. In Clerk, enable **Authentication -> Social Connections -> GitHub**.
3. For production, add your deployed web domain in Clerk Domains / allowed URLs.
4. Copy the publishable key and secret key.
5. On `ai-portfolio-agent` (`web/`), set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
6. On `ai-portfolio-agent-api` (`api/`), set:
   - `CLERK_SECRET_KEY`
   - `CLERK_JWKS_URL`

`CLERK_JWKS_URL` is visible in the Clerk dashboard under API keys / JWKS. It
looks like:

```text
https://<your-clerk-host>/.well-known/jwks.json
```

After changing Clerk variables, redeploy both Vercel projects.

### Vercel KV

KV persists resume text and per-user Vercel tokens after the owner saves them.

1. Open the `ai-portfolio-agent-api` project in Vercel.
2. Create or attach a Vercel KV database.
3. Confirm Vercel added `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the API
   project.
4. Redeploy `ai-portfolio-agent-api`.

The app still works without KV, but owner source updates apply only to the
current rebuild response.

### Vercel Access Token

This is not a Vercel project environment variable.

Each profile owner creates their own token at <https://vercel.com/account/tokens>
and enters it in the profile page's Vercel source row. The token is sent to the
API for that request and is saved only when owner auth plus KV are configured.

---

## 4. Deploy To Vercel

Import the same GitHub repo twice.

### Project 1: `ai-portfolio-agent-api`

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `api`.
3. Use framework preset **Other**.
4. Add API environment variables from section 2.
5. Disable Deployment Protection if the public web app should call the API.
6. Deploy.

Expected health check:

```bash
curl https://ai-portfolio-agent-api.vercel.app/health
```

### Project 2: `ai-portfolio-agent`

1. Import the same GitHub repo again.
2. Set **Root Directory** to `web`.
3. Use framework preset **Next.js**.
4. Add web environment variables from section 2.
5. Disable Deployment Protection if the public site should be viewable.
6. Deploy.

Expected smoke test:

```text
https://ai-portfolio-agent.vercel.app/torvalds
```

---

## 5. Resume Upload

The owner source panel supports:

- `.pdf`
- `.docx`
- `.md` / `.markdown`
- `.txt`

PDF extraction uses the `pypdf` dependency in the API. Scanned image-only PDFs
will not produce useful text. For those, upload a text-based PDF, DOCX, or paste
plain text.

---

## 6. Troubleshooting

### I added Clerk to `ai-portfolio-agent-api`, but sign-in is missing

Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to the
`ai-portfolio-agent` web project, then redeploy the web project. The API project
cannot render the browser sign-in button.

### Sign-in appears, but owner tools do not unlock

Check that:

- `CLERK_SECRET_KEY` exists on the `ai-portfolio-agent` web project.
- GitHub social login is enabled in Clerk.
- The signed-in Clerk user's GitHub username matches the URL username exactly,
  case-insensitive.

### Resume or Vercel updates do not persist

Check that `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `CLERK_SECRET_KEY`, and
`CLERK_JWKS_URL` exist on `ai-portfolio-agent-api`, then redeploy the API.

### API routes return 404 on Vercel

The API project root directory is wrong. Set `ai-portfolio-agent-api` root
directory to `api`.

### `/torvalds` fails in production

Check that `NEXT_PUBLIC_API_URL` on the `ai-portfolio-agent` web project points
to the live API URL and that Deployment Protection is disabled on the API.

### Opening a PR fails with missing token

Set `GITHUB_TOKEN` and `GITHUB_WRITE_OWNER` on `ai-portfolio-agent-api`, then
redeploy the API.
