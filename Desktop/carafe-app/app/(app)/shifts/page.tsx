"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Euro, FileText, Trophy, Sunrise, Sunset, CheckCircle2, Circle } from "lucide-react";
import {
  Shift, ShiftProfile, toDateStr, getDaysInMonth, isoWeekday, monthLabel,
  calcTotalHours, calcTotalTips, formatHours, formatTips, shiftsToMap, calcNetHours,
  changePercent, monthlyContractHours, parseTipSettings, DEFAULT_TIP_SETTINGS, type TipSettings,
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
            Ajouter service du soir (coupure)
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
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-base text-[13px] font-semibold" style={{ background: "var(--success)", color: "#09090B", opacity: saving ? 0.7 : 1 }}>{saving ? "…" : "Enregistrer"}</button>
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
  const [validating, setValidating] = useState(false);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
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
    // Check if all shifts this month are validated
    const allValidated = curShifts.length > 0 && curShifts.every(s => (s as Shift & { validated_at?: string }).validated_at);
    const latestValidation = curShifts.reduce((latest: string | null, s) => {
      const v = (s as Shift & { validated_at?: string }).validated_at;
      if (!v) return latest;
      return !latest || v > latest ? v : latest;
    }, null);
    setValidatedAt(allValidated ? latestValidation : null);
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

  async function handleValidate() {
    if (!userId || shifts.length === 0) return;
    setValidating(true);
    const now = new Date().toISOString();
    const from = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const last = new Date(year, month+1, 0).getDate();
    const to = `${year}-${String(month+1).padStart(2,"0")}-${last}`;
    await supabase.from("shifts")
      .update({ validated_at: now })
      .eq("user_id", userId)
      .gte("shift_date", from)
      .lte("shift_date", to);
    setValidatedAt(now);
    setValidating(false);
  }

  const days     = getDaysInMonth(year, month);
  const shiftMap = shiftsToMap(shifts);
  const todayStr = toDateStr(today);
  const tHours   = calcTotalHours(shifts);
  const tTips    = calcTotalTips(shifts);
  const cHrs     = changePercent(tHours, calcTotalHours(prevShifts));
  const cTps     = changePercent(tTips, calcTotalTips(prevShifts));
  const cntHrs   = profile ? monthlyContractHours(profile.weekly_hours) : 0;
  const pctW     = cntHrs > 0 ? Math.min(Math.round((tHours/cntHrs)*100), 100) : 0;
  const firstDay = isoWeekday(days[0]) - 1;
  const cells: (Date|null)[] = [...Array(firstDay).fill(null), ...days];

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-2xl lg:max-w-4xl">

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
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={{ minHeight: 80, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} />;
              const dateStr  = toDateStr(day);
              const shift    = shiftMap.get(dateStr);
              const isToday  = dateStr === todayStr;
              const isFuture = day > today;
              const totalTips = shift ? (shift.tips ?? 0) + (shift.tips_2 ?? 0) : 0;
              const hasCoupure = shift && shift.start_time_2;
              return (
                <button key={dateStr} onClick={() => !isFuture && setSelected(dateStr)}
                  className="flex flex-col items-start justify-start p-1.5 transition-colors hover:bg-white/[0.02]"
                  style={{ minHeight: 80, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: shift ? "rgba(6,182,212,0.04)" : "transparent", cursor: isFuture ? "default" : "pointer", opacity: isFuture ? 0.3 : 1 }}>
                  <span className="text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1"
                    style={{ background: isToday ? "var(--accent)" : "transparent", color: isToday ? "#09090B" : shift ? "var(--foreground)" : "var(--foreground-muted)" }}>
                    {day.getDate()}
                  </span>
                  {shift && (
                    <div className="w-full space-y-0.5">
                      {(() => {
                        const color = staffStatus
                          ? (tipSettings.colors[staffStatus] ?? STAFF_STATUSES[staffStatus]?.color ?? "var(--accent)")
                          : "var(--accent)";
                        const time1 = shift.start_time && shift.end_time
                          ? `${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`
                          : null;
                        const time2 = hasCoupure && shift.start_time_2 && shift.end_time_2
                          ? `${shift.start_time_2.slice(0, 5)}–${shift.end_time_2.slice(0, 5)}`
                          : null;
                        return (
                          <>
                            {time1 && (
                              <div className="w-full rounded overflow-hidden px-1 py-0.5" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                                <p className="text-[7px] font-mono leading-tight truncate" style={{ color, opacity: 0.9 }}>{time1}</p>
                              </div>
                            )}
                            {time2 && (
                              <div className="w-full rounded overflow-hidden px-1 py-0.5" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                                <p className="text-[7px] font-mono leading-tight truncate" style={{ color, opacity: 0.7 }}>{time2}</p>
                              </div>
                            )}
                            {totalTips > 0 && (
                              <p className="text-[8px] font-mono font-bold leading-tight" style={{ color: "#F59E0B" }}>{formatTips(totalTips)}</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
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

          {/* Validation du planning */}
          {shifts.length > 0 && (
            <div className="rounded-xl px-4 py-4"
              style={{ background: validatedAt ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${validatedAt ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {validatedAt
                    ? <CheckCircle2 size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
                    : <Circle size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
                  }
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: validatedAt ? "var(--success)" : "#F59E0B" }}>
                      {validatedAt ? "Planning validé ✓" : "Planning à valider"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                      {validatedAt
                        ? `Le ${new Date(validatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                        : `${shifts.length} shift${shifts.length > 1 ? "s" : ""} ce mois — confirme ta présence`
                      }
                    </p>
                  </div>
                </div>
                {!validatedAt && (
                  <button onClick={handleValidate} disabled={validating}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold flex-shrink-0"
                    style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.4)", opacity: validating ? 0.6 : 1 }}>
                    {validating ? "…" : "Valider"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <a href="/shifts/settings" className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Réglages →</a>
          </div>
        </div>
      )}

      <button onClick={() => setSelected(todayStr)} className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: "var(--accent)", color: "#09090B" }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {selected && (
        <ShiftModal date={selected} shift={shiftMap.get(selected) ?? null} onSave={handleSave} onDelete={handleDelete} onClose={() => setSelected(null)} tipSettings={tipSettings} tipsEnabled={tipsEnabled} />
      )}
    </div>
  );
}
