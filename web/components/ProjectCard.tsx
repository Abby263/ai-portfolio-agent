import type { Project } from "@/lib/api";

export function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  const liveHref = project.deployment_url ?? project.homepage;
  const primaryHref = liveHref ?? project.repo_url ?? "#";
  const liveLabel = project.deployment_target ?? "live app";

  return (
    <div
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-[var(--muted)] transition " +
        (featured
          ? "border-[var(--accent-soft)]/30 shadow-lg shadow-[var(--accent)]/10 hover:border-[var(--accent-soft)]/60 hover:shadow-[var(--accent)]/20"
          : "border-[var(--border)] hover:border-[var(--accent-soft)]")
      }
    >
      <div
        aria-hidden
        className={
          "h-1 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent-warm)] to-transparent " +
          (featured ? "opacity-100" : "opacity-70")
        }
      />
      {featured ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--accent-soft)]/10 blur-3xl transition-opacity group-hover:bg-[var(--accent-soft)]/20"
        />
      ) : null}

      <div className={"flex flex-1 flex-col " + (featured ? "p-6" : "p-5")}>
        <div className="flex items-start justify-between gap-3">
          <a
            href={primaryHref}
            target="_blank"
            rel="noreferrer"
            className={
              "min-w-0 truncate font-medium text-neutral-100 transition group-hover:text-[var(--accent-soft)] " +
              (featured ? "text-lg md:text-xl" : "")
            }
          >
            {project.name}
          </a>
          <span className="shrink-0 font-mono text-xs text-neutral-400">
            ★ {project.stars}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {project.pinned ? (
            <span className="rounded-md border border-[var(--accent-warm)]/40 bg-[var(--accent-warm)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--accent-warm)]">
              Featured
            </span>
          ) : null}
          {liveHref ? (
            <span className="rounded-md border border-emerald-700/40 bg-emerald-900/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
              Deployed
            </span>
          ) : null}
        </div>

        {project.description ? (
          <p
            className={
              "mt-3 text-neutral-400 " +
              (featured
                ? "line-clamp-4 text-base leading-relaxed"
                : "line-clamp-3 text-sm")
            }
          >
            {project.description}
          </p>
        ) : null}

        {project.highlights.length > 0 ? (
          <ul
            className={
              "mt-3 list-inside list-disc space-y-1 text-neutral-300 " +
              (featured ? "text-sm" : "text-xs")
            }
          >
            {project.highlights.slice(0, 3).map((h, i) => (
              <li key={i} className="line-clamp-2">
                {h}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-4">
          {liveHref ? (
            <a
              href={liveHref}
              target="_blank"
              rel="noreferrer"
              className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-900/10 px-2 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-900/20"
            >
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Open {liveLabel}
            </a>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            {project.repo_url ? (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--border)] px-2 py-0.5 transition hover:text-[var(--accent-soft)]"
              >
                GitHub repo
              </a>
            ) : null}
            {project.language ? (
              <span className="rounded-md border border-[var(--border)] px-2 py-0.5">
                {project.language}
              </span>
            ) : null}
            {project.topics.slice(0, featured ? 5 : 3).map((t) => (
              <span
                key={t}
                className="rounded-md border border-[var(--border)] px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
