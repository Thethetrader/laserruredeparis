"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Calendar, ChevronRight, Clock, RotateCcw, Users } from "lucide-react";

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

type Filter = "all" | "pending_manager" | "approved" | "rejected";

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

function avatarColor(name: string) {
  const hues = [210, 280, 340, 30, 160, 50, 190];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % hues.length;
  return `hsl(${hues[idx]},55%,40%)`;
}

/* ── Employee Avatar ─────────────────────────────────────────────────────────── */
function EmpAvatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string | null; size?: number }) {
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-[13px]"
      style={{ width: size, height: size, background: avatarColor(name) }}>
      {initials(name)}
    </div>
  );
}

/* ── Type Badge ──────────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: RequestType }) {
  const color = TYPE_COLORS[type];
  return (
    <span className="font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; color: string }> = {
    pending_employee_confirmation: { label: "En attente employé", color: "var(--foreground-dim)" },
    pending_manager: { label: "À traiter", color: "var(--warning)" },
    approved: { label: "Validé", color: "var(--success)" },
    rejected: { label: "Refusé", color: "var(--danger)" },
    cancelled: { label: "Annulé", color: "var(--foreground-dim)" },
  };
  const { label, color } = map[status];
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest"
      style={{ color }}>
      {label}
    </span>
  );
}

/* ── Refuse Modal ────────────────────────────────────────────────────────────── */
function RefuseModal({ req, onConfirm, onClose }: {
  req: StaffRequest;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
        <div>
          <p className="text-[16px] font-bold">Refuser la demande</p>
          <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>
            {req.employee_name} · {req.summary}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
            Motif <span className="normal-case tracking-normal font-normal">(optionnel)</span>
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: Service complet ce jour-là…"
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-[13px] outline-none resize-none"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-2xl py-3 text-[13px] font-semibold"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(note)}
            className="flex-1 rounded-2xl py-3 text-[13px] font-bold"
            style={{ background: "var(--danger)", color: "white" }}>
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Request Row ─────────────────────────────────────────────────────────────── */
function RequestRow({
  req,
  onApprove,
  onRefuse,
  isPending,
}: {
  req: StaffRequest;
  onApprove: () => void;
  onRefuse: () => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const datesStr = fmtDates(req.dates);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--background-elev)",
        border: "1px solid var(--border)",
        marginBottom: 8,
        opacity: req.status === "cancelled" ? 0.5 : 1,
      }}>
      <div className="px-4 py-3.5 flex items-start gap-3">
        <EmpAvatar name={req.employee_name} avatarUrl={req.employee_avatar} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>{req.employee_name}</span>
              <TypeBadge type={req.request_type} />
            </div>
            <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{fmtTime(req.created_at)}</span>
          </div>
          <p className="text-[13px] font-medium mt-1" style={{ color: "var(--foreground-muted)" }}>{req.summary}</p>
          {datesStr && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar size={11} style={{ color: "var(--foreground-dim)" }} />
              <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{datesStr}</span>
            </div>
          )}
          {req.time_requested && (
            <div className="flex items-center gap-1.5 mt-1">
              <Clock size={11} style={{ color: "var(--foreground-dim)" }} />
              <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{req.time_requested}</span>
            </div>
          )}
          {req.reason && (
            <p className="text-[11px] mt-1 italic" style={{ color: "var(--foreground-dim)" }}>{req.reason}</p>
          )}
          {req.manager_note && (
            <p className="text-[11px] mt-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "rgba(239,68,68,0.06)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}>
              "{req.manager_note}"
            </p>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 mt-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--foreground-dim)" }}>
            Message original
            <ChevronRight size={10} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {expanded && (
            <p className="text-[11px] mt-1.5 italic px-3 py-2 rounded-xl"
              style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", borderLeft: "2px solid var(--border-strong)" }}>
              "{req.original_message}"
            </p>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 px-4 pb-3.5"
          style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 12 }}>
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "var(--success)", color: "white" }}>
            <Check size={13} strokeWidth={2.5} />
            Valider
          </button>
          <button
            onClick={onRefuse}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <X size={13} strokeWidth={2.5} />
            Refuser
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Weekly Recap ────────────────────────────────────────────────────────────── */
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
    (r.dates ?? []).some(d => {
      const dt = new Date(d + "T12:00:00");
      return dt >= monday && dt <= sunday;
    })
  );
  if (!thisWeek.length) return null;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="rounded-2xl p-4 mb-6"
      style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
        Récap semaine en cours
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const dayStr = date.toISOString().split("T")[0];
          const items = thisWeek.filter(r => (r.dates ?? []).includes(dayStr));
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-semibold uppercase" style={{ color: "var(--foreground-dim)" }}>{day}</span>
              <div className="w-full min-h-[32px] rounded-lg p-1 flex flex-col gap-0.5"
                style={{ background: items.length ? "rgba(6,182,212,0.06)" : "transparent", border: `1px solid ${items.length ? "rgba(6,182,212,0.15)" : "var(--border-soft)"}` }}>
                {items.map(r => (
                  <p key={r.id} className="text-[8px] font-medium leading-tight truncate"
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

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function RequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [refuseTarget, setRefuseTarget] = useState<StaffRequest | null>(null);
  const [estId, setEstId] = useState("");
  const [myId, setMyId] = useState("");

  const loadRequests = useCallback(async (eid: string) => {
    const { data } = await (supabase.from as any)("staff_requests")
      .select("*, profiles(first_name, last_name, avatar_url)")
      .eq("establishment_id", eid)
      .neq("status", "pending_employee_confirmation")
      .order("created_at", { ascending: false });

    const resolved: StaffRequest[] = (data ?? []).map((r: any) => {
      const p = r.profiles as any;
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
      status: "approved",
      reviewed_by: myId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);

    // Notify the employee
    fetch("/api/push/send-to-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetProfileId: req.profile_id,
        title: "Demande validée ✓",
        body: req.summary,
        url: "/me/requests",
      }),
    }).catch(() => {});
  }

  async function refuse(req: StaffRequest, note: string) {
    await (supabase.from as any)("staff_requests").update({
      status: "rejected",
      reviewed_by: myId,
      reviewed_at: new Date().toISOString(),
      manager_note: note || null,
    }).eq("id", req.id);

    fetch("/api/push/send-to-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetProfileId: req.profile_id,
        title: "Demande refusée",
        body: note ? `${req.summary} — "${note}"` : req.summary,
        url: "/me/requests",
      }),
    }).catch(() => {});

    setRefuseTarget(null);
  }

  const pending = requests.filter(r => r.status === "pending_manager");
  const filtered = filter === "all"
    ? requests
    : requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
          Team
        </p>
        <h1 className="text-[28px] font-bold leading-none" style={{ color: "var(--foreground)" }}>
          Demandes
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
          Demandes du personnel détectées dans le chat
        </p>
      </div>

      {/* Stats */}
      {pending.length > 0 && (
        <div className="rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.15)" }}>
            <span className="text-[14px] font-bold" style={{ color: "var(--warning)" }}>{pending.length}</span>
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "var(--warning)" }}>
              {pending.length === 1 ? "1 demande à traiter" : `${pending.length} demandes à traiter`}
            </p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
              Cliquez sur Valider ou Refuser
            </p>
          </div>
        </div>
      )}

      {/* Recap */}
      <WeeklyRecap requests={requests} />

      {/* En attente */}
      {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--warning)" }}>
              En attente · {pending.length}
            </p>
          </div>
          {pending.map(req => (
            <RequestRow
              key={req.id}
              req={req}
              isPending
              onApprove={() => approve(req)}
              onRefuse={() => setRefuseTarget(req)}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(["all", "approved", "rejected"] as Filter[]).map(f => {
          const labels: Record<Filter, string> = {
            all: "Tout",
            pending_manager: "En attente",
            approved: "Validées",
            rejected: "Refusées",
          };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: active ? "var(--accent)" : "var(--background-elev)",
                color: active ? "var(--background)" : "var(--foreground-muted)",
                border: active ? "none" : "1px solid var(--border)",
              }}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* History */}
      {filtered.filter(r => r.status !== "pending_manager").length > 0 ? (
        <div>
          {filtered
            .filter(r => r.status !== "pending_manager")
            .map(req => (
              <RequestRow
                key={req.id}
                req={req}
                isPending={false}
                onApprove={() => {}}
                onRefuse={() => {}}
              />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{ background: "var(--background-elev)" }}>
            <Users size={28} style={{ color: "var(--foreground-dim)" }} />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>
            {filter === "all" ? "Aucune demande pour l'instant" : "Aucune demande dans cette catégorie"}
          </p>
        </div>
      )}

      {/* Refuse modal */}
      {refuseTarget && (
        <RefuseModal
          req={refuseTarget}
          onConfirm={note => refuse(refuseTarget, note)}
          onClose={() => setRefuseTarget(null)}
        />
      )}
    </div>
  );
}
