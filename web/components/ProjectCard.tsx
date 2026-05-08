import type { Project } from "@/lib/api";

export function ProjectCard({ project }: { project: Project }) {
  const primaryHref = project.deployment_url ?? project.repo_url ?? "#";
  return (
    <div className="group flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5 transition hover:border-[var(--accent-soft)]">
      <div className="flex items-start justify-between gap-2">
        <a
          href={primaryHref}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-neutral-100 transition group-hover:text-[var(--accent-soft)]"
        >
          {project.name}
        </a>
        <span className="shrink-0 text-xs text-neutral-400">
          ★ {project.stars}
        </span>
      </div>
      {project.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-400">
          {project.description}
        </p>
      ) : null}
      {project.highlights.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-neutral-300">
          {project.highlights.slice(0, 3).map((h, i) => (
            <li key={i} className="line-clamp-2">
              {h}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto pt-4">
        {project.deployment_url ? (
          <a
            href={project.deployment_url}
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-900/10 px-2 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-900/20"
          >
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Live - {project.deployment_target ?? "preview"}
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
              repo
            </a>
          ) : null}
          {project.language ? (
            <span className="rounded-md border border-[var(--border)] px-2 py-0.5">
              {project.language}
            </span>
          ) : null}
          {project.topics.slice(0, 3).map((t) => (
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
  );
}
