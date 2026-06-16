"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { Plus, Users, Star, ThumbsUp, ThumbsDown, X, Camera, ChevronRight, Zap, Search, Copy, Check, Clock, Calendar, ChevronDown, Trophy } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/lib/types/database";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type ContractType = "cdi" | "cdd" | "extra" | null;

interface AvailabilitySlot {
  day: string;
  period: string;
  hour_start?: string;
  hour_end?: string;
}

interface TeamMember {
  id: string;
  profile_id: string;
  role: UserRole;
  job_title: string | null;
  hired_at: string | null;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  phone?: string | null;
  contract_type?: ContractType;
  availability?: AvailabilitySlot[];
}

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const PERIODS_FR = ["Matin", "Après-midi", "Soir"];
const HOURS_FR = ["7h", "8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h", "23h"];
const CONTRACT_LABELS: Record<string, string> = { cdi: "CDI", cdd: "CDD", extra: "Extra" };

interface Kudos {
  id: string;
  to_profile_id: string;
  message: string;
  type: "positive" | "negative";
  photo_url?: string | null;
  from_name: string;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Propriétaire",
  manager: "Manager",
  employee: "Employé",
};

const ROLE_STYLE: Record<UserRole, { bg: string; color: string }> = {
  owner: { bg: "rgba(6,182,212,0.1)", color: "var(--accent)" },
  manager: { bg: "rgba(161,161,170,0.1)", color: "var(--foreground-dim)" },
  employee: { bg: "rgba(161,161,170,0.1)", color: "var(--foreground-dim)" },
};

const DEV_MEMBERS: TeamMember[] = [
  { id: "m1", profile_id: DEV_PROFILE_ID, role: "owner", job_title: "Responsable", hired_at: "2022-03-01", is_active: true, first_name: "Dev", last_name: "Mode", email: "dev@carafe.app", avatar_url: null, contract_type: "cdi", phone: null, availability: [] },
  { id: "m2", profile_id: "profile-2", role: "manager", job_title: "Chef de salle", hired_at: "2023-01-15", is_active: true, first_name: "Yasmine", last_name: "Benali", email: "yasmine@restaurant.fr", avatar_url: null, contract_type: "cdi", phone: "06 12 34 56 78", availability: [] },
  { id: "m3", profile_id: "profile-3", role: "employee", job_title: "Serveur", hired_at: "2024-06-01", is_active: true, first_name: "Rayan", last_name: "Dupont", email: "rayan@restaurant.fr", avatar_url: null, contract_type: "extra", phone: "06 98 76 54 32", availability: [{ day: "Vendredi", period: "Soir", hour_start: "18h", hour_end: "23h" }, { day: "Samedi", period: "Soir", hour_start: "18h", hour_end: "23h" }, { day: "Dimanche", period: "Matin", hour_start: "9h", hour_end: "13h" }] },
  { id: "m4", profile_id: "profile-4", role: "employee", job_title: "Serveuse", hired_at: "2024-09-01", is_active: true, first_name: "Léa", last_name: "Martin", email: "lea@restaurant.fr", avatar_url: null, contract_type: "cdd", phone: "07 11 22 33 44", availability: [{ day: "Samedi", period: "Matin", hour_start: "9h", hour_end: "14h" }, { day: "Samedi", period: "Après-midi", hour_start: "14h", hour_end: "19h" }, { day: "Dimanche", period: "Matin", hour_start: "9h", hour_end: "13h" }] },
];

