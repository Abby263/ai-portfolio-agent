import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileHero } from "@/components/ProfileHero";
import { ProjectCard } from "@/components/ProjectCard";
import { SkillCloud } from "@/components/SkillCloud";
import { fetchProfile } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-xs text-neutral-500 transition hover:text-[var(--accent-soft)]"
      >
        ← back
      </Link>

      <ProfileHero profile={profile} />

      {profile.story ? (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Story
          </h2>
          <div className="mt-3 whitespace-pre-line text-neutral-200 leading-relaxed">
            {profile.story}
          </div>
        </section>
      ) : null}

      {profile.skills.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Skills
          </h2>
          <div className="mt-3">
            <SkillCloud skills={profile.skills} />
          </div>
        </section>
      ) : null}

      {profile.projects.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Projects
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.slice(0, 12).map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-16 text-xs text-neutral-600">
        Generated {new Date(profile.generated_at).toLocaleString()}
      </p>
    </main>
  );
}
