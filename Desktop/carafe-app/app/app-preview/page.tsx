"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageSquare, Trophy, Check } from "lucide-react";

const feedbacks = [
  { id: "f1", tag: "Compliments", color: "#10b981", bg: "rgba(16,185,129,0.1)", content: "Table 5 a adoré le risotto aux champignons.", time: "12 min" },
  { id: "f2", tag: "Plaintes", color: "#ef4444", bg: "rgba(239,68,68,0.1)", content: "Attente trop longue table 12, 45 min.", time: "34 min" },
  { id: "f3", tag: "Suggestions", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", content: "Ajouter des options véganes.", time: "1h" },
];

const leaderboard = [
  { name: "Yasmine B.", score: 68, badge: "🥇" },
  { name: "Rayan D.", score: 45, badge: "🥈" },
  { name: "Marc L.", score: 23, badge: "🥉" },
];

export default function AppPreviewPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doneCount, setDoneCount] = useState(3);
  const [validating, setValidating] = useState(false);

  // Auto-scroll loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let direction = 1;
    let pos = 0;
    const maxScroll = el.scrollHeight - el.clientHeight;

    const interval = setInterval(() => {
      pos += direction * 1.2;
      if (pos >= maxScroll) { direction = -1; }
      if (pos <= 0) { direction = 1; }
      el.scrollTop = pos;
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // Auto-validate a task every 5s
  useEffect(() => {
    if (doneCount >= 5) return;
    const timer = setTimeout(() => {
      setValidating(true);
      setTimeout(() => {
        setDoneCount(n => Math.min(n + 1, 5));
        setValidating(false);
      }, 600);
    }, 5000);
    return () => clearTimeout(timer);
  }, [doneCount]);

  const tasks = [
    { title: "Ouverture caisse", cat: "Ouverture" },
    { title: "Contrôle frigos", cat: "Ouverture" },
    { title: "Briefing équipe", cat: "Ouverture" },
    { title: "Fermeture caisse", cat: "Fermeture" },
    { title: "Nettoyage salle", cat: "Fermeture" },
  ];

  const pct = Math.round((doneCount / 5) * 100);

  return (
    <div style={{ background: "#09090B", height: "844px", fontFamily: "system-ui, sans-serif", color: "#e4e4e7", fontSize: 13, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* TopBar */}
      <div style={{ background: "#111113", borderBottom: "1px solid #27272a", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#06b6d4" }}>K</div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>La Brasserie</span>
        </div>
        <span style={{ fontSize: 11, color: "#71717a" }}>Bonjour, Rayan 👋</span>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "scroll", padding: "14px 14px 16px", scrollbarWidth: "none" }}>

        {/* Actions rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ label: "Retard", sub: "Déclarer", icon: "⏱" }, { label: "Avis client", sub: "Signaler", icon: "💬" }].map(a => (
            <div key={a.label} style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: "#71717a" }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* Mes tâches */}
        <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={13} color={doneCount === 5 ? "#10b981" : "#06b6d4"} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Mes tâches</span>
            </div>
            <span style={{ fontSize: 11, color: "#06b6d4" }}>Voir tout →</span>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11 }}>Aujourd&apos;hui</span>
              <span style={{ fontSize: 11, color: "#71717a", transition: "all 0.4s" }}>{doneCount}/5 · {pct}%</span>
            </div>
            <div style={{ height: 5, background: "#27272a", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: doneCount === 5 ? "#10b981" : "#06b6d4", borderRadius: 99, transition: "width 0.5s ease, background 0.3s" }} />
            </div>
          </div>
          <div style={{ padding: "10px 14px 4px" }}>
            {tasks.map((t, i) => {
              const done = i < doneCount;
              const isValidating = validating && i === doneCount;
              return (
                <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #1c1c1f", transition: "all 0.3s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${done ? "rgba(16,185,129,0.5)" : isValidating ? "rgba(6,182,212,0.5)" : "#27272a"}`, background: done ? "rgba(16,185,129,0.12)" : isValidating ? "rgba(6,182,212,0.1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                    {done && <Check size={9} color="#10b981" />}
                  </div>
                  <span style={{ fontSize: 12, color: done ? "#52525b" : "#e4e4e7", textDecoration: done ? "line-through" : "none", flex: 1, transition: "all 0.3s" }}>{t.title}</span>
                  <span style={{ fontSize: 10, color: "#52525b" }}>{t.cat}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retours clients */}
        <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={13} color="#06b6d4" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Retours clients</span>
            </div>
            <span style={{ fontSize: 11, color: "#06b6d4" }}>Voir tout →</span>
          </div>
          {feedbacks.map(f => (
            <div key={f.id} style={{ padding: "10px 14px", borderBottom: "1px solid #1c1c1f" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: f.bg, color: f.color }}>{f.tag}</span>
                <span style={{ fontSize: 10, color: "#52525b", marginLeft: "auto" }}>il y a {f.time}</span>
              </div>
              <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>{f.content}</p>
            </div>
          ))}
        </div>

        {/* Classement */}
        <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={13} color="#06b6d4" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Classement</span>
          </div>
          {leaderboard.map((m, i) => (
            <div key={m.name} style={{ padding: "10px 14px", borderBottom: i < leaderboard.length - 1 ? "1px solid #1c1c1f" : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{m.badge}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{m.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#06b6d4" }}>⭐ {m.score}</span>
            </div>
          ))}
        </div>

        {/* Spacer pour scroll */}
        <div style={{ height: 60 }} />
      </div>

      {/* Bottom nav */}
      <div style={{ background: "#111113", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-around", padding: "10px 0 16px", flexShrink: 0 }}>
        {[
          { icon: "⊞", label: "Dashboard", active: true },
          { icon: "✓", label: "Tâches", active: false },
          { icon: "📋", label: "Protocoles", active: false },
          { icon: "💬", label: "Avis", active: false },
          { icon: "🏆", label: "Défis", active: false },
        ].map(n => (
          <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: n.active ? "#06b6d4" : "#71717a" }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
