"use client";

import { useState } from "react";

const tasks = [
  { id: "t1", title: "Ouverture caisse", category: "opening", role: "Manager", requiresPhoto: true, critical: true, done: true, by: "Yasmine B.", at: "il y a 2h", photo: true },
  { id: "t2", title: "Contrôle température frigos", category: "opening", role: "Manager", requiresPhoto: true, critical: true, done: true, by: "Yasmine B.", at: "il y a 2h", photo: true },
  { id: "t3", title: "Briefing équipe", category: "opening", role: "Manager", requiresPhoto: false, critical: false, done: false, by: null, at: null, photo: false },
  { id: "t4", title: "Mise en place de la salle", category: "opening", role: "Salle", requiresPhoto: false, critical: false, done: true, by: "Rayan D.", at: "il y a 3h", photo: false },
  { id: "t5", title: "Mise en place cuisine", category: "opening", role: "Cuisine", requiresPhoto: false, critical: false, done: false, by: null, at: null, photo: false },
  { id: "t6", title: "Fermeture caisse", category: "closing", role: "Manager", requiresPhoto: true, critical: true, done: false, by: null, at: null, photo: false },
  { id: "t7", title: "Nettoyage salle", category: "closing", role: "Salle", requiresPhoto: false, critical: false, done: false, by: null, at: null, photo: false },
  { id: "t8", title: "Nettoyage hotte", category: "closing", role: "Cuisine", requiresPhoto: true, critical: true, done: false, by: null, at: null, photo: false },
];

const catchupTasks = [
  { id: "c1", title: "Contrôle fermeture des points sensibles", role: "Manager" },
  { id: "c2", title: "Plonge terminée", role: "Cuisine" },
];

const oneShotTasks = [
  { id: "os1", title: "Vérifier livraison vin", desc: "Commercial Durand vers 10h", role: "Manager" },
];

// Demo: simulate the current logged-in user
const CURRENT_USER = "Vous";

type TaskClaim = { by: string; at: string };
type TaskDone = { by: string; at: string };
type TaskStatus = { claim?: TaskClaim; done?: TaskDone };

type FilterType = "all" | "Manager" | "Salle" | "Cuisine" | "Bar";

