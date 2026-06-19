"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Calendar, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const PERIODS_FR = ["Matin", "Après-midi", "Soir"];
const HOURS_FR = ["7h", "8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h", "23h"];

interface AvailabilitySlot {
  day: string;
  period: string;
  hour_start?: string;
  hour_end?: string;
}

export default function DispoPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [contractType, setContractType] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [editDay, setEditDay] = useState(DAYS_FR[4]);
  const [editPeriod, setEditPeriod] = useState(PERIODS_FR[2]);
  const [editHourStart, setEditHourStart] = useState("18h");
  const [editHourEnd, setEditHourEnd] = useState("23h");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setProfileId(user.id);
    const { data } = await supabase
      .from("profiles")
      .select("contract_type, availability")
      .eq("id", user.id)
      .single();
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setContractType((data as any).contract_type ?? null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAvailability((data as any).availability ?? []);
    }
    setLoading(false);
  }

  const addSlot = () => {
    const already = availability.some(s => s.day === editDay && s.period === editPeriod);
    if (already) return;
    setAvailability(prev => [...prev, { day: editDay, period: editPeriod, hour_start: editHourStart, hour_end: editHourEnd }]);
  };

  const removeSlot = (i: number) => setAvailability(prev => prev.filter((_, idx) => idx !== i));

  const saveAvailability = async () => {
    setSaving(true);
    if (profileId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("profiles").update({ availability } as any).eq("id", profileId);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-lg">
        <div className="rounded-xl h-64 animate-pulse" style={{ background: "var(--background-elev)" }} />
      </div>
    );
  }

  const slotConflict = availability.some(s => s.day === editDay && s.period === editPeriod);

  return (
    <div className="px-4 py-8 lg:px-8 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <MonoLabel size="xs" className="mb-1 block">Shifts</MonoLabel>
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: "var(--accent)" }} />
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Mes disponibilités</h1>
          </div>
        </div>
        <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
          <X size={15} />
        </button>
      </div>

      {contractType && (
        <span className="inline-block mb-5 text-[11px] font-mono px-2 py-0.5 rounded"
          style={{ background: contractType === "extra" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.08)", color: contractType === "extra" ? "var(--warning)" : "var(--accent)" }}>
          {{ cdi: "CDI", cdd: "CDD", extra: "Extra" }[contractType] ?? contractType}
        </span>
      )}

      <p className="text-sm mb-5" style={{ color: "var(--foreground-dim)" }}>
        Le manager consulte tes créneaux disponibles pour planifier les services.
      </p>

      {/* Créneaux existants */}
      {availability.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-5">
          {availability.map((slot, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <div className="text-left">
                <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>{slot.day}</p>
                <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                  {slot.period}{slot.hour_start && slot.hour_end ? ` · ${slot.hour_start}–${slot.hour_end}` : ""}
                </p>
              </div>
              <button onClick={() => removeSlot(i)} className="ml-1 flex-shrink-0" style={{ color: "rgba(6,182,212,0.6)" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] mb-5 text-center py-4 rounded-xl" style={{ color: "var(--foreground-dim)", background: "var(--background-elev)", border: "1px dashed var(--border)" }}>
          Aucun créneau ajouté
        </p>
      )}

      {/* Ajouter un créneau */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Ajouter un créneau</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {DAYS_FR.map(d => (
            <button key={d} onClick={() => setEditDay(d)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{ background: editDay === d ? "rgba(6,182,212,0.15)" : "var(--background-soft)", color: editDay === d ? "var(--accent)" : "var(--foreground-dim)", border: editDay === d ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-3">
          {PERIODS_FR.map(p => (
            <button key={p} onClick={() => setEditPeriod(p)}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-medium"
              style={{ background: editPeriod === p ? "rgba(6,182,212,0.15)" : "var(--background-soft)", color: editPeriod === p ? "var(--accent)" : "var(--foreground-dim)", border: editPeriod === p ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <select value={editHourStart} onChange={e => setEditHourStart(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>→</span>
          <select value={editHourEnd} onChange={e => setEditHourEnd(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <button onClick={addSlot} disabled={slotConflict}
          className="w-full py-2.5 text-[13px] font-semibold rounded-lg"
          style={{ background: "var(--accent)", color: "#fff", opacity: slotConflict ? 0.4 : 1 }}>
          {slotConflict ? "Créneau déjà ajouté" : `+ ${editDay.slice(0, 3)} ${editPeriod} · ${editHourStart}–${editHourEnd}`}
        </button>
      </div>

      <button onClick={saveAvailability} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl"
        style={{ background: saved ? "rgba(16,185,129,0.9)" : "var(--accent)", color: "#fff", opacity: saving ? 0.6 : 1 }}>
        {saved ? <><Check size={14} /> Disponibilités enregistrées</> : saving ? "Enregistrement…" : "Enregistrer mes disponibilités"}
      </button>
    </div>
  );
}
