"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Euro, FileText, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import {
  Shift, ShiftProfile, toDateStr, getDaysInMonth, isoWeekday, monthLabel,
  calcTotalHours, calcTotalTips, formatHours, formatTips, shiftsToMap, calcNetHours,
  changePercent, monthlyContractHours,
} from "@/lib/shifts";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── Shift Modal ──────────────────────────────────────────────────────────── */
function ShiftModal({ date, shift, onSave, onDelete, onClose }: {
  date: string; shift: Shift | null;
  onSave: (data: Partial<Shift>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = useState(shift?.start_time ?? "09:00");
  const [endTime, setEndTime]     = useState(shift?.end_time   ?? "17:00");
  const [tips, setTips]           = useState(String(shift?.tips ?? ""));
  const [note, setNote]           = useState(shift?.note ?? "");
  const [saving, setSaving]       = useState(false);
  const netHours = startTime && endTime ? calcNetHours(startTime, endTime) : 0;

  async function handleSave() {
    setSaving(true);
    await onSave({ shift_date: date, start_time: startTime, end_time: endTime, hours_worked: netHours, tips: parseFloat(tips) || 0, note: note || null });
    setSaving(false);
  }

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{shift ? "Modifier le shift" : "Ajouter un shift"}</h2>
            <p className="text-[12px] mt-0.5 capitalize" style={{ color: "var(--foreground-dim)" }}>{displayDate}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        {netHours > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-base mb-3" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <Clock size={12} style={{ color: "var(--accent)" }} />
            <span className="text-[12px]" style={{ color: "var(--accent)" }}>{formatHours(netHours)} net</span>
          </div>
        )}
        <div className="mb-3">
          <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Pourboires (€)</label>
          <div className="relative">
            <Euro size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
            <input type="number" min="0" step="0.5" value={tips} onChange={e => setTips(e.target.value)} placeholder="0" className="w-full pl-8 pr-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="mb-5">
          <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Note</label>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3" style={{ color: "var(--foreground-dim)" }} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Remarque…" rows={2} className="w-full pl-8 pr-3 py-2 rounded-base text-[13px] outline-none resize-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="flex gap-2">
          {shift && <button onClick={onDelete} className="px-4 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Supprimer</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-base text-[13px] font-semibold" style={{ background: "var(--success)", color: "#09090B", opacity: saving ? 0.7 : 1 }}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Tips bar chart ───────────────────────────────────────────────────────── */
function TipsChart({ shifts, year, month }: { shifts: Shift[]; year: number; month: number }) {
  const days = getDaysInMonth(year, month);
  const tipsMap = new Map(shifts.map(s => [s.shift_date, s.tips]));
  const maxTips = Math.max(...shifts.map(s => s.tips), 1);
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Tips par jour</p>
      <div className="flex items-end gap-0.5" style={{ height: 52 }}>
        {days.map(d => {
          const str = toDateStr(d);
          const t = tipsMap.get(str) ?? 0;
          return (
            <div key={str} className="flex-1 relative group" style={{ height: "100%" }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-sm" style={{ height: t > 0 ? `${Math.max((t / maxTips) * 100, 8)}%` : "3px", background: t > 0 ? (t / maxTips > 0.7 ? "var(--accent)" : "rgba(6,182,212,0.4)") : "var(--background-soft)" }} />
              {t > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  {d.getDate()} — {formatTips(t)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
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
  const [estId, setEstId]         = useState<string>("");
  const [userId, setUserId]       = useState<string>("");
  const supabase = createClient();

  const loadShifts = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", user.id).eq("is_active", true).single();
    if (member) setEstId(member.establishment_id);

    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`;

    const prevDate = new Date(y, m - 1, 1);
    const pFrom = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;
    const pLastDay = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();
    const pTo = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${pLastDay}`;

    const [cur, prev, ytd, prof] = await Promise.all([
      supabase.from("shifts").select("*").eq("user_id", user.id).gte("shift_date", from).lte("shift_date", to).order("shift_date"),
      supabase.from("shifts").select("*").eq("user_id", user.id).gte("shift_date", pFrom).lte("shift_date", pTo),
      supabase.from("shifts").select("tips").eq("user_id", user.id).gte("shift_date", `${y}-01-01`).lte("shift_date", to),
      supabase.from("profiles").select("contract_type, weekly_hours, weekly_rest_days").eq("id", user.id).single(),
    ]);

    setShifts((cur.data ?? []) as Shift[]);
    setPrev((prev.data ?? []) as Shift[]);
    setYtd(((ytd.data ?? []) as { tips: number }[]).reduce((s, r) => s + (r.tips ?? 0), 0));
    if (prof.data) setProfile(prof.data as ShiftProfile);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadShifts(year, month); }, [year, month, loadShifts]);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  async function handleSave(data: Partial<Shift>) {
    const existing = shiftMap.get(data.shift_date!);
    if (existing) await supabase.from("shifts").update(data).eq("id", existing.id);
    else await supabase.from("shifts").insert({ ...data, user_id: userId, establishment_id: estId });
    setSelected(null);
    await loadShifts(year, month);
  }

  async function handleDelete() {
    const existing = shiftMap.get(selected!);
    if (existing) await supabase.from("shifts").delete().eq("id", existing.id);
    setSelected(null);
    await loadShifts(year, month);
  }

  const days        = getDaysInMonth(year, month);
  const shiftMap    = shiftsToMap(shifts);
  const todayStr    = toDateStr(today);
  const totalHours  = calcTotalHours(shifts);
  const totalTips   = calcTotalTips(shifts);
  const prevHours   = calcTotalHours(prevShifts);
  const prevTips    = calcTotalTips(prevShifts);
  const contractHrs = profile ? monthlyContractHours(profile.weekly_hours) : 0;
  const pctWorked   = contractHrs > 0 ? Math.min(Math.round((totalHours / contractHrs) * 100), 100) : 0;
  const firstDay    = isoWeekday(days[0]) - 1;
  const cells: (Date | null)[] = [...Array(firstDay).fill(null), ...days];

  const chHours = changePercent(totalHours, prevHours);
  const chTips  = changePercent(totalTips, prevTips);

  return (
    <div className="px-4 lg:px-8 py-6 pb-32 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <MonoLabel size="xs">Mes Shifts</MonoLabel>
        <div className="flex items-center gap-3">
          <a href="/shifts/recap" className="text-[11px] lg:hidden" style={{ color: "var(--accent)" }}>Récap →</a>
          <a href="/shifts/settings" className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Réglages</a>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button onClick={prevMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronLeft size={18} /></button>
        <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{monthLabel(year, month)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronRight size={18} /></button>
      </div>

      {/* 2-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

        {/* Left: Calendar */}
        <div>
          {/* Mobile stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
            {[
              { label: "Heures", value: formatHours(totalHours) },
              { label: "Tips", value: formatTips(totalTips), accent: true },
              { label: "Services", value: String(shifts.length) },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: s.accent ? "rgba(6,182,212,0.08)" : "var(--background-elev)", border: `1px solid ${s.accent ? "rgba(6,182,212,0.2)" : "var(--border)"}` }}>
                <p className="text-[15px] font-bold" style={{ color: s.accent ? "var(--accent)" : "var(--foreground)" }}>{loading ? "—" : s.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-7" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              {WEEKDAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{d}</div>)}
            </div>
            {loading ? (
              <div className="p-8 text-center text-[13px]" style={{ color: "var(--foreground-dim)" }}>Chargement…</div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} style={{ minHeight: 64, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} />;
                  const dateStr = toDateStr(day);
                  const shift = shiftMap.get(dateStr);
                  const isToday = dateStr === todayStr;
                  const isFuture = day > today;
                  return (
                    <button key={dateStr} onClick={() => !isFuture && setSelected(dateStr)}
                      className="flex flex-col items-center justify-start pt-2 pb-1 px-1 transition-colors"
                      style={{ minHeight: 64, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: shift ? "rgba(6,182,212,0.04)" : "transparent", cursor: isFuture ? "default" : "pointer", opacity: isFuture ? 0.35 : 1 }}>
                      <span className="text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5"
                        style={{ background: isToday ? "var(--accent)" : "transparent", color: isToday ? "#09090B" : shift ? "var(--foreground)" : "var(--foreground-muted)" }}>
                        {day.getDate()}
                      </span>
                      {shift && (
                        <span className="text-[9px] font-mono leading-tight text-center w-full px-0.5" style={{ color: "var(--accent)" }}>
                          {formatHours(shift.hours_worked)}{shift.tips > 0 && <><br />{formatTips(shift.tips)}</>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats panel — desktop only */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* Stat cards */}
          {[
            { label: "Heures", value: formatHours(totalHours), change: chHours, accent: false },
            { label: "Pourboires", value: formatTips(totalTips), change: chTips, accent: true },
            { label: "Services", value: String(shifts.length), change: changePercent(shifts.length, prevShifts.length), accent: false },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3.5" style={{ background: s.accent ? "rgba(6,182,212,0.08)" : "var(--background-elev)", border: `1px solid ${s.accent ? "rgba(6,182,212,0.2)" : "var(--border)"}` }}>
              <p className="text-[22px] font-bold" style={{ color: s.accent ? "var(--accent)" : "var(--foreground)" }}>{loading ? "—" : s.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
              {s.change !== null && s.change !== undefined && !loading && (
                <div className="flex items-center gap-1">
                  {s.change >= 0 ? <TrendingUp size={10} color="#10b981" /> : <TrendingDown size={10} color="#ef4444" />}
                  <span className="text-[10px]" style={{ color: s.change >= 0 ? "var(--success)" : "var(--danger)" }}>{s.change >= 0 ? "+" : ""}{s.change}% vs mois préc.</span>
                </div>
              )}
            </div>
          ))}

          {/* Contrat progress */}
          {profile && contractHrs > 0 && !loading && (
            <div className="rounded-xl px-4 py-3.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <div className="flex justify-between mb-2">
                <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Contrat {profile.contract_type ?? ""}</p>
                <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>{formatHours(totalHours)}/{formatHours(contractHrs)}</p>
              </div>
              <div className="rounded-full overflow-hidden mb-1" style={{ height: 5, background: "var(--background-soft)" }}>
                <div className="h-full rounded-full" style={{ width: `${pctWorked}%`, background: pctWorked >= 100 ? "var(--success)" : "var(--accent)", transition: "width 0.5s" }} />
              </div>
              <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{pctWorked}% du mensuel légal</p>
            </div>
          )}

          {/* Tips chart */}
          {shifts.length > 0 && !loading && (
            <div className="rounded-xl px-4 py-3.5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <TipsChart shifts={shifts} year={year} month={month} />
            </div>
          )}

          {/* YTD */}
          {!loading && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <Trophy size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Total tips {year}</p>
                <p className="text-[16px] font-bold" style={{ color: "var(--foreground)" }}>{formatTips(ytdTips)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setSelected(todayStr)} className="fixed bottom-24 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: "var(--accent)", color: "#09090B" }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {selected && (
        <ShiftModal date={selected} shift={shiftMap.get(selected) ?? null} onSave={handleSave} onDelete={handleDelete} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
