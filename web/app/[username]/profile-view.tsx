"use client";

import { useState } from "react";

import { PublicSignInLink } from "@/components/AuthBadge";
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
  authState,
}: {
  initial: Profile;
  isEditMode: boolean;
  authState: AuthState;
}) {
  const [profile, setProfile] = useState(initial);
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(
    null,
  );

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

      <div className="mt-8">
        <StatsStrip profile={profile} />
      </div>

      {isEditMode ? (
        <div className="mt-8">
          <Sources profile={profile} onUpdate={setProfile} />
        </div>
      ) : (
        <div className="mt-8">
          <OwnerToolsPanel profile={profile} authState={authState} />
        </div>
      )}

      {profile.resume_summary ? (
        <section className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-6">
          <p className="text-balance text-lg leading-relaxed text-neutral-200">
            {profile.resume_summary}
          </p>
        </section>
      ) : null}

      {profile.story ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">
            Story
          </h2>
          <article className="prose-portfolio mt-4 whitespace-pre-line text-lg leading-[1.75] text-neutral-200">
            <span className="float-left mr-2 mt-1 select-none bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-warm)] bg-clip-text font-serif text-5xl font-semibold leading-none text-transparent md:mr-3 md:text-6xl">
              {profile.story.trim().charAt(0)}
            </span>
            {profile.story.trim().slice(1)}
          </article>
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
            <h2 className="text-xs uppercase text-neutral-500">
              Projects
            </h2>
            <span className="text-xs text-neutral-600">
              {profile.projects.filter((p) => p.deployment_url).length} live -{" "}
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

function OwnerToolsPanel({
  profile,
  authState,
}: {
  profile: Profile;
  authState: AuthState;
}) {
  const signedInAs = authState.signedInGitHubUsername;
  const signedInAsDifferentUser =
    signedInAs !== null && signedInAs !== profile.username.toLowerCase();

  let title = "Owner tools";
  let detail =
    "Sign in with GitHub as this profile owner to upload a resume, connect Vercel deployments, and run write-side actions.";

  if (!authState.clerkReady) {
    title = "Owner tools need Clerk on the web project";
    if (!authState.publishableConfigured && authState.serverConfigured) {
      detail =
        "CLERK_SECRET_KEY is present, but NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing from the ai-portfolio-agent Vercel project, so sign-in cannot render.";
    } else if (!authState.publishableConfigured) {
      detail =
        "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to the ai-portfolio-agent Vercel project. Clerk keys on the API project alone cannot render sign-in.";
    } else {
      detail =
        "Add CLERK_SECRET_KEY to the ai-portfolio-agent Vercel project so the web app can identify the signed-in GitHub user.";
    }
  } else if (signedInAsDifferentUser) {
    title = "Signed in as a different GitHub user";
    detail = `You are signed in as @${signedInAs}. Edit mode unlocks only for @${profile.username}.`;
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-medium text-neutral-100">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">
            {detail}
          </p>
          {!authState.clerkReady ? (
            <p className="mt-2 text-xs text-neutral-500">
              Local fallback while developing: open this profile with{" "}
              <code className="rounded bg-[var(--background)] px-1.5 py-0.5 text-neutral-300">
                ?edit=1
              </code>
              .
            </p>
          ) : null}
        </div>
        {authState.clerkReady ? (
          <PublicSignInLink />
        ) : (
          <a
            href="https://github.com/Abby263/ai-portfolio-agent/blob/main/SETUP.md#clerk-auth"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
          >
            Open setup guide
          </a>
        )}
      </div>
    </section>
  );
}
