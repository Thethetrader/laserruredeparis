"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Plus, Clock } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type ShiftType = "morning" | "afternoon" | "evening" | "night";

interface Delay {
  id: string;
  establishment_id: string;
  employee_id: string;
  reported_by: string | null;
  shift_date: string;
  shift_type: ShiftType | null;
  delay_minutes: number;
  reason: string | null;
  created_at: string;
  employee_name?: string;
}

interface TeamMemberOption {
  profile_id: string;
  name: string;
}

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
  night: "Nuit",
};

const DEV_DELAYS: Delay[] = [
  {
    id: "d1",
    establishment_id: DEV_ESTABLISHMENT_ID,
    employee_id: "profile-3",
    reported_by: DEV_PROFILE_ID,
    shift_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    shift_type: "morning",
    delay_minutes: 15,
    reason: "Problème de transport en commun",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    employee_name: "Rayan Dupont",
  },
  {
    id: "d2",
    establishment_id: DEV_ESTABLISHMENT_ID,
    employee_id: "profile-2",
    reported_by: DEV_PROFILE_ID,
    shift_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    shift_type: "evening",
    delay_minutes: 30,
    reason: "Embouteillages",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    employee_name: "Yasmine Benali",
  },
];

const DEV_TEAM: TeamMemberOption[] = [
  { profile_id: DEV_PROFILE_ID, name: "Dev Mode" },
  { profile_id: "profile-2", name: "Yasmine Benali" },
  { profile_id: "profile-3", name: "Rayan Dupont" },
];

