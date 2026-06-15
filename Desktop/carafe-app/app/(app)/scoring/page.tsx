"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Trophy, BookOpen, MessageSquare, Zap, Plus, X, Award, Star, Settings2 } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;

type ScoreSource = "protocol_view" | "review_received" | "challenge_won" | "kudo_from_peer" | "kudo_from_manager" | "manual_bonus";

interface ScoreEvent {
  id: string;
  profile_id: string;
  source_type: ScoreSource;
  source_label: string | null;
  reason: string | null;
  attributed_by_name: string | null;
  points: number;
  created_at: string;
}

interface ScoringMember {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

interface ScoringSettings {
  is_enabled: boolean;
  points_protocol_view: number;
  points_review_received: number;
  points_challenge_won: number;
  points_kudo_from_peer: number;
  points_kudo_from_manager: number;
  manual_bonus_min: number;
  manual_bonus_max: number;
  podium_visible: boolean;
}

const SOURCE_CONFIG: Record<ScoreSource, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  protocol_view:     { icon: BookOpen,      color: "var(--accent)",  bg: "rgba(6,182,212,0.12)",  label: "Protocole vu" },
  review_received:   { icon: MessageSquare, color: "var(--success)", bg: "rgba(16,185,129,0.1)",  label: "Avis client reçu" },
  challenge_won:     { icon: Trophy,        color: "#F59E0B",        bg: "rgba(245,158,11,0.12)", label: "Défi remporté" },
  kudo_from_peer:    { icon: Star,          color: "#F59E0B",        bg: "rgba(245,158,11,0.08)", label: "Bravo de collègue" },
  kudo_from_manager: { icon: Award,         color: "#F59E0B",        bg: "rgba(245,158,11,0.15)", label: "Bravo du manager" },
  manual_bonus:      { icon: Zap,           color: "var(--warning)", bg: "rgba(245,158,11,0.12)", label: "Bonus" },
};

