import Link from "next/link";
import { redirect } from "next/navigation";

async function goToProfile(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim();
  if (!username) return;
  redirect(`/${encodeURIComponent(username)}`);
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect your sources",
    body: "GitHub today; Vercel, LinkedIn, Instagram, your resume, and project docs as they ship. Every fact carries provenance back to the source it came from.",
  },
  {
    step: "02",
    title: "Agents do the work",
    body: "A LangGraph orchestrator fans out to per-domain agents — fetcher, parser, storyteller — that retrieve, reason, and merge into a single living profile.",
  },
  {
    step: "03",
    title: "A portfolio that acts",
    body: "Beyond showcasing your work, ask the agent to update READMEs, generate case studies, or open PRs across your repos. Every write goes through human review.",
  },
];

const AGENTS = [
  {
    name: "Profile Builder",
    role: "Synthesizes the developer profile from indexed sources.",
    state: "Live",
  },
  {
    name: "GitHub Agent",
    role: "Reads repos, READMEs, languages, topics; later writes branches & PRs.",
    state: "Live (read), Live (write)",
  },
  {
    name: "Resume Parser",
    role: "Extracts skills, experience, and education from pasted text.",
    state: "Live",
  },
  {
    name: "Storytelling Agent",
    role: "Generates the tagline, narrative, themes, and per-project highlights.",
    state: "Live",
  },
  {
    name: "Command Router",
    role: "Conversational interface for asking and instructing the portfolio.",
    state: "Live",
  },
  {
    name: "README Update Agent",
    role: "Drafts a structured README, opens a PR after explicit human review.",
    state: "Live",
  },
  {
    name: "Vercel Agent",
    role: "Lists deployments and matches them to repos.",
    state: "Planned",
  },
  {
    name: "LinkedIn / Instagram",
    role: "Pulls professional and creative posts to enrich the profile.",
    state: "Planned",
  },
];

const SOURCES = [
  { name: "GitHub", state: "Live" },
  { name: "Resume", state: "Live" },
  { name: "Vercel", state: "Planned" },
  { name: "LinkedIn", state: "Planned" },
  { name: "Instagram", state: "Planned" },
  { name: "Blogs / Docs", state: "Planned" },
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
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
            ai-portfolio-agent
          </Link>
          <nav className="flex items-center gap-5 text-xs text-neutral-400">
            <a href="#how" className="transition hover:text-neutral-100">
              How it works
            </a>
            <a href="#agents" className="transition hover:text-neutral-100">
              Agents
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
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[480px] max-w-3xl rounded-full bg-[var(--accent)]/20 blur-[120px]" />
          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 md:py-32">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-[var(--accent-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              AI-powered developer portfolio
            </div>
            <h1 className="text-balance text-center text-5xl font-semibold tracking-tight md:text-7xl">
              A living portfolio that{" "}
              <span className="text-[var(--accent-soft)]">tells your story</span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-center text-base text-neutral-400 md:text-lg">
              Connect GitHub, Vercel, your resume and more. Let agents assemble
              the portfolio, narrate your journey, and act on your repos when
              you ask.
            </p>

            <form
              action={goToProfile}
              className="mt-10 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 shadow-lg shadow-black/30"
            >
              <input
                name="username"
                required
                autoFocus
                autoComplete="off"
                placeholder="GitHub username, e.g. torvalds"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)]"
              >
                Build portfolio
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
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
                Three steps from sources to a portfolio that can act.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6"
                >
                  <div className="text-xs font-mono text-[var(--accent-soft)]">
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
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="border-t border-[var(--border)]/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-neutral-500">
                  Agents
                </h2>
                <p className="mt-2 max-w-2xl text-balance text-2xl font-medium tracking-tight md:text-3xl">
                  A LangGraph orchestrator routes work to specialists.
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
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4"
                >
                  <div>
                    <h3 className="text-sm font-medium text-neutral-100">
                      {a.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400">{a.role}</p>
                  </div>
                  <StateChip state={a.state} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="border-t border-[var(--border)]/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-neutral-500">
                Connected sources
              </h2>
              <p className="mt-2 max-w-2xl text-balance text-2xl font-medium tracking-tight md:text-3xl">
                Plug in everything that explains who you are as a developer.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4"
                >
                  <span className="text-sm text-neutral-100">{s.name}</span>
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
              Drop in a GitHub username.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
              The profile builds in a few seconds. Add your resume to enrich
              experience and education, then ask the command bar to do
              something useful.
            </p>
            <form
              action={goToProfile}
              className="mt-8 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 shadow-lg shadow-black/30 mx-auto"
            >
              <input
                name="username"
                required
                autoComplete="off"
                placeholder="GitHub username"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)]"
              >
                Build
              </button>
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
