"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import {
  ChevronLeft, ChevronRight, Sparkles, Check, RefreshCw, Clock,
  Plus, X, Settings2, ChevronDown, ChevronUp, Users, Download,
} from "lucide-react";
import {
  toDateStr, formatHours, DEFAULT_PAUSE_SETTINGS, STAFF_STATUSES,
  parsePlanningMode,
  type StaffStatus, type PlanningMode,
} from "@/lib/shifts";

const DEV_MODE = false;
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SERVICE_PALETTE = ["#F59E0B", "#818CF8", "#10B981", "#F87171", "#34D399", "#60A5FA"];

/* ── Interfaces ─────────────────────────────────────────────────────────────── */

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
  custom_rules?: string[];
}

interface DayConfig {
  services: ServiceEntry[];
  is_closed: boolean;
  validated: boolean;
}

interface DailyNeeds {
  type: "daily_v1";
  days: Record<string, DayConfig>;
  rules: PlanningRules;
}

const DEFAULT_RULES: PlanningRules = {
  allow_overtime: false,
  consecutive_rest_days: true,
  allow_split_shifts: false,
};

const DEFAULT_SERVICES: ServiceEntry[] = [
  { id: "midi", name: "Midi",  start: "11:30", end: "15:30", staff: { chef_de_rang: 1, cuisinier: 1 } },
  { id: "soir", name: "Soir",  start: "18:30", end: "23:00", staff: { serveur: 2,      cuisinier: 1 } },
];

interface PlanningWeek {
  id: string;
  week_start: string;
  status: "draft" | "published";
  service_needs: unknown;
}

interface ManualService {
  id: string;
  name: string;
  start: string;
  end: string;
}

function parseManualServices(raw: unknown): ManualService[] {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.type === "manual_v1" && Array.isArray(r.services)) {
      return r.services as ManualService[];
    }
  }
  return [
    { id: "midi", name: "Midi", start: "11:30", end: "15:30" },
    { id: "soir", name: "Soir", start: "18:30", end: "23:00" },
  ];
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

interface EmployeeInfo {
  id: string;
  name: string;
  status: string;
  hourly_rate: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function parseDailyNeeds(raw: unknown): Record<string, DayConfig> {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.type === "daily_v1" && r.days && typeof r.days === "object") {
      const days = r.days as Record<string, unknown>;
      const normalized: Record<string, DayConfig> = {};
      for (const [date, val] of Object.entries(days)) {
        if (val && typeof val === "object") {
          const d = val as Partial<DayConfig>;
          normalized[date] = {
            services: Array.isArray(d.services) ? d.services : [],
            is_closed: d.is_closed ?? false,
            validated: d.validated ?? false,
          };
        }
      }
      return normalized;
    }
  }
  return {};
}

function parseLegacyRules(raw: unknown): PlanningRules {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const rules = r.rules as Partial<PlanningRules> | undefined;
    if (rules) return { ...DEFAULT_RULES, ...rules };
  }
  return DEFAULT_RULES;
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

const FR_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function weekLabel(monday: Date): string {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date, year?: boolean) =>
    `${d.getDate()} ${FR_MONTHS[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ""}`;
  return `${fmt(monday)} – ${fmt(end, true)}`;
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

function newServiceId() {
  return `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ══════════════════════════════════════════════════════════════════════════════
   EXPORT MODAL
══════════════════════════════════════════════════════════════════════════════ */

const FR_DAYS_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const FR_MONTHS_FULL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function fmtDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${FR_DAYS_FULL[d.getDay()]} ${d.getDate()} ${FR_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${FR_DAYS_FULL[d.getDay()].slice(0, 3)}. ${d.getDate()} ${FR_MONTHS_FULL[d.getMonth()].slice(0, 4)}.`;
}

function fmtTime(t: string): string {
  return t.slice(0, 5).replace(":", "h");
}

interface ExportShift {
  id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  service: string;
  first_name: string;
  staff_status: string;
  hourly_rate: number;
}