const DEV_KUDOS: Kudos[] = [
  { id: "k1", to_profile_id: "profile-2", message: "Excellent service ce soir, les clients ont adoré.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "k2", to_profile_id: "profile-3", message: "Bonne réactivité pendant le rush.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
];

export default function TeamPage() {
  const supabase = useRef(createClient()).current;
  const [devRole] = useDevRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [kudosList, setKudosList] = useState<Kudos[]>(DEV_MODE ? DEV_KUDOS : []);
  const [role, setRole] = useState<string>("employee");
  const [myProfileId, setMyProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("employee");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; email: string | null; first_name: string | null; last_name: string | null; job_title: string | null; staff_status: string | null; role: string; created_at: string }>>([]);
  const [kudosTarget, setKudosTarget] = useState<TeamMember | null>(null);
  const [kudosType, setKudosType] = useState<"positive" | "negative">("positive");
  const [kudosMessage, setKudosMessage] = useState("");
  const [kudosPhotoFile, setKudosPhotoFile] = useState<File | null>(null);
  const [kudosPhotoPreview, setKudosPhotoPreview] = useState<string | null>(null);
  const [sendingKudos, setSendingKudos] = useState(false);
  const [expandedKudos, setExpandedKudos] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [bonusTarget, setBonusTarget] = useState<TeamMember | null>(null);
  const [bonusPoints, setBonusPoints] = useState(5);
  const [bonusReason, setBonusReason] = useState("");
  const [sendingBonus, setSendingBonus] = useState(false);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);
  // Scoring dropdown + modals
  const [scoreDropdownOpen, setScoreDropdownOpen] = useState<string | null>(null);
  const [scoreModal, setScoreModal] = useState<"review" | "challenge" | null>(null);
  const [scoreTarget, setScoreTarget] = useState<TeamMember | null>(null);
  const [reviewQty, setReviewQty] = useState(1);
  const [sendingScore, setSendingScore] = useState(false);
  const [scoringSettings, setScoringSettings] = useState<{ points_challenge_won: number } | null>(null);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "availability">("name");
  const [availDay, setAvailDay] = useState("");
  const [availPeriod, setAvailPeriod] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteContract, setInviteContract] = useState<ContractType>(null);
  const [inviteJobTitle, setInviteJobTitle] = useState("");
  const [inviteStaffStatus, setInviteStaffStatus] = useState("");
  const [inviteHourlyRate, setInviteHourlyRate] = useState("");
  const [inviteWeeklyHours, setInviteWeeklyHours] = useState("");
  const [inviteAvailDays, setInviteAvailDays] = useState<string[]>([]);
  const [inviteAvailPeriods, setInviteAvailPeriods] = useState<string[]>([]);
  const [inviteAvailHourStart, setInviteAvailHourStart] = useState("9h");
  const [inviteAvailHourEnd, setInviteAvailHourEnd] = useState("18h");
  const [showAvailability, setShowAvailability] = useState(false);

  useEffect(() => {
    if (DEV_MODE) { setRole(devRole); setMembers(DEV_MEMBERS); setLoading(false); return; }
    loadData();
  }, [devRole]);

  async function loadPendingInvites(estabId: string) {
    const res = await fetch(`/api/invitations?establishment_id=${estabId}`);
    if (res.ok) {
      const data = await res.json();
      setPendingInvites(data.invitations ?? []);
    }
  }

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
    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);
    if (memberData.role === "owner" || memberData.role === "manager") {
      loadPendingInvites(memberData.establishment_id);
    }

    const { data } = await supabase
      .from("establishment_members")
      .select("id, profile_id, role, job_title, hired_at, is_active, profiles(first_name, last_name, email, avatar_url, phone, contract_type, availability)")
      .eq("establishment_id", memberData.establishment_id)
      .order("joined_at", { ascending: true });

    const mapped: TeamMember[] = (data ?? []).map((m: {
      id: string; profile_id: string; role: UserRole; job_title: string | null; hired_at: string | null; is_active: boolean;
      profiles: { first_name: string | null; last_name: string | null; email: string; avatar_url: string | null; phone?: string | null; contract_type?: string | null; availability?: AvailabilitySlot[] | null } | null;
    }) => ({
      id: m.id, profile_id: m.profile_id, role: m.role, job_title: m.job_title, hired_at: m.hired_at, is_active: m.is_active,
      first_name: m.profiles?.first_name ?? null, last_name: m.profiles?.last_name ?? null,
      email: m.profiles?.email ?? "", avatar_url: m.profiles?.avatar_url ?? null,
      phone: m.profiles?.phone ?? null, contract_type: m.profiles?.contract_type ?? null,
      availability: (m.profiles?.availability ?? []) as AvailabilitySlot[],
    }));
    setMembers(mapped);

    // Load scoring settings
    const { data: scoreSettings } = await supabase
      .from("scoring_settings")
      .select("points_challenge_won")
      .eq("establishment_id", memberData.establishment_id)
      .maybeSingle();
    if (scoreSettings) setScoringSettings(scoreSettings);

    setLoading(false);
  }

  const isManager = role === "owner" || role === "manager";

  const toggleActive = async (memberId: string, currentActive: boolean) => {
    if (DEV_MODE) { setMembers(prev => prev.map(m => m.id === memberId ? { ...m, is_active: !currentActive } : m)); return; }
    await supabase.from("establishment_members").update({ is_active: !currentActive }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, is_active: !currentActive } : m));
  };

  const sendKudos = async () => {
    if (!kudosTarget || !kudosMessage.trim()) return;
    setSendingKudos(true);

    const myName = members.find(m => m.profile_id === myProfileId);
    const fromName = myName ? `${myName.first_name ?? ""} ${myName.last_name ?? ""}`.trim() : "Manager";

    let photoUrl: string | null = null;

    if (kudosPhotoFile) {
      if (DEV_MODE) {
        photoUrl = kudosPhotoPreview;
      } else {
        const ext = kudosPhotoFile.name.split(".").pop();
        const path = `kudos/${Date.now()}.${ext}`;
        const { data: uploadData } = await supabase.storage.from("kudos-photos").upload(path, kudosPhotoFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("kudos-photos").getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }
    }

    const newKudos: Kudos = {
      id: `k-${Date.now()}`,
      to_profile_id: kudosTarget.profile_id,
      message: kudosMessage,
      type: kudosType,
      photo_url: photoUrl,
      from_name: fromName,
      created_at: new Date().toISOString(),
    };

    setKudosList(prev => [newKudos, ...prev]);
    setKudosTarget(null);
    setKudosMessage("");
    setKudosType("positive");
    setKudosPhotoFile(null);
    if (kudosPhotoPreview) URL.revokeObjectURL(kudosPhotoPreview);
    setKudosPhotoPreview(null);
    setSendingKudos(false);
  };

  const myName = () => {
    const me = members.find(m => m.profile_id === myProfileId);
    return me ? `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || "Manager" : "Manager";
  };

  const submitBonus = async () => {
    if (!bonusTarget || bonusReason.trim().length < 10) return;
    setSendingBonus(true);
    if (!DEV_MODE) {
      await supabase.from("score_events").insert({
        establishment_id: establishmentId,
        profile_id: bonusTarget.profile_id,
        source_type: "manual_bonus",
        source_label: "Bonus manuel",
        reason: bonusReason,
        attributed_by_name: myName(),
        points: bonusPoints,
      });
    }
    setBonusSuccess(`+${bonusPoints} pts attribués à ${bonusTarget.first_name ?? bonusTarget.email} ✓`);
    setBonusTarget(null);
    setBonusReason("");
    setBonusPoints(5);
    setSendingBonus(false);
    setTimeout(() => setBonusSuccess(null), 3000);
  };

  const submitScore = async (type: "review" | "challenge") => {
    if (!scoreTarget) return;
    setSendingScore(true);
    const pts = type === "review" ? reviewQty * 5 : (scoringSettings?.points_challenge_won ?? 20);
    const label = type === "review" ? `${reviewQty} avis Google` : "Défi remporté";
    const sourceType = type === "review" ? "google_review" : "challenge_won";
    if (!DEV_MODE) {
      await supabase.from("score_events").insert({
        establishment_id: establishmentId,
        profile_id: scoreTarget.profile_id,
        source_type: sourceType,
        source_label: label,
        reason: label,
        attributed_by_name: myName(),
        points: pts,
      });
    }
    setBonusSuccess(`+${pts} pts attribués à ${scoreTarget.first_name ?? scoreTarget.email} ✓`);
    setScoreModal(null);
    setScoreTarget(null);
    setReviewQty(1);
    setSendingScore(false);
    setTimeout(() => setBonusSuccess(null), 3000);
  };

  const sendInvite = async () => {
    setInviting(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        establishment_id: establishmentId,
        role: inviteRole,
        email: inviteEmail || null,
        first_name: inviteFirstName || null,
        last_name: inviteLastName || null,
        phone: invitePhone || null,
        job_title: inviteJobTitle || null,
        staff_status: inviteStaffStatus || null,
        hourly_rate: inviteHourlyRate ? parseFloat(inviteHourlyRate) : null,
        contract_type: inviteContract || null,
        weekly_hours: inviteWeeklyHours ? parseInt(inviteWeeklyHours) : null,
      }),
    });
    const data = await res.json();
    setInviting(false);
    if (res.ok) {
      setInviteLink(data.link);
      setInviteEmail("");
      loadPendingInvites(establishmentId);
    }
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-20 animate-pulse mb-3" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  const activeMembers = members.filter(m => m.is_active).filter(m => {
    if (searchMode === "availability" && (availDay || availPeriod)) {
      const av = m.availability ?? [];
      if (availDay && availPeriod) return av.some(s => s.day === availDay && s.period === availPeriod);
      if (availDay) return av.some(s => s.day === availDay);
      if (availPeriod) return av.some(s => s.period === availPeriod);
    }
    return !search || `${m.first_name ?? ""} ${m.last_name ?? ""}`.toLowerCase().includes(searchLower) || m.email.toLowerCase().includes(searchLower);
  });
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      {/* Bonus success toast */}
      {bonusSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: "rgba(245,158,11,0.95)", color: "var(--primary-foreground)" }}>
          {bonusSuccess}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Équipe</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Équipe</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
            {members.filter(m => m.is_active).length} membre{members.filter(m => m.is_active).length !== 1 ? "s" : ""} actif{members.filter(m => m.is_active).length !== 1 ? "s" : ""}
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
            style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
            <Plus size={14} /> Inviter
          </button>
        )}
      </div>

      {/* Search mode toggle */}
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => setSearchMode("name")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" style={{ background: searchMode === "name" ? "rgba(6,182,212,0.12)" : "var(--background-elev)", color: searchMode === "name" ? "var(--accent)" : "var(--foreground-dim)", border: searchMode === "name" ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)" }}>
          <Search size={11} /> Nom
        </button>
        <button onClick={() => setSearchMode("availability")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" style={{ background: searchMode === "availability" ? "rgba(6,182,212,0.12)" : "var(--background-elev)", color: searchMode === "availability" ? "var(--accent)" : "var(--foreground-dim)", border: searchMode === "availability" ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)" }}>
          <Calendar size={11} /> Disponibilité
        </button>
      </div>

      {searchMode === "name" ? (
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--foreground-dim)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un membre…" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }}><X size={13} /></button>}
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-6" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.25)" }}>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>Rechercher par disponibilité</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] mb-1" style={{ color: "var(--foreground-dim)" }}>Jour</label>
              <select value={availDay} onChange={e => setAvailDay(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <option value="">Tous les jours</option>
                {DAYS_FR.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] mb-1" style={{ color: "var(--foreground-dim)" }}>Période</label>
              <select value={availPeriod} onChange={e => setAvailPeriod(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <option value="">Toute la journée</option>
                {PERIODS_FR.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {(availDay || availPeriod) && (
            <p className="text-[11px] mt-2" style={{ color: "var(--foreground-dim)" }}>
              {activeMembers.length} membre{activeMembers.length !== 1 ? "s" : ""} disponible{activeMembers.length !== 1 ? "s" : ""}
              {availDay && ` le ${availDay}`}{availPeriod && ` (${availPeriod})`}
            </p>
          )}
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && isManager && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Inviter un membre</p>
            <button onClick={() => { setShowInviteForm(false); setInviteLink(null); }} style={{ color: "var(--foreground-dim)" }}><X size={16} /></button>
          </div>

          {inviteLink ? (
            <div className="space-y-3">
              <p className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                Lien d&apos;invitation généré. Envoie-le par WhatsApp, SMS ou email.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-mono flex-1 truncate" style={{ color: "var(--foreground-dim)" }}>{inviteLink}</p>
                <button onClick={() => copyLink(inviteLink)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium flex-shrink-0 transition-colors"
                  style={{ background: copied ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.1)", color: copied ? "var(--success)" : "var(--accent)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(6,182,212,0.25)"}` }}>
                  {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
                </button>
              </div>
              <button onClick={() => setInviteLink(null)}
                className="text-[12px] px-3 py-1.5 rounded-md"
                style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                Générer un autre lien
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Nom / Prénom */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Prénom</label>
                  <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="Prénom"
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Nom</label>
                  <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Nom de famille"
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Email <span style={{ color: "var(--foreground-dim)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
                </label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="collègue@restaurant.fr"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Téléphone <span style={{ color: "var(--foreground-dim)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
                </label>
                <input type="tel" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} placeholder="06 XX XX XX XX"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>

              {/* Poste + Statut */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Poste</label>
                  <input type="text" value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)} placeholder="Ex: Serveur, Chef..."
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Statut</label>
                  <select value={inviteStaffStatus} onChange={e => setInviteStaffStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    <option value="">Non précisé</option>
                    <option value="chef_de_rang">Chef de rang</option>
                    <option value="serveur">Serveur</option>
                    <option value="cuisinier">Cuisinier</option>
                    <option value="commis">Commis</option>
                    <option value="barman">Barman</option>
                    <option value="plongeur">Plongeur</option>
                    <option value="responsable">Responsable</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Contrat + Rôle */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Contrat</label>
                  <select value={inviteContract ?? ""} onChange={e => setInviteContract((e.target.value || null) as ContractType)}
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    <option value="">Non précisé</option>
                    <option value="cdi">CDI</option>
                    <option value="cdd">CDD</option>
                    <option value="extra">Extra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Rôle</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    <option value="employee">Employé</option>
                    {role === "owner" && <option value="manager">Manager</option>}
                  </select>
                </div>
              </div>

              {/* Taux horaire net → brut auto + Heures/sem */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Taux horaire NET (€)</label>
                  <input type="number" min="0" step="0.01" value={inviteHourlyRate} onChange={e => setInviteHourlyRate(e.target.value)} placeholder="Ex: 9.76"
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                  {inviteHourlyRate && parseFloat(inviteHourlyRate) > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                        Brut : <span className="font-mono font-semibold" style={{ color: "var(--foreground)" }}>{(parseFloat(inviteHourlyRate) / 0.78).toFixed(2)} €/h</span>
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                        Coût employeur : <span className="font-mono font-semibold" style={{ color: "#F59E0B" }}>{(parseFloat(inviteHourlyRate) / 0.78 * 1.45).toFixed(2)} €/h</span>
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Heures / sem</label>
                  <input type="number" min="0" max="60" value={inviteWeeklyHours} onChange={e => setInviteWeeklyHours(e.target.value)} placeholder="Ex: 35"
                    className="w-full px-3 py-2 text-sm rounded-md outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                  {inviteHourlyRate && inviteWeeklyHours && parseFloat(inviteHourlyRate) > 0 && parseInt(inviteWeeklyHours) > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                        Net/mois : <span className="font-mono font-semibold" style={{ color: "var(--foreground)" }}>{(parseFloat(inviteHourlyRate) * parseInt(inviteWeeklyHours) * 52 / 12).toFixed(0)} €</span>
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                        Coût/mois : <span className="font-mono font-semibold" style={{ color: "#F59E0B" }}>{(parseFloat(inviteHourlyRate) / 0.78 * 1.45 * parseInt(inviteWeeklyHours) * 52 / 12).toFixed(0)} €</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Disponibilités — visible pour tous */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAvailability(v => !v)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <label className="text-[11px] font-mono uppercase tracking-widest cursor-pointer" style={{ color: "var(--foreground-dim)" }}>
                    Disponibilités <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel)</span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: showAvailability ? "rgba(6,182,212,0.12)" : "var(--background-soft)", color: showAvailability ? "var(--accent)" : "var(--foreground-dim)" }}>
                    {showAvailability ? "Masquer ▲" : "Ajouter ▼"}
                  </span>
                </button>

                {showAvailability && (
                  <div className="mt-2 p-3 rounded-xl space-y-3" style={{ background: "var(--background-soft)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    {/* Jours */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Jours</p>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_FR.map(d => {
                          const active = inviteAvailDays.includes(d);
                          return (
                            <button key={d} type="button" onClick={() => setInviteAvailDays(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                              style={{ background: active ? "rgba(6,182,212,0.15)" : "var(--background-elev)", color: active ? "var(--accent)" : "var(--foreground-dim)", border: active ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
                              {d.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Périodes */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Créneaux</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PERIODS_FR.map(p => {
                          const active = inviteAvailPeriods.includes(p);
                          return (
                            <button key={p} type="button" onClick={() => setInviteAvailPeriods(prev => active ? prev.filter(x => x !== p) : [...prev, p])}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                              style={{ background: active ? "rgba(6,182,212,0.15)" : "var(--background-elev)", color: active ? "var(--accent)" : "var(--foreground-dim)", border: active ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Heures */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Horaires</p>
                      <div className="flex items-center gap-2">
                        <select value={inviteAvailHourStart} onChange={e => setInviteAvailHourStart(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                          {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-sm" style={{ color: "var(--foreground-dim)" }}>→</span>
                        <select value={inviteAvailHourEnd} onChange={e => setInviteAvailHourEnd(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                          {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      {inviteAvailHourStart && inviteAvailHourEnd && (
                        <p className="text-[11px] mt-1.5" style={{ color: "var(--accent)" }}>
                          Disponible de {inviteAvailHourStart} à {inviteAvailHourEnd}
                          {inviteAvailDays.length > 0 && ` · ${inviteAvailDays.join(", ")}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={sendInvite} disabled={inviting}
                className="w-full py-2.5 text-sm font-medium rounded-md transition-opacity flex items-center justify-center gap-2"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: inviting ? 0.5 : 1 }}>
                {inviting ? "Génération…" : <><Plus size={14} /> Générer le lien d&apos;invitation</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending invitations */}
      {isManager && pendingInvites.length > 0 && (
        <div className="mb-6">
          <MonoLabel size="xs" className="mb-3 block">En attente ({pendingInvites.length})</MonoLabel>
          <div className="space-y-2">
            {pendingInvites.map(inv => {
              const name = [inv.first_name, inv.last_name].filter(Boolean).join(" ") || null;
              return (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                  <Clock size={13} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    {name && (
                      <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>{name}</p>
                    )}
                    <p className="text-[12px] truncate" style={{ color: "var(--foreground-dim)" }}>
                      {inv.job_title ?? inv.email ?? "Lien sans email"}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: inv.role === "manager" ? "rgba(161,161,170,0.12)" : "rgba(161,161,170,0.08)", color: inv.role === "manager" ? "var(--foreground-muted)" : "var(--foreground-dim)" }}>
                    {inv.role === "manager" ? "Manager" : "Employé"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <Users size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun membre pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2 mb-10">
          {activeMembers.map(member => {
            const memberKudos = kudosList.filter(k => k.to_profile_id === member.profile_id);
            const positiveCount = memberKudos.filter(k => k.type === "positive").length;
            const isExpanded = expandedKudos === member.profile_id;

            return (
              <div key={member.id} className="rounded-xl overflow-hidden"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <Link href={`/team/${member.profile_id}`} className="flex-shrink-0">
                    <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={38} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={`/team/${member.profile_id}`} className="text-sm font-medium truncate hover:underline min-w-0" style={{ color: "var(--foreground)" }}>
                        {(member.first_name || member.last_name) ? `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() : member.email}
                      </Link>
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: ROLE_STYLE[member.role].bg, color: ROLE_STYLE[member.role].color }}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {member.job_title && <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>{member.job_title}</span>}
                      {member.contract_type && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: member.contract_type === "extra" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.08)",
                            color: member.contract_type === "extra" ? "var(--warning)" : "var(--accent)",
                          }}>
                          {CONTRACT_LABELS[member.contract_type]}
                        </span>
                      )}
                      {positiveCount > 0 && (
                        <button onClick={() => setExpandedKudos(isExpanded ? null : member.profile_id)}
                          className="flex items-center gap-1 text-[11px]"
                          style={{ color: "#F59E0B" }}>
                          <Star size={10} fill="#F59E0B" /> {positiveCount} bravo{positiveCount > 1 ? "s" : ""}
                        </button>
                      )}
                      {member.availability && member.availability.length > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                          {member.availability.slice(0, 2).map(s => {
                            const h = s.hour_start && s.hour_end ? ` ${s.hour_start}-${s.hour_end}` : "";
                            return `${s.day.slice(0, 3)}${h}`;
                          }).join(" · ")}
                          {member.availability.length > 2 && ` +${member.availability.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/team/${member.profile_id}`}
                    className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                    style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                    <ChevronRight size={13} />
                  </Link>
                </div>
                {isManager && member.profile_id !== myProfileId && (
                  <div className="px-4 pb-3 flex gap-2 items-center" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <button onClick={() => { setKudosTarget(member); setKudosMessage(""); setKudosType("positive"); }}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                      Bravo
                    </button>
                    {/* Points dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setScoreDropdownOpen(scoreDropdownOpen === member.profile_id ? null : member.profile_id)}
                        className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
                        style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.25)" }}>
                        <Zap size={11} /> Points <ChevronDown size={10} />
                      </button>
                      {scoreDropdownOpen === member.profile_id && (
                        <div className="absolute left-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-xl min-w-[170px]"
                          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                          <button
                            onClick={() => { setScoreTarget(member); setReviewQty(1); setScoreModal("review"); setScoreDropdownOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-left hover:bg-[rgba(6,182,212,0.07)] transition-colors">
                            <Star size={13} style={{ color: "#F59E0B" }} fill="#F59E0B" />
                            <span style={{ color: "var(--foreground)" }}>Avis Google</span>
                            <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--foreground-dim)" }}>×5 pts</span>
                          </button>
                          <div style={{ height: 1, background: "var(--border)" }} />
                          <button
                            onClick={() => { setScoreTarget(member); setScoreModal("challenge"); setScoreDropdownOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-left hover:bg-[rgba(6,182,212,0.07)] transition-colors">
                            <Trophy size={13} style={{ color: "var(--accent)" }} />
                            <span style={{ color: "var(--foreground)" }}>Défi remporté</span>
                            <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--foreground-dim)" }}>{scoringSettings?.points_challenge_won ?? 20} pts</span>
                          </button>
                          <div style={{ height: 1, background: "var(--border)" }} />
                          <button
                            onClick={() => { setBonusTarget(member); setBonusPoints(5); setBonusReason(""); setScoreDropdownOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-left hover:bg-[rgba(6,182,212,0.07)] transition-colors">
                            <Zap size={13} style={{ color: "var(--warning)" }} />
                            <span style={{ color: "var(--foreground)" }}>Bonus libre</span>
                            <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--foreground-dim)" }}>1–20 pts</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleActive(member.id, true)}
                      className="ml-auto text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      Retirer
                    </button>
                  </div>
                )}

                {/* Kudos list for this member */}
                {isExpanded && memberKudos.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "var(--background-soft)" }}>
                    {memberKudos.map(k => (
                      <div key={k.id} className="px-4 py-3 flex items-start gap-2.5"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        {k.type === "positive"
                          ? <ThumbsUp size={13} style={{ color: "var(--success)", marginTop: 2, flexShrink: 0 }} />
                          : <ThumbsDown size={13} style={{ color: "var(--danger)", marginTop: 2, flexShrink: 0 }} />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-snug" style={{ color: "var(--foreground-muted)" }}>{k.message}</p>
                          {k.photo_url && (
                            <div className="mt-2 rounded-lg overflow-hidden" style={{ maxHeight: 120 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={k.photo_url} alt="photo" className="w-full object-cover" style={{ maxHeight: 120 }} />
                            </div>
                          )}
                          <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--foreground-dim)" }}>
                            {k.from_name} · {new Date(k.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isManager && inactiveMembers.length > 0 && (
            <>
              <div className="pt-4 pb-2"><MonoLabel size="xs">Inactifs ({inactiveMembers.length})</MonoLabel></div>
              {inactiveMembers.map(member => (
                <div key={member.id} className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)", opacity: 0.5 }}>
                  <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {(member.first_name || member.last_name) ? `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() : member.email}
                    </p>
                  </div>
                  <button onClick={() => toggleActive(member.id, member.is_active)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md"
                    style={{ background: "rgba(16,185,129,0.08)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    Activer
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Kudos modal */}
      {kudosTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { if (kudosPhotoPreview) URL.revokeObjectURL(kudosPhotoPreview); setKudosPhotoFile(null); setKudosPhotoPreview(null); setKudosTarget(null); } }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Bravo pour {kudosTarget.first_name ?? kudosTarget.email}
                </p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{kudosTarget.job_title ?? ROLE_LABELS[kudosTarget.role]}</p>
              </div>
              <button onClick={() => { if (kudosPhotoPreview) URL.revokeObjectURL(kudosPhotoPreview); setKudosPhotoFile(null); setKudosPhotoPreview(null); setKudosTarget(null); }}
                style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>

            {/* Positive / Negative toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setKudosType("positive")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: kudosType === "positive" ? "rgba(16,185,129,0.12)" : "var(--background-soft)",
                  color: kudosType === "positive" ? "var(--success)" : "var(--foreground-dim)",
                  border: `1px solid ${kudosType === "positive" ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                }}>
                <ThumbsUp size={14} /> Positif
              </button>
              <button onClick={() => setKudosType("negative")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: kudosType === "negative" ? "rgba(239,68,68,0.08)" : "var(--background-soft)",
                  color: kudosType === "negative" ? "var(--danger)" : "var(--foreground-dim)",
                  border: `1px solid ${kudosType === "negative" ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
                }}>
                <ThumbsDown size={14} /> À améliorer
              </button>
            </div>

            <textarea
              value={kudosMessage}
              onChange={e => setKudosMessage(e.target.value)}
              placeholder={kudosType === "positive" ? "Ex: Excellent service ce soir, les clients ont adoré..." : "Ex: Attention à la rapidité pendant le rush..."}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none mb-3"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = kudosType === "positive" ? "var(--success)" : "var(--danger)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
              autoFocus
            />

            {/* Photo attachment */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (kudosPhotoPreview) URL.revokeObjectURL(kudosPhotoPreview);
                setKudosPhotoFile(file);
                setKudosPhotoPreview(URL.createObjectURL(file));
              }}
            />
            {kudosPhotoPreview ? (
              <div className="relative mb-4 rounded-xl overflow-hidden" style={{ maxHeight: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kudosPhotoPreview} alt="aperçu" className="w-full object-cover" style={{ maxHeight: 160 }} />
                <button
                  onClick={() => { URL.revokeObjectURL(kudosPhotoPreview); setKudosPhotoPreview(null); setKudosPhotoFile(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <X size={13} style={{ color: "#fff" }} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 text-[12px] mb-4 px-3 py-2 rounded-lg w-full transition-opacity hover:opacity-75"
                style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                <Camera size={14} />
                Ajouter une photo (optionnel)
              </button>
            )}

            <button onClick={sendKudos} disabled={sendingKudos || !kudosMessage.trim()}
              className="w-full py-3 text-sm font-semibold rounded-lg transition-opacity"
              style={{
                background: kudosType === "positive" ? "var(--success)" : "var(--danger)",
                color: "#fff",
                opacity: (sendingKudos || !kudosMessage.trim()) ? 0.5 : 1,
              }}>
              {sendingKudos ? "Envoi…" : kudosType === "positive" ? "Envoyer le Bravo" : "Envoyer le feedback"}
            </button>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {scoreDropdownOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setScoreDropdownOpen(null)} />
      )}

      {/* ── Avis Google modal ── */}
      {scoreModal === "review" && scoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setScoreModal(null); setScoreTarget(null); } }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Star size={15} style={{ color: "#F59E0B" }} fill="#F59E0B" />
                  Avis Google pour{" "}
                  <span style={{ color: "var(--warning)" }}>{scoreTarget.first_name ?? scoreTarget.email}</span>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>5 points par avis obtenu</p>
              </div>
              <button onClick={() => { setScoreModal(null); setScoreTarget(null); }} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="mb-6">
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                Nombre d&apos;avis obtenus
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={10} value={reviewQty}
                  onChange={e => setReviewQty(parseInt(e.target.value))}
                  className="flex-1" style={{ accentColor: "#F59E0B" }} />
                <span className="text-2xl font-bold w-14 text-right" style={{ color: "#F59E0B" }}>{reviewQty}</span>
              </div>
              <p className="text-center text-sm mt-3 font-semibold" style={{ color: "var(--warning)" }}>
                +{reviewQty * 5} points
              </p>
            </div>
            <button onClick={() => submitScore("review")} disabled={sendingScore}
              className="w-full py-3 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2"
              style={{ background: "#F59E0B", color: "#fff", opacity: sendingScore ? 0.5 : 1 }}>
              <Star size={15} fill="#fff" />
              {sendingScore ? "Envoi…" : `Attribuer +${reviewQty * 5} pts`}
            </button>
          </div>
        </div>
      )}

      {/* ── Défi modal ── */}
      {scoreModal === "challenge" && scoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setScoreModal(null); setScoreTarget(null); } }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Trophy size={15} style={{ color: "var(--accent)" }} />
                  Défi remporté par{" "}
                  <span style={{ color: "var(--accent)" }}>{scoreTarget.first_name ?? scoreTarget.email}</span>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{scoringSettings?.points_challenge_won ?? 20} points attribués</p>
              </div>
              <button onClick={() => { setScoreModal(null); setScoreTarget(null); }} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="rounded-xl p-4 mb-5 text-center" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--accent)" }}>+{scoringSettings?.points_challenge_won ?? 20}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>points défi</p>
            </div>
            <button onClick={() => submitScore("challenge")} disabled={sendingScore}
              className="w-full py-3 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: sendingScore ? 0.5 : 1 }}>
              <Trophy size={15} />
              {sendingScore ? "Envoi…" : `Confirmer +${scoringSettings?.points_challenge_won ?? 20} pts`}
            </button>
          </div>
        </div>
      )}

      {/* ── Bonus modal ── */}
      {bonusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setBonusTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Attribuer des points à{" "}
                  <span style={{ color: "var(--warning)" }}>{bonusTarget.first_name ?? bonusTarget.email}</span>
                </p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Le bonus ne peut pas être retiré une fois attribué</p>
              </div>
              <button onClick={() => setBonusTarget(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                Points à attribuer (1–20)
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={20} value={bonusPoints}
                  onChange={e => setBonusPoints(parseInt(e.target.value))}
                  className="flex-1" style={{ accentColor: "var(--warning)" }} />
                <span className="text-2xl font-bold w-14 text-right" style={{ color: "var(--warning)" }}>+{bonusPoints}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                Motif
                {bonusReason.length > 0 && bonusReason.length < 10 && (
                  <span style={{ color: "var(--danger)" }}> (min. 10 caractères)</span>
                )}
              </label>
              <textarea
                value={bonusReason} onChange={e => setBonusReason(e.target.value)}
                placeholder="Ex: Excellent travail lors de la soirée de samedi, service impeccable..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                autoFocus
              />
              <p className="text-[10px] font-mono mt-1 text-right"
                style={{ color: bonusReason.length >= 10 ? "var(--success)" : "var(--foreground-dim)" }}>
                {bonusReason.length} / 10 min
              </p>
            </div>

            <button onClick={submitBonus} disabled={sendingBonus || bonusReason.trim().length < 10}
              className="w-full py-3 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2"
              style={{ background: "var(--warning)", color: "var(--primary-foreground)", opacity: (sendingBonus || bonusReason.trim().length < 10) ? 0.5 : 1 }}>
              <Zap size={15} />
              {sendingBonus ? "Envoi…" : `Attribuer +${bonusPoints} pts à ${bonusTarget.first_name ?? "ce membre"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
