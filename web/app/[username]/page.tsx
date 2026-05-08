import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchProfile } from "@/lib/api";

import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-xs text-neutral-500 transition hover:text-[var(--accent-soft)]"
      >
        ← back
      </Link>
      <ProfileView initial={profile} />
    </main>
  );
}
