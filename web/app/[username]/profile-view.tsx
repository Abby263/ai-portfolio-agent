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
import type { Profile, Project, SuggestedAction } from "@/lib/api";

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
  const liveProjects = profile.projects.filter(
    (project) => project.deployment_url || project.homepage,
  ).length;
  const featuredProject =
    profile.projects.find(
      (project) =>
        project.pinned && (project.deployment_url || project.homepage),
    ) ??
    profile.projects.find((project) => project.pinned) ??
    profile.projects.find(
      (project) => project.deployment_url || project.homepage,
    ) ??
    profile.projects[0] ??
    null;
  const gridProjects = featuredProject
    ? profile.projects
        .filter((project) => project.name !== featuredProject.name)
        .slice(0, 11)
    : profile.projects.slice(0, 12);

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

      {featuredProject ? (
        <FeaturedProjectPanel project={featuredProject} />
      ) : null}

      {profile.resume_summary ? (
        <section className="mt-12 border-l border-[var(--accent-soft)]/50 bg-[var(--muted)]/60 px-6 py-5">
          <h2 className="mb-3 text-xs uppercase text-neutral-500">
            Resume signal
          </h2>
          <p className="text-balance text-lg leading-relaxed text-neutral-200">
            {profile.resume_summary}
          </p>
        </section>
      ) : null}

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
              {featuredProject ? (
                <div className="border-l border-[var(--accent-warm)]/60 pl-3">
                  <p className="text-xs uppercase text-neutral-500">
                    Featured build
                  </p>
                  <p className="mt-1 text-sm text-neutral-200">
                    {featuredProject.name}
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
                Projects
              </h2>
              <p className="mt-1 text-lg font-medium text-neutral-100">
                Featured repositories and deployed apps
              </p>
            </div>
            <span className="text-xs text-neutral-600">
              {liveProjects} live - {profile.projects.length} total
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridProjects.map((p) => (
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

function FeaturedProjectPanel({ project }: { project: Project }) {
  const liveHref = project.deployment_url ?? project.homepage;

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[linear-gradient(135deg,var(--muted),var(--background)_70%)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-6 md:p-7">
          <div className="flex flex-wrap gap-2">
            {project.pinned ? (
              <span className="rounded-md border border-[var(--accent-warm)]/40 bg-[var(--accent-warm)]/10 px-2 py-0.5 text-[10px] uppercase text-[var(--accent-warm)]">
                Featured repo
              </span>
            ) : null}
            {liveHref ? (
              <span className="rounded-md border border-emerald-700/40 bg-emerald-900/10 px-2 py-0.5 text-[10px] uppercase text-emerald-300">
                Deployed app
              </span>
            ) : null}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-100 md:text-3xl">
            {project.name}
          </h2>
          {project.description ? (
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-300">
              {project.description}
            </p>
          ) : null}
          {project.highlights.length > 0 ? (
            <ul className="mt-5 grid gap-2 text-sm text-neutral-300 md:grid-cols-2">
              {project.highlights.slice(0, 4).map((highlight) => (
                <li
                  key={highlight}
                  className="border-l border-[var(--accent-soft)]/40 pl-3"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {liveHref ? (
              <a
                href={liveHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)]"
              >
                Open live app
              </a>
            ) : null}
            {project.repo_url ? (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
              >
                View repo
              </a>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-px border-t border-[var(--border)] bg-[var(--border)] lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="bg-[var(--background)]/80 p-5">
            <dt className="text-[10px] uppercase text-neutral-500">
              Stars
            </dt>
            <dd className="mt-1 font-mono text-2xl text-neutral-100">
              {project.stars}
            </dd>
          </div>
          <div className="bg-[var(--background)]/80 p-5">
            <dt className="text-[10px] uppercase text-neutral-500">
              Stack
            </dt>
            <dd className="mt-1 text-sm text-neutral-200">
              {project.language ?? "Mixed"}
            </dd>
          </div>
          <div className="bg-[var(--background)]/80 p-5">
            <dt className="text-[10px] uppercase text-neutral-500">
              Surface
            </dt>
            <dd className="mt-1 text-sm text-[var(--accent-soft)]">
              {liveHref ? "Live web app" : "Repository"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
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
    "Sign in with GitHub as this profile owner to upload a resume and run write-side actions. Project live app URLs come from GitHub repo Website metadata.";

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
