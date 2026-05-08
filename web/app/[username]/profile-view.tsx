"use client";

import { useState } from "react";

import { CommandBar } from "@/components/CommandBar";
import { EducationList } from "@/components/EducationList";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { ProfileHero } from "@/components/ProfileHero";
import { ProjectCard } from "@/components/ProjectCard";
import { ReadmeWriter } from "@/components/ReadmeWriter";
import { SkillCloud } from "@/components/SkillCloud";
import { Sources } from "@/components/Sources";
import { StatsStrip } from "@/components/StatsStrip";
import type { Profile, SuggestedAction } from "@/lib/api";

type AuthState = {
  clerkReady: boolean;
  publishableConfigured: boolean;
  serverConfigured: boolean;
  signedInGitHubUsername: string | null;
};

export function ProfileView({
  initial,
  isEditMode,
}: {
  initial: Profile;
  isEditMode: boolean;
  authState: AuthState;
}) {
  const [profile, setProfile] = useState(initial);
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(
    null,
  );
  const liveProjects = profile.projects.filter(
    (project) => project.deployment_url || project.homepage,
  ).length;

  function handleAction(action: SuggestedAction) {
    if (!isEditMode) {
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
        " (this action is not wired up yet - coming soon).",
    });
  }

  return (
    <>
      <ProfileHero profile={profile} />

      <div className="mt-8">
        <StatsStrip profile={profile} />
      </div>

      {isEditMode ? (
        <div className="mt-8">
          <Sources profile={profile} onUpdate={setProfile} />
        </div>
      ) : null}

      <CareerSnapshot profile={profile} />

      {profile.story ? (
        <section className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <h2 className="text-xs uppercase text-neutral-500">
              Story
            </h2>
            <article className="prose-portfolio mt-4 whitespace-pre-line text-lg leading-[1.75] text-neutral-200">
              <span className="float-left mr-2 mt-1 select-none bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-warm)] bg-clip-text font-serif text-5xl font-semibold leading-none text-transparent md:mr-3 md:text-6xl">
                {profile.story.trim().charAt(0)}
              </span>
              {profile.story.trim().slice(1)}
            </article>
          </div>
          <aside className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
            <h3 className="text-xs uppercase text-neutral-500">
              Focus
            </h3>
            <div className="mt-4 space-y-4">
              {profile.themes.slice(0, 4).map((theme) => (
                <div
                  key={theme}
                  className="border-l border-[var(--border)] pl-3"
                >
                  <p className="text-sm font-medium text-neutral-100">
                    {theme}
                  </p>
                </div>
              ))}
              {profile.experiences[0] ? (
                <div className="border-l border-[var(--accent-warm)]/60 pl-3">
                  <p className="text-xs uppercase text-neutral-500">
                    Recent role
                  </p>
                  <p className="mt-1 text-sm text-neutral-200">
                    {profile.experiences[0].role ||
                      profile.experiences[0].company}
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      ) : null}

      {profile.skills.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">
            Skills
          </h2>
          <div className="mt-3">
            <SkillCloud skills={profile.skills} />
          </div>
        </section>
      ) : null}

      {profile.experiences.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">
            Experience
          </h2>
          <div className="mt-5">
            <ExperienceTimeline items={profile.experiences} />
          </div>
        </section>
      ) : null}

      {profile.projects.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xs uppercase text-neutral-500">
                Project gallery
              </h2>
              <p className="mt-1 text-lg font-medium text-neutral-100">
                Pinned repositories and deployed apps
              </p>
            </div>
            <span className="text-xs text-neutral-600">
              {liveProjects} live - {profile.projects.length} total
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        </section>
      ) : null}

      {profile.education.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">
            Education
          </h2>
          <div className="mt-3">
            <EducationList items={profile.education} />
          </div>
        </section>
      ) : null}

      <div className="mt-14">
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
        <div className="mt-4 rounded-lg border border-[var(--accent-soft)]/30 bg-[var(--accent)]/5 p-4 text-sm text-neutral-300">
          <p className="font-medium text-neutral-100">
            Sign in to run this action
          </p>
          <p className="mt-1 text-neutral-400">
            {activeAction.description} Only the profile owner can trigger
            write-side actions.
          </p>
        </div>
      ) : null}

      <p className="mt-16 text-xs text-neutral-600">
        Generated {new Date(profile.generated_at).toLocaleString()}
        {isEditMode ? " - Edit mode" : ""}
      </p>
    </>
  );
}

function CareerSnapshot({ profile }: { profile: Profile }) {
  const resumeConnected = profile.sources.some(
    (source) => source.connector === "resume",
  );
  const hasResumeData =
    resumeConnected ||
    profile.resume_summary ||
    profile.experiences.length > 0 ||
    profile.education.length > 0;
  if (!hasResumeData) return null;

  return (
    <section className="mt-12 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <div className="grid gap-px bg-[var(--border)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-[var(--background)] p-6 md:p-7">
          <p className="text-xs uppercase text-[var(--accent-soft)]">
            Resume signal
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-100">
            Professional experience behind the projects
          </h2>
          {profile.resume_summary ? (
            <p className="mt-4 text-balance text-base leading-7 text-neutral-300">
              {profile.resume_summary}
            </p>
          ) : (
            <p className="mt-4 text-base leading-7 text-neutral-400">
              Resume details are connected and reflected in the sections below.
            </p>
          )}
        </div>
        <div className="grid gap-px bg-[var(--border)] md:grid-cols-3 lg:grid-cols-1">
          <div className="bg-[var(--muted)] p-5">
            <p className="text-[10px] uppercase text-neutral-500">
              Roles
            </p>
            <p className="mt-1 font-mono text-2xl text-neutral-100">
              {profile.experiences.length}
            </p>
          </div>
          <div className="bg-[var(--muted)] p-5">
            <p className="text-[10px] uppercase text-neutral-500">
              Education
            </p>
            <p className="mt-1 font-mono text-2xl text-neutral-100">
              {profile.education.length}
            </p>
          </div>
          <div className="bg-[var(--muted)] p-5">
            <p className="text-[10px] uppercase text-neutral-500">
              Source
            </p>
            <p className="mt-1 text-sm text-[var(--accent-soft)]">
              Resume connected
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
