"use client";

import { useState } from "react";

import { EducationList } from "@/components/EducationList";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { ProfileHero } from "@/components/ProfileHero";
import { ProjectCard } from "@/components/ProjectCard";
import { ReadmeWriter } from "@/components/ReadmeWriter";
import { SideChat } from "@/components/SideChat";
import { SkillCloud } from "@/components/SkillCloud";
import { Sources } from "@/components/Sources";
import { StatsStrip } from "@/components/StatsStrip";
import {
  resumeUrl,
  type Experience,
  type Profile,
  type SuggestedAction,
} from "@/lib/api";

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
  const [chatOpen, setChatOpen] = useState(false);
  const liveProjects = profile.projects.filter(
    (project) => project.deployment_url || project.homepage,
  ).length;
  const pinnedProjects = profile.projects.filter((p) => p.pinned);
  const otherProjects = profile.projects.filter((p) => !p.pinned);
  const professionalExperiences = getProfessionalExperiences(
    profile.experiences,
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

      {/* "Talk with this portfolio" CTA — discoverable, opens the side chat */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="group mt-6 flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[linear-gradient(135deg,var(--muted),var(--background)_55%,rgba(94,234,212,0.08))] px-5 py-4 text-left transition hover:border-[var(--accent-soft)]/60"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-soft)]/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-soft)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-100">
              Chat with this portfolio
            </p>
            <p className="text-xs text-neutral-400">
              Ask about projects, experience, tech stack, and the embedded
              resume.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--background)]/80 px-3 py-1.5 text-xs text-[var(--accent-soft)] transition group-hover:border-[var(--accent-soft)]/60">
          Open chat →
        </span>
      </button>

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
            <h2 className="text-xs uppercase text-neutral-500">Story</h2>
            <article className="prose-portfolio mt-4 whitespace-pre-line text-lg leading-[1.75] text-neutral-200">
              <span className="float-left mr-2 mt-1 select-none bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-warm)] bg-clip-text font-serif text-5xl font-semibold leading-none text-transparent md:mr-3 md:text-6xl">
                {profile.story.trim().charAt(0)}
              </span>
              {profile.story.trim().slice(1)}
            </article>
          </div>
          <aside className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
            <h3 className="text-xs uppercase text-neutral-500">Focus</h3>
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
              {professionalExperiences[0] ? (
                <div className="border-l border-[var(--accent-warm)]/60 pl-3">
                  <p className="text-xs uppercase text-neutral-500">
                    Recent role
                  </p>
                  <p className="mt-1 text-sm text-neutral-200">
                    {professionalExperiences[0].role ||
                      professionalExperiences[0].company}
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      ) : null}

      {profile.skills.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">Skills</h2>
          <div className="mt-3">
            <SkillCloud skills={profile.skills} />
          </div>
        </section>
      ) : null}

      {professionalExperiences.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">Experience</h2>
          <div className="mt-5">
            <ExperienceTimeline items={professionalExperiences} />
          </div>
        </section>
      ) : null}

      {pinnedProjects.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xs uppercase text-neutral-500">
                Featured work
              </h2>
              <p className="mt-1 text-lg font-medium text-neutral-100">
                Pinned by {profile.display_name ?? profile.username}
              </p>
            </div>
            <span className="font-mono text-xs text-neutral-600">
              {pinnedProjects.length} pinned
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pinnedProjects.slice(0, 6).map((p) => (
              <ProjectCard key={p.name} project={p} featured />
            ))}
          </div>
        </section>
      ) : null}

      {otherProjects.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xs uppercase text-neutral-500">
                Project gallery
              </h2>
              <p className="mt-1 text-lg font-medium text-neutral-100">
                {pinnedProjects.length > 0
                  ? "More from the same workshop"
                  : "Pinned repositories and deployed apps"}
              </p>
            </div>
            <span className="text-xs text-neutral-600">
              {liveProjects} live · {profile.projects.length} total
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherProjects.slice(0, 12).map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        </section>
      ) : null}

      {profile.education.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase text-neutral-500">Education</h2>
          <div className="mt-3">
            <EducationList items={profile.education} />
          </div>
        </section>
      ) : null}

      {/* Side chat (Cursor-style) — replaces the inline command bar */}
      <SideChat
        profile={profile}
        open={chatOpen}
        onOpenChange={setChatOpen}
        onAction={handleAction}
      />

      {isEditMode && activeAction?.kind === "readme_update" ? (
        <div className="mt-14">
          <ReadmeWriter
            profile={profile}
            onClose={() => setActiveAction(null)}
          />
        </div>
      ) : null}

      {!isEditMode && activeAction ? (
        <div className="mt-14 rounded-lg border border-[var(--accent-soft)]/30 bg-[var(--accent)]/5 p-4 text-sm text-neutral-300">
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
        {isEditMode ? " · Edit mode" : ""}
      </p>
    </>
  );
}

const BULLET_PREFIX_RE = /^[\-*•·●○◦▪▫‣∙]\s*/;
const GENERIC_STANDALONE_ROLES = new Set([
  "analyst",
  "consultant",
  "developer",
  "engineer",
  "engineering",
  "lead",
  "leader",
  "manager",
  "specialist",
]);
const RESUME_LEAD_RE =
  /\b(experienced|proficient|expertise|skilled|led|built|designed|developed|architected|managed|implemented|acknowledged)\b/i;

