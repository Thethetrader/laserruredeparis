"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Calendar, Clock, ChevronRight, MessageSquare, Users, ArrowLeft } from "lucide-react";

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

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<RequestType, string> = {
  leave: "CONGÉ",
  unavailability: "INDISPO",
  late: "RETARD",
  early_leave: "DÉPART",
  shift_swap: "ÉCHANGE",
  other: "AUTRE",
};

const TYPE_COLORS: Record<RequestType, string> = {
  leave: "#8B5CF6",
  unavailability: "#F59E0B",
  late: "#EF4444",
  early_leave: "#F97316",
  shift_swap: "#06B6D4",
  other: "#71717A",
};

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

/* ── Avatar ──────────────────────────────────────────────────────────────────── */
function EmpAvatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string | null; size?: number }) {
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

/* ── Type badge ──────────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: RequestType }) {
  const color = TYPE_COLORS[type];
  return (
    <span className="font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

/* ── Status chip ─────────────────────────────────────────────────────────────── */
const STATUS_MAP: Record<RequestStatus, { label: string; color: string; dot: string }> = {
  pending_employee_confirmation: { label: "En attente", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.5)" },
  pending_manager: { label: "À traiter", color: "var(--warning)", dot: "var(--warning)" },
  approved: { label: "Validée", color: "var(--success)", dot: "var(--success)" },
  rejected: { label: "Refusée", color: "var(--danger)", dot: "var(--danger)" },
  cancelled: { label: "Annulée", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.3)" },
};

/* ── Weekly recap (compact) ──────────────────────────────────────────────────── */
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

/* ── Compact list row ────────────────────────────────────────────────────────── */
function RequestRow({ req, onOpen }: { req: StaffRequest; onOpen: () => void }) {
  const isPending = req.status === "pending_manager";
  const statusInfo = STATUS_MAP[req.status];
  const datesStr = fmtDates(req.dates);

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-4 text-left transition-all active:opacity-60"
      style={{
        height: 52,
        borderBottom: "1px solid var(--border-soft)",
        background: isPending ? "rgba(245,158,11,0.025)" : "transparent",
      }}>
      {/* Left accent line */}
      <div className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[req.request_type] }} />

      {/* Avatar */}
      <EmpAvatar name={req.employee_name} avatarUrl={req.employee_avatar} size={28} />

      {/* Name — fixed width */}
      <p className="text-[12px] font-semibold truncate flex-shrink-0" style={{ width: 72, color: "var(--foreground)" }}>
        {req.employee_name.split(" ")[0]}
      </p>

      {/* Type badge */}
      <TypeBadge type={req.request_type} />

      {/* Summary + dates */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] truncate" style={{ color: "var(--foreground-muted)" }}>{req.summary}</p>
        {datesStr && (
          <p className="text-[9px] truncate" style={{ color: "var(--foreground-dim)" }}>{datesStr}</p>
        )}
      </div>

      {/* Status + time */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isPending ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}>
            À traiter
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusInfo.dot }} />
        )}
        <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{fmtTime(req.created_at)}</span>
        <ChevronRight size={11} style={{ color: "var(--foreground-dim)" }} />
      </div>
    </button>
  );
}

