"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { CarafeAvatar } from "@/components/ui/custom/CarafeAvatar";
import { Trophy, Clock, MessageSquare, BookOpen, TrendingUp, AlertCircle, ChevronRight, Star, X, Plus, ThumbsUp } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_PROFILE_ID = "dev-user";

interface MemberScore {
  profile_id: string;
  name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
  score: number;
  delays_count: number;
  protocols_read: number;
  protocols_total: number;
  badge: "gold" | "silver" | "bronze" | null;
}

type FeedbackCategory = "compliment" | "complaint" | "suggestion" | "incident";

interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  content: string;
  table_number: string | null;
  created_at: string;
  confirmation_count: number;
}

interface FeedbackSummary {
  compliment: number;
  complaint: number;
  suggestion: number;
  incident: number;
  total: number;
}

interface DashboardData {
  role: string;
  my_profile_id: string;
  my_first_name: string;
  establishment_id: string;
  leaderboard: MemberScore[];
  feedback_summary: FeedbackSummary;
  feedback_items: FeedbackItem[];
  my_confirmed_feedback: string[];
  delays_this_month: number;
  active_challenges: number;
  unread_mandatory: number;
  unread_total: number;
}

const BADGE_CONFIG = {
  gold:   { emoji: "🥇", color: "#F59E0B" },
  silver: { emoji: "🥈", color: "#94A3B8" },
  bronze: { emoji: "🥉", color: "#C97B4B" },
};