function cleanResumeText(value: string) {
  const cleaned = value
    .replace(/[—–-]{3,}/g, " ")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, " ")
    .replace(/https?:\/\/\S+|(?:www\.)?(?:linkedin|github)\.com\/\S+/gi, " ")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, " ")
    .replace(/\|+/g, " ")
    .replace(/\b(HIGHLIGHTS?|SKILLS?|TECHNICAL SKILLS|PROGRAMMING LANGUAGES?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s:;.,-]+|[\s:;.,-]+$/g, "");
  const leadIndex = cleaned.search(RESUME_LEAD_RE);
  return leadIndex > 0 ? cleaned.slice(leadIndex).trim() : cleaned;
}

function cleanExperienceValue(value: string | null) {
  return (value ?? "")
    .replace(BULLET_PREFIX_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLowConfidenceExperience(experience: Experience) {
  const role = cleanExperienceValue(experience.role);
  const company = cleanExperienceValue(experience.company);
  const combined = `${role} ${company}`.trim();
  if (!combined) return true;
  if (BULLET_PREFIX_RE.test(experience.role) || BULLET_PREFIX_RE.test(experience.company)) {
    return true;
  }
  if (/^skill set\b/i.test(role) || /^skill set\b/i.test(company)) {
    return true;
  }
  if (
    role.length > 90 &&
    !experience.summary &&
    experience.highlights.length === 0
  ) {
    return true;
  }
  if (
    role.toLowerCase() === "engineering" &&
    !experience.start &&
    !experience.end &&
    !experience.summary &&
    experience.highlights.length === 0
  ) {
    return true;
  }
  if (
    GENERIC_STANDALONE_ROLES.has(role.toLowerCase()) &&
    !experience.start &&
    !experience.end &&
    !experience.summary &&
    experience.highlights.length === 0
  ) {
    return true;
  }
  return false;
}

function getProfessionalExperiences(experiences: Experience[]) {
  return experiences
    .filter((experience) => !isLowConfidenceExperience(experience))
    .map((experience) => ({
      ...experience,
      role: cleanExperienceValue(experience.role),
      company: cleanExperienceValue(experience.company),
      summary: experience.summary ? cleanResumeText(experience.summary) : null,
      highlights: experience.highlights
        .map(cleanResumeText)
        .filter((highlight) => highlight.length > 0),
    }));
}

function CareerSnapshot({ profile }: { profile: Profile }) {
  const resumeConnected = profile.sources.some(
    (source) => source.connector === "resume",
  );
  const hasResumeData =
    profile.resume_file_available ||
    resumeConnected ||
    profile.experiences.length > 0 ||
    profile.education.length > 0;
  if (!hasResumeData) return null;

  const canEmbedResumePdf =
    Boolean(profile.resume_file_available) &&
    (!profile.resume_file_content_type ||
      profile.resume_file_content_type.includes("pdf"));
  const topSkills = profile.skills.slice(0, 8);

  return (
    <section className="mt-12 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(94,234,212,0.12),transparent_55%,rgba(245,158,11,0.08))] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase text-[var(--accent-soft)]">
              Resume-backed profile
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold text-neutral-100 md:text-3xl">
              Read the uploaded resume without leaving this page.
            </h2>
          </div>
          <span className="w-fit rounded-md border border-[var(--accent-soft)]/30 bg-[var(--background)]/70 px-3 py-1 text-xs text-[var(--accent-soft)]">
            {canEmbedResumePdf
              ? "PDF embedded"
              : profile.resume_file_available
                ? "Resume file connected"
                : "Resume inferred"}
          </span>
        </div>
      </div>

      <div className="grid gap-px bg-[var(--border)] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="bg-[var(--background)] p-3 md:p-5">
          {canEmbedResumePdf ? (
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
              <iframe
                title={`${profile.display_name ?? profile.username} resume PDF`}
                src={`${resumeUrl(profile.username)}#toolbar=1&navpanes=0&view=FitH`}
                className="h-[72vh] min-h-[620px] w-full bg-white"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] p-6">
              <p className="text-sm font-medium text-neutral-100">
                {profile.resume_file_available
                  ? "Resume file is connected, but it is not a PDF."
                  : "Resume PDF is not embedded yet."}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Upload a PDF resume from Sources to show a scrollable document
                viewer here. Parsed resume details still feed the experience,
                education, and portfolio chat context.
              </p>
            </div>
          )}
        </div>

        <aside className="bg-[var(--muted)] p-6 md:p-7">
          <div className="grid gap-3">
            <ResumeMetric
              label="Resume file"
              value={
                canEmbedResumePdf
                  ? "PDF"
                  : profile.resume_file_available
                    ? "File"
                    : "Pending"
              }
            />
            {profile.experiences.length > 0 ? (
              <ResumeMetric
                label="Roles"
                value={String(profile.experiences.length)}
              />
            ) : null}
            {profile.education.length > 0 ? (
              <ResumeMetric
                label="Education"
                value={String(profile.education.length)}
              />
            ) : null}
            <ResumeMetric
              label="Contact links"
              value={String(Object.keys(profile.links).length)}
            />
          </div>

          {topSkills.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase text-neutral-500">
                Core skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)]/70 px-3 py-1 text-xs text-neutral-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.education.slice(0, 2).length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase text-neutral-500">
                Education
              </p>
              <div className="mt-3 space-y-3">
                {profile.education.slice(0, 2).map((item, index) => (
                  <div
                    key={`${item.institution}-${index}`}
                    className="border-l border-[var(--accent-warm)]/60 pl-3"
                  >
                    <p className="text-sm font-medium text-neutral-100">
                      {item.institution}
                    </p>
                    {item.degree || item.field ? (
                      <p className="mt-1 text-xs text-neutral-400">
                        {[item.degree, item.field].filter(Boolean).join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function ResumeMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/70 p-4">
      <p className="text-[10px] uppercase text-neutral-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-neutral-100">{value}</p>
    </div>
  );
}
