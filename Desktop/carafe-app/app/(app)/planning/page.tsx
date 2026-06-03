"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Sparkles, Check, RefreshCw, Clock, BarChart2, TrendingUp } from "lucide-react";
import { toDateStr, formatHours, DEFAULT_PAUSE_SETTINGS, STAFF_STATUSES, type StaffStatus } from "@/lib/shifts";

const DEV_MODE = false;

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const SERVICES_LIST = ["salle", "cuisine", "bar"] as const;
type ServiceType = typeof SERVICES_LIST[number];
const SERVICE_LABELS: Record<ServiceType, string> = { salle: "Salle", cuisine: "Cuisine", bar: "Bar" };

interface ServicePeriod {
  start: string;
  end: string;
  salle: number;
  cuisine: number;
  bar: number;
}

interface ServiceNeeds {
  midi: ServicePeriod;
  soir: ServicePeriod;
  service_days: number[];
}

const DEFAULT_NEEDS: ServiceNeeds = {
  midi: { start: "11:30", end: "15:30", salle: 2, cuisine: 2, bar: 1 },
  soir: { start: "18:30", end: "23:00", salle: 3, cuisine: 2, bar: 1 },
  service_days: [1, 2, 3, 4, 5, 6],
};


const DEV_EMPLOYEES = [
  { id: "u1", name: "Yasmine", role: "chef_de_rang", weekly_hours: 35, hourly_rate: 14.00 },
  { id: "u2", name: "Rayan",   role: "serveur",      weekly_hours: 30, hourly_rate: 12.00 },
  { id: "u3", name: "Marco",   role: "cuisinier",    weekly_hours: 35, hourly_rate: 13.00 },
  { id: "u4", name: "Léa",     role: "commis",       weekly_hours: 20, hourly_rate: 11.88 },
];

interface PlanningWeek {
  id: string;
  week_start: string;
  status: "draft" | "published";
  service_needs: ServiceNeeds | null;
}

