"use client";

import { useState } from "react";

import { PublicSignInLink } from "@/components/AuthBadge";
import { CommandBar } from "@/components/CommandBar";
import { EducationList } from "@/components/EducationList";
import { ExperienceList } from "@/components/ExperienceList";
import { ProfileHero } from "@/components/ProfileHero";
import { ProjectCard } from "@/components/ProjectCard";
import { ReadmeWriter } from "@/components/ReadmeWriter";
import { SkillCloud } from "@/components/SkillCloud";
import { Sources } from "@/components/Sources";
import type { Profile, SuggestedAction } from "@/lib/api";

export function ProfileView({
  initial,
  isEditMode,
}: {
  initial: Profile;
  isEditMode: boolean;
}) {
  const [profile, setProfile] = useState(initial);
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(
    null,
  );

  function handleAction(action: SuggestedAction) {
    if (!isEditMode) {
      // Public viewers see the suggestion but can't trigger write actions
      setActiveAction({ ...action, kind: "other" });
      return;
    }
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
        <p className="mt-6 text-balance text-2xl font-medium leading-snug text-[var(--accent-soft)] md:text-3xl">
          {profile.tagline}
        </p>
      ) : null}

      {profile.themes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.themes.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-1 text-xs text-neutral-300"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {isEditMode ? (
        <div className="mt-8">
          <Sources profile={profile} onUpdate={setProfile} />
        </div>
      ) : null}

      {profile.resume_summary ? (
        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/40 p-5">
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
          <div className="mt-3 whitespace-pre-line text-lg leading-relaxed text-neutral-200">
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
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500">
              Projects
            </h2>
            <span className="text-xs text-neutral-600">
              {profile.projects.filter((p) => p.deployment_url).length} live ·{" "}
              {profile.projects.length} total
            </span>
          </div>
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

      {isEditMode && activeAction?.kind === "readme_update" ? (
        <div className="mt-4">
          <ReadmeWriter
            profile={profile}
            onClose={() => setActiveAction(null)}
          />
        </div>
      ) : null}

      {!isEditMode && activeAction ? (
        <div className="mt-4 rounded-xl border border-[var(--accent-soft)]/40 bg-[var(--accent)]/5 p-4 text-sm text-neutral-300">
          <p className="font-medium text-neutral-100">
            Sign in to run write actions
          </p>
          <p className="mt-1 text-neutral-400">
            {activeAction.description} Only the profile owner can trigger
            actions like opening PRs.
          </p>
        </div>
      ) : null}

      {!isEditMode ? (
        <section className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-neutral-100">
                Are you @{profile.username}?
              </h3>
              <p className="mt-1 text-xs text-neutral-400">
                Sign in with GitHub to add your resume, connect Vercel, and let
                the agents update your repos.
              </p>
            </div>
            <PublicSignInLink username={profile.username} />
          </div>
        </section>
      ) : null}

      <p className="mt-12 text-xs text-neutral-600">
        Generated {new Date(profile.generated_at).toLocaleString()}
        {isEditMode ? " · Edit mode" : ""}
      </p>
    </>
  );
}
