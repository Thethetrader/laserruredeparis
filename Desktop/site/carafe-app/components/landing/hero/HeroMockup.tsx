"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, MessageSquare, Users, Clock,
  Trophy, Settings, Plus,
  AlertCircle, TrendingUp,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: BookOpen, label: "Protocoles" },
  { icon: MessageSquare, label: "Retours clients" },
  { icon: Users, label: "Équipe" },
  { icon: Clock, label: "Retards" },
  { icon: Trophy, label: "Challenges" },
  { icon: Settings, label: "Paramètres" },
];

function Sidebar({ active }: { active: number }) {
  return (
    <div className="flex flex-col" style={{ width: 40, background: "var(--background)", borderRight: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="flex items-center justify-center h-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-bold text-[9px]" style={{ color: "var(--accent)", letterSpacing: "0.05em" }}>C</span>
      </div>
      <div className="flex flex-col items-center gap-1 py-2 flex-1">
        {NAV.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            title={label}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              background: i === active ? "rgba(6,182,212,0.12)" : "transparent",
              border: i === active ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent",
              color: i === active ? "var(--accent)" : "var(--foreground-dim)",
            }}
          >
            <Icon size={12} strokeWidth={i === active ? 2 : 1.5} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ fontSize: 10 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
        <div>
          <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Mercredi 20 mai</p>
          <p className="font-semibold text-[11px]" style={{ color: "var(--foreground)" }}>Vue d&apos;ensemble</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>DEV</span>
          <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.3)" }}>Manager</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-3 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: "3", label: "Retards" },
            { val: "14", label: "Avis clients", accent: true },
            { val: "2", label: "Défis actifs" },
            { val: "2", label: "En attente", accent: true },
          ].map(({ val, label, accent }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="font-bold text-[13px] leading-none mb-0.5" style={{ color: accent ? "var(--accent)" : "var(--foreground)" }}>{val}</p>
              <p className="text-[7px] leading-tight" style={{ color: "var(--foreground-dim)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Classement */}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--background-elev)" }}>
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <TrendingUp size={9} style={{ color: "var(--accent)" }} />
            <span className="text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>Classement équipe</span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {[
              { rank: "🥇", init: "YB", name: "Yasmine Benali", role: "Chef de salle", score: 92, bar: 92, tag: "Ponctuel", tagColor: "rgba(16,185,129,0.15)", tagText: "#10b981" },
              { rank: "🥈", init: "DM", name: "Dev Mode", role: "Responsable", score: 78, bar: 78, tag: "1 retard", tagColor: "rgba(245,158,11,0.12)", tagText: "#f59e0b" },
              { rank: "🥉", init: "RD", name: "Rayan Dupont", role: "Serveur", score: 61, bar: 61, tag: "2 retards", tagColor: "rgba(239,68,68,0.12)", tagText: "#ef4444" },
            ].map(({ rank, init, name, role, score, bar, tag, tagColor, tagText }) => (
              <div key={name} className="flex items-center gap-2 px-3 py-2">
                <span className="text-[10px]">{rank}</span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)" }}>{init}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-medium truncate" style={{ color: "var(--foreground)" }}>{name}</span>
                    <span className="text-[7px] px-1 rounded" style={{ background: tagColor, color: tagText, flexShrink: 0 }}>{tag}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${bar}%`, background: "var(--accent)" }} />
                  </div>
                </div>
                <span className="font-bold text-[10px] flex-shrink-0" style={{ color: "var(--accent)" }}>{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retours clients summary */}
        <div className="rounded-lg p-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare size={9} style={{ color: "var(--accent)" }} />
            <span className="text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>Retours clients ce mois</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "9", label: "Positifs", color: "#10b981" },
              { val: "5", label: "Négatifs", color: "#f59e0b" },
              { val: "3", label: "Plats", color: "var(--accent)" },
              { val: "2", label: "Service", color: "#8b5cf6" },
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

function ProtocolesScreen() {
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
        <div>
          <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>PROTOCOLES</p>
          <p className="font-semibold text-[11px]" style={{ color: "var(--foreground)" }}>8 protocoles · 7 catégories</p>
        </div>
        <button className="flex items-center gap-1 text-[8px] px-2 py-1 rounded-md" style={{ background: "var(--accent)", color: "#09090B" }}>
          <Plus size={8} strokeWidth={2.5} /> Nouveau
        </button>
      </div>
      <div className="flex-1 p-3 overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          {categories.map(({ emoji, label, count }) => (
            <div key={label} className="rounded-lg p-3 flex items-center gap-2 group cursor-pointer transition-colors" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <span className="text-[16px] leading-none">{emoji}</span>
              <div>
                <p className="text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
                <p className="text-[7px]" style={{ color: "var(--foreground-dim)" }}>{count} protocole{count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RetoursScreen() {
  const items = [
    { init: "YB", name: "Yasmine B.", cat: "PLAT", catBg: "rgba(6,182,212,0.12)", catColor: "var(--accent)", ton: "▼ Négatif", tonBg: "rgba(245,158,11,0.12)", tonColor: "#f59e0b", item: "Risotto aux champignons", text: "trop salé, il a pas fini son assiette", echo: 3, revient: true, echoed: false, ago: "12 min" },
    { init: "KM", name: "Karim M.", cat: "SERVICE", catBg: "rgba(139,92,246,0.12)", catColor: "#8b5cf6", ton: "▲ Positif", tonBg: "rgba(16,185,129,0.12)", tonColor: "#10b981", item: "Accueil en salle", text: "super accueil, ils reviendront", echo: 1, revient: false, echoed: true, ago: "34 min" },
    { init: "JD", name: "Julie D.", cat: "BOISSON", catBg: "rgba(245,158,11,0.12)", catColor: "#f59e0b", ton: "▼ Négatif", tonBg: "rgba(245,158,11,0.12)", tonColor: "#f59e0b", item: "Vin blanc maison", text: "pas assez frais", echo: 0, revient: false, echoed: false, ago: "1h" },
  ];
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
        <div>
          <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>RETOURS CLIENTS</p>
          <p className="font-semibold text-[11px]" style={{ color: "var(--foreground)" }}>4 retours · 7 jours</p>
        </div>
        <div className="flex gap-1">
          {["Tous","▼ Négatif","▲ Positif"].map(t => (
            <span key={t} className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-3 space-y-2">
        {items.map(({ init, name, cat, catBg, catColor, ton, tonBg, tonColor, item, text, echo, revient, echoed, ago }) => (
          <div key={name + item} className="rounded-lg overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)" }}>{init}</div>
                <span className="text-[8px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                <span className="text-[6px]" style={{ color: "var(--foreground-dim)" }}>· il y a {ago}</span>
                {revient && <span className="ml-auto text-[6px] font-mono px-1 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>ÇA REVIENT</span>}
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[6px] font-mono px-1 py-0.5 rounded" style={{ background: catBg, color: catColor }}>{cat}</span>
                <span className="text-[6px] px-1 py-0.5 rounded" style={{ background: tonBg, color: tonColor }}>{ton}</span>
              </div>
              <p className="text-[9px] font-medium mb-0.5" style={{ color: "var(--foreground)" }}>{item}</p>
              <p className="text-[8px] leading-relaxed" style={{ color: "var(--foreground-dim)", fontStyle: "italic" }}>« {text} »</p>
              {echo > 0 && <p className="text-[7px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{echo} collègues ont entendu pareil</p>}
            </div>
            <div className="flex items-center justify-center py-1.5 text-[7px] font-medium" style={{ background: echoed ? "rgba(16,185,129,0.08)" : "rgba(6,182,212,0.06)", color: echoed ? "#10b981" : "var(--accent)", borderTop: "1px solid var(--border)" }}>
              {echoed ? "✓ Entendu (toi inclus)" : "+1 J'ai entendu pareil"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  { label: "Protocoles", icon: BookOpen, nav: 1, content: <ProtocolesScreen /> },
  { label: "Retours clients", icon: MessageSquare, nav: 2, content: <RetoursScreen /> },
  { label: "Dashboard", icon: LayoutDashboard, nav: 0, content: <DashboardScreen /> },
];

export default function HeroMockup() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const switchTo = useCallback((idx: number) => {
    if (idx === active || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 180);
  }, [active, animating]);

  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % SCREENS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative" style={{ width: 460, maxWidth: "100%", transform: "perspective(2000px) rotateY(-6deg) rotateX(2deg)" }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl" style={{ transform: "scale(1.06)", filter: "blur(32px)", background: "rgba(6,182,212,0.08)", zIndex: -1 }} />

      {/* Window chrome */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
          </div>
          <div className="flex-1 mx-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px]" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)", maxWidth: 200 }}>
              <AlertCircle size={7} />
              <span>app.joinkaraf.com</span>
            </div>
          </div>
          <div className="flex gap-1">
            {SCREENS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => switchTo(i)}
                className="text-[7px] px-2 py-0.5 rounded transition-colors"
                style={{
                  background: active === i ? "rgba(6,182,212,0.15)" : "transparent",
                  color: active === i ? "var(--accent)" : "var(--foreground-dim)",
                  border: `1px solid ${active === i ? "rgba(6,182,212,0.3)" : "transparent"}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ height: 380 }}>
          <Sidebar active={SCREENS[active].nav} />
          {/* Content area */}
          <div
            className="flex-1 flex flex-col overflow-hidden transition-opacity duration-200"
            style={{ opacity: animating ? 0 : 1, background: "var(--background-soft)" }}
          >
            {SCREENS[active].content}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 py-2" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
          {SCREENS.map((_, i) => (
            <button key={i} onClick={() => switchTo(i)} className="rounded-full transition-all" style={{ width: active === i ? 16 : 6, height: 6, background: active === i ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
