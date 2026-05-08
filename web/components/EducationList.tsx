import type { Education } from "@/lib/api";

export function EducationList({ items }: { items: Education[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-3">
      {items.map((e, i) => (
        <li
          key={`${e.institution}-${i}`}
          className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4"
        >
          <div className="font-medium text-neutral-100">{e.institution}</div>
          {e.degree || e.field ? (
            <div className="text-sm text-neutral-400">
              {[e.degree, e.field].filter(Boolean).join(" · ")}
            </div>
          ) : null}
          {e.start || e.end ? (
            <div className="mt-1 text-xs text-neutral-500">
              {e.start ?? ""}
              {e.start || e.end ? " — " : ""}
              {e.end ?? ""}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