const BADGE: Record<1 | 2 | 3, { emoji: string; color: string; bg: string }> = {
  1: { emoji: "🥇", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  2: { emoji: "🥈", color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  3: { emoji: "🥉", color: "#C97B4B", bg: "rgba(201,123,75,0.12)" },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const DEV_SETTINGS: ScoringSettings = {
  is_enabled: true,
  points_protocol_view: 1,
  points_review_received: 5,
  points_challenge_won: 10,
  points_kudo_from_peer: 1,
  points_kudo_from_manager: 2,
  manual_bonus_min: 1,
  manual_bonus_max: 20,
  podium_visible: true,
};

const DEV_MEMBERS_INFO: ScoringMember[] = [
  { profile_id: "dev-user",  first_name: "Dev",     last_name: "Mode",   avatar_url: null, job_title: "Responsable" },
  { profile_id: "profile-2", first_name: "Yasmine", last_name: "Benali", avatar_url: null, job_title: "Chef de salle" },
  { profile_id: "profile-3", first_name: "Rayan",   last_name: "Dupont", avatar_url: null, job_title: "Serveur" },
];

const dA = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const DEV_EVENTS: ScoreEvent[] = [
  // Yasmine (profile-2) 68 pts
  { id:"se1",  profile_id:"profile-2", source_type:"protocol_view",     source_label:"Protocole ouverture",   reason:null, attributed_by_name:null,        points:1,  created_at:dA(25) },
  { id:"se2",  profile_id:"profile-2", source_type:"protocol_view",     source_label:"Hygiène en cuisine",    reason:null, attributed_by_name:null,        points:1,  created_at:dA(22) },
  { id:"se3",  profile_id:"profile-2", source_type:"protocol_view",     source_label:"Sécurité incendie",     reason:null, attributed_by_name:null,        points:1,  created_at:dA(18) },
  { id:"se4",  profile_id:"profile-2", source_type:"protocol_view",     source_label:"Service à table",       reason:null, attributed_by_name:null,        points:1,  created_at:dA(14) },
  { id:"se5",  profile_id:"profile-2", source_type:"protocol_view",     source_label:"Fermeture caisse",      reason:null, attributed_by_name:null,        points:1,  created_at:dA(8)  },
  { id:"se6",  profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(21) },
  { id:"se7",  profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(16) },
  { id:"se8",  profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(11) },
  { id:"se9",  profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(6)  },
  { id:"se10", profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(2)  },
  { id:"se11", profile_id:"profile-2", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(1)  },
  { id:"se12", profile_id:"profile-2", source_type:"review_received",   source_label:"Table 5",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(19) },
  { id:"se13", profile_id:"profile-2", source_type:"review_received",   source_label:"Table 12",              reason:null, attributed_by_name:null,        points:5,  created_at:dA(13) },
  { id:"se14", profile_id:"profile-2", source_type:"review_received",   source_label:"Table 8",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(7)  },
  { id:"se15", profile_id:"profile-2", source_type:"review_received",   source_label:"Table 3",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(3)  },
  { id:"se16", profile_id:"profile-2", source_type:"challenge_won",     source_label:"Défi ventes mai",       reason:null, attributed_by_name:null,        points:10, created_at:dA(9)  },
  { id:"se17", profile_id:"profile-2", source_type:"manual_bonus",      source_label:null, reason:"Gestion impeccable de la soirée privée du 10 mai", attributed_by_name:"Dev Mode", points:20, created_at:dA(10) },
  { id:"se18", profile_id:"profile-2", source_type:"kudo_from_peer",    source_label:"Rayan Dupont",          reason:null, attributed_by_name:null,        points:1,  created_at:dA(4)  },
  // 5+12+20+10+20+1 = 68 ✓

  // Dev Mode (dev-user) 45 pts
  { id:"se19", profile_id:"dev-user",  source_type:"protocol_view",     source_label:"Protocole ouverture",   reason:null, attributed_by_name:null,        points:1,  created_at:dA(24) },
  { id:"se20", profile_id:"dev-user",  source_type:"protocol_view",     source_label:"Service à table",       reason:null, attributed_by_name:null,        points:1,  created_at:dA(17) },
  { id:"se21", profile_id:"dev-user",  source_type:"protocol_view",     source_label:"Fermeture caisse",      reason:null, attributed_by_name:null,        points:1,  created_at:dA(10) },
  { id:"se22", profile_id:"dev-user",  source_type:"kudo_from_manager", source_label:"Yasmine Benali",        reason:null, attributed_by_name:null,        points:2,  created_at:dA(15) },
  { id:"se23", profile_id:"dev-user",  source_type:"kudo_from_manager", source_label:"Yasmine Benali",        reason:null, attributed_by_name:null,        points:2,  created_at:dA(8)  },
  { id:"se24", profile_id:"dev-user",  source_type:"kudo_from_manager", source_label:"Yasmine Benali",        reason:null, attributed_by_name:null,        points:2,  created_at:dA(3)  },
  { id:"se25", profile_id:"dev-user",  source_type:"review_received",   source_label:"Table 9",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(12) },
  { id:"se26", profile_id:"dev-user",  source_type:"review_received",   source_label:"Table 2",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(5)  },
  { id:"se27", profile_id:"dev-user",  source_type:"challenge_won",     source_label:"Défi satisfaction",     reason:null, attributed_by_name:null,        points:10, created_at:dA(7)  },
  { id:"se28", profile_id:"dev-user",  source_type:"manual_bonus",      source_label:null, reason:"Excellent management de l'équipe tout au long du mois", attributed_by_name:"Yasmine Benali", points:15, created_at:dA(6) },
  { id:"se29", profile_id:"dev-user",  source_type:"kudo_from_peer",    source_label:"Rayan Dupont",          reason:null, attributed_by_name:null,        points:1,  created_at:dA(2)  },
  // 3+6+10+10+15+1 = 45 ✓

  // Rayan (profile-3) 23 pts
  { id:"se30", profile_id:"profile-3", source_type:"protocol_view",     source_label:"Protocole ouverture",   reason:null, attributed_by_name:null,        points:1,  created_at:dA(20) },
  { id:"se31", profile_id:"profile-3", source_type:"protocol_view",     source_label:"Service à table",       reason:null, attributed_by_name:null,        points:1,  created_at:dA(12) },
  { id:"se32", profile_id:"profile-3", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(18) },
  { id:"se33", profile_id:"profile-3", source_type:"kudo_from_manager", source_label:"Dev Mode",              reason:null, attributed_by_name:null,        points:2,  created_at:dA(9)  },
  { id:"se34", profile_id:"profile-3", source_type:"review_received",   source_label:"Table 7",               reason:null, attributed_by_name:null,        points:5,  created_at:dA(14) },
  { id:"se35", profile_id:"profile-3", source_type:"challenge_won",     source_label:"Défi ventes mai",       reason:null, attributed_by_name:null,        points:10, created_at:dA(9)  },
  { id:"se36", profile_id:"profile-3", source_type:"kudo_from_peer",    source_label:"Yasmine Benali",        reason:null, attributed_by_name:null,        points:1,  created_at:dA(5)  },
  { id:"se37", profile_id:"profile-3", source_type:"manual_bonus",      source_label:null, reason:"Bon démarrage ce mois-ci, continue comme ça !", attributed_by_name:"Dev Mode", points:1, created_at:dA(16) },
  // 2+4+5+10+1+1 = 23 ✓
];

type ScoredMember = ScoringMember & { score: number; events: ScoreEvent[] };

export default function ScoringPage() {
  const [devRole] = useDevRole();
  const supabase = createClient();
  const [settings, setSettings] = useState<ScoringSettings | null>(null);
  const [members, setMembers] = useState<ScoringMember[]>([]);
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const [myProfileId, setMyProfileId] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("employee");
  const [estId, setEstId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) {
      setSettings(DEV_SETTINGS);
      setMembers(DEV_MEMBERS_INFO);
      setEvents(DEV_EVENTS);
      setMyProfileId(devRole === "employee" ? "profile-3" : "dev-user");
      setMyRole(devRole === "employee" ? "employee" : "owner");
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyProfileId(user.id);

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: memberData } = await _mq.limit(1).maybeSingle();
    if (!memberData && _ceid && _re.test(_ceid)) ({ data: memberData } = await supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true).limit(1).maybeSingle());
    if (!memberData) { setLoading(false); return; }

    setMyRole(memberData.role);
    setEstId(memberData.establishment_id);
    const estId = memberData.establishment_id;

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [{ data: settingsData }, { data: eventsData }, { data: membersData }] = await Promise.all([
      supabase.from("scoring_settings").select("*").eq("establishment_id", estId).maybeSingle(),
      supabase.from("score_events").select("*").eq("establishment_id", estId).gte("created_at", startOfMonth.toISOString()),
      supabase.from("establishment_members").select("profile_id, job_title, profiles(first_name, last_name, avatar_url)").eq("establishment_id", estId).eq("is_active", true),
    ]);

    setSettings(settingsData ?? DEV_SETTINGS);
    setEvents((eventsData ?? []) as ScoreEvent[]);
    setMembers(((membersData ?? []) as Array<{ profile_id: string; job_title: string | null; profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null }>)
      .map(m => ({ profile_id: m.profile_id, first_name: m.profiles?.first_name ?? null, last_name: m.profiles?.last_name ?? null, avatar_url: m.profiles?.avatar_url ?? null, job_title: m.job_title ?? null }))
    );
    setLoading(false);
  }

  if (loading || !settings) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl">
        {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse mb-4" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  if (!settings.is_enabled) {
    return (
      <div className="px-4 py-20 max-w-4xl mx-auto text-center">
        <Zap size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", margin: "0 auto 12px" }} />
        <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Le système de score est désactivé sur cet établissement.</p>
      </div>
    );
  }

  const scored: ScoredMember[] = members
    .map(m => ({
      ...m,
      score: events.filter(e => e.profile_id === m.profile_id).reduce((s, e) => s + e.points, 0),
      events: events.filter(e => e.profile_id === m.profile_id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }))
    .sort((a, b) => b.score - a.score);

  const isManager = myRole === "owner" || myRole === "manager";
  const month = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return isManager
    ? <ManagerScoringView scored={scored} settings={settings} myProfileId={myProfileId} month={month} estId={estId} onRefresh={loadData} />
    : <EmployeeScoringView scored={scored} settings={settings} myProfileId={myProfileId} month={month} />;
}

/* ─── MANAGER VIEW ─────────────────────────────────── */
function ManagerScoringView({ scored, settings, myProfileId, month, estId, onRefresh }: {
  scored: ScoredMember[];
  settings: ScoringSettings;
  myProfileId: string;
  month: string;
  estId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [actionModal, setActionModal] = useState<"bonus" | "google_review" | "challenge_won" | null>(null);
  const [actionTarget, setActionTarget] = useState<string>("");
  const [bonusPoints, setBonusPoints] = useState(5);
  const [bonusReason, setBonusReason] = useState("");
  const [googleQty, setGoogleQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const podium = scored.slice(0, 3);
  const actionTargetMember = actionTarget ? scored.find(m => m.profile_id === actionTarget) : null;

  const defaultTarget = scored.find(m => m.profile_id !== myProfileId)?.profile_id ?? "";

  async function submitAction() {
    if (!actionTarget) return;
    setSubmitting(true);

    let source_type: string;
    let points: number;
    let source_label: string | null = null;
    let reason: string | null = null;

    if (actionModal === "bonus") {
      if (bonusReason.trim().length < 10) { setSubmitting(false); return; }
      source_type = "manual_bonus";
      points = bonusPoints;
      reason = bonusReason.trim();
    } else if (actionModal === "google_review") {
      source_type = "review_received";
      points = 5 * googleQty;
      source_label = `${googleQty} avis Google`;
    } else {
      source_type = "challenge_won";
      points = settings.points_challenge_won;
      source_label = "Défi remporté";
    }

    const myName = scored.find(m => m.profile_id === myProfileId);
    const attributed_by_name = myName ? `${myName.first_name ?? ""} ${myName.last_name ?? ""}`.trim() : null;

    if (!DEV_MODE && estId) {
      await supabase.from("score_events").insert({
        establishment_id: estId,
        profile_id: actionTarget,
        source_type,
        source_label,
        reason,
        attributed_by_name,
        points,
      });
    }

    const name = actionTargetMember ? (actionTargetMember.first_name ?? "ce membre") : "ce membre";
    setSuccessMsg(`+${points} pts attribués à ${name} ✓`);
    setActionModal(null);
    setActionTarget("");
    setBonusReason("");
    setBonusPoints(5);
    setGoogleQty(1);
    setSubmitting(false);
    setTimeout(() => { setSuccessMsg(null); onRefresh(); }, 2000);
  }

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Score équipe</MonoLabel>
          <h1 className="text-2xl font-semibold capitalize" style={{ color: "var(--foreground)" }}>{month}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActionModal("google_review"); setActionTarget(defaultTarget); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg"
            style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
            ⭐ Avis Google
          </button>
          <button
            onClick={() => { setActionModal("challenge_won"); setActionTarget(defaultTarget); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg"
            style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
            🏆 Défi
          </button>
          <button
            onClick={() => { setActionModal("bonus"); setActionTarget(defaultTarget); setBonusReason(""); setBonusPoints(5); }}
            className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg"
            style={{ background: "var(--warning)", color: "var(--primary-foreground)" }}>
            <Plus size={13} /> Bonus
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--warning)" }}>
          {successMsg}
        </div>
      )}

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-5" style={{ color: "var(--foreground-dim)" }}>Podium du mois</p>
          <div className="grid grid-cols-3 gap-2 items-end">
            {[
              { member: podium[1], rank: 2 as 2, topPad: "pt-8" },
              { member: podium[0], rank: 1 as 1, topPad: "pt-0" },
              { member: podium[2], rank: 3 as 3, topPad: "pt-14" },
            ].map(({ member, rank, topPad }) => {
              const b = BADGE[rank];
              return (
                <div key={member.profile_id} className={`flex flex-col items-center text-center ${topPad}`}>
                  <div className="relative mb-2">
                    <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={rank === 1 ? 52 : 44} />
                    <span className="absolute -bottom-1 -right-1 text-lg">{b.emoji}</span>
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                    {member.first_name ?? "-"}
                  </p>
                  <p className="text-lg font-bold" style={{ color: b.color }}>{member.score}</p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <Trophy size={13} style={{ color: "var(--accent)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Classement complet</p>
        </div>
        {scored.map((m, i) => {
          const rank = (i + 1) as 1 | 2 | 3;
          const b = i < 3 ? BADGE[rank] : null;
          return (
            <div key={m.profile_id} className="px-5 py-4 flex items-center gap-3"
              style={{ background: "var(--background-elev)", borderBottom: i < scored.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="w-7 text-center flex-shrink-0">
                {b ? <span className="text-xl">{b.emoji}</span> : <span className="text-sm font-mono" style={{ color: "var(--foreground-dim)" }}>{i + 1}</span>}
              </div>
              <KarafAvatar firstName={m.first_name} lastName={m.last_name} avatarUrl={m.avatar_url} size={34} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()}
                </p>
                {m.job_title && <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{m.job_title}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: b?.color ?? "var(--foreground-dim)" }}>{m.score}</p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>pts</p>
                </div>
                {m.profile_id !== myProfileId && (
                  <button
                    onClick={() => { setBonusTarget(m.profile_id); setBonusReason(""); setBonusPoints(5); }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                    style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    Bonus
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div className="px-5 py-2.5 text-[10px] font-mono" style={{ background: "var(--background-soft)", borderTop: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
          Score = somme des points gagnés ce mois · protocoles lus, bravos reçus, défis, bonus
        </div>
      </div>

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setActionModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {actionModal === "google_review" && "⭐ Avis Google"}
                {actionModal === "challenge_won" && "🏆 Défi remporté"}
                {actionModal === "bonus" && "💛 Bonus manuel"}
              </p>
              <button onClick={() => setActionModal(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Membre</label>
              <select value={actionTarget} onChange={e => setActionTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {scored.map(m => (
                  <option key={m.profile_id} value={m.profile_id}>
                    {`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.profile_id}
                  </option>
                ))}
              </select>
            </div>

            {actionModal === "google_review" && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                  Nombre d&apos;avis · <span style={{ color: "var(--accent)" }}>+{5 * googleQty} pts</span>
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setGoogleQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>−</button>
                  <span className="text-3xl font-bold flex-1 text-center" style={{ color: "var(--accent)" }}>{googleQty}</span>
                  <button onClick={() => setGoogleQty(q => q + 1)}
                    className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>+</button>
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: "var(--foreground-dim)" }}>5 pts par avis</p>
              </div>
            )}

            {actionModal === "challenge_won" && (
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-3xl font-bold" style={{ color: "#F59E0B" }}>+{settings.points_challenge_won}</p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>points pour le défi remporté</p>
              </div>
            )}

            {actionModal === "bonus" && (
              <>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                    Points ({settings.manual_bonus_min}–{settings.manual_bonus_max})
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={settings.manual_bonus_min} max={settings.manual_bonus_max} value={bonusPoints}
                      onChange={e => setBonusPoints(parseInt(e.target.value))}
                      className="flex-1" style={{ accentColor: "var(--warning)" }} />
                    <span className="text-2xl font-bold w-14 text-right" style={{ color: "var(--warning)" }}>+{bonusPoints}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                    Motif {bonusReason.length > 0 && bonusReason.length < 10 && <span style={{ color: "var(--danger)" }}>(min. 10 car.)</span>}
                  </label>
                  <textarea value={bonusReason} onChange={e => setBonusReason(e.target.value)}
                    placeholder="Ex: Excellent travail lors de la soirée privée…"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
              </>
            )}

            <button
              onClick={submitAction}
              disabled={submitting || (actionModal === "bonus" && bonusReason.trim().length < 10)}
              className="w-full py-3 text-sm font-semibold rounded-lg"
              style={{ background: actionModal === "bonus" ? "var(--warning)" : "var(--accent)", color: "#fff", opacity: (submitting || (actionModal === "bonus" && bonusReason.trim().length < 10)) ? 0.5 : 1 }}>
              {submitting ? "Envoi…" : actionModal === "google_review" ? `Attribuer +${5 * googleQty} pts` : actionModal === "challenge_won" ? `Attribuer +${settings.points_challenge_won} pts` : `Attribuer +${bonusPoints} pts`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── EMPLOYEE VIEW ────────────────────────────────── */
function EmployeeScoringView({ scored, settings, myProfileId, month }: {
  scored: ScoredMember[];
  settings: ScoringSettings;
  myProfileId: string;
  month: string;
}) {
  const me = scored.find(m => m.profile_id === myProfileId);
  const myRank = scored.findIndex(m => m.profile_id === myProfileId) + 1;
  const myBadge = myRank >= 1 && myRank <= 3 ? BADGE[myRank as 1 | 2 | 3] : null;
  const myEvents = me?.events ?? [];
  const podium = scored.slice(0, 3);

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl pb-24">
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Mon score</MonoLabel>
        <h1 className="text-2xl font-semibold capitalize" style={{ color: "var(--foreground)" }}>{month}</h1>
      </div>

      {/* Score card */}
      <div className="rounded-2xl p-6 mb-4"
        style={{ background: "var(--background-elev)", border: `1px solid ${myBadge ? myBadge.bg : "var(--border)"}` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Ton score ce mois</p>
          {myBadge && <span className="text-2xl">{myBadge.emoji}</span>}
        </div>
        <p className="text-6xl font-bold leading-none mb-2" style={{ color: myBadge?.color ?? "var(--accent)" }}>
          {me?.score ?? 0}
        </p>
        <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>
          point{(me?.score ?? 0) !== 1 ? "s" : ""} ·{" "}
          {myRank > 0 ? `${myRank}${myRank === 1 ? "er" : "ème"} sur ${scored.length}` : "-"}
        </p>
        {myEvents.length === 0 && (
          <p className="text-sm mt-4 pt-4" style={{ color: "var(--foreground-dim)", borderTop: "1px solid var(--border)" }}>
            Le mois commence. Lance-toi ! 🚀
          </p>
        )}
      </div>

      {/* Podium */}
      {settings.podium_visible && podium.length >= 2 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Podium du mois</p>
          <div className="space-y-2">
            {podium.map((m, i) => {
              const rank = (i + 1) as 1 | 2 | 3;
              const b = BADGE[rank];
              const isMe = m.profile_id === myProfileId;
              return (
                <div key={m.profile_id} className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: isMe ? "rgba(6,182,212,0.05)" : "var(--background-soft)" }}>
                  <span className="text-lg w-6 text-center flex-shrink-0">{b.emoji}</span>
                  <KarafAvatar firstName={m.first_name} lastName={m.last_name} avatarUrl={m.avatar_url} size={28} />
                  <p className="text-sm flex-1" style={{ color: "var(--foreground)", fontWeight: isMe ? 600 : 400 }}>
                    {m.first_name ?? "-"}{isMe ? " (toi)" : ""}
                  </p>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: b.color }}>{m.score} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events timeline */}
      {myEvents.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Mes gains récents</p>
          <div className="space-y-2">
            {myEvents.slice(0, 10).map(event => {
              const cfg = SOURCE_CONFIG[event.source_type];
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{cfg.label}</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                      {event.source_label
                        ? event.source_label
                        : event.reason
                          ? `"${event.reason.slice(0, 48)}${event.reason.length > 48 ? "…" : ""}"`
                          : "-"}
                      {" · "}{relTime(event.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>+{event.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
