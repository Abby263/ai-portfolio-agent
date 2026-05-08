import Link from "next/link";
import { redirect } from "next/navigation";

async function goToProfile(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim();
  if (!username) return;
  redirect(`/${encodeURIComponent(username)}`);
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-[var(--accent-soft)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        AI-powered developer portfolio
      </div>
      <h1 className="text-balance text-center text-5xl font-semibold tracking-tight md:text-6xl">
        A living portfolio that{" "}
        <span className="text-[var(--accent-soft)]">tells your story</span>
      </h1>
      <p className="mt-5 max-w-xl text-center text-base text-neutral-400 md:text-lg">
        Connect GitHub, Vercel, your resume and more — let agents assemble the
        portfolio, narrate your journey, and keep it up to date.
      </p>

      <form
        action={goToProfile}
        className="mt-10 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 shadow-lg shadow-black/20"
      >
        <input
          name="username"
          required
          autoFocus
          autoComplete="off"
          placeholder="GitHub username, e.g. torvalds"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)]"
        >
          Build portfolio
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
        Try
        {["torvalds", "gaearon", "tj"].map((u) => (
          <Link
            key={u}
            href={`/${u}`}
            className="rounded-md border border-[var(--border)] px-2 py-1 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
          >
            @{u}
          </Link>
        ))}
      </div>
    </main>
  );
}
