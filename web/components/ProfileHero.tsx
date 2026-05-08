import type { Profile } from "@/lib/api";

function linkHref(label: string, value: string): string {
  if (label === "email") return `mailto:${value}`;
  if (label === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (
    value.startsWith("http") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return value;
  }
  return `https://${value}`;
}

function linkLabel(label: string, value: string): string {
  const labels: Record<string, string> = {
    blog: "Website",
    email: "Email",
    github: "GitHub",
    linkedin: "LinkedIn",
    phone: value,
    twitter: "Twitter",
    website: "Website",
  };
  return labels[label] ?? label;
}

export function ProfileHero({ profile }: { profile: Profile }) {
  const liveProjects = profile.projects.filter(
    (project) => project.deployment_url || project.homepage,
  ).length;
  const featuredProjects = profile.projects.filter((project) => project.pinned)
    .length;

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[linear-gradient(135deg,var(--muted),var(--background)_58%,rgba(245,158,11,0.10))]">
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_280px] md:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              className="h-24 w-24 rounded-full border border-[var(--border)] shadow-xl shadow-black/30"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">
              @{profile.username}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">
              {profile.display_name ?? profile.username}
            </h1>
            {profile.headline ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300">
                {profile.headline}
              </p>
            ) : null}
            {profile.location ? (
              <p className="mt-3 text-sm text-neutral-500">
                {profile.location}
              </p>
            ) : null}
            {Object.keys(profile.links).length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(profile.links).map(([k, v]) => (
                  <a
                    key={k}
                    href={linkHref(k, v)}
                    target={
                      k === "email" || k === "phone" ? undefined : "_blank"
                    }
                    rel={
                      k === "email" || k === "phone" ? undefined : "noreferrer"
                    }
                    title={v}
                    className="rounded-md border border-[var(--border)] bg-[var(--background)]/70 px-2.5 py-1 text-xs text-neutral-200 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
                  >
                    {linkLabel(k, v)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] md:grid-cols-1">
          <div className="bg-[var(--background)]/80 p-4">
            <dt className="text-[10px] uppercase text-neutral-500">
              Featured
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-neutral-100">
              {featuredProjects}
            </dd>
          </div>
          <div className="bg-[var(--background)]/80 p-4">
            <dt className="text-[10px] uppercase text-neutral-500">
              Live apps
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-[var(--accent-soft)]">
              {liveProjects}
            </dd>
          </div>
          <div className="bg-[var(--background)]/80 p-4">
            <dt className="text-[10px] uppercase text-neutral-500">
              Skills
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-neutral-100">
              {profile.skills.length}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
