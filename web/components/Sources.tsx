"use client";

import { useState, useTransition } from "react";

import { useAuth } from "@clerk/nextjs";

import { buildProfile, type Profile } from "@/lib/api";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type Row = "resume" | "vercel" | null;
type GetToken = () => Promise<string | null>;

export function Sources({
  profile,
  onUpdate,
}: {
  profile: Profile;
  onUpdate: (p: Profile) => void;
}) {
  // useAuth() is only safe when ClerkProvider is in the tree, so split
  // the component on Clerk-enabled. The Inner version takes a getToken
  // function and stays free of Clerk hooks otherwise.
  if (CLERK_ENABLED) {
    return <SourcesAuthed profile={profile} onUpdate={onUpdate} />;
  }
  return (
    <SourcesInner
      profile={profile}
      onUpdate={onUpdate}
      getToken={async () => null}
    />
  );
}

function SourcesAuthed(props: {
  profile: Profile;
  onUpdate: (p: Profile) => void;
}) {
  const { getToken } = useAuth();
  return <SourcesInner {...props} getToken={() => getToken()} />;
}

function SourcesInner({
  profile,
  onUpdate,
  getToken,
}: {
  profile: Profile;
  onUpdate: (p: Profile) => void;
  getToken: GetToken;
}) {
  const [resumeText, setResumeText] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [openRow, setOpenRow] = useState<Row>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resumeConnected =
    profile.experiences.length > 0 || profile.resume_summary !== null;
  const deployedProjects = profile.projects.filter(
    (p) => p.deployment_url !== null,
  );
  const vercelConnected = deployedProjects.length > 0;

  function rebuild() {
    setError(null);
    startTransition(async () => {
      try {
        const authToken = await getToken();
        const next = await buildProfile(profile.username, {
          resumeText: resumeText.trim() || null,
          vercelToken: vercelToken.trim() || null,
          authToken,
        });
        onUpdate(next);
        setOpenRow(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update profile");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium text-neutral-100">
            Build with your sources
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Connect more — the agents merge everything into one living profile.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          Sources
        </span>
      </header>

      <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--background)]">
        <Row
          name="GitHub"
          detail={`@${profile.username} · ${profile.projects.length} repos`}
          connected
        />

        <Row
          name="Resume"
          detail={
            resumeConnected
              ? `${profile.experiences.length} experiences · ${profile.education.length} education entries`
              : "Paste a resume — extract experience, education, and skills."
          }
          connected={resumeConnected}
          open={openRow === "resume"}
          actionLabel={resumeConnected ? "Update resume" : "Add resume"}
          onToggle={() =>
            setOpenRow(openRow === "resume" ? null : "resume")
          }
        >
          <ResumeForm
            text={resumeText}
            setText={setResumeText}
            pending={pending}
            onSubmit={rebuild}
          />
        </Row>

        <Row
          name="Vercel"
          detail={
            vercelConnected
              ? `${deployedProjects.length} deployments matched to repos`
              : "Connect to surface live demo URLs on each project."
          }
          connected={vercelConnected}
          open={openRow === "vercel"}
          actionLabel={vercelConnected ? "Update token" : "Connect Vercel"}
          onToggle={() =>
            setOpenRow(openRow === "vercel" ? null : "vercel")
          }
        >
          <VercelForm
            token={vercelToken}
            setToken={setVercelToken}
            pending={pending}
            onSubmit={rebuild}
          />
        </Row>
      </div>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </section>
  );
}

function Row({
  name,
  detail,
  connected,
  open,
  actionLabel,
  onToggle,
  children,
}: {
  name: string;
  detail: string;
  connected: boolean;
  open?: boolean;
  actionLabel?: string;
  onToggle?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Dot connected={connected} />
          <div>
            <div className="text-sm font-medium text-neutral-100">{name}</div>
            <div className="text-xs text-neutral-500">{detail}</div>
          </div>
        </div>
        {onToggle ? (
          <button
            onClick={onToggle}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
          >
            {open ? "Cancel" : actionLabel}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-emerald-400">
            Connected
          </span>
        )}
      </div>
      {open && children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function Dot({ connected }: { connected: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "h-2 w-2 rounded-full " +
        (connected
          ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
          : "bg-neutral-600")
      }
    />
  );
}

function ResumeForm({
  text,
  setText,
  pending,
  onSubmit,
}: {
  text: string;
  setText: (v: string) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <>
      <p className="mb-2 text-xs text-neutral-500">
        Plain text or markdown. Stays in this browser session — sent to the API
        once and not stored.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder={
          "Summary\nSenior software engineer …\n\nSkills\nPython, Go, React\n\nExperience\nStripe — Staff Engineer\n- Led …"
        }
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-[var(--accent-soft)]"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={pending || text.trim().length < 30}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Parsing…" : "Apply resume"}
        </button>
      </div>
    </>
  );
}

function VercelForm({
  token,
  setToken,
  pending,
  onSubmit,
}: {
  token: string;
  setToken: (v: string) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <>
      <p className="mb-2 text-xs text-neutral-500">
        Create a token at{" "}
        <a
          href="https://vercel.com/account/tokens"
          target="_blank"
          rel="noreferrer"
          className="underline transition hover:text-[var(--accent-soft)]"
        >
          vercel.com/account/tokens
        </a>
        . The token is sent to the API once and not persisted.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="vercel_xxxxxxxxxxxxxxxxxxxxxxxx"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-[var(--accent-soft)]"
        />
        <button
          onClick={onSubmit}
          disabled={pending || token.trim().length < 12}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Connecting…" : "Connect"}
        </button>
      </div>
    </>
  );
}
