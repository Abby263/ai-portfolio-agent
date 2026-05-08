import Link from "next/link";

import { AuthBadge } from "@/components/AuthBadge";
import { PortfolioNavLink } from "@/components/LandingUserPanels";

const PIPELINE = [
  {
    label: "Connect",
    detail: "Pull GitHub projects, deployed app links, and resume-backed career data.",
  },
  {
    label: "Generate",
    detail: "Build a public developer portfolio from repos, pinned work, and experience.",
  },
  {
    label: "Share",
    detail: "Send one link recruiters and collaborators can explore without a walkthrough.",
  },
  {
    label: "Chat",
    detail: "Let visitors ask about projects, work history, tech stack, and resume details.",
  },
  {
    label: "Act",
    detail: "Use owner-only actions for README refreshes and repo follow-up work.",
  },
];

const CHAT_EXAMPLES = [
  {
    speaker: "Recruiter",
    text: "Which projects show production React and backend work?",
  },
  {
    speaker: "Portfolio",
    text: "The assistant compares pinned repos, deployed app links, languages, and resume experience.",
  },
  {
    speaker: "Developer",
    text: "Ask your own portfolio what changed across projects before interviews or README updates.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)]/70 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--accent-soft)]" />
            AI Developer Portfolio Manager Agent
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
                Shareable portfolio with a built-in project assistant
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-6xl">
                Turn your GitHub and resume into a portfolio people can chat with.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
                AI Developer Portfolio Manager Agent creates a public page for
                your strongest work, then lets visitors ask informed questions
                about your projects, deployed apps, tech stack, career history,
                education, and resume details.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400">
                Recruiters can quickly understand how your experience maps to a
                role. Developers can use the same chat to revisit their own
                repos, explain architectural choices, and prepare for portfolio
                reviews without digging through every README manually.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/sources"
                  className="rounded-md bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white"
                >
                  Connect sources
                </Link>
                <PortfolioNavLink
                  label="Open my portfolio"
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-neutral-200 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
                />
              </div>
              <div className="mt-5 max-w-xl rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-sm leading-6 text-neutral-400">
                The portfolio chat is grounded in connected GitHub metadata,
                deployed app URLs, saved resume text, parsed roles, education,
                skills, and contact links.
              </div>
            </div>

            <aside className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Portfolio conversation
                </h2>
                <span className="rounded-md border border-emerald-700/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">
                  Live context
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {CHAT_EXAMPLES.map((item) => (
                  <div
                    key={item.speaker}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
                  >
                    <p className="text-[10px] uppercase text-[var(--accent-soft)]">
                      {item.speaker}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">
                      {item.text}
                    </p>
                  </div>
                ))}
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
                Shareable portfolio
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                One link for the whole story
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Visitors see pinned projects, live app links, professional
                history, education, skills, and contact details in one public
                portfolio.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <p className="text-xs uppercase text-neutral-500">
                Recruiter research
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                Ask before the screen
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Recruiters can ask about work experience, role fit, tech stack,
                deployed projects, and resume details without switching tabs.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <p className="text-xs uppercase text-neutral-500">
                Developer cockpit
              </p>
              <p className="mt-3 text-xl font-semibold text-neutral-100">
                Talk to your own work
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Use the same portfolio chat to revisit repo context, summarize
                your resume, prepare interviews, and queue owner-reviewed repo
                actions.
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
