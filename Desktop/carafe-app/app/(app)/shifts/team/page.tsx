"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, Euro, X, Check, Ban, FileText, Printer, TrendingUp, BarChart2, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import {
  getDaysInMonth, isoWeekday, monthLabel, toDateStr,
  formatHours, formatTips, formatCA, parseTipSettings, calcTipDistribution, calcNetHours,
  parseCASettings, DEFAULT_CA_SETTINGS,
  STAFF_STATUSES, DEFAULT_TIP_SETTINGS,
  type TeamShift, type StaffStatus, type TipSettings, type CASettings,
} from "@/lib/shifts";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DEV_MODE = false;

/* ── French overtime law ─────────────────────────────────────────────────── */
// Loi française : heures sup +25% pour les 8 premières (36e-43e), +50% au-delà
function calcPayroll(totalHours: number, weeklyHoursContract: number, periodDays: number) {
  const periodWeeks = periodDays / 7;
  const contractHours = weeklyHoursContract * periodWeeks;
  const normalHours = Math.min(totalHours, contractHours);
  const overtime = Math.max(0, totalHours - contractHours);
  // 8h sup maxi par semaine à 25%, le reste à 50%
  const max25PerWeek = 8 * periodWeeks;
  const overtime25 = Math.min(overtime, max25PerWeek);
  const overtime50 = Math.max(0, overtime - max25PerWeek);
  return { contractHours, normalHours, overtime25, overtime50 };
}

interface ValidationStatus {
  profile_id: string;
  first_name: string;
  staff_status: string | null;
  total_shifts: number;
  validated_shifts: number;
  validated_at: string | null;
}

interface PlanningShiftItem {
  id: string;
  user_id: string;
  shift_date: string;
  service: string;
  confirmation_status: "pending" | "confirmed" | "modified";
  staff_status: StaffStatus | null;
}

// Net → Brut : ÷ 0.78 (cotisations salariales ~22%)
// Brut → Coût employeur : × 1.45 (cotisations patronales ~45%)
function netToGross(net: number) { return net / 0.78; }
function grossToEmployerCost(gross: number) { return gross * 1.45; }
function netToEmployerCost(net: number) { return grossToEmployerCost(netToGross(net)); }

interface EmployeePayroll {
  userId: string;
  firstName: string;
  staffStatus: StaffStatus | null;
  tipsEnabled: boolean;
  weeklyHours: number;
  hourlyRateNet: number | null;
  contractType: string | null;
  services: number;
  totalHours: number;
  totalTips: number;
  contractHours: number;
  normalHours: number;
  overtime25: number;
  overtime50: number;
}

