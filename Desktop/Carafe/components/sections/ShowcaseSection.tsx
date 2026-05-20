"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { BookOpen, LayoutDashboard, User, ArrowLeftRight, Trophy, Check, Star, TrendingUp } from "lucide-react";

const views = [
  { id: "protocols", label: "Protocoles", icon: BookOpen },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employee", label: "Fiche employé", icon: User },
  { id: "handover", label: "Passation", icon: ArrowLeftRight },
  { id: "challenge", label: "Challenge", icon: Trophy },
];

function ProtocolsView() {
  const categories = [
    { emoji: "🍽️", label: "Salle", count: 2 },
    { emoji: "👨‍🍳", label: "Cuisine", count: 1 },
    { emoji: "🍹", label: "Bar", count: 1 },
    { emoji: "🤝", label: "Accueil", count: 1 },
    { emoji: "🧹", label: "Hygiène", count: 1 },
    { emoji: "🔒", label: "Sécurité", count: 0 },
    { emoji: "🌅", label: "Ouverture", count: 1 },
    { emoji: "🌙", label: "Fermeture", count: 1 },
  ];
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Protocoles</h3>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>8 protocoles · 7 catégories</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(({ emoji, label, count }) => (
          <div key={label} className="rounded-lg p-3 flex items-center gap-2.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <span className="text-[18px] leading-none">{emoji}</span>
            <div>
              <p className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
              <p className="text-[8px]" style={{ color: "var(--foreground-dim)" }}>{count} protocole{count !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { val: "3", label: "Retards" },
          { val: "14", label: "Avis clients", accent: true },
          { val: "2", label: "Défis actifs" },
          { val: "2", label: "En attente", accent: true },
        ].map(({ val, label, accent }) => (
          <div key={label} className="p-2 rounded-lg text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="font-bold text-base leading-none mb-1" style={{ color: accent ? "var(--accent)" : "var(--foreground)" }}>{val}</p>
            <p className="text-[7px] leading-tight" style={{ color: "var(--foreground-dim)" }}>{label}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <TrendingUp size={10} style={{ color: "var(--accent)" }} />
          <p className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>Classement équipe</p>
        </div>
        <div className="space-y-2.5">
          {[
            { rank: "🥇", init: "YB", name: "Yasmine Benali", pts: 92, tagColor: "#10b981", tag: "Ponctuel" },
            { rank: "🥈", init: "KM", name: "Karim Mansour", pts: 78, tagColor: "#f59e0b", tag: "1 retard" },
            { rank: "🥉", init: "JD", name: "Julie Dupont", pts: 61, tagColor: "#ef4444", tag: "2 retards" },
          ].map(({ rank, init, name, pts, tagColor, tag }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[10px]">{rank}</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)" }}>{init}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                  <span className="text-[7px] px-1 rounded" style={{ background: `${tagColor}22`, color: tagColor }}>{tag}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pts}%`, background: "var(--accent)" }} />
                </div>
              </div>
              <span className="font-bold text-[10px]" style={{ color: "var(--accent)" }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="font-mono text-[8px] mb-2" style={{ color: "var(--foreground-dim)" }}>Retours clients ce mois</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[["8","Compliments","#10b981"],["3","Plaintes","#f59e0b"],["2","Suggestions","var(--foreground-dim)"],["1","Incidents","#ef4444"]].map(([v,l,c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="font-bold text-[11px]" style={{ color: c }}>{v}</span>
              <span className="text-[8px]" style={{ color: "var(--foreground-dim)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeView() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "var(--accent)" }}>YB</div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Yasmine Benali</p>
          <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Chef de salle · Score : 92 pts</p>
        </div>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["Ponctuel","Top équipe Q1","Expert service"].map(b => (
          <span key={b} className="font-mono text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--accent)" }}>{b}</span>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <button className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold text-center" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)" }}>⭐ Bravo</button>
        <button className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold text-center" style={{ background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>⚡ Bonus</button>
      </div>
      <div className="p-3 rounded-lg mb-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex gap-0.5 mb-1">
          {[1,2,3,4,5].map(i=><Star key={i} size={8} style={{ color:"#F59E0B", fill:"#F59E0B" }} />)}
        </div>
        <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>&ldquo;Service impeccable, Yasmine a rendu notre soirée parfaite.&rdquo;</p>
        <p className="font-mono text-[8px] mt-1" style={{ color: "var(--foreground-dim)" }}>Marie D. · Google · il y a 2j</p>
      </div>
      <div className="space-y-1">
        {["3/3 protocoles lus","Aucun retard ce mois","2 défis gagnés"].map(s => (
          <div key={s} className="flex items-center gap-2">
            <Check size={9} style={{ color:"var(--success)" }} />
            <p className="text-[9px]" style={{ color:"var(--foreground-muted)" }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoverView() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Passation de service</p>
          <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Karim → Julie · 15h00</p>
        </div>
        <span className="font-mono text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>Transmis</span>
      </div>
      {[
        { label: "Stocks", value: "Bar à réapprovisionner ce soir" },
        { label: "VIP", value: "Table 6, anniversaire M. Dupont" },
        { label: "Notes", value: "Friteuse H2 en maintenance demain" },
      ].map(({ label, value }) => (
        <div key={label} className="mb-3 p-3 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-1" style={{ color: "var(--foreground-dim)" }}>{label.toUpperCase()}</p>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function ChallengeView() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Défis en cours</p>
          <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>2 défis actifs · Mai 2026</p>
        </div>
        <Trophy size={14} style={{ color: "var(--accent)" }} />
      </div>
      <div className="space-y-2 mb-3">
        {[
          { label: "3 avis Google / jour", progress: 68, days: "3j restants" },
          { label: "Zéro retard ce mois", progress: 90, days: "11j restants" },
        ].map(({ label, progress, days }) => (
          <div key={label} className="p-2.5 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
              <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>{days}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "var(--accent)" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { init: "YB", name: "Yasmine Benali", pts: 92, rank: 1 },
          { init: "KM", name: "Karim Mansour", pts: 78, rank: 2 },
          { init: "JD", name: "Julie Dupont", pts: 61, rank: 3 },
        ].map(({ init, name, pts, rank }) => (
          <div key={init} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--background-elev)", border: rank===1?"1px solid rgba(6,182,212,0.25)":"1px solid var(--border)" }}>
            <span className="text-[10px]">{["🥇","🥈","🥉"][rank-1]}</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold" style={{ background: rank===1?"rgba(6,182,212,0.15)":"var(--background-soft)", color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>{init}</div>
            <span className="flex-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>{name}</span>
            <span className="font-mono text-[9px] font-bold" style={{ color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>{pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const viewComponents = [ProtocolsView, DashboardView, EmployeeView, HandoverView, ChallengeView];

export default function ShowcaseSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  const DURATION = 5000;

  const goTo = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
    setPaused(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), 10000);
  }, []);

  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p < 1) { raf = requestAnimationFrame(frame); }
      else { setActive(a => (a + 1) % views.length); setProgress(0); }
    };
    let raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, paused]);

  const CurrentView = viewComponents[active];

  return (
    <section className="py-28" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Aperçus
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Tout ce qu&apos;il vous faut, rien de plus.
          </h2>
        </motion.div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          {/* Mock app bar */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-1.5">{["var(--danger)","var(--warning)","var(--success)"].map((c,i)=><div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
            <span className="font-mono text-[9px] ml-2" style={{ color: "var(--foreground-dim)" }}>carafe.app</span>
          </div>

          {/* View area — fixed height prevents layout shift on tab switch */}
          <div className="relative" style={{ height: 360, overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <CurrentView />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px" }}>
            <div className="flex items-center gap-1 flex-wrap">
              {views.map(({ id, label, icon: Icon }, i) => (
                <button
                  key={id}
                  onClick={() => goTo(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150"
                  style={{
                    background: i===active?"rgba(6,182,212,0.1)":"transparent",
                    color: i===active?"var(--accent)":"var(--foreground-dim)",
                    border: i===active?"1px solid rgba(6,182,212,0.25)":"1px solid transparent",
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-none"
                style={{ width: `${progress * 100}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
