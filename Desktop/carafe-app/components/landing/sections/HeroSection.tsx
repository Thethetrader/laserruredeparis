"use client";

import { ArrowRight } from "lucide-react";
import HeroMockup from "@/components/landing/hero/HeroMockup";
import { useEffect, useRef } from "react";

function GridBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current || !spotlightRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotlightRef.current.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(6,182,212,0.07), transparent 70%)`;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(250,250,250,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.015) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      <div ref={spotlightRef} className="absolute inset-0" />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
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

        {/* Below: asymmetric 2-col */}
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-16 items-center">
          {/* Left */}
          <div>
            <div className="w-10 h-px mb-6" style={{ background: "var(--accent)" }} />
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--foreground-muted)", maxWidth: "46ch" }}>
              Karaf remplace votre groupe WhatsApp pro par un vrai outil de management. Vous postez une fois, ça reste vu. Vous voyez{" "}
              <span style={{ color: "var(--accent)" }}>qui bosse bien</span>,
              vous le valorisez en un clic. Vos meilleurs restent.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
              <a
                href="/login"
                className="btn-shine inline-flex items-center gap-2 font-medium px-6 py-3.5 rounded-md text-sm group active:scale-[0.98] transition-transform duration-100"
                style={{ background: "var(--accent)", color: "#09090B", borderRadius: 6 }}
              >
                Se connecter
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-sm px-5 py-3.5 rounded-lg transition-colors duration-150"
                style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--foreground-dim)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                Voir comment ça marche
                <span className="arrow-pulse inline-block">↓</span>
              </a>
            </div>

            <p className="font-mono text-xs" style={{ color: "var(--foreground-dim)" }}>
              14 jours gratuits · Sans CB · 5 min pour démarrer
            </p>
          </div>

          {/* Right: mockup */}
          <div className="hidden lg:flex items-center justify-end -mt-8">
            <HeroMockup />
          </div>
        </div>

        {/* Mobile mockup */}
        <div className="lg:hidden mt-14 flex justify-center">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
