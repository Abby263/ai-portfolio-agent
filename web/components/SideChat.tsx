"use client";

import { useEffect } from "react";

import { CommandBar } from "@/components/CommandBar";
import type { Profile, SuggestedAction } from "@/lib/api";

export function SideChat({
  profile,
  open,
  onOpenChange,
  onAction,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (a: SuggestedAction) => void;
}) {
  // Close on Esc; lock body scroll when open on mobile
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  return (
    <>
      {/* Floating launcher (visible when chat is closed) */}
      {!open ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 rounded-full border border-[var(--accent-soft)]/40 bg-[var(--muted)] px-4 py-3 text-sm font-medium text-neutral-100 shadow-2xl shadow-black/40 transition hover:border-[var(--accent-soft)] hover:bg-[var(--background)]"
          aria-label={`Chat with ${profile.display_name ?? profile.username}'s portfolio`}
        >
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-soft)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-soft)]" />
          </span>
          <span className="hidden sm:inline">
            Chat with @{profile.username}
          </span>
          <span className="sm:hidden">Chat</span>
        </button>
      ) : null}

      {/* Backdrop (mobile only) */}
      {open ? (
        <div
          aria-hidden
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      ) : null}

      {/* Right-side panel — Cursor-style chat dock */}
      <aside
        aria-hidden={!open}
        aria-label="Portfolio chat"
        className={
          "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--muted)]/95 shadow-2xl shadow-black/50 backdrop-blur-md transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "translate-x-full pointer-events-none")
        }
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--accent-soft)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--accent-soft)]" />
              Portfolio chat
            </div>
            <h2 className="mt-1 truncate text-sm font-medium text-neutral-100">
              Ask about {profile.display_name ?? profile.username}'s work
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
              Grounded in projects, story, skills, and experience on this page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-md border border-[var(--border)] p-1.5 text-neutral-400 transition hover:border-[var(--accent-soft)]/60 hover:text-neutral-100"
            aria-label="Close chat"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden
            >
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <CommandBar profile={profile} onAction={onAction} />
        </div>

        <footer className="border-t border-[var(--border)]/60 px-5 py-3 text-[11px] text-neutral-500">
          Press{" "}
          <kbd className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
            Esc
          </kbd>{" "}
          to close · Replies are read-only suggestions
        </footer>
      </aside>
    </>
  );
}
