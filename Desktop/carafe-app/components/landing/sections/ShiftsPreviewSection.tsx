"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Euro, TrendingUp, Check, BarChart2 } from "lucide-react";

const DAYS = ["L","M","M","J","V","S","D"];

const SHIFTS = [
  { day: 1, h: "8h45", t: "32€", done: true },
  { day: 2, h: "9h00", t: "18€", done: true },
  { day: 4, h: "8h30", t: "45€", done: true },
  { day: 5, h: "9h15", t: "27€", done: true },
  { day: 8, h: "8h45", t: "38€", done: true },
  { day: 9, h: "9h00", t: "22€", done: true },
  { day: 11, h: "8h30", t: "51€", done: true },
  { day: 12, h: "9h15", t: "19€", done: true },
  { day: 15, h: "8h45", t: "43€", done: true },
  { day: 16, h: "9h00", t: "35€", done: false },
  { day: 18, h: "8h30", t: "0€", done: false },
  { day: 19, h: "9h15", t: "0€", done: false },
];

const TIPS_DATA = [32,0,18,0,45,27,0,38,22,0,51,19,0,43,35,0,0,28,0,41,0,0,0,0,0,0,0,0,0,0];

function CalendarMockup({ visible }: { visible: boolean }) {
  const shiftMap = new Map(SHIFTS.map(s => [s.day, s]));
  const offset = 2; // June 1 = Tuesday = offset 1 (Mon=0)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...days];

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s", position: "absolute", inset: 0, overflowY: "auto", scrollbarWidth: "none" }}>
      <div style={{ padding: "10px 10px 0" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
          {[
            { label: "Heures", value: "78h30", accent: false },
            { label: "Tips", value: "432€", accent: true },
            { label: "Services", value: "12", accent: false },
          ].map(s => (
            <div key={s.label} style={{ background: s.accent ? "rgba(6,182,212,0.1)" : "#111113", border: `1px solid ${s.accent ? "rgba(6,182,212,0.25)" : "#27272a"}`, borderRadius: 8, padding: "5px 6px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: s.accent ? "#06b6d4" : "#e4e4e7" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 8, color: "#71717a" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 7, color: "#52525b", paddingBottom: 2, fontWeight: 600 }}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} style={{ height: 28 }} />;
            const s = shiftMap.get(day);
            return (
              <div key={day} style={{ height: 28, borderRadius: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: s ? (s.done ? "rgba(6,182,212,0.12)" : "#111113") : "transparent", border: s ? "1px solid rgba(6,182,212,0.2)" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 8, color: s ? "#06b6d4" : "#52525b", fontWeight: s ? 700 : 400 }}>{day}</span>
                {s?.done && <span style={{ fontSize: 7, color: "#06b6d4", lineHeight: 1 }}>{s.t}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecapMockup({ visible }: { visible: boolean }) {
  const maxT = Math.max(...TIPS_DATA);
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s", position: "absolute", inset: 0, padding: "10px 10px 0", overflowY: "auto", scrollbarWidth: "none" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 8 }}>
        {[
          { label: "Heures", value: "78h30", sub: "+12% vs mois préc.", color: "#e4e4e7" },
          { label: "Tips", value: "432€", sub: "+23% vs mois préc.", color: "#06b6d4" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 8, padding: "7px 8px" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 7, color: "#71717a", marginBottom: 2 }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 7, color: "#10b981" }}>↑ {s.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 8, padding: "8px" }}>
        <p style={{ margin: "0 0 6px", fontSize: 8, color: "#71717a", fontFamily: "monospace", textTransform: "uppercase" }}>Pourboires par jour</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 48 }}>
          {TIPS_DATA.map((t, i) => (
            <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", height: t > 0 ? `${Math.max((t / maxT) * 100, 8)}%` : "4px", background: t > 0 ? (t > 40 ? "#06b6d4" : "rgba(6,182,212,0.4)") : "#27272a", borderRadius: 2, transition: "height 0.5s ease" }} />
            </div>
          ))}
        </div>
      </div>

      {/* YTD */}
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, background: "#111113", border: "1px solid #27272a", borderRadius: 8, padding: "7px 8px" }}>
        <span style={{ fontSize: 16 }}>🏆</span>
        <div>
          <p style={{ margin: 0, fontSize: 9, color: "#71717a" }}>Total tips 2025</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>2 841€</p>
        </div>
      </div>
    </div>
  );
}

export default function ShiftsPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [screen, setScreen] = useState<"calendar" | "recap">("calendar");

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setScreen(s => s === "calendar" ? "recap" : "calendar"), 3500);
    return () => clearInterval(t);
  }, [inView]);

  const features = [
    { icon: Clock, text: "Logguez chaque shift en 10 secondes — heure de début, fin, pourboires du soir." },
    { icon: Euro, text: "Suivez vos tips au centime. Visualisez les meilleurs soirs du mois." },
    { icon: TrendingUp, text: "Récap mensuel automatique — heures, gains, comparaison mois précédent." },
  ];

  return (
    <section className="py-12 md:py-20 overflow-hidden" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Text */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
              Heures & Pourboires
            </p>
            <h2
              className="font-semibold tracking-tight leading-tight mb-5"
              style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
            >
              Votre compte rendu de mois.<br />
              <span style={{ color: "var(--accent)" }}>Automatique.</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--foreground-muted)", maxWidth: "44ch" }}>
              Plus de calculs à la main. Karaf garde la trace de chaque service — les heures, les pourboires, les tendances.
            </p>

            <div className="space-y-4">
              {features.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    <Icon size={14} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{text}</p>
                </motion.div>
              ))}
            </div>

            {/* Screen toggle pills */}
            <div className="flex items-center gap-2 mt-8">
              {(["calendar", "recap"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setScreen(s)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    background: screen === s ? "rgba(6,182,212,0.12)" : "transparent",
                    border: `1px solid ${screen === s ? "rgba(6,182,212,0.3)" : "var(--border)"}`,
                    color: screen === s ? "var(--accent)" : "var(--foreground-dim)",
                  }}
                >
                  {s === "calendar" ? "Calendrier" : "Récap"}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="flex justify-center"
          >
            <div
              style={{
                position: "relative",
                width: 240,
                height: 490,
                borderRadius: 34,
                background: "#111",
                boxShadow: "0 0 0 2px #333, 0 0 0 4px #1a1a1a, 0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.08)",
                padding: 5,
                flexShrink: 0,
              }}
            >
              {/* Notch */}
              <div style={{ position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)", width: 72, height: 20, background: "#111", borderRadius: 99, zIndex: 10 }} />

              {/* Screen */}
              <div style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden", background: "#09090B", display: "flex", flexDirection: "column" }}>
                {/* Top bar */}
                <div style={{ background: "#111113", borderBottom: "1px solid #27272a", padding: "20px 10px 7px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {screen === "calendar"
                      ? <Clock size={11} color="#06b6d4" />
                      : <BarChart2 size={11} color="#06b6d4" />
                    }
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#e4e4e7" }}>
                      {screen === "calendar" ? "Mes Shifts — Juin" : "Récap — Juin"}
                    </span>
                  </div>
                  <span style={{ fontSize: 8, color: "#71717a" }}>
                    {screen === "calendar" ? "12 services" : "30 jours"}
                  </span>
                </div>

                {/* Content area */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  <CalendarMockup visible={screen === "calendar"} />
                  <RecapMockup visible={screen === "recap"} />
                </div>

                {/* Bottom nav */}
                <div style={{ background: "#111113", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-around", padding: "7px 0 10px", flexShrink: 0 }}>
                  {[
                    { icon: "⊞", label: "Dash", active: false },
                    { icon: "✓", label: "Tâches", active: false },
                    { icon: "🕐", label: "Shifts", active: true },
                    { icon: "💬", label: "Avis", active: false },
                  ].map(n => (
                    <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <span style={{ fontSize: 14 }}>{n.icon}</span>
                      <span style={{ fontSize: 8, color: n.active ? "#06b6d4" : "#71717a" }}>{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
