"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { ArrowLeft, Download, ThumbsUp, ThumbsDown, Star, Clock, BookOpen, Award, Phone, Mail, Calendar, Briefcase } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;

interface AvailabilitySlot {
  day: string;
  period: string;
  hour_start?: string;
  hour_end?: string;
}

interface MemberProfile {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
  hired_at: string | null;
  establishment_name: string;
  phone?: string | null;
  contract_type?: string | null;
  availability?: AvailabilitySlot[];
}

interface Kudos {
  id: string;
  message: string;
  type: "positive" | "negative";
  photo_url?: string | null;
  from_name: string;
  created_at: string;
}

interface Stats {
  score: number;
  rank: number;
  total_members: number;
  delays_this_month: number;
  protocols_read: number;
  protocols_total: number;
}

const CONTRACT_LABELS: Record<string, string> = { cdi: "CDI", cdd: "CDD", extra: "Extra" };

const DEV_DATA: Record<string, { member: MemberProfile; kudos: Kudos[]; stats: Stats }> = {
  "dev-user": {
    member: { profile_id: "dev-user", first_name: "Dev", last_name: "Mode", email: "dev@carafe.app", avatar_url: null, job_title: "Responsable", hired_at: "2022-03-01", establishment_name: "Le Comptoir Dev", phone: null, contract_type: "cdi", availability: [] },
    kudos: [],
    stats: { score: 45, rank: 2, total_members: 3, delays_this_month: 1, protocols_read: 3, protocols_total: 3 },
  },
  "profile-2": {
    member: { profile_id: "profile-2", first_name: "Yasmine", last_name: "Benali", email: "yasmine@restaurant.fr", avatar_url: null, job_title: "Chef de salle", hired_at: "2023-01-15", establishment_name: "Le Comptoir Dev", phone: "06 12 34 56 78", contract_type: "cdi", availability: [] },
    kudos: [
      { id: "k1", message: "Excellent service ce soir, les clients ont adoré. Yasmine a su gérer une table difficile avec beaucoup de professionnalisme.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "k3", message: "Très bonne gestion du rush du vendredi soir, toute l'équipe était bien coordinée.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    ],
    stats: { score: 68, rank: 1, total_members: 3, delays_this_month: 0, protocols_read: 3, protocols_total: 3 },
  },
  "profile-3": {
    member: { profile_id: "profile-3", first_name: "Rayan", last_name: "Dupont", email: "rayan@restaurant.fr", avatar_url: null, job_title: "Serveur", hired_at: "2024-06-01", establishment_name: "Le Comptoir Dev", phone: "06 98 76 54 32", contract_type: "extra", availability: [{ day: "Vendredi", period: "Soir", hour_start: "18h", hour_end: "23h" }, { day: "Samedi", period: "Soir", hour_start: "18h", hour_end: "23h" }, { day: "Dimanche", period: "Matin", hour_start: "9h", hour_end: "13h" }] },
    kudos: [
      { id: "k2", message: "Bonne réactivité pendant le rush du samedi. Les clients ont été servis rapidement.", type: "positive", from_name: "Dev Mode", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: "k4", message: "Attention à la communication avec la cuisine pendant les périodes chargées.", type: "negative", from_name: "Dev Mode", created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    ],
    stats: { score: 23, rank: 3, total_members: 3, delays_this_month: 2, protocols_read: 1, protocols_total: 3 },
  },
  "profile-4": {
    member: { profile_id: "profile-4", first_name: "Léa", last_name: "Martin", email: "lea@restaurant.fr", avatar_url: null, job_title: "Serveuse", hired_at: "2024-09-01", establishment_name: "Le Comptoir Dev", phone: "07 11 22 33 44", contract_type: "cdd", availability: [{ day: "Samedi", period: "Matin", hour_start: "9h", hour_end: "14h" }, { day: "Samedi", period: "Après-midi", hour_start: "14h", hour_end: "19h" }, { day: "Dimanche", period: "Matin", hour_start: "9h", hour_end: "13h" }] },
    kudos: [],
    stats: { score: 35, rank: 3, total_members: 4, delays_this_month: 0, protocols_read: 2, protocols_total: 3 },
  },
};

const BADGE_CONFIG = {
  gold:   { emoji: "🥇", color: "#F59E0B", label: "Top performer" },
  silver: { emoji: "🥈", color: "#94A3B8", label: "Excellent" },
  bronze: { emoji: "🥉", color: "#C97B4B", label: "Bon niveau" },
};

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profile_id as string;
  const supabase = createClient();
  const [devRole] = useDevRole();
  const printRef = useRef<HTMLDivElement>(null);

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string>("");

  useEffect(() => {
    if (DEV_MODE) {
      const d = DEV_DATA[profileId];
      if (d) { setMember(d.member); setKudos(d.kudos); setStats(d.stats); }
      setMyProfileId(devRole === "employee" ? "profile-3" : "dev-user");
      setLoading(false);
      return;
    }
    loadData();
  }, [profileId, devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyProfileId(user.id);

    type MemberRow = {
      role: string;
      job_title: string | null;
      hired_at: string | null;
      establishment_id: string;
      profiles: { first_name: string | null; last_name: string | null; email: string; avatar_url: string | null; phone?: string | null } | null;
      establishments: { name: string } | null;
    };

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _pmq = supabase.from("establishment_members").select("role, job_title, hired_at, establishment_id, profiles(first_name, last_name, email, avatar_url, phone), establishments(name)").eq("profile_id", profileId).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _pmq = _pmq.eq("establishment_id", _ceid);
    let { data: memberDataRaw } = await _pmq.limit(1).maybeSingle();
    if (!memberDataRaw && _ceid && _re.test(_ceid)) ({ data: memberDataRaw } = await supabase.from("establishment_members").select("role, job_title, hired_at, establishment_id, profiles(first_name, last_name, email, avatar_url, phone), establishments(name)").eq("profile_id", profileId).eq("is_active", true).limit(1).maybeSingle());

    if (!memberDataRaw) { setLoading(false); return; }
    const memberData = memberDataRaw as unknown as MemberRow;
    const p = memberData.profiles;
    const est = memberData.establishments;

    setMember({
      profile_id: profileId,
      first_name: p?.first_name ?? null,
      last_name: p?.last_name ?? null,
      email: p?.email ?? "",
      avatar_url: p?.avatar_url ?? null,
      job_title: memberData.job_title,
      hired_at: memberData.hired_at,
      establishment_name: est?.name ?? "",
      phone: p?.phone ?? null,
    });

    const estId = memberData.establishment_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const [delaysRes, protocolsRes, readsRes, allMembersRes, allDelaysRes, allReadsRes] = await Promise.all([
      supabase.from("delays").select("id").eq("establishment_id", estId).eq("employee_id", profileId).gte("shift_date", monthStart),
      supabase.from("protocols").select("id").eq("establishment_id", estId),
      supabase.from("protocol_reads").select("protocol_id").eq("profile_id", profileId),
      supabase.from("establishment_members").select("profile_id").eq("establishment_id", estId).eq("is_active", true),
      supabase.from("delays").select("employee_id").eq("establishment_id", estId).gte("shift_date", monthStart),
      supabase.from("protocol_reads").select("profile_id, protocol_id"),
    ]);

    const myDelays = delaysRes.data?.length ?? 0;
    const totalProtocols = protocolsRes.data?.length ?? 0;
    const myReads = new Set(readsRes.data?.map(r => r.protocol_id) ?? []);
    const allMembers = allMembersRes.data ?? [];

    const delayCounts: Record<string, number> = {};
    (allDelaysRes.data ?? []).forEach((d: { employee_id: string }) => { delayCounts[d.employee_id] = (delayCounts[d.employee_id] ?? 0) + 1; });
    const readCounts: Record<string, number> = {};
    (allReadsRes.data ?? []).forEach((r: { profile_id: string }) => { readCounts[r.profile_id] = (readCounts[r.profile_id] ?? 0) + 1; });

    const scores = allMembers.map((m: { profile_id: string }) => {
      const del = delayCounts[m.profile_id] ?? 0;
      const read = readCounts[m.profile_id] ?? 0;
      const bonus = totalProtocols > 0 ? Math.round((read / totalProtocols) * 40) : 0;
      return { profile_id: m.profile_id, score: Math.max(0, 100 - del * 10 + bonus) };
    }).sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    const myScore = scores.find((s: { profile_id: string }) => s.profile_id === profileId)?.score ?? 0;
    const myRank = scores.findIndex((s: { profile_id: string }) => s.profile_id === profileId) + 1;

    setStats({ score: myScore, rank: myRank, total_members: allMembers.length, delays_this_month: myDelays, protocols_read: myReads.size, protocols_total: totalProtocols });
    setLoading(false);
  }

  const handlePrint = () => window.print();

  const isMe = myProfileId === profileId;
  const badge = stats ? (stats.rank === 1 ? "gold" : stats.rank === 2 ? "silver" : stats.rank === 3 ? "bronze" : null) as keyof typeof BADGE_CONFIG | null : null;
  const badgeConfig = badge ? BADGE_CONFIG[badge] : null;
  const positiveKudos = kudos.filter(k => k.type === "positive");
  const negativeKudos = kudos.filter(k => k.type === "negative");

  const hiredDate = member?.hired_at
    ? new Date(member.hired_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-4xl">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse mb-4" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  if (!member) {
    return (
      <div className="px-4 py-8 max-w-4xl text-center">
        <p style={{ color: "var(--foreground-dim)" }}>Profil introuvable.</p>
      </div>
    );
  }

  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email;

  return (
    <>
      <style>{`
        @media print {
          body { background: #fff !important; color: #09090B !important; }
          .no-print { display: none !important; }
          .print-page { padding: 32px !important; max-width: 100% !important; }
          .print-card { background: #f8f8f8 !important; border: 1px solid #e4e4e7 !important; }
          .print-text { color: #09090B !important; }
          .print-dim { color: #71717A !important; }
          img { max-width: 100%; page-break-inside: avoid; }
          .kudos-item { page-break-inside: avoid; }
        }
      `}</style>

      <div ref={printRef} className="print-page px-4 py-8 lg:px-8 max-w-2xl">
        {/* Back + Export */}
        <div className="no-print flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground-dim)" }}>
            <ArrowLeft size={16} /> Retour
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
            style={{ background: "var(--accent)", color: "#09090B" }}>
            <Download size={14} /> Exporter PDF
          </button>
        </div>

        {/* Hero */}
        <div className="print-card rounded-2xl p-5 mb-4 flex items-center gap-4"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={60} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="print-text text-xl font-bold" style={{ color: "var(--foreground)" }}>{fullName}</h1>
              {badgeConfig && <span className="text-xl">{badgeConfig.emoji}</span>}
            </div>
            {member.job_title && <p className="text-sm mt-0.5" style={{ color: "var(--accent)" }}>{member.job_title}</p>}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {member.contract_type && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: member.contract_type === "extra" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.08)", color: member.contract_type === "extra" ? "var(--warning)" : "var(--accent)" }}>
                  {CONTRACT_LABELS[member.contract_type] ?? member.contract_type}
                </span>
              )}
              {hiredDate && (
                <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>Depuis {hiredDate}</span>
              )}
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Coordonnées</p>
          </div>
          <div className="divide-y" style={{ background: "var(--background-elev)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "var(--foreground)" }}>{member.email}</p>
            </div>
            {member.phone ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                <a href={`tel:${member.phone}`} className="text-sm" style={{ color: "var(--accent)" }}>{member.phone}</a>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Téléphone non renseigné</p>
              </div>
            )}
            {member.hired_at && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Calendar size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  Arrivé{member.first_name?.endsWith("e") ? "e" : ""} le {new Date(member.hired_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Disponibilités */}
        {member.availability && member.availability.length > 0 && (
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
            <div className="px-4 py-3" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Disponibilités</p>
            </div>
            <div className="p-4 flex flex-wrap gap-2" style={{ background: "var(--background-elev)" }}>
              {member.availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>{slot.day}</p>
                    <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                      {slot.period}
                      {slot.hour_start && slot.hour_end && ` · ${slot.hour_start}–${slot.hour_end}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score + Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="print-card rounded-xl p-4 col-span-2"
              style={{ background: badgeConfig ? "rgba(245,158,11,0.05)" : "var(--background-elev)", border: `1px solid ${badgeConfig ? "rgba(245,158,11,0.25)" : "var(--border)"}` }}>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-2 print-dim" style={{ color: "var(--foreground-dim)" }}>Score ce mois</p>
              <div className="flex items-end gap-4">
                <p className="text-3xl font-bold print-text" style={{ color: badgeConfig?.color ?? "var(--foreground)" }}>{stats.score}</p>
                <div className="pb-0.5">
                  <p className="text-sm print-text" style={{ color: "var(--foreground)" }}>
                    {stats.rank}{stats.rank === 1 ? "er" : "ème"} sur {stats.total_members}
                    {badgeConfig && <span className="ml-2 text-[11px] font-mono" style={{ color: badgeConfig.color }}>{badgeConfig.label}</span>}
                  </p>
                  <p className="text-[11px] print-dim" style={{ color: "var(--foreground-dim)" }}>protocoles · bravos · défis · bonus</p>
                </div>
              </div>
            </div>

            <div className="print-card rounded-xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} style={{ color: "var(--warning)" }} />
                <p className="text-[11px] font-mono uppercase tracking-widest print-dim" style={{ color: "var(--foreground-dim)" }}>Retards</p>
              </div>
              <p className="text-2xl font-bold print-text" style={{ color: stats.delays_this_month === 0 ? "var(--success)" : "var(--warning)" }}>
                {stats.delays_this_month === 0 ? "✓ 0" : stats.delays_this_month}
              </p>
              <p className="text-[11px] print-dim" style={{ color: "var(--foreground-dim)" }}>ce mois</p>
            </div>

            <div className="print-card rounded-xl p-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} style={{ color: "var(--accent)" }} />
                <p className="text-[11px] font-mono uppercase tracking-widest print-dim" style={{ color: "var(--foreground-dim)" }}>Protocoles</p>
              </div>
              <p className="text-2xl font-bold print-text" style={{ color: "var(--foreground)" }}>
                {stats.protocols_read}
                <span className="text-base font-normal print-dim" style={{ color: "var(--foreground-dim)" }}>/{stats.protocols_total}</span>
              </p>
              <p className="text-[11px] print-dim" style={{ color: "var(--foreground-dim)" }}>lus</p>
            </div>
          </div>
        )}

        {/* Kudos */}
        {kudos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} style={{ color: "#F59E0B" }} />
              <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
                Bravos reçus ({kudos.length})
              </p>
            </div>

            {positiveKudos.length > 0 && (
              <div className="space-y-3 mb-3">
                {positiveKudos.map(k => (
                  <div key={k.id} className="kudos-item print-card rounded-xl p-4"
                    style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div className="flex items-start gap-3">
                      <ThumbsUp size={14} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed print-text" style={{ color: "var(--foreground)" }}>{k.message}</p>
                        {k.photo_url && (
                          <div className="mt-3 rounded-lg overflow-hidden" style={{ maxHeight: 200 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={k.photo_url} alt="photo" className="w-full object-cover" style={{ maxHeight: 200 }} />
                          </div>
                        )}
                        <p className="text-[11px] font-mono mt-2 print-dim" style={{ color: "var(--foreground-dim)" }}>
                          {k.from_name} · {new Date(k.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {negativeKudos.length > 0 && (
              <div className="space-y-3">
                {negativeKudos.map(k => (
                  <div key={k.id} className="kudos-item print-card rounded-xl p-4"
                    style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="flex items-start gap-3">
                      <ThumbsDown size={14} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed print-text" style={{ color: "var(--foreground)" }}>{k.message}</p>
                        {k.photo_url && (
                          <div className="mt-3 rounded-lg overflow-hidden" style={{ maxHeight: 200 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={k.photo_url} alt="photo" className="w-full object-cover" style={{ maxHeight: 200 }} />
                          </div>
                        )}
                        <p className="text-[11px] font-mono mt-2 print-dim" style={{ color: "var(--foreground-dim)" }}>
                          {k.from_name} · {new Date(k.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {kudos.length === 0 && (
          <div className="rounded-xl py-10 flex flex-col items-center"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <Star size={28} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 10 }} />
            <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun avis reçu pour le moment</p>
          </div>
        )}

        <div className="print-footer" style={{ display: "none" }}>
          Généré par Karaf · {new Date().toLocaleDateString("fr-FR")}
        </div>
      </div>
    </>
  );
}