/* ── Payroll recap modal ──────────────────────────────────────────────────── */
function PayrollModal({ estId, supabase, caSettings, onClose }: {
  estId: string;
  supabase: ReturnType<typeof createClient>;
  caSettings: CASettings;
  onClose: () => void;
}) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(toDateStr(today));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeePayroll[] | null>(null);
  const [totalCA, setTotalCA] = useState<number | null>(null);

  const periodDays = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);

  async function generate() {
    setLoading(true);

    if (DEV_MODE) {
      const demo: EmployeePayroll[] = [
        { userId: "u1", firstName: "Yasmine", staffStatus: "chef_de_rang", tipsEnabled: true, weeklyHours: 35, contractType: "CDI", services: Math.round(periodDays * 0.9), totalHours: periodDays * 0.9 * 3.5, totalTips: periodDays * 0.9 * 12, ...calcPayroll(periodDays * 0.9 * 3.5, 35, periodDays) },
        { userId: "u2", firstName: "Rayan", staffStatus: "serveur", tipsEnabled: true, weeklyHours: 35, contractType: "Extra", services: Math.round(periodDays * 0.7), totalHours: periodDays * 0.7 * 5.5, totalTips: periodDays * 0.7 * 8, ...calcPayroll(periodDays * 0.7 * 5.5, 35, periodDays) },
        { userId: "u3", firstName: "Marco", staffStatus: "cuisinier", tipsEnabled: false, weeklyHours: 39, contractType: "CDI", services: Math.round(periodDays * 0.95), totalHours: periodDays * 0.95 * 8, totalTips: 0, ...calcPayroll(periodDays * 0.95 * 8, 39, periodDays) },
        { userId: "u4", firstName: "Léa", staffStatus: "commis", tipsEnabled: false, weeklyHours: 20, contractType: "CDD", services: Math.round(periodDays * 0.3), totalHours: periodDays * 0.3 * 5, totalTips: 0, ...calcPayroll(periodDays * 0.3 * 5, 20, periodDays) },
      ];
      setData(demo);
      if (caSettings.mode !== "disabled") setTotalCA(periodDays * 850);
      setLoading(false);
      return;
    }

    const [membersRes, shiftsRes, caRes] = await Promise.all([
      supabase.from("establishment_members").select("profile_id, staff_status, tips_enabled, profiles(first_name, weekly_hours, contract_type, hourly_rate)").eq("establishment_id", estId).eq("is_active", true),
      supabase.from("shifts").select("user_id, hours_worked, hours_worked_2, tips, tips_2").eq("establishment_id", estId).gte("shift_date", from).lte("shift_date", to),
      caSettings.mode !== "disabled"
        ? supabase.from("ca_entries").select("amount").eq("establishment_id", estId).gte("entry_date", from).lte("entry_date", to)
        : Promise.resolve({ data: null }),
    ]);

    const members = membersRes.data;
    const shifts = shiftsRes.data;
    if (!members) { setLoading(false); return; }

    if (caRes.data) {
      setTotalCA((caRes.data as { amount: number }[]).reduce((s, r) => s + (r.amount ?? 0), 0));
    } else {
      setTotalCA(null);
    }

    const agg: Record<string, { hours: number; tips: number; services: number }> = {};
    for (const s of (shifts ?? [])) {
      if (!agg[s.user_id]) agg[s.user_id] = { hours: 0, tips: 0, services: 0 };
      agg[s.user_id].hours += (s.hours_worked ?? 0) + (s.hours_worked_2 ?? 0);
      agg[s.user_id].tips += (s.tips ?? 0) + (s.tips_2 ?? 0);
      agg[s.user_id].services += 1;
    }

    const result: EmployeePayroll[] = members.map(m => {
      const prof = m.profiles as { first_name: string | null; weekly_hours: number | null; contract_type: string | null; hourly_rate: number | null } | null;
      const weekly = prof?.weekly_hours ?? 35;
      const emp = agg[m.profile_id] ?? { hours: 0, tips: 0, services: 0 };
      return { userId: m.profile_id, firstName: prof?.first_name ?? "—", staffStatus: (m.staff_status ?? null) as StaffStatus | null, tipsEnabled: m.tips_enabled ?? true, weeklyHours: weekly, hourlyRateNet: prof?.hourly_rate ?? null, contractType: prof?.contract_type ?? null, services: emp.services, totalHours: emp.hours, totalTips: emp.tips, ...calcPayroll(emp.hours, weekly, periodDays) };
    }).filter(e => e.services > 0);

    setData(result);
    setLoading(false);
  }

  const fromFr = from ? new Date(from + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
  const toFr = to ? new Date(to + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--background-elev)", paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: 12 }}>
        <button onClick={onClose} className="p-1.5 rounded-base flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--foreground)" }}>Récap paie</h2>
          {data && <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{fromFr} → {toFr} · {periodDays}j</p>}
        </div>
        {data && (
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium flex-shrink-0"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
            <Printer size={13} />Imprimer
          </button>
        )}
      </div>

      {/* Date picker + generate */}
      {!data && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <FileText size={40} className="mb-4" style={{ color: "var(--foreground-dim)" }} />
          <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--foreground)" }}>Choisir la période</h3>
          <p className="text-[12px] mb-6 text-center" style={{ color: "var(--foreground-dim)" }}>
            Heures normales, supplémentaires (+25% / +50%)<br />et pourboires par employé
          </p>
          <div className="w-full max-w-sm space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Du</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Au</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <button onClick={generate} disabled={loading || !from || !to}
              className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Calcul en cours…" : `Générer le récap (${periodDays}j)`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 print:space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-[10px]" style={{ color: "var(--foreground-dim)" }}>
            <span>Contrat sur <strong>{periodDays}j</strong> ({(periodDays / 7).toFixed(1)} sem)</span>
            <span>· Sup +25% : h36–h43/sem</span>
            <span>· Sup +50% : h44+/sem</span>
          </div>

          {data.map(emp => {
            const statusCfg = emp.staffStatus ? STAFF_STATUSES[emp.staffStatus] : null;
            const hasOvertime = emp.overtime25 > 0 || emp.overtime50 > 0;
            return (
              <div key={emp.userId} className="rounded-2xl overflow-hidden print:break-inside-avoid"
                style={{ border: "1px solid var(--border)", background: "var(--background-elev)" }}>
                {/* Employee header */}
                <div className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: statusCfg?.color ?? "var(--border-strong)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{emp.firstName}</p>
                    <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                      {statusCfg?.label ?? "Statut non défini"} · {emp.contractType ?? "—"} {emp.weeklyHours}h/sem
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-mono font-bold" style={{ color: "var(--foreground)" }}>{formatHours(emp.totalHours)}</p>
                    <p className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{emp.services} service{emp.services > 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Hours breakdown */}
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
                  <Row label="Heures contractuelles" value={formatHours(emp.contractHours)} dim />
                  <Row label="Heures travaillées" value={formatHours(emp.totalHours)} bold />
                  <Row label="Heures normales" value={formatHours(emp.normalHours)} color="var(--success)" />
                  {emp.overtime25 > 0 && <Row label="Sup +25%" value={formatHours(emp.overtime25)} color="#F59E0B" />}
                  {emp.overtime50 > 0 && <Row label="Sup +50%" value={formatHours(emp.overtime50)} color="#EF4444" />}
                  {emp.tipsEnabled && (
                    <Row label="Pourboires" value={formatTips(emp.totalTips)} color="#F59E0B" bold />
                  )}
                  {!emp.tipsEnabled && (
                    <div className="flex items-center gap-1 col-span-2">
                      <Ban size={10} style={{ color: "var(--foreground-dim)" }} />
                      <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Sans pourboires</span>
                    </div>
                  )}
                </div>

                {/* Salaire Net / Brut / Coût employeur */}
                {emp.hourlyRateNet && emp.hourlyRateNet > 0 && emp.totalHours > 0 && (
                  <div className="mx-4 mb-3 rounded-lg px-3 py-2.5" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
                    <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>Salaire estimé sur la période</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-[13px] font-bold font-mono" style={{ color: "var(--foreground)" }}>
                          {(emp.hourlyRateNet * emp.totalHours).toFixed(0)} €
                        </p>
                        <p className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>NET</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-bold font-mono" style={{ color: "#F59E0B" }}>
                          {(netToEmployerCost(emp.hourlyRateNet) * emp.totalHours).toFixed(0)} €
                        </p>
                        <p className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>COÛT</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overtime alert */}
                {hasOvertime && (
                  <div className="mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <TrendingUp size={12} style={{ color: "#F59E0B" }} />
                    <p className="text-[10px]" style={{ color: "#F59E0B" }}>
                      {formatHours(emp.overtime25 + emp.overtime50)} heures supplémentaires sur la période
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Totals */}
          <div className="rounded-2xl px-4 py-4 mt-2"
            style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <p className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--accent)" }}>Totaux équipe</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <Row label="Total heures" value={formatHours(data.reduce((s, e) => s + e.totalHours, 0))} bold />
              <Row label="Total heures sup" value={formatHours(data.reduce((s, e) => s + e.overtime25 + e.overtime50, 0))} color="#F59E0B" />
              <Row label="Total pourboires" value={formatTips(data.filter(e => e.tipsEnabled).reduce((s, e) => s + e.totalTips, 0))} color="#F59E0B" bold />
              <Row label="Total services" value={String(data.reduce((s, e) => s + e.services, 0))} dim />
            </div>
          </div>

          {/* CA block */}
          {totalCA !== null && totalCA > 0 && (
            <div className="rounded-2xl px-4 py-4 mt-2"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={13} style={{ color: "var(--success)" }} />
                <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--success)" }}>Chiffre d&apos;affaires</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <Row label="CA total (TTC)" value={formatCA(totalCA)} bold color="var(--success)" />
                <Row label="CA / service" value={formatCA(totalCA / Math.max(1, data.reduce((s, e) => s + e.services, 0)))} />
                {data.filter(e => e.tipsEnabled).reduce((s, e) => s + e.totalTips, 0) > 0 && (
                  <Row
                    label="Tips / CA"
                    value={`${Math.round((data.filter(e => e.tipsEnabled).reduce((s, e) => s + e.totalTips, 0) / totalCA) * 100)}%`}
                    color="#F59E0B"
                  />
                )}
              </div>
            </div>
          )}

          {/* Masse salariale */}
          {(() => {
            const withRate = data.filter(e => e.hourlyRateNet && e.hourlyRateNet > 0 && e.totalHours > 0);
            if (withRate.length === 0) return null;
            const totalNet = withRate.reduce((s, e) => s + (e.hourlyRateNet! * e.totalHours), 0);
            const totalBrut = withRate.reduce((s, e) => s + (netToGross(e.hourlyRateNet!) * e.totalHours), 0);
            const totalCout = withRate.reduce((s, e) => s + (netToEmployerCost(e.hourlyRateNet!) * e.totalHours), 0);
            const pctCA = totalCA && totalCA > 0 ? Math.round((totalCout / totalCA) * 100) : null;
            return (
              <div className="rounded-2xl px-4 py-4 mt-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--danger)" }}>Masse salariale</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center rounded-lg py-2" style={{ background: "var(--background)" }}>
                    <p className="text-[15px] font-bold font-mono" style={{ color: "var(--foreground)" }}>{totalNet.toFixed(0)} €</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>Net total</p>
                  </div>
                  <div className="text-center rounded-lg py-2" style={{ background: "rgba(239,68,68,0.08)" }}>
                    <p className="text-[15px] font-bold font-mono" style={{ color: "var(--danger)" }}>{totalCout.toFixed(0)} €</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>Coût réel</p>
                  </div>
                </div>
                {pctCA !== null && (
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "var(--background)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pctCA, 100)}%`, background: pctCA > 40 ? "var(--danger)" : pctCA > 30 ? "#F59E0B" : "var(--success)", transition: "width 0.5s" }} />
                    </div>
                    <p className="text-[12px] font-mono font-bold flex-shrink-0" style={{ color: pctCA > 40 ? "var(--danger)" : pctCA > 30 ? "#F59E0B" : "var(--success)" }}>
                      {pctCA}% du CA
                    </p>
                  </div>
                )}
                <p className="text-[9px] mt-2" style={{ color: "var(--foreground-dim)" }}>
                  {withRate.length}/{data.length} employés avec taux horaire · Charges estimées (22% sal. + 45% pat.)
                </p>
              </div>
            );
          })()}


          <button onClick={() => setData(null)} className="w-full py-2.5 rounded-xl text-[12px] font-medium"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
            ← Modifier la période
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, dim, bold, color }: { label: string; value: string; dim?: boolean; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{label}</span>
      <span className="text-[12px] font-mono" style={{ color: color ?? (dim ? "var(--foreground-dim)" : "var(--foreground)"), fontWeight: bold ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

/* ── Demo data for DEV_MODE ───────────────────────────────────────────────── */
function buildDevShifts(year: number, month: number): TeamShift[] {
  const days = getDaysInMonth(year, month);
  const shifts: TeamShift[] = [];
  let idx = 0;
  for (const day of days) {
    const dow = day.getDay();
    const dateStr = toDateStr(day);
    const isWeekend = dow === 0 || dow === 6;
    const isRayanDay = idx % 7 < 5;

    shifts.push({ id: `y-${dateStr}`, user_id: "u1", establishment_id: "dev-establishment-2", shift_date: dateStr, start_time: "11:30", end_time: "15:00", hours_worked: 3.5, tips: isWeekend ? 35 : 0, start_time_2: isWeekend ? "19:00" : null, end_time_2: isWeekend ? "23:00" : null, hours_worked_2: isWeekend ? 4 : 0, tips_2: 0, note: null, created_at: "", first_name: "Yasmine", staff_status: "chef_de_rang", tips_enabled: true });
    shifts.push({ id: `m-${dateStr}`, user_id: "u3", establishment_id: "dev-establishment-2", shift_date: dateStr, start_time: "10:30", end_time: "15:30", hours_worked: 5, tips: 0, start_time_2: isWeekend ? "18:30" : null, end_time_2: isWeekend ? "23:30" : null, hours_worked_2: isWeekend ? 5 : 0, tips_2: 0, note: null, created_at: "", first_name: "Marco", staff_status: "cuisinier", tips_enabled: false });
    if (isRayanDay) {
      shifts.push({ id: `r-${dateStr}`, user_id: "u2", establishment_id: "dev-establishment-2", shift_date: dateStr, start_time: "18:00", end_time: "23:30", hours_worked: 5.5, tips: 0, start_time_2: null, end_time_2: null, hours_worked_2: 0, tips_2: 0, note: null, created_at: "", first_name: "Rayan", staff_status: "serveur", tips_enabled: true });
    }
    if (isWeekend) {
      shifts.push({ id: `l-${dateStr}`, user_id: "u4", establishment_id: "dev-establishment-2", shift_date: dateStr, start_time: "11:00", end_time: "16:00", hours_worked: 5, tips: 0, start_time_2: null, end_time_2: null, hours_worked_2: 0, tips_2: 0, note: null, created_at: "", first_name: "Léa", staff_status: "commis", tips_enabled: false });
    }
    idx++;
  }
  return shifts;
}

/* ── Day detail modal ─────────────────────────────────────────────────────── */
function DayModal({ date, shifts, tipSettings, caSettings, estId, supabase, onClose, onSaved }: {
  date: string; shifts: TeamShift[]; tipSettings: TipSettings; caSettings: CASettings; estId: string;
  supabase: ReturnType<typeof createClient>; onClose: () => void; onSaved: () => void;
}) {
  const [totalTips, setTotalTips] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [caMidi, setCaMidi] = useState("");
  const [caSoir, setCaSoir] = useState("");
  const [caDay, setCaDay] = useState("");
  const [caSaving, setCASaving] = useState(false);
  const [caSaved, setCASaved] = useState(false);
  const [caError, setCAError] = useState<string | null>(null);

  // Preload existing CA values for this date
  useEffect(() => {
    if (caSettings.mode === "disabled" || caSettings.mode === "per_month" || DEV_MODE) return;
    supabase.from("ca_entries").select("service, amount")
      .eq("establishment_id", estId).eq("entry_date", date)
      .then(({ data }) => {
        if (!data) return;
        for (const e of data as { service: string; amount: number }[]) {
          if (e.service === "midi") setCaMidi(String(e.amount));
          else if (e.service === "soir") setCaSoir(String(e.amount));
          else if (e.service === "day") setCaDay(String(e.amount));
        }
      });
  }, [date, estId, caSettings.mode, supabase]);

  // Add shift — auto-open si dispatch mode sans aucun shift éligible
  const isDispatchMode = tipSettings.mode === "dispatch";
  const hasEligible = shifts.filter(s => s.tips_enabled && ((s.hours_worked ?? 0) + (s.hours_worked_2 ?? 0)) > 0).length > 0;
  const [showAddShift, setShowAddShift] = useState(isDispatchMode && !hasEligible);
  const [members, setMembers] = useState<{ profile_id: string; first_name: string | null }[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [addStart, setAddStart] = useState("11:30");
  const [addEnd, setAddEnd] = useState("15:00");
  const [addCoupure, setAddCoupure] = useState(false);
  const [addStart2, setAddStart2] = useState("19:00");
  const [addEnd2, setAddEnd2] = useState("23:00");
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    if (!showAddShift || members.length > 0 || DEV_MODE) return;
    supabase.from("establishment_members")
      .select("profile_id, profiles(first_name)")
      .eq("establishment_id", estId).eq("is_active", true)
      .then(({ data }) => {
        setMembers((data ?? []).map((m: Record<string, unknown>) => ({
          profile_id: m.profile_id as string,
          first_name: (m.profiles as { first_name: string | null } | null)?.first_name ?? null,
        })));
      });
  }, [showAddShift, members.length, estId, supabase]);

  async function handleAddShift() {
    if (!addUserId) return;
    setAddSaving(true);
    const h1 = calcNetHours(addStart, addEnd);
    const h2 = addCoupure ? calcNetHours(addStart2, addEnd2) : 0;
    if (!DEV_MODE) {
      const existing = shifts.find(s => s.user_id === addUserId);
      if (existing) {
        await supabase.from("shifts").update({ start_time: addStart, end_time: addEnd, hours_worked: h1, start_time_2: addCoupure ? addStart2 : null, end_time_2: addCoupure ? addEnd2 : null, hours_worked_2: h2 }).eq("id", existing.id);
      } else {
        await supabase.from("shifts").insert({ user_id: addUserId, establishment_id: estId, shift_date: date, start_time: addStart, end_time: addEnd, hours_worked: h1, tips: 0, start_time_2: addCoupure ? addStart2 : null, end_time_2: addCoupure ? addEnd2 : null, hours_worked_2: h2, tips_2: 0 });
      }
    }
    setAddSaving(false); setShowAddShift(false);
    onSaved();
  }

  const isDispatch = tipSettings.mode === "dispatch";
  const totalTipsNum = parseFloat(totalTips) || 0;
  const eligibleStaff = shifts.filter(s => s.tips_enabled).map(s => ({ userId: s.user_id, hours: (s.hours_worked ?? 0) + (s.hours_worked_2 ?? 0), status: s.staff_status })).filter(s => s.hours > 0);
  const distribution = totalTipsNum > 0 ? calcTipDistribution(eligibleStaff, totalTipsNum, tipSettings.coefficients) : {};
  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const totalHoursEligible = eligibleStaff.reduce((s, x) => s + x.hours, 0);

  async function handleDispatch() {
    if (!isDispatch || totalTipsNum <= 0 || eligibleStaff.length === 0) return;
    setSaving(true);
    setDispatchError(null);
    try {
      if (!DEV_MODE) {
        const resp = await fetch("/api/shifts/dispatch-tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ establishment_id: estId, date, tips: distribution }),
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error ?? "Erreur distribution");
      }
      setSaving(false); setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); onClose(); }, 1200);
    } catch (e: unknown) {
      setSaving(false);
      setDispatchError(e instanceof Error ? e.message : "Erreur lors de la distribution. Réessayez.");
    }
  }

  async function handleSaveCA() {
    const mode = caSettings.mode;
    if (mode === "disabled" || mode === "per_month") return;
    setCASaving(true); setCAError(null);
    try {
      if (!DEV_MODE) {
        if (mode === "per_service") {
          const entries = [
            { service: "midi", amount: parseFloat(caMidi) || 0 },
            { service: "soir", amount: parseFloat(caSoir) || 0 },
          ].filter(e => e.amount > 0);
          for (const e of entries) {
            const { error } = await supabase.from("ca_entries").upsert({ establishment_id: estId, entry_date: date, service: e.service, amount: e.amount }, { onConflict: "establishment_id,entry_date,service" });
            if (error) throw error;
          }
        } else {
          const amount = parseFloat(caDay) || 0;
          if (amount > 0) {
            const { error } = await supabase.from("ca_entries").upsert({ establishment_id: estId, entry_date: date, service: "day", amount }, { onConflict: "establishment_id,entry_date,service" });
            if (error) throw error;
          }
        }
      }
      setCASaving(false); setCASaved(true);
      setTimeout(() => setCASaved(false), 2000);
    } catch (e: unknown) {
      setCASaving(false);
      setCAError(e instanceof Error ? e.message : "Erreur enregistrement CA");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{displayDate}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{shifts.length} présent{shifts.length > 1 ? "s" : ""} · {eligibleStaff.length} éligible{eligibleStaff.length > 1 ? "s" : ""} aux tips</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>
        <div className="space-y-2 mb-4">
          {shifts.map(s => {
            const hours = (s.hours_worked ?? 0) + (s.hours_worked_2 ?? 0);
            const statusCfg = s.staff_status ? STAFF_STATUSES[s.staff_status] : null;
            const myTip = distribution[s.user_id];
            const fmtT = (t: string) => t.slice(0, 5).replace(":00", "h").replace(":", "h");
            const timeStr = s.start_time && s.end_time
              ? `${fmtT(s.start_time)}–${fmtT(s.end_time)}${s.start_time_2 && s.end_time_2 ? ` · ${fmtT(s.start_time_2)}–${fmtT(s.end_time_2)}` : ""}`
              : null;
            return (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--background)", border: `1px solid ${s.tips_enabled ? "var(--border)" : "var(--border-soft)"}`, opacity: s.tips_enabled ? 1 : 0.6 }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusCfg?.color ?? "var(--border-strong)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>{s.first_name ?? "—"}</p>
                    {timeStr && <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{timeStr}</span>}
                    {!s.tips_enabled && <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}><Ban size={8} />no tips</span>}
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                    {statusCfg?.label ?? "—"} · {formatHours(hours)}
                    {(() => {
                      const simTip = myTip != null && myTip > 0 ? myTip : null;
                      const savedTip = (s.tips ?? 0) + (s.tips_2 ?? 0);
                      const shown = simTip ?? (savedTip > 0 ? savedTip : null);
                      return shown != null && s.tips_enabled ? <span style={{ color: "#F59E0B", fontWeight: 700 }}> · {formatTips(shown)}</span> : null;
                    })()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {isDispatch && (
          <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium" style={{ color: "#F59E0B" }}>Total pourboires du jour</p>
              <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{formatHours(totalHoursEligible)} éligibles</p>
            </div>
            <div className="relative">
              <Euro size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
              <input type="number" min="0" step="1" value={totalTips} onChange={e => setTotalTips(e.target.value)} placeholder="Ex: 180" className="w-full pl-7 pr-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          </div>
        )}
        {dispatchError && (
          <p className="text-[12px] px-3 py-2 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {dispatchError}
          </p>
        )}
        {isDispatch && eligibleStaff.length === 0 && (
          <p className="text-[12px] px-3 py-2 rounded-xl mb-3 text-center" style={{ background: "rgba(245,158,11,0.06)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
            Ajoutez d'abord les shifts du jour ci-dessous pour dispatcher les pourboires
          </p>
        )}
        {isDispatch ? (
          <button onClick={handleDispatch} disabled={saving || totalTipsNum <= 0 || eligibleStaff.length === 0}
            className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{ background: saved ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.15)", color: saved ? "var(--success)" : "#F59E0B", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, opacity: (saving || totalTipsNum <= 0 || eligibleStaff.length === 0) ? 0.5 : 1 }}>
            {saved ? <><Check size={14} />Distribué !</> : saving ? "Distribution…" : `Dispatcher aux ${eligibleStaff.length} éligible${eligibleStaff.length > 1 ? "s" : ""}`}
          </button>
        ) : (
          <button onClick={onClose} className="w-full py-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>Fermer</button>
        )}

        {/* Add shift */}
        {!showAddShift ? (
          <button onClick={() => setShowAddShift(true)}
            className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-medium flex items-center justify-center gap-2"
            style={{ background: "transparent", border: "1px dashed var(--border-strong)", color: "var(--foreground-dim)" }}>
            <Plus size={13} />Ajouter un shift
          </button>
        ) : (
          <div className="mt-3 rounded-xl p-3 space-y-3" style={{ background: "var(--background)", border: "1px solid rgba(6,182,212,0.25)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: "var(--accent)" }}>Ajouter un shift</p>
              <button onClick={() => setShowAddShift(false)} style={{ color: "var(--foreground-dim)" }}><X size={14} /></button>
            </div>
            {/* Employee selector */}
            <select value={addUserId} onChange={e => setAddUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              <option value="">— Choisir un employé —</option>
              {(DEV_MODE
                ? [{ profile_id: "u1", first_name: "Yasmine" }, { profile_id: "u2", first_name: "Rayan" }, { profile_id: "u3", first_name: "Marco" }, { profile_id: "u4", first_name: "Léa" }]
                : members
              ).map(m => <option key={m.profile_id} value={m.profile_id}>{m.first_name ?? m.profile_id}</option>)}
            </select>
            {/* Times */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
                <input type="time" value={addStart} onChange={e => setAddStart(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
                <input type="time" value={addEnd} onChange={e => setAddEnd(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
            </div>
            {/* Coupure toggle */}
            {!addCoupure ? (
              <button onClick={() => setAddCoupure(true)} className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>+ Ajouter service du soir (coupure)</button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début soir</label>
                  <input type="time" value={addStart2} onChange={e => setAddStart2(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin soir</label>
                  <input type="time" value={addEnd2} onChange={e => setAddEnd2(e.target.value)} className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--foreground)" }} />
                </div>
              </div>
            )}
            <button onClick={handleAddShift} disabled={addSaving || !addUserId}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: "var(--success)", color: "var(--primary-foreground)", opacity: (addSaving || !addUserId) ? 0.5 : 1 }}>
              {addSaving ? "Enregistrement…" : "Enregistrer le shift"}
            </button>
          </div>
        )}

        {/* CA entry */}
        {(caSettings.mode === "per_service" || caSettings.mode === "per_day") && (
          <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-[11px] font-medium mb-2" style={{ color: "var(--success)" }}>
              CA {caSettings.mode === "per_service" ? "du service" : "du jour"} (total caisse)
            </p>
            {caSettings.mode === "per_service" ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--foreground-dim)" }}>Midi €</span>
                  <input type="number" min="0" step="1" value={caMidi} onChange={e => setCaMidi(e.target.value)} placeholder="0" className="w-full pl-12 pr-2 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--foreground-dim)" }}>Soir €</span>
                  <input type="number" min="0" step="1" value={caSoir} onChange={e => setCaSoir(e.target.value)} placeholder="0" className="w-full pl-12 pr-2 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
              </div>
            ) : (
              <div className="relative mb-2">
                <Euro size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
                <input type="number" min="0" step="1" value={caDay} onChange={e => setCaDay(e.target.value)} placeholder="Ex: 2400" className="w-full pl-7 pr-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
            )}
            <button onClick={handleSaveCA} disabled={caSaving}
              className="w-full py-2 rounded-base text-[12px] font-semibold flex items-center justify-center gap-1.5"
              style={{ background: caSaved ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.2)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}>
              {caSaved ? <><Check size={12} />Enregistré</> : caSaving ? "…" : "Enregistrer le CA"}
            </button>
            {caError && <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>{caError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function ShiftsTeamPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [shifts, setShifts] = useState<TeamShift[]>([]);
  const [planningShifts, setPlanningShifts] = useState<PlanningShiftItem[]>([]);
  const [tipSettings, setTipSettings] = useState<TipSettings>(DEFAULT_TIP_SETTINGS);
  const [caSettings, setCASettings] = useState<CASettings>(DEFAULT_CA_SETTINGS);
  const [monthlyCA, setMonthlyCA] = useState<number | null>(null);
  const [monthlyCaInput, setMonthlyCaInput] = useState("");
  const [monthlyCaSaving, setMonthlyCaSaving] = useState(false);
  const [monthlyCaSaved, setMonthlyCaSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPayroll, setShowPayroll] = useState(false);
  const [estId, setEstId] = useState("");
  const [estName, setEstName] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const [devRole] = useDevRole();

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    if (DEV_MODE) {
      if (devRole === "employee") { router.replace("/shifts"); return; }
      setEstId("dev-establishment-2"); setEstName("La Brasserie Test");
      setTipSettings({ mode: "dispatch", coefficients: { chef_de_rang: 1.2, serveur: 1.0, cuisinier: 0.8, commis: 0.5, barman: 0.9, plongeur: 0.4, responsable: 1.5, autre: 0.7 }, colors: { chef_de_rang: "#06B6D4", serveur: "#10B981", cuisinier: "#F59E0B", commis: "#F97316", barman: "#8B5CF6", plongeur: "#6B7280", responsable: "#EF4444", autre: "#A1A1AA" } });
      setCASettings({ mode: "per_month", staff_can_enter: false });
      setMonthlyCA(null); setMonthlyCaInput("");
      setShifts(buildDevShifts(y, m)); setLoading(false); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/shifts"); return; }
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
    const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;
    let memberQ = supabase.from("establishment_members").select("establishment_id, role, establishments(name, tip_settings, ca_settings)").eq("profile_id", user.id).eq("is_active", true).in("role", ["owner", "manager"]);
    if (validActiveId) memberQ = memberQ.eq("establishment_id", validActiveId);
    const member = (await memberQ.limit(1).maybeSingle()).data;
    // Si pas manager/owner sur l'établissement actif → vue employé
    if (!member) { router.replace("/shifts"); return; }
    const eid = member.establishment_id; setEstId(eid);
    const est = member.establishments as { name: string; tip_settings: unknown; ca_settings: unknown } | null;
    if (est) { setEstName(est.name); setTipSettings(parseTipSettings(est.tip_settings)); setCASettings(parseCASettings(est.ca_settings)); }
    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const last = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${last}`;
    // Pas de FK shifts→profiles donc pas de JOIN direct — on utilise establishment_members qui a la FK
    const [{ data: rawShifts }, { data: memberMap }, { data: rawPlanningShifts }] = await Promise.all([
      supabase.from("shifts").select("*").eq("establishment_id", eid).gte("shift_date", from).lte("shift_date", to).order("shift_date"),
      supabase.from("establishment_members").select("profile_id, staff_status, tips_enabled, profiles(first_name)").eq("establishment_id", eid).eq("is_active", true),
      supabase.from("planning_shifts").select("id, user_id, shift_date, service, confirmation_status, planning_weeks!inner(status)").eq("establishment_id", eid).eq("planning_weeks.status", "published").gte("shift_date", from).lte("shift_date", to),
    ]);
    const memberByUser = Object.fromEntries((memberMap ?? []).map(m => [m.profile_id, m]));
    const mapped: TeamShift[] = (rawShifts ?? []).map((s: Record<string, unknown>) => {
      const mem = memberByUser[s.user_id as string];
      const firstName = (mem as unknown as { profiles?: { first_name: string | null } | null })?.profiles?.first_name ?? null;
      return { ...(s as unknown as TeamShift), first_name: firstName, staff_status: (mem?.staff_status ?? null) as StaffStatus | null, tips_enabled: mem?.tips_enabled ?? true };
    });
    setShifts(mapped);
    const mappedPlanning: PlanningShiftItem[] = (rawPlanningShifts ?? []).map((s: Record<string, unknown>) => {
      const mem = memberByUser[s.user_id as string];
      return { id: s.id as string, user_id: s.user_id as string, shift_date: s.shift_date as string, service: s.service as string, confirmation_status: (s.confirmation_status as "pending" | "confirmed" | "modified") ?? "pending", staff_status: (mem?.staff_status ?? null) as StaffStatus | null };
    });
    setPlanningShifts(mappedPlanning);

    // Load validation status per employee
    const { data: membersData } = await supabase
      .from("establishment_members")
      .select("profile_id, staff_status, profiles(first_name)")
      .eq("establishment_id", eid)
      .eq("is_active", true);


    // Load monthly CA if mode is per_month
    const firstOfMonth = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const { data: caEntry } = await supabase.from("ca_entries").select("amount").eq("establishment_id", eid).eq("entry_date", firstOfMonth).eq("service", "month").maybeSingle();
    if (caEntry) { setMonthlyCA((caEntry as { amount: number }).amount); setMonthlyCaInput(String((caEntry as { amount: number }).amount)); }
    else { setMonthlyCA(null); setMonthlyCaInput(""); }
    setLoading(false);
  }, [supabase, devRole, router]);

  useEffect(() => { load(year, month); }, [year, month, load]);

  // Realtime — rafraîchit le calendrier quand un employé modifie ses heures
  useEffect(() => {
    if (!estId) return;
    const channel = supabase
      .channel(`shifts-team-${estId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" },
        () => { load(year, month); }
      )
      .on("broadcast", { event: "shift_saved" },
        () => { load(year, month); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [estId, year, month, load, supabase]);

  async function saveMonthlyCa() {
    const amount = parseFloat(monthlyCaInput) || 0;
    if (!estId || amount <= 0) return;
    setMonthlyCaSaving(true);
    const firstOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    if (!DEV_MODE) {
      await supabase.from("ca_entries").upsert({ establishment_id: estId, entry_date: firstOfMonth, service: "month", amount }, { onConflict: "establishment_id,entry_date,service" });
    }
    setMonthlyCA(amount);
    setMonthlyCaSaving(false); setMonthlyCaSaved(true);
    setTimeout(() => setMonthlyCaSaved(false), 2000);
  }

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const days = getDaysInMonth(year, month);
  const firstDay = isoWeekday(days[0]) - 1;
  const cells: (Date | null)[] = [...Array(firstDay).fill(null), ...days];
  const shiftsByDate = new Map<string, TeamShift[]>();
  for (const s of shifts) {
    if (!shiftsByDate.has(s.shift_date)) shiftsByDate.set(s.shift_date, []);
    shiftsByDate.get(s.shift_date)!.push(s);
  }
  const planningByDate = new Map<string, PlanningShiftItem[]>();
  for (const s of planningShifts) {
    if (!planningByDate.has(s.shift_date)) planningByDate.set(s.shift_date, []);
    planningByDate.get(s.shift_date)!.push(s);
  }
  const selectedShifts = selected ? (shiftsByDate.get(selected) ?? []) : [];
  const totalDispatched = shifts.filter(s => s.tips_enabled).reduce((sum, s) => sum + (s.tips ?? 0) + (s.tips_2 ?? 0), 0);
  const uniqueStaff = new Set(shifts.map(s => s.user_id)).size;
  const tipsEnabledCount = new Set(shifts.filter(s => s.tips_enabled).map(s => s.user_id)).size;

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <MonoLabel size="xs" className="mb-2 block">Planning Équipe</MonoLabel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>{estName || "Mon établissement"}</h1>
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prevMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronLeft size={18} /></button>
        <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{monthLabel(year, month)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronRight size={18} /></button>
      </div>

      {/* Rules — collapsible */}
      <details className="mb-3 px-1 group">
        <summary className="text-[10px] font-mono uppercase tracking-widest cursor-pointer select-none list-none flex items-center gap-1.5" style={{ color: "var(--foreground-dim)" }}>
          <span>Règles tips</span>
          <span className="text-[8px] group-open:rotate-180 transition-transform inline-block">▼</span>
        </summary>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
          {(Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden?.includes(s)).map(s => {
            const color = tipSettings.colors[s] ?? STAFF_STATUSES[s].color;
            const label = tipSettings.labels?.[s] ?? STAFF_STATUSES[s].label;
            const coef = tipSettings.mode === "dispatch" ? tipSettings.coefficients[s] : null;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{label}</span>
                {coef != null && (
                  <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: `${color}18`, color }}>x{coef.toFixed(1)}</span>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <Ban size={7} style={{ color: "var(--danger)" }} />
            <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>Sans pourboire</span>
          </div>
        </div>
      </details>

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
              if (!day) return <div key={`e-${i}`} style={{ minHeight: 80, borderRadius: 8 }} />;
              const dateStr = toDateStr(day);
              const dayShifts = shiftsByDate.get(dateStr) ?? [];
              const dayPlanning = planningByDate.get(dateStr) ?? [];
              const isToday = dateStr === toDateStr(today);
              const dayTips = dayShifts.filter(s => s.tips_enabled).reduce((sum, s) => sum + (s.tips ?? 0) + (s.tips_2 ?? 0), 0);
              // Planning shifts whose user hasn't yet entered real hours
              const realUserIds = new Set(dayShifts.map(s => s.user_id));
              const pendingPlanning = dayPlanning.filter(s => !realUserIds.has(s.user_id));
              const hasPending = pendingPlanning.some(s => s.confirmation_status === "pending");
              const hasRefused = pendingPlanning.some(s => s.confirmation_status === "modified");
              const cellBg = dayShifts.length > 0
                ? "rgba(6,182,212,0.04)"
                : hasRefused ? "rgba(239,68,68,0.05)"
                : hasPending ? "rgba(249,115,22,0.05)"
                : pendingPlanning.length > 0 ? "rgba(16,185,129,0.04)"
                : "var(--background-elev)";
              return (
                <button key={dateStr} onClick={() => setSelected(dateStr)}
                  className="relative flex flex-col items-start overflow-hidden transition-colors text-left hover:bg-white/[0.02] lg:min-h-[96px]"
                  style={{ minHeight: 80, padding: "6px 4px", borderRadius: 8, border: isToday ? "2px solid var(--foreground-muted)" : "1px solid var(--border-soft)", background: cellBg, cursor: "pointer" }}>
                  <span className="text-[12px] lg:text-[14px] mb-1 flex-shrink-0"
                    style={{ fontWeight: isToday ? 700 : 500, color: isToday ? "var(--foreground)" : "var(--foreground-muted)" }}>
                    {day.getDate()}
                  </span>
                  <div className="w-full flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {dayShifts.map(s => {
                      const color = s.staff_status ? (tipSettings.colors[s.staff_status] ?? STAFF_STATUSES[s.staff_status]?.color ?? "var(--accent)") : "var(--foreground-dim)";
                      return <span key={s.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, opacity: s.tips_enabled ? 1 : 0.5 }} />;
                    })}
                    {pendingPlanning.map(s => {
                      const dotColor = s.confirmation_status === "modified" ? "#EF4444" : s.confirmation_status === "confirmed" ? "#10B981" : "#F97316";
                      return <span key={s.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />;
                    })}
                  </div>
                  {dayTips > 0 && (
                    <span className="absolute bottom-1 right-1 text-[7px] lg:text-[10px] font-mono font-bold" style={{ color: "#F59E0B" }}>
                      {formatTips(dayTips)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips distribués */}
      {!loading && totalDispatched > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-[22px] font-bold" style={{ color: "#F59E0B" }}>{formatTips(totalDispatched)}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>Tips distribués</p>
        </div>
      )}

      {/* Monthly CA card */}
      {!loading && caSettings.mode === "per_month" && (
        <div className="mt-3 rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "var(--success)" }}>CA {monthLabel(year, month)}</p>
              <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Total caisse TTC</p>
            </div>
            {monthlyCA !== null && monthlyCA > 0 && (
              <p className="text-[18px] font-bold font-mono" style={{ color: "var(--success)" }}>{formatCA(monthlyCA)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Euro size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
              <input type="number" min="0" step="1" value={monthlyCaInput} onChange={e => setMonthlyCaInput(e.target.value)}
                placeholder={monthlyCA ? String(monthlyCA) : "Ex: 28 400"}
                className="w-full pl-7 pr-3 py-2 rounded-base text-[13px] outline-none"
                style={{ background: "var(--background)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--foreground)" }} />
            </div>
            <button onClick={saveMonthlyCa} disabled={monthlyCaSaving || !monthlyCaInput}
              className="px-4 py-2 rounded-base text-[12px] font-semibold flex items-center gap-1.5 flex-shrink-0"
              style={{ background: monthlyCaSaved ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.2)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)", opacity: !monthlyCaInput ? 0.5 : 1 }}>
              {monthlyCaSaved ? <><Check size={12} />OK</> : monthlyCaSaving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <button onClick={() => setShowPayroll(true)}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold"
          style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <FileText size={15} />
          Récap paie
        </button>
      )}

      {selected && <DayModal date={selected} shifts={selectedShifts} tipSettings={tipSettings} caSettings={caSettings} estId={estId} supabase={supabase} onClose={() => setSelected(null)} onSaved={() => load(year, month)} />}
      {showPayroll && <PayrollModal estId={estId} supabase={supabase} caSettings={caSettings} onClose={() => setShowPayroll(false)} />}
    </div>
  );
}