const CATEGORY_META: Record<FeedbackCategory, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  compliment: { label: "Compliments",  emoji: "😊", color: "var(--success)",  bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
  complaint:  { label: "Plaintes",     emoji: "😤", color: "var(--danger)",   bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
  suggestion: { label: "Suggestions",  emoji: "💡", color: "var(--accent)",   bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)" },
  incident:   { label: "Incidents",    emoji: "⚠️", color: "var(--warning)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 3, background: "var(--background-soft)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

const DEV_FEEDBACK_ITEMS: FeedbackItem[] = [
  { id: "f1", category: "compliment", content: "Le client de la table 5 a adoré le risotto aux champignons. Il a demandé à féliciter le chef.", table_number: "5", created_at: new Date(Date.now() - 86400000).toISOString(), confirmation_count: 2 },
  { id: "f2", category: "complaint",  content: "Attente trop longue — table 12 a attendu 45 minutes pour les entrées. Le groupe était mécontent.", table_number: "12", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), confirmation_count: 3 },
  { id: "f3", category: "suggestion", content: "Un client suggère d'ajouter des options végétaliennes au menu.", table_number: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), confirmation_count: 1 },
  { id: "f4", category: "incident",   content: "Verre cassé en salle, client légèrement blessé — pris en charge immédiatement.", table_number: "8", created_at: new Date(Date.now() - 4 * 86400000).toISOString(), confirmation_count: 4 },
  { id: "f5", category: "compliment", content: "Service excellent ce soir, accueil très chaleureux selon le client. Il reviendra.", table_number: null, created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(), confirmation_count: 1 },
];

const DEV_DATA_MANAGER: DashboardData = {
  role: "owner", my_profile_id: DEV_PROFILE_ID, my_first_name: "Dev", establishment_id: "dev-establishment",
  leaderboard: [
    { profile_id: "profile-2", name: "Yasmine Benali", first_name: "Yasmine", last_name: "Benali", avatar_url: null, job_title: "Chef de salle", score: 68, delays_count: 0, protocols_read: 3, protocols_total: 3, badge: "gold" },
    { profile_id: DEV_PROFILE_ID, name: "Dev Mode", first_name: "Dev", last_name: "Mode", avatar_url: null, job_title: "Responsable", score: 45, delays_count: 1, protocols_read: 3, protocols_total: 3, badge: "silver" },
    { profile_id: "profile-3", name: "Rayan Dupont", first_name: "Rayan", last_name: "Dupont", avatar_url: null, job_title: "Serveur", score: 23, delays_count: 2, protocols_read: 1, protocols_total: 3, badge: "bronze" },
  ],
  feedback_summary: { compliment: 2, complaint: 1, suggestion: 1, incident: 1, total: 5 },
  feedback_items: DEV_FEEDBACK_ITEMS,
  my_confirmed_feedback: [],
  delays_this_month: 3, active_challenges: 2, unread_mandatory: 1, unread_total: 2,
};

const DEV_DATA_EMPLOYEE: DashboardData = {
  role: "employee", my_profile_id: "profile-3", my_first_name: "Rayan", establishment_id: "dev-establishment",
  leaderboard: [
    { profile_id: "profile-2", name: "Yasmine Benali", first_name: "Yasmine", last_name: "Benali", avatar_url: null, job_title: "Chef de salle", score: 68, delays_count: 0, protocols_read: 3, protocols_total: 3, badge: "gold" },
    { profile_id: DEV_PROFILE_ID, name: "Dev Mode", first_name: "Dev", last_name: "Mode", avatar_url: null, job_title: "Responsable", score: 45, delays_count: 1, protocols_read: 3, protocols_total: 3, badge: "silver" },
    { profile_id: "profile-3", name: "Rayan Dupont", first_name: "Rayan", last_name: "Dupont", avatar_url: null, job_title: "Serveur", score: 23, delays_count: 2, protocols_read: 1, protocols_total: 3, badge: "bronze" },
  ],
  feedback_summary: { compliment: 2, complaint: 1, suggestion: 1, incident: 1, total: 5 },
  feedback_items: DEV_FEEDBACK_ITEMS,
  my_confirmed_feedback: ["f2"],
  delays_this_month: 2, active_challenges: 2, unread_mandatory: 2, unread_total: 2,
};

export default function DashboardPage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) {
      setData(devRole === "employee" ? DEV_DATA_EMPLOYEE : DEV_DATA_MANAGER);
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [devRole]);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberData } = await supabase
      .from("establishment_members").select("role, establishment_id")
      .eq("profile_id", user.id).eq("is_active", true).single();

    if (!memberData) { setLoading(false); return; }

    const estId = memberData.establishment_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [membersRes, delaysRes, protocolsRes, readsRes, feedbackRes, challengesRes, profileRes, confirmedRes] = await Promise.all([
      supabase.from("establishment_members").select("profile_id, role, job_title, profiles(first_name, last_name, avatar_url)").eq("establishment_id", estId).eq("is_active", true),
      supabase.from("delays").select("employee_id").eq("establishment_id", estId).gte("shift_date", monthStart.split("T")[0]),
      supabase.from("protocols").select("id, is_mandatory").eq("establishment_id", estId),
      supabase.from("protocol_reads").select("protocol_id, profile_id"),
      supabase.from("customer_feedback").select("id, category, content, table_number, created_at").eq("establishment_id", estId).gte("created_at", monthStart).order("created_at", { ascending: false }),
      supabase.from("challenges").select("id").eq("establishment_id", estId).eq("status", "active"),
      supabase.from("profiles").select("first_name").eq("id", user.id).single(),
      supabase.from("feedback_confirmations").select("feedback_id").eq("profile_id", user.id),
    ]);

    const members = (membersRes.data ?? []) as Array<{ profile_id: string; role: string; job_title: string | null; profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null }>;
    const delays = (delaysRes.data ?? []) as Array<{ employee_id: string }>;
    const protocols = (protocolsRes.data ?? []) as Array<{ id: string; is_mandatory: boolean }>;
    const reads = (readsRes.data ?? []) as Array<{ protocol_id: string; profile_id: string }>;
    const rawFeedback = (feedbackRes.data ?? []) as Array<{ id: string; category: string; content: string; table_number: string | null; created_at: string }>;
    const myFirstName = (profileRes.data?.first_name ?? "");
    const myConfirmed = (confirmedRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id);

    const delayCounts: Record<string, number> = {};
    delays.forEach(d => { delayCounts[d.employee_id] = (delayCounts[d.employee_id] ?? 0) + 1; });

    const readsByProfile: Record<string, number> = {};
    reads.forEach(r => { readsByProfile[r.profile_id] = (readsByProfile[r.profile_id] ?? 0) + 1; });

    const totalProtocols = protocols.length;
    const myReads = new Set(reads.filter(r => r.profile_id === user.id).map(r => r.protocol_id));
    const unreadMandatory = protocols.filter(p => p.is_mandatory && !myReads.has(p.id)).length;
    const unreadTotal = protocols.filter(p => !myReads.has(p.id)).length;

    const leaderboard: MemberScore[] = members
      .filter(m => m.role !== "owner")
      .map(m => {
        const del = delayCounts[m.profile_id] ?? 0;
        const read = readsByProfile[m.profile_id] ?? 0;
        const score = totalProtocols > 0 ? Math.round((read / totalProtocols) * 100) : 0;
        const p = m.profiles;
        const fn = p?.first_name ?? "";
        const ln = p?.last_name ?? "";
        return { profile_id: m.profile_id, name: `${fn} ${ln}`.trim() || "—", first_name: fn, last_name: ln, avatar_url: p?.avatar_url ?? null, job_title: m.job_title, score, delays_count: del, protocols_read: read, protocols_total: totalProtocols, badge: null as MemberScore["badge"] };
      })
      .sort((a, b) => b.score - a.score)
      .map((m, i) => ({ ...m, badge: (["gold", "silver", "bronze"][i] ?? null) as MemberScore["badge"] }));

    const fbSummary: FeedbackSummary = { compliment: 0, complaint: 0, suggestion: 0, incident: 0, total: rawFeedback.length };
    rawFeedback.forEach(f => { if (f.category in fbSummary) (fbSummary as unknown as Record<string, number>)[f.category]++; });

    const feedbackItems: FeedbackItem[] = rawFeedback.map(f => ({ ...f, category: f.category as FeedbackCategory, confirmation_count: 0 }));

    setData({
      role: memberData.role, my_profile_id: user.id, my_first_name: myFirstName, establishment_id: estId,
      leaderboard, feedback_summary: fbSummary, feedback_items: feedbackItems, my_confirmed_feedback: myConfirmed,
      delays_this_month: delays.filter(d => d.employee_id === user.id).length,
      active_challenges: challengesRes.data?.length ?? 0,
      unread_mandatory: unreadMandatory, unread_total: unreadTotal,
    });
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-3xl">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-28 animate-pulse mb-4" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  const isManager = data.role === "owner" || data.role === "manager";
  return isManager ? <ManagerDashboard data={data} /> : <EmployeeDashboard data={data} />;
}

