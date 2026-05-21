"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

const checkpoints = [
  "Postez une fois. Plus jamais à répéter.",
  "Les retards arrivent où il faut, pas dans le groupe.",
  "Les retours clients tracés en 10 secondes. Vous voyez ce qui revient.",
  "Le bon travail est vu et félicité en un clic.",
  "Vos employés construisent une fiche pro qu'ils peuvent emporter.",
];

function TypeOn({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [active, text]);
  return <span>{displayed}<span className="inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: active && displayed.length < text.length ? "var(--accent)" : "transparent" }} /></span>;
}

const NAV_ICONS = ["M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6","M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253","M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z","M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0","M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"];

function DashboardMockup() {
  const feedbacks = [
    { tag: "COMPLIMENT", tagBg: "rgba(16,185,129,0.15)", tagColor: "#10b981", table: "Table 5", text: "Le client a adoré le risotto aux champignons. Demande à féliciter le chef.", date: "19 mai, 23:12", status: "Résolu", statusBg: "rgba(16,185,129,0.12)", statusColor: "#10b981", moiAussi: 2 },
    { tag: "RÉCLAMATION", tagBg: "rgba(239,68,68,0.15)", tagColor: "#ef4444", table: "Table 12", text: "Attente trop longue — 45 minutes pour les entrées. Groupe mécontent.", date: "18 mai, 23:12", status: "En cours", statusBg: "rgba(245,158,11,0.12)", statusColor: "#f59e0b", moiAussi: 3 },
    { tag: "SUGGESTION", tagBg: "rgba(139,92,246,0.15)", tagColor: "#8b5cf6", table: null, text: "Un client suggère d'ajouter des options végétaliennes au menu.", date: "17 mai, 23:12", status: "Ouvert", statusBg: "rgba(100,116,139,0.12)", statusColor: "#94a3b8", moiAussi: 1 },
  ];

  return (
    <div className="rounded-2xl overflow-hidden glow-cyan" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>
        <div className="flex-1 mx-2">
          <div className="text-[8px] px-2 py-0.5 rounded" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)", maxWidth: 160 }}>app.joincarafe.com</div>
        </div>
      </div>

      {/* App shell */}
      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-1 py-2 px-1.5" style={{ background: "var(--background)", borderRight: "1px solid var(--border)", width: 36, flexShrink: 0 }}>
          <div className="w-5 h-5 flex items-center justify-center mb-1">
            <span className="font-bold text-[8px]" style={{ color: "var(--accent)" }}>C</span>
          </div>
          {NAV_ICONS.map((d, i) => (
            <div key={i} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: i === 2 ? "rgba(6,182,212,0.12)" : "transparent", border: i === 2 ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={i === 2 ? "var(--accent)" : "var(--foreground-dim)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background-soft)" }}>
          {/* Page header */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
            <div>
              <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>RETOURS CLIENTS</p>
              <p className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>5 avis au total</p>
            </div>
            <div className="flex gap-1">
              {[["5","Total"],["2","Ouverts"],["2","Résolus"]].map(([v,l]) => (
                <span key={l} className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>{v} {l}</span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 pt-2 pb-1">
            {["Tous 5","Compliment 2","Réclamation 1","Suggestion 1"].map((f, i) => (
              <span key={f} className="text-[7px] px-1.5 py-0.5 rounded-full" style={{ background: i === 0 ? "rgba(6,182,212,0.15)" : "var(--background-elev)", color: i === 0 ? "var(--accent)" : "var(--foreground-dim)", border: `1px solid ${i === 0 ? "rgba(6,182,212,0.3)" : "var(--border)"}` }}>{f}</span>
            ))}
          </div>

          {/* Feedback list */}
          <div className="flex-1 overflow-hidden px-3 py-1 space-y-1.5">
            {feedbacks.map(({ tag, tagBg, tagColor, table, text, date, status, statusBg, statusColor, moiAussi }) => (
              <div key={tag + date} className="rounded-lg p-2.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-semibold px-1.5 py-0.5 rounded" style={{ background: tagBg, color: tagColor }}>{tag}</span>
                    {table && <span className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{table}</span>}
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: statusBg, color: statusColor }}>{status}</span>
                </div>
                <p className="text-[8px] leading-relaxed mb-1" style={{ color: "var(--foreground-muted)" }}>{text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-mono" style={{ color: "var(--foreground-dim)" }}>{date}</span>
                  <span className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>👍 {moiAussi} moi aussi</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SolutionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-40" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
              La solution
            </p>
            <h2
              className="font-semibold leading-tight mb-3"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
            >
              <TypeOn text="Voilà Carafe." active={inView} />
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--foreground-muted)" }}>
              <TypeOn text="Driver une équipe sans s'épuiser. Sans répéter. Sans pourrir l'ambiance." active={inView} />
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--foreground-muted)" }}>
              Carafe remplace votre groupe WhatsApp pro par un vrai outil de management. Protocoles épinglés, retards tracés, retours clients capturés en plein service. Vous voyez qui bosse bien, vous le valorisez en un clic. Ils construisent quelque chose chez vous. Ils restent.
            </p>
            <ul className="space-y-3">
              {checkpoints.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                    <Check size={10} strokeWidth={2.5} style={{ color: "var(--accent)" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
