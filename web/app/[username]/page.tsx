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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-500 transition hover:text-[var(--accent-soft)]"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          ai-portfolio-agent
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600">
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
  );
}
