"use client";

import { CheckCircle2, Circle, MessageSquare, Trophy, BookOpen, Clock, ChevronRight, Check, ThumbsUp } from "lucide-react";

const feedbacks = [
  { id: "f1", tag: "Compliments", color: "#10b981", bg: "rgba(16,185,129,0.1)", content: "Table 5 a adoré le risotto.", time: "il y a 12 min" },
  { id: "f2", tag: "Plaintes", color: "#ef4444", bg: "rgba(239,68,68,0.1)", content: "Attente trop longue table 12.", time: "il y a 34 min" },
  { id: "f3", tag: "Suggestions", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", content: "Ajouter des options véganes.", time: "il y a 1h" },
];

const tasks = [
  { title: "Ouverture caisse", done: true, cat: "Ouverture" },
  { title: "Contrôle frigos", done: true, cat: "Ouverture" },
  { title: "Briefing équipe", done: true, cat: "Ouverture" },
  { title: "Fermeture caisse", done: false, cat: "Fermeture" },
  { title: "Nettoyage salle", done: false, cat: "Fermeture" },
];

const leaderboard = [
  { name: "Yasmine B.", score: 68, badge: "🥇" },
  { name: "Dev Mode", score: 45, badge: "🥈" },
  { name: "Rayan D.", score: 23, badge: "🥉" },
];

export default function AppPreviewPage() {
  return (
    <div style={{ background: "#09090B", minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: "#e4e4e7", fontSize: 13 }}>
      {/* TopBar */}
      <div style={{ background: "#111113", borderBottom: "1px solid #27272a", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#06b6d4" }}>K</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>La Brasserie</span>
        </div>
        <span style={{ fontSize: 11, color: "#71717a" }}>Bonjour, Rayan 👋</span>
      </div>

      <div style={{ padding: "16px 16px 80px" }}>

        {/* Actions rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
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
              <CheckCircle2 size={13} color="#06b6d4" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Mes tâches</span>
            </div>
            <span style={{ fontSize: 11, color: "#06b6d4" }}>Voir tout →</span>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11 }}>Aujourd'hui</span>
              <span style={{ fontSize: 11, color: "#71717a" }}>3/5 · 60%</span>
            </div>
            <div style={{ height: 5, background: "#27272a", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "60%", height: "100%", background: "#06b6d4", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ padding: "10px 14px 4px" }}>
            {tasks.map(t => (
              <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #1c1c1f" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${t.done ? "rgba(16,185,129,0.5)" : "#27272a"}`, background: t.done ? "rgba(16,185,129,0.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.done && <Check size={9} color="#10b981" />}
                </div>
                <span style={{ fontSize: 12, color: t.done ? "#52525b" : "#e4e4e7", textDecoration: t.done ? "line-through" : "none", flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 10, color: "#52525b" }}>{t.cat}</span>
              </div>
            ))}
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
                <span style={{ fontSize: 10, color: "#52525b", marginLeft: "auto" }}>{f.time}</span>
              </div>
              <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>{f.content}</p>
            </div>
          ))}
        </div>

        {/* Classement */}
        <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Trophy size={13} color="#06b6d4" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Classement</span>
            </div>
          </div>
          {leaderboard.map((m, i) => (
            <div key={m.name} style={{ padding: "10px 14px", borderBottom: i < leaderboard.length - 1 ? "1px solid #1c1c1f" : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{m.badge}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{m.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#06b6d4" }}>⭐ {m.score}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111113", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-around", padding: "10px 0 16px" }}>
        {[
          { icon: "⊞", label: "Dashboard" },
          { icon: "✓", label: "Tâches" },
          { icon: "📋", label: "Protocoles" },
          { icon: "💬", label: "Avis" },
          { icon: "🏆", label: "Défis" },
        ].map(n => (
          <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: "#71717a" }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
