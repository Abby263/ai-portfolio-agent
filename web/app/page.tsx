import Link from "next/link";

import { AuthBadge } from "@/components/AuthBadge";
import { PortfolioNavLink } from "@/components/LandingUserPanels";

const PIPELINE = [
  {
    label: "Connect",
    detail: "Bring in GitHub projects, live app links, and the uploaded resume.",
  },
  {
    label: "Explain",
    detail: "Turn repos, pinned work, experience, and stack into a readable story.",
  },
  {
    label: "Share",
    detail: "Send one public link instead of a resume, GitHub profile, and demo list.",
  },
  {
    label: "Chat",
    detail: "Let visitors ask the portfolio about projects, work history, and tech stack.",
  },
  {
    label: "Act",
    detail: "Let the owner use the same context for README and repo follow-up work.",
  },
];

const CHAT_EXAMPLES = [
  {
    speaker: "Recruiter",
    text: "Which projects prove production React, backend API work, and AI agent experience?",
  },
  {
    speaker: "Portfolio",
    text: "I can answer from pinned repos, deployed demos, GitHub metadata, and resume experience.",
  },
  {
    speaker: "Developer",
    text: "What should I highlight before an interview, and which repos match this role?",
  },
];

const AUDIENCES = [
  {
    label: "For recruiters",
    title: "Screen the work, not just the keywords",
    text: "Ask how the developer has used specific frameworks, which projects are live, what experience is resume-backed, and where the strongest proof of a tech stack lives.",
  },
  {
    label: "For developers",
    title: "Talk to your own GitHub and resume",
    text: "Use the portfolio chat to refresh project context before interviews, summarize your career story, find the best repo examples, and prepare owner-reviewed repo updates.",
  },
  {
    label: "For shared context",
    title: "One link that answers follow-up questions",
    text: "The public page shows the portfolio, while the chat stays grounded in GitHub metadata, deployed links, parsed resume details, and the uploaded resume PDF.",
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
                Share one link. Let the portfolio answer back.
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-6xl">
                Share a developer portfolio anyone can chat with.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
                AI Developer Portfolio Manager Agent turns GitHub projects,
                deployed demos, and your resume into a public portfolio that can
                answer follow-up questions for recruiters, collaborators, and
                the developer who owns it.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400">
                Recruiters can ask about work experience, role fit, live apps,
                and tech stack without hunting through every repo. Developers
                can ask their own portfolio to explain projects, summarize the
                uploaded resume, and surface the strongest examples before an
                interview or portfolio review.
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
                The chat is grounded in connected GitHub metadata, deployed app
                URLs, saved resume text, parsed roles, education, skills,
                contact links, and the embedded resume PDF.
              </div>
            </div>

            <aside className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Example conversation
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
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="max-w-3xl">
              <p className="text-xs uppercase text-neutral-500">
                Why this exists
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-neutral-100 md:text-4xl">
                A portfolio should do more than sit there.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-400">
                Static portfolios make people guess what matters. This one
                gives the work a conversational layer, so every visitor can move
                from “what has this developer built?” to “show me the proof”
                without losing context.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {AUDIENCES.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5"
                >
                  <p className="text-xs uppercase text-neutral-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-neutral-100">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {item.text}
                  </p>
                </div>
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
