"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles, Check, RefreshCw, Clock, BarChart2, TrendingUp, Plus, X, Settings2 } from "lucide-react";
import { toDateStr, formatHours, DEFAULT_PAUSE_SETTINGS, STAFF_STATUSES, type StaffStatus } from "@/lib/shifts";

const DEV_MODE = false;
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const SERVICE_PALETTE = ["#F59E0B", "#818CF8", "#10B981", "#F87171", "#34D399", "#60A5FA"];

interface ServiceEntry {
  id: string;
  name: string;
  start: string;
  end: string;
  staff: Record<string, number>;
}

interface PlanningRules {
  allow_overtime: boolean;
  consecutive_rest_days: boolean;
  allow_split_shifts: boolean;
}

interface ServiceNeeds {
  services: ServiceEntry[];
  service_days: number[];
  rules: PlanningRules;
}

const DEFAULT_NEEDS: ServiceNeeds = {
  services: [
    { id: "midi", name: "Midi", start: "11:30", end: "15:30", staff: { chef_de_rang: 1, cuisinier: 1 } },
    { id: "soir", name: "Soir", start: "18:30", end: "23:00", staff: { serveur: 2, cuisinier: 1 } },
  ],
  service_days: [1, 2, 3, 4, 5, 6],
  rules: { allow_overtime: false, consecutive_rest_days: true, allow_split_shifts: false },
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

function parseServiceNeeds(sn: any): ServiceNeeds {
  if (sn?.services) {
    return {
      services: sn.services,
      service_days: sn.service_days ?? DEFAULT_NEEDS.service_days,
      rules: { ...DEFAULT_NEEDS.rules, ...sn.rules },
    };
  }
  // Backwards compat: old midi/soir format
  return {
    services: [
      { id: "midi", name: "Midi", start: "11:30", end: "15:30", ...sn?.midi, staff: sn?.midi?.staff ?? DEFAULT_NEEDS.services[0].staff },
      { id: "soir", name: "Soir", start: "18:30", end: "23:00", ...sn?.soir, staff: sn?.soir?.staff ?? DEFAULT_NEEDS.services[1].staff },
    ],
    service_days: sn?.service_days ?? DEFAULT_NEEDS.service_days,
    rules: { ...DEFAULT_NEEDS.rules, ...sn?.rules },
  };
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
  const [isRealEmployee, setIsRealEmployee] = useState(false);
  const [myShifts, setMyShifts] = useState<PlanningShift[]>([]);
  const [refusalPopup, setRefusalPopup] = useState(false);
  const [refusingShiftId, setRefusingShiftId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string; staff_status: string }[]>([]);
  const [addShiftFor, setAddShiftFor] = useState<{ date: string } | null>(null);
  const [savingShift, setSavingShift] = useState(false);

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPlanningWeek(null); setLoading(false); return; }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
    const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;

    let memberQ = supabase
      .from("establishment_members")
      .select("establishment_id, establishments(tip_settings)")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "manager"]);
    if (validActiveId) memberQ = memberQ.eq("establishment_id", validActiveId);
    const membershipData = (await memberQ.limit(1).maybeSingle()).data;

    const resolvedEid = membershipData?.establishment_id ?? null;
    if (!resolvedEid) {
      // Try as employee
      let empQ = supabase.from("establishment_members").select("establishment_id").eq("profile_id", user.id).eq("is_active", true);
      if (validActiveId) empQ = empQ.eq("establishment_id", validActiveId);
      const { data: empMember } = await empQ.limit(1).maybeSingle();
      if (!empMember) { setPlanningWeek(null); setLoading(false); return; }
      setIsRealEmployee(true);
      setEstId(empMember.establishment_id);
      // Load published planning weeks for this employee
      const from = toDateStr(monday);
      const { data: pubWeeks } = await supabase.from("planning_weeks").select("id, week_start, status").eq("establishment_id", empMember.establishment_id).eq("status", "published").gte("week_start", from).order("week_start").limit(4);
      if (pubWeeks?.length) {
        const weekIds = pubWeeks.map((w: { id: string }) => w.id);
        const { data: empShifts } = await supabase.from("planning_shifts").select("id, user_id, shift_date, start_time, end_time, service, confirmation_status").eq("user_id", user.id).in("planning_week_id", weekIds).order("shift_date").order("start_time");
        setMyShifts((empShifts ?? []) as PlanningShift[]);
      } else {
        setMyShifts([]);
      }
      setLoading(false);
      return;
    }
    setEstId(resolvedEid);

    const { data: teamData } = await supabase
      .from("establishment_members")
      .select("profile_id, profiles(first_name, staff_status)")
      .eq("establishment_id", resolvedEid)
      .eq("is_active", true)
      .order("profile_id");
    setEmployees((teamData ?? []).map((m: any) => ({
      id: m.profile_id,
      name: m.profiles?.first_name ?? "?",
      staff_status: m.profiles?.staff_status ?? "",
    })));

    const weekStr = toDateStr(monday);

    const { data: pw } = await supabase
      .from("planning_weeks")
      .select("*")
      .eq("establishment_id", resolvedEid)
      .eq("week_start", weekStr)
      .maybeSingle();

    if (pw) {
      setPlanningWeek(pw as PlanningWeek);
      if (pw.service_needs) setNeeds(parseServiceNeeds(pw.service_needs));

      const { data: ps } = await supabase
        .from("planning_shifts")
        .select("id, user_id, shift_date, start_time, end_time, service, confirmation_status, profiles(first_name)")
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

      const prevMonday = new Date(monday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const { data: prevPw } = await supabase
        .from("planning_weeks")
        .select("service_needs")
        .eq("establishment_id", resolvedEid)
        .eq("week_start", toDateStr(prevMonday))
        .maybeSingle();

      setNeeds(prevPw?.service_needs ? parseServiceNeeds(prevPw.service_needs) : DEFAULT_NEEDS);
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
        for (const service of needs.services) {
          for (const [role, count] of Object.entries(service.staff)) {
            if (!count) continue;
            const emps = DEV_EMPLOYEES.filter(e => e.role === role).slice(0, count);
            for (const emp of emps) {
              shifts.push({ id: `dev-s${shiftId++}`, user_id: emp.id, shift_date: date, start_time: service.start, end_time: service.end, service: service.id, confirmation_status: "pending", first_name: emp.name, staff_status: emp.role });
            }
          }
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
      const resp = await fetch("/api/planning/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_week_id: planningWeek.id }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error ?? "Erreur validation");
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

  async function handleAddShift(userId: string, service: string, start: string, end: string) {
    if (!estId || !addShiftFor) return;
    setSavingShift(true);
    const supabase = createClient();
    const weekStr = toDateStr(weekStart);

    let weekId = planningWeek?.id ?? null;
    if (!weekId) {
      const { data: existing } = await supabase.from("planning_weeks")
        .select("id").eq("establishment_id", estId).eq("week_start", weekStr).maybeSingle();
      if (existing) {
        weekId = existing.id;
      } else {
        const { data: newWeek } = await supabase.from("planning_weeks")
          .insert({ establishment_id: estId, week_start: weekStr, status: "published", service_needs: needs })
          .select("id").single();
        weekId = newWeek?.id ?? null;
      }
    }

    if (!weekId) { setSavingShift(false); return; }

    await supabase.from("planning_shifts").insert({
      planning_week_id: weekId,
      user_id: userId,
      shift_date: addShiftFor.date,
      start_time: start,
      end_time: end,
      service,
      confirmation_status: "pending",
    });

    setAddShiftFor(null);
    setSavingShift(false);
    await load(weekStart);
  }

  if (isEmployee || isRealEmployee) {
    const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const byDate = new Map<string, PlanningShift[]>();
    myShifts.forEach(s => { if (!byDate.has(s.shift_date)) byDate.set(s.shift_date, []); byDate.get(s.shift_date)!.push(s); });
    const sortedDates = Array.from(byDate.keys()).sort();

    async function confirmShift(shiftId: string) {
      const supabase = createClient();
      await supabase.from("planning_shifts").update({ confirmation_status: "confirmed" }).eq("id", shiftId);
      setMyShifts(prev => prev.map(s => s.id === shiftId ? { ...s, confirmation_status: "confirmed" as const } : s));
    }

    async function refuseShift(shiftId: string) {
      const supabase = createClient();
      await supabase.from("planning_shifts").update({ confirmation_status: "modified" }).eq("id", shiftId);
      setMyShifts(prev => prev.map(s => s.id === shiftId ? { ...s, confirmation_status: "modified" as const } : s));
      setRefusingShiftId(null);
      setRefusalPopup(false);
    }

    return (
      <div className="px-4 py-6 max-w-lg">
        <div className="mb-6">
          <MonoLabel size="xs" className="mb-1 block">Planning</MonoLabel>
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--foreground)" }}>Mes shifts planifiés</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Confirme ou signale un problème</p>
        </div>

        {loading && <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />}

        {!loading && sortedDates.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun planning publié pour les prochaines semaines</p>
          </div>
        )}

        {!loading && sortedDates.length > 0 && (
          <div className="space-y-3">
            {sortedDates.map(date => {
              const shifts = byDate.get(date)!;
              const d = new Date(date + "T12:00:00");
              const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              return (
                <div key={date} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2.5" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                    <p className="text-[12px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{dayLabel}</p>
                  </div>
                  {shifts.map(shift => {
                    const isConfirmed = shift.confirmation_status === "confirmed";
                    const isRefused = shift.confirmation_status === "modified";
                    return (
                      <div key={shift.id} className="px-4 py-3 flex items-center gap-3" style={{ background: isRefused ? "rgba(239,68,68,0.03)" : isConfirmed ? "rgba(16,185,129,0.03)" : "var(--background)", borderBottom: "1px solid var(--border-soft)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{shift.service}</p>
                          <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>{shift.start_time.slice(0,5)} → {shift.end_time.slice(0,5)}</p>
                        </div>
                        {isConfirmed && <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>✓ Confirmé</span>}
                        {isRefused && <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>✗ Refusé</span>}
                        {!isConfirmed && !isRefused && (
                          <div className="flex gap-2">
                            <button onClick={() => confirmShift(shift.id)} className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}>✓ OK</button>
                            <button onClick={() => { setRefusingShiftId(shift.id); setRefusalPopup(true); }} className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>✗ Non</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Refusal popup */}
        {refusalPopup && refusingShiftId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setRefusalPopup(false)}>
            <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Signaler un problème</h3>
              <p className="text-[12px] mb-4" style={{ color: "var(--foreground-dim)" }}>Le manager sera informé et pourra réassigner ce shift à quelqu'un d'autre.</p>
              <div className="flex gap-3">
                <button onClick={() => setRefusalPopup(false)} className="flex-1 py-2.5 rounded-xl text-[13px]" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>Annuler</button>
                <button onClick={() => refuseShift(refusingShiftId)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}>Confirmer le refus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasPlanning = !!planningWeek;

  return (
    <div className="max-w-2xl px-4 py-6 pb-24 lg:pb-8">
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
        <button onClick={prevWeek} className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{weekLabel(weekStart)}</p>
          <MonoLabel size="xs" className="mt-0.5">S{getISOWeek(weekStart)}</MonoLabel>
        </div>
        <button onClick={nextWeek} className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
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
      ) : (
        <div className="space-y-4">
          {/* Settings — always at top */}
          <NeedsForm
            needs={needs}
            setNeeds={setNeeds}
            onGenerate={handleGenerate}
            generating={generating}
            collapsible={hasPlanning}
            defaultOpen={!hasPlanning}
          />

          {/* Manual week strip — no planning yet */}
          {planningWeek === null && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
                <Plus size={13} style={{ color: "var(--foreground-dim)" }} />
                <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Ajouter des shifts manuellement</p>
              </div>
              <div className="flex">
                {weekDates.map((date, i) => {
                  const today = toDateStr(new Date()) === toDateStr(date);
                  return (
                    <button key={i} onClick={() => setAddShiftFor({ date: toDateStr(date) })}
                      className="flex-1 flex flex-col items-center py-3 gap-1 transition-all active:scale-95"
                      style={{ borderRight: i < 6 ? "1px solid var(--border-soft)" : "none", background: "transparent" }}>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>{DAYS_SHORT[i]}</span>
                      <span className="text-[18px] font-bold leading-none" style={{ color: today ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ border: "1px dashed var(--border)", color: "var(--foreground-dim)" }}>
                        <Plus size={9} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Planning grid */}
          {planningWeek?.status === "published" && (
            <PublishedView shifts={planningShifts} weekDates={weekDates} rates={devRates} onDayClick={date => setAddShiftFor({ date })} />
          )}
          {planningWeek?.status === "draft" && (
            <DraftView
              shifts={planningShifts}
              weekDates={weekDates}
              onValidate={handleValidate}
              onRegenerate={handleRegenerate}
              validating={validating}
              rates={devRates}
              onDayClick={date => setAddShiftFor({ date })}
            />
          )}
        </div>
      )}

      {/* Add shift modal */}
      {addShiftFor && (
        <AddShiftModal
          date={addShiftFor.date}
          employees={employees}
          services={needs.services}
          onClose={() => setAddShiftFor(null)}
          onSave={handleAddShift}
          saving={savingShift}
        />
      )}
    </div>
  );
}

// ── Needs Form ────────────────────────────────────────────────────────────────

function NeedsForm({ needs, setNeeds, onGenerate, generating, collapsible, defaultOpen }: {
  needs: ServiceNeeds;
  setNeeds: (n: ServiceNeeds) => void;
  onGenerate: () => void;
  generating: boolean;
  collapsible: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function toggleDay(isoDay: number) {
    const days = needs.service_days.includes(isoDay)
      ? needs.service_days.filter(d => d !== isoDay)
      : [...needs.service_days, isoDay].sort((a, b) => a - b);
    setNeeds({ ...needs, service_days: days });
  }

  function updateService(idx: number, updated: ServiceEntry) {
    const services = [...needs.services];
    services[idx] = updated;
    setNeeds({ ...needs, services });
  }

  function removeService(idx: number) {
    setNeeds({ ...needs, services: needs.services.filter((_, i) => i !== idx) });
  }

  function addService() {
    const newService: ServiceEntry = {
      id: `service-${Date.now()}`,
      name: "Nouveau service",
      start: "10:00",
      end: "14:00",
      staff: {},
    };
    setNeeds({ ...needs, services: [...needs.services, newService] });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Collapsible header */}
      {collapsible ? (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ background: "var(--background-elev)" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} style={{ color: "var(--foreground-dim)" }} />
            <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Paramètres de génération</span>
          </div>
          <ChevronDown size={14} style={{ color: "var(--foreground-dim)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
          <Settings2 size={14} style={{ color: "var(--foreground-dim)" }} />
          <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Paramètres de génération</span>
        </div>
      )}

      {(!collapsible || open) && (
        <div className="p-4 space-y-3" style={{ borderTop: collapsible ? "1px solid var(--border-soft)" : undefined }}>

          {/* Service days */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--foreground-dim)" }}>Jours de service</p>
            <div className="flex gap-1.5">
              {DAYS_SHORT.map((label, i) => {
                const isoDay = i + 1;
                const active = needs.service_days.includes(isoDay);
                return (
                  <button key={isoDay} onClick={() => toggleDay(isoDay)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={{
                      background: active ? "rgba(245,158,11,0.12)" : "var(--background)",
                      color: active ? "#F59E0B" : "var(--foreground-dim)",
                      border: active ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border-soft)",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services */}
          {needs.services.map((service, idx) => (
            <ServicePeriodCard
              key={service.id}
              service={service}
              onUpdate={(updated) => updateService(idx, updated)}
              onRemove={() => removeService(idx)}
              canRemove={needs.services.length > 1}
            />
          ))}

          {/* Add service */}
          <button onClick={addService}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] transition-colors"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground-dim)", background: "transparent" }}>
            <Plus size={13} />
            Ajouter un service
          </button>

          {/* Rules */}
          <div className="rounded-xl p-3 space-y-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Règles IA</p>
            {([
              { key: "allow_overtime", label: "Heures supplémentaires autorisées" },
              { key: "consecutive_rest_days", label: "Jours de repos consécutifs" },
              { key: "allow_split_shifts", label: "Coupures autorisées" },
            ] as { key: keyof PlanningRules; label: string }[]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{label}</span>
                <button
                  onClick={() => setNeeds({ ...needs, rules: { ...needs.rules, [key]: !needs.rules?.[key] } })}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: needs.rules?.[key] ? "#F59E0B" : "var(--border)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: needs.rules?.[key] ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={onGenerate}
            disabled={generating || needs.service_days.length === 0 || needs.services.length === 0}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold transition-all"
            style={{
              background: generating ? "var(--background-elev)" : "linear-gradient(135deg, #F59E0B, #D97706)",
              color: generating ? "var(--foreground-dim)" : "#fff",
              border: "none",
              opacity: (needs.service_days.length === 0 || needs.services.length === 0) ? 0.5 : 1,
            }}>
            {generating
              ? <><RefreshCw size={15} className="animate-spin" />Génération en cours…</>
              : <><Sparkles size={15} />Générer le planning</>}
          </button>
        </div>
      )}
    </div>
  );
}

function ServicePeriodCard({ service, onUpdate, onRemove, canRemove }: {
  service: ServiceEntry;
  onUpdate: (updated: ServiceEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const activeStaff = Object.entries(service.staff).filter(([, count]) => count > 0);
  const available = (Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !service.staff[s] || service.staff[s] === 0);

  function updateCount(status: string, delta: number) {
    const current = service.staff[status] ?? 0;
    const next = Math.max(0, current + delta);
    const newStaff = { ...service.staff };
    if (next === 0) delete newStaff[status];
    else newStaff[status] = next;
    onUpdate({ ...service, staff: newStaff });
  }

  function addRole(status: string) {
    onUpdate({ ...service, staff: { ...service.staff, [status]: 1 } });
    setShowRoleSelect(false);
  }

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <input
          value={service.name}
          onChange={e => onUpdate({ ...service, name: e.target.value })}
          className="flex-1 text-[13px] font-semibold bg-transparent outline-none min-w-0"
          style={{ color: "var(--foreground)" }}
        />
        <Clock size={10} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
        <input type="time" value={service.start} onChange={e => onUpdate({ ...service, start: e.target.value })}
          className="text-[11px] font-mono rounded px-1.5 py-0.5 w-[76px]"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>→</span>
        <input type="time" value={service.end} onChange={e => onUpdate({ ...service, end: e.target.value })}
          className="text-[11px] font-mono rounded px-1.5 py-0.5 w-[76px]"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        {canRemove && (
          <button onClick={onRemove} className="p-1 rounded-lg flex-shrink-0"
            style={{ color: "var(--foreground-dim)", background: "transparent", border: "none" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Active roles */}
      {activeStaff.length > 0 && (
        <div className="space-y-1.5">
          {activeStaff.map(([status, count]) => {
            const info = STAFF_STATUSES[status as StaffStatus];
            const color = info?.color ?? "#A1A1AA";
            const label = info?.label ?? status;
            return (
              <div key={status} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border-soft)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="flex-1 text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateCount(status, -1)}
                    className="w-6 h-6 rounded-md text-[13px] font-bold flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
                    −
                  </button>
                  <span className="w-4 text-center text-[14px] font-bold" style={{ color }}>
                    {count}
                  </span>
                  <button onClick={() => updateCount(status, 1)}
                    className="w-6 h-6 rounded-md text-[13px] font-bold flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add role */}
      {available.length > 0 && (
        showRoleSelect ? (
          <select
            autoFocus
            className="w-full text-[12px] rounded-lg px-2.5 py-2"
            style={{ background: "var(--background)", border: "1px solid var(--accent)", color: "var(--foreground)" }}
            onChange={e => { if (e.target.value) addRole(e.target.value); }}
            onBlur={() => setShowRoleSelect(false)}
            defaultValue=""
          >
            <option value="" disabled>Choisir un poste…</option>
            {available.map(s => (
              <option key={s} value={s}>{STAFF_STATUSES[s].label}</option>
            ))}
          </select>
        ) : (
          <button onClick={() => setShowRoleSelect(true)}
            className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg w-full transition-colors"
            style={{ color: "var(--foreground-dim)", border: "1px dashed var(--border)", background: "transparent" }}>
            <Plus size={12} />
            Ajouter un poste
          </button>
        )
      )}
    </div>
  );
}

// ── Draft View ────────────────────────────────────────────────────────────────

const DAYS_FR_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const CONFIRMATION_ICON: Record<string, string> = {
  confirmed: "✓",
  modified: "✗",
  pending: "·",
};
const CONFIRMATION_COLOR: Record<string, string> = {
  confirmed: "#10B981",
  modified: "#EF4444",
  pending: "#F59E0B",
};

function ShiftChip({ shift, showStatus }: { shift: PlanningShift; showStatus?: boolean }) {
  const color = STAFF_STATUSES[shift.staff_status as StaffStatus]?.color ?? "#A1A1AA";
  const statusColor = CONFIRMATION_COLOR[shift.confirmation_status] ?? CONFIRMATION_COLOR.pending;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="truncate flex-1">{shift.first_name ?? "?"}</span>
      {showStatus && (
        <span className="text-[10px] font-bold" style={{ color: statusColor }}>
          {CONFIRMATION_ICON[shift.confirmation_status] ?? "·"}
        </span>
      )}
    </div>
  );
}

function WeekGrid({ shifts, weekDates, showStatus, onDayClick }: { shifts: PlanningShift[]; weekDates: Date[]; showStatus?: boolean; onDayClick?: (date: string) => void }) {
  const activeDates = weekDates.filter(d => shifts.some(s => s.shift_date === toDateStr(d)));
  if (activeDates.length === 0) return null;

  const getShifts = (date: Date, service: string) =>
    shifts.filter(s => s.shift_date === toDateStr(date) && s.service === service);

  // Detect services dynamically, preserve order of first appearance
  const serviceKeys = [...new Set(shifts.map(s => s.service))];
  const serviceRows = serviceKeys.map((key, i) => {
    const sample = shifts.find(s => s.service === key);
    const time = sample ? `${sample.start_time.slice(0, 5)} – ${sample.end_time.slice(0, 5)}` : "";
    const color = SERVICE_PALETTE[i % SERVICE_PALETTE.length];
    return { key, label: key.toUpperCase(), color, time };
  });

  const n = activeDates.length;
  const MIN_COL = 92;
  const LABEL_W = 76;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: LABEL_W + n * MIN_COL }}>
        {/* Day headers */}
        <div className="flex items-stretch" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0 }} />
          {activeDates.map((date, i) => {
            const today = toDateStr(new Date()) === toDateStr(date);
            const dayIdx = weekDates.indexOf(date);
            const dateStr = toDateStr(date);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
                style={{ minWidth: MIN_COL, borderLeft: "1px solid var(--border-soft)" }}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "var(--foreground-dim)" }}>{DAYS_FR_SHORT[dayIdx]}</span>
                {onDayClick ? (
                  <button onClick={() => onDayClick(dateStr)}
                    className="text-[18px] font-bold leading-none w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ color: today ? "var(--accent)" : "var(--foreground)", background: "transparent" }}>
                    {date.getDate()}
                  </button>
                ) : (
                  <span className="text-[18px] font-bold leading-none"
                    style={{ color: today ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Service rows */}
        {serviceRows.map(({ key, label, color, time }, rowIdx) => (
          <div key={key} className="flex items-stretch"
            style={{ borderBottom: rowIdx < serviceRows.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex flex-col justify-center gap-0.5 px-3 py-3"
              style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0, borderRight: "1px solid var(--border-soft)" }}>
              <span className="text-[11px] font-black tracking-widest" style={{ color }}>{label}</span>
              <span className="text-[9px] font-mono leading-snug" style={{ color: "var(--foreground-dim)" }}>{time}</span>
            </div>
            {activeDates.map((date, i) => {
              const cell = getShifts(date, key);
              return (
                <div key={i} className="flex-1 flex flex-col gap-1 p-2"
                  style={{ minWidth: MIN_COL, minHeight: 72, borderLeft: "1px solid var(--border-soft)", background: i % 2 === 0 ? "var(--background-elev)" : "var(--background-soft)" }}>
                  {cell.map(s => <ShiftChip key={s.id} shift={s} showStatus={showStatus} />)}
                  {onDayClick && (
                    <button onClick={() => onDayClick(toDateStr(date))}
                      className="w-5 h-5 rounded-full flex items-center justify-center self-center mt-0.5 opacity-30 hover:opacity-80 transition-opacity"
                      style={{ border: "1px dashed var(--border)", color: "var(--foreground-dim)" }}>
                      <Plus size={9} />
                    </button>
                  )}
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
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border-soft)" }}>
        <BarChart2 size={13} style={{ color: "var(--accent)" }} />
        <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Récap masse salariale</p>
      </div>
      <div style={{ background: "var(--background-elev)" }}>
        <div className="grid px-4 py-1.5" style={{ gridTemplateColumns: "1fr 64px 56px 60px", borderBottom: "1px solid var(--border-soft)" }}>
          {["Employé", "Heures", "Taux", "Coût"].map(h => (
            <p key={h} className="text-[9px] font-mono uppercase tracking-widest text-right first:text-left"
              style={{ color: "var(--foreground-dim)" }}>{h}</p>
          ))}
        </div>
        {employees.map((emp) => (
          <div key={emp.userId} className="grid items-center px-4 py-3"
            style={{ gridTemplateColumns: "1fr 64px 56px 60px", borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: emp.color }} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{emp.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            <p className="text-[13px] font-mono font-semibold text-right" style={{ color: "var(--foreground)" }}>{formatHours(emp.hours)}</p>
            <p className="text-[11px] font-mono text-right" style={{ color: "var(--foreground-dim)" }}>{emp.hourly_rate.toFixed(2)}€</p>
            <p className="text-[15px] font-bold text-right" style={{ color: emp.color }}>{fmt(emp.cost)}€</p>
          </div>
        ))}
        <div className="grid items-center px-4 py-3"
          style={{ gridTemplateColumns: "1fr 64px 56px 60px", background: "rgba(0,0,0,0.15)" }}>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Total</p>
          <p className="text-[13px] font-mono font-bold text-right" style={{ color: "var(--foreground)" }}>{formatHours(totalHours)}</p>
          <p className="text-[11px] text-right" style={{ color: "var(--foreground-dim)" }} />
          <p className="text-[16px] font-black text-right" style={{ color: "var(--foreground)" }}>{fmt(totalCost)}€</p>
        </div>
      </div>
      <div className="px-4 py-4" style={{ background: "rgba(6,182,212,0.04)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp size={12} style={{ color: "var(--accent)" }} />
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
            CA minimum pour être rentable
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-3 py-3" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Objectif 30% MS</p>
            <p className="text-[22px] font-black leading-none" style={{ color: "var(--accent)" }}>{fmt(ca30)} €</p>
            <p className="text-[9px] mt-1" style={{ color: "var(--foreground-dim)" }}>Ratio cible restaurants</p>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Seuil critique 35% MS</p>
            <p className="text-[22px] font-black leading-none" style={{ color: "var(--warning)" }}>{fmt(ca35)} €</p>
            <p className="text-[9px] mt-1" style={{ color: "var(--foreground-dim)" }}>Maximum acceptable</p>
          </div>
        </div>
        <p className="text-[9px] mt-3 text-center" style={{ color: "var(--foreground-dim)" }}>
          MS = masse salariale brute charges comprises · CA HT semaine à atteindre
        </p>
      </div>
    </div>
  );
}

function DraftView({ shifts, weekDates, onValidate, onRegenerate, validating, rates, onDayClick }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  onValidate: () => void;
  onRegenerate: () => void;
  validating: boolean;
  rates: Record<string, EmployeeRate>;
  onDayClick?: (date: string) => void;
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
        <WeekGrid shifts={shifts} weekDates={weekDates} onDayClick={onDayClick} />
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

function PublishedView({ shifts, weekDates, rates, onDayClick }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  rates: Record<string, EmployeeRate>;
  onDayClick?: (date: string) => void;
}) {
  const confirmed = shifts.filter(s => s.confirmation_status === "confirmed").length;
  const pending = shifts.filter(s => s.confirmation_status === "pending").length;
  const modified = shifts.filter(s => s.confirmation_status === "modified").length;

  const byEmployee = Object.values(
    shifts.reduce((acc, s) => {
      if (!acc[s.user_id]) acc[s.user_id] = { name: s.first_name ?? "?", shifts: [] };
      acc[s.user_id].shifts.push(s);
      return acc;
    }, {} as Record<string, { name: string; shifts: PlanningShift[] }>)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
          <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Planning publié</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold" style={{ color: "#10B981" }}>✓ {confirmed}</span>
          <span className="text-[11px] font-bold" style={{ color: "#F59E0B" }}>· {pending}</span>
          {modified > 0 && <span className="text-[11px] font-bold" style={{ color: "#EF4444" }}>✗ {modified}</span>}
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <WeekGrid shifts={shifts} weekDates={weekDates} showStatus onDayClick={onDayClick} />
      </div>
      <div className="rounded-2xl p-4 space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--foreground-dim)" }}>Confirmations</p>
        {byEmployee.map(({ name, shifts: emp }) => {
          const allConfirmed = emp.every(s => s.confirmation_status === "confirmed");
          const anyModified = emp.some(s => s.confirmation_status === "modified");
          const statusColor = anyModified ? "#EF4444" : allConfirmed ? "#10B981" : "#F59E0B";
          const statusLabel = anyModified ? "Modifié" : allConfirmed ? "Confirmé" : "En attente";
          const statusIcon = anyModified ? "✗" : allConfirmed ? "✓" : "·";
          return (
            <div key={name} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: "var(--background)", border: "1px solid var(--border-soft)" }}>
              <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{emp.length} shift{emp.length > 1 ? "s" : ""}</span>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                  {statusIcon} {statusLabel}
                </span>
                {anyModified && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg cursor-pointer" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    → Réassigner
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <WeekSummary shifts={shifts} rates={rates} />
    </div>
  );
}

// ── Add Shift Modal ────────────────────────────────────────────────────────────

function AddShiftModal({ date, employees, services, onClose, onSave, saving }: {
  date: string;
  employees: { id: string; name: string; staff_status: string }[];
  services: ServiceEntry[];
  onClose: () => void;
  onSave: (userId: string, service: string, start: string, end: string) => void;
  saving: boolean;
}) {
  const [userId, setUserId] = useState(employees[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "custom");
  const [start, setStart] = useState(services[0]?.start ?? "09:00");
  const [end, setEnd] = useState(services[0]?.end ?? "17:00");

  const d = new Date(date + "T12:00:00");
  const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  function pickService(svcId: string) {
    setServiceId(svcId);
    const svc = services.find(s => s.id === svcId);
    if (svc) { setStart(svc.start); setEnd(svc.end); }
  }

  const allServices = [...services, { id: "custom", name: "Personnalisé", start, end }];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Ajouter un shift</p>
            <p className="text-[15px] font-semibold capitalize mt-0.5" style={{ color: "var(--foreground)" }}>{dayLabel}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "var(--foreground-dim)" }} /></button>
        </div>

        {/* Employee */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Employé</p>
          <select value={userId} onChange={e => setUserId(e.target.value)}
            className="w-full text-[13px] rounded-xl px-3 py-2.5 outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Service</p>
          <div className="flex gap-2 flex-wrap">
            {allServices.map(svc => (
              <button key={svc.id} onClick={() => pickService(svc.id)}
                className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                style={serviceId === svc.id
                  ? { background: "var(--accent)", color: "#09090B" }
                  : { background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
                {svc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Début</p>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="w-full text-[14px] font-mono rounded-xl px-3 py-2.5 outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Fin</p>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full text-[14px] font-mono rounded-xl px-3 py-2.5 outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        <button onClick={() => onSave(userId, serviceId === "custom" ? "custom" : serviceId, start, end)}
          disabled={saving || !userId}
          className="w-full py-3 rounded-xl text-[14px] font-semibold transition-opacity"
          style={{ background: "var(--accent)", color: "#09090B", opacity: saving || !userId ? 0.5 : 1 }}>
          {saving ? "Enregistrement…" : "Ajouter le shift"}
        </button>
      </div>
    </div>
  );
}
