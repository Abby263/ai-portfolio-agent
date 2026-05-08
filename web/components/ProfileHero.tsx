"use client";

import { useEffect, useRef, useState } from "react";

import { resumeUrl, type Profile } from "@/lib/api";

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
  const [copiedEmail, setCopiedEmail] = useState(false);
  const copyResetRef = useRef<number | null>(null);
  const liveProjects = profile.projects.filter(
    (project) => project.deployment_url || project.homepage,
  ).length;
  const featuredProjects = profile.projects.filter((project) => project.pinned)
    .length;
  const email = profile.links.email;
  const hasResume = Boolean(profile.resume_file_available);
  const visibleLinks = Object.entries(profile.links).filter(
    ([key]) => key !== "email",
  );

  useEffect(() => {
    return () => {
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopiedEmail(false);
        copyResetRef.current = null;
      }, 1800);
    } catch {
      setCopiedEmail(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[linear-gradient(135deg,var(--muted),var(--background)_62%,rgba(245,158,11,0.12))]">
      <div className="grid gap-px bg-[var(--border)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-[var(--background)]/80 p-6 md:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                className="h-28 w-28 rounded-full border border-[var(--border)] object-cover shadow-xl shadow-black/30"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                @{profile.username}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                {profile.display_name ?? profile.username}
              </h1>
              {profile.headline ? (
                <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
                  {profile.headline}
                </p>
              ) : null}
              {profile.location ? (
                <p className="mt-3 text-sm text-neutral-500">
                  {profile.location}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <Metric label="Pinned repos" value={featuredProjects} />
            <Metric label="Live apps" value={liveProjects} accent />
            <Metric label="Skills" value={profile.skills.length} />
          </div>

          {profile.tagline ? (
            <p className="mt-8 text-balance text-2xl font-medium leading-snug text-[var(--accent-soft)] md:text-3xl">
              {profile.tagline}
            </p>
          ) : null}
        </div>

        <aside className="bg-[var(--muted)] p-6 md:p-8">
          <p className="text-xs uppercase text-neutral-500">
            Contact
          </p>
          <div className="mt-5 space-y-3">
            {email ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/70 p-3">
                <p className="text-[10px] uppercase text-neutral-500">
                  Email
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-neutral-100">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="shrink-0 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
                  >
                    {copiedEmail ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : null}

            {visibleLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleLinks.map(([k, v]) => (
                  <a
                    key={k}
                    href={linkHref(k, v)}
                    target={k === "phone" ? undefined : "_blank"}
                    rel={k === "phone" ? undefined : "noreferrer"}
                    title={v}
                    className="rounded-md border border-[var(--border)] bg-[var(--background)]/70 px-2.5 py-1 text-xs text-neutral-200 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
                  >
                    {linkLabel(k, v)}
                  </a>
                ))}
                {hasResume ? (
                  <a
                    href={resumeUrl(profile.username)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-[var(--accent-soft)]/40 bg-[var(--accent)]/15 px-2.5 py-1 text-xs text-[var(--accent-soft)] transition hover:border-[var(--accent-soft)] hover:bg-[var(--accent)]/25"
                  >
                    View resume
                  </a>
                ) : null}
              </div>
            ) : hasResume ? (
              <a
                href={resumeUrl(profile.username)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md border border-[var(--accent-soft)]/40 bg-[var(--accent)]/15 px-2.5 py-1 text-xs text-[var(--accent-soft)] transition hover:border-[var(--accent-soft)] hover:bg-[var(--accent)]/25"
              >
                View resume
              </a>
            ) : null}
          </div>

          {profile.themes.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase text-neutral-500">
                Focus areas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.themes.slice(0, 5).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)]/70 px-3 py-1 text-xs text-neutral-300"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/70 p-4">
      <p className="text-[10px] uppercase text-neutral-500">{label}</p>
      <p
        className={
          "mt-1 font-mono text-2xl font-semibold " +
          (accent ? "text-[var(--accent-soft)]" : "text-neutral-100")
        }
      >
        {value}
      </p>
    </div>
  );
}
