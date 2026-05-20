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

function DashboardMockup() {
  return (
    <div
      className="rounded-2xl overflow-hidden glow-cyan"
      style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
        <div className="flex gap-1.5">
          {["var(--danger)","var(--warning)","var(--success)"].map((c,i)=>(<div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />))}
        </div>
        <span className="font-mono text-[9px] ml-2" style={{ color: "var(--foreground-dim)" }}>carafe.app · Dashboard</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Retards", value: "3" },
            { label: "Avis clients", value: "14", accent: true },
            { label: "Défis actifs", value: "2" },
            { label: "Lectures en attente", value: "2", accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label} className="p-2.5 rounded-xl text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="text-lg font-semibold leading-none mb-1" style={{ color: accent ? "var(--accent)" : "var(--foreground)" }}>{value}</p>
              <p className="font-mono text-[7px] leading-tight" style={{ color: "var(--foreground-dim)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Classement équipe */}
        <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-2.5" style={{ color: "var(--foreground-dim)" }}>Classement équipe</p>
          <div className="space-y-2.5">
            {[
              { init: "YB", name: "Yasmine Benali", role: "Chef de salle", pts: 92, tag: "Ponctuel", tagColor: "#10b981" },
              { init: "KM", name: "Karim Mansour", role: "Responsable", pts: 78, tag: "1 retard", tagColor: "#f59e0b" },
              { init: "JD", name: "Julie Dupont", role: "Serveuse", pts: 61, tag: "2 retards", tagColor: "#ef4444" },
            ].map(({ init, name, pts, tag, tagColor }, i) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-[10px]">{["🥇","🥈","🥉"][i]}</span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)" }}>{init}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-medium truncate" style={{ color: "var(--foreground)" }}>{name}</span>
                    <span className="text-[7px] px-1 rounded" style={{ background: `${tagColor}22`, color: tagColor }}>{tag}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pts}%`, background: "var(--accent)" }} />
                  </div>
                </div>
                <span className="font-bold text-[10px] flex-shrink-0" style={{ color: "var(--accent)" }}>{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retours clients */}
        <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-2" style={{ color: "var(--foreground-dim)" }}>Retours clients ce mois</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "8", label: "Compliments", color: "#10b981" },
              { val: "3", label: "Plaintes", color: "#f59e0b" },
              { val: "2", label: "Suggestions", color: "var(--foreground-dim)" },
              { val: "1", label: "Incidents", color: "#ef4444" },
            ].map(({ val, label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-bold text-[11px]" style={{ color }}>{val}</span>
                <span className="text-[8px]" style={{ color: "var(--foreground-dim)" }}>{label}</span>
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
