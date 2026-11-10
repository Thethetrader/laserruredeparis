"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Calculator, Download, ChevronDown, ChevronUp, Clock, Euro, TrendingUp } from "lucide-react";
import { formatHours, formatTips } from "@/lib/shifts";

/* ── French labor law ────────────────────────────────────────────────────────
  Overtime thresholds per week:
    - 36h–43h : +25% (maj1)
    - 43h+    : +50% (maj2)
  Monthly legal hours = weeklyHours × 52 / 12
────────────────────────────────────────────────────────────────────────────── */

function calcOvertimePerWeek(
  weeklyWorked: number,
  weeklyContract: number
): { normal: number; maj25: number; maj50: number } {
  if (weeklyWorked <= weeklyContract) {
    return { normal: weeklyWorked, maj25: 0, maj50: 0 };
  }
  const over = weeklyWorked - weeklyContract;
  // First 8h over contract = +25%, beyond = +50%
  const maj25 = Math.min(over, 8);
  const maj50 = Math.max(0, over - 8);
  return { normal: weeklyContract, maj25, maj50 };
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const thu = new Date(d);
  thu.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  const y = thu.getFullYear();
  const w = Math.ceil(((thu.getTime() - new Date(y, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

interface EmployeeResult {
  userId: string;
  name: string;
  jobTitle: string;
  contractType: string;
  weeklyHours: number;
  totalHours: number;
  normalHours: number;
  maj25Hours: number;
  maj50Hours: number;
  totalTips: number;
  tipsMidday: number;
  tipsEvening: number;
  shifts: number;
}

export default function PayrollPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);
  const supabase = createClient();

  async function calculate() {
    setLoading(true);
    setCalculated(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("establishment_id").eq("profile_id", user.id).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: memberData } = await _mq.limit(1).maybeSingle();
    if (!memberData && _ceid && _re.test(_ceid)) ({ data: memberData } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", user.id).eq("is_active", true).limit(1).maybeSingle());
    if (!memberData) { setLoading(false); return; }

    const estId = memberData.establishment_id;

    // Fetch all active employees
    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, job_title, profiles(first_name, last_name)")
      .eq("establishment_id", estId)
      .eq("is_active", true)
      .eq("role", "employee");

    // Fetch all profiles (contract info)
    const userIds = (members ?? []).map((m: { profile_id: string }) => m.profile_id);

    const [{ data: profiles }, { data: shiftsData }] = await Promise.all([
      supabase.from("profiles")
        .select("id, contract_type, weekly_hours")
        .in("id", userIds),
      supabase.from("shifts")
        .select("user_id, shift_date, hours_worked, hours_worked_2, tips, tips_2")
        .eq("establishment_id", estId)
        .in("user_id", userIds)
        .gte("shift_date", from)
        .lte("shift_date", to),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: { id: string; contract_type: string | null; weekly_hours: number }) => [p.id, p]));

    const res: EmployeeResult[] = [];

    for (const member of (members ?? [])) {
      const m = member as { profile_id: string; job_title: string | null; profiles: { first_name: string | null; last_name: string | null } | null };
      const uid = m.profile_id;
      const prof = profileMap.get(uid);
      const weeklyContract = prof?.weekly_hours ?? 35;
      const contractType = prof?.contract_type ?? "—";
      const empShifts = (shiftsData ?? []).filter((s: { user_id: string }) => s.user_id === uid) as Array<{
        user_id: string; shift_date: string;
        hours_worked: number; hours_worked_2: number;
        tips: number; tips_2: number;
      }>;

      // Group by ISO week for overtime calculation
      const weekMap: Map<string, number> = new Map();
      let tipsMidday = 0;
      let tipsEvening = 0;

      for (const s of empShifts) {
        const wk = getISOWeek(s.shift_date);
        const h = (s.hours_worked ?? 0) + (s.hours_worked_2 ?? 0);
        weekMap.set(wk, (weekMap.get(wk) ?? 0) + h);
        tipsMidday += s.tips ?? 0;
        tipsEvening += s.tips_2 ?? 0;
      }

      let normalHours = 0;
      let maj25Hours = 0;
      let maj50Hours = 0;

      for (const [, weeklyWorked] of weekMap) {
        const ot = calcOvertimePerWeek(weeklyWorked, weeklyContract);
        normalHours += ot.normal;
        maj25Hours += ot.maj25;
        maj50Hours += ot.maj50;
      }

      const totalHours = normalHours + maj25Hours + maj50Hours;
      const prof2 = m.profiles;
      const name = [prof2?.first_name, prof2?.last_name].filter(Boolean).join(" ") || "—";

      res.push({
        userId: uid,
        name,
        jobTitle: m.job_title ?? "—",
        contractType,
        weeklyHours: weeklyContract,
        totalHours,
        normalHours,
        maj25Hours,
        maj50Hours,
        totalTips: tipsMidday + tipsEvening,
        tipsMidday,
        tipsEvening,
        shifts: empShifts.length,
      });
    }

    // Sort by name
    res.sort((a, b) => a.name.localeCompare(b.name));
    setResults(res);
    setCalculated(true);
    setLoading(false);
  }

  function printResults() {
    const html = `
      <html><head><title>Pré-paie ${from} → ${to}</title>
      <style>
        body { font-family: system-ui; font-size: 12px; color: #111; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        p { color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 6px 8px; background: #f4f4f5; border-bottom: 2px solid #e4e4e7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 8px 8px; border-bottom: 1px solid #e4e4e7; }
        .num { text-align: right; font-family: monospace; }
        .ot { color: #f59e0b; font-weight: 600; }
        .tips { color: #06b6d4; font-weight: 600; }
        @media print { body { margin: 20px; } }
      </style></head>
      <body>
        <h1>Récapitulatif pré-paie</h1>
        <p>Période : ${new Date(from).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} → ${new Date(to).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        <table>
          <thead><tr>
            <th>Employé</th><th>Contrat</th><th class="num">Heures normales</th>
            <th class="num">H. sup +25%</th><th class="num">H. sup +50%</th>
            <th class="num">Total heures</th><th class="num">Tips midi</th><th class="num">Tips soir</th><th class="num">Total tips</th>
          </tr></thead>
          <tbody>
            ${results.map(r => `<tr>
              <td><strong>${r.name}</strong><br><small>${r.jobTitle}</small></td>
              <td>${r.contractType} ${r.weeklyHours}h</td>
              <td class="num">${formatHours(r.normalHours)}</td>
              <td class="num ot">${r.maj25Hours > 0 ? formatHours(r.maj25Hours) : "—"}</td>
              <td class="num ot">${r.maj50Hours > 0 ? formatHours(r.maj50Hours) : "—"}</td>
              <td class="num"><strong>${formatHours(r.totalHours)}</strong></td>
              <td class="num">${formatTips(r.tipsMidday)}</td>
              <td class="num">${formatTips(r.tipsEvening)}</td>
              <td class="num tips"><strong>${formatTips(r.totalTips)}</strong></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </body></html>
    `;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  const totalHours   = results.reduce((s, r) => s + r.totalHours, 0);
  const totalOT25    = results.reduce((s, r) => s + r.maj25Hours, 0);
  const totalOT50    = results.reduce((s, r) => s + r.maj50Hours, 0);
  const totalTips    = results.reduce((s, r) => s + r.totalTips, 0);

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Pré-paie</MonoLabel>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Récapitulatif équipe</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
          Heures normales, heures sup et pourboires par employé — selon la loi française
        </p>
      </div>

      {/* Date range selector */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--foreground)" }}>Sélectionner la période</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Du</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Au</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Quick selectors */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { label: "Ce mois", fn: () => {
              const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1);
              setFrom(f.toISOString().split("T")[0]); setTo(d.toISOString().split("T")[0]);
            }},
            { label: "Mois dernier", fn: () => {
              const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
              const t = new Date(d.getFullYear(), d.getMonth(), 0);
              setFrom(f.toISOString().split("T")[0]); setTo(t.toISOString().split("T")[0]);
            }},
            { label: "Cette semaine", fn: () => {
              const d = new Date(); const day = d.getDay() || 7;
              const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
              setFrom(mon.toISOString().split("T")[0]); setTo(d.toISOString().split("T")[0]);
            }},
          ].map(q => (
            <button key={q.label} onClick={q.fn}
              className="px-3 py-1.5 rounded-base text-[11px] font-medium"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
              {q.label}
            </button>
          ))}
        </div>

        <button onClick={calculate} disabled={loading}
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: loading ? 0.7 : 1 }}>
          <Calculator size={15} />
          {loading ? "Calcul en cours…" : "Calculer"}
        </button>
      </div>

      {/* Results */}
      {calculated && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total heures", value: formatHours(totalHours), icon: Clock, color: "var(--foreground)" },
              { label: "H. sup +25%", value: formatHours(totalOT25), icon: TrendingUp, color: "#F59E0B" },
              { label: "H. sup +50%", value: formatHours(totalOT50), icon: TrendingUp, color: "#EF4444" },
              { label: "Total tips", value: formatTips(totalTips), icon: Euro, color: "var(--accent)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Employee list */}
          <div className="space-y-2 mb-4">
            {results.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun shift trouvé pour cette période.</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--foreground-dim)" }}>Vérifiez que vos employés ont bien saisi leurs shifts.</p>
              </div>
            ) : results.map(r => (
              <div key={r.userId} className="rounded-xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <button onClick={() => setExpanded(expanded === r.userId ? null : r.userId)}
                  className="w-full px-5 py-4 text-left flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                    style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--accent)" }}>
                    {r.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{r.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{r.jobTitle} · {r.contractType} {r.weeklyHours}h/sem · {r.shifts} service{r.shifts > 1 ? "s" : ""}</p>
                  </div>
                  {/* Quick stats */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-[13px] font-mono font-semibold" style={{ color: "var(--foreground)" }}>{formatHours(r.totalHours)}</p>
                    {r.totalTips > 0 && <p className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>{formatTips(r.totalTips)} tips</p>}
                  </div>
                  {expanded === r.userId ? <ChevronUp size={16} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />}
                </button>

                {expanded === r.userId && (
                  <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3">
                      {[
                        { label: "Heures normales", value: formatHours(r.normalHours), note: `≤ ${r.weeklyHours}h/sem`, color: "var(--foreground)" },
                        { label: "H. sup +25%", value: r.maj25Hours > 0 ? formatHours(r.maj25Hours) : "—", note: "36h–43h (loi)", color: r.maj25Hours > 0 ? "#F59E0B" : "var(--foreground-dim)" },
                        { label: "H. sup +50%", value: r.maj50Hours > 0 ? formatHours(r.maj50Hours) : "—", note: "> 43h (loi)", color: r.maj50Hours > 0 ? "#EF4444" : "var(--foreground-dim)" },
                        { label: "Total", value: formatHours(r.totalHours), note: "sur la période", color: "var(--foreground)" },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg px-3 py-2.5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <p className="text-[16px] font-bold" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{s.note}</p>
                        </div>
                      ))}
                    </div>

                    {r.totalTips > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Tips midi 🌅", value: formatTips(r.tipsMidday) },
                          { label: "Tips soir 🌇", value: formatTips(r.tipsEvening) },
                          { label: "Total tips", value: formatTips(r.totalTips) },
                        ].map(s => (
                          <div key={s.label} className="rounded-lg px-3 py-2.5" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
                            <p className="text-[15px] font-bold" style={{ color: "var(--accent)" }}>{s.value}</p>
                            <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legal note */}
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-[10px]" style={{ color: "#F59E0B" }}>
                        Contrat {r.contractType} à {r.weeklyHours}h/sem · Mensualisation légale : {(r.weeklyHours * 52 / 12).toFixed(2)}h/mois
                        {r.maj25Hours > 0 || r.maj50Hours > 0
                          ? ` · ${formatHours(r.maj25Hours + r.maj50Hours)} heures supplémentaires détectées`
                          : " · Aucune heure supplémentaire"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <button onClick={printResults}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
              <Download size={14} />
              Imprimer / Exporter PDF
            </button>
          )}
        </>
      )}
    </div>
  );
}
