"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Check } from "lucide-react";
import type { ContractType } from "@/lib/shifts";

const CONTRACT_TYPES: ContractType[] = ["CDI", "CDD", "Extra", "Apprenti"];

const DAYS = [
  { key: "1", label: "Lundi" },
  { key: "2", label: "Mardi" },
  { key: "3", label: "Mercredi" },
  { key: "4", label: "Jeudi" },
  { key: "5", label: "Vendredi" },
  { key: "6", label: "Samedi" },
  { key: "7", label: "Dimanche" },
];

type DaySchedule = { start: string; end: string; active: boolean };
type ScheduleTemplate = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: ScheduleTemplate = Object.fromEntries(
  DAYS.map(d => [d.key, { start: "09:00", end: "17:00", active: false }])
);

export default function ShiftSettingsPage() {
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [weeklyHours, setWeeklyHours]   = useState("35");
  const [restDays, setRestDays]         = useState("2");
  const [schedule, setSchedule]         = useState<ScheduleTemplate>(DEFAULT_SCHEDULE);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [userId, setUserId]             = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("contract_type, weekly_hours, weekly_rest_days, schedule_template")
        .eq("id", user.id)
        .single();
      if (data) {
        setContractType(data.contract_type ?? "");
        setWeeklyHours(String(data.weekly_hours ?? 35));
        setRestDays(String(data.weekly_rest_days ?? 2));
        if (data.schedule_template && Object.keys(data.schedule_template).length > 0) {
          // Merge saved template with defaults
          const merged: ScheduleTemplate = { ...DEFAULT_SCHEDULE };
          for (const key of Object.keys(data.schedule_template)) {
            merged[key] = { ...merged[key], ...data.schedule_template[key] };
          }
          setSchedule(merged);
        }
      }
    }
    load();
  }, [supabase]);

  function updateDay(key: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    // Only save active days in the template
    const templateToSave: Record<string, { start: string; end: string }> = {};
    for (const [key, val] of Object.entries(schedule)) {
      if (val.active) templateToSave[key] = { start: val.start, end: val.end };
    }
    await supabase.from("profiles").update({
      contract_type: contractType || null,
      weekly_hours: parseFloat(weeklyHours) || 35,
      weekly_rest_days: parseInt(restDays) || 2,
      schedule_template: templateToSave,
    }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-4 py-8 lg:px-10 pb-32 max-w-lg">
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Réglages Shifts</MonoLabel>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
          <a href="/shifts" style={{ color: "var(--accent)" }}>← Retour au calendrier</a>
        </p>
      </div>

      <div className="space-y-5">

        {/* Contract type */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Type de contrat</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2" style={{ background: "var(--background-elev)" }}>
            {CONTRACT_TYPES.map(ct => (
              <button key={ct} onClick={() => setContractType(ct)}
                className="py-2.5 rounded-base text-[13px] font-medium transition-all"
                style={{ background: contractType === ct ? "rgba(6,182,212,0.12)" : "var(--background)", border: contractType === ct ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)", color: contractType === ct ? "var(--accent)" : "var(--foreground-muted)" }}>
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly hours */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Heures hebdomadaires</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Sert au calcul des heures supplémentaires</p>
          </div>
          <div className="p-4" style={{ background: "var(--background-elev)" }}>
            <input type="number" min="1" max="80" step="0.5" value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Rest days */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Jours de repos par semaine</p>
          </div>
          <div className="p-4" style={{ background: "var(--background-elev)" }}>
            <input type="number" min="0" max="7" step="1" value={restDays} onChange={e => setRestDays(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>

        {/* Planning type — schedule template */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Planning type</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Les horaires se pré-rempliront automatiquement quand tu ajoutes un shift</p>
          </div>
          <div style={{ background: "var(--background-elev)" }}>
            {DAYS.map((d, i) => {
              const day = schedule[d.key];
              return (
                <div key={d.key} className="px-4 py-3" style={{ borderBottom: i < DAYS.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium" style={{ color: day.active ? "var(--foreground)" : "var(--foreground-muted)" }}>
                      {d.label}
                    </span>
                    {/* Toggle */}
                    <button
                      onClick={() => updateDay(d.key, "active", !day.active)}
                      className="relative flex-shrink-0"
                      style={{ width: 36, height: 20, borderRadius: 99, background: day.active ? "var(--accent)" : "var(--border-strong)", transition: "background 0.2s" }}
                    >
                      <div style={{ position: "absolute", top: 2, left: day.active ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                  </div>
                  {day.active && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Début</label>
                        <input type="time" value={day.start} onChange={e => updateDay(d.key, "start", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none"
                          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider block mb-1" style={{ color: "var(--foreground-dim)" }}>Fin</label>
                        <input type="time" value={day.end} onChange={e => updateDay(d.key, "end", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-base text-[13px] outline-none"
                          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                      </div>
                    </div>
                  )}
                  {!day.active && (
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Repos</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: saved ? "rgba(16,185,129,0.12)" : "var(--success)", color: saved ? "var(--success)" : "#09090B", border: saved ? "1px solid rgba(16,185,129,0.3)" : "none", opacity: saving ? 0.7 : 1 }}>
          {saved ? <><Check size={14} />Enregistré</> : saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