interface PlanningShift {
  id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  service: string;
  confirmation_status: "pending" | "confirmed" | "modified";
  first_name?: string | null;
  staff_status?: string | null;
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function weekLabel(monday: Date): string {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const start_fr = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const end_fr = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${start_fr} – ${end_fr}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const raw = (eh * 60 + em) - (sh * 60 + sm);
  if (raw <= 0) return 0;
  const p = DEFAULT_PAUSE_SETTINGS;
  const br = raw > 480 ? p.break_over_8h : raw > 360 ? p.break_6_8h : 0;
  return (raw - br) / 60;
}

export default function PlanningPage() {
  const [devRole] = useDevRole();
  const isEmployee = DEV_MODE ? devRole === "employee" : false;

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [planningWeek, setPlanningWeek] = useState<PlanningWeek | null | undefined>(undefined);
  const [planningShifts, setPlanningShifts] = useState<PlanningShift[]>([]);
  const [needs, setNeeds] = useState<ServiceNeeds>(DEFAULT_NEEDS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [estId, setEstId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(weekStart);

  const load = useCallback(async (monday: Date) => {
    setLoading(true);
    setError(null);

    if (DEV_MODE) {
      setEstId("dev-establishment");
      setPlanningWeek(null);
      setPlanningShifts([]);
      setNeeds(DEFAULT_NEEDS);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const eid = typeof window !== "undefined" ? localStorage.getItem("active_establishment_id") : null;
    if (!eid) { setPlanningWeek(null); setLoading(false); return; }
    setEstId(eid);

    const weekStr = toDateStr(monday);

    const { data: pw } = await supabase
      .from("planning_weeks")
      .select("*")
      .eq("establishment_id", eid)
      .eq("week_start", weekStr)
      .maybeSingle();

    if (pw) {
      setPlanningWeek(pw as PlanningWeek);
      if (pw.service_needs) setNeeds(pw.service_needs as ServiceNeeds);

      const { data: ps } = await supabase
        .from("planning_shifts")
        .select("id, user_id, shift_date, start_time, end_time, service, confirmation_status, profiles(first_name, staff_status)")
        .eq("planning_week_id", pw.id)
        .order("shift_date")
        .order("start_time");

      if (ps) {
        setPlanningShifts(ps.map((s: any) => ({
          ...s,
          first_name: (s.profiles as any)?.first_name ?? null,
          staff_status: (s.profiles as any)?.staff_status ?? null,
        })));
      }
    } else {
      setPlanningWeek(null);
      setPlanningShifts([]);

      // Pre-fill needs from previous week
      const prevMonday = new Date(monday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const { data: prevPw } = await supabase
        .from("planning_weeks")
        .select("service_needs")
        .eq("establishment_id", eid)
        .eq("week_start", toDateStr(prevMonday))
        .maybeSingle();

      if (prevPw?.service_needs) {
        setNeeds(prevPw.service_needs as ServiceNeeds);
      } else {
        setNeeds(DEFAULT_NEEDS);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(weekStart); }, [weekStart, load]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
    setPlanningWeek(undefined);
    setPlanningShifts([]);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
    setPlanningWeek(undefined);
    setPlanningShifts([]);
  }

  const devRates: Record<string, EmployeeRate> = DEV_MODE ? Object.fromEntries(
    DEV_EMPLOYEES.map(e => [e.id, { name: e.name, status: e.role, hourly_rate: e.hourly_rate }])
  ) : {};

  async function handleGenerate() {
    if (!estId) return;
    setGenerating(true);
    setError(null);

    if (DEV_MODE) {
      // Simulate AI generation with mock employees
      await new Promise(r => setTimeout(r, 1200));
      const monday = weekStart;
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return toDateStr(d);
      });
      const serviceDates = weekDays.filter((_, i) => needs.service_days.includes(i + 1));
      const shifts: PlanningShift[] = [];
      let shiftId = 1;
      for (const date of serviceDates) {
        // Midi service
        shifts.push({ id: `dev-s${shiftId++}`, user_id: "u1", shift_date: date, start_time: needs.midi.start, end_time: needs.midi.end, service: "midi", confirmation_status: "pending", first_name: "Yasmine", staff_status: "chef_de_rang" });
        shifts.push({ id: `dev-s${shiftId++}`, user_id: "u3", shift_date: date, start_time: needs.midi.start, end_time: needs.midi.end, service: "midi", confirmation_status: "pending", first_name: "Marco", staff_status: "cuisinier" });
        // Soir service
        shifts.push({ id: `dev-s${shiftId++}`, user_id: "u1", shift_date: date, start_time: needs.soir.start, end_time: needs.soir.end, service: "soir", confirmation_status: "pending", first_name: "Yasmine", staff_status: "chef_de_rang" });
        shifts.push({ id: `dev-s${shiftId++}`, user_id: "u2", shift_date: date, start_time: needs.soir.start, end_time: needs.soir.end, service: "soir", confirmation_status: "pending", first_name: "Rayan", staff_status: "serveur" });
        shifts.push({ id: `dev-s${shiftId++}`, user_id: "u3", shift_date: date, start_time: needs.soir.start, end_time: needs.soir.end, service: "soir", confirmation_status: "pending", first_name: "Marco", staff_status: "cuisinier" });
        // Léa on weekends only (index 5=Sat, 6=Sun)
        const dayIdx = weekDays.indexOf(date);
        if (dayIdx >= 4) {
          shifts.push({ id: `dev-s${shiftId++}`, user_id: "u4", shift_date: date, start_time: needs.midi.start, end_time: needs.midi.end, service: "midi", confirmation_status: "pending", first_name: "Léa", staff_status: "commis" });
          shifts.push({ id: `dev-s${shiftId++}`, user_id: "u4", shift_date: date, start_time: needs.soir.start, end_time: needs.soir.end, service: "soir", confirmation_status: "pending", first_name: "Léa", staff_status: "commis" });
        }
      }
      setPlanningWeek({ id: "dev-pw-1", week_start: toDateStr(weekStart), status: "draft", service_needs: needs });
      setPlanningShifts(shifts);
      setGenerating(false);
      return;
    }

    try {
      const resp = await fetch("/api/planning/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishment_id: estId, week_start: toDateStr(weekStart), needs }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error ?? "Erreur génération");
      await load(weekStart);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  }

  async function handleValidate() {
    if (!planningWeek || !estId) return;
    setValidating(true);
    setError(null);

    if (DEV_MODE) {
      await new Promise(r => setTimeout(r, 600));
      setPlanningWeek(prev => prev ? { ...prev, status: "published" } : prev);
      setValidating(false);
      return;
    }

    try {
      const supabase = createClient();

      // Group by (user_id, shift_date) to handle midi + soir → 1 or 2 rows
      const byUserDate = new Map<string, PlanningShift[]>();
      for (const ps of planningShifts) {
        const key = `${ps.user_id}__${ps.shift_date}`;
        if (!byUserDate.has(key)) byUserDate.set(key, []);
        byUserDate.get(key)!.push(ps);
      }

      const shiftsToCreate = Array.from(byUserDate.values()).map(group => {
        const sorted = group.sort((a, b) => a.start_time.localeCompare(b.start_time));
        const first = sorted[0];
        const second = sorted[1];
        return {
          user_id: first.user_id,
          establishment_id: estId,
          shift_date: first.shift_date,
          start_time: first.start_time,
          end_time: first.end_time,
          hours_worked: calcHours(first.start_time, first.end_time),
          tips: 0,
          start_time_2: second?.start_time ?? null,
          end_time_2: second?.end_time ?? null,
          hours_worked_2: second ? calcHours(second.start_time, second.end_time) : 0,
          tips_2: 0,
        };
      });

      const { error: shiftError } = await supabase.from("shifts").insert(shiftsToCreate);
      if (shiftError) throw new Error(shiftError.message);

      await supabase
        .from("planning_weeks")
        .update({ status: "published", validated_at: new Date().toISOString() })
        .eq("id", planningWeek.id);

      await load(weekStart);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setValidating(false);
    }
  }

  async function handleRegenerate() {
    if (!planningWeek) return;
    if (DEV_MODE) {
      setPlanningWeek(null);
      setPlanningShifts([]);
      return;
    }
    const supabase = createClient();
    await supabase.from("planning_shifts").delete().eq("planning_week_id", planningWeek.id);
    await supabase.from("planning_weeks").delete().eq("id", planningWeek.id);
    setPlanningWeek(null);
    setPlanningShifts([]);
  }

  if (isEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Accès réservé aux managers</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-2xl lg:max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--foreground)" }}>Planning</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Génération IA du planning hebdomadaire</p>
        </div>
        <Sparkles size={20} style={{ color: "#F59E0B" }} />
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{weekLabel(weekStart)}</p>
          <MonoLabel size="xs" className="mt-0.5">S{getISOWeek(weekStart)}</MonoLabel>
        </div>
        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg text-[12px]"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {loading || planningWeek === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Chargement…</div>
        </div>
      ) : planningWeek?.status === "published" ? (
        <PublishedView shifts={planningShifts} weekDates={weekDates} rates={devRates} />
      ) : planningWeek?.status === "draft" ? (
        <DraftView
          shifts={planningShifts}
          weekDates={weekDates}
          onValidate={handleValidate}
          onRegenerate={handleRegenerate}
          validating={validating}
          rates={devRates}
        />
      ) : (
        <NeedsForm
          needs={needs}
          setNeeds={setNeeds}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}
    </div>
  );
}

// ── Needs Form ────────────────────────────────────────────────────────────────

function NeedsForm({ needs, setNeeds, onGenerate, generating }: {
  needs: ServiceNeeds;
  setNeeds: (n: ServiceNeeds) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  function updateCount(period: "midi" | "soir", service: ServiceType, value: number) {
    setNeeds({ ...needs, [period]: { ...needs[period], [service]: Math.max(0, value) } });
  }

  function updateTime(period: "midi" | "soir", field: "start" | "end", value: string) {
    setNeeds({ ...needs, [period]: { ...needs[period], [field]: value } });
  }

  function toggleDay(isoDay: number) {
    const days = needs.service_days.includes(isoDay)
      ? needs.service_days.filter(d => d !== isoDay)
      : [...needs.service_days, isoDay].sort((a, b) => a - b);
    setNeeds({ ...needs, service_days: days });
  }

  return (
    <div className="space-y-4">
      {/* Service days */}
      <div className="rounded-2xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--foreground-dim)" }}>Jours de service</p>
        <div className="flex gap-1.5">
          {DAYS_SHORT.map((label, i) => {
            const isoDay = i + 1;
            const active = needs.service_days.includes(isoDay);
            return (
              <button
                key={isoDay}
                onClick={() => toggleDay(isoDay)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                style={{
                  background: active ? "rgba(245,158,11,0.12)" : "var(--background)",
                  color: active ? "#F59E0B" : "var(--foreground-dim)",
                  border: active ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border-soft)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <ServicePeriodCard
        label="Midi"
        period={needs.midi}
        onCountChange={(s, v) => updateCount("midi", s, v)}
        onTimeChange={(f, v) => updateTime("midi", f, v)}
      />

      <ServicePeriodCard
        label="Soir"
        period={needs.soir}
        onCountChange={(s, v) => updateCount("soir", s, v)}
        onTimeChange={(f, v) => updateTime("soir", f, v)}
      />

      <button
        onClick={onGenerate}
        disabled={generating || needs.service_days.length === 0}
        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold transition-all"
        style={{
          background: generating ? "var(--background-elev)" : "linear-gradient(135deg, #F59E0B, #D97706)",
          color: generating ? "var(--foreground-dim)" : "#fff",
          border: "none",
          opacity: needs.service_days.length === 0 ? 0.5 : 1,
        }}
      >
        {generating
          ? <><RefreshCw size={15} className="animate-spin" />Génération en cours…</>
          : <><Sparkles size={15} />Générer le planning</>
        }
      </button>
    </div>
  );
}

function ServicePeriodCard({ label, period, onCountChange, onTimeChange }: {
  label: string;
  period: ServicePeriod;
  onCountChange: (service: ServiceType, value: number) => void;
  onTimeChange: (field: "start" | "end", value: string) => void;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Service du {label}</p>
        <div className="flex items-center gap-1.5">
          <Clock size={10} style={{ color: "var(--foreground-dim)" }} />
          <input type="time" value={period.start} onChange={e => onTimeChange("start", e.target.value)}
            className="text-[11px] font-mono rounded px-1.5 py-0.5 w-20"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>→</span>
          <input type="time" value={period.end} onChange={e => onTimeChange("end", e.target.value)}
            className="text-[11px] font-mono rounded px-1.5 py-0.5 w-20"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SERVICES_LIST.map(service => (
          <div key={service}>
            <p className="text-[10px] mb-1.5" style={{ color: "var(--foreground-dim)" }}>{SERVICE_LABELS[service]}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onCountChange(service, period[service] - 1)}
                className="w-7 h-7 rounded-lg text-[14px] font-bold flex items-center justify-center transition-colors"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
              >−</button>
              <span className="flex-1 text-center text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                {period[service]}
              </span>
              <button
                onClick={() => onCountChange(service, period[service] + 1)}
                className="w-7 h-7 rounded-lg text-[14px] font-bold flex items-center justify-center transition-colors"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Draft View ────────────────────────────────────────────────────────────────

const DAYS_FR_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function ShiftChip({ shift }: { shift: PlanningShift }) {
  const color = STAFF_STATUSES[shift.staff_status as StaffStatus]?.color ?? "#A1A1AA";
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="truncate">{shift.first_name ?? "?"}</span>
    </div>
  );
}

function WeekGrid({ shifts, weekDates }: { shifts: PlanningShift[]; weekDates: Date[] }) {
  const activeDates = weekDates.filter(d => shifts.some(s => s.shift_date === toDateStr(d)));
  if (activeDates.length === 0) return null;

  const getShifts = (date: Date, service: string) =>
    shifts.filter(s => s.shift_date === toDateStr(date) && s.service === service);

  const midiSample = shifts.find(s => s.service === "midi");
  const soirSample = shifts.find(s => s.service === "soir");
  const midiTime = midiSample ? `${midiSample.start_time.slice(0,5)} – ${midiSample.end_time.slice(0,5)}` : null;
  const soirTime = soirSample ? `${soirSample.start_time.slice(0,5)} – ${soirSample.end_time.slice(0,5)}` : null;

  const serviceRows = [
    midiTime ? { key: "midi", label: "MIDI", color: "#F59E0B", time: midiTime } : null,
    soirTime ? { key: "soir", label: "SOIR", color: "#818CF8", time: soirTime } : null,
  ].filter(Boolean) as { key: string; label: string; color: string; time: string }[];

  const n = activeDates.length;
  // Flexible columns — expand on wide screen, min 88px on scroll
  const MIN_COL = 92;
  const LABEL_W = 76;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: LABEL_W + n * MIN_COL }}>

        {/* Day headers */}
        <div className="flex items-stretch" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0 }} />
          {activeDates.map((date, i) => {
            const today = new Date().toISOString().split("T")[0] === toDateStr(date);
            const dayIdx = weekDates.indexOf(date);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
                style={{ minWidth: MIN_COL, borderLeft: "1px solid var(--border-soft)" }}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "var(--foreground-dim)" }}>{DAYS_FR_SHORT[dayIdx]}</span>
                <span className="text-[18px] font-bold leading-none"
                  style={{ color: today ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Service rows */}
        {serviceRows.map(({ key, label, color, time }, rowIdx) => (
          <div key={key} className="flex items-stretch"
            style={{ borderBottom: rowIdx < serviceRows.length - 1 ? "1px solid var(--border)" : "none" }}>
            {/* Row label */}
            <div className="flex flex-col justify-center gap-0.5 px-3 py-3"
              style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0, borderRight: "1px solid var(--border-soft)" }}>
              <span className="text-[11px] font-black tracking-widest" style={{ color }}>{label}</span>
              <span className="text-[9px] font-mono leading-snug" style={{ color: "var(--foreground-dim)" }}>{time}</span>
            </div>
            {/* Day cells */}
            {activeDates.map((date, i) => {
              const cell = getShifts(date, key);
              return (
                <div key={i} className="flex-1 flex flex-col gap-1 p-2"
                  style={{ minWidth: MIN_COL, minHeight: 72, borderLeft: "1px solid var(--border-soft)", background: i % 2 === 0 ? "var(--background-elev)" : "var(--background-soft)" }}>
                  {cell.map(s => <ShiftChip key={s.id} shift={s} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EmployeeRate {
  name: string;
  status: string;
  hourly_rate: number;
}

function WeekSummary({ shifts, rates }: {
  shifts: PlanningShift[];
  rates: Record<string, EmployeeRate>;
}) {
  const employees = Object.entries(rates).map(([userId, info]) => {
    const userShifts = shifts.filter(s => s.user_id === userId);
    if (userShifts.length === 0) return null;
    const hours = userShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time), 0);
    const cost = hours * info.hourly_rate;
    const color = STAFF_STATUSES[info.status as StaffStatus]?.color ?? "#A1A1AA";
    return { userId, ...info, hours, cost, color };
  }).filter(Boolean) as Array<EmployeeRate & { userId: string; hours: number; cost: number; color: string }>;

  if (employees.length === 0) return null;

  const totalHours = employees.reduce((s, e) => s + e.hours, 0);
  const totalCost = employees.reduce((s, e) => s + e.cost, 0);
  const ca30 = totalCost / 0.30;
  const ca35 = totalCost / 0.35;

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

  return (
    <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
        <BarChart2 size={13} style={{ color: "var(--accent)" }} />
        <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Récap masse salariale</p>
      </div>

      {/* Employee rows */}
      <div style={{ background: "var(--background-elev)" }}>
        {/* Column headers */}
        <div className="grid px-4 py-1.5" style={{ gridTemplateColumns: "1fr 64px 56px 60px", borderBottom: "1px solid var(--border-soft)" }}>
          {["Employé", "Heures", "Taux", "Coût"].map(h => (
            <p key={h} className="text-[9px] font-mono uppercase tracking-widest text-right first:text-left"
              style={{ color: "var(--foreground-dim)" }}>{h}</p>
          ))}
        </div>

        {employees.map((emp) => (
          <div key={emp.userId} className="grid items-center px-4 py-3"
            style={{ gridTemplateColumns: "1fr 64px 56px 60px", borderBottom: "1px solid var(--border-soft)" }}>
            {/* Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: emp.color }} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{emp.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            {/* Hours */}
            <p className="text-[13px] font-mono font-semibold text-right" style={{ color: "var(--foreground)" }}>
              {formatHours(emp.hours)}
            </p>
            {/* Rate */}
            <p className="text-[11px] font-mono text-right" style={{ color: "var(--foreground-dim)" }}>
              {emp.hourly_rate.toFixed(2)}€
            </p>
            {/* Cost */}
            <p className="text-[15px] font-bold text-right" style={{ color: emp.color }}>
              {fmt(emp.cost)}€
            </p>
          </div>
        ))}

        {/* Total row */}
        <div className="grid items-center px-4 py-3"
          style={{ gridTemplateColumns: "1fr 64px 56px 60px", background: "rgba(0,0,0,0.15)" }}>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Total</p>
          <p className="text-[13px] font-mono font-bold text-right" style={{ color: "var(--foreground)" }}>
            {formatHours(totalHours)}
          </p>
          <p className="text-[11px] text-right" style={{ color: "var(--foreground-dim)" }} />
          <p className="text-[16px] font-black text-right" style={{ color: "var(--foreground)" }}>
            {fmt(totalCost)}€
          </p>
        </div>
      </div>

      {/* CA minimum */}
      <div className="px-4 py-4" style={{ background: "rgba(6,182,212,0.04)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp size={12} style={{ color: "var(--accent)" }} />
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
            CA minimum pour être rentable
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-3 py-3" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>
              Objectif 30% MS
            </p>
            <p className="text-[22px] font-black leading-none" style={{ color: "var(--accent)" }}>
              {fmt(ca30)} €
            </p>
            <p className="text-[9px] mt-1" style={{ color: "var(--foreground-dim)" }}>
              Ratio cible restaurants
            </p>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>
              Seuil critique 35% MS
            </p>
            <p className="text-[22px] font-black leading-none" style={{ color: "var(--warning)" }}>
              {fmt(ca35)} €
            </p>
            <p className="text-[9px] mt-1" style={{ color: "var(--foreground-dim)" }}>
              Maximum acceptable
            </p>
          </div>
        </div>
        <p className="text-[9px] mt-3 text-center" style={{ color: "var(--foreground-dim)" }}>
          MS = masse salariale brute charges comprises · CA HT semaine à atteindre
        </p>
      </div>
    </div>
  );
}

function DraftView({ shifts, weekDates, onValidate, onRegenerate, validating, rates }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  onValidate: () => void;
  onRegenerate: () => void;
  validating: boolean;
  rates: Record<string, EmployeeRate>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          Planning généré — {shifts.length} shift{shifts.length > 1 ? "s" : ""} · Vérifiez puis validez
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <WeekGrid shifts={shifts} weekDates={weekDates} />
      </div>

      <WeekSummary shifts={shifts} rates={rates} />

      <div className="flex gap-3 pt-2">
        <button onClick={onRegenerate}
          className="flex-1 py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
          style={{ border: "1px solid var(--border)", color: "var(--foreground-dim)", background: "transparent" }}>
          <RefreshCw size={14} />Régénérer
        </button>
        <button onClick={onValidate} disabled={validating || shifts.length === 0}
          className="flex-1 py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "#fff", border: "none", opacity: validating ? 0.6 : 1 }}>
          {validating ? "Validation…" : <><Check size={14} />Valider le planning</>}
        </button>
      </div>
    </div>
  );
}

function PublishedView({ shifts, weekDates, rates }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  rates: Record<string, EmployeeRate>;
}) {
  const confirmed = shifts.filter(s => s.confirmation_status === "confirmed").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
          <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Planning publié</p>
        </div>
        <MonoLabel size="xs">{confirmed}/{shifts.length} confirmés</MonoLabel>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <WeekGrid shifts={shifts} weekDates={weekDates} />
      </div>
      <WeekSummary shifts={shifts} rates={rates} />
    </div>
  );
}
