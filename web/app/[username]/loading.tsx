export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8 h-3 w-12 animate-pulse rounded bg-[var(--muted)]" />

      <section className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="h-24 w-24 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-64 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--muted)]" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--muted)]" />
        </div>
      </section>

      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs text-neutral-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-soft)]" />
        </span>
        Agents are building this profile…
      </div>

      <div className="mt-12 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
        <div className="h-3 w-full max-w-2xl animate-pulse rounded bg-[var(--muted)]" />
        <div className="h-3 w-full max-w-xl animate-pulse rounded bg-[var(--muted)]" />
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]"
          />
        ))}
      </div>
    </main>
  );
}