function svcColorExport(name: string): { bg: string; text: string; border: string } {
  const palettes = [
    { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" },
    { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
    { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
    { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
    { bg: "#FED7AA", text: "#C2410C", border: "#FDBA74" },
    { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
    { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
    { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

function getMondayOfDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function buildExportHTML(
  estName: string,
  fromStr: string,
  toStr: string,
  shifts: ExportShift[],
  employees: EmployeeInfo[],
): string {
  const empMap = new Map(employees.map(e => [e.id, e]));

  // collect all employee IDs that have shifts, preserve order from employees prop
  const empIds = employees.filter(e => shifts.some(s => s.user_id === e.id)).map(e => e.id);

  // group shifts by week (monday)
  const weekMap = new Map<string, ExportShift[]>();
  for (const s of shifts) {
    const mon = getMondayOfDate(s.shift_date);
    if (!weekMap.has(mon)) weekMap.set(mon, []);
    weekMap.get(mon)!.push(s);
  }
  const sortedWeeks = [...weekMap.keys()].sort();

  const periodLabel = `${fmtDateFull(fromStr)} — ${fmtDateFull(toStr)}`;
  const generatedAt = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const weekGrids = sortedWeeks.map(monStr => {
    const weekShifts = weekMap.get(monStr)!;
    const mon = new Date(monStr + "T12:00:00");
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    const weekLabel = `${mon.getDate()} ${FR_MONTHS_FULL[mon.getMonth()]} — ${sun.getDate()} ${FR_MONTHS_FULL[sun.getMonth()]} ${sun.getFullYear()}`;

    const empColW = 90;
    const dayColW = `${Math.floor((100 - 12) / 7)}%`;

    const headerCells = days.map((ds, i) => {
      const d = new Date(ds + "T12:00:00");
      return `<th style="padding:8px 4px; text-align:center; font-size:10px; font-weight:600; color:#6b6b67; border-left:1px solid #e8e8e4; width:${dayColW}">
        <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.06em; color:#9b9b97">${DAY_LABELS[i]}</div>
        <div style="font-size:14px; font-weight:700; color:#1a1a18; margin-top:1px">${d.getDate()}</div>
      </th>`;
    }).join("");

    const empRows = empIds.map((uid, rowIdx) => {
      const emp = empMap.get(uid);
      const name = emp?.name ?? "—";
      const weekH = days.reduce((sum, ds) => {
        const s = weekShifts.filter(s => s.user_id === uid && s.shift_date === ds);
        return sum + s.reduce((a, sh) => a + calcHours(sh.start_time, sh.end_time), 0);
      }, 0);
      const color = STAFF_STATUSES[emp?.status as StaffStatus]?.color ?? "#a1a1aa";
      const bg = rowIdx % 2 === 0 ? "#ffffff" : "#fafaf7";

      const dayCells = days.map(ds => {
        const dayShifts = weekShifts.filter(s => s.user_id === uid && s.shift_date === ds);
        const cellContent = dayShifts.map(sh => {
          const c = svcColorExport(sh.service ?? "");
          return `<div style="background:${c.bg}; border:1px solid ${c.border}; border-radius:5px; padding:3px 5px; margin-bottom:2px">
            <div style="font-size:9px; font-weight:700; color:${c.text}; line-height:1.2">${sh.service}</div>
            <div style="font-size:8px; color:${c.text}; opacity:0.8; font-family:monospace">${fmtTime(sh.start_time)}–${fmtTime(sh.end_time)}</div>
          </div>`;
        }).join("");
        return `<td style="padding:4px; border-left:1px solid #e8e8e4; border-top:1px solid #e8e8e4; vertical-align:top; background:${bg}">${cellContent}</td>`;
      }).join("");

      return `<tr>
        <td style="padding:8px 10px; border-top:1px solid #e8e8e4; vertical-align:middle; background:${bg}">
          <div style="display:flex; align-items:center; gap:6px">
            <div style="width:8px; height:8px; border-radius:50%; background:${color}; flex-shrink:0"></div>
            <div>
              <div style="font-size:11px; font-weight:700; color:#1a1a18; line-height:1.2">${name}</div>
              ${weekH > 0 ? `<div style="font-size:9px; color:#9b9b97; font-family:monospace">${weekH.toFixed(1)}h</div>` : ""}
            </div>
          </div>
        </td>
        ${dayCells}
      </tr>`;
    }).join("");

    return `
      <div style="margin-bottom:32px; break-inside:avoid; page-break-inside:avoid">
        <div style="font-size:11px; font-weight:700; color:#6b6b67; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px">${weekLabel}</div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #e8e8e4; border-radius:8px; overflow:hidden">
          <thead>
            <tr style="background:#f4f4f0">
              <th style="padding:8px 10px; text-align:left; font-size:10px; font-weight:600; color:#9b9b97; width:${empColW}px">Équipe</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${empRows}</tbody>
        </table>
      </div>`;
  }).join("");

  const totalHours = shifts.reduce((s, sh) => s + calcHours(sh.start_time, sh.end_time), 0);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Planning ${estName} — ${periodLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a18; }
    @media print {
      @page { margin: 12mm 10mm; size: A4 landscape; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="max-width:1000px; margin:0 auto; padding:32px 24px">

    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #1a1a18">
      <div>
        <div style="font-size:10px; font-weight:600; color:#9b9b97; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px">Planning du personnel</div>
        <div style="font-size:24px; font-weight:800; color:#1a1a18">${estName || "Établissement"}</div>
        <div style="font-size:12px; color:#6b6b67; margin-top:4px">${periodLabel}</div>
      </div>
      <div style="display:flex; align-items:center; gap:20px">
        <div style="text-align:right">
          <div style="font-size:10px; color:#9b9b97; text-transform:uppercase; letter-spacing:0.06em">Total</div>
          <div style="font-size:20px; font-weight:800; color:#1a1a18">${totalHours.toFixed(1)}h</div>
        </div>
        <img src="https://karaf.fr/FONDCLAIRLOGO.png" alt="Karaf" style="width:44px; height:44px; object-fit:contain; mix-blend-mode:multiply; opacity:0.8" />
      </div>
    </div>

    <div class="no-print" style="margin-bottom:20px">
      <button onclick="window.print()" style="padding:9px 20px; background:#1a1a18; color:#fff; border:none; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer">
        Imprimer / Enregistrer en PDF
      </button>
    </div>

    ${weekGrids}

    <div style="margin-top:32px; padding-top:12px; border-top:1px solid #e8e8e4; display:flex; justify-content:space-between">
      <div style="font-size:10px; color:#b0b0aa">Généré le ${generatedAt} via Karaf</div>
      <div style="font-size:10px; color:#b0b0aa">karaf.fr</div>
    </div>
  </div>
</body>
</html>`;
}

function ExportModal({ estId, estName, employees, onClose }: {
  estId: string;
  estName: string;
  employees: EmployeeInfo[];
  onClose: () => void;
}) {
  const today = new Date();
  const monday = getMondayOf(today);
  const defaultFrom = toDateStr(monday);
  const defaultTo = toDateStr(new Date(monday.getTime() + 27 * 86400000));

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate,   setToDate]   = useState(defaultTo);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("planning_shifts")
        .select("id, user_id, shift_date, start_time, end_time, service, profiles(first_name)")
        .eq("establishment_id", estId)
        .gte("shift_date", fromDate)
        .lte("shift_date", toDate)
        .order("shift_date");

      if (dbErr) throw dbErr;

      const shifts: ExportShift[] = (data ?? []).map((s: any) => {
        const emp = employees.find(e => e.id === s.user_id);
        return {
          id: s.id,
          user_id: s.user_id,
          shift_date: s.shift_date,
          start_time: s.start_time,
          end_time: s.end_time,
          service: s.service,
          first_name: s.profiles?.first_name ?? emp?.name ?? "Employé",
          staff_status: emp?.status ?? "",
          hourly_rate: emp?.hourly_rate ?? 0,
        };
      });

      const html = buildExportHTML(estName, fromDate, toDate, shifts, employees);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold" style={{ color: "var(--foreground)" }}>Exporter le planning</p>
          <button onClick={onClose}><X size={18} style={{ color: "var(--foreground-dim)" }} /></button>
        </div>

        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          Choisissez la période à exporter. Un PDF s'ouvrira dans un nouvel onglet.
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Du</p>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px]"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Au</p>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px]"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {error && (
          <p className="text-[12px] px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}>{error}</p>
        )}

        <button
          onClick={handleExport}
          disabled={loading || !fromDate || !toDate}
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
        >
          <Download size={15} />
          {loading ? "Génération…" : "Générer le PDF"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */

export default function PlanningPage() {
  const [devRole] = useDevRole();

  /* ── Week navigation ── */
  const [weekStart,  setWeekStart]  = useState<Date>(() => getMondayOf(new Date()));
  const weekDates = getWeekDates(weekStart);

  /* ── DB state ── */
  const [planningWeek,   setPlanningWeek]   = useState<PlanningWeek | null | undefined>(undefined);
  const [planningShifts, setPlanningShifts] = useState<PlanningShift[]>([]);
  const [estId,          setEstId]          = useState<string | null>(null);
  const [estName,        setEstName]        = useState<string>("");
  const [employees,      setEmployees]      = useState<EmployeeInfo[]>([]);
  const [showExport,     setShowExport]     = useState(false);

  /* ── Owner: per-day config ── */
  const [dailyConfig,  setDailyConfig]  = useState<Record<string, DayConfig>>({});
  const [rules,        setRules]        = useState<PlanningRules>(DEFAULT_RULES);
  const [editingDay,   setEditingDay]   = useState<string | null>(null);
  const [savingDay,    setSavingDay]    = useState(false);
  const [rulesOpen,    setRulesOpen]    = useState(false);
  const [customRulesModal, setCustomRulesModal] = useState(false);
  const [newCustomRule,    setNewCustomRule]    = useState("");

  /* ── Planning mode ── */
  const [planningMode,    setPlanningMode]    = useState<PlanningMode>("ai");
  const [manualServices,  setManualServices]  = useState<ManualService[]>([]);

  /* ── Loading / actions ── */
  const [loading,      setLoading]      = useState(true);
  const [generating,   setGenerating]   = useState(false);
  const [validating,   setValidating]   = useState(false);
  const [addingShift,  setAddingShift]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  /* ── Employee-side state ── */
  const [isRealEmployee,    setIsRealEmployee]    = useState(false);
  const [myShifts,          setMyShifts]          = useState<PlanningShift[]>([]);
  const [refusalOpen,       setRefusalOpen]       = useState(false);
  const [refusalSelected,   setRefusalSelected]   = useState<Set<string>>(new Set());
  const [submittingRefusal, setSubmittingRefusal] = useState(false);

  /* ── Reassign popup (manager/owner) ── */
  const [reassignShift, setReassignShift] = useState<PlanningShift | null>(null);
  const [reassigning,   setReassigning]   = useState(false);

  /* ── Load ── */
  const load = useCallback(async (monday: Date) => {
    setLoading(true);
    setError(null);
    setEditingDay(null);
    setDailyConfig({});
    setPlanningWeek(null);
    setPlanningShifts([]);

    if (DEV_MODE) {
      setEstId("dev-establishment");
      setLoading(false);
      return;
    }

    try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cookieMatch = typeof document !== "undefined"
      ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/)
      : null;
    const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;

    // Try owner/manager first
    let memberQ = supabase
      .from("establishment_members")
      .select("establishment_id")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "manager"]);
    if (validActiveId) memberQ = memberQ.eq("establishment_id", validActiveId);
    const { data: mgr } = await memberQ.limit(1).maybeSingle();

    const resolvedEid = mgr?.establishment_id ?? null;

    if (!resolvedEid) {
      // Employee view
      let empQ = supabase.from("establishment_members").select("establishment_id")
        .eq("profile_id", user.id).eq("is_active", true);
      if (validActiveId) empQ = empQ.eq("establishment_id", validActiveId);
      const { data: emp } = await empQ.limit(1).maybeSingle();
      if (!emp) { setLoading(false); return; }
      setIsRealEmployee(true);
      setEstId(emp.establishment_id);

      const from = toDateStr(monday);
      const { data: pubWeeks } = await supabase
        .from("planning_weeks")
        .select("id, week_start, status")
        .eq("establishment_id", emp.establishment_id)
        .eq("status", "published")
        .gte("week_start", from)
        .order("week_start")
        .limit(4);

      if (pubWeeks?.length) {
        const weekIds = pubWeeks.map((w: { id: string }) => w.id);
        const { data: empShifts } = await supabase
          .from("planning_shifts")
          .select("id, user_id, shift_date, start_time, end_time, service, confirmation_status")
          .eq("user_id", user.id)
          .in("planning_week_id", weekIds)
          .order("shift_date")
          .order("start_time");
        setMyShifts((empShifts ?? []) as PlanningShift[]);
      }
      setLoading(false);
      return;
    }

    setEstId(resolvedEid);

    // Load planning mode + establishment name
    const { data: estData } = await supabase
      .from("establishments")
      .select("planning_mode, name")
      .eq("id", resolvedEid)
      .maybeSingle();
    setPlanningMode(parsePlanningMode((estData as Record<string, unknown> | null)?.planning_mode));
    setEstName((estData as Record<string, unknown> | null)?.name as string ?? "");

    // Load employees for reassignment
    const { data: memberRows } = await supabase
      .from("establishment_members")
      .select("profile_id, staff_status, profiles(first_name)")
      .eq("establishment_id", resolvedEid)
      .eq("is_active", true);

    setEmployees(
      (memberRows ?? []).map((m: any) => ({
        id: m.profile_id,
        name: m.profiles?.first_name ?? "Employé",
        status: m.staff_status ?? "autre",
        hourly_rate: 12,
      }))
    );

    const weekStr = toDateStr(monday);
    const { data: pw } = await supabase
      .from("planning_weeks")
      .select("*")
      .eq("establishment_id", resolvedEid)
      .eq("week_start", weekStr)
      .maybeSingle();

    if (pw) {
      setPlanningWeek(pw as PlanningWeek);
      setDailyConfig(parseDailyNeeds(pw.service_needs));
      setRules(parseLegacyRules(pw.service_needs));
      setManualServices(parseManualServices(pw.service_needs));

      const { data: ps } = await supabase
        .from("planning_shifts")
        .select("id, user_id, shift_date, start_time, end_time, service, confirmation_status, profiles(first_name)")
        .eq("planning_week_id", pw.id)
        .order("shift_date")
        .order("start_time");

      const empMap = Object.fromEntries((memberRows ?? []).map((m: any) => [m.profile_id, m.staff_status ?? null]));

      setPlanningShifts(
        (ps ?? []).map((s: any) => ({
          ...s,
          first_name: s.profiles?.first_name ?? null,
          staff_status: empMap[s.user_id] ?? null,
        }))
      );
    } else {
      // Copy last week's config as starting point
      const prevMonday = new Date(monday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const { data: prevPw } = await supabase
        .from("planning_weeks")
        .select("service_needs")
        .eq("establishment_id", resolvedEid)
        .eq("week_start", toDateStr(prevMonday))
        .maybeSingle();

      if (prevPw?.service_needs) {
        const prev = parseDailyNeeds(prevPw.service_needs);
        // Remap dates from last week to this week
        const remapped: Record<string, DayConfig> = {};
        Object.entries(prev).forEach(([oldDate, cfg]) => {
          const old = new Date(oldDate + "T00:00:00");
          const dayIndex = (old.getDay() + 6) % 7; // Mon=0
          const newDate = toDateStr(weekDates[dayIndex]);
          remapped[newDate] = { ...cfg, validated: false };
        });
        setDailyConfig(remapped);
        setRules(parseLegacyRules(prevPw.service_needs));
      }
    }

    setLoading(false);
    } catch (err) {
      console.error("[planning] load error:", err);
      setError("Erreur lors du chargement du planning.");
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(weekStart); }, [weekStart, load]);

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d);
  }

  /* ── Save day config ── */
  async function saveDay(dateStr: string) {
    if (!estId) return;
    setSavingDay(true);
    setError(null);

    const updatedConfig = {
      ...dailyConfig,
      [dateStr]: { ...dailyConfig[dateStr], validated: true },
    };
    setDailyConfig(updatedConfig);

    const needs: DailyNeeds = { type: "daily_v1", days: updatedConfig, rules };

    try {
      const supabase = createClient();
      const weekStr = toDateStr(weekStart);

      if (planningWeek?.id) {
        await supabase
          .from("planning_weeks")
          .update({ service_needs: needs })
          .eq("id", planningWeek.id);
      } else {
        const { data: newPw } = await supabase
          .from("planning_weeks")
          .upsert(
            { establishment_id: estId, week_start: weekStr, status: "draft", service_needs: needs },
            { onConflict: "establishment_id,week_start" }
          )
          .select()
          .single();
        if (newPw) setPlanningWeek(newPw as PlanningWeek);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }

    setSavingDay(false);
    setEditingDay(null);
  }

  /* ── Generate planning ── */
  async function handleGenerate() {
    if (!estId) return;
    setGenerating(true);
    setError(null);

    const needs: DailyNeeds = { type: "daily_v1", days: dailyConfig, rules };
    try {
      const resp = await fetch("/api/planning/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishment_id: estId, week_start: toDateStr(weekStart), needs }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error ?? "Erreur génération");
      await load(weekStart);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  }

  /* ── Validate (publish) planning ── */
  async function handleValidate() {
    if (!planningWeek || !estId) return;
    setValidating(true);
    setError(null);
    try {
      const resp = await fetch("/api/planning/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planning_week_id: planningWeek.id }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error ?? "Erreur validation");
      await load(weekStart);
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishmentId: estId,
          title: 'Planning à valider',
          body: 'Ton planning a été publié. Confirme ou refuse tes shifts.',
          url: '/shifts',
          targetRole: 'employee',
        }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setValidating(false);
    }
  }

  /* ── Cancel published planning → back to draft ── */
  async function handleCancelPublish() {
    if (!planningWeek) return;
    const supabase = createClient();
    await supabase.from("planning_weeks").update({ status: "draft" }).eq("id", planningWeek.id);
    await supabase.from("planning_shifts").update({ confirmation_status: "pending" }).eq("planning_week_id", planningWeek.id);
    await load(weekStart);
  }

  /* ── Regenerate ── */
  async function handleRegenerate() {
    if (!planningWeek) return;
    const supabase = createClient();
    await supabase.from("planning_shifts").delete().eq("planning_week_id", planningWeek.id);
    await supabase.from("planning_weeks").delete().eq("id", planningWeek.id);
    setPlanningWeek(null);
    setPlanningShifts([]);
  }

  /* ── Reassign shift ── */
  async function handleReassign(shiftId: string, newUserId: string) {
    setReassigning(true);
    try {
      const supabase = createClient();
      await supabase
        .from("planning_shifts")
        .update({ user_id: newUserId, confirmation_status: "pending" })
        .eq("id", shiftId);
      setPlanningShifts(prev =>
        prev.map(s => s.id === shiftId
          ? { ...s, user_id: newUserId, confirmation_status: "pending" as const, first_name: employees.find(e => e.id === newUserId)?.name ?? null }
          : s
        )
      );
      setReassignShift(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setReassigning(false);
    }
  }

  /* ── Manual: save services grid ── */
  async function handleSaveManualServices(services: ManualService[]) {
    setManualServices(services);
    if (!estId) return;
    const supabase = createClient();
    const weekStr = toDateStr(weekStart);
    const needs = { type: "manual_v1", services };
    if (planningWeek?.id) {
      await supabase.from("planning_weeks").update({ service_needs: needs }).eq("id", planningWeek.id);
    } else {
      const { data: newPw } = await supabase
        .from("planning_weeks")
        .upsert(
          { establishment_id: estId, week_start: weekStr, status: "draft", service_needs: needs },
          { onConflict: "establishment_id,week_start" }
        )
        .select().single();
      if (newPw) setPlanningWeek(newPw as PlanningWeek);
    }
  }

  /* ── Manual: add shift ── */
  async function handleAddManualShift(dateStr: string, userId: string, service: string, start: string, end: string) {
    if (!estId) return;
    setAddingShift(true);
    setError(null);
    try {
      const supabase = createClient();
      const weekStr = toDateStr(weekStart);
      let weekId = planningWeek?.id;

      if (!weekId) {
        const { data: newPw } = await supabase
          .from("planning_weeks")
          .upsert(
            { establishment_id: estId, week_start: weekStr, status: "draft", service_needs: {} },
            { onConflict: "establishment_id,week_start" }
          )
          .select()
          .single();
        if (newPw) { setPlanningWeek(newPw as PlanningWeek); weekId = newPw.id; }
      }

      if (!weekId) throw new Error("Impossible de créer la semaine");

      const { data: newShift } = await supabase
        .from("planning_shifts")
        .insert({
          planning_week_id: weekId,
          establishment_id: estId,
          user_id: userId,
          shift_date: dateStr,
          start_time: start,
          end_time: end,
          service,
          confirmation_status: "pending",
        })
        .select("id, user_id, shift_date, start_time, end_time, service, confirmation_status")
        .single();

      if (newShift) {
        const emp = employees.find(e => e.id === userId);
        setPlanningShifts(prev => [...prev, {
          ...(newShift as PlanningShift),
          first_name: emp?.name ?? null,
          staff_status: emp?.status ?? null,
        }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAddingShift(false);
    }
  }

  /* ── Manual: delete shift ── */
  async function handleDeleteManualShift(shiftId: string) {
    const supabase = createClient();
    await supabase.from("planning_shifts").delete().eq("id", shiftId);
    setPlanningShifts(prev => prev.filter(s => s.id !== shiftId));
  }

  /* ── Employee: confirm shift ── */
  async function confirmShift(shiftId: string) {
    const supabase = createClient();
    await supabase.from("planning_shifts").update({ confirmation_status: "confirmed" }).eq("id", shiftId);
    setMyShifts(prev => prev.map(s => s.id === shiftId ? { ...s, confirmation_status: "confirmed" as const } : s));
  }

  /* ── Employee: refuse selected shifts ── */
  async function submitRefusal() {
    if (refusalSelected.size === 0) return;
    setSubmittingRefusal(true);
    const supabase = createClient();
    const ids = [...refusalSelected];
    await supabase.from("planning_shifts").update({ confirmation_status: "modified" }).in("id", ids);
    setMyShifts(prev => prev.map(s => refusalSelected.has(s.id) ? { ...s, confirmation_status: "modified" as const } : s));
    setRefusalSelected(new Set());
    setRefusalOpen(false);
    setSubmittingRefusal(false);
  }

  /* ══ EMPLOYEE VIEW ══════════════════════════════════════════════════════════ */
  if (isRealEmployee || (DEV_MODE && devRole === "employee")) {
    const byDate = new Map<string, PlanningShift[]>();
    myShifts.forEach(s => {
      if (!byDate.has(s.shift_date)) byDate.set(s.shift_date, []);
      byDate.get(s.shift_date)!.push(s);
    });
    const sortedDates = [...byDate.keys()].sort();
    const pendingShifts = myShifts.filter(s => s.confirmation_status === "pending");
    const hasModified   = myShifts.some(s => s.confirmation_status === "modified");

    return (
      <div className="px-4 py-6 max-w-lg">
        <div className="mb-6">
          <MonoLabel size="xs" className="mb-1 block">Planning</MonoLabel>
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--foreground)" }}>Mes shifts planifiés</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Confirme tes shifts ou signale un problème</p>
        </div>

        {loading && <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />}

        {!loading && myShifts.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun planning publié pour les prochaines semaines</p>
          </div>
        )}

        {!loading && myShifts.length > 0 && (
          <>
            {/* Global action bar */}
            {pendingShifts.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setRefusalSelected(new Set(pendingShifts.map(s => s.id)));
                    setRefusalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  Je ne valide pas tout
                </button>
              </div>
            )}

            {hasModified && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-[12px]"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                Certains shifts ont été signalés. Le manager va prendre contact.
              </div>
            )}

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
                      const isRefused   = shift.confirmation_status === "modified";
                      return (
                        <div key={shift.id} className="px-4 py-3 flex items-center gap-3"
                          style={{
                            background: isRefused ? "rgba(239,68,68,0.03)" : isConfirmed ? "rgba(16,185,129,0.03)" : "var(--background)",
                            borderBottom: "1px solid var(--border-soft)",
                          }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{shift.service}</p>
                            <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>
                              {shift.start_time.slice(0, 5)} → {shift.end_time.slice(0, 5)}
                            </p>
                          </div>
                          {isConfirmed && (
                            <span className="text-[11px] px-2 py-1 rounded-full"
                              style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>✓ Confirmé</span>
                          )}
                          {isRefused && (
                            <span className="text-[11px] px-2 py-1 rounded-full"
                              style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>✗ Signalé</span>
                          )}
                          {!isConfirmed && !isRefused && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => confirmShift(shift.id)}
                                className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                                style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}
                              >✓ OK</button>
                              <button
                                onClick={() => { setRefusalSelected(new Set([shift.id])); setRefusalOpen(true); }}
                                className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}
                              >✗ Non</button>
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

        {/* Refusal popup */}
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

              <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
                {myShifts.filter(s => s.confirmation_status !== "modified").map(shift => {
                  const selected = refusalSelected.has(shift.id);
                  const d = new Date(shift.shift_date + "T12:00:00");
                  const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
                  return (
                    <button
                      key={shift.id}
                      onClick={() => {
                        const next = new Set(refusalSelected);
                        if (selected) next.delete(shift.id); else next.add(shift.id);
                        setRefusalSelected(next);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{
                        background: selected ? "rgba(239,68,68,0.1)" : "var(--background)",
                        border: `1px solid ${selected ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: selected ? "var(--danger)" : "transparent", border: `1.5px solid ${selected ? "var(--danger)" : "var(--border)"}` }}>
                        {selected && <Check size={10} color="white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium capitalize" style={{ color: "var(--foreground)" }}>{dayLabel} · {shift.service}</p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>
                          {shift.start_time.slice(0, 5)} → {shift.end_time.slice(0, 5)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRefusalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
                >Annuler</button>
                <button
                  onClick={submitRefusal}
                  disabled={refusalSelected.size === 0 || submittingRefusal}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", opacity: refusalSelected.size === 0 ? 0.4 : 1 }}
                >
                  {submittingRefusal ? "Envoi…" : `Signaler (${refusalSelected.size})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══ OWNER / MANAGER VIEW ═══════════════════════════════════════════════════ */

  const anyValidated = Object.values(dailyConfig).some(d => d.validated);
  const hasGenerated = planningShifts.length > 0;

  return (
    <div className="max-w-4xl px-4 py-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--foreground)" }}>Planning</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
            {planningMode === "manual" ? "Créez les shifts manuellement, puis publiez" : "Configurez les besoins jour par jour, puis générez"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--foreground-dim)", background: "var(--background-elev)" }}
          >
            <Download size={13} />
            Exporter
          </button>
          {planningMode === "ai" ? <Sparkles size={20} style={{ color: "#F59E0B" }} /> : <Users size={20} style={{ color: "var(--accent)" }} />}
        </div>
      </div>

      {showExport && estId && (
        <ExportModal
          estId={estId}
          estName={estName}
          employees={employees}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Week selector */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={prevWeek} className="p-1.5 rounded-lg"
          style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{weekLabel(weekStart)}</p>
          <MonoLabel size="xs" className="mt-0.5">S{getISOWeek(weekStart)}</MonoLabel>
        </div>
        <button onClick={nextWeek} className="p-1.5 rounded-lg"
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
          <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Chargement…</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Day Calendar (AI mode) ── */}
          {planningMode === "ai" && (!planningWeek || planningWeek.status === "draft") && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Settings2 size={13} style={{ color: "var(--accent)" }} />
                  <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Besoins par jour</p>
                </div>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                  {Object.values(dailyConfig).filter(d => d.validated).length}/7 validés
                </p>
              </div>

              <div className="grid grid-cols-7" style={{ background: "var(--background)" }}>
                {weekDates.map((date, idx) => {
                  const dateStr  = toDateStr(date);
                  const cfg      = dailyConfig[dateStr];
                  const isEditing = editingDay === dateStr;
                  const validated = cfg?.validated;
                  const configured = cfg && !cfg.is_closed && (cfg.services?.length ?? 0) > 0;
                  const isClosed  = cfg?.is_closed;

                  let dotColor = "var(--border)";
                  if (isClosed)    dotColor = "#6B7280";
                  else if (validated) dotColor = "#10B981";
                  else if (configured) dotColor = "#F59E0B";

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setEditingDay(isEditing ? null : dateStr)}
                      className="flex flex-col items-center justify-center py-3 px-1 gap-1 transition-colors"
                      style={{
                        borderRight: idx < 6 ? "1px solid var(--border-soft)" : "none",
                        background: isEditing ? "rgba(6,182,212,0.06)" : "transparent",
                        borderBottom: isEditing ? "2px solid var(--accent)" : "2px solid transparent",
                      }}
                    >
                      <span className="text-[9px] font-mono uppercase tracking-widest"
                        style={{ color: "var(--foreground-dim)" }}>{DAYS_SHORT[idx]}</span>
                      <span className="text-[16px] font-bold leading-none"
                        style={{ color: isEditing ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                    </button>
                  );
                })}
              </div>

              {/* Day config panel */}
              {editingDay && (
                <DayConfigPanel
                  dateStr={editingDay}
                  weekDates={weekDates}
                  config={dailyConfig[editingDay] ?? { services: [...DEFAULT_SERVICES.map(s => ({ ...s, staff: { ...s.staff } }))], is_closed: false, validated: false }}
                  onUpdate={cfg => setDailyConfig(prev => ({ ...prev, [editingDay]: cfg }))}
                  onSave={() => saveDay(editingDay)}
                  saving={savingDay}
                />
              )}
            </div>
          )}

          {/* ── Rules (collapsible, AI mode only) ── */}
          {planningMode === "ai" && (!planningWeek || planningWeek.status === "draft") && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center" style={{ background: "var(--background-elev)" }}>
                <button
                  onClick={() => setRulesOpen(v => !v)}
                  className="flex-1 flex items-center justify-between px-4 py-3"
                >
                  <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>
                    Règles de génération IA
                    {(rules.custom_rules?.length ?? 0) > 0 && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.12)", color: "var(--accent)" }}>
                        +{rules.custom_rules!.length}
                      </span>
                    )}
                  </span>
                  {rulesOpen ? <ChevronUp size={14} style={{ color: "var(--foreground-dim)" }} /> : <ChevronDown size={14} style={{ color: "var(--foreground-dim)" }} />}
                </button>
                <button
                  onClick={() => setCustomRulesModal(true)}
                  className="px-3 py-3 flex-shrink-0"
                  style={{ borderLeft: "1px solid var(--border)", color: "var(--foreground-dim)" }}
                  title="Règles personnalisées"
                >
                  <Settings2 size={14} />
                </button>
              </div>
              {rulesOpen && (
                <div className="px-4 py-3 space-y-2.5" style={{ background: "var(--background)" }}>
                  {(
                    [
                      { key: "consecutive_rest_days" as const, label: "Jours de repos consécutifs" },
                      { key: "allow_overtime"         as const, label: "Autoriser les heures supplémentaires" },
                      { key: "allow_split_shifts"     as const, label: "Autoriser les coupures (midi + soir)" },
                    ]
                  ).map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                      <div
                        onClick={() => setRules(r => ({ ...r, [key]: !r[key] }))}
                        className="w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer"
                        style={{ background: rules[key] ? "var(--accent)" : "var(--border)", flexShrink: 0 }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white transition-transform"
                          style={{ transform: rules[key] ? "translateX(16px)" : "translateX(0)" }} />
                      </div>
                    </label>
                  ))}
                  {(rules.custom_rules?.length ?? 0) > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Règles personnalisées</p>
                      {rules.custom_rules!.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
                          <span className="flex-1 text-[12px]" style={{ color: "var(--foreground-muted)" }}>{r}</span>
                          <button onClick={() => setRules(prev => ({ ...prev, custom_rules: prev.custom_rules!.filter((_, j) => j !== i) }))} style={{ color: "var(--foreground-dim)" }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal règles personnalisées */}
            {customRulesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) setCustomRulesModal(false); }}>
                <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Règles personnalisées</p>
                    <button onClick={() => setCustomRulesModal(false)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Décris tes propres contraintes en langage naturel. L&apos;IA les respectera lors de la génération.</p>
                  <div className="flex gap-2">
                    <input
                      value={newCustomRule}
                      onChange={e => setNewCustomRule(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newCustomRule.trim()) { setRules(r => ({ ...r, custom_rules: [...(r.custom_rules ?? []), newCustomRule.trim()] })); setNewCustomRule(""); } }}
                      placeholder="Ex : Karim ne travaille pas le lundi"
                      className="flex-1 px-3 py-2 text-[13px] rounded-lg outline-none"
                      style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                    <button
                      onClick={() => { if (newCustomRule.trim()) { setRules(r => ({ ...r, custom_rules: [...(r.custom_rules ?? []), newCustomRule.trim()] })); setNewCustomRule(""); } }}
                      className="px-3 py-2 rounded-lg"
                      style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(rules.custom_rules ?? []).length === 0 ? (
                      <p className="text-[12px] text-center py-3" style={{ color: "var(--foreground-dim)" }}>Aucune règle personnalisée</p>
                    ) : (rules.custom_rules ?? []).map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                        <span className="flex-1 text-[13px]" style={{ color: "var(--foreground)" }}>{r}</span>
                        <button onClick={() => setRules(prev => ({ ...prev, custom_rules: prev.custom_rules!.filter((_, j) => j !== i) }))} style={{ color: "var(--foreground-dim)" }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          )}

          {/* ── Generate button (AI mode only) ── */}
          {planningMode === "ai" && !hasGenerated && anyValidated && (
            <>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: generating ? 0.7 : 1 }}
              >
                {generating
                  ? <><RefreshCw size={14} className="animate-spin" />Génération IA…</>
                  : <><Sparkles size={14} />Générer le planning IA</>}
              </button>
              {error && (
                <div className="px-3 py-2 rounded-lg text-[12px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                  {error}
                </div>
              )}
            </>
          )}

          {/* ── Manual mode: grille employés × jours ── */}
          {planningMode === "manual" && planningWeek?.status !== "published" && (
            <ManualPlanningGrid
              weekDates={weekDates}
              services={manualServices}
              shifts={planningShifts}
              employees={employees}
              adding={addingShift}
              onServicesChange={handleSaveManualServices}
              onAddShift={handleAddManualShift}
              onDeleteShift={handleDeleteManualShift}
            />
          )}

          {/* ── Manual: publish button ── */}
          {planningMode === "manual" && planningWeek?.status === "draft" && planningShifts.length > 0 && !hasGenerated && (
            <button
              onClick={handleValidate}
              disabled={validating}
              className="w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", color: "#fff", opacity: validating ? 0.6 : 1 }}
            >
              {validating ? "Publication…" : <><Check size={14} />Publier le planning</>}
            </button>
          )}

          {/* ── Draft view ── */}
          {planningWeek?.status === "draft" && hasGenerated && (
            <DraftView
              shifts={planningShifts}
              weekDates={weekDates}
              employees={employees}
              onValidate={handleValidate}
              onRegenerate={handleRegenerate}
              validating={validating}
              onReassign={shift => setReassignShift(shift)}
              canRegenerate={planningMode === "ai"}
            />
          )}

          {/* ── Published view ── */}
          {planningWeek?.status === "published" && (
            <PublishedView
              shifts={planningShifts}
              weekDates={weekDates}
              employees={employees}
              onReassign={shift => setReassignShift(shift)}
              onCancel={handleCancelPublish}
            />
          )}

          {/* Nothing configured yet */}
          {!planningWeek && !anyValidated && planningShifts.length === 0 && !loading && (
            <div className="rounded-xl p-6 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                {planningMode === "manual"
                  ? "Cliquez sur un jour pour ajouter des shifts."
                  : "Cliquez sur un jour pour configurer les besoins en personnel."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Reassign popup ── */}
      {reassignShift && (
        <ReassignPopup
          shift={reassignShift}
          employees={employees}
          planningShifts={planningShifts}
          reassigning={reassigning}
          onReassign={handleReassign}
          onClose={() => setReassignShift(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DAY CONFIG PANEL
══════════════════════════════════════════════════════════════════════════════ */

function DayConfigPanel({ dateStr, weekDates, config, onUpdate, onSave, saving }: {
  dateStr: string;
  weekDates: Date[];
  config: DayConfig;
  onUpdate: (cfg: DayConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const idx = weekDates.findIndex(d => toDateStr(d) === dateStr);
  const dayName = idx >= 0 ? DAYS_FULL[idx] : dateStr;
  const date = new Date(dateStr + "T12:00:00");
  const dateLabel = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <div className="px-4 pb-4 pt-3 space-y-3" style={{ background: "var(--background)", borderTop: "1px solid var(--border-soft)" }}>
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{dayName}</p>
          <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{dateLabel}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Fermé</span>
          <div
            onClick={() => onUpdate({ ...config, is_closed: !config.is_closed })}
            className="w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer"
            style={{ background: config.is_closed ? "var(--accent)" : "var(--border)" }}
          >
            <div className="w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: config.is_closed ? "translateX(16px)" : "translateX(0)" }} />
          </div>
        </label>
      </div>

      {!config.is_closed && (
        <>
          <div className="space-y-2.5">
            {config.services.map((svc, i) => (
              <ServicePeriodCard
                key={svc.id}
                service={svc}
                canRemove={config.services.length > 1}
                onUpdate={updated => {
                  const next = [...config.services];
                  next[i] = updated;
                  onUpdate({ ...config, services: next });
                }}
                onRemove={() => {
                  const next = config.services.filter((_, j) => j !== i);
                  onUpdate({ ...config, services: next });
                }}
              />
            ))}
          </div>

          <button
            onClick={() => onUpdate({ ...config, services: [...config.services, { id: newServiceId(), name: "Service", start: "11:00", end: "15:00", staff: {} }] })}
            className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-lg w-full"
            style={{ color: "var(--foreground-dim)", border: "1px dashed var(--border)", background: "transparent" }}
          >
            <Plus size={12} />Ajouter un service
          </button>
        </>
      )}

      {config.is_closed && (
        <div className="py-3 text-center">
          <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Ce jour est fermé — aucun service</p>
        </div>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
        style={{ background: "var(--success)", color: "var(--primary-foreground)", opacity: saving ? 0.7 : 1 }}
      >
        {saving
          ? <><RefreshCw size={12} className="animate-spin" />Sauvegarde…</>
          : <><Check size={13} />Valider {dayName}</>}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SERVICE PERIOD CARD
══════════════════════════════════════════════════════════════════════════════ */

function ServicePeriodCard({ service, onUpdate, onRemove, canRemove }: {
  service: ServiceEntry;
  onUpdate: (updated: ServiceEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const activeStaff  = Object.entries(service.staff).filter(([, count]) => count > 0);
  const available    = (Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !service.staff[s] || service.staff[s] === 0);

  function updateCount(status: string, delta: number) {
    const next = Math.max(0, (service.staff[status] ?? 0) + delta);
    const newStaff = { ...service.staff };
    if (next === 0) delete newStaff[status]; else newStaff[status] = next;
    onUpdate({ ...service, staff: newStaff });
  }

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
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
            style={{ color: "var(--foreground-dim)", background: "transparent" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {activeStaff.length > 0 && (
        <div className="space-y-1.5">
          {activeStaff.map(([status, count]) => {
            const info  = STAFF_STATUSES[status as StaffStatus];
            const color = info?.color ?? "#A1A1AA";
            return (
              <div key={status} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border-soft)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="flex-1 text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{info?.label ?? status}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateCount(status, -1)}
                    className="w-6 h-6 rounded-md text-[13px] font-bold flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>−</button>
                  <span className="w-4 text-center text-[14px] font-bold" style={{ color }}>{count}</span>
                  <button onClick={() => updateCount(status, 1)}
                    className="w-6 h-6 rounded-md text-[13px] font-bold flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {available.length > 0 && (
        showRoleSelect ? (
          <select autoFocus
            className="w-full text-[12px] rounded-lg px-2.5 py-2"
            style={{ background: "var(--background)", border: "1px solid var(--accent)", color: "var(--foreground)" }}
            onChange={e => { if (e.target.value) { onUpdate({ ...service, staff: { ...service.staff, [e.target.value]: 1 } }); setShowRoleSelect(false); } }}
            onBlur={() => setShowRoleSelect(false)}
            defaultValue="">
            <option value="" disabled>Choisir un poste…</option>
            {available.map(s => <option key={s} value={s}>{STAFF_STATUSES[s].label}</option>)}
          </select>
        ) : (
          <button onClick={() => setShowRoleSelect(true)}
            className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg w-full"
            style={{ color: "var(--foreground-dim)", border: "1px dashed var(--border)", background: "transparent" }}>
            <Plus size={12} />Ajouter un poste
          </button>
        )
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SHIFT CHIP
══════════════════════════════════════════════════════════════════════════════ */

const CONFIRM_COLOR: Record<string, string> = { confirmed: "#10B981", modified: "#EF4444", pending: "#F59E0B" };
const CONFIRM_ICON:  Record<string, string> = { confirmed: "✓",       modified: "✗",       pending: "·" };

function ShiftChip({ shift, showStatus, onClick }: {
  shift: PlanningShift;
  showStatus?: boolean;
  onClick?: () => void;
}) {
  const color = STAFF_STATUSES[shift.staff_status as StaffStatus]?.color ?? "#A1A1AA";
  const statusColor = CONFIRM_COLOR[shift.confirmation_status] ?? CONFIRM_COLOR.pending;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="truncate flex-1 min-w-0">{shift.first_name ?? "?"}</span>
      {showStatus && (
        <span className="text-[9px] font-bold flex-shrink-0" style={{ color: statusColor }}>
          {CONFIRM_ICON[shift.confirmation_status] ?? "·"}
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   WEEK GRID
══════════════════════════════════════════════════════════════════════════════ */

function WeekGrid({ shifts, weekDates, showStatus, onShiftClick }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  showStatus?: boolean;
  onShiftClick?: (shift: PlanningShift) => void;
}) {
  const activeDates = weekDates;
  if (shifts.length === 0) return null;

  const getShifts = (date: Date, service: string) =>
    shifts.filter(s => s.shift_date === toDateStr(date) && s.service === service);
  const serviceKeys = [...new Set(shifts.map(s => s.service))];
  const serviceRows = serviceKeys.map((key, i) => {
    const sample = shifts.find(s => s.service === key);
    const time   = sample ? `${sample.start_time.slice(0, 5)} – ${sample.end_time.slice(0, 5)}` : "";
    return { key, label: key.toUpperCase(), color: SERVICE_PALETTE[i % SERVICE_PALETTE.length], time };
  });

  const n       = activeDates.length;
  const LABEL_W = n <= 3 ? 64 : n <= 5 ? 56 : 48;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px repeat(${n}, 1fr)` }}>
        {/* Header row */}
        <div style={{ borderBottom: "1px solid var(--border-soft)" }} />
        {activeDates.map((date, i) => {
          const isToday = toDateStr(new Date()) === toDateStr(date);
          const dayIdx  = weekDates.indexOf(date);
          return (
            <div key={i} className="flex flex-col items-center justify-center py-2 gap-0.5"
              style={{ borderBottom: "1px solid var(--border-soft)", borderLeft: "1px solid var(--border-soft)" }}>
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest"
                style={{ color: "var(--foreground-dim)" }}>{DAYS_SHORT[dayIdx]}</span>
              <span className="text-[15px] font-bold leading-none"
                style={{ color: isToday ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
            </div>
          );
        })}
        {/* Service rows */}
        {serviceRows.map(({ key, label, color, time }, rowIdx) => (
          <Fragment key={key}>
            <div className="flex flex-col justify-center gap-0.5 px-1.5 py-2"
              style={{ borderRight: "1px solid var(--border-soft)", borderBottom: rowIdx < serviceRows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="text-[9px] font-black tracking-wider truncate" style={{ color }}>{label}</span>
              <span className="text-[8px] font-mono leading-snug" style={{ color: "var(--foreground-dim)" }}>{time}</span>
            </div>
            {activeDates.map((date, i) => {
              const cell = getShifts(date, key);
              return (
                <div key={`${key}-${i}`} className="flex flex-col gap-0.5 p-1"
                  style={{ minHeight: 60, borderLeft: "1px solid var(--border-soft)", borderBottom: rowIdx < serviceRows.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "var(--background-elev)" : "var(--background-soft)" }}>
                  {cell.map(s => (
                    <ShiftChip key={s.id} shift={s} showStatus={showStatus}
                      onClick={onShiftClick && s.confirmation_status === "modified" ? () => onShiftClick(s) : undefined} />
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DRAFT VIEW
══════════════════════════════════════════════════════════════════════════════ */

function DraftView({ shifts, weekDates, employees, onValidate, onRegenerate, validating, onReassign, canRegenerate = true }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  employees: EmployeeInfo[];
  onValidate: () => void;
  onRegenerate: () => void;
  validating: boolean;
  onReassign: (shift: PlanningShift) => void;
  canRegenerate?: boolean;
}) {
  const modified = shifts.filter(s => s.confirmation_status === "modified");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          {canRegenerate
            ? `Planning généré — ${shifts.length} shift${shifts.length > 1 ? "s" : ""} · Vérifiez puis validez`
            : `Planning manuel — ${shifts.length} shift${shifts.length > 1 ? "s" : ""} · Vérifiez puis publiez`}
        </p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <WeekGrid shifts={shifts} weekDates={weekDates} showStatus onShiftClick={onReassign} />
      </div>
      {modified.length > 0 && (
        <div className="px-3 py-2.5 rounded-xl text-[12px]"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
          {modified.length} shift{modified.length > 1 ? "s" : ""} refusé{modified.length > 1 ? "s" : ""} — cliquez dessus pour réassigner
        </div>
      )}
      <div className="flex gap-3 pt-2">
        {canRegenerate && (
          <button onClick={onRegenerate}
            className="flex-1 py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
            style={{ border: "1px solid var(--border)", color: "var(--foreground-dim)", background: "transparent" }}>
            <RefreshCw size={14} />Régénérer
          </button>
        )}
        <button onClick={onValidate} disabled={validating || shifts.length === 0}
          className={`py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 ${canRegenerate ? "flex-1" : "w-full"}`}
          style={{ background: "var(--accent)", color: "#fff", opacity: validating ? 0.6 : 1 }}>
          {validating ? "Publication…" : <><Check size={14} />Publier le planning</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PUBLISHED VIEW
══════════════════════════════════════════════════════════════════════════════ */

function PublishedView({ shifts, weekDates, employees, onReassign, onCancel }: {
  shifts: PlanningShift[];
  weekDates: Date[];
  employees: EmployeeInfo[];
  onReassign: (shift: PlanningShift) => void;
  onCancel: () => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const confirmed = shifts.filter(s => s.confirmation_status === "confirmed").length;
  const pending   = shifts.filter(s => s.confirmation_status === "pending").length;
  const modified  = shifts.filter(s => s.confirmation_status === "modified").length;

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

      {!confirmCancel ? (
        <button
          onClick={() => setConfirmCancel(true)}
          className="w-full py-2.5 rounded-xl text-[13px] font-medium"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
        >
          Annuler le planning
        </button>
      ) : (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-[13px] font-medium" style={{ color: "#EF4444" }}>Annuler le planning ?</p>
          <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Le planning sera dépublié. Les employés ne le verront plus. Tu pourras le modifier et le republier.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 py-2 rounded-lg text-[13px]"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
            >
              Annuler
            </button>
            <button
              onClick={async () => { setCancelling(true); await onCancel(); setCancelling(false); setConfirmCancel(false); }}
              disabled={cancelling}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
              style={{ background: "#EF4444", color: "#fff", opacity: cancelling ? 0.6 : 1 }}
            >
              {cancelling ? "Dépublication…" : "Confirmer"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <WeekGrid shifts={shifts} weekDates={weekDates} showStatus onShiftClick={onReassign} />
      </div>

      {modified > 0 && (
        <div className="px-3 py-2.5 rounded-xl text-[12px]"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
          {modified} shift{modified > 1 ? "s" : ""} refusé{modified > 1 ? "s" : ""} — cliquez dessus pour réassigner
        </div>
      )}

      <div className="rounded-2xl p-4 space-y-2" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--foreground-dim)" }}>Confirmations</p>
        {byEmployee.map(({ name, shifts: emp }) => {
          const anyModified  = emp.some(s => s.confirmation_status === "modified");
          const allConfirmed = emp.every(s => s.confirmation_status === "confirmed");
          const statusColor  = anyModified ? "#EF4444" : allConfirmed ? "#10B981" : "#F59E0B";
          const statusLabel  = anyModified ? "Refusé" : allConfirmed ? "Confirmé" : "En attente";
          const modShifts    = emp.filter(s => s.confirmation_status === "modified");
          return (
            <div key={name} className="px-3 py-2.5 rounded-xl"
              style={{ background: "var(--background)", border: "1px solid var(--border-soft)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                  {statusLabel}
                </span>
              </div>
              {anyModified && modShifts.map(shift => (
                <button key={shift.id}
                  onClick={() => onReassign(shift)}
                  className="mt-1.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                  <span>{shift.service} · {new Date(shift.shift_date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</span>
                  <span>Réassigner →</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   REASSIGN POPUP
══════════════════════════════════════════════════════════════════════════════ */

function ReassignPopup({ shift, employees, planningShifts, reassigning, onReassign, onClose }: {
  shift: PlanningShift;
  employees: EmployeeInfo[];
  planningShifts: PlanningShift[];
  reassigning: boolean;
  onReassign: (shiftId: string, userId: string) => void;
  onClose: () => void;
}) {
  const dayLabel = new Date(shift.shift_date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const currentEmp = employees.find(e => e.id === shift.user_id);

  // Count shifts per employee this week
  const shiftCountByEmp = planningShifts.reduce((acc, s) => {
    acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const otherEmployees = employees.filter(e => e.id !== shift.user_id);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>Réassigner ce shift</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
              {shift.service} · {dayLabel}
            </p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--foreground-dim)" }}>
              {shift.start_time.slice(0, 5)} → {shift.end_time.slice(0, 5)}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        {currentEmp && (
          <div className="mb-3 px-3 py-2 rounded-lg text-[12px]"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
            <span className="font-medium">{currentEmp.name}</span> a refusé ce shift
          </div>
        )}

        <p className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--foreground-dim)" }}>
          Choisir un remplaçant
        </p>

        <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
          {otherEmployees.length === 0 && (
            <p className="text-[12px] text-center py-4" style={{ color: "var(--foreground-dim)" }}>Aucun autre employé disponible</p>
          )}
          {otherEmployees.map(emp => {
            const count = shiftCountByEmp[emp.id] ?? 0;
            const statusInfo = STAFF_STATUSES[emp.status as StaffStatus];
            const color = statusInfo?.color ?? "#A1A1AA";
            return (
              <button
                key={emp.id}
                onClick={() => onReassign(shift.id, emp.id)}
                disabled={reassigning}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-opacity hover:opacity-80"
                style={{ background: "var(--background)", border: "1px solid var(--border)", opacity: reassigning ? 0.5 : 1 }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{statusInfo?.label ?? emp.status}</p>
                </div>
                <span className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>
                  {count} shift{count !== 1 ? "s" : ""}
                </span>
                <Users size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-[13px]"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MANUAL PLANNING GRID  — style Combo
   Rows = employees, Columns = 7 days, Cells = shift blocks colorés
══════════════════════════════════════════════════════════════════════════════ */

const SVC_PALETTES = [
  { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" },
  { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  { bg: "#FED7AA", text: "#C2410C", border: "#FDBA74" },
  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
];

function svcColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SVC_PALETTES[h % SVC_PALETTES.length];
}

function calcWeekHours(shifts: PlanningShift[], userId: string): number {
  return shifts
    .filter(s => s.user_id === userId)
    .reduce((acc, s) => {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      return acc + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);
}

function ManualPlanningGrid({
  weekDates, services, shifts, employees, adding,
  onServicesChange, onAddShift, onDeleteShift,
}: {
  weekDates: Date[];
  services: ManualService[];
  shifts: PlanningShift[];
  employees: EmployeeInfo[];
  adding: boolean;
  onServicesChange: (services: ManualService[]) => Promise<void>;
  onAddShift: (dateStr: string, userId: string, service: string, start: string, end: string) => Promise<void>;
  onDeleteShift: (shiftId: string) => Promise<void>;
}) {
  const [formCell,      setFormCell]      = useState<{ userId: string; dateStr: string } | null>(null);
  const [formSvcId,     setFormSvcId]     = useState(services[0]?.id ?? "");
  const [formStart,     setFormStart]     = useState(services[0]?.start ?? "11:30");
  const [formEnd,       setFormEnd]       = useState(services[0]?.end   ?? "15:30");
  const [selectedShift, setSelectedShift] = useState<PlanningShift | null>(null);
  const [editingSvc,    setEditingSvc]    = useState(false);
  const [newSvcName,    setNewSvcName]    = useState("");
  const [newSvcStart,   setNewSvcStart]   = useState("11:30");
  const [newSvcEnd,     setNewSvcEnd]     = useState("15:30");

  function openForm(userId: string, dateStr: string) {
    setFormCell({ userId, dateStr });
    const svc = services.find(s => s.id === formSvcId) ?? services[0];
    if (svc) { setFormStart(svc.start); setFormEnd(svc.end); }
  }

  function onFormSvcChange(id: string) {
    setFormSvcId(id);
    const svc = services.find(s => s.id === id);
    if (svc) { setFormStart(svc.start); setFormEnd(svc.end); }
  }

  async function submitShift() {
    if (!formCell) return;
    const svc = services.find(s => s.id === formSvcId);
    if (!svc) return;
    await onAddShift(formCell.dateStr, formCell.userId, svc.name, formStart, formEnd);
    setFormCell(null);
  }

  function addService() {
    if (!newSvcName.trim()) return;
    const svc: ManualService = { id: `svc_${Date.now()}`, name: newSvcName.trim(), start: newSvcStart, end: newSvcEnd };
    onServicesChange([...services, svc]);
    setNewSvcName(""); setEditingSvc(false);
  }

  const todayStr = toDateStr(new Date());

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 gap-3"
        style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          {services.map(svc => {
            const c = svcColor(svc.name);
            return (
              <div key={svc.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                <span>{svc.name}</span>
                <span className="opacity-60 font-mono text-[9px]">{svc.start}–{svc.end}</span>
                <button onClick={() => onServicesChange(services.filter(s => s.id !== svc.id))}
                  className="ml-0.5" style={{ opacity: 0.5 }}><X size={10} /></button>
              </div>
            );
          })}
          <button onClick={() => setEditingSvc(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground-dim)" }}>
            <Plus size={11} />Étiquette
          </button>
        </div>
        <p className="text-[11px] flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
          {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── New étiquette form ── */}
      {editingSvc && (
        <div className="px-4 py-3 flex flex-wrap gap-2 items-end"
          style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
          <input type="text" value={newSvcName} onChange={e => setNewSvcName(e.target.value)}
            placeholder="Nom (ex: Midi, Soir, Bar…)" autoFocus
            onKeyDown={e => e.key === "Enter" && addService()}
            className="text-[12px] rounded-lg px-2.5 py-1.5 flex-1 min-w-[140px]"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <input type="time" value={newSvcStart} onChange={e => setNewSvcStart(e.target.value)}
            className="text-[11px] font-mono rounded-lg px-2 py-1.5 w-[90px]"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <span className="text-[11px] self-center" style={{ color: "var(--foreground-dim)" }}>→</span>
          <input type="time" value={newSvcEnd} onChange={e => setNewSvcEnd(e.target.value)}
            className="text-[11px] font-mono rounded-lg px-2 py-1.5 w-[90px]"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <button onClick={addService} disabled={!newSvcName.trim()}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background: "var(--accent)", color: "#fff", opacity: !newSvcName.trim() ? 0.5 : 1 }}>
            Ajouter
          </button>
          <button onClick={() => setEditingSvc(false)}
            className="px-3 py-1.5 rounded-lg text-[12px]"
            style={{ background: "var(--border)", color: "var(--foreground-dim)" }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Compact grid — no horizontal scroll ── */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr style={{ background: "var(--background-elev)" }}>
            <th style={{ width: 56, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} />
            {weekDates.map((date, idx) => {
              const ds = toDateStr(date);
              const isToday = ds === todayStr;
              return (
                <th key={ds} className="py-2 text-center"
                  style={{
                    background: isToday ? "rgba(6,182,212,0.08)" : "var(--background-elev)",
                    borderRight: idx < 6 ? "1px solid var(--border-soft)" : "none",
                    borderBottom: "1px solid var(--border)",
                  }}>
                  <span className="block text-[8px] font-mono uppercase tracking-widest"
                    style={{ color: "var(--foreground-dim)" }}>{DAYS_SHORT[idx]}</span>
                  <span className="block text-[13px] font-bold leading-tight"
                    style={{ color: isToday ? "var(--accent)" : "var(--foreground)" }}>{date.getDate()}</span>
                  {isToday && <span className="block w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: "var(--accent)" }} />}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-[12px]"
                style={{ color: "var(--foreground-dim)", background: "var(--background)" }}>
                Aucun employé dans l'équipe.
              </td>
            </tr>
          )}
          {employees.map((emp, empIdx) => {
            const weekH = calcWeekHours(shifts, emp.id);
            const statusColor = STAFF_STATUSES[emp.status as StaffStatus]?.color ?? "#A1A1AA";
            const initials = (emp.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const firstName = (emp.name ?? "?").split(" ")[0].slice(0, 6);
            return (
              <tr key={emp.id} style={{ background: empIdx % 2 === 0 ? "var(--background)" : "rgba(0,0,0,0.015)" }}>

                {/* Compact employee cell */}
                <td className="py-2 px-1"
                  style={{ borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border-soft)", verticalAlign: "middle", width: 56 }}>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${statusColor}22`, color: statusColor }}>
                      {initials}
                    </div>
                    <p className="text-[8px] font-medium leading-tight text-center truncate w-full px-0.5"
                      style={{ color: "var(--foreground)" }}>{firstName}</p>
                    <p className="text-[7px] font-mono leading-tight" style={{ color: "var(--foreground-dim)" }}>
                      {weekH.toFixed(0)}h
                    </p>
                  </div>
                </td>

                {/* Day cells — dots only, tap to add/view */}
                {weekDates.map((date, dayIdx) => {
                  const ds = toDateStr(date);
                  const cellShifts = shifts.filter(s => s.user_id === emp.id && s.shift_date === ds);
                  const isToday = ds === todayStr;
                  return (
                    <td key={ds}
                      onClick={() => openForm(emp.id, ds)}
                      style={{
                        borderRight: dayIdx < 6 ? "1px solid var(--border-soft)" : "none",
                        borderBottom: "1px solid var(--border-soft)",
                        background: isToday ? "rgba(6,182,212,0.04)" : "transparent",
                        cursor: "pointer",
                        verticalAlign: "middle",
                      }}>
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[48px] py-1.5">
                        {cellShifts.length > 0 ? (
                          <>
                            {cellShifts.map(shift => {
                              const c = svcColor(shift.service ?? "");
                              return (
                                <button key={shift.id}
                                  onClick={e => { e.stopPropagation(); setSelectedShift(shift); }}
                                  className="w-3 h-3 rounded-full flex-shrink-0 active:scale-110 transition-transform"
                                  style={{ background: c.text }} />
                              );
                            })}
                            <div className="w-3.5 h-3.5 flex items-center justify-center rounded-full"
                              style={{ border: "1px dashed var(--border)" }}>
                              <Plus size={7} style={{ color: "var(--foreground-dim)" }} />
                            </div>
                          </>
                        ) : (
                          <Plus size={10} style={{ color: "var(--border)" }} />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Add shift bottom sheet ── */}
      {formCell && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setFormCell(null); }}>
          <div className="w-full max-w-lg rounded-t-2xl p-5 space-y-4"
            style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {employees.find(e => e.id === formCell.userId)?.name ?? "Employé"}
                </p>
                <p className="text-[12px] capitalize mt-0.5" style={{ color: "var(--foreground-dim)" }}>
                  {fmtDateFull(formCell.dateStr)}
                </p>
              </div>
              <button onClick={() => setFormCell(null)} className="p-1">
                <X size={18} style={{ color: "var(--foreground-dim)" }} />
              </button>
            </div>

            {services.length > 0 ? (
              <select value={formSvcId} onChange={e => onFormSvcChange(e.target.value)}
                className="w-full text-[13px] rounded-xl px-3 py-2.5"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} · {s.start}–{s.end}</option>)}
              </select>
            ) : (
              <p className="text-[13px] text-center py-2" style={{ color: "var(--foreground-dim)" }}>
                Ajoutez d'abord une étiquette de service
              </p>
            )}

            <div className="flex items-center gap-3">
              <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)}
                className="flex-1 text-[14px] font-mono rounded-xl px-3 py-2.5 text-center"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <span className="text-[16px]" style={{ color: "var(--foreground-dim)" }}>→</span>
              <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                className="flex-1 text-[14px] font-mono rounded-xl px-3 py-2.5 text-center"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>

            <div className="flex gap-2 pb-safe">
              <button onClick={() => setFormCell(null)}
                className="flex-1 py-3 rounded-xl text-[13px] font-medium"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
                Annuler
              </button>
              <button onClick={submitShift} disabled={adding || services.length === 0}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold"
                style={{ background: "var(--accent)", color: "#fff", opacity: adding || services.length === 0 ? 0.5 : 1 }}>
                {adding ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift detail bottom sheet ── */}
      {selectedShift && (() => {
        const c = svcColor(selectedShift.service ?? "");
        const empName = employees.find(e => e.id === selectedShift.user_id)?.name ?? selectedShift.first_name ?? "Employé";
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedShift(null); }}>
            <div className="w-full max-w-lg rounded-t-2xl p-5 space-y-4"
              style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.text }} />
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{selectedShift.service}</p>
                    <p className="text-[12px] font-mono mt-0.5" style={{ color: "var(--foreground-dim)" }}>
                      {selectedShift.start_time.slice(0, 5)} → {selectedShift.end_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedShift(null)} className="p-1">
                  <X size={18} style={{ color: "var(--foreground-dim)" }} />
                </button>
              </div>
              <p className="text-[12px] capitalize" style={{ color: "var(--foreground-dim)" }}>
                {empName} · {fmtDateFull(selectedShift.shift_date)}
              </p>
              <button
                onClick={async () => { await onDeleteShift(selectedShift.id); setSelectedShift(null); }}
                className="w-full py-3 rounded-xl text-[13px] font-semibold pb-safe"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                Supprimer ce shift
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
