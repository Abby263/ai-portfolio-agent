import type { Project } from "@/lib/api";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.repo_url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 transition hover:border-[var(--accent-soft)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-neutral-100 group-hover:text-[var(--accent-soft)]">
          {project.name}
        </h3>
        <span className="shrink-0 text-xs text-neutral-400">
          ★ {project.stars}
        </span>
      </div>
      {project.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-400">
          {project.description}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-neutral-500">
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
    </a>
  );
}