export default function DelaysPage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [delays, setDelays] = useState<Delay[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamMemberOption[]>([]);
  const [role, setRole] = useState<string>("employee");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [profileId, setProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formEmployee, setFormEmployee] = useState(DEV_MODE ? DEV_PROFILE_ID : "");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formShift, setFormShift] = useState<ShiftType>("morning");
  const [formMinutes, setFormMinutes] = useState("");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    if (DEV_MODE) {
      setRole(devRole);
      setDelays(DEV_DELAYS);
      setTeamOptions(DEV_TEAM);
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setProfileId(user.id);
    setFormEmployee(user.id);

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: memberData } = await _mq.limit(1).maybeSingle();
    if (!memberData && _ceid && _re.test(_ceid)) ({ data: memberData } = await supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true).limit(1).maybeSingle());

    if (!memberData) { setLoading(false); return; }

    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);

    const isManager = memberData.role === "owner" || memberData.role === "manager";

    let query = supabase
      .from("delays")
      .select("*")
      .eq("establishment_id", memberData.establishment_id)
      .order("shift_date", { ascending: false });

    if (!isManager) {
      query = query.eq("employee_id", user.id);
    }

    const [{ data: delayData }, { data: teamData }] = await Promise.all([
      query,
      supabase
        .from("establishment_members")
        .select("profile_id, profiles(first_name, last_name)")
        .eq("establishment_id", memberData.establishment_id)
        .eq("is_active", true),
    ]);

    setDelays(delayData ?? []);

    const opts: TeamMemberOption[] = (teamData ?? []).map((m: {
      profile_id: string;
      profiles: { first_name: string | null; last_name: string | null } | null;
    }) => ({
      profile_id: m.profile_id,
      name: `${m.profiles?.first_name ?? ""} ${m.profiles?.last_name ?? ""}`.trim() || m.profile_id,
    }));
    setTeamOptions(opts);
    setLoading(false);
  }

  const isManager = role === "owner" || role === "manager";

  const thisMonthDelays = delays.filter(d => {
    const date = new Date(d.shift_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const avgMinutes = thisMonthDelays.length
    ? Math.round(thisMonthDelays.reduce((sum, d) => sum + d.delay_minutes, 0) / thisMonthDelays.length)
    : 0;

  const submitDelay = async () => {
    const mins = parseInt(formMinutes);
    if (!formEmployee || !formDate || isNaN(mins) || mins <= 0) return;
    setSubmitting(true);

    if (DEV_MODE) {
      const memberName = teamOptions.find(t => t.profile_id === formEmployee)?.name ?? "Inconnu";
      const newD: Delay = {
        id: `d-${Date.now()}`,
        establishment_id: DEV_ESTABLISHMENT_ID,
        employee_id: formEmployee,
        reported_by: DEV_PROFILE_ID,
        shift_date: formDate,
        shift_type: formShift,
        delay_minutes: mins,
        reason: formReason || null,
        created_at: new Date().toISOString(),
        employee_name: memberName,
      };
      setDelays(prev => [newD, ...prev]);
      resetForm();
      setSubmitting(false);
      return;
    }

    const { data } = await supabase.from("delays").insert({
      establishment_id: establishmentId,
      employee_id: formEmployee,
      reported_by: profileId,
      shift_date: formDate,
      shift_type: formShift,
      delay_minutes: mins,
      reason: formReason || null,
    }).select().single();

    if (data) setDelays(prev => [data, ...prev]);
    resetForm();
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormMinutes("");
    setFormReason("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormShift("morning");
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Retards</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            {isManager ? "Retards équipe" : "Mes retards"}
          </h1>
          {!isManager && (
            <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
              Déclarez vos retards ici pour garder une trace.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
          style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}
        >
          <Plus size={14} />
          {isManager ? "Signaler" : "Déclarer un retard"}
        </button>
      </div>

      {/* Stats manager only */}
      {isManager && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>{thisMonthDelays.length}</p>
            <p className="text-[11px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--foreground-dim)" }}>Ce mois</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl font-semibold" style={{ color: avgMinutes > 20 ? "var(--warning)" : "var(--foreground)" }}>
              {avgMinutes}<span className="text-base font-normal" style={{ color: "var(--foreground-dim)" }}>min</span>
            </p>
            <p className="text-[11px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--foreground-dim)" }}>Moyenne</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>Signaler un retard</p>
          <div className="space-y-3">
            {isManager && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Employé</label>
                <select
                  value={formEmployee}
                  onChange={e => setFormEmployee(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {teamOptions.map(opt => (
                    <option key={opt.profile_id} value={opt.profile_id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Service</label>
                <select
                  value={formShift}
                  onChange={e => setFormShift(e.target.value as ShiftType)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {Object.entries(SHIFT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Durée (minutes)</label>
              <input
                type="number"
                value={formMinutes}
                onChange={e => setFormMinutes(e.target.value)}
                placeholder="Ex: 15"
                min="1"
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Raison <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
              <input
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                placeholder="Ex: Problème de transport"
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={submitDelay}
                disabled={submitting || !formEmployee || !formDate || !formMinutes}
                className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (submitting || !formEmployee || !formDate || !formMinutes) ? 0.5 : 1 }}
              >
                {submitting ? "Envoi…" : "Enregistrer"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm rounded-md"
                style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delays list */}
      {delays.length === 0 ? (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
        >
          <Clock size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun retard enregistré</p>
        </div>
      ) : (
        <div className="space-y-2">
          {delays.map(delay => (
            <div
              key={delay.id}
              className="rounded-xl px-5 py-4"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {isManager && delay.employee_name && (
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                      {delay.employee_name}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
                      {new Date(delay.shift_date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    {delay.shift_type && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
                      >
                        {SHIFT_LABELS[delay.shift_type]}
                      </span>
                    )}
                  </div>
                  {delay.reason && (
                    <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>
                      {delay.reason}
                    </p>
                  )}
                </div>
                <div
                  className="text-sm font-semibold flex-shrink-0 px-2.5 py-1 rounded-md"
                  style={{
                    background: delay.delay_minutes > 20 ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                    color: delay.delay_minutes > 20 ? "var(--danger)" : "var(--warning)",
                  }}
                >
                  +{delay.delay_minutes}min
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
