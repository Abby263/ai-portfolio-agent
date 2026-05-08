"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
  if (!isLoaded) {
    return (
      <span className="h-7 w-7 animate-pulse rounded-full bg-[var(--muted)]" />
    );
  }
  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-7 h-7 rounded-full ring-1 ring-[var(--border)]",
          },
        }}
      />
    );
  }
  return (
    <SignInButton mode="modal" oauthFlow="redirect">
      <button
        type="button"
        className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
      >
        Sign in with GitHub
      </button>
    </SignInButton>
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
    return (
      <a
        href="https://github.com/Abby263/ai-portfolio-agent/blob/main/SETUP.md#clerk-auth"
        target="_blank"
        rel="noreferrer"
        className={fallbackClass}
        title="Clerk auth is not configured on this server"
      >
        Configure Clerk
      </a>
    );
  }
  return <PublicInner className={className} />;
}

function PublicInner({ className }: { className?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return (
    <SignInButton mode="modal" oauthFlow="redirect">
      <button
        type="button"
        className={
          className ??
          "rounded-md border border-[var(--accent-soft)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs text-[var(--accent-soft)] transition hover:bg-[var(--accent)]/20"
        }
      >
        Sign in with GitHub
      </button>
    </SignInButton>
  );
}
