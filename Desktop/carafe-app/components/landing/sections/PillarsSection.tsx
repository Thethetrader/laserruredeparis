"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Trophy, MessageSquare, ListChecks, Check, Plus, TrendingUp } from "lucide-react";

// ── Previews ─────────────────────────────────────────────────────────────────

function ProtocolsPreview() {
  const [count, setCount] = useState(12);
  useEffect(() => {
    const id = setInterval(() => setCount(n => (n >= 15 ? 12 : n + 1)), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-2">
      {[
        { label: "Procédure d'ouverture", done: true },
        { label: "Hygiène cuisine", done: true },
        { label: "Nouvelle carte d'été", done: false },
      ].map(({ label, done }) => (
        <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid rgba(15,81,50,0.1)" }}>
          <p className="text-[11px] flex-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
          {done ? (
            <Check size={10} strokeWidth={2.5} style={{ color: "#10b981" }} />
          ) : (
            <motion.span key={count} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="text-[9px] font-mono" style={{ color: "var(--accent)" }}>
              {count}/15
            </motion.span>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(15,81,50,0.05)", border: "1px solid rgba(15,81,50,0.15)" }}>
        <span className="text-[9px]" style={{ color: "var(--accent)" }}>✦ IA — PDF uploadé → étapes extraites automatiquement</span>
      </div>
    </div>
  );
}

function TasksPreview() {
  const tasks = [
    { label: "Mise en place salle", done: true, who: "Sofia" },
    { label: "Vérif allergènes menu", done: true, who: "Marc" },
    { label: "Fermeture cuisine", done: false, who: "Julie" },
    { label: "Rapport caisse", done: false, who: "Karim" },
  ];
  return (
    <div className="space-y-1.5">
      {tasks.map(({ label, done, who }) => (
        <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: done ? "rgba(16,185,129,0.04)" : "var(--background-elev)", border: `1px solid ${done ? "rgba(16,185,129,0.15)" : "var(--border)"}` }}>
          <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0" style={{ background: done ? "rgba(16,185,129,0.15)" : "transparent", border: `1px solid ${done ? "rgba(16,185,129,0.4)" : "var(--border)"}` }}>
            {done && <Check size={8} strokeWidth={3} style={{ color: "#10b981" }} />}
          </div>
          <p className="text-[11px] flex-1" style={{ color: done ? "var(--foreground-dim)" : "var(--foreground-muted)", textDecoration: done ? "line-through" : "none" }}>{label}</p>
          <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>{who}</span>
        </div>
      ))}
    </div>
  );
}

function ClientFeedbackPreview() {
  const feedbacks = [
    { dish: "Tarte tatin", comment: "trop sucrée", count: 5, color: "#f59e0b" },
    { dish: "Tartare de bœuf", comment: "portion trop petite", count: 3, color: "#ef4444" },
    { dish: "Service en salle", comment: "attente trop longue", count: 2, color: "#f97316" },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % feedbacks.length), 2800);
    return () => clearInterval(id);
  }, [feedbacks.length]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(15,81,50,0.05)", border: "1px solid rgba(15,81,50,0.15)" }}>
        <span className="text-[9px]" style={{ color: "var(--accent)" }}>✦ IA — patterns détectés automatiquement</span>
      </div>
      {feedbacks.map(({ dish, comment, count, color }, i) => (
        <motion.div
          key={dish}
          animate={{ opacity: i === idx ? 1 : 0.3, scale: i === idx ? 1 : 0.98 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1">
            <p className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>{dish}</p>
            <p className="text-[9px] italic" style={{ color: "var(--foreground-muted)" }}>« {comment} »</p>
          </div>
          <span className="text-[11px] font-mono font-bold" style={{ color }}>×{count}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LatePreview() {
  const [phase, setPhase] = useState<"idle" | "filling" | "sent">("idle");
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, t3: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase("idle");
      t1 = setTimeout(() => setPhase("filling"), 800);
      t2 = setTimeout(() => setPhase("sent"), 3000);
      t3 = setTimeout(cycle, 5200);
    };
    const init = setTimeout(cycle, 400);
    return () => { clearTimeout(init); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="space-y-2">
      <motion.div
        animate={phase === "filling" ? { scale: 0.97 } : { scale: 1 }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold"
        style={{ color: "var(--accent)", border: "1px solid rgba(15,81,50,0.25)", background: "rgba(15,81,50,0.05)" }}
      >
        <Plus size={11} strokeWidth={2} />
        Déclarer un retard
      </motion.div>
      <AnimatePresence mode="wait">
        {phase === "filling" && (
          <motion.div key="form" initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.25 }} className="p-3 rounded-lg space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            {["Motif", "Durée estimée"].map(f => (
              <div key={f}>
                <p className="text-[8px] font-mono mb-1" style={{ color: "var(--foreground-dim)" }}>{f}</p>
                <div className="h-6 rounded text-[10px] px-2 flex items-center" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                  {f === "Motif" ? "Transport" : "30 min"}
                </div>
              </div>
            ))}
          </motion.div>
        )}
        {phase === "sent" && (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Check size={10} strokeWidth={2.5} style={{ color: "#10b981" }} />
            <span className="text-[10px]" style={{ color: "#10b981" }}>Thomas (manager) notifié · 30 min · Transport</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChallengesPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-center gap-5">
        {[{ init: "RK", pts: 38, rank: 2 }, { init: "JM", pts: 47, rank: 1 }, { init: "YO", pts: 31, rank: 3 }].map(({ init, pts, rank }) => (
          <div key={init} className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>{pts}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-semibold"
              style={{ background: rank === 1 ? "rgba(15,81,50,0.18)" : "rgba(26,26,24,0.05)", border: rank === 1 ? "1px solid rgba(15,81,50,0.3)" : "1px solid var(--border)", color: rank === 1 ? "var(--accent)" : "var(--foreground-dim)" }}>
              {init}
            </div>
            <div className="rounded-t" style={{ width: 28, height: rank === 1 ? 40 : rank === 2 ? 28 : 20, background: rank === 1 ? "rgba(15,81,50,0.12)" : "rgba(26,26,24,0.03)", border: rank === 1 ? "1px solid rgba(15,81,50,0.2)" : "1px solid var(--border)", borderBottom: "none" }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <Trophy size={10} style={{ color: "var(--accent)" }} />
        <p className="text-[10px] flex-1" style={{ color: "var(--foreground-muted)" }}>Défi : 3 avis Google / jour</p>
        <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>3j restants</span>
      </div>
    </div>
  );
}

function PlanningPreview() {
  const [phase, setPhase] = useState<"needs" | "generating" | "done">("needs");
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, t3: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase("needs");
      t1 = setTimeout(() => setPhase("generating"), 1200);
      t2 = setTimeout(() => setPhase("done"), 2200);
      t3 = setTimeout(cycle, 5200);
    };
    const init = setTimeout(cycle, 400);
    return () => { clearTimeout(init); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const needs = [
    { service: "Vendredi soir", staff: "3 serveurs · 2 cuisiniers" },
    { service: "Samedi midi", staff: "4 serveurs · 3 cuisiniers" },
    { service: "Dimanche soir", staff: "2 serveurs · 1 cuisinier" },
  ];

  const planning = [
    { jour: "Ven.", heure: "20h", noms: ["Sofia", "Marc", "Julie"], color: "rgba(15,81,50,0.12)", border: "rgba(15,81,50,0.25)" },
    { jour: "Sam.", heure: "12h", noms: ["Marc", "Karim", "Aïcha", "Julie"], color: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    { jour: "Dim.", heure: "20h", noms: ["Sofia", "Karim"], color: "rgba(15,81,50,0.12)", border: "rgba(15,81,50,0.25)" },
  ];

  return (
    <div className="space-y-2">
      {/* Besoins — toujours visibles */}
      <div className="space-y-1.5">
        {needs.map(({ service, staff }) => (
          <div key={service} className="flex flex-col px-3 py-2 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-medium" style={{ color: "var(--foreground)" }}>{service}</p>
            <p className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{staff}</p>
          </div>
        ))}
      </div>

      {/* Bouton / génération */}
      {phase !== "done" && (
        <div
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold"
          style={{ color: "var(--accent)", border: "1px solid rgba(15,81,50,0.25)", background: phase === "generating" ? "rgba(15,81,50,0.1)" : "rgba(15,81,50,0.05)" }}
        >
          {phase === "generating" ? (
            <>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}>✦</motion.span>
              Génération en cours…
            </>
          ) : "Générer le planning"}
        </div>
      )}

      {/* Planning généré */}
      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-center gap-2">
              <Check size={9} strokeWidth={2.5} style={{ color: "#10b981" }} />
              <span className="text-[9px] font-medium" style={{ color: "#10b981" }}>Planning généré</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[9px] font-mono" style={{ color: "#10b981" }}>−18% masse sal.</span>
              <span className="text-[9px] font-mono" style={{ color: "#10b981" }}>+15 pts marge</span>
            </div>
          </div>
          {planning.map(({ jour, heure, noms, color, border }, i) => (
            <motion.div
              key={jour}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: color, border: `1px solid ${border}` }}
            >
              <span className="text-[9px] font-mono font-semibold w-7 flex-shrink-0" style={{ color: "var(--accent)" }}>{jour}</span>
              <span className="text-[9px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{heure}</span>
              <div className="flex gap-1 flex-wrap">
                {noms.map(n => (
                  <span key={n} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground-muted)" }}>{n}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────

const features = [
  {
    num: "01",
    icon: BookOpen,
    name: "Protocoles",
    desc: "Les mêmes règles pour tout le monde. Uploadez un PDF, l'IA extrait les étapes.",
    ai: true,
    Preview: ProtocolsPreview,
  },
  {
    num: "02",
    icon: ListChecks,
    name: "Tâches",
    desc: "Chacun voit ce qu'il a à faire. Personne n'attend qu'on lui dise.",
    ai: false,
    Preview: TasksPreview,
  },
  {
    num: "03",
    icon: MessageSquare,
    name: "Avis clients",
    desc: "Les serveurs notent ce que les clients disent en salle. L'IA repère ce qui revient — tu agis avant que ça devienne un problème.",
    ai: true,
    Preview: ClientFeedbackPreview,
  },
  {
    num: "04",
    icon: TrendingUp,
    name: "Planning",
    desc: "Renseigne tes besoins par service. L'IA te propose une option optimisée — tu ajustes et valides en un clic.",
    ai: true,
    Preview: PlanningPreview,
  },
  {
    num: "05",
    icon: Clock,
    name: "Retards",
    desc: "Un tap. Le manager est notifié en privé. La trace est faite.",
    ai: false,
    Preview: LatePreview,
  },
  {
    num: "06",
    icon: Trophy,
    name: "Défis & points",
    desc: "Lance un défi. Le classement motive. Tu n'as plus à pousser.",
    ai: false,
    Preview: ChallengesPreview,
  },
];

const DURATION = 4200;

// ── Section ───────────────────────────────────────────────────────────────────

export default function PillarsSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
    startRef.current = null;
  }, []);

  useEffect(() => {
    if (!inView) return;
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const pct = Math.min((now - startRef.current) / DURATION, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = null;
        setActive(a => {
          const next = (a + 1) % features.length;
          return next;
        });
        setProgress(0);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, active]);

  return (
    <section id="features" style={{ background: "var(--background)" }} className="py-12 md:py-20 overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Ce que Karaf fait pour vous
          </p>
          <h2 className="font-semibold leading-tight" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
            Tout ce dont ton équipe a besoin.{" "}
            <span style={{ color: "var(--foreground-muted)" }}>Dans une seule app.</span>
          </h2>
        </motion.div>

        {/* Body: list left + mockup right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-20 items-start">

          {/* Left: accordion list */}
          <div>
            {features.map((f, i) => {
              const isActive = active === i;
              return (
                <motion.div
                  key={f.num}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.06 }}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <button
                    onClick={() => goTo(i)}
                    className="w-full text-left py-5"
                  >
                    <div className="flex items-start gap-5">
                      {/* Number */}
                      <span
                        className="font-mono text-[10px] tracking-widest flex-shrink-0 pt-0.5 transition-colors duration-300"
                        style={{ color: isActive ? "var(--accent)" : "var(--foreground-dim)", width: 22 }}
                      >
                        {f.num}
                      </span>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[15px] font-semibold transition-colors duration-300"
                            style={{ color: isActive ? "var(--foreground)" : "var(--foreground-muted)" }}
                          >
                            {f.name}
                          </span>
                          {f.ai && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded tracking-wider" style={{ background: "rgba(15,81,50,0.08)", border: "1px solid rgba(15,81,50,0.2)", color: "var(--accent)" }}>
                              IA
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[13px] leading-relaxed transition-colors duration-300"
                          style={{ color: isActive ? "var(--foreground-muted)" : "var(--foreground-dim)" }}
                        >
                          {f.desc}
                        </p>

                        {/* Progress bar — desktop seulement pour éviter layout shift mobile */}
                        {isActive && (
                          <div className="hidden lg:block mt-3.5 h-px overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: "var(--accent)", width: `${progress * 100}%` }}
                            />
                          </div>
                        )}

                        {/* Mobile: height animée synchronisée — ouverture et fermeture au même rythme = hauteur totale constante */}
                        <div
                          className="lg:hidden overflow-hidden"
                          style={{
                            height: isActive ? 272 : 0,
                            transition: "height 0.38s cubic-bezier(0.16,1,0.3,1)",
                          }}
                        >
                          <div className="pt-3">
                            <div className="p-4 rounded-xl" style={{ height: 252, background: "var(--background-soft)", border: "1px solid var(--border)", overflow: "hidden" }}>
                              <f.Preview />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Arrow */}
                      <svg
                        width="13" height="13" viewBox="0 0 14 14" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        className="flex-shrink-0 mt-1 transition-all duration-300"
                        style={{ color: isActive ? "var(--accent)" : "var(--foreground-dim)", opacity: isActive ? 1 : 0.3, transform: isActive ? "translateX(2px)" : "translateX(0)" }}
                      >
                        <path d="M3 7h8M7 3l4 4-4 4" />
                      </svg>
                    </div>
                  </button>
                </motion.div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border)" }} />
          </div>

          {/* Right: sticky mockup panel (desktop only) */}
          <div className="hidden lg:block sticky top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}
              >
                {/* Panel header */}
                <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(15,81,50,0.08)", border: "1px solid rgba(15,81,50,0.15)" }}>
                    {(() => { const Icon = features[active].icon; return <Icon size={12} strokeWidth={1.5} style={{ color: "var(--accent)" }} />; })()}
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>
                    {features[active].name}
                  </span>
                  {features[active].ai && (
                    <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(15,81,50,0.08)", border: "1px solid rgba(15,81,50,0.2)", color: "var(--accent)" }}>
                      IA
                    </span>
                  )}
                </div>
                {/* Preview */}
                <div className="p-5">
                  {(() => { const Preview = features[active].Preview; return <Preview />; })()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
