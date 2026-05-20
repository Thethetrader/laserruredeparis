"use client";

import { useState, useRef } from "react";

interface KudosButtonProps {
  toProfileId: string;
  toName: string;
  contextType?: string;
  contextId?: string;
  onSent?: () => void;
  variant?: "icon" | "full";
}

export function KudosButton({ toName, variant = "icon", onSent }: KudosButtonProps) {
  const [sent, setSent] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (sent) return;

    // Particle burst
    const newParticles = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      x: -12 + i * 8,
      y: 0,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 600);

    setSent(true);
    onSent?.();
    setTimeout(() => setSent(false), 3000);
  };

  if (variant === "full") {
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[11px] font-medium transition-all"
        style={{
          background: sent ? "rgba(6,182,212,0.12)" : "var(--background-elev)",
          border: sent ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)",
          color: sent ? "var(--accent)" : "var(--foreground-muted)",
          cursor: sent ? "default" : "pointer",
        }}
        title={`Féliciter ${toName}`}
      >
        <span style={{ fontSize: 13 }}>✦</span>
        {sent ? "Envoyé" : "Féliciter"}
        <Particles particles={particles} />
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="relative flex items-center justify-center transition-all"
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: sent ? "rgba(6,182,212,0.12)" : "transparent",
        border: sent ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border-soft)",
        color: sent ? "var(--accent)" : "var(--foreground-dim)",
        cursor: sent ? "default" : "pointer",
      }}
      title={`Féliciter ${toName}`}
    >
      <span style={{ fontSize: 11 }}>✦</span>
      <Particles particles={particles} />
    </button>
  );
}

function Particles({ particles }: { particles: { id: number; x: number; y: number }[] }) {
  return (
    <>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "var(--accent)",
            left: `calc(50% + ${p.x}px)`,
            top: "50%",
            animation: "kudos-particle 0.5s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