export default function TasksDemo() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [taskStatus, setTaskStatus] = useState<Record<string, TaskStatus>>({});
  const [modal, setModal] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string[]>([]);
  const [justClaimed, setJustClaimed] = useState<string[]>([]);

  const filtered = tasks.filter(t => filter === "all" || t.role === filter);
  const opening = filtered.filter(t => t.category === "opening");
  const closing = filtered.filter(t => t.category === "closing");

  const totalDone = tasks.filter(t => t.done || taskStatus[t.id]?.done).length
    + oneShotTasks.filter(t => taskStatus[t.id]?.done).length;
  const total = tasks.length + oneShotTasks.length;
  const pct = Math.round((totalDone / total) * 100);

  function claim(id: string) {
    setTaskStatus(s => ({ ...s, [id]: { ...s[id], claim: { by: CURRENT_USER, at: "à l'instant" } } }));
    setJustClaimed(prev => [...prev, id]);
    setTimeout(() => setJustClaimed(prev => prev.filter(x => x !== id)), 1800);
  }

  function validate(id: string) {
    setTaskStatus(s => ({ ...s, [id]: { ...s[id], done: { by: CURRENT_USER, at: "à l'instant" } } }));
    setJustDone(prev => [...prev, id]);
    setTimeout(() => setJustDone(prev => prev.filter(x => x !== id)), 1800);
    setModal(null);
  }

  const styles = {
    page: { background: "#09090B", minHeight: "100vh", color: "#FAFAFA", fontFamily: "system-ui, sans-serif", padding: "24px 16px 120px" } as React.CSSProperties,
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 } as React.CSSProperties,
    mono: { fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#71717A" },
    addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(6,182,212,0.1)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.2)", fontSize: 12, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    statCard: { background: "#1A1A1F", border: "1px solid #27272A", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 } as React.CSSProperties,
    filters: { display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" as const },
    filterBtn: (active: boolean) => ({ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: active ? "rgba(6,182,212,0.1)" : "#1A1A1F", color: active ? "#06B6D4" : "#71717A", border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid #27272A" }) as React.CSSProperties,
    section: { marginBottom: 16 } as React.CSSProperties,
    sectionHeader: { background: "#1A1A1F", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px 12px 0 0", borderBottom: "1px solid #1F1F23" } as React.CSSProperties,
    taskRow: (done: boolean, flash: boolean, inProgress: boolean) => ({
      display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
      background: flash ? "rgba(16,185,129,0.08)" : done ? "rgba(16,185,129,0.04)" : inProgress ? "rgba(245,158,11,0.04)" : "#09090B",
      borderBottom: "1px solid #1F1F23", transition: "all 0.3s",
    }) as React.CSSProperties,
    claimBtn: { padding: "6px 12px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 } as React.CSSProperties,
    validateBtn: { padding: "6px 12px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 } as React.CSSProperties,
    lockedBtn: { padding: "6px 12px", borderRadius: 6, background: "#1A1A1F", color: "#3F3F46", border: "1px solid #27272A", fontSize: 11, fontWeight: 600, flexShrink: 0 } as React.CSSProperties,
    catchupBanner: { background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 12, overflow: "hidden", marginBottom: 16, boxShadow: "0 0 16px rgba(6,182,212,0.06)" } as React.CSSProperties,
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, zIndex: 50 },
    modalBox: { width: "100%", maxWidth: 420, background: "#1A1A1F", border: "1px solid #27272A", borderRadius: 20, padding: 20 } as React.CSSProperties,
  };

  const TaskCard = ({ task, isCatchup = false }: { task: typeof tasks[0] | typeof catchupTasks[0]; isCatchup?: boolean }) => {
    const fullTask = tasks.find(t => t.id === task.id) ?? { ...task as typeof tasks[0], done: false, requiresPhoto: false, critical: false, by: null, at: null, photo: false };
    const status = taskStatus[task.id] ?? {};
    const isDone = fullTask.done || !!status.done;
    const claimedBy = fullTask.done ? fullTask.by : status.claim?.by ?? null;
    const doneBy = fullTask.done ? fullTask.by : status.done?.by ?? null;
    const doneAt = fullTask.done ? fullTask.at : status.done?.at ?? null;
    const isClaimedByMe = claimedBy === CURRENT_USER;
    const isClaimedBySomeoneElse = !!claimedBy && claimedBy !== CURRENT_USER;
    const isInProgress = !!claimedBy && !isDone;
    const flash = justDone.includes(task.id);
    const flashClaim = justClaimed.includes(task.id);

    return (
      <div style={{ ...styles.taskRow(isDone, flash, isInProgress && !flash), outline: flashClaim ? "1px solid rgba(245,158,11,0.4)" : "none" }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          {isDone
            ? <span style={{ color: "#10B981", fontSize: 18 }}>✓</span>
            : isInProgress
              ? <span style={{ color: "#F59E0B", fontSize: 18 }}>◎</span>
              : <span style={{ color: "#3F3F46", fontSize: 18 }}>○</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? "#71717A" : "#FAFAFA", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </span>
            {"critical" in fullTask && fullTask.critical && (
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>⚠ HACCP</span>
            )}
            {"requiresPhoto" in fullTask && fullTask.requiresPhoto && !isDone && (
              <span style={{ fontSize: 11, color: "#71717A" }}>📷</span>
            )}
          </div>

          {/* Status line */}
          {isDone && doneBy && (
            <p style={{ fontSize: 11, color: "#71717A", margin: "2px 0 0" }}>{doneBy} · {doneAt}</p>
          )}
          {isInProgress && (
            <p style={{ fontSize: 11, color: "#F59E0B", margin: "2px 0 0" }}>
              En cours · {claimedBy}{status.claim?.at ? ` · ${status.claim.at}` : ""}
            </p>
          )}
          {isCatchup && <p style={{ fontSize: 11, color: "#06B6D4", margin: "2px 0 0" }}>hier</p>}

          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: "#1A1A1F", color: "#71717A", display: "inline-block", marginTop: 4 }}>
            {task.role}
          </span>
        </div>

        {/* Actions */}
        {!isDone && !isInProgress && (
          <button style={styles.claimBtn} onClick={() => claim(task.id)}>
            Prendre en charge
          </button>
        )}
        {!isDone && isClaimedByMe && (
          <button style={styles.validateBtn} onClick={() => setModal(task.id)}>
            Valider
          </button>
        )}
        {!isDone && isClaimedBySomeoneElse && (
          <span style={styles.lockedBtn}>Pris en charge</span>
        )}
      </div>
    );
  };

  const SectionBlock = ({ title, icon, items }: { title: string; icon: string; items: typeof tasks; cat: string }) => {
    const done = items.filter(t => t.done || taskStatus[t.id]?.done).length;
    return (
      <div style={{ ...styles.section, border: "1px solid #27272A", borderRadius: 12, overflow: "hidden" }}>
        <div style={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: done === items.length ? "rgba(16,185,129,0.12)" : "#09090B", color: done === items.length ? "#10B981" : "#71717A" }}>
              {done}/{items.length}
            </span>
          </div>
        </div>
        {items.map(t => <TaskCard key={t.id} task={t} />)}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.mono}>Tâches du jour</span>
        <button style={styles.addBtn}>+ Tâche ponctuelle</button>
      </div>

      {/* Stats */}
      <div style={styles.statCard}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {totalDone} <span style={{ fontSize: 14, fontWeight: 400, color: "#71717A" }}>/ {total}</span>
          </div>
          <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>tâches validées · {pct}%</div>
        </div>
        <svg viewBox="0 0 36 36" style={{ width: 48, height: 48, transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke="#27272A" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#06B6D4" strokeWidth="3"
            strokeDasharray={`${pct * 0.942} 100`} strokeLinecap="round" />
        </svg>
      </div>

      {/* Catchup banner */}
      {catchupTasks.length > 0 && (
        <div style={styles.catchupBanner}>
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(6,182,212,0.15)" }}>
            <span style={{ fontSize: 13, color: "#06B6D4" }}>↺</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#06B6D4" }}>Tâches à rattraper · hier</span>
          </div>
          {catchupTasks.map(t => <TaskCard key={t.id} task={t as typeof tasks[0]} isCatchup />)}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        {(["all", "Manager", "Salle", "Cuisine", "Bar"] as FilterType[]).map(f => (
          <button key={f} style={styles.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f === "all" ? "Tous" : f}
          </button>
        ))}
      </div>

      {/* Tasks by category */}
      {opening.length > 0 && <SectionBlock title="Ouverture" icon="🌅" items={opening} cat="opening" />}
      {closing.length > 0 && <div style={{ marginTop: 16 }}><SectionBlock title="Fermeture" icon="🌙" items={closing} cat="closing" /></div>}

      {/* One-shot tasks */}
      {oneShotTasks.length > 0 && (
        <div style={{ ...styles.section, marginTop: 16, border: "1px solid #27272A", borderRadius: 12, overflow: "hidden" }}>
          <div style={styles.sectionHeader}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>⚡ Ponctuelles</span>
          </div>
          {oneShotTasks.map(t => {
            const status = taskStatus[t.id] ?? {};
            const isDone = !!status.done;
            const isClaimedByMe = status.claim?.by === CURRENT_USER && !isDone;
            const isClaimedBySomeoneElse = !!status.claim?.by && status.claim.by !== CURRENT_USER && !isDone;
            const isInProgress = !!status.claim?.by && !isDone;
            return (
              <div key={t.id} style={{ ...styles.taskRow(isDone, justDone.includes(t.id), isInProgress), outline: justClaimed.includes(t.id) ? "1px solid rgba(245,158,11,0.4)" : "none" }}>
                <span style={{ color: isDone ? "#10B981" : isInProgress ? "#F59E0B" : "#3F3F46", fontSize: 18, marginTop: 2 }}>
                  {isDone ? "✓" : isInProgress ? "◎" : "○"}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: isDone ? "#71717A" : "#FAFAFA", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: "#71717A", margin: "2px 0 4px" }}>{t.desc}</p>
                  {isInProgress && <p style={{ fontSize: 11, color: "#F59E0B", margin: "2px 0 4px" }}>En cours · {status.claim?.by}</p>}
                  {isDone && <p style={{ fontSize: 11, color: "#71717A", margin: "2px 0 4px" }}>{status.done?.by} · {status.done?.at}</p>}
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: "#1A1A1F", color: "#71717A" }}>{t.role}</span>
                </div>
                {!isDone && !isInProgress && (
                  <button style={styles.claimBtn} onClick={() => claim(t.id)}>Prendre en charge</button>
                )}
                {isClaimedByMe && (
                  <button style={styles.validateBtn} onClick={() => validate(t.id)}>Valider</button>
                )}
                {isClaimedBySomeoneElse && (
                  <span style={styles.lockedBtn}>Pris en charge</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal validation */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Valider la tâche</p>
                <p style={{ fontSize: 12, color: "#71717A", margin: "4px 0 0" }}>
                  {tasks.find(t => t.id === modal)?.title ?? oneShotTasks.find(t => t.id === modal)?.title}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ color: "#71717A", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
            {tasks.find(t => t.id === modal)?.requiresPhoto && (
              <div style={{ border: "2px dashed #3F3F46", borderRadius: 10, padding: "20px 16px", textAlign: "center", marginBottom: 12, color: "#71717A", fontSize: 13, cursor: "pointer" }}>
                📷 Ajouter une photo
              </div>
            )}
            <input placeholder="Notes (optionnel)" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#09090B", border: "1px solid #27272A", color: "#FAFAFA", fontSize: 13, marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#09090B", border: "1px solid #27272A", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={() => validate(modal)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#10B981", border: "none", color: "#09090B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Tâche validée ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