/* ─── MANAGER VIEW ─────────────────────────────────── */
function ManagerDashboard({ data }: { data: DashboardData }) {
  const month = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const [feedbackModal, setFeedbackModal] = useState<FeedbackCategory | null>(null);

  const modalItems = feedbackModal ? data.feedback_items.filter(f => f.category === feedbackModal) : [];
  const modalMeta = feedbackModal ? CATEGORY_META[feedbackModal] : null;

  return (
    <div className="px-4 py-8 lg:px-8 max-w-3xl">
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Vue d'ensemble</MonoLabel>
        <h1 className="text-2xl font-semibold capitalize" style={{ color: "var(--foreground)" }}>{month}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Clock, value: data.delays_this_month, label: "Retards", warn: data.delays_this_month > 3, href: "/delays" },
          { icon: MessageSquare, value: data.feedback_summary.total, label: "Avis clients", warn: false, href: "/customer-feedback" },
          { icon: Trophy, value: data.active_challenges, label: "Défis actifs", warn: false, href: "/challenges" },
          { icon: BookOpen, value: data.leaderboard.reduce((s, m) => s + Math.max(0, m.protocols_total - m.protocols_read), 0), label: "Lectures en attente", warn: true, href: "/protocols" },
        ].map(({ icon: Icon, value, label, warn, href }) => (
          <a key={label} href={href} className="rounded-xl p-4 transition-opacity hover:opacity-75"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl font-semibold" style={{ color: warn && value > 0 ? "var(--warning)" : "var(--foreground)" }}>{value}</p>
              <Icon size={15} style={{ color: "var(--foreground-dim)" }} />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>{label}</p>
          </a>
        ))}
      </div>

      {/* Leaderboard */}
      {data.leaderboard.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <TrendingUp size={14} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Classement équipe</p>
          </div>
          {data.leaderboard.map((member, i) => {
            const b = member.badge ? BADGE_CONFIG[member.badge] : null;
            return (
              <div key={member.profile_id} className="px-5 py-4 flex items-center gap-4"
                style={{ background: "var(--background-elev)", borderBottom: i < data.leaderboard.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="w-7 text-center flex-shrink-0">
                  {b ? <span className="text-xl">{b.emoji}</span> : <span className="text-sm font-mono" style={{ color: "var(--foreground-dim)" }}>{i + 1}</span>}
                </div>
                <CarafeAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{member.name}</p>
                    {member.job_title && <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>{member.job_title}</span>}
                  </div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[11px]" style={{ color: member.delays_count === 0 ? "var(--success)" : "var(--warning)" }}>
                      {member.delays_count === 0 ? "✓ Ponctuel" : `${member.delays_count} retard${member.delays_count > 1 ? "s" : ""}`}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                      {member.protocols_read}/{member.protocols_total} protocoles
                    </span>
                  </div>
                  <ScoreBar value={member.score} color={b?.color ?? "var(--foreground-dim)"} />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold" style={{ color: b?.color ?? "var(--foreground-dim)" }}>{member.score}</p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>pts</p>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-2.5 text-[10px] font-mono" style={{ background: "var(--background-soft)", borderTop: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
            Score = somme des points gagnés ce mois · protocoles, bravos, défis, bonus
          </div>
        </div>
      )}

      {/* Feedback breakdown — clickable tiles */}
      {data.feedback_summary.total > 0 && (
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={14} style={{ color: "var(--accent)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Retours clients ce mois</p>
            </div>
            <a href="/customer-feedback" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
          </div>
          <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
            {(["compliment", "complaint", "suggestion", "incident"] as FeedbackCategory[]).map(cat => {
              const meta = CATEGORY_META[cat];
              const count = data.feedback_summary[cat];
              return (
                <button key={cat} onClick={() => count > 0 && setFeedbackModal(cat)}
                  className="px-5 py-4 text-left transition-opacity"
                  style={{ background: "var(--background-elev)", opacity: count === 0 ? 0.5 : 1, cursor: count > 0 ? "pointer" : "default" }}>
                  <p className="text-2xl font-semibold mb-0.5" style={{ color: meta.color }}>{count}</p>
                  <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{meta.emoji} {meta.label}</p>
                  {count > 0 && <p className="text-[10px] mt-1" style={{ color: meta.color }}>Voir les avis →</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ponctualité */}
      {data.leaderboard.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
            <Clock size={14} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Ponctualité équipe</p>
          </div>
          {data.leaderboard.map((m, i) => (
            <div key={m.profile_id} className="px-5 py-3 flex items-center gap-3"
              style={{ background: "var(--background-elev)", borderBottom: i < data.leaderboard.length - 1 ? "1px solid var(--border)" : "none" }}>
              <CarafeAvatar firstName={m.first_name} lastName={m.last_name} avatarUrl={m.avatar_url} size={28} />
              <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{m.name}</p>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded"
                style={m.delays_count === 0
                  ? { background: "rgba(16,185,129,0.1)", color: "var(--success)" }
                  : { background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
                {m.delays_count === 0 ? "✓ Aucun retard" : `${m.delays_count} retard${m.delays_count > 1 ? "s" : ""}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Feedback modal */}
      {feedbackModal && modalMeta && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span>{modalMeta.emoji}</span>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{modalMeta.label}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: modalMeta.bg, color: modalMeta.color }}>
                  {modalItems.length}
                </span>
              </div>
              <button onClick={() => setFeedbackModal(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 60px)" }}>
              {modalItems.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun avis dans cette catégorie</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {modalItems.map(item => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        {item.table_number && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{ background: "var(--background-soft)", color: "var(--foreground-dim)" }}>
                            Table {item.table_number}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                          {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{item.content}</p>
                      {item.confirmation_count > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <ThumbsUp size={11} style={{ color: "var(--foreground-dim)" }} />
                          <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                            {item.confirmation_count} collègue{item.confirmation_count > 1 ? "s" : ""} ont eu le même retour
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── EMPLOYEE VIEW ────────────────────────────────── */
type QuickModal = "delay" | "feedback" | null;

function EmployeeDashboard({ data }: { data: DashboardData }) {
  const supabase = createClient();
  const myStats = data.leaderboard.find(m => m.profile_id === data.my_profile_id);
  const myRank = data.leaderboard.findIndex(m => m.profile_id === data.my_profile_id) + 1;
  const myBadge = myStats?.badge ? BADGE_CONFIG[myStats.badge] : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const [modal, setModal] = useState<QuickModal>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set(data.my_confirmed_feedback));
  const [confirmCounts, setConfirmCounts] = useState<Record<string, number>>(
    Object.fromEntries(data.feedback_items.map(f => [f.id, f.confirmation_count]))
  );

  const [delayDate, setDelayDate] = useState(new Date().toISOString().split("T")[0]);
  const [delayMinutes, setDelayMinutes] = useState("15");
  const [delayReason, setDelayReason] = useState<"transport" | "personal" | "health" | "other">("transport");
  const [fbCategory, setFbCategory] = useState<FeedbackCategory>("compliment");
  const [fbContent, setFbContent] = useState("");
  const [fbTable, setFbTable] = useState("");

  const closeModal = () => { setModal(null); setSubmitting(false); setDelayMinutes("15"); setDelayDate(new Date().toISOString().split("T")[0]); setDelayReason("transport"); setFbCategory("compliment"); setFbContent(""); setFbTable(""); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); closeModal(); setTimeout(() => setSuccessMsg(null), 3000); };

  const submitDelay = async () => {
    const mins = parseInt(delayMinutes, 10);
    if (!mins || mins <= 0) return;
    setSubmitting(true);
    if (DEV_MODE) { showSuccess("Retard déclaré ✓"); return; }
    await supabase.from("delays").insert({ establishment_id: data.establishment_id, employee_id: data.my_profile_id, shift_date: delayDate, delay_minutes: mins, reason: delayReason });
    showSuccess("Retard déclaré ✓");
  };

  const submitFeedback = async () => {
    if (!fbContent.trim()) return;
    setSubmitting(true);
    if (DEV_MODE) { showSuccess("Avis client enregistré ✓"); return; }
    await supabase.from("customer_feedback").insert({ establishment_id: data.establishment_id, reported_by: data.my_profile_id, category: fbCategory, content: fbContent, table_number: fbTable || null });
    showSuccess("Avis client enregistré ✓");
  };

  const toggleConfirm = async (feedbackId: string) => {
    const isConfirmed = confirmedIds.has(feedbackId);
    const delta = isConfirmed ? -1 : 1;

    setConfirmedIds(prev => {
      const next = new Set(prev);
      if (isConfirmed) next.delete(feedbackId); else next.add(feedbackId);
      return next;
    });
    setConfirmCounts(prev => ({ ...prev, [feedbackId]: (prev[feedbackId] ?? 0) + delta }));

    if (!DEV_MODE) {
      if (isConfirmed) {
        await supabase.from("feedback_confirmations").delete().eq("profile_id", data.my_profile_id).eq("feedback_id", feedbackId);
      } else {
        await (supabase.from("feedback_confirmations") as unknown as { upsert: (v: object) => Promise<unknown> }).upsert({ profile_id: data.my_profile_id, feedback_id: feedbackId });
      }
    }
  };

  return (
    <div className="px-4 py-8 lg:px-8 max-w-xl">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          {greeting}{data.my_first_name ? `, ${data.my_first_name}` : ""} 👋
        </h1>
      </div>

      {successMsg && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "var(--success)" }}>
          {successMsg}
        </div>
      )}

      {/* Mandatory protocols alert */}
      {data.unread_mandatory > 0 && (
        <a href="/protocols"
          className="flex items-start gap-3 rounded-xl px-4 py-4 mb-4 transition-opacity hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle size={18} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {data.unread_mandatory} protocole{data.unread_mandatory > 1 ? "s" : ""} obligatoire{data.unread_mandatory > 1 ? "s" : ""} à lire
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Ouvre-les et confirme ta lecture</p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--foreground-dim)", flexShrink: 0, marginTop: 2 }} />
        </a>
      )}

      {/* Score card */}
      <div className="rounded-xl p-5 mb-4"
        style={{ background: "var(--background-elev)", border: `1px solid ${myBadge ? "rgba(245,158,11,0.3)" : "var(--border)"}` }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Mon score ce mois</p>
          {myBadge && <span className="text-2xl">{myBadge.emoji}</span>}
        </div>
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-5xl font-bold leading-none" style={{ color: myBadge?.color ?? "var(--foreground)" }}>
              {myStats?.score ?? "—"}
            </p>
            <p className="text-[11px] font-mono mt-1" style={{ color: "var(--foreground-dim)" }}>
              {myRank > 0 ? `${myRank}${myRank === 1 ? "er" : "ème"} sur ${data.leaderboard.length}` : "—"}
            </p>
          </div>
          <div className="flex-1 pb-1">
            <ScoreBar value={myStats?.score ?? 0} color={myBadge?.color ?? "var(--accent)"} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--background-soft)" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Retards</p>
            <p className="text-xl font-semibold" style={{ color: (myStats?.delays_count ?? 0) === 0 ? "var(--success)" : "var(--warning)" }}>
              {myStats?.delays_count ?? 0}
            </p>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--background-soft)" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Protocoles lus</p>
            <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              {myStats?.protocols_read ?? 0}
              <span className="text-sm font-normal" style={{ color: "var(--foreground-dim)" }}>/{myStats?.protocols_total ?? 0}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Actions rapides</p>
      <div className="space-y-2 mb-8">
        <button onClick={() => setModal("delay")}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-opacity hover:opacity-75 text-left"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
            <Clock size={15} style={{ color: "var(--warning)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Déclarer un retard</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Signale un retard ou une absence</p>
          </div>
          <Plus size={14} style={{ color: "var(--foreground-dim)" }} />
        </button>

        <a href="/protocols"
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-opacity hover:opacity-75"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.1)" }}>
            <BookOpen size={15} style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Mes protocoles</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
              {data.unread_total > 0 ? `${data.unread_total} non lu${data.unread_total > 1 ? "s" : ""}` : "Tout est à jour ✓"}
            </p>
          </div>
          <ChevronRight size={14} style={{ color: "var(--foreground-dim)" }} />
        </a>

        <button onClick={() => setModal("feedback")}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-opacity hover:opacity-75 text-left"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
            <MessageSquare size={15} style={{ color: "#8B5CF6" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Signaler un avis client</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Compliment, plainte ou incident</p>
          </div>
          <Plus size={14} style={{ color: "var(--foreground-dim)" }} />
        </button>

        <a href="/challenges"
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-opacity hover:opacity-75"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
            <Trophy size={15} style={{ color: "#F59E0B" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Défis en cours</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{data.active_challenges} défi{data.active_challenges !== 1 ? "s" : ""} actif{data.active_challenges !== 1 ? "s" : ""}</p>
          </div>
          <ChevronRight size={14} style={{ color: "var(--foreground-dim)" }} />
        </a>
      </div>

      {/* Recent feedback — employee can confirm */}
      {data.feedback_items.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Retours clients récents</p>
            <a href="/customer-feedback" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
          </div>
          <div className="space-y-2">
            {data.feedback_items.slice(0, 4).map(item => {
              const meta = CATEGORY_META[item.category];
              const confirmed = confirmedIds.has(item.id);
              const count = confirmCounts[item.id] ?? 0;
              return (
                <div key={item.id} className="rounded-xl p-4"
                  style={{ background: "var(--background-elev)", border: `1px solid ${confirmed ? meta.border : "var(--border)"}` }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                        {item.table_number && (
                          <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>Table {item.table_number}</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{item.content}</p>
                      <p className="text-[10px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
                        {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleConfirm(item.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: confirmed ? meta.bg : "var(--background-soft)",
                      color: confirmed ? meta.color : "var(--foreground-dim)",
                      border: `1px solid ${confirmed ? meta.border : "var(--border)"}`,
                    }}>
                    <ThumbsUp size={12} fill={confirmed ? "currentColor" : "none"} />
                    {confirmed ? "Tu as eu ce retour" : "Moi aussi j'ai eu ce retour"}
                    {count > 0 && <span className="ml-1 opacity-70">· {count}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      {data.leaderboard.length > 1 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Classement équipe</p>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {data.leaderboard.slice(0, 3).map((member, i) => {
              const b = member.badge ? BADGE_CONFIG[member.badge] : null;
              const isMe = member.profile_id === data.my_profile_id;
              return (
                <div key={member.profile_id} className="px-4 py-3 flex items-center gap-3"
                  style={{ background: isMe ? "rgba(139,92,246,0.05)" : "var(--background-elev)", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <span className="text-lg w-6 text-center flex-shrink-0">{b?.emoji ?? `${i + 1}`}</span>
                  <CarafeAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={28} />
                  <p className="text-sm flex-1" style={{ color: "var(--foreground)", fontWeight: isMe ? 600 : 400 }}>
                    {member.name}{isMe ? " (toi)" : ""}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Star size={11} style={{ color: b?.color ?? "var(--foreground-dim)" }} />
                    <p className="text-sm font-semibold" style={{ color: b?.color ?? "var(--foreground-dim)" }}>{member.score}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Delay modal ── */}
      {modal === "delay" && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Déclarer un retard</p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Signale un retard ou une absence</p>
              </div>
              <button onClick={closeModal} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Date</label>
                <input type="date" value={delayDate} onChange={e => setDelayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--warning)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Durée (minutes)</label>
                <input type="number" min="1" max="480" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} placeholder="15"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--warning)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Raison</label>
                <select value={delayReason} onChange={e => setDelayReason(e.target.value as typeof delayReason)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="transport">Transport</option>
                  <option value="personal">Personnel</option>
                  <option value="health">Santé</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <button onClick={submitDelay} disabled={submitting || !delayMinutes || parseInt(delayMinutes, 10) <= 0}
                className="w-full py-3 mt-1 text-sm font-semibold rounded-lg transition-opacity"
                style={{ background: "var(--warning)", color: "#09090B", opacity: (submitting || !delayMinutes || parseInt(delayMinutes, 10) <= 0) ? 0.5 : 1 }}>
                {submitting ? "Envoi…" : "Déclarer le retard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback modal ── */}
      {modal === "feedback" && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Signaler un avis client</p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Compliment, plainte ou incident</p>
              </div>
              <button onClick={closeModal} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
                <select value={fbCategory} onChange={e => setFbCategory(e.target.value as FeedbackCategory)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="compliment">Compliment</option>
                  <option value="complaint">Réclamation</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="incident">Incident</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description</label>
                <textarea value={fbContent} onChange={e => setFbContent(e.target.value)}
                  placeholder="Décrivez le retour client…" rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#8B5CF6"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                  autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Table <span style={{ fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input value={fbTable} onChange={e => setFbTable(e.target.value)} placeholder="Ex: 12"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#8B5CF6"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <button onClick={submitFeedback} disabled={submitting || !fbContent.trim()}
                className="w-full py-3 mt-1 text-sm font-semibold rounded-lg transition-opacity"
                style={{ background: "#8B5CF6", color: "#fff", opacity: (submitting || !fbContent.trim()) ? 0.5 : 1 }}>
                {submitting ? "Envoi…" : "Enregistrer l'avis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
