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
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Protocoles actifs", value: "12", delta: "+2" },
            { label: "Présence aujourd'hui", value: "94%", delta: null },
            { label: "Score équipe", value: "87", delta: "+5" },
          ].map(({ label, value, delta }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="font-mono text-[8px] mb-1.5" style={{ color: "var(--foreground-dim)" }}>{label}</p>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-semibold" style={{ color: "var(--foreground)", lineHeight: 1 }}>{value}</span>
                {delta && <span className="font-mono text-[8px] mb-0.5" style={{ color: "var(--success)" }}>{delta}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 */}
        <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-2" style={{ color: "var(--foreground-dim)" }}>TOP 3 · Cette semaine</p>
          <div className="space-y-2">
            {[
              { name: "Julie M.", pts: 47, rank: 1 },
              { name: "Rayan K.", pts: 38, rank: 2 },
              { name: "Yasmine O.", pts: 31, rank: 3 },
            ].map(({ name, pts, rank }) => (
              <div key={name} className="flex items-center gap-2">
                <span className="font-mono text-[8px] w-3" style={{ color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>#{rank}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--background-soft)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(pts/47)*100}%`, background: rank===1?"var(--accent)":"var(--border)" }} />
                </div>
                <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{name}</span>
                <span className="font-mono text-[8px]" style={{ color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>{pts}pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retours clients */}
        <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-2" style={{ color: "var(--foreground-dim)" }}>RETOURS CLIENTS · Cette semaine</p>
          <div className="space-y-1.5">
            {[
              { dish: "Tarte tatin", comment: "trop sucrée", count: 3, color: "var(--warning)" },
              { dish: "Tartare", comment: "portion trop petite", count: 2, color: "var(--foreground-dim)" },
            ].map(({ dish, comment, count, color }) => (
              <div key={dish} className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-medium" style={{ color: "var(--foreground-muted)" }}>{dish}</span>
                  <span className="text-[8px] italic ml-1.5" style={{ color: "var(--foreground-dim)" }}>&laquo; {comment} &raquo;</span>
                </div>
                <span className="font-mono text-[8px] font-bold" style={{ color }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--warning)" }} />
          <p className="text-[9px]" style={{ color: "var(--warning)" }}>2 protocoles en attente de validation</p>
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
