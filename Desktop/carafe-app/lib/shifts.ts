export type ContractType = "CDI" | "CDD" | "Extra" | "Apprenti";

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
