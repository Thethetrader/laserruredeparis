"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  LayoutDashboard, ListChecks, BookOpen, MessageSquare, Trophy,
  Users, Clock, CalendarCheck, Settings, ChevronRight, ChevronDown,
  TrendingUp, Plus, Sparkles, LayoutGrid,
} from "lucide-react";

/* ---------------------------------------------------------------- */
/* Desktop mockup — dashboard fidèle, mode clair                    */
/* ---------------------------------------------------------------- */

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: ListChecks, label: "Tâches" },
  { icon: BookOpen, label: "Protocoles" },
  { icon: MessageSquare, label: "Retours clients" },
  { icon: Trophy, label: "Challenges" },
  { icon: Users, label: "Équipe" },
  { icon: Clock, label: "Retards" },
  { icon: CalendarCheck, label: "Vote RDV" },
];

function DesktopMockup() {
  return (
    <div className="flex" style={{ height: 560, background: "var(--background)", fontSize: 11 }}>
      {/* Sidebar */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{ width: 196, background: "var(--background-soft)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 px-4 h-12" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <span className="text-[10px] font-bold" style={{ color: "#fff" }}>K</span>
          </div>
          <span className="font-semibold text-[13px]" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>Karaf</span>
        </div>

        <div className="px-3 pt-3 pb-2">
          <div
            className="flex items-center justify-between px-2.5 py-2 rounded-lg"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
          >
            <span className="text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>La Brasserie Test</span>
            <ChevronDown size={12} style={{ color: "var(--foreground-dim)" }} />
          </div>
        </div>

        <div className="flex flex-col gap-0.5 px-3 flex-1">
          {SIDEBAR.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
              style={{
                background: i === 0 ? "var(--accent-bg)" : "transparent",
                color: i === 0 ? "var(--accent)" : "var(--foreground-muted)",
              }}
            >
              <Icon size={14} strokeWidth={i === 0 ? 2.2 : 1.8} />
              <span className="text-[11.5px]" style={{ fontWeight: i === 0 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>
            <Settings size={14} strokeWidth={1.8} />
            <span className="text-[11.5px]">Paramètres</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-1.5 px-5 h-12 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[10px] px-2 py-1 rounded-md" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>DEV</span>
          <span className="text-[10px] px-2 py-1 rounded-md" style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>Manager</span>
          <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>Serveur</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-hidden p-5 space-y-4">
          {/* Header */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Mon tableau de bord</p>
            <h3 className="text-[20px] font-semibold leading-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>Bonjour, Rayan 👋</h3>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Samedi 30 Mai</p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, title: "Retard", sub: "Déclarer" },
              { icon: MessageSquare, title: "Avis client", sub: "Signaler" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
                  <Icon size={15} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>{title}</p>
                  <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Protocoles banner */}
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(192,57,43,0.12)" }}>
              <BookOpen size={14} style={{ color: "var(--danger)" }} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>3 protocoles obligatoires à lire</p>
              <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Appuie pour voir la liste</p>
            </div>
            <ChevronRight size={15} style={{ color: "var(--foreground-dim)" }} />
          </div>

          {/* Two columns */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1.45fr 1fr" }}>
            {/* Left col */}
            <div className="space-y-3">
              {/* Mes tâches */}
              <div className="rounded-xl p-3.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <ListChecks size={13} style={{ color: "var(--accent)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Mes tâches</span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--accent)" }}>Voir tout</span>
                </div>
                {[
                  { label: "Aujourd'hui", done: 3, total: 5, pct: 60 },
                  { label: "Cette semaine", done: 18, total: 35, pct: 51 },
                ].map(({ label, done, total, pct }) => (
                  <div key={label} className="mb-2.5 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                      <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>{done}/{total} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--background-hover)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Retours clients */}
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={13} style={{ color: "var(--accent)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Retours clients</span>
                  </div>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--accent)" }}><Plus size={10} strokeWidth={2.5} />Signaler</span>
                </div>
                {[
                  { tag: "Compliment", tagColor: "var(--success)", table: "Table 5", text: "Le client a adoré le risotto aux champignons.", date: "29 mai", react: "👍 J'ai aussi · 2" },
                  { tag: "Plainte", tagColor: "var(--danger)", table: "Table 12", text: "Attente trop longue, 45 minutes pour les entrées.", date: "28 mai", react: "🔥 Confirme · 3" },
                ].map(({ tag, tagColor, table, text, date, react }) => (
                  <div key={text} className="px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${tagColor}1f`, color: tagColor }}>{tag}</span>
                      <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{table}</span>
                      <span className="ml-auto text-[9px]" style={{ color: "var(--foreground-dim)" }}>{date}</span>
                    </div>
                    <p className="text-[11px] mb-1.5" style={{ color: "var(--foreground)" }}>{text}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>{react}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-3">
              {/* Défis */}
              <div className="rounded-xl p-3.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Trophy size={13} style={{ color: "var(--accent)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Défis en cours</span>
                </div>
                {[
                  { label: "100 avis Google ce mois", pct: 63, color: "var(--accent)" },
                  { label: "Zéro retard cette semaine", pct: 56, color: "var(--warning)" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="mb-2.5 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                      <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--background-hover)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Classement */}
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <TrendingUp size={13} style={{ color: "var(--accent)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Classement</span>
                </div>
                {[
                  { rank: "🥇", init: "YB", name: "Yasmine Benali", pts: 68 },
                  { rank: "🥈", init: "DM", name: "Dev Mode", pts: 45 },
                  { rank: "🥉", init: "RD", name: "Rayan (toi)", pts: 23, me: true },
                ].map(({ rank, init, name, pts, me }) => (
                  <div key={name} className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <span className="text-[11px]">{rank}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{init}</div>
                    <span className="flex-1 text-[10.5px] truncate" style={{ color: "var(--foreground)", fontWeight: me ? 600 : 400 }}>{name}</span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>⭐ {pts}</span>
                  </div>
                ))}
              </div>

              {/* Mon score */}
              <div className="rounded-xl p-3.5" style={{ background: "var(--accent-bg)", border: "1px solid rgba(15,81,50,0.2)" }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "var(--accent)" }}>Mon score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold leading-none" style={{ color: "var(--accent)" }}>23</span>
                  <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>3ème sur 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Mobile mockup — écran PWA, mode clair                            */
/* ---------------------------------------------------------------- */

const MOBILE_NAV = [
  { icon: LayoutGrid, label: "Dashboard" },
  { icon: MessageSquare, label: "Clients" },
  { icon: BookOpen, label: "Protocoles" },
  { icon: ListChecks, label: "Tâches" },
  { icon: Users, label: "Équipe" },
  { icon: Sparkles, label: "Planning IA" },
];

function MobileMockup() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Content (sous la Dynamic Island) */}
      <div className="flex-1 overflow-hidden px-4 space-y-3" style={{ paddingTop: 54 }}>
        <div>
          <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Tableau de bord</p>
          <h3 className="text-[17px] font-semibold leading-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>Bonjour, Rayan 👋</h3>
          <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Samedi 30 Mai</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: "3/5", label: "Tâches du jour", accent: true },
            { val: "23", label: "Mon score" },
          ].map(({ val, label, accent }) => (
            <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="text-[18px] font-bold leading-none mb-0.5" style={{ color: accent ? "var(--accent)" : "var(--foreground)" }}>{val}</p>
              <p className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Mes tâches */}
        <div className="rounded-xl p-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks size={12} style={{ color: "var(--accent)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>Mes tâches</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Aujourd&apos;hui</span>
            <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>3/5 · 60%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--background-hover)" }}>
            <div className="h-full rounded-full" style={{ width: "60%", background: "var(--accent)" }} />
          </div>
        </div>

        {/* Retour client */}
        <div className="rounded-xl p-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}>Compliment</span>
            <span className="text-[8px]" style={{ color: "var(--foreground-dim)" }}>Table 5</span>
            <span className="ml-auto text-[8px]" style={{ color: "var(--foreground-dim)" }}>29 mai</span>
          </div>
          <p className="text-[10.5px]" style={{ color: "var(--foreground)" }}>Le client a adoré le risotto aux champignons.</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="grid grid-cols-6 px-1 pt-2"
        style={{ background: "var(--background-elev)", borderTop: "1px solid var(--border)", paddingBottom: 18 }}
      >
        {MOBILE_NAV.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon size={16} strokeWidth={i === 0 ? 2.2 : 1.7} style={{ color: i === 0 ? "var(--accent)" : "var(--foreground-dim)" }} />
            <span className="text-[7px]" style={{ color: i === 0 ? "var(--accent)" : "var(--foreground-dim)", fontWeight: i === 0 ? 600 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Section                                                          */
/* ---------------------------------------------------------------- */

export default function AppPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            [ APERÇU ]
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight"
            style={{ fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            L&apos;app. Telle qu&apos;elle est.
          </h2>
        </motion.div>

        {/* Preview desktop — frame navigateur */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="hidden md:block mb-10"
        >
          <div
            className="rounded-xl overflow-hidden mx-auto"
            style={{
              maxWidth: 1000,
              border: "1px solid var(--border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "#ffffff", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#10B981", opacity: 0.7 }} />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded text-[11px] font-mono text-center"
                style={{ background: "#f5f5f0", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
              >
                app.karaf.fr
              </div>
            </div>
            <DesktopMockup />
          </div>
        </motion.div>

        {/* Preview mobile — iPhone frame, écran PWA centré */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex justify-center md:hidden"
        >
          {/* iPhone body */}
          <div className="relative" style={{ width: 280, height: 580 }}>
            <div
              className="absolute inset-0 rounded-[44px]"
              style={{ background: "#1C1C1E", boxShadow: "0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,0.22)" }}
            />
            {/* Side buttons */}
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 120, width: 3, height: 32, background: "#3A3A3C" }} />
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 164, width: 3, height: 52, background: "#3A3A3C" }} />
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 228, width: 3, height: 52, background: "#3A3A3C" }} />
            <div className="absolute rounded-l-sm" style={{ right: -3, top: 164, width: 3, height: 76, background: "#3A3A3C" }} />
            {/* Screen */}
            <div
              className="absolute overflow-hidden rounded-[36px]"
              style={{ inset: 10 }}
            >
              {/* Dynamic Island */}
              <div
                className="absolute z-20 rounded-full"
                style={{ top: 12, left: "50%", transform: "translateX(-50%)", width: 108, height: 30, background: "#000" }}
              />
              <MobileMockup />
              {/* Home indicator */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full z-10"
                style={{ width: 100, height: 4, background: "rgba(0,0,0,0.18)" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center font-mono text-[11px] mt-8"
          style={{ color: "var(--foreground-dim)" }}
        >
          Dashboard · Tâches · Protocoles · Retours clients · Challenges
        </motion.p>
      </div>
    </section>
  );
}
