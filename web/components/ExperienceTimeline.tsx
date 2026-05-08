import type { Experience } from "@/lib/api";

export function ExperienceTimeline({ items }: { items: Experience[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="relative">
      <span
        aria-hidden
        className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--accent-soft)]/60 via-[var(--border)] to-transparent"
      />
      {items.map((e, i) => (
        <li key={`${e.company}-${i}`} className="relative pb-8 pl-10 last:pb-0">
          <span
            aria-hidden
            className="absolute left-1 top-1.5 flex h-3 w-3 items-center justify-center"
          >
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[var(--accent)]/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-soft)] ring-2 ring-[var(--background)]" />
          </span>

          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="text-base font-medium text-neutral-100">
              {e.role || "Role"}
              {e.company ? (
                <span className="ml-2 font-normal text-neutral-400">
                  at {e.company}
                </span>
              ) : null}
            </h3>
            {e.start || e.end ? (
              <span className="font-mono text-xs text-neutral-500">
                {e.start ?? ""}
                {e.start || e.end ? " — " : ""}
                {e.end ?? "present"}
              </span>
            ) : null}
          </div>

          {e.location ? (
            <p className="mt-0.5 text-xs text-neutral-500">{e.location}</p>
          ) : null}

          {e.summary ? (
            <p className="mt-2 text-sm text-neutral-300">{e.summary}</p>
          ) : null}

          {e.highlights.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-300">
              {e.highlights.map((h, j) => (
                <li
                  key={j}
                  className="relative pl-4 before:absolute before:left-0 before:top-2.5 before:h-px before:w-2 before:bg-[var(--accent-soft)]/50"
                >
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