/* ── Detail + Action modal ───────────────────────────────────────────────────── */
function RequestDetailModal({
  req,
  myId,
  onApprove,
  onRefuse,
  onClose,
}: {
  req: StaffRequest;
  myId: string;
  onApprove: () => Promise<void>;
  onRefuse: (note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [refusing, setRefusing] = useState(false);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const isPending = req.status === "pending_manager";
  const color = TYPE_COLORS[req.request_type];
  const statusInfo = STATUS_MAP[req.status];
  const datesStr = fmtDates(req.dates);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && !acting) onClose(); }}>
      <div
        className="w-full max-w-md flex flex-col"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.25)",
          maxHeight: "80vh",
        }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <EmpAvatar name={req.employee_name} avatarUrl={req.employee_avatar} size={42} />
              <div>
                <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>{req.employee_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <TypeBadge type={req.request_type} />
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.dot }} />
                    <span className="text-[10px] font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
              <X size={16} />
            </button>
          </div>

          {/* Summary */}
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

          {/* Manager note (if rejected) */}
          {req.manager_note && (
            <div className="rounded-xl px-3 py-2.5 mb-3"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-[11px] italic" style={{ color: "var(--danger)" }}>"{req.manager_note}"</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
              Soumis {fmtTime(req.created_at)}
            </span>
          </div>

          {/* Original message toggle */}
          <button
            onClick={() => setShowOriginal(s => !s)}
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

          {/* Refuse note input */}
          {refusing && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                Motif du refus <span className="normal-case font-normal">(optionnel)</span>
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: Effectif insuffisant ce jour-là…"
                rows={2}
                autoFocus
                className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>
          )}
        </div>

        {/* Action bar — sticky bottom */}
        {isPending && (
          <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border-soft)" }}>
            {!refusing ? (
              <>
                <button
                  onClick={async () => { setActing(true); await onApprove(); setActing(false); onClose(); }}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all"
                  style={{ background: "var(--success)", color: "white", opacity: acting ? 0.6 : 1 }}>
                  <Check size={14} strokeWidth={2.5} />
                  Valider la demande
                </button>
                <button
                  onClick={() => setRefusing(true)}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <X size={14} strokeWidth={2.5} />
                  Refuser
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setRefusing(false); setNote(""); }}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={async () => { setActing(true); await onRefuse(note); setActing(false); onClose(); }}
                  disabled={acting}
                  className="flex-1 py-3 rounded-2xl text-[13px] font-bold transition-all"
                  style={{ background: "var(--danger)", color: "white", opacity: acting ? 0.6 : 1 }}>
                  {acting ? "Refus en cours…" : "Confirmer le refus"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function RequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [histFilter, setHistFilter] = useState<"all" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<StaffRequest | null>(null);
  const [estId, setEstId] = useState("");
  const [myId, setMyId] = useState("");

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

  async function approve(req: StaffRequest) {
    await (supabase.from as any)("staff_requests").update({
      status: "approved", reviewed_by: myId, reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" as const } : r));
    fetch("/api/push/send-to-profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande validée ✓", body: req.summary, url: "/me/requests" }),
    }).catch(() => {});
  }

  async function refuse(req: StaffRequest, note: string) {
    await (supabase.from as any)("staff_requests").update({
      status: "rejected", reviewed_by: myId, reviewed_at: new Date().toISOString(), manager_note: note || null,
    }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" as const, manager_note: note || null } : r));
    fetch("/api/push/send-to-profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande refusée", body: note ? `${req.summary} — "${note}"` : req.summary, url: "/me/requests" }),
    }).catch(() => {});
  }

  const pending = requests.filter(r => r.status === "pending_manager");
  const history = requests.filter(r => !["pending_manager", "pending_employee_confirmation"].includes(r.status));
  const filteredHistory = histFilter === "all" ? history : history.filter(r => r.status === histFilter);

  // Stats
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>Team</p>
        <h1 className="text-[26px] font-bold leading-none" style={{ color: "var(--foreground)" }}>Demandes</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>
          Détectées automatiquement dans le chat
        </p>
      </div>

      {/* Stats band */}
      {requests.length > 0 && (
        <div className="mx-4 mb-4 grid grid-cols-3 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}>
          {[
            { label: "En attente", value: pending.length, color: pending.length > 0 ? "var(--warning)" : "var(--foreground-dim)" },
            { label: "Validées", value: approvedCount, color: approvedCount > 0 ? "var(--success)" : "var(--foreground-dim)" },
            { label: "Refusées", value: rejectedCount, color: rejectedCount > 0 ? "var(--danger)" : "var(--foreground-dim)" },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center py-3 px-2"
              style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none", background: "var(--background-elev)" }}>
              <p className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</p>
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
      <div className="flex px-4 gap-1.5 mb-0.5">
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
                style={{ background: tab === t.key ? "rgba(255,255,255,0.3)" : (t.key === "pending" && t.count > 0 ? "var(--warning)" : "var(--border)"), color: tab === t.key ? "white" : (t.key === "pending" && t.count > 0 ? "var(--background)" : "var(--foreground-dim)") }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List container */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>

        {/* ── À traiter tab ── */}
        {tab === "pending" && (
          pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
              <Users size={28} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>Aucune demande en attente</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "rgba(245,158,11,0.05)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--warning)" }}>
                  {pending.length} demande{pending.length > 1 ? "s" : ""} à traiter
                </p>
                <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Appuyez pour traiter</p>
              </div>
              {pending.map(req => (
                <RequestRow key={req.id} req={req} onOpen={() => setSelected(req)} />
              ))}
            </>
          )
        )}

        {/* ── Historique tab ── */}
        {tab === "history" && (
          history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
              <Users size={28} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>Aucune demande traitée</p>
            </div>
          ) : (
            <>
              {/* Sub-filters */}
              <div className="flex gap-1.5 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
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
                <span className="ml-auto text-[10px] self-center" style={{ color: "var(--foreground-dim)" }}>
                  {filteredHistory.length} demande{filteredHistory.length !== 1 ? "s" : ""}
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucune demande dans cette catégorie</p>
                </div>
              ) : (
                filteredHistory.map(req => (
                  <RequestRow key={req.id} req={req} onOpen={() => setSelected(req)} />
                ))
              )}
            </>
          )
        )}
      </div>

      <div className="h-6" />

      {/* Detail modal */}
      {selected && (
        <RequestDetailModal
          req={selected}
          myId={myId}
          onApprove={async () => { await approve(selected); setSelected(s => s ? { ...s, status: "approved" } : null); }}
          onRefuse={async (note) => { await refuse(selected, note); setSelected(s => s ? { ...s, status: "rejected", manager_note: note || null } : null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
