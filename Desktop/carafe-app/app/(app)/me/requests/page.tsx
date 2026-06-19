"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, X } from "lucide-react";

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
  request_type: RequestType;
  dates: string[] | null;
  time_requested: string | null;
  reason: string | null;
  summary: string;
  status: RequestStatus;
  manager_note: string | null;
  created_at: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
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

function fmtDates(dates: string[] | null) {
  if (!dates?.length) return null;
  return dates
    .map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }))
    .join(", ");
}

/* ── Status UI ───────────────────────────────────────────────────────────────── */
const STATUS_MAP: Record<RequestStatus, { label: string; color: string; dot: string }> = {
  pending_employee_confirmation: { label: "En attente", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.5)" },
  pending_manager: { label: "En attente du manager", color: "var(--warning)", dot: "var(--warning)" },
  approved: { label: "Validée ✓", color: "var(--success)", dot: "var(--success)" },
  rejected: { label: "Refusée", color: "var(--danger)", dot: "var(--danger)" },
  cancelled: { label: "Annulée", color: "var(--foreground-dim)", dot: "rgba(113,113,122,0.5)" },
};

/* ── Request Card ────────────────────────────────────────────────────────────── */
function RequestCard({ req, onCancel }: { req: StaffRequest; onCancel: () => void }) {
  const color = TYPE_COLORS[req.request_type];
  const statusInfo = STATUS_MAP[req.status];
  const datesStr = fmtDates(req.dates);
  const canCancel = req.status === "pending_manager";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--background-elev)", border: "1px solid var(--border)", opacity: req.status === "cancelled" ? 0.5 : 1 }}>
      <div className="flex items-start gap-3 p-4">
        <div className="w-2 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              {TYPE_LABELS[req.request_type]}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.dot }} />
              <span className="text-[10px] font-semibold" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </span>
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
            <p className="text-[11px] mt-2 px-2.5 py-1.5 rounded-lg italic"
              style={{ background: "rgba(239,68,68,0.06)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.12)" }}>
              "{req.manager_note}"
            </p>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold"
              style={{ color: "var(--foreground-dim)" }}>
              <X size={12} />
              Annuler la demande
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
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
    await (supabase.from as any)("staff_requests").update({ status: "cancelled" }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "cancelled" } : r));
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
                  <RequestCard key={req.id} req={req} onCancel={() => cancel(req)} />
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
                  <RequestCard key={req.id} req={req} onCancel={() => cancel(req)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
