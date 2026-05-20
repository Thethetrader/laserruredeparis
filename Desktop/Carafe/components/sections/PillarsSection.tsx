"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Trophy, Star, Check, Plus, MessageSquare } from "lucide-react";

function ProtocolsPreview() {
  const [count, setCount] = useState(12);
  useEffect(() => {
    const id = setInterval(() => setCount(n => (n >= 15 ? 12 : n + 1)), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-4 space-y-1.5">
      {[
        { label: "Procédure d'ouverture", done: true },
        { label: "Hygiène cuisine", done: true },
        { label: "Nouvelle carte d'été", done: false },
      ].map(({ label, done }) => (
        <div key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.1)" }}>
          <p className="text-[10px] flex-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
          {done ? (
            <Check size={9} strokeWidth={2.5} style={{ color: "var(--success)" }} />
          ) : (
            <motion.span key={count} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="text-[8px] font-mono" style={{ color: "var(--accent)" }}>
              {count}/15
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

function RecognitionPreview() {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setSent(v => !v), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-4 space-y-2">
      <div className="p-3 rounded-lg" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        <div className="flex gap-0.5 mb-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={8} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
          ))}
        </div>
        <p className="text-[10px] leading-relaxed mb-1" style={{ color: "var(--foreground)" }}>
          &ldquo;Julie a été formidable, très professionnelle.&rdquo;
        </p>
        <p className="text-[8px] font-mono" style={{ color: "var(--foreground-dim)" }}>Marie D. · Google · il y a 2j</p>
      </div>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <Check size={9} strokeWidth={2} style={{ color: "var(--accent)" }} />
            <p className="text-[10px]" style={{ color: "var(--accent)" }}>Archivé sur la fiche de Julie</p>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-medium"
            style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.18)", color: "var(--accent)" }}
          >
            Envoyer à Julie
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChallengesPreview() {
  return (
    <div className="mt-4">
      <div className="flex items-end justify-center gap-3 mb-3">
        {[
          { init: "RK", pts: 38, rank: 2 },
          { init: "JM", pts: 47, rank: 1 },
          { init: "YO", pts: 31, rank: 3 },
        ].map(({ init, pts, rank }) => (
          <div key={init} className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-mono" style={{ color: "var(--foreground-dim)" }}>{pts}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-semibold"
              style={{ background: rank===1?"rgba(6,182,212,0.18)":"rgba(250,250,250,0.05)", border: rank===1?"1px solid rgba(6,182,212,0.3)":"1px solid var(--border)", color: rank===1?"var(--accent-glow)":"var(--foreground-dim)" }}>
              {init}
            </div>
            <div className="rounded-t-sm" style={{ width: 26, height: rank===1?34:rank===2?24:18, background: rank===1?"rgba(6,182,212,0.12)":"rgba(250,250,250,0.03)", border: rank===1?"1px solid rgba(6,182,212,0.2)":"1px solid var(--border)", borderBottom:"none" }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        <Trophy size={10} style={{ color: "var(--accent)" }} />
        <p className="text-[10px] flex-1" style={{ color: "var(--foreground-muted)" }}>3 avis Google / jour</p>
        <span className="text-[8px] font-mono" style={{ color: "var(--foreground-dim)" }}>3j restants</span>
      </div>
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
    <div className="mt-4" style={{ height: 120 }}>
      <motion.button
        animate={phase === "filling" ? { scale: 0.96 } : { scale: 1 }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold"
        style={{ color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)", background: "rgba(6,182,212,0.05)" }}
      >
        <Plus size={11} strokeWidth={2} />
        Déclarer un retard
      </motion.button>
      <div className="overflow-hidden" style={{ height: 84 }}>
        <AnimatePresence mode="wait">
          {phase === "filling" && (
            <motion.div
              key="form"
              initial={{ y: -84, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -84, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                {["Motif", "Durée estimée"].map(f => (
                  <div key={f}>
                    <p className="text-[8px] font-mono mb-1" style={{ color: "var(--foreground-dim)" }}>{f}</p>
                    <div className="h-5 rounded text-[9px] px-2 flex items-center" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                      {f === "Motif" ? "Transport" : "30 min"}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {phase === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <Check size={10} strokeWidth={2.5} style={{ color: "var(--success)" }} />
              <span className="text-[10px]" style={{ color: "var(--success)" }}>Thomas (manager) notifié · 30 min · Transport</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const CLIENT_FEEDBACKS = [
  { dish: "Tarte tatin", comment: "trop sucrée", count: 3 },
  { dish: "Tartare de bœuf", comment: "portion trop petite", count: 2 },
];

function ClientFeedbackPreview() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % CLIENT_FEEDBACKS.length), 3200);
    return () => clearInterval(id);
  }, []);
  const fb = CLIENT_FEEDBACKS[idx];
  return (
    <div className="mt-4 space-y-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.25 }}
          className="p-3 rounded-lg"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>{fb.dish}</span>
            <span className="font-mono text-[9px] font-bold" style={{ color: "var(--accent)" }}>×{fb.count} cette semaine</span>
          </div>
          <p className="text-[9px] italic" style={{ color: "var(--foreground-muted)" }}>&laquo;&nbsp;{fb.comment}&nbsp;&raquo;</p>
        </motion.div>
      </AnimatePresence>
      <div className="px-2.5 py-1.5 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[8px] font-mono" style={{ color: "var(--foreground-dim)" }}>Noté par le serveur · 10 sec · En plein service</p>
      </div>
    </div>
  );
}

const pillars = [
  {
    tag: "01 · PROTOCOLES",
    icon: BookOpen,
    title: "Posté une fois. Vu pour toujours.",
    desc: "Vous le postez. Ça reste épinglé. Toute l'équipe l'a sous les yeux à chaque ouverture. Fini de se répéter.",
    Preview: ProtocolsPreview,
  },
  {
    tag: "02 · RECONNAISSANCE",
    icon: Star,
    title: "Ils construisent leur réputation. Chez vous.",
    desc: "Un avis Google mentionne Julie. En un clic, c'est sur sa fiche. Mois après mois, elle construit quelque chose de concret. Elle n'a aucune raison d'aller recommencer ailleurs.",
    Preview: RecognitionPreview,
  },
  {
    tag: "03 · CHALLENGES",
    icon: Trophy,
    title: "L'équipe se dépasse, toute seule.",
    desc: "Lancez un défi. Le classement est visible. Le gagnant gagne un trophée sur son profil. La compétition fait avancer l'équipe sans que vous ayez à pousser.",
    Preview: ChallengesPreview,
  },
  {
    tag: "04 · RETARDS",
    icon: Clock,
    title: "Le retard, géré sans bruit.",
    desc: "Votre employé appuie sur un bouton. Vous êtes notifié directement, en privé. L'équipe ne voit rien. Vous gardez une trace.",
    Preview: LatePreview,
  },
  {
    tag: "05 · RETOUR CLIENT",
    icon: MessageSquare,
    title: "Les retours clients, enfin tracés.",
    desc: "Un client fait une remarque en plein service. Noté en 10 secondes. En fin de semaine, vous voyez ce qui revient. Vous agissez sur ce qui compte.",
    Preview: ClientFeedbackPreview,
  },
];

function PillarCard({ pillar, index }: { pillar: typeof pillars[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)", y: 30 }}
      animate={inView ? { opacity: 1, scale: 1, filter: "blur(0px)", y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="p-6 rounded-xl flex flex-col cursor-default"
      style={{
        background: "var(--background-soft)",
        border: `1px solid ${hovered ? "rgba(6,182,212,0.35)" : "var(--border)"}`,
        boxShadow: hovered ? "0 0 40px -5px rgba(6,182,212,0.12)" : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "border-color 200ms, box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p
        className="text-[9px] font-mono tracking-widest mb-4 transition-colors duration-200"
        style={{ color: hovered ? "var(--accent)" : "var(--foreground-dim)" }}
      >
        [{pillar.tag}]
      </p>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
        <pillar.icon size={16} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
      </div>
      <div className="relative mb-2">
        <h3 className="text-[15px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          {pillar.title}
        </h3>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "var(--accent)", transformOrigin: "left", bottom: -2 }}
        />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{pillar.desc}</p>
      <pillar.Preview />
    </motion.div>
  );
}

export default function PillarsSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section id="features" style={{ background: "var(--background)" }} className="py-28 md:py-36">
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Fonctionnalités
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Cinq piliers. Une seule app.
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Chaque fonctionnalité résout un problème précis du quotidien en restau.
          </p>
        </motion.div>

        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {pillars.slice(0, 3).map((pillar, i) => (
            <PillarCard key={pillar.tag} pillar={pillar} index={i} />
          ))}
        </div>

        {/* Row 2: 2 wide cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.slice(3).map((pillar, i) => (
            <PillarCard key={pillar.tag} pillar={pillar} index={i + 3} />
          ))}
        </div>
      </div>
    </section>
  );
}
