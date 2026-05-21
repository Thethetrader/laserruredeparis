"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { CarafeAvatar } from "@/components/ui/custom/CarafeAvatar";
import { Plus, Users, Star, ThumbsUp, ThumbsDown, X, Camera, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/lib/types/database";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

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
}

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
  manager: { bg: "rgba(139,92,246,0.1)", color: "#8B5CF6" },
  employee: { bg: "rgba(161,161,170,0.1)", color: "var(--foreground-dim)" },
};

const DEV_MEMBERS: TeamMember[] = [
  { id: "m1", profile_id: DEV_PROFILE_ID, role: "owner", job_title: "Responsable", hired_at: "2022-03-01", is_active: true, first_name: "Dev", last_name: "Mode", email: "dev@carafe.app", avatar_url: null },
  { id: "m2", profile_id: "profile-2", role: "manager", job_title: "Chef de salle", hired_at: "2023-01-15", is_active: true, first_name: "Yasmine", last_name: "Benali", email: "yasmine@restaurant.fr", avatar_url: null },
  { id: "m3", profile_id: "profile-3", role: "employee", job_title: "Serveur", hired_at: "2024-06-01", is_active: true, first_name: "Rayan", last_name: "Dupont", email: "rayan@restaurant.fr", avatar_url: null },
];

const DEV_KUDOS: Kudos[] = [
  { id: "k1", to_profile_id: "profile-2", message: "Excellent service ce soir, les clients ont adoré.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "k2", to_profile_id: "profile-3", message: "Bonne réactivité pendant le rush.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
];

export default function TeamPage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [kudosList, setKudosList] = useState<Kudos[]>(DEV_MODE ? DEV_KUDOS : []);
  const [role, setRole] = useState<string>("employee");
  const [myProfileId, setMyProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [_establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("employee");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
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

  useEffect(() => {
    if (DEV_MODE) { setRole(devRole); setMembers(DEV_MEMBERS); setLoading(false); return; }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyProfileId(user.id);

    const { data: memberData } = await supabase
      .from("establishment_members").select("role, establishment_id")
      .eq("profile_id", user.id).eq("is_active", true).single();

    if (!memberData) { setLoading(false); return; }
    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);

    const { data } = await supabase
      .from("establishment_members")
      .select("id, profile_id, role, job_title, hired_at, is_active, profiles(first_name, last_name, email, avatar_url)")
      .eq("establishment_id", memberData.establishment_id)
      .order("joined_at", { ascending: true });

    const mapped: TeamMember[] = (data ?? []).map((m: {
      id: string; profile_id: string; role: UserRole; job_title: string | null; hired_at: string | null; is_active: boolean;
      profiles: { first_name: string | null; last_name: string | null; email: string; avatar_url: string | null } | null;
    }) => ({
      id: m.id, profile_id: m.profile_id, role: m.role, job_title: m.job_title, hired_at: m.hired_at, is_active: m.is_active,
      first_name: m.profiles?.first_name ?? null, last_name: m.profiles?.last_name ?? null,
      email: m.profiles?.email ?? "", avatar_url: m.profiles?.avatar_url ?? null,
    }));
    setMembers(mapped);
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

  const submitBonus = async () => {
    if (!bonusTarget || bonusReason.trim().length < 10) return;
    setSendingBonus(true);
    await new Promise(r => setTimeout(r, 400));
    setBonusSuccess(`+${bonusPoints} pts attribués à ${bonusTarget.first_name ?? bonusTarget.email} ✓`);
    setBonusTarget(null);
    setBonusReason("");
    setBonusPoints(5);
    setSendingBonus(false);
    setTimeout(() => setBonusSuccess(null), 3000);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteSuccess(true);
    setInviting(false);
    setTimeout(() => { setInviteSuccess(false); setInviteEmail(""); setInviteRole("employee"); setShowInviteForm(false); }, 2000);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-20 animate-pulse mb-3" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <div className="px-4 py-8 lg:px-8 max-w-2xl">
      {/* Bonus success toast */}
      {bonusSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: "rgba(139,92,246,0.95)", color: "#fff" }}>
          {bonusSuccess}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Équipe</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Équipe</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
            {activeMembers.length} membre{activeMembers.length !== 1 ? "s" : ""} actif{activeMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
            style={{ background: "var(--accent)", color: "#09090B" }}>
            <Plus size={14} /> Inviter
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInviteForm && isManager && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>Inviter un membre</p>
          {inviteSuccess ? (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}>
              Invitation envoyée avec succès.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="collègue@restaurant.fr"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Rôle</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="employee">Employé</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
                  style={{ background: "var(--accent)", color: "#09090B", opacity: (inviting || !inviteEmail.trim()) ? 0.5 : 1 }}>
                  {inviting ? "Envoi…" : "Envoyer l'invitation"}
                </button>
                <button onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 text-sm rounded-md"
                  style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
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
                    <CarafeAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={38} />
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
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {member.job_title && <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>{member.job_title}</span>}
                      {positiveCount > 0 && (
                        <button onClick={() => setExpandedKudos(isExpanded ? null : member.profile_id)}
                          className="flex items-center gap-1 text-[11px]"
                          style={{ color: "#F59E0B" }}>
                          <Star size={10} fill="#F59E0B" /> {positiveCount} bravo{positiveCount > 1 ? "s" : ""}
                        </button>
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
                  <div className="px-4 pb-3 flex gap-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <button onClick={() => { setKudosTarget(member); setKudosMessage(""); setKudosType("positive"); }}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                      Bravo
                    </button>
                    <button onClick={() => { setBonusTarget(member); setBonusPoints(5); setBonusReason(""); }}
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <Zap size={11} /> Bonus
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
                  <CarafeAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={38} />
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
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
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

      {/* ── Bonus modal ── */}
      {bonusTarget && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setBonusTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Attribuer des points à{" "}
                  <span style={{ color: "#8B5CF6" }}>{bonusTarget.first_name ?? bonusTarget.email}</span>
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
                  className="flex-1" style={{ accentColor: "#8B5CF6" }} />
                <span className="text-2xl font-bold w-14 text-right" style={{ color: "#8B5CF6" }}>+{bonusPoints}</span>
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
                onFocus={e => e.currentTarget.style.borderColor = "#8B5CF6"}
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
              style={{ background: "#8B5CF6", color: "#fff", opacity: (sendingBonus || bonusReason.trim().length < 10) ? 0.5 : 1 }}>
              <Zap size={15} />
              {sendingBonus ? "Envoi…" : `Attribuer +${bonusPoints} pts à ${bonusTarget.first_name ?? "ce membre"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
