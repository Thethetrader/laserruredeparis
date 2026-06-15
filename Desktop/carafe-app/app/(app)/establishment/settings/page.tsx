"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Check, ToggleLeft, ToggleRight, Trash2, RotateCcw, LogOut, Bell, Plus, X } from "lucide-react";
import {
  STAFF_STATUSES, parseTipSettings, DEFAULT_TIP_SETTINGS,
  parseCASettings, DEFAULT_CA_SETTINGS,
  parsePlanningMode,
  type TipSettings, type StaffStatus, type TipMode,
  type CASettings, type CAMode,
  type PlanningMode,
} from "@/lib/shifts";

const DEV_MODE = false;

interface EstablishmentInfo { id: string; name: string; city: string | null; }

interface NotifSchedule {
  id: string;
  title: string;
  body: string;
  url: string;
  hour: number;
  days_of_week: number[];
  target_role: string | null;
  is_active: boolean;
}

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon first

export default function EstablishmentSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null);
  const [tipSettings, setTipSettings] = useState<TipSettings>(DEFAULT_TIP_SETTINGS);
  const [caSettings, setCASettings] = useState<CASettings>(DEFAULT_CA_SETTINGS);
  const [planningMode, setPlanningMode] = useState<PlanningMode>("ai");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notifSchedules, setNotifSchedules] = useState<NotifSchedule[]>([]);
  const [showNewNotif, setShowNewNotif] = useState(false);
  const [newNotif, setNewNotif] = useState({
    title: "", body: "", url: "/dashboard",
    hour: 15, days_of_week: [1, 2, 3, 4, 5], target_role: "" as string,
  });
  const [savingNotif, setSavingNotif] = useState(false);

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
      .select("establishment_id, role, establishments(id, name, city, tip_settings, ca_settings, planning_mode)")
      .eq("profile_id", user.id).in("role", ["owner", "manager"]).limit(1).maybeSingle();
    if (!data) { router.push("/dashboard"); return; }
    const est = data.establishments as unknown as { id: string; name: string; city: string | null; tip_settings: unknown; ca_settings: unknown; planning_mode: unknown } | null;
    if (!est) { router.push("/dashboard"); return; }
    setEstablishment({ id: est.id, name: est.name, city: est.city });
    setTipSettings(parseTipSettings(est.tip_settings));
    setCASettings(parseCASettings(est.ca_settings));
    setPlanningMode(parsePlanningMode(est.planning_mode));
    await loadSchedules(est.id);
    setLoading(false);
  }

  async function loadSchedules(estId: string) {
    const { data } = await supabase
      .from("notification_schedules")
      .select("*")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: true });
    setNotifSchedules((data as NotifSchedule[]) ?? []);
  }

  async function createSchedule() {
    if (!establishment || !newNotif.title.trim() || !newNotif.body.trim()) return;
    setSavingNotif(true);
    await supabase.from("notification_schedules").insert({
      establishment_id: establishment.id,
      title: newNotif.title.trim(),
      body: newNotif.body.trim(),
      url: newNotif.url.trim() || "/dashboard",
      hour: newNotif.hour,
      days_of_week: newNotif.days_of_week,
      target_role: newNotif.target_role || null,
    });
    await loadSchedules(establishment.id);
    setNewNotif({ title: "", body: "", url: "/dashboard", hour: 15, days_of_week: [1, 2, 3, 4, 5], target_role: "" });
    setShowNewNotif(false);
    setSavingNotif(false);
  }

  async function toggleSchedule(id: string, active: boolean) {
    await supabase.from("notification_schedules").update({ is_active: active }).eq("id", id);
    setNotifSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
  }

  async function deleteSchedule(id: string) {
    await supabase.from("notification_schedules").delete().eq("id", id);
    setNotifSchedules(prev => prev.filter(s => s.id !== id));
  }

  function toggleDay(day: number) {
    setNewNotif(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day],
    }));
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
    setSaving(true); setSaveError(null);
    if (DEV_MODE) { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    const { error } = await supabase.from("establishments")
      .update({
        tip_settings: tipSettings as unknown as Record<string, unknown>,
        ca_settings: caSettings as unknown as Record<string, unknown>,
        planning_mode: planningMode,
      } as Record<string, unknown>)
      .eq("id", establishment.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
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

      {/* Planning mode */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Mode de planning</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Choisissez comment vous créez le planning de l&apos;équipe</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3" style={{ background: "var(--background-elev)" }}>
          {([
            { value: "ai" as PlanningMode, label: "IA", desc: "Générez automatiquement le planning à partir des besoins définis" },
            { value: "manual" as PlanningMode, label: "Manuel", desc: "Créez les shifts vous-même, poste par poste, jour par jour" },
          ]).map(opt => (
            <button key={opt.value} onClick={() => setPlanningMode(opt.value)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: planningMode === opt.value ? "rgba(245,158,11,0.08)" : "var(--background)",
                border: `1px solid ${planningMode === opt.value ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
              }}>
              <p className="text-[13px] font-semibold" style={{ color: planningMode === opt.value ? "#F59E0B" : "var(--foreground)" }}>{opt.label}</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--foreground-dim)" }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Postes */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Postes</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
            {tipSettings.mode === "dispatch" ? "Renommer, coloriser et définir le coefficient de chaque poste" : "Renommer ou masquer un poste selon votre établissement"}
          </p>
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
                {tipSettings.mode === "dispatch" && (
                  <input type="number" min="0" max="5" step="0.1"
                    value={tipSettings.coefficients[status]}
                    onChange={e => setCoef(status, e.target.value)}
                    className="w-14 px-2 py-1 rounded-base text-center text-[12px] font-mono outline-none flex-shrink-0"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }} />
                )}
                <button onClick={() => toggleHidden(status)} className="p-1.5 rounded-base flex-shrink-0" style={{ color: "var(--danger)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {/* Ajouter un poste masqué */}
          {tipSettings.hidden.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--foreground-dim)" }}>Postes masqués</p>
              <div className="flex flex-wrap gap-2">
                {tipSettings.hidden.map(status => (
                  <button key={status} onClick={() => toggleHidden(status)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
                    style={{ background: "var(--background)", border: "1px dashed var(--border-strong)", color: "var(--foreground-dim)" }}>
                    <span>+</span> {tipSettings.labels[status] ?? STAFF_STATUSES[status].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications programmées */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Notifications programmées</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Envoi automatique à heure fixe (heure de Paris)</p>
          </div>
          <button
            onClick={() => setShowNewNotif(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", color: "var(--accent)" }}>
            {showNewNotif ? <X size={13} /> : <Plus size={13} />}
            {showNewNotif ? "Annuler" : "Ajouter"}
          </button>
        </div>

        {/* New schedule form */}
        {showNewNotif && (
          <div className="p-4 space-y-3" style={{ background: "var(--background-elev)", borderBottom: notifSchedules.length > 0 ? "1px solid var(--border)" : undefined }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</p>
                <input
                  type="text" placeholder="Retour client"
                  value={newNotif.title}
                  onChange={e => setNewNotif(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Heure</p>
                <input
                  type="number" min={0} max={23}
                  value={newNotif.hour}
                  onChange={e => setNewNotif(prev => ({ ...prev, hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) }))}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-center outline-none font-mono"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Corps du message</p>
              <input
                type="text" placeholder="N'oubliez pas de noter les retours clients du service"
                value={newNotif.body}
                onChange={e => setNewNotif(prev => ({ ...prev, body: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Jours</p>
              <div className="flex gap-1.5">
                {DAY_ORDER.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="w-8 h-8 rounded-lg text-[11px] font-semibold font-mono transition-all"
                    style={{
                      background: newNotif.days_of_week.includes(day) ? "rgba(6,182,212,0.12)" : "var(--background)",
                      border: `1px solid ${newNotif.days_of_week.includes(day) ? "rgba(6,182,212,0.35)" : "var(--border)"}`,
                      color: newNotif.days_of_week.includes(day) ? "var(--accent)" : "var(--foreground-dim)",
                    }}>
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Destinataires</p>
              <div className="flex gap-2">
                {[["", "Tous"], ["staff", "Staff"], ["manager", "Managers"]].map(([val, label]) => (
                  <button key={val} onClick={() => setNewNotif(prev => ({ ...prev, target_role: val }))}
                    className="px-3 py-1.5 rounded-lg text-[12px] transition-all"
                    style={{
                      background: newNotif.target_role === val ? "rgba(6,182,212,0.08)" : "var(--background)",
                      border: `1px solid ${newNotif.target_role === val ? "rgba(6,182,212,0.3)" : "var(--border)"}`,
                      color: newNotif.target_role === val ? "var(--accent)" : "var(--foreground-dim)",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={createSchedule}
              disabled={savingNotif || !newNotif.title.trim() || !newNotif.body.trim() || newNotif.days_of_week.length === 0}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: "var(--accent)",
                color: "#09090B",
                opacity: (savingNotif || !newNotif.title.trim() || !newNotif.body.trim() || newNotif.days_of_week.length === 0) ? 0.5 : 1,
              }}>
              {savingNotif ? "Enregistrement…" : "Créer la notification"}
            </button>
          </div>
        )}

        {/* Existing schedules */}
        {notifSchedules.length === 0 && !showNewNotif && (
          <div className="px-4 py-6 flex flex-col items-center gap-2" style={{ background: "var(--background-elev)" }}>
            <Bell size={20} style={{ color: "var(--foreground-dim)" }} />
            <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Aucune notification programmée</p>
          </div>
        )}
        {notifSchedules.map((s, i) => (
          <div key={s.id} className="px-4 py-3 flex items-start gap-3"
            style={{ background: "var(--background-elev)", borderTop: i > 0 || showNewNotif ? "1px solid var(--border)" : undefined }}>
            <Bell size={15} className="mt-0.5 flex-shrink-0" style={{ color: s.is_active ? "var(--accent)" : "var(--foreground-dim)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>{s.title}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--foreground-dim)" }}>{s.body}</p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--foreground-dim)" }}>
                {String(s.hour).padStart(2, "0")}h00 · {DAY_ORDER.filter(d => s.days_of_week.includes(d)).map(d => DAY_LABELS[d]).join(" ")}
                {s.target_role ? ` · ${s.target_role === "staff" ? "Staff" : "Managers"}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleSchedule(s.id, !s.is_active)}>
                {s.is_active
                  ? <ToggleRight size={24} style={{ color: "var(--accent)" }} />
                  : <ToggleLeft size={24} style={{ color: "var(--foreground-dim)" }} />}
              </button>
              <button onClick={() => deleteSchedule(s.id)} className="p-1 rounded" style={{ color: "var(--danger)" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
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
      {saveError && <p className="text-[12px] mt-2 text-center" style={{ color: "var(--danger)" }}>{saveError}</p>}

      {/* Déconnexion */}
      <button
        onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
        className="w-full py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-75 mt-2"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
        <LogOut size={14} />
        Se déconnecter
      </button>
    </div>
  );
}
