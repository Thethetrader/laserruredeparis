"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Plus, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type ChallengeStatus = "active" | "completed" | "cancelled";

interface Challenge {
  id: string;
  establishment_id: string;
  created_by: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  starts_at: string;
  ends_at: string | null;
  status: ChallengeStatus;
  created_at: string;
  winner_name?: string | null;
}

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  active: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

const STATUS_STYLE: Record<ChallengeStatus, { bg: string; color: string }> = {
  active: { bg: "rgba(6,182,212,0.1)", color: "var(--accent)" },
  completed: { bg: "rgba(16,185,129,0.1)", color: "var(--success)" },
  cancelled: { bg: "rgba(161,161,170,0.1)", color: "var(--foreground-dim)" },
};

const DEV_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    establishment_id: DEV_ESTABLISHMENT_ID,
    created_by: DEV_PROFILE_ID,
    title: "100 avis Google ce mois",
    description: "Encourager les clients satisfaits à laisser un avis sur Google My Business.",
    target_value: 100,
    current_value: 63,
    unit: "avis",
    starts_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "active",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    winner_name: null,
  },
  {
    id: "c2",
    establishment_id: DEV_ESTABLISHMENT_ID,
    created_by: DEV_PROFILE_ID,
    title: "Zéro gaspillage alimentaire",
    description: "Réduire les déchets alimentaires en cuisine.",
    target_value: 4,
    current_value: 2,
    unit: "semaines",
    starts_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: "active",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    winner_name: null,
  },
  {
    id: "c3",
    establishment_id: DEV_ESTABLISHMENT_ID,
    created_by: DEV_PROFILE_ID,
    title: "Meilleure note du mois d'avril",
    description: "Le serveur avec la meilleure note client gagne.",
    target_value: null,
    current_value: 0,
    unit: null,
    starts_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    ends_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: "completed",
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    winner_name: "Yasmine Benali",
  },
];

