"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import InstallPWAButton from "@/components/landing/InstallPWAButton";

function GridBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current || !spotlightRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotlightRef.current.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(15,81,50,0.07), transparent 70%)`;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(26,26,24,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,24,0.06) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      <div ref={spotlightRef} className="absolute inset-0" />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <GridBackground />

      <div className="relative z-10 w-full mx-auto px-6 md:px-12 lg:px-20 pt-24 pb-20" style={{ maxWidth: 1240 }}>
        {/* Eyebrow */}
        <div className="mb-8">
          <span
            className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.16em] px-3 py-1.5 rounded"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
          >
            [ COMMUNICATION PRO · RESTAURATION ]
          </span>
        </div>

        {/* H1 staircase */}
        <div className="mb-10">
          <h1
            className="font-semibold leading-none"
            style={{ fontSize: "clamp(44px, 8vw, 80px)", letterSpacing: "-0.05em", color: "var(--foreground)" }}
          >
            Tout coule.
          </h1>
          <h1
            className="font-semibold leading-none"
            style={{
              fontSize: "clamp(44px, 8vw, 80px)",
              letterSpacing: "-0.05em",
              color: "var(--foreground-muted)",
              marginLeft: "clamp(24px, 5vw, 72px)",
            }}
          >
            Rien ne se perd<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
        </div>

        {/* Below */}
        <div className="max-w-[480px]">
          <div className="w-10 h-px mb-6" style={{ background: "var(--accent)" }} />
          <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--foreground-muted)" }}>
            Karaf remplace votre groupe WhatsApp par un vrai outil de management.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <a
              href="/signup"
              className="btn-shine inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl text-sm group active:scale-[0.98] transition-transform duration-100"
              style={{ background: "var(--accent)", color: "#fafaf7" }}
            >
              Commencer
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-sm px-6 py-3.5 rounded-xl font-medium transition-colors duration-150 active:scale-[0.98]"
              style={{ color: "var(--foreground)", border: "1.5px solid var(--border)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--foreground-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              Se connecter →
            </a>
            <InstallPWAButton
              label="Télécharger l'app"
              showIcon
              className="inline-flex items-center justify-center gap-2 font-medium text-sm px-6 py-3.5 rounded-xl active:scale-[0.98] transition-all duration-100"
              style={{ color: "var(--foreground-muted)", border: "1.5px solid var(--border-soft)", background: "var(--background-soft)" }}
            />
          </div>

          <p className="font-mono text-xs" style={{ color: "var(--foreground-dim)" }}>
            Dès 29€/mois · Accès immédiat · Sans engagement
          </p>
        </div>
      </div>
    </section>
  );
}
