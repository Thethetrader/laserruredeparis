"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Euro, FileText } from "lucide-react";
import {
  Shift, toDateStr, getDaysInMonth, isoWeekday, monthLabel,
  calcTotalHours, calcTotalTips, formatHours, formatTips, shiftsToMap, calcNetHours,
} from "@/lib/shifts";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── Shift Modal ──────────────────────────────────────────────────────────── */
function ShiftModal({
  date, shift, onSave, onDelete, onClose,
}: {
  date: string;
  shift: Shift | null;
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
    await onSave({
      shift_date: date,
      start_time: startTime,
      end_time: endTime,
      hours_worked: netHours,
      tips: parseFloat(tips) || 0,
      note: note || null,
    });
    setSaving(false);
  }

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
              {shift ? "Modifier le shift" : "Ajouter un shift"}
            </h2>
            <p className="text-[12px] mt-0.5 capitalize" style={{ color: "var(--foreground-dim)" }}>{displayDate}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Net hours */}
        {netHours > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-base mb-3" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <Clock size={12} style={{ color: "var(--accent)" }} />
            <span className="text-[12px]" style={{ color: "var(--accent)" }}>
              {formatHours(netHours)} net
              {netHours < (parseFloat(endTime) - parseFloat(startTime)) && " (pause 30 min incluse)"}
            </span>
          </div>
        )}

        {/* Tips */}
        <div className="mb-3">
          <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Pourboires (€)</label>
          <div className="relative">
            <Euro size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
            <input type="number" min="0" step="0.5" value={tips} onChange={e => setTips(e.target.value)} placeholder="0"
              className="w-full pl-8 pr-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Note</label>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3" style={{ color: "var(--foreground-dim)" }} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Remarque, événement…" rows={2}
              className="w-full pl-8 pr-3 py-2 rounded-base text-[13px] outline-none resize-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {shift && (
            <button onClick={onDelete} className="px-4 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
              Supprimer
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-base text-[13px] font-semibold" style={{ background: "var(--success)", color: "#09090B", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar Page ────────────────────────────────────────────────────────── */
export default function ShiftsPage() {
  const today = new Date();
  const [year, setYear]         = useState(today.getFullYear());
  const [month, setMonth]       = useState(today.getMonth());
  const [shifts, setShifts]     = useState<Shift[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [estId, setEstId]       = useState<string>("");
  const [userId, setUserId]     = useState<string>("");

  const supabase = createClient();

  const loadShifts = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: member } = await supabase
      .from("establishment_members").select("establishment_id")
      .eq("profile_id", user.id).eq("is_active", true).single();
    if (member) setEstId(member.establishment_id);

    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`;

    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .gte("shift_date", from)
      .lte("shift_date", to)
      .order("shift_date");
    setShifts((data ?? []) as Shift[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadShifts(year, month); }, [year, month, loadShifts]);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  async function handleSave(data: Partial<Shift>) {
    const existing = shiftMap.get(data.shift_date!);
    if (existing) {
      await supabase.from("shifts").update(data).eq("id", existing.id);
    } else {
      await supabase.from("shifts").insert({ ...data, user_id: userId, establishment_id: estId });
    }
    setSelected(null);
    await loadShifts(year, month);
  }

  async function handleDelete() {
    const existing = shiftMap.get(selected!);
    if (existing) await supabase.from("shifts").delete().eq("id", existing.id);
    setSelected(null);
    await loadShifts(year, month);
  }

  const days       = getDaysInMonth(year, month);
  const shiftMap   = shiftsToMap(shifts);
  const todayStr   = toDateStr(today);
  const totalHours = calcTotalHours(shifts);
  const totalTips  = calcTotalTips(shifts);

  // Build grid: pad start with empty cells
  const firstDay = isoWeekday(days[0]) - 1; // 0-indexed offset
  const cells: (Date | null)[] = [...Array(firstDay).fill(null), ...days];

  return (
    <div className="px-4 py-6 pb-32 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <MonoLabel size="xs">Mes Shifts</MonoLabel>
        <a href="/shifts/settings" className="text-[11px]" style={{ color: "var(--accent)" }}>Réglages →</a>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prevMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>
          {monthLabel(year, month)}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Heures", value: formatHours(totalHours) },
          { label: "Pourboires", value: formatTips(totalTips), accent: true },
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
        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
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
                <button
                  key={dateStr}
                  onClick={() => !isFuture && setSelected(dateStr)}
                  className="flex flex-col items-center justify-start pt-2 pb-1 px-1 text-left transition-colors"
                  style={{
                    minHeight: 64,
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    background: shift ? "rgba(6,182,212,0.04)" : "transparent",
                    cursor: isFuture ? "default" : "pointer",
                    opacity: isFuture ? 0.35 : 1,
                  }}
                >
                  <span
                    className="text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5"
                    style={{
                      background: isToday ? "var(--accent)" : "transparent",
                      color: isToday ? "#09090B" : shift ? "var(--foreground)" : "var(--foreground-muted)",
                    }}
                  >
                    {day.getDate()}
                  </span>
                  {shift && (
                    <span className="text-[9px] font-mono leading-tight text-center w-full px-0.5" style={{ color: "var(--accent)" }}>
                      {formatHours(shift.hours_worked)}
                      {shift.tips > 0 && <><br />{formatTips(shift.tips)}</>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSelected(todayStr)}
        className="fixed bottom-24 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: "var(--accent)", color: "#09090B" }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {selected && (
        <ShiftModal
          date={selected}
          shift={shiftMap.get(selected) ?? null}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
