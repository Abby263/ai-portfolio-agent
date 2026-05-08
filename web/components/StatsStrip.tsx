import type { Profile } from "@/lib/api";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function StatsStrip({ profile }: { profile: Profile }) {
  const totalStars = profile.projects.reduce((sum, p) => sum + p.stars, 0);
  const liveProjects = profile.projects.filter(
    (p) => p.deployment_url !== null || p.homepage !== null,
  ).length;
  const languages = new Set(
    profile.projects.map((p) => p.language).filter(Boolean) as string[],
  ).size;

  const items: { label: string; value: string }[] = [
    { label: "Stars", value: formatNumber(totalStars) },
    { label: "Projects", value: String(profile.projects.length) },
    { label: "Live", value: String(liveProjects) },
    { label: "Languages", value: String(languages) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[var(--muted)] px-5 py-4 transition hover:bg-[var(--background)]"
        >
          <dt className="text-[10px] uppercase text-neutral-500">
            {item.label}
          </dt>
          <dd className="mt-1 bg-gradient-to-br from-neutral-50 to-neutral-400 bg-clip-text font-mono text-2xl font-semibold text-transparent">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
