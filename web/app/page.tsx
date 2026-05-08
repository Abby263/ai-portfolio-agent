import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthBadge } from "@/components/AuthBadge";
import { BuildButton } from "@/components/BuildButton";

async function goToProfile(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim();
  if (!username) return;
  redirect(`/${encodeURIComponent(username)}`);
}

const PIPELINE = [
  {
    label: "GitHub",
    detail: "Fetch repos, languages, topics, stars, and profile metadata.",
  },
  {
    label: "Resume",
    detail: "Upload PDF, DOCX, Markdown, or paste text for skills and roles.",
  },
  {
    label: "Vercel",
    detail: "Match deployments to repositories and surface live project URLs.",
  },
  {
    label: "Portfolio",
    detail: "Render a public page at /github-username with provenance.",
  },
  {
    label: "Actions",
    detail: "Draft READMEs and open PRs only after owner review.",
  },
];

const CAPABILITIES = [
  {
    title: "Read-side portfolio",
    body: "Anyone can view a generated portfolio built from public GitHub data and saved owner sources.",
  },
  {
    title: "Owner source console",
    body: "The signed-in GitHub owner can upload a resume, connect Vercel, and rebuild the profile in place.",
  },
  {
    title: "Agentic write path",
    body: "The command bar can draft repo updates and open GitHub PRs through a guarded API action.",
  },
];

const SOURCE_ROWS = [
  ["GitHub", "Live", "Public repos, languages, stars, topics, profile links"],
  ["Resume upload", "Live", "PDF, DOCX, Markdown, and plain-text extraction"],
  ["Vercel token", "Live", "Per-user token entered in the profile UI"],
  ["Clerk GitHub auth", "Live", "Identifies the GitHub owner before saving sources"],
  ["LinkedIn / Instagram", "Planned", "Future social and content connectors"],
];

const PROJECTS = [
  {
    name: "ai-portfolio-agent",
    root: "web/",
    runtime: "Next.js",
    env: "NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY",
  },
  {
    name: "ai-portfolio-agent-api",
    root: "api/",
    runtime: "FastAPI",
    env: "OPENAI_API_KEY, GITHUB_TOKEN, GITHUB_WRITE_OWNER, CORS_ORIGINS, KV_*, CLERK_*",
  },
];

const DEMOS = ["torvalds", "gaearon", "tj", "sindresorhus"];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)]/70 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--accent-soft)]" />
            ai-portfolio-agent
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 sm:gap-4">
            <a href="#purpose" className="transition hover:text-neutral-100">
              Purpose
            </a>
            <a href="#sources" className="transition hover:text-neutral-100">
              Sources
            </a>
            <a href="#deploy" className="transition hover:text-neutral-100">
              Deploy
            </a>
            <a
              href="https://github.com/Abby263/ai-portfolio-agent"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[var(--border)] px-2.5 py-1 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
            >
              GitHub
            </a>
            <AuthBadge />
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--border)]/70">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12">
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--accent-soft)]">
                Portfolio builder plus repo action agent
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-6xl">
                AI Portfolio Agent
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
                This repo builds a public developer portfolio from GitHub,
                resume uploads, and Vercel deployments. The same profile also
                becomes a command center for README drafts and guarded GitHub
                pull requests.
              </p>

              <form
                action={goToProfile}
                className="mt-8 flex w-full max-w-xl flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2 shadow-xl shadow-black/20 sm:flex-row sm:items-center"
              >
                <label className="sr-only" htmlFor="username">
                  GitHub username
                </label>
                <span className="hidden pl-2 text-sm text-neutral-500 sm:inline">
                  github.com/
                </span>
                <input
                  id="username"
                  name="username"
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="github-username"
                  className="min-w-0 flex-1 rounded-md bg-[var(--background)] px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-[var(--accent-soft)] sm:bg-transparent"
                />
                <BuildButton label="Build profile" />
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                Demo profiles:
                {DEMOS.map((u) => (
                  <Link
                    key={u}
                    href={`/${u}`}
                    className="rounded-md border border-[var(--border)] px-2 py-1 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
                  >
                    @{u}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Agent pipeline
                </h2>
                <span className="rounded-md border border-emerald-700/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">
                  Live slice
                </span>
              </div>
              <ol className="mt-5 space-y-4">
                {PIPELINE.map((item, index) => (
                  <li key={item.label} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] font-mono text-[11px] text-[var(--accent-soft)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-100">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm leading-6 text-neutral-400">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section id="purpose" className="border-b border-[var(--border)]/70">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold text-[var(--accent-soft)]">
                Purpose
              </h2>
              <p className="mt-2 text-3xl font-semibold leading-tight">
                A public portfolio for visitors and a private control surface
                for the owner.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {CAPABILITIES.map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5"
                >
                  <h3 className="text-base font-semibold text-neutral-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sources" className="border-b border-[var(--border)]/70">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-sm font-semibold text-[var(--accent-soft)]">
                  Connected sources
                </h2>
                <p className="mt-2 max-w-2xl text-3xl font-semibold leading-tight">
                  GitHub is public. Resume and Vercel controls unlock for the
                  signed-in GitHub owner.
                </p>
              </div>
              <a
                href="https://github.com/Abby263/ai-portfolio-agent/blob/main/docs/ARCHITECTURE.md"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-neutral-400 underline transition hover:text-[var(--accent-soft)]"
              >
                Architecture doc
              </a>
            </div>

            <div className="mt-8 overflow-hidden rounded-lg border border-[var(--border)]">
              {SOURCE_ROWS.map(([name, state, detail]) => (
                <div
                  key={name}
                  className="grid gap-3 border-b border-[var(--border)] bg-[var(--muted)] p-4 last:border-b-0 md:grid-cols-[180px_110px_1fr]"
                >
                  <div className="font-medium text-neutral-100">{name}</div>
                  <div>
                    <StateChip state={state} />
                  </div>
                  <p className="text-sm text-neutral-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="deploy" className="border-b border-[var(--border)]/70">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-3xl">
              <h2 className="text-sm font-semibold text-[var(--accent-soft)]">
                Vercel project split
              </h2>
              <p className="mt-2 text-3xl font-semibold leading-tight">
                Deploy the same GitHub repo twice: once from <code>web/</code>,
                once from <code>api/</code>.
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                The setup guide now calls out where Clerk, GitHub, Vercel KV,
                and API URL variables belong. Putting Clerk keys only on the
                API project will not render web sign-in.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {PROJECTS.map((project) => (
                <article
                  key={project.name}
                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-100">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Root directory: <code>{project.root}</code>
                      </p>
                    </div>
                    <span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-neutral-400">
                      {project.runtime}
                    </span>
                  </div>
                  <p className="mt-4 break-words font-mono text-xs leading-6 text-neutral-300">
                    {project.env}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-neutral-500">
          <span>PolyForm Noncommercial 1.0.0</span>
          <a
            href="https://github.com/Abby263/ai-portfolio-agent/blob/main/SETUP.md"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[var(--accent-soft)]"
          >
            Setup guide
          </a>
        </div>
      </footer>
    </div>
  );
}

function StateChip({ state }: { state: string }) {
  const isLive = state.toLowerCase().includes("live");
  return (
    <span
      className={
        "inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase " +
        (isLive
          ? "border border-emerald-700/40 bg-emerald-950/40 text-emerald-300"
          : "border border-[var(--border)] bg-[var(--background)] text-neutral-500")
      }
    >
      {state}
    </span>
  );
}
