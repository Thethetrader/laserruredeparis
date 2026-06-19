"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Calendar, Clock, ChevronRight, MessageSquare, Users, ArrowLeft, Pencil, Send } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type RequestType = "leave" | "unavailability" | "late" | "early_leave" | "shift_swap" | "other";
type RequestStatus =
  | "pending_employee_confirmation"
  | "pending_manager"
  | "approved"
  | "rejected"
  | "cancelled";

interface StaffRequest {
  id: string;
  profile_id: string;
  employee_name: string;
  employee_avatar?: string | null;
  request_type: RequestType;
  dates: string[] | null;
  time_requested: string | null;
  reason: string | null;
  summary: string;
  original_message: string;
  status: RequestStatus;
  manager_note: string | null;
  created_at: string;
  confirmed_by_employee_at: string | null;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<RequestType, string> = {
  leave: "Congé",
  unavailability: "Indispo",
  late: "Retard",
  early_leave: "Départ",
  shift_swap: "Échange",
  other: "Autre",
};

const TYPE_COLORS: Record<RequestType, string> = {
  leave: "#8B5CF6",
  unavailability: "#F59E0B",
  late: "#EF4444",
  early_leave: "#F97316",
  shift_swap: "#06B6D4",
  other: "#71717A",
};

function fmtDateShort(dates: string[] | null) {
  if (!dates?.length) return "—";
  if (dates.length === 1) {
    const d = new Date(dates[0] + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  const first = new Date(dates[0] + "T12:00:00");
  const last = new Date(dates[dates.length - 1] + "T12:00:00");
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.getDate()}–${last.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  }
  return `${first.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${last.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

function fmtDates(dates: string[] | null) {
  if (!dates?.length) return null;
  return dates
    .map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }))
    .join(", ");
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarBg(name: string) {
  const hues = [210, 280, 340, 30, 160, 50, 190];
  return `hsl(${hues[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % hues.length]},55%,40%)`;
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */
function EmpAvatar({ name, avatarUrl, size = 24 }: { name: string; avatarUrl?: string | null; size?: number }) {
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, background: avatarBg(name), fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
}

function TypeBadge({ type }: { type: RequestType }) {
  const color = TYPE_COLORS[type];
  return (
    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

const STATUS_MAP: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending_employee_confirmation: { label: "Attente", color: "var(--foreground-dim)", bg: "transparent" },
  pending_manager: { label: "À traiter", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  approved: { label: "Validée", color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
  rejected: { label: "Refusée", color: "var(--danger)", bg: "rgba(239,68,68,0.1)" },
  cancelled: { label: "Annulée", color: "var(--foreground-dim)", bg: "transparent" },
};

function StatusChip({ status }: { status: RequestStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ── Weekly recap ────────────────────────────────────────────────────────────── */
function WeeklyRecap({ requests }: { requests: StaffRequest[] }) {
  const approved = requests.filter(r => r.status === "approved" && r.dates?.length);
  if (!approved.length) return null;
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const thisWeek = approved.filter(r =>
    (r.dates ?? []).some(d => { const dt = new Date(d + "T12:00:00"); return dt >= monday && dt <= sunday; })
  );
  if (!thisWeek.length) return null;
  const days = ["L", "M", "Me", "J", "V", "S", "D"];
  return (
    <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
      <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Absences semaine en cours</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const dayStr = date.toISOString().split("T")[0];
          const items = thisWeek.filter(r => (r.dates ?? []).includes(dayStr));
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div key={day} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-semibold" style={{ color: isToday ? "var(--accent)" : "var(--foreground-dim)" }}>{day}</span>
              <div className="w-full min-h-[28px] rounded-lg p-0.5 flex flex-col gap-0.5"
                style={{ background: items.length ? "rgba(6,182,212,0.08)" : "transparent", border: `1px solid ${items.length ? "rgba(6,182,212,0.2)" : "var(--border-soft)"}` }}>
                {items.map(r => (
                  <p key={r.id} className="text-[7px] font-semibold leading-tight text-center truncate px-0.5"
                    style={{ color: "var(--accent)" }}>
                    {r.employee_name.split(" ")[0]}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Table ───────────────────────────────────────────────────────────────────── */
function RequestsTable({
  rows,
  showActions,
  onOpen,
  onQuickApprove,
  onQuickRefuse,
}: {
  rows: StaffRequest[];
  showActions: boolean;
  onOpen: (r: StaffRequest) => void;
  onQuickApprove?: (r: StaffRequest) => void;
  onQuickRefuse?: (r: StaffRequest) => void;
}) {
  if (!rows.length) return null;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <th className="text-left pl-3 pr-2 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)", width: "30%" }}>Employé</th>
          <th className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)", width: "18%" }}>Type</th>
          <th className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)", width: "24%" }}>Dates</th>
          <th className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)", width: showActions ? "14%" : "28%" }}>Statut</th>
          {showActions && (
            <th className="text-right pr-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)", width: "14%" }}>Act.</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((req, i) => {
          const color = TYPE_COLORS[req.request_type];
          const isLast = i === rows.length - 1;
          return (
            <tr
              key={req.id}
              onClick={() => onOpen(req)}
              className="cursor-pointer transition-colors"
              style={{
                borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
                height: 44,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

              {/* Employé */}
              <td className="pl-3 pr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <EmpAvatar name={req.employee_name} avatarUrl={req.employee_avatar} size={22} />
                  <span className="text-[12px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                    {req.employee_name.split(" ")[0]}
                  </span>
                </div>
              </td>

              {/* Type */}
              <td className="px-2">
                <TypeBadge type={req.request_type} />
              </td>

              {/* Dates */}
              <td className="px-2">
                <div>
                  <p className="text-[11px] font-mono tabular-nums leading-tight" style={{ color: "var(--foreground-muted)" }}>
                    {fmtDateShort(req.dates)}
                  </p>
                  {req.time_requested && (
                    <p className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>{req.time_requested}</p>
                  )}
                </div>
              </td>

              {/* Statut */}
              <td className="px-2">
                <StatusChip status={req.status} />
              </td>

              {/* Actions */}
              {showActions && (
                <td className="pr-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onQuickApprove?.(req)}
                      className="flex items-center justify-center rounded-lg active:scale-95"
                      style={{ width: 26, height: 26, background: "rgba(34,197,94,0.12)", color: "var(--success)" }}
                      title="Valider">
                      <Check size={12} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => onOpen(req)}
                      className="flex items-center justify-center rounded-lg active:scale-95"
                      style={{ width: 26, height: 26, background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}
                      title="Refuser">
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────────── */
function dateRange(start: string, end: string): string[] {
  if (!start) return [];
  if (!end || start === end) return [start];
  const result: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  while (cur <= endDate) {
    result.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/* ── Detail modal ────────────────────────────────────────────────────────────── */
function RequestDetailModal({
  req,
  myId,
  managerName,
  onApprove,
  onRefuse,
  onSave,
  onMessage,
  onClose,
}: {
  req: StaffRequest;
  myId: string;
  managerName: string;
  onApprove: () => void;
  onRefuse: (note: string) => void;
  onSave: (updates: { request_type: RequestType; dates: string[] }) => Promise<void>;
  onMessage: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "refuse">("view");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentBubbles, setSentBubbles] = useState<string[]>([]);

  /* edit fields */
  const [editType, setEditType] = useState<RequestType>(req.request_type);
  const [editDateStart, setEditDateStart] = useState(req.dates?.[0] ?? "");
  const [editDateEnd, setEditDateEnd] = useState(req.dates?.[req.dates.length - 1] ?? "");

  const isPending = req.status === "pending_manager";
  const color = TYPE_COLORS[req.request_type];
  const statusInfo = STATUS_MAP[req.status];
  const datesStr = fmtDates(req.dates);

  const inputStyle = {
    background: "var(--background)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && !acting) onClose(); }}>
      <div
        className="w-full max-w-md flex flex-col"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          maxHeight: "88vh",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <EmpAvatar name={req.employee_name} avatarUrl={req.employee_avatar} size={38} />
            <div>
              <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>{req.employee_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <TypeBadge type={mode === "edit" ? editType : req.request_type} />
                <span className="text-[10px] font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mode === "view" && (
              <button onClick={() => setMode("edit")} className="p-2 rounded-xl"
                style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>
                <Pencil size={13} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--foreground-dim)" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4">

          {/* ── Vue normale ── */}
          {mode === "view" && (
            <>
              <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--background-elev)", border: `1px solid ${color}22`, borderLeft: `3px solid ${color}` }}>
                <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{req.summary}</p>
                {datesStr && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Calendar size={11} style={{ color: "var(--foreground-dim)" }} />
                    <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>{datesStr}</span>
                  </div>
                )}
                {req.time_requested && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={11} style={{ color: "var(--foreground-dim)" }} />
                    <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>{req.time_requested}</span>
                  </div>
                )}
                {req.reason && (
                  <p className="text-[12px] mt-2 italic" style={{ color: "var(--foreground-dim)" }}>{req.reason}</p>
                )}
              </div>

              {req.manager_note && (
                <div className="rounded-xl px-3 py-2.5 mb-3"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="text-[11px] italic" style={{ color: "var(--danger)" }}>"{req.manager_note}"</p>
                </div>
              )}

              <p className="text-[10px] mb-3" style={{ color: "var(--foreground-dim)" }}>Soumis {fmtTime(req.created_at)}</p>

              <button onClick={() => setShowOriginal(s => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--foreground-dim)" }}>
                <MessageSquare size={10} />
                Message original
                <ChevronRight size={10} style={{ transform: showOriginal ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {showOriginal && (
                <p className="text-[11px] italic px-3 py-2.5 rounded-xl mb-3"
                  style={{ background: "var(--background-elev)", color: "var(--foreground-muted)", borderLeft: "2px solid var(--border-strong)" }}>
                  "{req.original_message}"
                </p>
              )}
            </>
          )}

          {/* ── Mode édition ── */}
          {mode === "edit" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Type de demande</p>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {(Object.entries(TYPE_LABELS) as [RequestType, string][]).map(([key, label]) => {
                  const c = TYPE_COLORS[key];
                  const active = editType === key;
                  return (
                    <button key={key} onClick={() => setEditType(key)}
                      className="py-2 rounded-xl text-[10px] font-bold transition-all"
                      style={{
                        background: active ? `${c}22` : "var(--background-elev)",
                        color: active ? c : "var(--foreground-dim)",
                        border: active ? `1px solid ${c}44` : "1px solid var(--border-soft)",
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Dates</p>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div>
                  <p className="text-[9px] mb-1" style={{ color: "var(--foreground-dim)" }}>Début</p>
                  <input type="date" value={editDateStart}
                    onChange={e => setEditDateStart(e.target.value)}
                    style={inputStyle} />
                </div>
                <div>
                  <p className="text-[9px] mb-1" style={{ color: "var(--foreground-dim)" }}>Fin <span style={{ opacity: 0.5 }}>(optionnel)</span></p>
                  <input type="date" value={editDateEnd}
                    min={editDateStart || undefined}
                    onChange={e => setEditDateEnd(e.target.value)}
                    style={inputStyle} />
                </div>
              </div>
              {editDateStart && editDateEnd && editDateStart !== editDateEnd && (
                <p className="text-[9px] mt-1 mb-2" style={{ color: "var(--foreground-dim)" }}>
                  {dateRange(editDateStart, editDateEnd).length} jours
                </p>
              )}
            </>
          )}

          {/* ── Mode refus ── */}
          {mode === "refuse" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                Motif du refus <span className="normal-case font-normal">(optionnel)</span>
              </p>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Ex: Effectif insuffisant ce jour-là…"
                rows={3} autoFocus
                className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          )}
        </div>

          {/* ── Bulle chat ── visible en mode vue */}
          {mode === "view" && (
            <div className="mt-2 mb-1">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                Message au serveur
              </p>
              {/* Bulles envoyées */}
              {(req.manager_note || sentBubbles.length > 0) && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {req.manager_note && !sentBubbles.includes(req.manager_note) && (
                    <div className="self-end max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm text-[12px]"
                      style={{ background: "var(--accent)", color: "var(--background)" }}>
                      {req.manager_note}
                      <p className="text-[8px] mt-0.5 opacity-60">{managerName}</p>
                    </div>
                  )}
                  {sentBubbles.map((b, i) => (
                    <div key={i} className="self-end max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm text-[12px]"
                      style={{ background: "var(--accent)", color: "var(--background)" }}>
                      {b}
                      <p className="text-[8px] mt-0.5 opacity-60">{managerName}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Input d'envoi */}
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter" && msgText.trim() && !sending) {
                      const txt = msgText.trim();
                      setMsgText("");
                      setSentBubbles(b => [...b, txt]);
                      setSending(true);
                      await onMessage(txt);
                      setSending(false);
                    }
                  }}
                  placeholder={`Écrire à ${req.employee_name.split(" ")[0]}…`}
                  className="flex-1 text-[12px] outline-none bg-transparent"
                  style={{ color: "var(--foreground)" }}
                />
                <button
                  disabled={!msgText.trim() || sending}
                  onClick={async () => {
                    const txt = msgText.trim();
                    if (!txt) return;
                    setMsgText("");
                    setSentBubbles(b => [...b, txt]);
                    setSending(true);
                    await onMessage(txt);
                    setSending(false);
                  }}
                  className="rounded-xl p-1.5 transition-all"
                  style={{
                    background: msgText.trim() ? "var(--accent)" : "transparent",
                    color: msgText.trim() ? "var(--background)" : "var(--foreground-dim)",
                  }}>
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border-soft)" }}>

          {/* Vue normale — demande en attente */}
          {mode === "view" && isPending && (
            <>
              <button onClick={() => { onApprove(); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "var(--success)", color: "white" }}>
                <Check size={14} strokeWidth={2.5} />
                Valider
              </button>
              <button onClick={() => setMode("refuse")}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <X size={14} strokeWidth={2.5} />
                Refuser
              </button>
            </>
          )}

          {/* Vue normale — déjà traitée */}
          {mode === "view" && !isPending && (
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-[13px] font-semibold"
              style={{ background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
              Fermer
            </button>
          )}

          {/* Mode édition */}
          {mode === "edit" && (
            <>
              <button onClick={() => setMode("view")} disabled={saving}
                className="flex items-center justify-center px-4 py-3 rounded-2xl text-[13px] font-semibold"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={async () => {
                  if (!editDateStart) return;
                  setSaving(true);
                  const dates = dateRange(editDateStart, editDateEnd);
                  await onSave({ request_type: editType, dates });
                  setSaving(false);
                  setMode("view");
                }}
                disabled={saving || !editDateStart}
                className="flex-1 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "var(--accent)", color: "var(--background)", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </>
          )}

          {/* Mode refus */}
          {mode === "refuse" && (
            <>
              <button onClick={() => { setMode("view"); setNote(""); }}
                className="flex items-center justify-center px-4 py-3 rounded-2xl text-[13px] font-semibold"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                <ArrowLeft size={14} />
              </button>
              <button onClick={() => { onRefuse(note); onClose(); }}
                className="flex-1 py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: "var(--danger)", color: "white" }}>
                Confirmer le refus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function RequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [histFilter, setHistFilter] = useState<"all" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<StaffRequest | null>(null);
  const [estId, setEstId] = useState("");
  const [myId, setMyId] = useState("");
  const [managerName, setManagerName] = useState("");

  const loadRequests = useCallback(async (eid: string) => {
    const { data } = await (supabase.from as any)("staff_requests")
      .select("*, profile:profile_id(first_name, last_name, avatar_url)")
      .eq("establishment_id", eid)
      .neq("status", "pending_employee_confirmation")
      .order("created_at", { ascending: false });

    const resolved: StaffRequest[] = (data ?? []).map((r: any) => {
      const p = r.profile as any;
      return {
        ...r,
        employee_name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu",
        employee_avatar: p?.avatar_url ?? null,
      };
    });
    setRequests(resolved);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyId(user.id);
        const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle();
        if (prof) setManagerName(`${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim());
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
        const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;
        let q = supabase.from("establishment_members").select("establishment_id, role").eq("profile_id", user.id).eq("is_active", true);
        if (validActiveId) q = q.eq("establishment_id", validActiveId);
        const { data: member } = await q.limit(1).maybeSingle();
        if (!member) return;
        if (member.role !== "owner" && member.role !== "manager") return;
        setEstId(member.establishment_id);
        await loadRequests(member.establishment_id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!estId) return;
    const ch = supabase.channel(`staff-requests-${estId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_requests" }, () => loadRequests(estId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [estId, loadRequests]);

  function approve(req: StaffRequest) {
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" as const } : r));
    setSelected(s => s?.id === req.id ? { ...s, status: "approved" } : s);
    (supabase.from as any)("staff_requests").update({
      status: "approved", reviewed_by: myId, reviewed_at: new Date().toISOString(),
    }).eq("id", req.id).then(() => {
      fetch("/api/push/send-to-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande validée ✓", body: req.summary, url: "/me/requests" }),
      }).catch(() => {});
    });
  }

  async function save(req: StaffRequest, updates: { request_type: RequestType; dates: string[] }) {
    await (supabase.from as any)("staff_requests").update({
      request_type: updates.request_type,
      dates: updates.dates.length ? updates.dates : null,
    }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, ...updates } : r));
    setSelected(s => s && s.id === req.id ? { ...s, ...updates } : s);
  }

  function refuse(req: StaffRequest, note: string) {
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" as const, manager_note: note || null } : r));
    setSelected(s => s?.id === req.id ? { ...s, status: "rejected", manager_note: note || null } : s);
    (supabase.from as any)("staff_requests").update({
      status: "rejected", reviewed_by: myId, reviewed_at: new Date().toISOString(), manager_note: note || null,
    }).eq("id", req.id).then(() => {
      fetch("/api/push/send-to-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande refusée", body: note ? `${req.summary} — "${note}"` : req.summary, url: "/me/requests" }),
      }).catch(() => {});
    });
  }

  async function sendMessage(req: StaffRequest, text: string) {
    await (supabase.from as any)("staff_requests").update({ manager_note: text }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, manager_note: text } : r));
    fetch("/api/push/send-to-profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProfileId: req.profile_id, title: `Message de ${managerName || "votre manager"}`, body: text, url: "/me/requests" }),
    }).catch(() => {});
  }

  const pending = requests.filter(r => r.status === "pending_manager");
  const history = requests.filter(r => !["pending_manager", "pending_employee_confirmation"].includes(r.status));
  const filteredHistory = histFilter === "all" ? history : history.filter(r => r.status === histFilter);

  const approvedCount = history.filter(r => r.status === "approved").length;
  const rejectedCount = history.filter(r => r.status === "rejected").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>Team</p>
        <h1 className="text-[26px] font-bold leading-none" style={{ color: "var(--foreground)" }}>Demandes</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>Détectées automatiquement dans le chat</p>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="mx-4 mb-4 grid grid-cols-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {[
            { label: "En attente", value: pending.length, color: pending.length > 0 ? "#F59E0B" : "var(--foreground-dim)" },
            { label: "Validées", value: approvedCount, color: approvedCount > 0 ? "var(--success)" : "var(--foreground-dim)" },
            { label: "Refusées", value: rejectedCount, color: rejectedCount > 0 ? "var(--danger)" : "var(--foreground-dim)" },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center py-3"
              style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none", background: "var(--background-elev)" }}>
              <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly recap */}
      <div className="px-4">
        <WeeklyRecap requests={requests} />
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1.5 mb-3">
        {([
          { key: "pending", label: "À traiter", count: pending.length },
          { key: "history", label: "Historique", count: history.length },
        ] as { key: "pending" | "history"; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: tab === t.key ? "var(--accent)" : "var(--background-elev)",
              color: tab === t.key ? "var(--background)" : "var(--foreground-muted)",
              border: tab === t.key ? "none" : "1px solid var(--border)",
            }}>
            {t.label}
            {t.count > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === t.key ? "rgba(255,255,255,0.3)" : (t.key === "pending" ? "#F59E0B" : "var(--border)"),
                  color: tab === t.key ? "white" : (t.key === "pending" ? "var(--background)" : "var(--foreground-dim)"),
                }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table container */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>

        {/* ── À traiter ── */}
        {tab === "pending" && (
          pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
              <Users size={28} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>Aucune demande en attente</p>
            </div>
          ) : (
            <RequestsTable
              rows={pending}
              showActions
              onOpen={setSelected}
              onQuickApprove={req => approve(req)}
              onQuickRefuse={req => setSelected(req)}
            />
          )
        )}

        {/* ── Historique ── */}
        {tab === "history" && (
          history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
              <Users size={28} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>Aucune demande traitée</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
                {([
                  { key: "all", label: "Tout" },
                  { key: "approved", label: "Validées" },
                  { key: "rejected", label: "Refusées" },
                ] as { key: typeof histFilter; label: string }[]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setHistFilter(f.key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: histFilter === f.key ? "var(--foreground)" : "transparent",
                      color: histFilter === f.key ? "var(--background)" : "var(--foreground-dim)",
                    }}>
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                  {filteredHistory.length} résultat{filteredHistory.length !== 1 ? "s" : ""}
                </span>
              </div>
              {filteredHistory.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucune demande ici</p>
                </div>
              ) : (
                <RequestsTable
                  rows={filteredHistory}
                  showActions={false}
                  onOpen={setSelected}
                />
              )}
            </>
          )
        )}
      </div>

      <div className="h-8" />

      {/* Detail modal */}
      {selected && (
        <RequestDetailModal
          req={selected}
          myId={myId}
          managerName={managerName}
          onApprove={() => approve(selected)}
          onRefuse={(note) => refuse(selected, note)}
          onSave={async (updates) => { await save(selected, updates); }}
          onMessage={async (text) => { await sendMessage(selected, text); }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
