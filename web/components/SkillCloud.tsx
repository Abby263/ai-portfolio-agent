export function SkillCloud({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <span
          key={s}
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-neutral-300"
        >
          {s}
        </span>
      ))}
    </div>
  );
}
