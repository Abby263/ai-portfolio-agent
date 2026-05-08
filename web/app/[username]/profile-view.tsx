"use client";

import { useState } from "react";

import { CommandBar } from "@/components/CommandBar";
import { EducationList } from "@/components/EducationList";
import { ExperienceList } from "@/components/ExperienceList";
import { ProfileHero } from "@/components/ProfileHero";
import { ProjectCard } from "@/components/ProjectCard";
import { ReadmeWriter } from "@/components/ReadmeWriter";
import { SkillCloud } from "@/components/SkillCloud";
import { Sources } from "@/components/Sources";
import type { Profile, SuggestedAction } from "@/lib/api";

export function ProfileView({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(
    null,
  );

  function handleAction(action: SuggestedAction) {
    if (action.kind === "readme_update") {
      setActiveAction(action);
      return;
    }
    setActiveAction({
      ...action,
      description:
        action.description +
        " (this action isn't wired up yet — coming soon).",
    });
  }

  return (
    <>
      <ProfileHero profile={profile} />

      {profile.tagline ? (
        <p className="mt-6 text-balance text-2xl font-medium leading-snug text-[var(--accent-soft)]">
          {profile.tagline}
        </p>
      ) : null}

      {profile.themes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.themes.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-neutral-400"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <Sources profile={profile} onUpdate={setProfile} />
      </div>

      {profile.resume_summary ? (
        <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5">
          <p className="text-neutral-200 leading-relaxed">
            {profile.resume_summary}
          </p>
        </section>
      ) : null}

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

      {profile.experiences.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Experience
          </h2>
          <div className="mt-4">
            <ExperienceList items={profile.experiences} />
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

      {profile.education.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Education
          </h2>
          <div className="mt-3">
            <EducationList items={profile.education} />
          </div>
        </section>
      ) : null}

      <div className="mt-12">
        <CommandBar profile={profile} onAction={handleAction} />
      </div>

      {activeAction?.kind === "readme_update" ? (
        <div className="mt-4">
          <ReadmeWriter
            profile={profile}
            onClose={() => setActiveAction(null)}
          />
        </div>
      ) : null}

      <p className="mt-16 text-xs text-neutral-600">
        Generated {new Date(profile.generated_at).toLocaleString()}
      </p>
    </>
  );
}
