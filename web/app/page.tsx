import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthBadge } from "@/components/AuthBadge";
import { BuildButton } from "@/components/BuildButton";
import { PortfolioNavLink } from "@/components/LandingUserPanels";

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
    label: "Live apps",
    detail: "Use repo Website URLs for deployed projects.",
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
            <Link href="/sources" className="transition hover:text-neutral-100">
              Sources
            </Link>
            <PortfolioNavLink className="transition hover:text-neutral-100" />
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
                resume uploads, and deployed app URLs stored on GitHub repos.
                The same profile also becomes a command center for README
                drafts and guarded GitHub pull requests.
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

        <section className="border-b border-[var(--border)]/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-14 md:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <p className="text-xs uppercase text-neutral-500">
                Portfolio cache
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                Fast after first build
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                The generated portfolio is saved so repeat visits do not
                rebuild unless the owner updates sources.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <p className="text-xs uppercase text-neutral-500">
                Resume-aware
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                Professional work matters
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Uploaded resumes add roles, education, contact details, and
                career context to the public page.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <p className="text-xs uppercase text-neutral-500">
                Deployed apps
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                Pinned repos first
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                GitHub pinned repositories and repo Website URLs drive the
                project gallery.
              </p>
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
