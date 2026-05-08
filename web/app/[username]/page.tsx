import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchProfile } from "@/lib/api";

import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

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

  // Edit mode: temporary URL-param escape hatch until Clerk auth lands.
  // The ProfileView only renders edit affordances when this is true.
  const isEditMode = search?.edit === "1";

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
        <span className="text-xs text-neutral-600">
          /{profile.username}
        </span>
      </header>

      <ProfileView initial={profile} isEditMode={isEditMode} />
    </main>
  );
}
