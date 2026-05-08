import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">User not found</h1>
      <p className="mt-3 text-neutral-400">
        We couldn&apos;t find a GitHub user with that username.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)]"
      >
        Try another
      </Link>
    </main>
  );
}
