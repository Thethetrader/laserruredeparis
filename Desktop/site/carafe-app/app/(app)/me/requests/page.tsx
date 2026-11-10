"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, X, Pencil, ArrowLeft, Check } from "lucide-react";

type RequestType = "leave" | "unavailability" | "late" | "early_leave" | "shift_swap" | "other";
type RequestStatus =
  | "pending_employee_confirmation"
  | "pending_manager"
  | "approved"
  | "rejected"
  | "cancelled";

interface StaffRequest {
  id: string;
  request_type: RequestType;
  dates: string[] | null;
  time_requested: string | null;
  reason: string | null;
  summary: string;
  status: RequestStatus;
  manager_note: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<RequestType, string> = {
  leave: "Congé",
  unavailability: "Indisponibilité",
  late: "Retard",
  early_leave: "Départ anticipé",
  shift_swap: "Échange de service",
  other: "Autre demande",
};

const TYPE_COLORS: Record<RequestType, string> = {
  leave: "#8B5CF6",
  unavailability: "#F59E0B",
  late: "#EF4444",
  early_leave: "#F97316",
  shift_swap: "#06B6D4",
  other: "#71717A",
};

const STATUS_MAP: Record<RequestStatus, { label: string; color: string; dot: string }> = {
  pending_employee_confirmation: { label: "En attente", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.5)" },
  pending_manager: { label: "En attente du manager", color: "var(--warning)", dot: "var(--warning)" },
  approved: { label: "Validée ✓", color: "var(--success)", dot: "var(--success)" },
  rejected: { label: "Refusée", color: "var(--danger)", dot: "var(--danger)" },
  cancelled: { label: "Annulée", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.5)" },
};

function fmtDates(dates: string[] | null) {
  if (!dates?.length) return null;
  return dates
    .map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }))
    .join(", ");
}

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

/* ── Card ────────────────────────────────────────────────────────────────────── */
function RequestCard({
  req,
  onCancel,
  onEdit,
}: {
  req: StaffRequest;
  onCancel: () => void;
  onEdit: (updates: { request_type: RequestType; dates: string[] }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editType, setEditType] = useState<RequestType>(req.request_type);
  const [editDateStart, setEditDateStart] = useState(req.dates?.[0] ?? "");
  const [editDateEnd, setEditDateEnd] = useState(req.dates?.[req.dates.length - 1] ?? "");
  const [saving, setSaving] = useState(false);

  const color = TYPE_COLORS[req.request_type];
  const editColor = TYPE_COLORS[editType];
  const statusInfo = STATUS_MAP[req.status];
  const datesStr = fmtDates(req.dates);
  const canModify = req.status === "pending_manager";

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
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--background-elev)", border: `1px solid var(--border)`, opacity: req.status === "cancelled" ? 0.45 : 1 }}>

      {/* Vue normale */}
      {mode === "view" && (
        <div className="flex items-start gap-3 p-4">
          <div className="w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                {TYPE_LABELS[req.request_type]}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.dot }} />
                  <span className="text-[10px] font-semibold" style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                {canModify && (
                  <button onClick={() => setMode("edit")} className="p-1 rounded-lg"
                    style={{ background: "var(--background-soft)", color: "var(--foreground-dim)" }}>
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{req.summary}</p>
            {datesStr && (
              <div className="flex items-center gap-1.5 mt-2">
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
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Message du manager
                </p>
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-[12px]"
                  style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }}>
                  {req.manager_note}
                </div>
              </div>
            )}
            {canModify && (
              <button onClick={onCancel}
                className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold"
                style={{ color: "var(--foreground-dim)" }}>
                <X size={12} />
                Annuler la demande
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode édition */}
      {mode === "edit" && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Modifier la demande</p>
            <button onClick={() => setMode("view")} className="p-1.5 rounded-xl"
              style={{ color: "var(--foreground-dim)" }}>
              <X size={14} />
            </button>
          </div>

          {/* Type */}
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Type</p>
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {(Object.entries(TYPE_LABELS) as [RequestType, string][]).map(([key, label]) => {
              const c = TYPE_COLORS[key];
              const active = editType === key;
              return (
                <button key={key} onClick={() => setEditType(key)}
                  className="py-2 rounded-xl text-[10px] font-bold transition-all"
                  style={{
                    background: active ? `${c}22` : "var(--background)",
                    color: active ? c : "var(--foreground-dim)",
                    border: active ? `1px solid ${c}44` : "1px solid var(--border-soft)",
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Dates */}
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
            <p className="text-[9px] mb-3" style={{ color: "var(--foreground-dim)" }}>
              {dateRange(editDateStart, editDateEnd).length} jours
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setMode("view")}
              className="flex items-center justify-center px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
              <ArrowLeft size={13} />
            </button>
            <button
              onClick={async () => {
                if (!editDateStart || saving) return;
                setSaving(true);
                const dates = dateRange(editDateStart, editDateEnd);
                await onEdit({ request_type: editType, dates });
                setSaving(false);
                setMode("view");
              }}
              disabled={saving || !editDateStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-bold"
              style={{ background: editColor, color: "white", opacity: saving ? 0.6 : 1 }}>
              <Check size={13} strokeWidth={2.5} />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function MyRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");

  const loadRequests = useCallback(async (uid: string) => {
    const { data } = await (supabase.from as any)("staff_requests")
      .select("id, request_type, dates, time_requested, reason, summary, status, manager_note, created_at")
      .eq("profile_id", uid)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setMyId(user.id);
        await loadRequests(user.id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function cancel(req: StaffRequest) {
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "cancelled" as const } : r));
    await (supabase.from as any)("staff_requests").update({ status: "cancelled" }).eq("id", req.id);
  }

  async function edit(req: StaffRequest, updates: { request_type: RequestType; dates: string[] }) {
    await (supabase.from as any)("staff_requests").update({
      request_type: updates.request_type,
      dates: updates.dates.length ? updates.dates : null,
    }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? {
      ...r,
      request_type: updates.request_type,
      dates: updates.dates,
      summary: `${TYPE_LABELS[updates.request_type]}${updates.dates.length ? ` — ${fmtDates(updates.dates)}` : ""}`,
    } : r));
  }

  const active = requests.filter(r => r.status === "pending_manager");
  const history = requests.filter(r => !["pending_manager", "pending_employee_confirmation"].includes(r.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
          Mes shifts
        </p>
        <h1 className="text-[28px] font-bold leading-none" style={{ color: "var(--foreground)" }}>
          Mes demandes
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
          Tes demandes envoyées au manager
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{ background: "var(--background-elev)" }}>
            <Calendar size={28} style={{ color: "var(--foreground-dim)" }} />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--foreground-dim)" }}>
            Aucune demande pour l'instant
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--warning)" }}>
                En cours · {active.length}
              </p>
              <div className="flex flex-col gap-2">
                {active.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onCancel={() => cancel(req)}
                    onEdit={updates => edit(req, updates)}
                  />
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
                Historique
              </p>
              <div className="flex flex-col gap-2">
                {history.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onCancel={() => cancel(req)}
                    onEdit={updates => edit(req, updates)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
