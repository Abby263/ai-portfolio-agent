"use client";

import { useState, useTransition } from "react";

import { buildProfile, type Profile } from "@/lib/api";

export function ResumeEnhancer({
  initial,
  onUpdate,
}: {
  initial: Profile;
  onUpdate: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasResume = initial.resume_summary !== null || initial.experiences.length > 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const next = await buildProfile(initial.username, text);
        onUpdate(next);
        setOpen(false);
        setText("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to enrich profile");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
      >
        {hasResume ? "Update resume" : "+ Add resume"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-200">
          Paste your resume
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          cancel
        </button>
      </div>
      <p className="mb-3 text-xs text-neutral-500">
        Plain text or markdown. The agent will extract skills, experience, and
        education and merge them into your profile.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={"Summary\nSenior software engineer ...\n\nSkills\nPython, Go, React\n\nExperience\nStripe — Staff Engineer\n- Led ..."}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-[var(--accent-soft)]"
      />
      {error ? (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={submit}
          disabled={pending || text.trim().length < 50}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Parsing…" : "Enrich profile"}
        </button>
      </div>
    </div>
  );
}
