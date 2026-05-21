"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const PARTICLES = [
  { id:0,  x:5,  y:12, dur:52, delay:-8  },
  { id:1,  x:18, y:78, dur:44, delay:-22 },
  { id:2,  x:32, y:35, dur:61, delay:-5  },
  { id:3,  x:48, y:55, dur:48, delay:-31 },
  { id:4,  x:63, y:20, dur:55, delay:-14 },
  { id:5,  x:77, y:88, dur:42, delay:-40 },
  { id:6,  x:91, y:45, dur:58, delay:-3  },
  { id:7,  x:14, y:62, dur:50, delay:-18 },
  { id:8,  x:29, y:92, dur:45, delay:-27 },
  { id:9,  x:43, y:8,  dur:63, delay:-11 },
  { id:10, x:56, y:70, dur:47, delay:-36 },
  { id:11, x:70, y:38, dur:54, delay:-7  },
  { id:12, x:84, y:15, dur:41, delay:-24 },
];

function Particles() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map(p => (
        <div key={p.id} className="absolute rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, width: 2, height: 2, background: "var(--accent)", animation: `particle-up ${p.dur}s ${p.delay}s linear infinite` }} />
      ))}
    </div>
  );
}

const RECAP_LINES = [
  { symbol: "▲", text: "Top 3 · Julie · Marc · Sofia", color: "#10B981" },
  { symbol: "▼", text: "3 retards répétitifs · Karim", color: "#EF4444" },
  { symbol: "🍽", text: "Retours cuisine · \"tarte trop sucrée\" (×3)", color: "#F59E0B" },
  { symbol: "🏆", text: "Challenge \"5 desserts/jour\" · gagné par Marc", color: "#06B6D4" },
];

function RecapPreview({ inView }: { inView: boolean }) {
  return (
    <div className="mt-6 rounded-xl overflow-hidden mx-auto" style={{ maxWidth: 480, background: "var(--background-soft)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "var(--foreground-dim)" }}>SEMAINE DU 12 AU 18 MAI</p>
      </div>
      <div className="p-4 space-y-3">
        {RECAP_LINES.map(({ symbol, text, color }, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.18 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 cursor-default"
            style={{ background: "var(--background)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--background)"; }}
          >
            <span className="text-[11px] flex-shrink-0" style={{ color }}>{symbol}</span>
            <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function AutomationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-12 md:py-36 overflow-hidden" style={{ background: "var(--background-soft)" }}>
      <Particles />
      <div className="relative z-10 max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>Automatisation</p>
          <h2 className="font-semibold tracking-tight leading-tight mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
            Carafe travaille pour vous.
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Tous les lundis matin, votre récap arrive. Vous pilotez en cinq minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mx-auto p-8 rounded-2xl"
          style={{ maxWidth: 900, background: "var(--background)", border: "1px solid var(--border)" }}
        >
          <p className="text-[9px] font-mono tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>[ AUTOMATISATION · RÉCAP HEBDO ]</p>
          <h3 className="text-[18px] font-semibold mb-3 leading-snug" style={{ color: "var(--foreground)" }}>
            Le récap de votre semaine. Livré chaque lundi.
          </h3>
          <p className="text-sm leading-relaxed max-w-[56ch]" style={{ color: "var(--foreground-muted)" }}>
            Qui a brillé. Qui a eu des retards. Quels retours sont revenus en cuisine. Quels challenges ont été gagnés. Tout dans le bon ordre, sans compiler.
          </p>
          <RecapPreview inView={inView} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 text-center space-y-1"
        >
          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>Cinq minutes le lundi.</p>
          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>Vous savez qui féliciter, et qui écouter.</p>
        </motion.div>
      </div>
    </section>
  );
}
