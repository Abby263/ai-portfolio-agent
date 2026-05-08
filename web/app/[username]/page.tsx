import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthBadge } from "@/components/AuthBadge";
import { fetchProfile } from "@/lib/api";
import { CLERK_ENABLED, getSignedInGitHubUsername } from "@/lib/auth";

import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

const CLERK_PUBLISHABLE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const CLERK_SERVER_CONFIGURED = Boolean(process.env.CLERK_SECRET_KEY);

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username } = await params;
  const search = await searchParams;
  const profile = await fetchProfile(username);
  if (!profile) notFound();

  // Real ownership: signed-in user's GitHub login matches the URL.
  // Fallback ?edit=1 escape hatch only when Clerk isn't configured at all.
  const owner = await getSignedInGitHubUsername();
  const isOwner =
    owner !== null && owner === username.toLowerCase();
  const fallbackEdit = !CLERK_ENABLED && search?.edit === "1";
  const isEditMode = isOwner || fallbackEdit;

  return (
    <>
      {/* Top credits bar — visible across the full viewport */}
      <div className="border-b border-[var(--border)]/60 bg-[var(--muted)]/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-xs text-neutral-400">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-soft)]"
            />
            Built with{" "}
            <Link
              href="/"
              className="font-medium text-[var(--accent-soft)] underline-offset-2 hover:underline"
            >
              AI Developer Portfolio Manager Agent
            </Link>
            <span className="hidden sm:inline">
              {" "}— create your own from your connected GitHub profile
            </span>
          </span>
          <span className="flex items-center gap-2 text-neutral-500">
            Credits:
            <a
              href="https://github.com/Abby263"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-200 underline-offset-2 hover:text-[var(--accent-soft)] hover:underline"
            >
              Abhay
            </a>
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10 md:py-12">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-neutral-500 transition hover:text-[var(--accent-soft)]"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            AI Developer Portfolio Manager Agent
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-600">
              /{profile.username}
            </span>
            <AuthBadge />
          </div>
        </header>

        <ProfileView
          initial={profile}
          isEditMode={isEditMode}
          authState={{
            clerkReady: CLERK_ENABLED,
            publishableConfigured: CLERK_PUBLISHABLE_CONFIGURED,
            serverConfigured: CLERK_SERVER_CONFIGURED,
            signedInGitHubUsername: owner,
          }}
        />
      </main>
    </>
  );
}
