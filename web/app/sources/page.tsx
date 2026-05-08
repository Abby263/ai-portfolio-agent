import Link from "next/link";

import { AuthBadge } from "@/components/AuthBadge";
import {
  PortfolioNavLink,
  SignedUserSources,
} from "@/components/LandingUserPanels";

export default function SourcesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-500 transition hover:text-[var(--accent-soft)]"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          AI Portfolio Agent
        </Link>
        <nav className="flex items-center gap-3 text-xs text-neutral-400">
          <PortfolioNavLink className="transition hover:text-neutral-100" />
          <AuthBadge />
        </nav>
      </header>

      <section className="mb-8">
        <p className="text-sm font-medium text-[var(--accent-soft)]">
          Owner sources
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
          Manage the resume and GitHub sources behind your portfolio.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-400">
          Upload or replace your resume, verify what is connected, and refresh
          the cached portfolio only when you want the public page regenerated.
        </p>
      </section>

      <SignedUserSources />
    </main>
  );
}
