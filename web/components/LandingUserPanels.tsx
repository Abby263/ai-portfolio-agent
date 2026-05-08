"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useUser } from "@clerk/nextjs";

import { ClerkGitHubSignInButton } from "@/components/AuthBadge";
import { fetchProfile, type Profile } from "@/lib/api";

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
}: {
  className?: string;
}) {
  if (!CLERK_ENABLED) {
    return (
      <a href="#portfolio" className={className}>
        Portfolio
      </a>
    );
  }
  return <PortfolioNavLinkInner className={className} />;
}

function PortfolioNavLinkInner({ className }: { className?: string }) {
  const { isLoaded, user } = useUser();
  const username = getGitHubUsername(user);
  const href = isLoaded && username ? `/${username}` : "#portfolio";
  return (
    <Link href={href} className={className}>
      Portfolio
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
  const { isLoaded, isSignedIn, user } = useUser();
  const username = getGitHubUsername(user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setProfile(null);
      setError(null);
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
    profile?.projects.filter((project) => project.deployment_url).length ?? 0;
  const resumeConnected = Boolean(
    profile &&
      (profile.resume_summary ||
        profile.experiences.length > 0 ||
        profile.education.length > 0 ||
        profile.sources.some((source) => source.connector === "resume")),
  );
  const sourceCount = profile
    ? profile.sources.length +
      profile.projects.reduce((total, project) => total + project.sources.length, 0)
    : 0;

  const rows = [
    {
      name: "Clerk GitHub auth",
      connected: true,
      detail: `Signed in as @${username}`,
    },
    {
      name: "GitHub profile",
      connected: Boolean(profile),
      detail: profile
        ? `${profile.projects.length} repositories loaded`
        : "Loading public GitHub profile",
    },
    {
      name: "Resume",
      connected: resumeConnected,
      detail: resumeConnected
        ? `${profile?.experiences.length ?? 0} roles and ${
            profile?.education.length ?? 0
          } education entries connected`
        : "Not connected yet. Add it from your portfolio owner tools.",
    },
    {
      name: "Vercel deployments",
      connected: liveProjects > 0,
      detail:
        liveProjects > 0
          ? `${liveProjects} projects have live deployment URLs`
          : "Not connected yet. Add a Vercel token from your portfolio owner tools.",
    },
  ];

  return (
    <PanelShell
      title={`Source connections for @${username}`}
      action={
        <Link
          href={`/${username}`}
          className="rounded-md border border-[var(--accent-soft)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs text-[var(--accent-soft)] transition hover:bg-[var(--accent)]/20"
        >
          Open portfolio
        </Link>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <ConnectionRow key={row.name} {...row} />
        ))}
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        {profile
          ? `${sourceCount} source records are currently attached to this profile.`
          : "Profile source records are still loading."}
      </p>
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </PanelShell>
  );
}

export function SignedUserPortfolioPanel() {
  if (!CLERK_ENABLED) {
    return (
      <PanelShell
        title="Portfolio opens after Clerk is configured"
        action={<ClerkGitHubSignInButton />}
      >
        <p className="text-sm leading-6 text-neutral-400">
          The Portfolio link uses the signed-in GitHub account. Configure Clerk
          on the web project, redeploy, then sign in.
        </p>
      </PanelShell>
    );
  }
  return <SignedUserPortfolioPanelInner />;
}

function SignedUserPortfolioPanelInner() {
  const { isLoaded, isSignedIn, user } = useUser();
  const username = getGitHubUsername(user);

  if (!isLoaded) {
    return (
      <PanelShell title="Checking signed-in portfolio">
        <SkeletonRow />
      </PanelShell>
    );
  }

  if (!isSignedIn) {
    return (
      <PanelShell
        title="Open your portfolio"
        action={
          <ClerkGitHubSignInButton className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)]" />
        }
      >
        <p className="text-sm leading-6 text-neutral-400">
          Sign in with GitHub and the Portfolio link will open the public page
          for that GitHub username.
        </p>
      </PanelShell>
    );
  }

  if (!username) {
    return (
      <PanelShell title="No GitHub username found">
        <p className="text-sm leading-6 text-neutral-400">
          This Clerk user is signed in, but no GitHub social account is attached.
          Use GitHub sign-in to open the matching portfolio page.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title={`Portfolio for @${username}`}
      action={
        <Link
          href={`/${username}`}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)]"
        >
          Open portfolio
        </Link>
      }
    >
      <p className="text-sm leading-6 text-neutral-400">
        This opens the public portfolio page for the GitHub user signed in
        through Clerk. Owner tools unlock on that page when the signed-in GitHub
        username matches the URL.
      </p>
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
