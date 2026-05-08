import type { Profile } from "@/lib/api";

export function ProfileHero({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col items-start gap-6 md:flex-row md:items-center">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.display_name ?? profile.username}
          className="h-24 w-24 rounded-full border border-[var(--border)]"
        />
      ) : null}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold md:text-4xl">
          {profile.display_name ?? profile.username}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">@{profile.username}</p>
        {profile.headline ? (
          <p className="mt-3 max-w-2xl text-neutral-300">{profile.headline}</p>
        ) : null}
        {profile.location ? (
          <p className="mt-2 text-xs text-neutral-500">
            Location: {profile.location}
          </p>
        ) : null}
        {Object.keys(profile.links).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(profile.links).map(([k, v]) => (
              <a
                key={k}
                href={v.startsWith("http") ? v : `https://${v}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
              >
                {k}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
