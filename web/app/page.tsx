import Link from "next/link";
import { redirect } from "next/navigation";

import { BuildButton } from "@/components/BuildButton";

async function goToProfile(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim();
  if (!username) return;
  redirect(`/${encodeURIComponent(username)}`);
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Drop in your GitHub username",
    body: "Public profile lives at /your-username — just like /torvalds. Share that one URL anywhere, anyone can view it.",
  },
  {
    step: "02",
    title: "Plug in resume + Vercel",
    body: "Sign in to add a resume and a Vercel token from the Sources panel. Each new source makes the agents' story richer.",
  },
  {
    step: "03",
    title: "A portfolio that can act",
    body: "Ask the command bar to update READMEs, draft case studies, or open PRs across your repos. Every write goes through human review.",
  },
];

const SOURCES = [
  { name: "GitHub", state: "Live", detail: "Repos, languages, stars, topics" },
  { name: "Resume", state: "Live", detail: "Skills, experience, education from pasted text" },
  { name: "Vercel", state: "Live", detail: "Match deployments to repos, surface live URLs" },
  { name: "LinkedIn", state: "Planned", detail: "Professional history, certifications" },
  { name: "Instagram", state: "Planned", detail: "Build-in-public posts, demos" },
  { name: "Blogs / Docs", state: "Planned", detail: "Long-form writing and project docs" },
];

const DEMOS = ["torvalds", "gaearon", "tj", "sindresorhus"];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)]/60 bg-[var(--background)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium tracking-tight"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(124,58,237,0.7)]" />
            ai-portfolio-agent
          </Link>
          <nav className="flex items-center gap-5 text-xs text-neutral-400">
            <a href="#how" className="transition hover:text-neutral-100">
              How it works
            </a>
            <a href="#sources" className="transition hover:text-neutral-100">
              Sources
            </a>
            <a href="#try" className="transition hover:text-neutral-100">
              Try it
            </a>
            <a
              href="https://github.com/Abby263/ai-portfolio-agent"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[var(--border)] px-2.5 py-1 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-3xl rounded-full bg-[var(--accent)]/25 blur-[140px]" />
          <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_50%_-10%,rgba(167,139,250,0.18),transparent_55%)]" />

          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 md:py-32">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-[var(--accent-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              AI agents · LangGraph · Always live
            </div>
            <h1 className="text-balance text-center text-5xl font-semibold tracking-tight md:text-7xl">
              Your dev portfolio,{" "}
              <span className="bg-gradient-to-r from-[var(--accent-soft)] via-fuchsia-300 to-[var(--accent-soft)] bg-clip-text text-transparent">
                on autopilot
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-center text-base text-neutral-400 md:text-lg">
              Drop in a GitHub username. Agents pull the repos, write the
              story, and surface the live demos. Owners can sign in to add a
              resume, plug in Vercel, and let the command bar open PRs across
              their repos.
            </p>

            <form
              action={goToProfile}
              className="mt-10 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 shadow-2xl shadow-black/40"
            >
              <span className="pl-2 pr-1 text-sm text-neutral-500 select-none">
                /
              </span>
              <input
                name="username"
                required
                autoFocus
                autoComplete="off"
                placeholder="github-username"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-500"
              />
              <BuildButton />
            </form>

            <p className="mt-3 max-w-md text-center text-xs text-neutral-500">
              Public profile opens at{" "}
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-neutral-300">
                /your-username
              </code>
              . Share that single URL.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
              Demo:
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
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-[var(--border)]/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-neutral-500">
                How it works
              </h2>
              <p className="mt-2 max-w-2xl text-balance text-2xl font-medium tracking-tight md:text-3xl">
                From a username to a portfolio that can act — in three steps.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div
                  key={s.step}
                  className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 transition hover:border-[var(--accent-soft)]/40"
                >
                  <div
                    aria-hidden
                    className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)]/0 blur-3xl transition group-hover:bg-[var(--accent)]/10"
                  />
                  <div className="font-mono text-xs text-[var(--accent-soft)]">
                    {s.step}
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-neutral-100">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/40 p-5 text-sm text-neutral-400">
              <span className="font-medium text-neutral-200">URL pattern: </span>
              <code className="text-[var(--accent-soft)]">
                ai-portfolio-agent.vercel.app/&lt;your-github-username&gt;
              </code>
              <span className="block mt-2 text-xs text-neutral-500">
                Anyone with the link can view your portfolio. Only you (when signed in) can edit it.
              </span>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section id="sources" className="border-t border-[var(--border)]/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-neutral-500">
                  Connected sources
                </h2>
                <p className="mt-2 max-w-2xl text-balance text-2xl font-medium tracking-tight md:text-3xl">
                  The more you plug in, the better the agents' story.
                </p>
              </div>
              <a
                href="https://github.com/Abby263/ai-portfolio-agent/blob/main/docs/ARCHITECTURE.md"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-400 underline transition hover:text-[var(--accent-soft)]"
              >
                See architecture →
              </a>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 transition hover:border-[var(--accent-soft)]/40"
                >
                  <div>
                    <h3 className="text-sm font-medium text-neutral-100">
                      {s.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400">{s.detail}</p>
                  </div>
                  <StateChip state={s.state} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Try it */}
        <section id="try" className="border-t border-[var(--border)]/60">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500">
              Try it
            </h2>
            <p className="mt-2 text-balance text-3xl font-medium tracking-tight md:text-4xl">
              Build a portfolio in five seconds.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
              Type a GitHub username below. The agents fan out, fetch, parse,
              and tell the story. You'll land on{" "}
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-neutral-300">
                /your-username
              </code>
              .
            </p>
            <form
              action={goToProfile}
              className="mt-8 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 shadow-2xl shadow-black/40 mx-auto"
            >
              <span className="pl-2 pr-1 text-sm text-neutral-500 select-none">
                /
              </span>
              <input
                name="username"
                required
                autoComplete="off"
                placeholder="github-username"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-500"
              />
              <BuildButton />
            </form>
          </div>
        </section>

        <footer className="border-t border-[var(--border)]/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-neutral-500">
            <span>
              ai-portfolio-agent · PolyForm Noncommercial 1.0.0 ·{" "}
              <a
                href="https://github.com/Abby263/ai-portfolio-agent/blob/main/SETUP.md"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[var(--accent-soft)]"
              >
                Setup guide
              </a>
            </span>
            <a
              href="https://github.com/Abby263/ai-portfolio-agent"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-200"
            >
              github.com/Abby263/ai-portfolio-agent
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function StateChip({ state }: { state: string }) {
  const isLive = state.toLowerCase().includes("live");
  return (
    <span
      className={
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest " +
        (isLive
          ? "border border-emerald-700/40 bg-emerald-900/20 text-emerald-300"
          : "border border-[var(--border)] bg-[var(--background)] text-neutral-500")
      }
    >
      {state}
    </span>
  );
}
