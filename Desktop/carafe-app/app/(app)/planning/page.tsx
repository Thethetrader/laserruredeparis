"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Sparkles, Check, RefreshCw, Clock } from "lucide-react";
import { toDateStr, formatHours, DEFAULT_PAUSE_SETTINGS } from "@/lib/shifts";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

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
    const supabase = createClient();

    const eid = typeof window !== "undefined" ? localStorage.getItem("establishment_id") : null;
    if (!eid) { setLoading(false); return; }
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

  async function handleGenerate() {
    if (!estId) return;
    setGenerating(true);
    setError(null);
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-8">
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
        <PublishedView shifts={planningShifts} weekDates={weekDates} />
      ) : planningWeek?.status === "draft" ? (
        <DraftView
          shifts={planningShifts}
          weekDates={weekDates}
          onValidate={handleValidate}
          onRegenerate={handleRegenerate}
          validating={validating}
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

function DraftView({ shifts, weekDates, onValidate, onRegenerate, validating }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  onValidate: () => void;
  onRegenerate: () => void;
  validating: boolean;
}) {
  const byDate = weekDates.map(date => ({
    date,
    shifts: shifts.filter(s => s.shift_date === toDateStr(date)),
  })).filter(({ shifts }) => shifts.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          Planning généré — {shifts.length} shift{shifts.length > 1 ? "s" : ""} · Vérifiez puis validez
        </p>
      </div>

      {byDate.map(({ date, shifts: dayShifts }) => (
        <div key={toDateStr(date)} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
            <p className="text-[12px] font-medium capitalize" style={{ color: "var(--foreground)" }}>
              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-soft)" }}>
            {dayShifts.map(shift => <ShiftRow key={shift.id} shift={shift} />)}
          </div>
        </div>
      ))}

      {shifts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun shift généré</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onRegenerate}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--foreground-dim)", background: "transparent" }}
        >
          <RefreshCw size={14} />Régénérer
        </button>
        <button
          onClick={onValidate}
          disabled={validating || shifts.length === 0}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{ background: "var(--accent)", color: "#fff", border: "none", opacity: validating ? 0.6 : 1 }}
        >
          {validating ? "Validation…" : <><Check size={14} />Valider le planning</>}
        </button>
      </div>
    </div>
  );
}

// ── Published View ────────────────────────────────────────────────────────────

function PublishedView({ shifts, weekDates }: { shifts: PlanningShift[]; weekDates: Date[] }) {
  const byDate = weekDates.map(date => ({
    date,
    shifts: shifts.filter(s => s.shift_date === toDateStr(date)),
  })).filter(({ shifts }) => shifts.length > 0);

  const confirmed = shifts.filter(s => s.confirmation_status === "confirmed").length;
  const total = shifts.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--success, #10B981)" }} />
          <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Planning publié</p>
        </div>
        <MonoLabel size="xs">{confirmed}/{total} confirmés</MonoLabel>
      </div>

      {byDate.map(({ date, shifts: dayShifts }) => (
        <div key={toDateStr(date)} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
            <p className="text-[12px] font-medium capitalize" style={{ color: "var(--foreground)" }}>
              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-soft)" }}>
            {dayShifts.map(shift => <ShiftRow key={shift.id} shift={shift} showConfirmation />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shift Row ────────────────────────────────────────────────────────────────

function ShiftRow({ shift, showConfirmation }: { shift: PlanningShift; showConfirmation?: boolean }) {
  const hours = calcHours(shift.start_time, shift.end_time);
  const confirmColor =
    shift.confirmation_status === "confirmed" ? "#10B981"
    : shift.confirmation_status === "modified" ? "#F59E0B"
    : "var(--border)";

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>
          {shift.first_name ?? "Employé"}
        </p>
        {shift.staff_status && (
          <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{shift.staff_status.replace(/_/g, " ")}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[12px] font-mono" style={{ color: "var(--foreground)" }}>
          {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
        </p>
        <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{formatHours(hours)}</p>
      </div>
      {showConfirmation && (
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: confirmColor }} />
      )}
    </div>
  );
}
