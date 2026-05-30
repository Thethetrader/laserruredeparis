"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Check } from "lucide-react";
import type { ContractType } from "@/lib/shifts";

const CONTRACT_TYPES: ContractType[] = ["CDI", "CDD", "Extra", "Apprenti"];

export default function ShiftSettingsPage() {
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [weeklyHours, setWeeklyHours]   = useState("35");
  const [restDays, setRestDays]         = useState("2");
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
        .select("contract_type, weekly_hours, weekly_rest_days")
        .eq("id", user.id)
        .single();
      if (data) {
        setContractType(data.contract_type ?? "");
        setWeeklyHours(String(data.weekly_hours ?? 35));
        setRestDays(String(data.weekly_rest_days ?? 2));
      }
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    await supabase.from("profiles").update({
      contract_type: contractType || null,
      weekly_hours: parseFloat(weeklyHours) || 35,
      weekly_rest_days: parseInt(restDays) || 2,
    }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-4 py-6 pb-32 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <MonoLabel size="xs">Réglages Shifts</MonoLabel>
        <a href="/shifts" className="text-[11px]" style={{ color: "var(--accent)" }}>← Calendrier</a>
      </div>

      <div className="space-y-5">
        {/* Contract type */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Type de contrat</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2" style={{ background: "var(--background-elev)" }}>
            {CONTRACT_TYPES.map(ct => (
              <button
                key={ct}
                onClick={() => setContractType(ct)}
                className="py-2.5 rounded-base text-[13px] font-medium transition-all"
                style={{
                  background: contractType === ct ? "rgba(6,182,212,0.12)" : "var(--background)",
                  border: contractType === ct ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)",
                  color: contractType === ct ? "var(--accent)" : "var(--foreground-muted)",
                }}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly hours */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Heures hebdomadaires</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Sert au calcul des heures sup</p>
          </div>
          <div className="p-4" style={{ background: "var(--background-elev)" }}>
            <input
              type="number" min="1" max="80" step="0.5"
              value={weeklyHours}
              onChange={e => setWeeklyHours(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Rest days */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Jours de repos par semaine</p>
          </div>
          <div className="p-4" style={{ background: "var(--background-elev)" }}>
            <input
              type="number" min="0" max="7" step="1"
              value={restDays}
              onChange={e => setRestDays(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            background: saved ? "rgba(16,185,129,0.12)" : "var(--success)",
            color: saved ? "var(--success)" : "#09090B",
            border: saved ? "1px solid rgba(16,185,129,0.3)" : "none",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? <><Check size={14} />Enregistré</> : saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
