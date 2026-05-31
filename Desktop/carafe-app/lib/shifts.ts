export type ContractType = "CDI" | "CDD" | "Extra" | "Apprenti";

// ── Staff statuses ────────────────────────────────────────────────────────────

export type StaffStatus =
  | "chef_de_rang" | "serveur" | "cuisinier" | "commis"
  | "barman" | "plongeur" | "responsable" | "autre";

export const STAFF_STATUSES: Record<StaffStatus, { label: string; color: string; defaultCoef: number }> = {
  chef_de_rang: { label: "Chef de rang", color: "#06B6D4", defaultCoef: 1.0 },
  serveur:      { label: "Serveur",       color: "#10B981", defaultCoef: 1.0 },
  cuisinier:    { label: "Cuisinier",     color: "#F59E0B", defaultCoef: 0.8 },
  commis:       { label: "Commis",        color: "#F97316", defaultCoef: 0.5 },
  barman:       { label: "Barman",        color: "#8B5CF6", defaultCoef: 0.9 },
  plongeur:     { label: "Plongeur",      color: "#6B7280", defaultCoef: 0.4 },
  responsable:  { label: "Responsable",   color: "#EF4444", defaultCoef: 1.2 },
  autre:        { label: "Autre",         color: "#A1A1AA", defaultCoef: 0.7 },
};

export type TipMode = "self" | "dispatch";

export interface TipSettings {
  mode: TipMode;
  coefficients: Record<StaffStatus, number>;
  colors: Record<StaffStatus, string>;
  labels: Record<StaffStatus, string>;
  hidden: StaffStatus[];
}

export const DEFAULT_TIP_SETTINGS: TipSettings = {
  mode: "self",
  coefficients: Object.fromEntries(
    (Object.keys(STAFF_STATUSES) as StaffStatus[]).map(k => [k, STAFF_STATUSES[k].defaultCoef])
  ) as Record<StaffStatus, number>,
  colors: Object.fromEntries(
    (Object.keys(STAFF_STATUSES) as StaffStatus[]).map(k => [k, STAFF_STATUSES[k].color])
  ) as Record<StaffStatus, string>,
  labels: Object.fromEntries(
    (Object.keys(STAFF_STATUSES) as StaffStatus[]).map(k => [k, STAFF_STATUSES[k].label])
  ) as Record<StaffStatus, string>,
  hidden: [],
};

export function parseTipSettings(raw: unknown): TipSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_TIP_SETTINGS;
  const r = raw as Partial<TipSettings>;
  return {
    mode: r.mode === "dispatch" ? "dispatch" : "self",
    coefficients: { ...DEFAULT_TIP_SETTINGS.coefficients, ...(r.coefficients ?? {}) },
    colors: { ...DEFAULT_TIP_SETTINGS.colors, ...(r.colors ?? {}) },
    labels: { ...DEFAULT_TIP_SETTINGS.labels, ...(r.labels ?? {}) },
    hidden: Array.isArray(r.hidden) ? r.hidden as StaffStatus[] : [],
  };
}

export function getPostLabel(status: StaffStatus, tipSettings: TipSettings): string {
  return tipSettings.labels[status] ?? STAFF_STATUSES[status].label;
}

export function isPostHidden(status: StaffStatus, tipSettings: TipSettings): boolean {
  return tipSettings.hidden.includes(status);
}

export function calcTipDistribution(
  staff: Array<{ userId: string; hours: number; status: StaffStatus | null }>,
  totalTips: number,
  coefficients: Record<StaffStatus, number>
): Record<string, number> {
  const weighted = staff.map(s => ({
    userId: s.userId,
    w: s.hours * (s.status ? (coefficients[s.status] ?? 1.0) : 1.0),
  }));
  const totalW = weighted.reduce((sum, x) => sum + x.w, 0);
  if (totalW === 0) return {};
  const result: Record<string, number> = {};
  for (const { userId, w } of weighted) {
    result[userId] = Math.round((w / totalW) * totalTips * 100) / 100;
  }
  return result;
}

export interface TeamShift extends Shift {
  first_name: string | null;
  staff_status: StaffStatus | null;
  tips_enabled: boolean;
}

export interface Shift {
  id: string;
  user_id: string;
  establishment_id: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  hours_worked: number;
  tips: number;
  start_time_2: string | null;
  end_time_2: string | null;
  hours_worked_2: number;
  tips_2: number;
  note: string | null;
  created_at: string;
}

export interface ShiftProfile {
  contract_type: ContractType | null;
  weekly_hours: number;
  weekly_rest_days: number;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function isoWeekday(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ── Calculations ─────────────────────────────────────────────────────────────

export function calcTotalHours(shifts: Shift[]): number {
  return shifts.reduce((s, sh) => s + (sh.hours_worked ?? 0) + (sh.hours_worked_2 ?? 0), 0);
}

export function calcTotalTips(shifts: Shift[]): number {
  return shifts.reduce((s, sh) => s + (sh.tips ?? 0) + (sh.tips_2 ?? 0), 0);
}

export function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h${String(mins).padStart(2, "0")}` : `${hours}h`;
}

export function formatTips(amount: number): string {
  return amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + "€";
}

export function changePercent(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function monthlyContractHours(weeklyHours: number): number {
  return weeklyHours * 52 / 12;
}

export function calcNetHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const raw = (eh * 60 + em) - (sh * 60 + sm);
  if (raw <= 0) return 0;
  const pause = raw > 360 ? 30 : 0;
  return (raw - pause) / 60;
}

export function shiftsToMap(shifts: Shift[]): Map<string, Shift> {
  return new Map(shifts.map(s => [s.shift_date, s]));
}

// ── CA (Chiffre d'Affaires) ──────────────────────────────────────────────────

export type CAMode = "disabled" | "per_service" | "per_day" | "per_month";

export interface CASettings {
  mode: CAMode;
  staff_can_enter: boolean;
}

export const DEFAULT_CA_SETTINGS: CASettings = {
  mode: "disabled",
  staff_can_enter: false,
};

export function parseCASettings(raw: unknown): CASettings {
  if (!raw || typeof raw !== "object") return DEFAULT_CA_SETTINGS;
  const r = raw as Partial<CASettings>;
  const validModes: CAMode[] = ["disabled", "per_service", "per_day", "per_month"];
  return {
    mode: validModes.includes(r.mode as CAMode) ? (r.mode as CAMode) : "disabled",
    staff_can_enter: r.staff_can_enter === true,
  };
}

export function formatCA(amount: number): string {
  return amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + "€";
}
