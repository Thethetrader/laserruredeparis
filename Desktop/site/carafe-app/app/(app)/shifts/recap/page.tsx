"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import {
  Shift, monthLabel, getDaysInMonth, toDateStr,
  calcTotalHours, calcTotalTips, formatHours, formatTips,
  changePercent, monthlyContractHours, ShiftProfile,
} from "@/lib/shifts";

function StatCard({ label, value, change, accent }: { label: string; value: string; change?: number | null; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: accent ? "rgba(6,182,212,0.08)" : "var(--background-elev)", border: `1px solid ${accent ? "rgba(6,182,212,0.2)" : "var(--border)"}` }}>
      <p className="text-[22px] font-bold mb-0.5" style={{ color: accent ? "var(--accent)" : "var(--foreground)" }}>{value}</p>
      <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{label}</p>
      {change !== undefined && change !== null && (
        <div className="flex items-center gap-1 mt-1.5">
          {change >= 0 ? <TrendingUp size={11} color="#10b981" /> : <TrendingDown size={11} color="#ef4444" />}
          <span className="text-[11px]" style={{ color: change >= 0 ? "var(--success)" : "var(--danger)" }}>
            {change >= 0 ? "+" : ""}{change}% vs mois préc.
          </span>
        </div>
      )}
    </div>
  );
}

function TipsBarChart({ shifts, year, month }: { shifts: Shift[]; year: number; month: number }) {
  const days = getDaysInMonth(year, month);
  const tipsMap = new Map(shifts.map(s => [s.shift_date, s.tips]));
  const maxTips = Math.max(...shifts.map(s => s.tips), 1);

  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--foreground-dim)" }}>Pourboires par jour</p>
      <div className="flex items-end gap-0.5" style={{ height: 64 }}>
        {days.map(d => {
          const str = toDateStr(d);
          const tips = tipsMap.get(str) ?? 0;
          const pct = tips / maxTips;
          return (
            <div key={str} className="flex-1 relative group" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-sm transition-all"
                style={{
                  height: tips > 0 ? `${Math.max(pct * 100, 8)}%` : "4px",
                  background: tips > 0 ? (pct > 0.8 ? "var(--accent)" : "rgba(6,182,212,0.4)") : "var(--background-elev)",
                }}
              />
              {tips > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  {d.getDate()}/{d.getMonth()+1} — {formatTips(tips)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>1</span>
        <span className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>{days.length}</span>
      </div>
    </div>
  );
}

export default function RecapPage() {
  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [shifts, setShifts]   = useState<Shift[]>([]);
  const [prevShifts, setPrev] = useState<Shift[]>([]);
  const [ytdTips, setYtd]     = useState(0);
  const [profile, setProfile] = useState<ShiftProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const from = `${y}-${String(m+1).padStart(2,"0")}-01`;
    const lastDay = new Date(y, m+1, 0).getDate();
    const to = `${y}-${String(m+1).padStart(2,"0")}-${lastDay}`;

    const prevDate = new Date(y, m - 1, 1);
    const pFrom = toDateStr(prevDate).slice(0, 7) + "-01";
    const pLastDay = new Date(prevDate.getFullYear(), prevDate.getMonth()+1, 0).getDate();
    const pTo = toDateStr(prevDate).slice(0, 7) + `-${pLastDay}`;

    const [cur, prev, ytd, prof] = await Promise.all([
      supabase.from("shifts").select("*").eq("user_id", user.id).gte("shift_date", from).lte("shift_date", to),
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

  useEffect(() => { load(year, month); }, [year, month, load]);

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (!isCurrentMonth) { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }
  }

  const totalHours  = calcTotalHours(shifts);
  const totalTips   = calcTotalTips(shifts);
  const prevHours   = calcTotalHours(prevShifts);
  const prevTips    = calcTotalTips(prevShifts);
  const contractHrs = profile ? monthlyContractHours(profile.weekly_hours) : 0;
  const pctWorked   = contractHrs > 0 ? Math.min(Math.round((totalHours / contractHrs) * 100), 100) : 0;
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="px-4 py-6 pb-32 max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <MonoLabel size="xs">Récap</MonoLabel>
        <a href="/shifts" className="text-[11px]" style={{ color: "var(--accent)" }}>← Calendrier</a>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button onClick={prevMonth} className="p-1.5 rounded-base" style={{ color: "var(--foreground-dim)" }}><ChevronLeft size={18} /></button>
        <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{monthLabel(year, month)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-base" style={{ color: isCurrentMonth ? "var(--foreground-dim)" : "var(--foreground-dim)", opacity: isCurrentMonth ? 0.3 : 1 }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />)}</div>
      ) : (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Heures" value={formatHours(totalHours)} change={changePercent(totalHours, prevHours)} />
            <StatCard label="Pourboires" value={formatTips(totalTips)} change={changePercent(totalTips, prevTips)} accent />
            <StatCard label="Services" value={String(shifts.length)} change={changePercent(shifts.length, prevShifts.length)} />
            <StatCard label="Moy. / service" value={shifts.length > 0 ? formatTips(totalTips / shifts.length) : "—"} />
          </div>

          {/* Contrat vs réel */}
          {profile && contractHrs > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Contrat ({profile.contract_type ?? "—"})</p>
                <p className="text-[12px] font-mono" style={{ color: "var(--foreground-dim)" }}>
                  {formatHours(totalHours)} / {formatHours(contractHrs)}
                </p>
              </div>
              <div className="rounded-full overflow-hidden mb-1" style={{ height: 6, background: "var(--background-soft)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctWorked}%`, background: pctWorked >= 100 ? "var(--success)" : "var(--accent)" }} />
              </div>
              <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{pctWorked}% du mensuel légal</p>
            </div>
          )}

          {/* Bar chart */}
          {shifts.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <TipsBarChart shifts={shifts} year={year} month={month} />
            </div>
          )}

          {/* YTD */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <Trophy size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Total pourboires {year}</p>
              <p className="text-[18px] font-bold" style={{ color: "var(--foreground)" }}>{formatTips(ytdTips)}</p>
            </div>
          </div>

          {/* Empty state */}
          {shifts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun shift ce mois.</p>
              <a href="/shifts" className="text-[12px] mt-1 block" style={{ color: "var(--accent)" }}>Ajouter des shifts →</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
