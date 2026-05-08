"use client";

import { useState } from "react";

import { UserButton, useAuth, useClerk, useUser } from "@clerk/nextjs";

const ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const SIGN_IN_LABEL = "Sign in with GitHub";

export function AuthBadge() {
  if (!ENABLED) {
    return (
      <span
        title="Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to the web project to enable GitHub sign-in"
        className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-neutral-500"
      >
        Auth not configured
      </span>
    );
  }
  return <Inner />;
}

function Inner() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  if (!isLoaded) {
    return (
      <span className="h-7 w-7 animate-pulse rounded-full bg-[var(--muted)]" />
    );
  }
  if (isSignedIn) {
    const github = user?.externalAccounts?.find(
      (account) => account.provider === "github",
    );
    const label = github?.username ? `@${github.username}` : "Signed in";
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 py-1">
        <span className="max-w-28 truncate text-xs text-neutral-300">
          {label}
        </span>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-6 h-6 rounded-full ring-1 ring-[var(--border)]",
            },
          }}
        />
      </div>
    );
  }
  return <ClerkGitHubSignInButton />;
}

export function ClerkGitHubSignInButton({
  className,
}: {
  className?: string;
}) {
  if (!ENABLED) {
    return (
      <a
        href="https://github.com/Abby263/ai-portfolio-agent/blob/main/SETUP.md#clerk-auth"
        target="_blank"
        rel="noreferrer"
        className={
          className ??
          "rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-neutral-500"
        }
      >
        Configure Clerk
      </a>
    );
  }
  return <GitHubOAuthButton className={className} />;
}

function GitHubOAuthButton({ className }: { className?: string }) {
  const clerk = useClerk();
  const signIn = clerk.client?.signIn;
  const [error, setError] = useState<string | null>(null);

  async function startGitHubSignIn() {
    if (!signIn) return;
    setError(null);
    const currentPath =
      window.location.pathname === "/sso-callback"
        ? "/"
        : `${window.location.pathname}${window.location.search}`;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: currentPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub sign-in failed");
    }
  }

  return (
    <button
      type="button"
      onClick={startGitHubSignIn}
      disabled={!signIn}
      title={error ?? SIGN_IN_LABEL}
      className={
        className ??
        "rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {SIGN_IN_LABEL}
    </button>
  );
}

export function PublicSignInLink({
  className,
}: {
  username?: string;
  className?: string;
}) {
  const fallbackClass =
    className ??
    "rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]";

  if (!ENABLED) {
    return <ClerkGitHubSignInButton className={fallbackClass} />;
  }
  return <PublicInner className={className} />;
}

function PublicInner({ className }: { className?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <ClerkGitHubSignInButton className={className} />;
}