export default function ChallengesPage() {
  const supabase = createClient();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [devRole] = useDevRole();
  const [role, setRole] = useState<string>("employee");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [profileId, setProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Per-challenge state for manager actions
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});
  const [winnerInputs, setWinnerInputs] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");

  useEffect(() => {
    if (DEV_MODE) {
      setRole(devRole);
      setChallenges(DEV_CHALLENGES);
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProfileId(user.id);

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: memberData } = await _mq.limit(1).maybeSingle();
    if (!memberData && _ceid && _re.test(_ceid)) ({ data: memberData } = await supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true).limit(1).maybeSingle());

    if (!memberData) { setLoading(false); return; }

    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);

    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("establishment_id", memberData.establishment_id)
      .order("created_at", { ascending: false });

    setChallenges(data ?? []);
    setLoading(false);
  }

  const isManager = role === "owner" || role === "manager";

  const updateProgress = async (challengeId: string) => {
    const val = parseInt(progressInputs[challengeId] ?? "");
    if (isNaN(val) || val < 0) return;

    if (DEV_MODE) {
      setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, current_value: val } : c));
      setProgressInputs(prev => ({ ...prev, [challengeId]: "" }));
      return;
    }

    await supabase.from("challenges").update({ current_value: val }).eq("id", challengeId);
    setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, current_value: val } : c));
    setProgressInputs(prev => ({ ...prev, [challengeId]: "" }));
  };

  const closeChallenge = async (challengeId: string) => {
    const winner = winnerInputs[challengeId]?.trim() || null;

    if (DEV_MODE) {
      setChallenges(prev => prev.map(c =>
        c.id === challengeId ? { ...c, status: "completed", winner_name: winner } : c
      ));
      setConfirmClose(null);
      setWinnerInputs(prev => ({ ...prev, [challengeId]: "" }));
      return;
    }

    await supabase.from("challenges").update({
      status: "completed",
      // winner_name column must be added via migration
    }).eq("id", challengeId);

    setChallenges(prev => prev.map(c =>
      c.id === challengeId ? { ...c, status: "completed", winner_name: winner } : c
    ));
    setConfirmClose(null);
    setWinnerInputs(prev => ({ ...prev, [challengeId]: "" }));
  };

  const createChallenge = async () => {
    if (!formTitle.trim()) return;
    setSubmitting(true);

    if (DEV_MODE) {
      const newC: Challenge = {
        id: `c-${Date.now()}`,
        establishment_id: DEV_ESTABLISHMENT_ID,
        created_by: DEV_PROFILE_ID,
        title: formTitle,
        description: formDescription || null,
        target_value: formTarget ? parseInt(formTarget) : null,
        current_value: 0,
        unit: formUnit || null,
        starts_at: new Date().toISOString(),
        ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        status: "active",
        created_at: new Date().toISOString(),
        winner_name: null,
      };
      setChallenges(prev => [newC, ...prev]);
      resetForm();
      setSubmitting(false);
      return;
    }

    const { data } = await supabase.from("challenges").insert({
      establishment_id: establishmentId,
      created_by: profileId,
      title: formTitle,
      description: formDescription || null,
      target_value: formTarget ? parseInt(formTarget) : null,
      unit: formUnit || null,
      ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
    }).select().single();

    if (data) setChallenges(prev => [data, ...prev]);
    resetForm();
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormTitle(""); setFormDescription(""); setFormTarget("");
    setFormUnit(""); setFormEndsAt(""); setShowForm(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl h-32 animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => c.status === "active");
  const doneChallenges = challenges.filter(c => c.status !== "active");

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Challenges</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Challenges
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
            {activeChallenges.length} défi{activeChallenges.length !== 1 ? "s" : ""} en cours
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
            style={{ background: "var(--accent)", color: "#09090B" }}
          >
            <Plus size={14} />
            Créer un défi
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && isManager && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>Nouveau défi</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: 100 avis Google ce mois"
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
              <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Décrivez l'objectif..." rows={2}
                className="w-full px-3 py-2 text-sm rounded-md outline-none resize-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Objectif chiffré</label>
                <input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="100" min="1"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Unité</label>
                <input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="avis, points…"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Date de fin <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
              <input type="date" value={formEndsAt} onChange={e => setFormEndsAt(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createChallenge} disabled={submitting || !formTitle.trim()}
                className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
                style={{ background: "var(--accent)", color: "#09090B", opacity: (submitting || !formTitle.trim()) ? 0.5 : 1 }}>
                {submitting ? "Création…" : "Créer"}
              </button>
              <button onClick={resetForm}
                className="px-4 py-2 text-sm rounded-md"
                style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {challenges.length === 0 && (
        <div className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <Trophy size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun défi en cours</p>
          {isManager && (
            <button onClick={() => setShowForm(true)} className="mt-4 text-sm" style={{ color: "var(--accent)" }}>
              Créer le premier défi
            </button>
          )}
        </div>
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3 mb-8">
          {activeChallenges.map(challenge => {
            const progress = challenge.target_value
              ? Math.min(100, Math.round((challenge.current_value / challenge.target_value) * 100))
              : null;
            const daysLeft = challenge.ends_at
              ? Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / 86400000)
              : null;
            const isExpanded = expandedId === challenge.id;
            const isClosing = confirmClose === challenge.id;

            return (
              <div key={challenge.id} className="rounded-xl overflow-hidden"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                {/* Main card */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{challenge.title}</p>
                      {challenge.description && (
                        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--foreground-dim)" }}>
                          {challenge.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: STATUS_STYLE[challenge.status].bg, color: STATUS_STYLE[challenge.status].color }}>
                      {STATUS_LABELS[challenge.status]}
                    </span>
                  </div>

                  {progress !== null && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                          {challenge.current_value} / {challenge.target_value} {challenge.unit ?? ""}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: progress >= 100 ? "var(--success)" : "var(--accent)" }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--background-soft)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%`, background: progress >= 100 ? "var(--success)" : "var(--accent)" }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {daysLeft !== null ? (
                      <p className="text-[11px]" style={{ color: daysLeft <= 3 ? "var(--warning)" : "var(--foreground-dim)" }}>
                        {daysLeft > 0 ? `${daysLeft} jour${daysLeft !== 1 ? "s" : ""} restant${daysLeft !== 1 ? "s" : ""}` : "Délai dépassé"}
                      </p>
                    ) : <span />}

                    {isManager && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                        className="flex items-center gap-1 text-[11px] font-mono"
                        style={{ color: "var(--foreground-dim)" }}
                      >
                        Gérer {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Manager actions panel */}
                {isManager && isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "var(--background-soft)" }}>
                    {/* Update progress */}
                    {challenge.target_value !== null && (
                      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                          Mettre à jour la progression
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={progressInputs[challenge.id] ?? ""}
                            onChange={e => setProgressInputs(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                            placeholder={`Actuel : ${challenge.current_value} ${challenge.unit ?? ""}`}
                            min="0"
                            max={challenge.target_value ?? undefined}
                            className="flex-1 px-3 py-2 text-sm rounded-md outline-none"
                            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                          />
                          <button
                            onClick={() => updateProgress(challenge.id)}
                            disabled={!progressInputs[challenge.id]}
                            className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
                            style={{ background: "var(--accent)", color: "#09090B", opacity: !progressInputs[challenge.id] ? 0.4 : 1 }}
                          >
                            Mettre à jour
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Close challenge */}
                    <div className="px-5 py-4">
                      {!isClosing ? (
                        <button
                          onClick={() => setConfirmClose(challenge.id)}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md"
                          style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.25)" }}
                        >
                          <Trophy size={14} />
                          Terminer ce défi
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
                            Qui a gagné ? <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel)</span>
                          </p>
                          <input
                            value={winnerInputs[challenge.id] ?? ""}
                            onChange={e => setWinnerInputs(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                            placeholder="Ex: Yasmine Benali"
                            className="w-full px-3 py-2 text-sm rounded-md outline-none"
                            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                            onFocus={e => e.currentTarget.style.borderColor = "var(--success)"}
                            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => closeChallenge(challenge.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md"
                              style={{ background: "var(--success)", color: "#09090B" }}
                            >
                              <Trophy size={14} />
                              Clôturer le défi
                            </button>
                            <button
                              onClick={() => { setConfirmClose(null); setWinnerInputs(prev => ({ ...prev, [challenge.id]: "" })); }}
                              className="px-4 py-2 text-sm rounded-md"
                              style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed / cancelled challenges */}
      {doneChallenges.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
            Terminés
          </p>
          <div className="space-y-3">
            {doneChallenges.map(challenge => {
              const stStyle = STATUS_STYLE[challenge.status];
              return (
                <div key={challenge.id} className="rounded-xl p-5"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)", opacity: 0.7 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{challenge.title}</p>
                      {challenge.winner_name && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Trophy size={12} style={{ color: "#F59E0B" }} />
                          <span className="text-[12px] font-medium" style={{ color: "#F59E0B" }}>
                            {challenge.winner_name}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: stStyle.bg, color: stStyle.color }}>
                      {STATUS_LABELS[challenge.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
