"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { useAuth, useUser } from "@clerk/nextjs";

import { ClerkGitHubSignInButton } from "@/components/AuthBadge";
import {
  buildProfile,
  fetchProfile,
  type Profile,
  uploadResume,
} from "@/lib/api";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

function getGitHubUsername(user: ClerkUser | null | undefined) {
  const github = user?.externalAccounts?.find(
    (account) => account.provider === "github",
  );
  return github?.username ?? null;
}

export function PortfolioNavLink({
  className,
  label = "Portfolio",
}: {
  className?: string;
  label?: string;
}) {
  if (!CLERK_ENABLED) {
    return (
      <Link href="/sources" className={className}>
        {label}
      </Link>
    );
  }
  return <PortfolioNavLinkInner className={className} label={label} />;
}

function PortfolioNavLinkInner({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const { isLoaded, user } = useUser();
  const username = getGitHubUsername(user);
  const href = isLoaded && username ? `/${username}` : "/sources";
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function SignedUserSources() {
  if (!CLERK_ENABLED) {
    return (
      <PanelShell
        title="Clerk sign-in is not configured"
        action={<ClerkGitHubSignInButton />}
      >
        <p className="text-sm leading-6 text-neutral-400">
          Add Clerk keys to the web Vercel project and redeploy to show the
          signed user's source connections here.
        </p>
      </PanelShell>
    );
  }
  return <SignedUserSourcesInner />;
}

function SignedUserSourcesInner() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const username = getGitHubUsername(user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadPending, startUploadTransition] = useTransition();
  const [refreshPending, startRefreshTransition] = useTransition();

  useEffect(() => {
    if (!username) {
      setProfile(null);
      setError(null);
      setSuccess(null);
      return;
    }

    let cancelled = false;
    setError(null);
    fetchProfile(username)
      .then((next) => {
        if (!cancelled) setProfile(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setProfile(null);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load signed-user sources",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  function submitResume() {
    if (!username || !resumeFile) return;
    setError(null);
    setSuccess(null);
    startUploadTransition(async () => {
      try {
        const authToken = await getToken();
        const next = await uploadResume(username, {
          file: resumeFile,
          authToken,
        });
        setProfile(next);
        setResumeFile(null);
        setSuccess("Resume uploaded and merged into your portfolio.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Resume upload failed");
      }
    });
  }

  function updatePortfolio() {
    if (!username) return;
    setError(null);
    setSuccess(null);
    startRefreshTransition(async () => {
      try {
        const authToken = await getToken();
        const next = await buildProfile(username, { authToken });
        setProfile(next);
        setSuccess("Portfolio regenerated and saved.");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Portfolio update failed",
        );
      }
    });
  }

  if (!isLoaded) {
    return (
      <PanelShell title="Checking signed-in source connections">
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </PanelShell>
    );
  }

  if (!isSignedIn) {
    return (
      <PanelShell
        title="Sign in to see your connected sources"
        action={
          <ClerkGitHubSignInButton className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)]" />
        }
      >
        <p className="text-sm leading-6 text-neutral-400">
          Clerk GitHub sign-in identifies the owner, then this panel shows which
          sources are connected for that GitHub account.
        </p>
      </PanelShell>
    );
  }

  if (!username) {
    return (
      <PanelShell title="GitHub is not connected to this Clerk user">
        <p className="text-sm leading-6 text-neutral-400">
          Sign in with Clerk's GitHub social connection so the app can match
          you to a GitHub profile and unlock owner sources.
        </p>
      </PanelShell>
    );
  }

  const liveProjects =
    profile?.projects.filter(
      (project) => project.deployment_url || project.homepage,
    ).length ?? 0;
  const resumeConnected = Boolean(
    profile &&
      (profile.resume_summary ||
        profile.experiences.length > 0 ||
        profile.education.length > 0 ||
        profile.sources.some((source) => source.connector === "resume")),
  );
  const sourceCount = profile
    ? profile.sources.length +
      profile.projects.reduce(
        (total, project) => total + project.sources.length,
        0,
      )
    : 0;

  const rows = [
    {
      name: "GitHub profile",
      connected: Boolean(profile),
      detail: profile
        ? `${profile.projects.length} repositories loaded`
        : "Loading public GitHub profile",
    },
    {
      name: "Deployed app links",
      connected: liveProjects > 0,
      detail:
        liveProjects > 0
          ? `${liveProjects} projects expose deployed app URLs`
          : "Add demo URLs to GitHub repo Website fields.",
    },
    {
      name: "Resume",
      connected: resumeConnected,
      detail: resumeConnected
        ? `${profile?.experiences.length ?? 0} roles and ${
            profile?.education.length ?? 0
          } education entries connected`
        : "Upload a resume file here to enrich your profile.",
    },
  ];

  return (
    <PanelShell title={`Source connections for @${username}`}>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <ConnectionRow key={row.name} {...row} />
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-100">
              Upload resume
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              The file is parsed by the API and merged into @{username}'s saved
              portfolio sources when owner auth and KV are configured.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="landing-resume-upload" className="sr-only">
              Resume file
            </label>
            <input
              id="landing-resume-upload"
              type="file"
              accept=".pdf,.docx,.md,.markdown,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
              onChange={(event) =>
                setResumeFile(event.target.files?.[0] ?? null)
              }
              className="max-w-64 text-xs text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[var(--accent-soft)]"
            />
            <button
              type="button"
              onClick={submitResume}
              disabled={uploadPending || !resumeFile}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadPending ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
        {resumeFile ? (
          <p className="mt-2 truncate font-mono text-xs text-[var(--accent-soft)]">
            {resumeFile.name} - {(resumeFile.size / 1024).toFixed(1)} KB
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 text-xs text-emerald-300">{success}</p>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        {profile
          ? `${sourceCount} source records are currently attached to this profile.`
          : "Profile source records are still loading."}
      </p>
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${username}`}
            className="inline-flex rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)]"
          >
            Open portfolio
          </Link>
          <button
            type="button"
            onClick={updatePortfolio}
            disabled={refreshPending}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshPending ? "Updating..." : "Update portfolio"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </PanelShell>
  );
}

function PanelShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ConnectionRow({
  name,
  connected,
  detail,
}: {
  name: string;
  connected: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-100">{name}</p>
        <span
          className={
            "rounded-md px-2 py-0.5 text-[10px] uppercase " +
            (connected
              ? "border border-emerald-700/40 bg-emerald-950/40 text-emerald-300"
              : "border border-[var(--border)] text-neutral-500")
          }
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{detail}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--background)]" />
  );
}
