"use client";

export default function AppPreviewSection() {
  return (
    <section className="py-12 flex flex-col items-center md:hidden" style={{ background: "var(--background)" }}>
      <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
        L&apos;app
      </p>
      <h2
        className="font-semibold text-center mb-10 px-6"
        style={{ fontSize: "clamp(22px, 6vw, 30px)", letterSpacing: "-0.03em", color: "var(--foreground)" }}
      >
        Votre équipe dans la poche.
      </h2>

      {/* iPhone frame */}
      <div
        style={{
          position: "relative",
          width: 260,
          height: 534,
          borderRadius: 36,
          background: "#111",
          boxShadow: "0 0 0 2px #333, 0 0 0 4px #1a1a1a, 0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(6,182,212,0.08)",
          padding: 6,
          flexShrink: 0,
        }}
      >
        {/* Notch */}
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 80, height: 22, background: "#111", borderRadius: 99, zIndex: 10 }} />

        {/* Screen */}
        <div style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden" }}>
          <iframe
            src="/app-preview"
            style={{ width: "390px", height: "844px", border: "none", transformOrigin: "top left", transform: "scale(0.635)", display: "block" }}
            scrolling="no"
            title="Aperçu Karaf"
          />
        </div>
      </div>
    </section>
  );
}
