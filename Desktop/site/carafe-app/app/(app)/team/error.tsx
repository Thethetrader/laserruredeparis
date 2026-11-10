"use client";
export default function TeamError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Impossible de charger la page équipe.</p>
      <button onClick={reset} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
        Réessayer
      </button>
    </div>
  );
}
