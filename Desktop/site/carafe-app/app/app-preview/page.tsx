"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Trophy, Check, BookOpen, Clock, Circle, BarChart2 } from "lucide-react";

/* ── Données ── */
const tasks = [
  { title: "Ouverture caisse", cat: "Ouverture", done: true },
  { title: "Contrôle frigos", cat: "Ouverture", done: true },
  { title: "Briefing équipe", cat: "Ouverture", done: true },
  { title: "Fermeture caisse", cat: "Fermeture", done: false },
  { title: "Nettoyage salle", cat: "Fermeture", done: false },
];

const feedbacks = [
  { tag: "Compliments", color: "#10b981", bg: "rgba(16,185,129,0.1)", content: "Table 5 a adoré le risotto.", time: "12 min" },
  { tag: "Plaintes", color: "#ef4444", bg: "rgba(239,68,68,0.1)", content: "Attente trop longue table 12.", time: "34 min" },
  { tag: "Suggestions", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", content: "Ajouter des options véganes.", time: "1h" },
];

const protocols = [
  { title: "Normes HACCP Températures", tag: "Obligatoire", read: true },
  { title: "Procédure ouverture salle", tag: "Obligatoire", read: true },
  { title: "Gestion des allergènes", tag: "Lecture libre", read: false },
  { title: "Protocole fermeture cuisine", tag: "Obligatoire", read: false },
];

const leaderboard = [
  { name: "Yasmine B.", score: 68, badge: "🥇", job: "Chef de salle" },
  { name: "Rayan D.", score: 45, badge: "🥈", job: "Serveur" },
  { name: "Marc L.", score: 23, badge: "🥉", job: "Barman" },
];

const SCREENS = ["dashboard", "tasks", "protocols", "feedback"] as const;
type Screen = typeof SCREENS[number];

const NAV = [
  { icon: "⊞", label: "Dashboard", screen: "dashboard" as Screen },
  { icon: "✓", label: "Tâches", screen: "tasks" as Screen },
  { icon: "📋", label: "Protocoles", screen: "protocols" as Screen },
  { icon: "💬", label: "Avis", screen: "feedback" as Screen },
];

/* ── Écrans ── */
function DashboardScreen() {
  return (
    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[{ label: "Retard", sub: "Déclarer", icon: "⏱" }, { label: "Avis client", sub: "Signaler", icon: "💬" }].map(a => (
          <div key={a.label} style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 16, marginBottom: 3 }}>{a.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</div>
            <div style={{ fontSize: 10, color: "#71717a" }}>{a.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={12} color="#06b6d4" />
            <span style={{ fontWeight: 600, fontSize: 12 }}>Mes tâches</span>
          </div>
          <span style={{ fontSize: 10, color: "#06b6d4" }}>Voir tout →</span>
        </div>
        <div style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10 }}>Aujourd&apos;hui</span>
            <span style={{ fontSize: 10, color: "#71717a" }}>3/5 · 60%</span>
          </div>
          <div style={{ height: 4, background: "#27272a", borderRadius: 99 }}>
            <div style={{ width: "60%", height: "100%", background: "#06b6d4", borderRadius: 99 }} />
          </div>
        </div>
      </div>

      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Trophy size={12} color="#06b6d4" />
            <span style={{ fontWeight: 600, fontSize: 12 }}>Classement</span>
          </div>
        </div>
        {leaderboard.map((m, i) => (
          <div key={m.name} style={{ padding: "8px 12px", borderBottom: i < leaderboard.length - 1 ? "1px solid #1c1c1f" : "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{m.badge}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11 }}>{m.name}</div>
              <div style={{ fontSize: 9, color: "#71717a" }}>{m.job}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4" }}>⭐ {m.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksScreen() {
  const [doneCount, setDoneCount] = useState(3);
  useEffect(() => {
    if (doneCount >= 5) return;
    const t = setTimeout(() => setDoneCount(n => Math.min(n + 1, 5)), 2500);
    return () => clearTimeout(t);
  }, [doneCount]);
  const pct = Math.round((doneCount / 5) * 100);
  return (
    <div style={{ padding: "12px 14px" }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 10 }}>Mes tâches</p>
      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10 }}>Aujourd&apos;hui</span>
            <span style={{ fontSize: 10, color: doneCount === 5 ? "#10b981" : "#71717a", transition: "color 0.3s" }}>{doneCount}/5 · {pct}%</span>
          </div>
          <div style={{ height: 4, background: "#27272a", borderRadius: 99 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: doneCount === 5 ? "#10b981" : "#06b6d4", borderRadius: 99, transition: "width 0.5s ease, background 0.3s" }} />
          </div>
        </div>
        {tasks.map((t, i) => {
          const done = i < doneCount;
          return (
            <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: i < tasks.length - 1 ? "1px solid #1c1c1f" : "none", transition: "all 0.3s" }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${done ? "rgba(16,185,129,0.5)" : "#27272a"}`, background: done ? "rgba(16,185,129,0.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                {done && <Check size={8} color="#10b981" />}
              </div>
              <span style={{ fontSize: 11, color: done ? "#52525b" : "#e4e4e7", textDecoration: done ? "line-through" : "none", flex: 1, transition: "all 0.3s" }}>{t.title}</span>
              <span style={{ fontSize: 9, color: "#52525b" }}>{t.cat}</span>
            </div>
          );
        })}
      </div>
      {doneCount === 5 && (
        <div style={{ textAlign: "center", padding: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 11, color: "#10b981" }}>
          ✓ Toutes les tâches du jour sont faites !
        </div>
      )}
    </div>
  );
}

function ProtocolsScreen() {
  return (
    <div style={{ padding: "12px 14px" }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 10 }}>Protocoles</p>
      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
        {protocols.map((p, i) => (
          <div key={p.title} style={{ padding: "10px 12px", borderBottom: i < protocols.length - 1 ? "1px solid #1c1c1f" : "none", display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={12} color={p.read ? "#10b981" : "#06b6d4"} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, color: p.read ? "#52525b" : "#e4e4e7" }}>{p.title}</p>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: p.read ? "rgba(16,185,129,0.1)" : "rgba(6,182,212,0.1)", color: p.read ? "#10b981" : "#06b6d4" }}>{p.tag}</span>
            </div>
            {p.read
              ? <Check size={12} color="#10b981" />
              : <span style={{ fontSize: 9, color: "#06b6d4", fontWeight: 600 }}>Lire →</span>
            }
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 10, fontSize: 10, color: "#06b6d4" }}>
        ✦ IA — Uploadez un PDF, les étapes sont extraites automatiquement
      </div>
    </div>
  );
}

function FeedbackScreen() {
  return (
    <div style={{ padding: "12px 14px" }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 10 }}>Retours clients</p>
      <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
        {feedbacks.map((f, i) => (
          <div key={f.tag + i} style={{ padding: "10px 12px", borderBottom: i < feedbacks.length - 1 ? "1px solid #1c1c1f" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: f.bg, color: f.color }}>{f.tag}</span>
              <span style={{ fontSize: 9, color: "#52525b", marginLeft: "auto" }}>il y a {f.time}</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#a1a1aa" }}>{f.content}</p>
            <button style={{ marginTop: 6, fontSize: 9, padding: "3px 8px", borderRadius: 5, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4", cursor: "pointer" }}>
              👍 Moi aussi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AppPreviewPage() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [visible, setVisible] = useState(true);

  // Auto-cycle screens
  useEffect(() => {
    const DURATION = 4000;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setScreen(s => {
          const idx = SCREENS.indexOf(s);
          return SCREENS[(idx + 1) % SCREENS.length];
        });
        setVisible(true);
      }, 300);
    }, DURATION);
    return () => clearInterval(timer);
  }, []);

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

      {/* Screen content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "tasks" && <TasksScreen />}
        {screen === "protocols" && <ProtocolsScreen />}
        {screen === "feedback" && <FeedbackScreen />}
      </div>

      {/* Bottom nav */}
      <div style={{ background: "#111113", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-around", padding: "10px 0 16px", flexShrink: 0 }}>
        {NAV.map(n => (
          <div
            key={n.label}
            onClick={() => { setVisible(false); setTimeout(() => { setScreen(n.screen); setVisible(true); }, 200); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}
          >
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: screen === n.screen ? "#06b6d4" : "#71717a", transition: "color 0.2s" }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
