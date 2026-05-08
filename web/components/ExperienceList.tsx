import type { Experience } from "@/lib/api";

export function ExperienceList({ items }: { items: Experience[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="relative space-y-6 border-l border-[var(--border)] pl-6">
      {items.map((e, i) => (
        <li key={`${e.company}-${i}`} className="relative">
          <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--background)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="text-base font-medium text-neutral-100">
              {e.role || "Role"}
              {e.company ? (
                <span className="font-normal text-neutral-400">
                  {" · "}
                  {e.company}
                </span>
              ) : null}
            </h3>
            {e.start || e.end ? (
              <span className="text-xs text-neutral-500">
                {e.start ?? ""}
                {e.start || e.end ? " — " : ""}
                {e.end ?? "present"}
              </span>
            ) : null}
          </div>
          {e.summary ? (
            <p className="mt-1 text-sm text-neutral-400">{e.summary}</p>
          ) : null}
          {e.highlights.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-300">
              {e.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
