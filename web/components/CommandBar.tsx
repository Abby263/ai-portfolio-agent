"use client";

import { useState, useTransition } from "react";

import {
  runCommand,
  type CommandResponse,
  type Profile,
  type SuggestedAction,
} from "@/lib/api";

type Turn = {
  command: string;
  response: CommandResponse;
};

const SUGGESTED_PROMPTS = [
  "What are my strongest projects?",
  "Summarize my resume experience",
  "What tech stack do I use most?",
  "Update READMEs across my repos",
];

export function CommandBar({
  profile,
  onAction,
}: {
  profile: Profile;
  onAction?: (action: SuggestedAction) => void;
}) {
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await runCommand(profile.username, trimmed, profile);
        setTurns((prev) => [{ command: trimmed, response }, ...prev].slice(0, 5));
        setText("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Command failed");
      }
    });
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        Ask my portfolio
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about projects, resume, tech stack, or work history..."
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-[var(--accent-soft)]"
        />
        <button
          type="submit"
          disabled={pending || text.trim().length === 0}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "..." : "Ask"}
        </button>
      </form>

      {turns.length === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => submit(p)}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-neutral-400 transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)]"
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      ) : null}

      {turns.length > 0 ? (
        <div className="mt-4 space-y-4">
          {turns.map((turn, i) => (
            <Turn key={i} turn={turn} onAction={onAction} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Turn({
  turn,
  onAction,
}: {
  turn: Turn;
  onAction?: (a: SuggestedAction) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-xs text-neutral-500">› {turn.command}</p>
      <p className="mt-2 whitespace-pre-line text-sm text-neutral-200">
        {turn.response.answer}
      </p>
      {turn.response.suggested_actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {turn.response.suggested_actions.map((a, i) => (
            <ActionPill key={i} action={a} onClick={onAction} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionPill({
  action,
  onClick,
}: {
  action: SuggestedAction;
  onClick?: (a: SuggestedAction) => void;
}) {
  const handlerClass = onClick
    ? "cursor-pointer hover:bg-[var(--accent)]/20"
    : "cursor-default";
  return (
    <button
      type="button"
      title={action.description}
      onClick={() => onClick?.(action)}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-soft)]/40 bg-[var(--accent)]/10 px-2.5 py-1 text-xs text-[var(--accent-soft)] transition ${handlerClass}`}
    >
      <span className="h-1 w-1 rounded-full bg-[var(--accent-soft)]" />
      {action.label}
    </button>
  );
}
