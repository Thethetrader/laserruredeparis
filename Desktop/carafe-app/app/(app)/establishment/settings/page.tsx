"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Check, ToggleLeft, ToggleRight, Trash2, RotateCcw } from "lucide-react";
import {
  STAFF_STATUSES, parseTipSettings, DEFAULT_TIP_SETTINGS,
  parseCASettings, DEFAULT_CA_SETTINGS,
  type TipSettings, type StaffStatus, type TipMode,
  type CASettings, type CAMode,
} from "@/lib/shifts";

const DEV_MODE = false;

interface EstablishmentInfo { id: string; name: string; city: string | null; }

export default function EstablishmentSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null);
  const [tipSettings, setTipSettings] = useState<TipSettings>(DEFAULT_TIP_SETTINGS);
  const [caSettings, setCASettings] = useState<CASettings>(DEFAULT_CA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (DEV_MODE) {
      setEstablishment({ id: "dev-establishment-2", name: "La Brasserie Test", city: "Lyon" });
      setLoading(false);
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("establishment_members")
      .select("establishment_id, role, establishments(id, name, city, tip_settings, ca_settings)")
      .eq("profile_id", user.id).in("role", ["owner", "manager"]).limit(1).maybeSingle();
    if (!data) { router.push("/dashboard"); return; }
    const est = data.establishments as unknown as { id: string; name: string; city: string | null; tip_settings: unknown; ca_settings: unknown } | null;
    if (!est) { router.push("/dashboard"); return; }
    setEstablishment({ id: est.id, name: est.name, city: est.city });
    setTipSettings(parseTipSettings(est.tip_settings));
    setCASettings(parseCASettings(est.ca_settings));
    setLoading(false);
  }

  function setMode(mode: TipMode) { setTipSettings(prev => ({ ...prev, mode })); }
  function setCAMode(mode: CAMode) { setCASettings(prev => ({ ...prev, mode })); }

  function setColor(status: StaffStatus, color: string) {
    setTipSettings(prev => ({ ...prev, colors: { ...prev.colors, [status]: color } }));
  }

  function setLabel(status: StaffStatus, label: string) {
    setTipSettings(prev => ({ ...prev, labels: { ...prev.labels, [status]: label } }));
  }

  function toggleHidden(status: StaffStatus) {
    setTipSettings(prev => ({
      ...prev,
      hidden: prev.hidden.includes(status)
        ? prev.hidden.filter(s => s !== status)
        : [...prev.hidden, status],
    }));
  }

  function setCoef(status: StaffStatus, val: string) {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setTipSettings(prev => ({ ...prev, coefficients: { ...prev.coefficients, [status]: num } }));
  }

  async function handleSave() {
    if (!establishment) return;
    setSaving(true);
    if (DEV_MODE) { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    await supabase.from("establishments")
      .update({
        tip_settings: tipSettings as unknown as Record<string, unknown>,
        ca_settings: caSettings as unknown as Record<string, unknown>,
      })
      .eq("id", establishment.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-2xl">
        <div className="rounded-xl h-20 animate-pulse" style={{ background: "var(--background-elev)" }} />
      </div>
    );
  }
  if (!establishment) return null;

  const CA_MODES: { value: CAMode; label: string; desc: string }[] = [
    { value: "disabled",    label: "Désactivé",     desc: "Pas de suivi du CA" },
    { value: "per_service", label: "Par service",    desc: "Midi et soir séparément" },
    { value: "per_day",     label: "Par jour",       desc: "1 montant par journée" },
    { value: "per_month",   label: "Par mois",       desc: "1 montant par mois" },
  ];

  return (
    <div className="px-4 py-8 lg:px-8 pb-32 max-w-2xl">
      <MonoLabel size="xs" className="mb-6 block">Paramètres</MonoLabel>

      {/* Establishment info */}
      <div className="rounded-xl p-5 mb-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{establishment.name}</p>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{establishment.city ?? ""}</p>
      </div>

      {/* Tips mode */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Mode des pourboires</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Choisissez qui saisit les pourboires</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3" style={{ background: "var(--background-elev)" }}>
          {([
            { value: "self" as TipMode, label: "Autonome", desc: "Chaque employé saisit ses propres tips" },
            { value: "dispatch" as TipMode, label: "Dispatch", desc: "Le manager distribue les tips au prorata" },
          ]).map(opt => (
            <button key={opt.value} onClick={() => setMode(opt.value)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: tipSettings.mode === opt.value ? "rgba(6,182,212,0.08)" : "var(--background)",
                border: `1px solid ${tipSettings.mode === opt.value ? "rgba(6,182,212,0.3)" : "var(--border)"}`,
              }}>
              <p className="text-[13px] font-semibold" style={{ color: tipSettings.mode === opt.value ? "var(--accent)" : "var(--foreground)" }}>{opt.label}</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--foreground-dim)" }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Coefficients (dispatch mode only) */}
      {tipSettings.mode === "dispatch" && (
        <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Coefficients par statut</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Tips = heures × coefficient. Plus le coef est élevé, plus la part est grande.</p>
          </div>
          <div style={{ background: "var(--background-elev)" }}>
            {(Object.keys(STAFF_STATUSES) as StaffStatus[]).map((status, i, arr) => {
              const cfg = STAFF_STATUSES[status];
              return (
                <div key={status} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tipSettings.colors[status] ?? cfg.color }} />
                  <span className="flex-1 text-[13px]" style={{ color: "var(--foreground)" }}>{cfg.label}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="5" step="0.1"
                      value={tipSettings.coefficients[status]}
                      onChange={e => setCoef(status, e.target.value)}
                      className="w-16 px-2 py-1 rounded-base text-center text-[13px] outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                    <span className="text-[11px] w-10 text-right font-mono" style={{ color: "var(--foreground-dim)" }}>
                      x{tipSettings.coefficients[status].toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CA mode */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Suivi du chiffre d&apos;affaires</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Saisir le total caisse pour analyser la rentabilité</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3" style={{ background: "var(--background-elev)" }}>
          {CA_MODES.map(opt => (
            <button key={opt.value} onClick={() => setCAMode(opt.value)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: caSettings.mode === opt.value ? "rgba(16,185,129,0.08)" : "var(--background)",
                border: `1px solid ${caSettings.mode === opt.value ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
              }}>
              <p className="text-[13px] font-semibold" style={{ color: caSettings.mode === opt.value ? "var(--success)" : "var(--foreground)" }}>{opt.label}</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--foreground-dim)" }}>{opt.desc}</p>
            </button>
          ))}
        </div>
        {caSettings.mode !== "disabled" && (
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)", background: "var(--background-elev)" }}>
            <div>
              <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Serveurs autorisés à saisir</p>
              <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Sinon, managers uniquement</p>
            </div>
            <button onClick={() => setCASettings(prev => ({ ...prev, staff_can_enter: !prev.staff_can_enter }))}>
              {caSettings.staff_can_enter
                ? <ToggleRight size={28} style={{ color: "var(--success)" }} />
                : <ToggleLeft size={28} style={{ color: "var(--foreground-dim)" }} />}
            </button>
          </div>
        )}
      </div>

      {/* Postes */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Postes</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Renommer ou masquer un poste selon votre établissement</p>
        </div>
        <div style={{ background: "var(--background-elev)" }}>
          {(Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden.includes(s)).map((status, i, arr) => {
            const label = tipSettings.labels[status] ?? STAFF_STATUSES[status].label;
            return (
              <div key={status} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <input type="color" value={tipSettings.colors[status] ?? STAFF_STATUSES[status].color}
                  onChange={e => setColor(status, e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer flex-shrink-0"
                  style={{ border: "none", padding: 0, background: "none" }} />
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(status, e.target.value)}
                  className="flex-1 px-2 py-1 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
                <button onClick={() => toggleHidden(status)} className="p-1.5 rounded-base flex-shrink-0" style={{ color: "var(--danger)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {tipSettings.hidden.length > 0 && (
            <details style={{ borderTop: "1px solid var(--border)" }}>
              <summary className="px-4 py-2.5 text-[11px] cursor-pointer list-none flex items-center gap-2" style={{ color: "var(--foreground-dim)" }}>
                <RotateCcw size={11} />
                {tipSettings.hidden.length} poste{tipSettings.hidden.length > 1 ? "s" : ""} supprimé{tipSettings.hidden.length > 1 ? "s" : ""}
              </summary>
              {tipSettings.hidden.map(status => (
                <div key={status} className="flex items-center gap-3 px-4 py-2.5" style={{ opacity: 0.5 }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tipSettings.colors[status] ?? STAFF_STATUSES[status].color }} />
                  <span className="flex-1 text-[12px]" style={{ color: "var(--foreground)" }}>{tipSettings.labels[status] ?? STAFF_STATUSES[status].label}</span>
                  <button onClick={() => toggleHidden(status)} className="text-[10px] px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1" style={{ background: "rgba(6,182,212,0.08)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    <RotateCcw size={9} />Restaurer
                  </button>
                </div>
              ))}
            </details>
          )}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
        style={{
          background: saved ? "rgba(16,185,129,0.12)" : "var(--success)",
          color: saved ? "var(--success)" : "#09090B",
          border: saved ? "1px solid rgba(16,185,129,0.3)" : "none",
          opacity: saving ? 0.7 : 1,
        }}>
        {saved ? <><Check size={14} />Enregistré</> : saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
