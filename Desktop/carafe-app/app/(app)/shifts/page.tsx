"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Euro, FileText, Trophy, Sunrise, Sunset, Check, CalendarDays } from "lucide-react";
import {
  Shift, ShiftProfile, toDateStr, getDaysInMonth, isoWeekday, monthLabel,
  calcTotalHours, calcTotalTips, formatHours, formatTips, shiftsToMap, calcNetHours,
  monthlyContractHours, parseTipSettings, DEFAULT_TIP_SETTINGS, type TipSettings,
  STAFF_STATUSES, type StaffStatus,
} from "@/lib/shifts";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── Shift Modal ──────────────────────────────────────────────────────────── */
function ShiftModal({ date, shift, onSave, onDelete, onClose, tipSettings, tipsEnabled }: {
  date: string; shift: Shift | null;
  onSave: (data: Partial<Shift>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  tipSettings: TipSettings;
  tipsEnabled: boolean;
}) {
  const [startTime, setStartTime]   = useState(shift?.start_time ?? "09:00");
  const [endTime, setEndTime]       = useState(shift?.end_time   ?? "14:00");
  const [tips, setTips]             = useState(String(shift?.tips ?? ""));
  const [hasCoupure, setHasCoupure] = useState(!!(shift?.start_time_2));
  const [startTime2, setStartTime2] = useState(shift?.start_time_2 ?? "18:00");
  const [endTime2, setEndTime2]     = useState(shift?.end_time_2   ?? "23:00");
  const [tips2, setTips2]           = useState(String(shift?.tips_2 ?? ""));
  const [note, setNote]             = useState(shift?.note ?? "");
  const [saving, setSaving]         = useState(false);

  const net1 = startTime && endTime ? calcNetHours(startTime, endTime) : 0;
  const net2 = hasCoupure && startTime2 && endTime2 ? calcNetHours(startTime2, endTime2) : 0;

  async function handleSave() {
    setSaving(true);
    await onSave({
      shift_date: date,
      start_time: startTime, end_time: endTime,
      hours_worked: net1, tips: parseFloat(tips) || 0,
      start_time_2: hasCoupure ? startTime2 : null,
      end_time_2: hasCoupure ? endTime2 : null,
      hours_worked_2: hasCoupure ? net2 : 0,
      tips_2: hasCoupure ? (parseFloat(tips2) || 0) : 0,
      note: note || null,
    });
    setSaving(false);
  }

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{shift ? "Modifier" : "Ajouter un shift"}</h2>
            <p className="text-[12px] mt-0.5 capitalize" style={{ color: "var(--foreground-dim)" }}>{displayDate}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        {/* Service midi */}
        <div className="rounded-xl p-3 mb-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sunrise size={13} style={{ color: "#F59E0B" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>Service midi</span>
            {net1 > 0 && <span className="text-[10px] ml-auto font-mono" style={{ color: "var(--accent)" }}>{formatHours(net1)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          </div>
          {tipsEnabled && tipSettings.mode === "self" && (
            <div className="relative">
              <Euro size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
              <input type="number" min="0" step="0.5" value={tips} onChange={e => setTips(e.target.value)} placeholder="Tips midi (€)" className="w-full pl-7 pr-3 py-1.5 rounded-base text-[12px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          )}
          {tipsEnabled && tipSettings.mode === "dispatch" && (shift?.tips ?? 0) > 0 && (
            <p className="text-[11px] font-mono font-semibold mt-1" style={{ color: "#F59E0B" }}>Tips distribués : {formatTips(shift?.tips ?? 0)}</p>
          )}
        </div>

        {/* Coupure toggle */}
        {!hasCoupure ? (
          <button onClick={() => setHasCoupure(true)} className="w-full py-2 rounded-xl text-[12px] font-medium mb-3 flex items-center justify-center gap-2" style={{ background: "transparent", border: "1px dashed var(--border-strong)", color: "var(--foreground-dim)" }}>
            <Plus size={13} />
            Ajouter service du soir
          </button>
        ) : (
          <div className="rounded-xl p-3 mb-3" style={{ background: "var(--background)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Sunset size={13} style={{ color: "var(--accent)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>Service soir</span>
              {net2 > 0 && <span className="text-[10px] ml-auto font-mono" style={{ color: "var(--accent)" }}>{formatHours(net2)}</span>}
              <button onClick={() => setHasCoupure(false)} className="ml-1" style={{ color: "var(--foreground-dim)" }}><X size={12} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
                <input type="time" value={startTime2} onChange={e => setStartTime2(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }} />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
                <input type="time" value={endTime2} onChange={e => setEndTime2(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }} />
              </div>
            </div>
            {tipsEnabled && tipSettings.mode === "self" && (
              <div className="relative">
                <Euro size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
                <input type="number" min="0" step="0.5" value={tips2} onChange={e => setTips2(e.target.value)} placeholder="Tips soir (€)" className="w-full pl-7 pr-3 py-1.5 rounded-base text-[12px] outline-none" style={{ background: "var(--background-soft)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }} />
              </div>
            )}
            {tipsEnabled && tipSettings.mode === "dispatch" && (shift?.tips_2 ?? 0) > 0 && (
              <p className="text-[11px] font-mono font-semibold mt-1" style={{ color: "#F59E0B" }}>Tips distribués : {formatTips(shift?.tips_2 ?? 0)}</p>
            )}
          </div>
        )}

        {/* Total */}
        {(net1 > 0 || net2 > 0) && (
          <div className="flex items-center justify-between px-3 py-2 rounded-base mb-3" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: "var(--accent)" }} />
              <span className="text-[12px]" style={{ color: "var(--accent)" }}>Total {formatHours(net1 + net2)}</span>
            </div>
            {(parseFloat(tips)||0) + (parseFloat(tips2)||0) > 0 && (
              <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--accent)" }}>
                {formatTips((parseFloat(tips)||0) + (parseFloat(tips2)||0))} tips
              </span>
            )}
          </div>
        )}

        {/* Note */}
        <div className="mb-4">
          <div className="relative">
            <FileText size={12} className="absolute left-3 top-2.5" style={{ color: "var(--foreground-dim)" }} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note…" rows={1} className="w-full pl-8 pr-3 py-2 rounded-base text-[12px] outline-none resize-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        <div className="flex gap-2">
          {shift && <button onClick={onDelete} className="px-4 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Supprimer</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-base text-[13px] font-semibold" style={{ background: "var(--success)", color: "var(--primary-foreground)", opacity: saving ? 0.7 : 1 }}>{saving ? "…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Tips bar chart ───────────────────────────────────────────────────────── */
function TipsChart({ shifts, year, month }: { shifts: Shift[]; year: number; month: number }) {
  const days = getDaysInMonth(year, month);
  const tipsMap = new Map(shifts.map(s => [s.shift_date, (s.tips ?? 0) + (s.tips_2 ?? 0)]));
  const maxTips = Math.max(...Array.from(tipsMap.values()), 1);
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Tips par jour</p>
      <div className="flex items-end gap-0.5" style={{ height: 52 }}>
        {days.map(d => {
          const t = tipsMap.get(toDateStr(d)) ?? 0;
          return (
            <div key={toDateStr(d)} className="flex-1 relative group" style={{ height: "100%" }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-sm" style={{ height: t > 0 ? `${Math.max((t/maxTips)*100,8)}%` : "3px", background: t > 0 ? (t/maxTips > 0.7 ? "var(--accent)" : "rgba(6,182,212,0.4)") : "var(--background-soft)" }} />
              {t > 0 && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>{d.getDate()} — {formatTips(t)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Planning validation section ─────────────────────────────────────────── */
interface PlanningShift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  service: string;
  confirmation_status: "pending" | "confirmed" | "modified";
}

function PlanningSection({ estId, userId }: { estId: string; userId: string }) {
  const supabase = createClient();
  const [shifts, setShifts] = useState<PlanningShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refusalOpen, setRefusalOpen] = useState(false);
  const [refusalSelected, setRefusalSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!estId || !userId) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("planning_shifts")
      .select("id, shift_date, start_time, end_time, service, confirmation_status")
      .eq("user_id", userId)
      .eq("establishment_id", estId)
      .gte("shift_date", today)
      .order("shift_date")
      .then(({ data }) => {
        setShifts((data ?? []) as PlanningShift[]);
        setLoading(false);
      });
  }, [estId, userId, supabase]);

  const confirm = async (id: string) => {
    await supabase.from("planning_shifts").update({ confirmation_status: "confirmed" }).eq("id", id);
    setShifts(prev => prev.map(s => s.id === id ? { ...s, confirmation_status: "confirmed" as const } : s));
  };

  const submitRefusal = async () => {
    if (refusalSelected.size === 0) return;
    setSubmitting(true);
    await supabase.from("planning_shifts").update({ confirmation_status: "modified" }).in("id", [...refusalSelected]);
    setShifts(prev => prev.map(s => refusalSelected.has(s.id) ? { ...s, confirmation_status: "modified" as const } : s));
    setRefusalOpen(false);
    setRefusalSelected(new Set());
    setSubmitting(false);
  };

  const pending = shifts.filter(s => s.confirmation_status === "pending");
  const hasModified = shifts.some(s => s.confirmation_status === "modified");

  const byDate = new Map<string, PlanningShift[]>();
  shifts.forEach(s => {
    if (!byDate.has(s.shift_date)) byDate.set(s.shift_date, []);
    byDate.get(s.shift_date)!.push(s);
  });
  const sortedDates = [...byDate.keys()].sort();

  if (!loading && shifts.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={14} style={{ color: "var(--accent)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Planning à valider</p>
        {pending.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.3)" }}>
            {pending.length} en attente
          </span>
        )}
      </div>

      {loading && <div className="rounded-xl h-24 animate-pulse" style={{ background: "var(--background-elev)" }} />}

      {!loading && (
        <>
          {hasModified && (
            <div className="mb-3 px-3 py-2.5 rounded-xl text-[12px]"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
              Certains shifts ont été signalés. Le manager va prendre contact.
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setRefusalSelected(new Set(pending.map(s => s.id))); setRefusalOpen(true); }}
                className="flex-1 py-2 rounded-xl text-[12px] font-medium"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                Je ne valide pas tout
              </button>
            </div>
          )}

          <div className="space-y-2">
            {sortedDates.map(date => {
              const dayShifts = byDate.get(date)!;
              const d = new Date(date + "T12:00:00");
              const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              return (
                <div key={date} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                    <p className="text-[12px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{dayLabel}</p>
                  </div>
                  {dayShifts.map(shift => {
                    const isConfirmed = shift.confirmation_status === "confirmed";
                    const isRefused = shift.confirmation_status === "modified";
                    return (
                      <div key={shift.id} className="px-4 py-3 flex items-center gap-3"
                        style={{
                          background: isRefused ? "rgba(239,68,68,0.03)" : isConfirmed ? "rgba(16,185,129,0.03)" : "var(--background-elev)",
                          borderBottom: "1px solid var(--border-soft)",
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{shift.service}</p>
                          <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>
                            {shift.start_time.slice(0, 5)} → {shift.end_time.slice(0, 5)}
                          </p>
                        </div>
                        {isConfirmed && (
                          <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>✓ Confirmé</span>
                        )}
                        {isRefused && (
                          <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>✗ Signalé</span>
                        )}
                        {!isConfirmed && !isRefused && (
                          <div className="flex gap-1.5">
                            <button onClick={() => confirm(shift.id)}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                              style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}>
                              ✓ OK
                            </button>
                            <button onClick={() => { setRefusalSelected(new Set([shift.id])); setRefusalOpen(true); }}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                              style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                              ✗ Non
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {refusalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={e => { if (e.target === e.currentTarget) setRefusalOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>Signaler un problème</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Sélectionne les shifts qui ne conviennent pas</p>
              </div>
              <button onClick={() => setRefusalOpen(false)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
              {shifts.filter(s => s.confirmation_status !== "modified").map(shift => {
                const selected = refusalSelected.has(shift.id);
                const d = new Date(shift.shift_date + "T12:00:00");
                const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <button key={shift.id}
                    onClick={() => {
                      const next = new Set(refusalSelected);
                      if (selected) next.delete(shift.id); else next.add(shift.id);
                      setRefusalSelected(next);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                    style={{ background: selected ? "rgba(239,68,68,0.1)" : "var(--background)", border: `1px solid ${selected ? "rgba(239,68,68,0.4)" : "var(--border)"}` }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: selected ? "var(--danger)" : "transparent", border: `1.5px solid ${selected ? "var(--danger)" : "var(--border)"}` }}>
                      {selected && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium capitalize" style={{ color: "var(--foreground)" }}>{dayLabel} · {shift.service}</p>
                      <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>{shift.start_time.slice(0, 5)} → {shift.end_time.slice(0, 5)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={submitRefusal} disabled={submitting || refusalSelected.size === 0}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "var(--danger)", color: "#fff", opacity: (submitting || refusalSelected.size === 0) ? 0.5 : 1 }}>
              {submitting ? "Envoi…" : `Signaler ${refusalSelected.size > 0 ? `(${refusalSelected.size})` : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function ShiftsPage() {
  const today = new Date();
  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [shifts, setShifts]       = useState<Shift[]>([]);
  const [prevShifts, setPrev]     = useState<Shift[]>([]);
  const [ytdTips, setYtd]         = useState(0);
  const [profile, setProfile]     = useState<ShiftProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string | null>(null);
  const [tipSettings, setTipSettings] = useState<TipSettings>(DEFAULT_TIP_SETTINGS);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null);
  const [estId, setEstId]         = useState("");
  const [userId, setUserId]       = useState("");
  const [estName, setEstName]     = useState("");
  const [firstName, setFirstName] = useState("");
  const [greeting, setGreeting]   = useState("Bonjour");
  const supabase = createClient();
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Maintenir un channel souscrit pour pouvoir broadcaster vers le manager
  useEffect(() => {
    if (!estId) return;
    const ch = supabase.channel(`shifts-team-${estId}`);
    ch.subscribe();
    broadcastRef.current = ch;
    return () => { supabase.removeChannel(ch); broadcastRef.current = null; };
  }, [estId, supabase]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir");
  }, []);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
    const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;

    let memberQuery = supabase
      .from("establishment_members")
      .select("establishment_id, tips_enabled, staff_status, establishments(name, tip_settings), profiles(first_name)")
      .eq("profile_id", user.id).eq("is_active", true);
    if (validActiveId) memberQuery = memberQuery.eq("establishment_id", validActiveId);

    const { data: member } = await memberQuery.limit(1).maybeSingle();

    if (member) {
      setEstId(member.establishment_id);
      setTipsEnabled((member as unknown as { tips_enabled: boolean }).tips_enabled ?? true);
      const est = member.establishments as { name: string; tip_settings: unknown } | null;
      const prof = member.profiles as { first_name: string | null } | null;
      if (est) { setEstName(est.name); setTipSettings(parseTipSettings(est.tip_settings)); }
      if (prof?.first_name) setFirstName(prof.first_name);
      const ss = (member as unknown as { staff_status: string | null }).staff_status;
      if (ss) setStaffStatus(ss as StaffStatus);
    } else if (validActiveId) {
      setEstId(validActiveId);
    }

    const from = `${y}-${String(m+1).padStart(2,"0")}-01`;
    const last = new Date(y, m+1, 0).getDate();
    const to   = `${y}-${String(m+1).padStart(2,"0")}-${last}`;
    const pd   = new Date(y, m-1, 1);
    const pf   = `${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,"0")}-01`;
    const pl   = new Date(pd.getFullYear(), pd.getMonth()+1, 0).getDate();
    const pt   = `${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,"0")}-${pl}`;

    const [cur, prev, ytd, prof2] = await Promise.all([
      supabase.from("shifts").select("*").eq("user_id",user.id).gte("shift_date",from).lte("shift_date",to).order("shift_date"),
      supabase.from("shifts").select("*").eq("user_id",user.id).gte("shift_date",pf).lte("shift_date",pt),
      supabase.from("shifts").select("tips,tips_2").eq("user_id",user.id).gte("shift_date",`${y}-01-01`).lte("shift_date",to),
      supabase.from("profiles").select("contract_type,weekly_hours,weekly_rest_days,schedule_template").eq("id",user.id).single(),
    ]);

    const curShifts = (cur.data ?? []) as Shift[];
    setShifts(curShifts);
    setPrev((prev.data ?? []) as Shift[]);
    setYtd(((ytd.data ?? []) as {tips:number;tips_2:number}[]).reduce((s,r) => s+(r.tips??0)+(r.tips_2??0), 0));
    if (prof2.data) setProfile(prof2.data as ShiftProfile);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(year, month); }, [year, month, load]);

  function prevMonth() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  async function handleSave(data: Partial<Shift>) {
    const ex = shiftMap.get(data.shift_date!);
    const eid = estId || (typeof document !== "undefined" ? (document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) ?? [])[1] ?? null : null);
    if (ex) {
      await supabase.from("shifts").update(data).eq("id", ex.id);
    } else {
      if (!eid) return; // ne pas sauvegarder sans establishment_id
      await supabase.from("shifts").insert({ ...data, user_id: userId, establishment_id: eid });
    }
    // Notifier le manager en temps réel via broadcast
    broadcastRef.current?.send({ type: "broadcast", event: "shift_saved", payload: {} });
    setSelected(null);
    await load(year, month);
  }

  async function handleDelete() {
    const ex = shiftMap.get(selected!);
    if (ex) {
      await supabase.from("shifts").delete().eq("id", ex.id);
      broadcastRef.current?.send({ type: "broadcast", event: "shift_saved", payload: {} });
    }
    setSelected(null);
    await load(year, month);
  }

const days     = getDaysInMonth(year, month);
  const shiftMap = shiftsToMap(shifts);
  const todayStr = toDateStr(today);
  const tHours   = calcTotalHours(shifts);
  const tTips    = calcTotalTips(shifts);

  const cntHrs   = profile ? monthlyContractHours(profile.weekly_hours) : 0;
  const pctW     = cntHrs > 0 ? Math.min(Math.round((tHours/cntHrs)*100), 100) : 0;
  const firstDay = isoWeekday(days[0]) - 1;
  const cells: (Date|null)[] = [...Array(firstDay).fill(null), ...days];

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Mes Shifts</MonoLabel>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          {greeting}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-sm mt-1 capitalize" style={{ color: "var(--foreground-dim)" }}>
          {estName && <span>{estName} · </span>}
          {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* 2-col layout on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">

        {/* Left: calendar + recap */}
        <div>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button onClick={prevMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronLeft size={18} /></button>
            <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{monthLabel(year, month)}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronRight size={18} /></button>
          </div>

          {/* Calendar */}
          <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-7" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              {WEEKDAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{d}</div>)}
            </div>
            {loading ? (
              <div className="p-8 text-center text-[13px]" style={{ color: "var(--foreground-dim)" }}>Chargement…</div>
            ) : (
              <div className="grid grid-cols-7 gap-1 p-1" style={{ background: "var(--background-elev)" }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} style={{ minHeight: 72, borderRadius: 8 }} />;
                  const dateStr  = toDateStr(day);
                  const shift    = shiftMap.get(dateStr);
                  const isToday  = dateStr === todayStr;
                  const totalTips = shift ? (shift.tips ?? 0) + (shift.tips_2 ?? 0) : 0;
                  const hasCoupure = shift && shift.start_time_2;
                  return (
                    <button key={dateStr} onClick={() => setSelected(dateStr)}
                      className="relative flex flex-col items-start justify-start overflow-hidden lg:min-h-[96px]"
                      style={{ minHeight: 72, padding: "6px 4px", borderRadius: 8, border: isToday ? "2px solid var(--foreground-muted)" : "1px solid var(--border-soft)", background: shift ? "rgba(6,182,212,0.04)" : "var(--background-elev)", cursor: "pointer" }}>
                      <span className="text-[12px] lg:text-[14px] mb-1 flex-shrink-0"
                        style={{ fontWeight: isToday ? 700 : 500, color: isToday ? "var(--foreground)" : "var(--foreground-muted)" }}>
                        {day.getDate()}
                      </span>
                      {shift && (() => {
                        const color = staffStatus
                          ? (tipSettings.colors[staffStatus] ?? STAFF_STATUSES[staffStatus]?.color ?? "var(--accent)")
                          : "var(--accent)";
                        const fmt = (t: string) => t.slice(0, 5).replace(":00", "h").replace(":", "h");
                        const time1 = shift.start_time ? fmt(shift.start_time) : null;
                        const time2 = hasCoupure && shift.start_time_2 ? fmt(shift.start_time_2) : null;
                        return (
                          <div className="w-full space-y-0.5 px-0.5">
                            {time1 && <p className="text-[8px] lg:text-[11px] font-mono font-medium leading-tight" style={{ color }}>{time1}</p>}
                            {time2 && <p className="text-[8px] lg:text-[11px] font-mono leading-tight" style={{ color, opacity: 0.65 }}>{time2}</p>}
                          </div>
                        );
                      })()}
                      {totalTips > 0 && (
                        <span className="absolute bottom-1 right-1 text-[7px] lg:text-[10px] font-mono font-bold" style={{ color: "#F59E0B" }}>
                          {formatTips(totalTips)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Récap */}
          {!loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="text-[20px] font-bold leading-tight" style={{ color: "#F59E0B" }}>{formatTips(tTips)}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>Tips ce mois</p>
                </div>
                <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                  <Trophy size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
                  <div>
                    <p className="text-[20px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>{formatTips(ytdTips)}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>Tips {year}</p>
                  </div>
                </div>
              </div>

              {profile && cntHrs > 0 && (
                <div className="rounded-xl px-4 py-3.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                  <div className="flex justify-between mb-2">
                    <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Contrat {profile.contract_type ?? ""}</p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>{formatHours(tHours)} / {formatHours(cntHrs)}</p>
                  </div>
                  <div className="rounded-full overflow-hidden mb-1" style={{ height: 5, background: "var(--background-soft)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctW}%`, background: pctW >= 100 ? "var(--success)" : "var(--accent)", transition: "width 0.5s" }} />
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{pctW}% du mensuel légal</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <a href="/shifts/settings" className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Réglages →</a>
              </div>
            </div>
          )}

          {/* Planning section — mobile only (below recap) */}
          {estId && userId && (
            <div className="mt-6 lg:hidden">
              <PlanningSection estId={estId} userId={userId} />
            </div>
          )}
        </div>

        {/* Right: planning (desktop only) */}
        {estId && userId && (
          <div className="hidden lg:block">
            <PlanningSection estId={estId} userId={userId} />
          </div>
        )}

      </div>

      </div>{/* end 2-col grid */}

      <button onClick={() => setSelected(todayStr)} className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {selected && (
        <ShiftModal date={selected} shift={shiftMap.get(selected) ?? null} onSave={handleSave} onDelete={handleDelete} onClose={() => setSelected(null)} tipSettings={tipSettings} tipsEnabled={tipsEnabled} />
      )}
    </div>
  );
}
