"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { BookOpen, LayoutDashboard, User, Trophy, MessageSquare, Check, Star, ThumbsUp, Plus, TrendingUp } from "lucide-react";

const views = [
  { id: "protocols", label: "Protocoles", icon: BookOpen },
  { id: "feedback", label: "Retours clients", icon: MessageSquare },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employee", label: "Fiche employé", icon: User },
  { id: "challenge", label: "Challenges", icon: Trophy },
];

const NAV = [
  { d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: false },
  { d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", active: false },
  { d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", active: false },
  { d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0", active: false },
  { d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", active: false },
  { d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", active: false },
];

function AppShell({ activeNav, header, children }: { activeNav: number; header: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex" style={{ height: 320 }}>
      {/* Sidebar */}
      <div className="flex flex-col items-center gap-1 py-2 px-1.5" style={{ background: "var(--background)", borderRight: "1px solid var(--border)", width: 36, flexShrink: 0 }}>
        <div className="w-5 h-5 flex items-center justify-center mb-1">
          <span className="font-bold text-[8px]" style={{ color: "var(--accent)" }}>C</span>
        </div>
        {NAV.map(({ d }, i) => (
          <div key={i} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: i === activeNav ? "rgba(6,182,212,0.12)" : "transparent", border: i === activeNav ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={i === activeNav ? "var(--accent)" : "var(--foreground-dim)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background-soft)" }}>
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
          {header}
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

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
    <AppShell activeNav={1} header={
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>PROTOCOLES</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>8 protocoles · 7 catégories</p>
        </div>
        <button className="flex items-center gap-1 text-[8px] px-2 py-1 rounded-md" style={{ background: "var(--accent)", color: "#09090B" }}>
          <Plus size={8} strokeWidth={2.5} /> Nouveau
        </button>
      </div>
    }>
      <div className="p-3 grid grid-cols-2 gap-2 overflow-hidden">
        {categories.map(({ emoji, label, count }) => (
          <div key={label} className="rounded-lg p-2.5 flex items-center gap-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <span className="text-[16px] leading-none">{emoji}</span>
            <div>
              <p className="text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
              <p className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{count} protocole{count !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function FeedbackView() {
  const items = [
    { tag: "COMPLIMENT", tagBg: "rgba(16,185,129,0.15)", tagColor: "#10b981", table: "Table 5", text: "Le client a adoré le risotto aux champignons. Demande à féliciter le chef.", date: "19 mai, 23:12", status: "Résolu", statusBg: "rgba(16,185,129,0.12)", statusColor: "#10b981", moiAussi: 2 },
    { tag: "RÉCLAMATION", tagBg: "rgba(239,68,68,0.15)", tagColor: "#ef4444", table: "Table 12", text: "Attente trop longue — 45 minutes pour les entrées. Groupe mécontent.", date: "18 mai, 23:12", status: "En cours", statusBg: "rgba(245,158,11,0.12)", statusColor: "#f59e0b", moiAussi: 3 },
    { tag: "SUGGESTION", tagBg: "rgba(139,92,246,0.15)", tagColor: "#8b5cf6", table: null, text: "Un client suggère d'ajouter des options végétaliennes au menu.", date: "17 mai", status: "Ouvert", statusBg: "rgba(100,116,139,0.12)", statusColor: "#94a3b8", moiAussi: 1 },
  ];
  return (
    <AppShell activeNav={2} header={
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>RETOURS CLIENTS</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>5 avis au total</p>
        </div>
        <div className="flex gap-1">
          {["Tous 5","2 Ouverts","2 Résolus"].map(t => (
            <span key={t} className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>{t}</span>
          ))}
        </div>
      </div>
    }>
      <div className="px-3 py-2 space-y-1.5 overflow-hidden">
        {items.map(({ tag, tagBg, tagColor, table, text, date, status, statusBg, statusColor, moiAussi }) => (
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
              <div className="flex items-center gap-1">
                <ThumbsUp size={7} style={{ color: "var(--foreground-dim)" }} />
                <span className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{moiAussi} moi aussi</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function DashboardView() {
  return (
    <AppShell activeNav={0} header={
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Mercredi 21 mai</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>Vue d&apos;ensemble</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>DEV</span>
          <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.3)" }}>Manager</span>
        </div>
      </div>
    }>
      <div className="p-3 space-y-2 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5">
          {[["3","Retards"],["14","Avis clients"],["2","Défis"],["2","En attente"]].map(([v,l],i) => (
            <div key={l} className="p-2 rounded-lg text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="font-bold text-[13px] leading-none mb-0.5" style={{ color: i===1||i===3 ? "var(--accent)" : "var(--foreground)" }}>{v}</p>
              <p className="text-[7px] leading-tight" style={{ color: "var(--foreground-dim)" }}>{l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <TrendingUp size={9} style={{ color: "var(--accent)" }} />
            <span className="text-[8px] font-semibold" style={{ color: "var(--foreground)" }}>Classement équipe</span>
          </div>
          {[
            { rank: "🥇", init: "YB", name: "Yasmine Benali", pts: 92, tagColor: "#10b981", tag: "Ponctuel" },
            { rank: "🥈", init: "KM", name: "Karim Mansour", pts: 78, tagColor: "#f59e0b", tag: "1 retard" },
            { rank: "🥉", init: "JD", name: "Julie Dupont", pts: 61, tagColor: "#ef4444", tag: "2 retards" },
          ].map(({ rank, init, name, pts, tagColor, tag }) => (
            <div key={name} className="flex items-center gap-2 px-3 py-1.5" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              <span className="text-[9px]">{rank}</span>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)" }}>{init}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                  <span className="text-[6px] px-1 rounded" style={{ background: `${tagColor}22`, color: tagColor }}>{tag}</span>
                </div>
                <div className="h-0.5 rounded-full mt-0.5 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pts}%`, background: "var(--accent)" }} />
                </div>
              </div>
              <span className="font-bold text-[9px]" style={{ color: "var(--accent)" }}>{pts}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-[7px] font-mono mb-1.5" style={{ color: "var(--foreground-dim)" }}>Retours clients ce mois</p>
          <div className="grid grid-cols-2 gap-1">
            {[["8","Compliments","#10b981"],["3","Plaintes","#f59e0b"],["2","Suggestions","var(--foreground-dim)"],["1","Incidents","#ef4444"]].map(([v,l,c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="font-bold text-[10px]" style={{ color: c }}>{v}</span>
                <span className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function EmployeeView() {
  return (
    <AppShell activeNav={3} header={
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>ÉQUIPE</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>3 membres actifs</p>
        </div>
        <button className="flex items-center gap-1 text-[8px] px-2 py-1 rounded-md" style={{ background: "var(--accent)", color: "#09090B" }}>
          <Plus size={8} strokeWidth={2.5} /> Inviter
        </button>
      </div>
    }>
      <div className="p-3 space-y-2">
        {[
          { init: "YB", name: "Yasmine Benali", role: "Chef de salle", tag: "MANAGER", tagBg: "rgba(6,182,212,0.15)", tagColor: "var(--accent)", bravo: 1 },
          { init: "KM", name: "Karim Mansour", role: "Responsable", tag: "EMPLOYÉ", tagBg: "rgba(250,250,250,0.05)", tagColor: "var(--foreground-dim)", bravo: 0 },
          { init: "JD", name: "Julie Dupont", role: "Serveuse", tag: "EMPLOYÉ", tagBg: "rgba(250,250,250,0.05)", tagColor: "var(--foreground-dim)", bravo: 1 },
        ].map(({ init, name, role, tag, tagBg, tagColor, bravo }) => (
          <div key={name} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)" }}>{init}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                <span className="text-[6px] font-mono px-1 py-0.5 rounded" style={{ background: tagBg, color: tagColor }}>{tag}</span>
              </div>
              <p className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{role}{bravo ? ` · ⭐ ${bravo} bravo` : ""}</p>
            </div>
            <div className="flex gap-1">
              <button className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>Bravo</button>
              <button className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>Bonus</button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function ChallengeView() {
  return (
    <AppShell activeNav={4} header={
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>CHALLENGES</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>2 défis actifs</p>
        </div>
        <Trophy size={12} style={{ color: "var(--accent)" }} />
      </div>
    }>
      <div className="p-3 space-y-2">
        {[
          { label: "3 avis Google / jour", progress: 68, days: "3j restants", color: "var(--accent)" },
          { label: "Zéro retard ce mois", progress: 90, days: "11j restants", color: "#10b981" },
        ].map(({ label, progress, days, color }) => (
          <div key={label} className="p-2.5 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
              <span className="font-mono text-[7px]" style={{ color: "var(--foreground-dim)" }}>{days}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
            </div>
          </div>
        ))}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <p className="text-[7px] font-mono px-3 py-1.5" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", borderBottom: "1px solid var(--border)" }}>Classement · Ce mois</p>
          {[
            { rank: "🥇", init: "YB", name: "Yasmine Benali", pts: 92 },
            { rank: "🥈", init: "KM", name: "Karim Mansour", pts: 78 },
            { rank: "🥉", init: "JD", name: "Julie Dupont", pts: 61 },
          ].map(({ rank, init, name, pts }, i) => (
            <div key={name} className="flex items-center gap-2 px-3 py-1.5" style={{ background: "var(--background-elev)", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <span className="text-[9px]">{rank}</span>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)" }}>{init}</div>
              <span className="flex-1 text-[8px]" style={{ color: "var(--foreground-muted)" }}>{name}</span>
              <span className="font-bold text-[9px]" style={{ color: i === 0 ? "var(--accent)" : "var(--foreground-dim)" }}>{pts} pts</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

const viewComponents = [ProtocolsView, FeedbackView, DashboardView, EmployeeView, ChallengeView];

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
    <section className="py-12 md:py-28" style={{ background: "var(--background-soft)" }}>
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
          {/* Mock browser bar */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
            </div>
            <div className="flex-1 mx-2">
              <div className="text-[8px] px-2 py-0.5 rounded" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)", maxWidth: 180 }}>app.joincarafe.com</div>
            </div>
          </div>

          {/* View area */}
          <div className="relative overflow-hidden">
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
                    background: i === active ? "rgba(6,182,212,0.1)" : "transparent",
                    color: i === active ? "var(--accent)" : "var(--foreground-dim)",
                    border: i === active ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent",
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-2 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-none" style={{ width: `${progress * 100}%`, background: "var(--accent)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
