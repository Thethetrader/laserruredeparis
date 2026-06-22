"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { compressImage } from "@/lib/utils/compress-image";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import {
  Trophy, Clock, MessageSquare, BookOpen, TrendingUp, AlertCircle, ChevronRight,
  Star, X, Plus, ThumbsUp, Check, UtensilsCrossed, Wine, Users, ShieldCheck,
  Sunrise, Sunset, Sparkles, LayoutGrid, ArrowLeft, CheckCircle2, Circle, Zap,
  BarChart2, Sun, Moon, BrainCircuit, Loader2, Inbox,
} from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";
import { useTheme } from "@/components/ThemeProvider";
import { NewFeedbackModal } from "@/components/NewFeedbackModal";
import { PushNotificationBanner } from "@/components/PushNotificationSetup";

const DEV_MODE = false;
const DEV_PROFILE_ID = "dev-user";

interface Protocol {
  id: string;
  title: string;
  content?: string;
  category?: string;
  is_mandatory: boolean;
  show_on_dashboard?: boolean;
  steps?: Array<{ text: string; frequency?: string; photo_url?: string }> | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  created_at?: string | null;
  is_read: boolean;
  read_count: number;
  total_members: number;
}

interface MemberScore {
  profile_id: string;
  name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
  score: number;
  delays_count: number;
  today_delay_count: number;
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

interface PendingRequestDash {
  id: string;
  profile_id: string;
  employee_name: string;
  employee_avatar: string | null;
  request_type: string;
  dates: string[] | null;
  time_requested: string | null;
  reason: string | null;
  summary: string;
  created_at: string;
}

interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  ends_at: string | null;
}

interface TaskStat {
  label: string;
  done: number;
  total: number;
  period: "today" | "week";
  tasks?: { title: string; done: boolean; category: string; id?: string; requires_photo?: boolean }[];
}

interface DashboardData {
  role: string;
  my_profile_id: string;
  my_first_name: string;
  establishment_id: string;
  protocols: Protocol[];
  leaderboard: MemberScore[];
  feedback_summary: FeedbackSummary;
  feedback_items: FeedbackItem[];
  my_confirmed_feedback: string[];
  delays_this_month: number;
  today_delays: number;
  today_feedback: number;
  active_challenges: number;
  active_challenges_list: ChallengeItem[];
  pending_requests: number;
  pending_requests_list: PendingRequestDash[];
  unread_mandatory: number;
  unread_total: number;
  task_stats: TaskStat[];
  overdue_weekly_tasks: { id: string; title: string; category: string }[];
  tips_this_month: number;
  tip_mode: string;
}

const BADGE_CONFIG = {
  gold:   { rank: "1", label: "Or",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  silver: { rank: "2", label: "Argent", color: "#94A3B8", bg: "rgba(148,163,184,0.10)" },
  bronze: { rank: "3", label: "Bronze", color: "#C97B4B", bg: "rgba(201,123,75,0.10)"  },
};

function BadgeRank({ rank, color, bg, size = 24 }: { rank: string; color: string; bg: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-semibold rounded-sm flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, color, background: bg, border: `1px solid ${color}22` }}
    >
      {rank}
    </span>
  );
}

const CATEGORY_META: Record<FeedbackCategory, { label: string; color: string; bg: string; border: string }> = {
  compliment: { label: "Compliments",  color: "var(--success)",  bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
  complaint:  { label: "Plaintes",     color: "var(--danger)",   bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
  suggestion: { label: "Suggestions",  color: "var(--accent)",   bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)" },
  incident:   { label: "Incidents",    color: "var(--warning)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 3, background: "var(--background-soft)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

const DEV_PROTOCOLS: Protocol[] = [
  { id: "p1", title: "Normes HACCP Températures", is_mandatory: true,  is_read: true,  read_count: 3, total_members: 3, content: "Contrôler chaque frigo au thermomètre sonde avant le service.\n\n• Frigos 1 & 2 : 2°C – 4°C\n• Congélateur : -18°C max\n• Zone chaude : +63°C min\n\nSi hors norme : alerter immédiatement le responsable et ne pas utiliser les produits. Consigner l'incident dans le cahier HACCP." },
  { id: "p2", title: "Procédure ouverture salle",  is_mandatory: true,  is_read: true,  read_count: 2, total_members: 3, content: "1. Allumer les lumières et la climatisation\n2. Vérifier la propreté de toutes les tables\n3. Dresser les couverts selon le plan de salle\n4. Remplir les carafes d'eau et les moulins à sel/poivre\n5. Vérifier la carte et les suggestions du jour avec le chef\n6. Briefing équipe 15 min avant l'ouverture" },
  { id: "p3", title: "Gestion des allergènes",     is_mandatory: false, is_read: false, read_count: 1, total_members: 3, content: "Les 14 allergènes majeurs à connaître :\n\nGluten · Crustacés · Œufs · Poissons · Arachides · Soja · Lait · Fruits à coque · Céleri · Moutarde · Graines de sésame · Anhydride sulfureux · Lupin · Mollusques\n\nEn cas de demande client :\n1. Consulter la fiche allergènes en cuisine\n2. Ne jamais donner une réponse incertaine\n3. Contacter le chef en cas de doute\n4. Proposer une alternative sûre si possible" },
];

const DEV_FEEDBACK_ITEMS: FeedbackItem[] = [
  { id: "f1", category: "compliment", content: "Le client de la table 5 a adoré le risotto aux champignons.", table_number: "5", created_at: new Date(Date.now() - 86400000).toISOString(), confirmation_count: 2 },
  { id: "f2", category: "complaint",  content: "Attente trop longue table 12, 45 minutes pour les entrées.", table_number: "12", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), confirmation_count: 3 },
  { id: "f3", category: "suggestion", content: "Un client suggère d'ajouter des options végétaliennes.", table_number: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), confirmation_count: 1 },
  { id: "f4", category: "incident",   content: "Verre cassé en salle, client légèrement blessé.", table_number: "8", created_at: new Date(Date.now() - 4 * 86400000).toISOString(), confirmation_count: 4 },
  { id: "f5", category: "compliment", content: "Service excellent ce soir, accueil très chaleureux.", table_number: null, created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(), confirmation_count: 1 },
];

const DEV_TASK_STATS: TaskStat[] = [
  {
    label: "Ouverture",
    done: 5,
    total: 5,
    period: "today",
    tasks: [
      { id: "t1", title: "Ouverture caisse", done: true, category: "opening", requires_photo: true },
      { id: "t2", title: "Contrôle frigos", done: true, category: "opening", requires_photo: true },
      { id: "t3", title: "Briefing équipe", done: true, category: "opening", requires_photo: false },
      { id: "t4", title: "Mise en place salle", done: true, category: "opening", requires_photo: false },
      { id: "t5", title: "Mise en place cuisine", done: true, category: "opening", requires_photo: false },
    ],
  },
  {
    label: "Fermeture",
    done: 0,
    total: 4,
    period: "today",
    tasks: [
      { id: "t6", title: "Fermeture caisse", done: false, category: "closing", requires_photo: true },
      { id: "t7", title: "Nettoyage salle", done: false, category: "closing", requires_photo: false },
      { id: "t8", title: "Nettoyage hotte", done: false, category: "closing", requires_photo: true },
      { id: "t9", title: "Plonge terminée", done: false, category: "closing", requires_photo: false },
    ],
  },
  {
    label: "Cette semaine",
    done: 31,
    total: 63,
    period: "week",
    tasks: [
      { title: "Ouverture caisse", done: true, category: "Récurrent" },
      { title: "Contrôle frigos", done: true, category: "Récurrent" },
      { title: "Briefing équipe", done: true, category: "Récurrent" },
      { title: "Mise en place salle", done: true, category: "Récurrent" },
      { title: "Mise en place cuisine", done: false, category: "Récurrent" },
      { title: "Fermeture caisse", done: false, category: "Récurrent" },
      { title: "Nettoyage salle", done: false, category: "Récurrent" },
      { title: "Nettoyage hotte", done: false, category: "Récurrent" },
      { title: "Plonge terminée", done: false, category: "Récurrent" },
    ],
  },
];

const DEV_DATA_MANAGER: DashboardData = {
  role: "owner", my_profile_id: DEV_PROFILE_ID, my_first_name: "Dev", establishment_id: "dev-establishment",
  protocols: DEV_PROTOCOLS,
  leaderboard: [
    { profile_id: "profile-2", name: "Yasmine Benali", first_name: "Yasmine", last_name: "Benali", avatar_url: null, job_title: "Chef de salle", score: 68, delays_count: 0, today_delay_count: 0, protocols_read: 3, protocols_total: 3, badge: "gold" },
    { profile_id: DEV_PROFILE_ID, name: "Dev Mode", first_name: "Dev", last_name: "Mode", avatar_url: null, job_title: "Responsable", score: 45, delays_count: 1, today_delay_count: 1, protocols_read: 3, protocols_total: 3, badge: "silver" },
    { profile_id: "profile-3", name: "Rayan Dupont", first_name: "Rayan", last_name: "Dupont", avatar_url: null, job_title: "Serveur", score: 23, delays_count: 2, today_delay_count: 1, protocols_read: 1, protocols_total: 3, badge: "bronze" },
  ],
  feedback_summary: { compliment: 2, complaint: 1, suggestion: 1, incident: 1, total: 5 },
  feedback_items: DEV_FEEDBACK_ITEMS,
  my_confirmed_feedback: [],
  delays_this_month: 3, today_delays: 1, today_feedback: 2, active_challenges: 2, unread_mandatory: 1, unread_total: 2,
  active_challenges_list: [
    { id: "c1", title: "100 avis Google ce mois", description: null, target_value: 100, current_value: 63, unit: "avis", ends_at: new Date(Date.now() + 7 * 86400000).toISOString() },
    { id: "c2", title: "Zéro retard cette semaine", description: null, target_value: 5, current_value: 3, unit: "jours sans retard", ends_at: new Date(Date.now() + 3 * 86400000).toISOString() },
  ],
  pending_requests: 1,
  pending_requests_list: [
    { id: "r1", profile_id: "profile-3", employee_name: "Rayan Dupont", employee_avatar: null, request_type: "leave", dates: [new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]], time_requested: null, reason: "mariage", summary: "Congé samedi prochain (mariage)", created_at: new Date().toISOString() },
  ],
  tips_this_month: 0, tip_mode: "self",
  task_stats: DEV_TASK_STATS,
  overdue_weekly_tasks: [],
};

const DEV_PROTOCOLS_EMPLOYEE: Protocol[] = [
  { id: "p1", title: "Normes HACCP Températures", is_mandatory: true, is_read: false, read_count: 2, total_members: 3, content: "Contrôler chaque frigo au thermomètre sonde avant le service.\n\n• Frigos 1 & 2 : 2°C – 4°C\n• Congélateur : -18°C max\n• Zone chaude : +63°C min\n\nSi hors norme : alerter immédiatement le responsable et ne pas utiliser les produits. Consigner l'incident dans le cahier HACCP." },
  { id: "p2", title: "Procédure ouverture salle",  is_mandatory: true, is_read: false, read_count: 1, total_members: 3, content: "1. Allumer les lumières et la climatisation\n2. Vérifier la propreté de toutes les tables\n3. Dresser les couverts selon le plan de salle\n4. Remplir les carafes d'eau et les moulins à sel/poivre\n5. Vérifier la carte et les suggestions du jour avec le chef\n6. Briefing équipe 15 min avant l'ouverture" },
  { id: "p3", title: "Gestion des allergènes",     is_mandatory: true, is_read: false, read_count: 0, total_members: 3, content: "Les 14 allergènes majeurs à connaître :\n\nGluten · Crustacés · Œufs · Poissons · Arachides · Soja · Lait · Fruits à coque · Céleri · Moutarde · Graines de sésame · Anhydride sulfureux · Lupin · Mollusques\n\nEn cas de demande client :\n1. Consulter la fiche allergènes en cuisine\n2. Ne jamais donner une réponse incertaine\n3. Contacter le chef en cas de doute\n4. Proposer une alternative sûre si possible" },
];

const DEV_DATA_EMPLOYEE: DashboardData = {
  role: "employee", my_profile_id: "profile-3", my_first_name: "Rayan", establishment_id: "dev-establishment",
  protocols: DEV_PROTOCOLS_EMPLOYEE,
  leaderboard: [
    { profile_id: "profile-2", name: "Yasmine Benali", first_name: "Yasmine", last_name: "Benali", avatar_url: null, job_title: "Chef de salle", score: 68, delays_count: 0, today_delay_count: 0, protocols_read: 3, protocols_total: 3, badge: "gold" },
    { profile_id: DEV_PROFILE_ID, name: "Dev Mode", first_name: "Dev", last_name: "Mode", avatar_url: null, job_title: "Responsable", score: 45, delays_count: 1, today_delay_count: 1, protocols_read: 3, protocols_total: 3, badge: "silver" },
    { profile_id: "profile-3", name: "Rayan Dupont", first_name: "Rayan", last_name: "Dupont", avatar_url: null, job_title: "Serveur", score: 23, delays_count: 2, today_delay_count: 1, protocols_read: 1, protocols_total: 3, badge: "bronze" },
  ],
  feedback_summary: { compliment: 2, complaint: 1, suggestion: 1, incident: 1, total: 5 },
  feedback_items: DEV_FEEDBACK_ITEMS,
  my_confirmed_feedback: ["f2"],
  delays_this_month: 2, today_delays: 0, today_feedback: 2, active_challenges: 2, unread_mandatory: 3, unread_total: 3,
  active_challenges_list: [
    { id: "c1", title: "100 avis Google ce mois", description: null, target_value: 100, current_value: 63, unit: "avis", ends_at: new Date(Date.now() + 7 * 86400000).toISOString() },
    { id: "c2", title: "Zéro retard cette semaine", description: null, target_value: 5, current_value: 3, unit: "jours sans retard", ends_at: new Date(Date.now() + 3 * 86400000).toISOString() },
  ],
  pending_requests: 0,
  pending_requests_list: [],
  tips_this_month: 0, tip_mode: "self",
  overdue_weekly_tasks: [],
  task_stats: [
    {
      label: "Aujourd'hui",
      done: 3,
      total: 5,
      period: "today",
      tasks: [
        { title: "Briefing équipe", done: true, category: "Ouverture" },
        { title: "Mise en place salle", done: true, category: "Ouverture" },
        { title: "Mise en place cuisine", done: true, category: "Ouverture" },
        { title: "Nettoyage salle", done: false, category: "Fermeture" },
        { title: "Plonge terminée", done: false, category: "Fermeture" },
      ],
    },
    { label: "Cette semaine", done: 18, total: 35, period: "week", tasks: [
      { title: "Briefing équipe", done: true, category: "Récurrent" },
      { title: "Mise en place salle", done: true, category: "Récurrent" },
      { title: "Mise en place cuisine", done: true, category: "Récurrent" },
      { title: "Nettoyage salle", done: false, category: "Récurrent" },
      { title: "Plonge terminée", done: false, category: "Récurrent" },
    ]},
  ],
};

const DEV_TODAY_FEEDBACK: FeedbackItem[] = [
  { id: "ft1", category: "compliment", content: "Table 4 ravie du service, a demandé à féliciter le serveur.", table_number: "4", created_at: new Date(Date.now() - 3600000).toISOString(), confirmation_count: 0 },
  { id: "ft2", category: "complaint", content: "Plat servi froid à la table 7, client mécontent.", table_number: "7", created_at: new Date(Date.now() - 7200000).toISOString(), confirmation_count: 1 },
];

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
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const activeEstId = typeof document !== "undefined" ? (document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) ?? [])[1] ?? null : null;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validActiveId = activeEstId && uuidRe.test(activeEstId) ? activeEstId : null;

    // Charger tous les membres pour pouvoir préférer employee si nécessaire
    const { data: allMembers } = await supabase.from("establishment_members")
      .select("role, job_title, establishment_id, establishments(tip_settings, protocol_categories)")
      .eq("profile_id", user.id).eq("is_active", true);

    const activeMember = validActiveId ? allMembers?.find(m => m.establishment_id === validActiveId) : null;
    const employeeMember = allMembers?.find(m => (m.role as string) === "employee");
    // Préférer: cookie→employee > premier employee > cookie→manager > premier membre
    const memberData = (activeMember?.role === "employee" ? activeMember : null)
      ?? employeeMember
      ?? activeMember
      ?? allMembers?.[0]
      ?? null;

    if (!memberData) { setLoading(false); return; }

    const estId = memberData.establishment_id;
    const estTipSettings = (memberData as unknown as { establishments?: { tip_settings?: { mode?: string } } }).establishments?.tip_settings;
    const tipMode = estTipSettings?.mode ?? "self";
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = now.toISOString().split("T")[0];

    const [membersRes, delaysRes, protocolsRes, readsRes, feedbackRes, challengesRes, profileRes, confirmedRes, taskTmplRes, taskCompRes, shiftsRes, scoreEventsRes, pendingReqRes, allReadsApiRes] = await Promise.all([
      supabase.from("establishment_members").select("profile_id, role, job_title, profiles(first_name, last_name, avatar_url)").eq("establishment_id", estId).eq("is_active", true),
      supabase.from("delays").select("employee_id, shift_date").eq("establishment_id", estId).gte("shift_date", monthStart.split("T")[0]),
      supabase.from("protocols").select("id, title, content, is_mandatory, show_on_dashboard, category, steps, attachment_url, attachment_type, created_at").eq("establishment_id", estId),
      supabase.from("protocol_reads").select("protocol_id, profile_id"),
      supabase.from("customer_feedback").select("id, category, content, table_number, created_at").eq("establishment_id", estId).gte("created_at", monthStart).order("created_at", { ascending: false }),
      supabase.from("challenges").select("id, title, description, target_value, current_value, unit, ends_at").eq("establishment_id", estId).eq("status", "active"),
      supabase.from("profiles").select("first_name").eq("id", user.id).single(),
      supabase.from("feedback_reads").select("feedback_id").eq("profile_id", user.id),
      supabase.from("task_templates").select("id, title, category, is_active, requires_photo, frequency, target_role").eq("establishment_id", estId).eq("is_active", true),
      supabase.from("task_completions").select("task_template_id").eq("establishment_id", estId).eq("service_date", today),
      supabase.from("shifts").select("tips, tips_2").eq("user_id", user.id).eq("establishment_id", estId).gte("shift_date", `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`).lte("shift_date", `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${new Date(now.getFullYear(),now.getMonth()+1,0).getDate()}`),
      supabase.from("score_events").select("profile_id, points").eq("establishment_id", estId).gte("created_at", monthStart),
      (supabase.from as any)("staff_requests").select("id, profile_id, request_type, dates, time_requested, reason, summary, created_at, profile:profile_id(first_name, last_name, avatar_url)").eq("establishment_id", estId).eq("status", "pending_manager").order("created_at", { ascending: true }),
      fetch('/api/protocols/read-counts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ establishment_id: estId }) }).then(r => r.ok ? r.json() : { reads: [] }).catch(() => ({ reads: [] })),
    ]);
    const members = (membersRes.data ?? []) as Array<{ profile_id: string; role: string; job_title: string | null; profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null }>;
    const delays = (delaysRes.data ?? []) as Array<{ employee_id: string; shift_date: string }>;
    const rawProtocols = (protocolsRes.data ?? []) as Array<{ id: string; title: string; content?: string; is_mandatory: boolean; show_on_dashboard?: boolean; category?: string | null; steps?: unknown; attachment_url?: string | null; attachment_type?: string | null; created_at?: string | null }>;
    const reads = (readsRes.data ?? []) as Array<{ protocol_id: string; profile_id: string }>;
    const allReads = ((allReadsApiRes as { reads?: Array<{ protocol_id: string; profile_id: string }> })?.reads ?? reads);
    const rawFeedback = (feedbackRes.data ?? []) as Array<{ id: string; category: string; content: string; table_number: string | null; created_at: string }>;
    const myFirstName = (profileRes.data?.first_name ?? "");
    const myConfirmed = (confirmedRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id);
    const rawTasks = (taskTmplRes.data ?? []) as Array<{ id: string; title: string; category: string; is_active: boolean; requires_photo: boolean; frequency: string; target_role: string }>;
    const completedTodayIds = new Set(((taskCompRes.data ?? []) as Array<{ task_template_id: string | null }>).map(c => c.task_template_id));

    // For employees, only show tasks matching their job or "all"; managers see everything
    const myJobTitle = (memberData as unknown as { job_title?: string | null }).job_title ?? null;
    const relevantTasks = memberData.role === "employee"
      ? rawTasks.filter(t => t.target_role === "all" || t.target_role !== "manager")
      : rawTasks;

    // Compute overdue weekly tasks (not completed since Monday)
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const mondayStr = monday.toISOString().split("T")[0];
    const weeklyTaskIds = relevantTasks.filter(t => t.frequency === "weekly").map(t => t.id);
    let completedThisWeekIds = new Set<string>();
    if (weeklyTaskIds.length > 0) {
      const { data: weekComps } = await supabase.from("task_completions")
        .select("task_template_id")
        .eq("establishment_id", estId)
        .gte("service_date", mondayStr)
        .lte("service_date", today)
        .in("task_template_id", weeklyTaskIds);
      completedThisWeekIds = new Set((weekComps ?? []).map((c: { task_template_id: string | null }) => c.task_template_id).filter(Boolean) as string[]);
    }
    const overdue_weekly_tasks = relevantTasks
      .filter(t => t.frequency === "weekly" && !completedThisWeekIds.has(t.id))
      .map(t => ({ id: t.id, title: t.title, category: t.category }));

    const delayCounts: Record<string, number> = {};
    delays.forEach(d => { delayCounts[d.employee_id] = (delayCounts[d.employee_id] ?? 0) + 1; });
    const todayDelayCounts: Record<string, number> = {};
    delays.filter(d => d.shift_date === today).forEach(d => { todayDelayCounts[d.employee_id] = (todayDelayCounts[d.employee_id] ?? 0) + 1; });

    // Show all protocols from the establishment (no category filtering — avoids hiding newly created protocols)
    const visibleRawProtocols = rawProtocols;

    // Only count active (visible) protocols for reads KPI — hidden ones don't create pending reads
    const activeProtocolIds = new Set(visibleRawProtocols.filter(p => p.show_on_dashboard).map(p => p.id));
    const readsByProfile: Record<string, number> = {};
    allReads.forEach(r => { if (activeProtocolIds.has(r.protocol_id)) readsByProfile[r.profile_id] = (readsByProfile[r.profile_id] ?? 0) + 1; });

    const myReadIds = new Set(reads.filter(r => r.profile_id === user.id).map(r => r.protocol_id));
    const totalProtocols = activeProtocolIds.size;
    const unreadMandatory = visibleRawProtocols.filter(p => p.is_mandatory && p.show_on_dashboard && !myReadIds.has(p.id)).length;
    const unreadTotal = visibleRawProtocols.filter(p => p.show_on_dashboard && !myReadIds.has(p.id)).length;

    const totalNonOwners = members.filter(m => m.role === "employee").length;
    const readCountByProtocol: Record<string, number> = {};
    allReads.forEach(r => { readCountByProtocol[r.protocol_id] = (readCountByProtocol[r.protocol_id] ?? 0) + 1; });

    const protocols: Protocol[] = visibleRawProtocols.map(p => ({
      id: p.id, title: p.title, content: p.content ?? "", is_mandatory: p.is_mandatory,
      show_on_dashboard: p.show_on_dashboard ?? false,
      steps: Array.isArray(p.steps) ? (p.steps as Array<{ text: string; frequency?: string; photo_url?: string } | string>).map(s => typeof s === "string" ? { text: s } : s) : null,
      attachment_url: p.attachment_url ?? null,
      attachment_type: p.attachment_type ?? null,
      created_at: p.created_at ?? null,
      is_read: myReadIds.has(p.id),
      read_count: readCountByProtocol[p.id] ?? 0,
      total_members: totalNonOwners,
    }));

    const scoreEvents = (scoreEventsRes.data ?? []) as Array<{ profile_id: string; points: number }>;
    const scoreByProfile: Record<string, number> = {};
    scoreEvents.forEach(e => { scoreByProfile[e.profile_id] = (scoreByProfile[e.profile_id] ?? 0) + e.points; });
    const hasScoreEvents = scoreEvents.length > 0;

    const leaderboard: MemberScore[] = members
      .filter(m => m.role !== "owner")
      .map(m => {
        const del = delayCounts[m.profile_id] ?? 0;
        const read = readsByProfile[m.profile_id] ?? 0;
        const bonus = totalProtocols > 0 ? Math.round((read / totalProtocols) * 40) : 0;
        const score = hasScoreEvents
          ? (scoreByProfile[m.profile_id] ?? 0)
          : Math.max(0, 100 - del * 10 + bonus);
        const p = m.profiles;
        const fn = p?.first_name ?? "";
        const ln = p?.last_name ?? "";
        const todayDel = todayDelayCounts[m.profile_id] ?? 0;
        return { profile_id: m.profile_id, name: `${fn} ${ln}`.trim() || "-", first_name: fn, last_name: ln, avatar_url: p?.avatar_url ?? null, job_title: m.job_title, score, delays_count: del, today_delay_count: todayDel, protocols_read: read, protocols_total: totalProtocols, badge: null as MemberScore["badge"] };
      })
      .sort((a, b) => b.score - a.score)
      .map((m, i) => ({ ...m, badge: (["gold", "silver", "bronze"][i] ?? null) as MemberScore["badge"] }));

    const fbSummary: FeedbackSummary = { compliment: 0, complaint: 0, suggestion: 0, incident: 0, total: rawFeedback.length };
    rawFeedback.forEach(f => { if (f.category in fbSummary) (fbSummary as unknown as Record<string, number>)[f.category]++; });

    const feedbackItems: FeedbackItem[] = rawFeedback.map(f => ({ ...f, category: f.category as FeedbackCategory, confirmation_count: 0 }));

    const CATEGORY_LABELS: Record<string, string> = { opening: "Ouverture", continuous: "En continu", closing: "Fermeture", custom: "Ponctuel" };
    const CATEGORY_ORDER = ["opening", "continuous", "closing", "custom"];
    const tasksByCategory = CATEGORY_ORDER.map(cat => ({
      cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      tasks: relevantTasks.filter(t => t.category === cat),
    })).filter(g => g.tasks.length > 0);

    const task_stats: TaskStat[] = tasksByCategory.map(g => ({
      label: g.label,
      done: g.tasks.filter(t => completedTodayIds.has(t.id)).length,
      total: g.tasks.length,
      period: "today",
      tasks: g.tasks.map(t => ({ id: t.id, title: t.title, done: completedTodayIds.has(t.id), category: t.category, requires_photo: t.requires_photo })),
    }));

    const todayStart = now.toISOString().split("T")[0];
    const todayDelays = delays.filter(d => d.shift_date === todayStart).length;
    const todayFeedbackCount = rawFeedback.filter(f => f.created_at.startsWith(todayStart)).length;

    setData({
      role: memberData.role, my_profile_id: user.id, my_first_name: myFirstName, establishment_id: estId,
      protocols, leaderboard, feedback_summary: fbSummary, feedback_items: feedbackItems, my_confirmed_feedback: myConfirmed,
      delays_this_month: delays.filter(d => d.employee_id === user.id).length,
      today_delays: todayDelays,
      today_feedback: todayFeedbackCount,
      active_challenges: challengesRes.data?.length ?? 0,
      active_challenges_list: (challengesRes.data ?? []) as ChallengeItem[],
      pending_requests: (pendingReqRes.data ?? []).length,
      pending_requests_list: (pendingReqRes.data ?? []).map((r: any) => {
        const p = r.profile as any;
        return { ...r, employee_name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu", employee_avatar: p?.avatar_url ?? null };
      }) as PendingRequestDash[],
      unread_mandatory: unreadMandatory, unread_total: unreadTotal,
      task_stats,
      overdue_weekly_tasks,
    });
    } catch {
      // silence errors
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-28 animate-pulse mb-4" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  const isManager = data.role === "owner" || data.role === "manager";
  return isManager
    ? <ManagerDashboard data={data} onTaskValidated={loadDashboard} />
    : <EmployeeDashboard data={data} onTaskValidated={loadDashboard} />;
}

/* ─── PROTOCOL CREATION MODAL ───────────────────────── */
type ProtocolCategory = "salle" | "cuisine" | "bar" | "accueil" | "hygiene" | "securite" | "ouverture" | "fermeture";

const PROTO_CATEGORIES: { key: ProtocolCategory; label: string; icon: React.ElementType; color: string; text: string }[] = [
  { key: "salle",     label: "Salle",     icon: LayoutGrid,      color: "rgba(113,113,122,0.15)", text: "#A1A1AA" },
  { key: "cuisine",   label: "Cuisine",   icon: UtensilsCrossed, color: "rgba(245,158,11,0.13)", text: "#FBBF24" },
  { key: "bar",       label: "Bar",       icon: Wine,            color: "rgba(6,182,212,0.13)",  text: "var(--accent)" },
  { key: "accueil",   label: "Accueil",   icon: Users,           color: "rgba(16,185,129,0.13)", text: "var(--success)" },
  { key: "hygiene",   label: "Hygiène",   icon: Sparkles,        color: "rgba(6,182,212,0.12)",  text: "var(--accent)" },
  { key: "securite",  label: "Sécurité",  icon: ShieldCheck,     color: "rgba(239,68,68,0.12)",  text: "var(--danger)" },
  { key: "ouverture", label: "Ouverture", icon: Sunrise,         color: "rgba(16,185,129,0.12)", text: "var(--success)" },
  { key: "fermeture", label: "Fermeture", icon: Sunset,          color: "rgba(245,158,11,0.12)", text: "var(--warning)" },
];

function AddProtocolModal({ data, onClose, onAdded }: { data: DashboardData; onClose: () => void; onAdded: (p: Protocol) => void }) {
  const supabase = createClient();
  const [step, setStep] = useState<"category" | "form">("category");
  const [category, setCategory] = useState<ProtocolCategory>("salle");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = PROTO_CATEGORIES.find(c => c.key === category)!;

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    if (DEV_MODE) {
      const newP: Protocol = { id: `p-${Date.now()}`, title, content, category, is_mandatory: mandatory, is_read: false, read_count: 0, total_members: data.leaderboard.length };
      onAdded(newP); onClose(); return;
    }
    const { data: inserted } = await supabase.from("protocols").insert({ establishment_id: data.establishment_id, author_id: data.my_profile_id, title, content: content || "", category: category as unknown as undefined, is_mandatory: mandatory, show_on_dashboard: true }).select().single();
    if (inserted) {
      onAdded({ id: (inserted as { id: string }).id, title, content, category, is_mandatory: mandatory, is_read: false, read_count: 0, total_members: data.leaderboard.length });
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishmentId: data.establishment_id,
          title: 'Nouveau protocole',
          body: `"${title}" a été publié. Appuie pour le lire.`,
          url: '/protocols',
        }),
      }).catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {step === "form" && <button onClick={() => setStep("category")} style={{ color: "var(--foreground-dim)", marginRight: 2 }}><ArrowLeft size={16} /></button>}
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{step === "category" ? "Choisir une catégorie" : "Nouveau protocole"}</p>
            {step === "form" && <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: selectedCat.color, color: selectedCat.text }}>{selectedCat.label}</span>}
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>
        {step === "category" && (
          <div className="p-4 grid grid-cols-2 gap-2">
            {PROTO_CATEGORIES.map(cat => { const Icon = cat.icon; return (
              <button key={cat.key} onClick={() => { setCategory(cat.key); setStep("form"); }} className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.97]" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.color }}><Icon size={14} strokeWidth={1.5} style={{ color: cat.text }} /></div>
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{cat.label}</span>
              </button>
            ); })}
          </div>
        )}
        {step === "form" && (
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Procédure de nettoyage" autoFocus className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Contenu <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel)</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Décrivez le protocole..." rows={4} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div onClick={() => setMandatory(!mandatory)} className="relative flex-shrink-0 rounded-sm transition-colors cursor-pointer" style={{ width: 18, height: 18, background: mandatory ? "var(--accent)" : "var(--background-soft)", border: `1px solid ${mandatory ? "var(--accent)" : "var(--border)"}` }}>
                {mandatory && <svg className="absolute inset-0 m-auto" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#09090B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>Lecture obligatoire</span>
            </label>
            <button onClick={submit} disabled={submitting || !title.trim()} className="w-full py-3 text-sm font-semibold rounded-lg transition-opacity" style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (submitting || !title.trim()) ? 0.5 : 1 }}>
              {submitting ? "Création…" : "Créer le protocole"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TASK GAUGE POPUP ──────────────────────────────── */
function TaskGaugePopup({ stats, onClose, establishmentId, profileId, onValidated }: {
  stats: TaskStat;
  onClose: () => void;
  establishmentId: string;
  profileId: string;
  onValidated: () => void;
}) {
  const [taskList, setTaskList] = useState(stats.tasks ?? []);
  const todo = taskList.filter(t => !t.done);
  const done = taskList.filter(t => t.done);
  const localDone = done.length;
  const total = taskList.length || stats.total;
  const pct = total > 0 ? Math.round((localDone / total) * 100) : 0;
  const allDone = localDone >= total && total > 0;
  const color = allDone ? "var(--success)" : pct >= 50 ? "var(--accent)" : "var(--warning)";

  const [validating, setValidating] = useState<{ id: string; title: string; requiresPhoto: boolean } | null>(null);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [claims, setClaims] = useState<{ id: string; task_template_id: string | null; task_one_shot_id: string | null; profile_id: string; first_name: string | null }[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [myFirstName, setMyFirstName] = useState("");

  const canValidate = stats.period === "today";

  useEffect(() => {
    if (!canValidate || DEV_MODE) return;
    const today = new Date().toISOString().split("T")[0];
    const supabase = createClient();
    supabase.from("task_claims").select("id, task_template_id, task_one_shot_id, profile_id, first_name").eq("establishment_id", establishmentId).eq("service_date", today)
      .then(({ data }) => setClaims((data ?? []) as typeof claims));
    supabase.from("profiles").select("first_name").eq("id", profileId).single()
      .then(({ data }) => setMyFirstName((data as { first_name: string | null } | null)?.first_name ?? ""));
  }, [canValidate, establishmentId, profileId]);

  async function claimTask(taskId: string) {
    setClaiming(taskId);
    const today = new Date().toISOString().split("T")[0];
    const supabase = createClient();
    await supabase.from("task_claims").insert({ establishment_id: establishmentId, task_template_id: taskId, profile_id: profileId, first_name: myFirstName, service_date: today });
    const { data } = await supabase.from("task_claims").select("id, task_template_id, task_one_shot_id, profile_id, first_name").eq("establishment_id", establishmentId).eq("service_date", today);
    setClaims((data ?? []) as typeof claims);
    setClaiming(null);
  }

  async function unclaimTask(claimId: string) {
    setClaiming(claimId);
    const supabase = createClient();
    await supabase.from("task_claims").delete().eq("id", claimId);
    setClaims(prev => prev.filter(c => c.id !== claimId));
    setClaiming(null);
  }

  async function unvalidateTask(taskId: string) {
    const today = new Date().toISOString().split("T")[0];
    const supabase = createClient();
    await supabase.from("task_completions").delete().eq("task_template_id", taskId).eq("establishment_id", establishmentId).eq("service_date", today);
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, done: false } : t));
  }

  async function submitValidation() {
    if (!validating) return;
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];

    if (DEV_MODE) {
      setTaskList(prev => prev.map(t => t.id === validating.id ? { ...t, done: true } : t));
      setValidating(null);
      setNotes("");
      setPhoto(null);
      setSubmitting(false);
      onValidated();
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    let photoUrl: string | null = null;
    if (photo) {
      const compressed = await compressImage(photo);
      const fileName = `${establishmentId}/${today}/${validating.id}-${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage.from("task-photos").upload(fileName, compressed, { contentType: "image/jpeg" });
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("task-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    await supabase.from("task_completions").insert({
      establishment_id: establishmentId,
      task_template_id: validating.id,
      validated_by: user.id,
      service_date: today,
      photo_url: photoUrl,
      notes: notes || null,
      is_catchup: false,
    });

    setTaskList(prev => prev.map(t => t.id === validating.id ? { ...t, done: true } : t));
    setValidating(null);
    setNotes("");
    setPhoto(null);
    setSubmitting(false);
    onValidated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) { if (validating) setValidating(null); else onClose(); } }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {validating ? (
              <button onClick={() => setValidating(null)} style={{ color: "var(--foreground-dim)" }}>
                <ArrowLeft size={16} />
              </button>
            ) : (
              <BarChart2 size={14} style={{ color: "var(--accent)" }} />
            )}
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {validating ? validating.title : `Avancement · ${stats.label}`}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        {validating ? (
          /* Mini form de validation */
          <div className="p-5 space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[13px] font-medium"
              style={{
                background: photo ? "rgba(16,185,129,0.08)" : "var(--background)",
                border: photo ? "1px solid rgba(16,185,129,0.3)" : "2px dashed var(--border-strong)",
                color: photo ? "var(--success)" : "var(--foreground-dim)",
              }}
            >
              {photo
                ? <><CheckCircle2 size={14} />{photo.name}</>
                : <><Circle size={14} />{validating.requiresPhoto ? "Ajouter une photo" : "Photo (optionnel)"}</>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            <input
              type="text"
              placeholder="Notes (optionnel)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button
              onClick={submitValidation}
              disabled={submitting || (validating.requiresPhoto && !photo)}
              className="w-full py-3 rounded-xl text-[13px] font-semibold transition-opacity"
              style={{ background: "var(--success)", color: "var(--primary-foreground)", opacity: submitting || (validating.requiresPhoto && !photo) ? 0.5 : 1 }}
            >
              {submitting ? "Validation…" : "Tâche validée ✓"}
            </button>
          </div>
        ) : (
          <>
            {/* Gauge visuelle */}
            <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-4xl font-bold" style={{ color }}>{pct}%</p>
                <div className="text-right">
                  <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{localDone}<span className="text-sm font-normal" style={{ color: "var(--foreground-dim)" }}>/{total}</span></p>
                  <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>tâches validées</p>
                </div>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: "var(--background-soft)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
              </div>
              {allDone && (
                <p className="text-[12px] mt-2 text-center" style={{ color: "var(--success)" }}>✓ Toutes les tâches sont faites !</p>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 220px)" }}>
              {taskList.length > 0 ? (
                <>
                  {todo.length > 0 && (
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>À faire ({todo.length})</p>
                      <div className="space-y-1.5">
                        {todo.map((t, i) => {
                          const claim = t.id ? claims.find(c => c.task_template_id === t.id) : null;
                          const claimedByMe = claim?.profile_id === profileId;
                          const isClaimingThis = claiming === t.id || claiming === claim?.id;
                          return (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                            style={{ background: "var(--background-soft)", border: `1px solid ${claim && !claimedByMe ? "rgba(245,158,11,0.3)" : "var(--border)"}` }}>
                            <Circle size={14} style={{ color: claim && !claimedByMe ? "#F59E0B" : "var(--foreground-dim)", flexShrink: 0 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: claim && !claimedByMe ? "var(--foreground-dim)" : "var(--foreground)" }}>{t.title}</p>
                              {claim && <p className="text-[10px]" style={{ color: claimedByMe ? "var(--accent)" : "#F59E0B" }}>{claimedByMe ? `En cours · ${myFirstName || "moi"}` : `Pris par ${claim.first_name ?? "quelqu'un"}`}</p>}
                            </div>
                            {canValidate && t.id && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                {!claim && <button onClick={() => claimTask(t.id!)} disabled={!!isClaimingThis} className="text-[11px] px-2 py-1 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)", opacity: isClaimingThis ? 0.5 : 1 }}>Je prends</button>}
                                {(!claim || claimedByMe) && <button onClick={() => setValidating({ id: t.id!, title: t.title, requiresPhoto: t.requires_photo ?? false })} className="text-[11px] px-2 py-1 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>Valider</button>}
                                {claimedByMe && claim && <button onClick={() => unclaimTask(claim.id)} className="text-[11px] px-1.5 py-1 rounded opacity-40 hover:opacity-100" style={{ color: "var(--foreground-dim)" }}>✕</button>}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {done.length > 0 && (
                    <div className="px-4 pt-3 pb-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Terminé ({done.length})</p>
                      <div className="space-y-1.5">
                        {done.map((t, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <CheckCircle2 size={14} style={{ color: "var(--success)", flexShrink: 0 }} />
                            <p className="text-[13px] truncate flex-1" style={{ color: "var(--foreground-muted)", textDecoration: "line-through" }}>{t.title}</p>
                            {canValidate && t.id && (
                              <button onClick={() => unvalidateTask(t.id!)} className="text-[10px] px-2 py-0.5 rounded flex-shrink-0" style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)", opacity: 0.6 }}>Annuler</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Résumé {stats.label.toLowerCase()} · {stats.done} tâches validées sur {stats.total}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <a href="/me/tasks" className="block w-full py-2.5 text-center text-sm font-semibold rounded-lg" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
                Voir toutes les tâches →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MANAGER VIEW ─────────────────────────────────── */
function ManagerDashboard({ data, onTaskValidated }: { data: DashboardData; onTaskValidated: () => void }) {
  const [month, setMonth] = useState("");
  useEffect(() => { setMonth(new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })); }, []);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackCategory | null>(null);
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>(data.protocols);
  const [taskGaugePopup, setTaskGaugePopup] = useState<TaskStat | null>(null);
  const [kpiPopup, setKpiPopup] = useState<"delays" | "feedback" | "challenges" | "protocols" | "requests" | null>(null);
  const [protocolPopup, setProtocolPopup] = useState<Protocol | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestDash[]>(data.pending_requests_list);
  const [refusingReq, setRefusingReq] = useState<PendingRequestDash | null>(null);
  const [refuseNote, setRefuseNote] = useState("");
  const supabaseDash = createClient();
  const [stepsTaken, setStepsTaken] = useState<Set<string>>(new Set());
  const [stepsDone, setStepsDone] = useState<Set<string>>(new Set());
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scoreDetailMember, setScoreDetailMember] = useState<MemberScore | null>(null);
  const [scoreDetailEvents, setScoreDetailEvents] = useState<any[]>([]);
  const [scoreDetailLoading, setScoreDetailLoading] = useState(false);

  async function openScoreDetail(member: MemberScore) {
    setScoreDetailMember(member);
    setScoreDetailLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await supabaseDash.from("score_events")
      .select("id, source_type, source_label, reason, attributed_by_name, points, created_at")
      .eq("profile_id", member.profile_id)
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false });
    setScoreDetailEvents(data ?? []);
    setScoreDetailLoading(false);
  }

  async function runAiAnalysis() {
    setShowAiPanel(true);
    setAiContent("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishment_id: data.establishment_id }),
      });
      if (!res.ok || !res.body) { setAiContent("Erreur lors de l'analyse."); setAiLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setAiContent(result);
      }
    } catch {
      setAiContent("Erreur de connexion.");
    } finally {
      setAiLoading(false);
    }
  }

  const handleProtocolAdded = (p: Protocol) => setProtocols(prev => [p, ...prev]);

  async function approveRequest(req: PendingRequestDash) {
    await (supabaseDash.from as any)("staff_requests").update({ status: "approved", reviewed_by: data.my_profile_id, reviewed_at: new Date().toISOString() }).eq("id", req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    fetch("/api/push/send-to-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande validée ✓", body: req.summary, url: "/me/requests" }) }).catch(() => {});
  }

  async function refuseRequest(req: PendingRequestDash, note: string) {
    await (supabaseDash.from as any)("staff_requests").update({ status: "rejected", reviewed_by: data.my_profile_id, reviewed_at: new Date().toISOString(), manager_note: note || null }).eq("id", req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    fetch("/api/push/send-to-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: req.profile_id, title: "Demande refusée", body: note ? `${req.summary} — "${note}"` : req.summary, url: "/me/requests" }) }).catch(() => {});
    setRefusingReq(null);
    setRefuseNote("");
  }
  const modalItems = feedbackModal ? data.feedback_items.filter(f => f.category === feedbackModal) : [];
  const modalMeta = feedbackModal ? CATEGORY_META[feedbackModal] : null;

  const todayStat = data.task_stats.find(s => s.period === "today");
  const weekStat = data.task_stats.find(s => s.period === "week");

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="px-4 py-8 lg:px-10 max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Vue d'ensemble</MonoLabel>
          <h1 className="text-2xl font-semibold capitalize" style={{ color: "var(--foreground)" }}>{month}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={runAiAnalysis}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}
            title="Analyse IA du mois"
          >
            <BrainCircuit size={15} />
            <span className="hidden sm:inline">Analyse IA</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
            title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Protocoles à signer — en haut si non vides */}
      {(() => {
        const unsigned = protocols.filter(p =>
          p.is_mandatory &&
          p.total_members > 0 &&
          p.read_count < p.total_members
        );
        if (unsigned.length === 0) return null;
        return (
          <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: "var(--danger)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Protocoles à signer</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAddProtocol(true)} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-opacity hover:opacity-75" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
                  <Plus size={12} /> Ajouter
                </button>
                <a href="/protocols" className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Gérer</a>
              </div>
            </div>
            <div>
              {unsigned.map((p, i) => {
                const pct = p.total_members > 0 ? Math.round((p.read_count / p.total_members) * 100) : 0;
                return (
                  <button key={p.id} onClick={() => setProtocolPopup(p)}
                    className="w-full text-left px-5 py-3.5 flex items-center gap-4 transition-opacity active:opacity-70"
                    style={{ borderBottom: i < unsigned.length - 1 ? "1px solid rgba(239,68,68,0.15)" : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{p.title}</p>
                        {p.is_mandatory && <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Obligatoire</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(239,68,68,0.15)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--danger)" }} />
                        </div>
                        <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{p.read_count}/{p.total_members} signé{p.read_count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Clock, value: data.today_delays, label: "Retards aujourd'hui", warn: data.today_delays > 0, popup: "delays" as const },
          { icon: MessageSquare, value: data.today_feedback, label: "Avis clients aujourd'hui", warn: false, popup: "feedback" as const },
          { icon: Inbox, value: pendingRequests.length, label: "Demandes en attente", warn: pendingRequests.length > 0, popup: "requests" as const },
          { icon: BookOpen, value: data.leaderboard.reduce((s, m) => s + Math.max(0, m.protocols_total - m.protocols_read), 0), label: "Lectures en attente", warn: true, popup: "protocols" as const },
        ].map(({ icon: Icon, value, label, warn, popup }) => (
          <button key={label} onClick={() => setKpiPopup(popup)} className="rounded-xl p-4 text-left transition-opacity hover:opacity-75 active:scale-[0.98]" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xl font-semibold" style={{ color: warn && value > 0 ? "var(--warning)" : "var(--foreground)" }}>{value}</p>
              <Icon size={15} style={{ color: "var(--foreground-dim)" }} />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>{label}</p>
          </button>
        ))}
      </div>

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Colonne gauche : Tâches + Avis clients + Protocoles */}
        <div className="space-y-6">

          {/* 1. Tâches — jauge */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Avancement des tâches</p>
              </div>
              <a href="/tasks" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
            </div>
            <div className="p-5 space-y-4" style={{ background: "var(--background-elev)" }}>
              {data.task_stats.map(stat => {
                const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
                const allDone = stat.done >= stat.total && stat.total > 0;
                const color = allDone ? "var(--success)" : pct >= 50 ? "var(--accent)" : "var(--warning)";
                return (
                  <button key={stat.period} onClick={() => setTaskGaugePopup(stat)} className="w-full text-left transition-opacity hover:opacity-80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{stat.label}</span>
                        <ChevronRight size={12} style={{ color: "var(--foreground-dim)" }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono" style={{ color: allDone ? "var(--success)" : "var(--foreground-dim)" }}>
                          {stat.done}/{stat.total}
                        </span>
                        <span className="text-[11px] font-mono font-semibold" style={{ color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--background-soft)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </button>
                );
              })}
              {data.task_stats.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--foreground-dim)" }}>Aucune tâche configurée</p>
              )}
              {data.overdue_weekly_tasks.length > 0 && (
                <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--danger)" }}>
                    À faire cette semaine · {data.overdue_weekly_tasks.length}
                  </p>
                  <div className="space-y-1.5">
                    {data.overdue_weekly_tasks.map(t => (
                      <a key={t.id} href="/tasks"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <AlertCircle size={12} style={{ color: "var(--danger)", flexShrink: 0 }} />
                        <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{t.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Protocoles épinglés sur le dashboard */}
          {protocols.filter(p => p.show_on_dashboard).length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Protocoles à suivre</p>
                </div>
                <a href="/protocols" className="text-[11px]" style={{ color: "var(--accent)" }}>Gérer</a>
              </div>
              <div style={{ background: "var(--background-elev)" }}>
                {protocols.filter(p => p.show_on_dashboard).map((p, i, arr) => {
                  const totalSteps = p.steps?.length ?? 0;
                  const doneSteps = totalSteps > 0 ? [...stepsDone].filter(k => k.startsWith(`${p.id}_`)).length : 0;
                  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
                  return (
                    <button key={p.id} onClick={() => setProtocolPopup(p)} className="w-full text-left px-5 py-3.5"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[12px] font-medium truncate" style={{ color: "var(--foreground)" }}>{p.title}</span>
                          {p.is_mandatory && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>Obligatoire</span>}
                        </div>
                        <span className="text-[11px] font-mono flex-shrink-0 ml-2" style={{ color: pct === 100 ? "var(--success)" : "var(--foreground-dim)" }}>{doneSteps}/{totalSteps}</span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 4, background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--accent)" }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Retours clients */}
          {(() => {
            const grouped = Object.values(
              data.feedback_items.reduce((acc, f) => {
                const key = f.content.trim().toLowerCase();
                if (!acc[key]) acc[key] = { content: f.content, count: 0, category: f.category as FeedbackCategory };
                acc[key].count++;
                return acc;
              }, {} as Record<string, { content: string; count: number; category: FeedbackCategory }>)
            ).sort((a, b) => b.count - a.count).slice(0, 4);
            return (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Retours clients ce mois</p>
                  </div>
                </div>
                <div style={{ background: "var(--background-elev)" }}>
                  {grouped.length === 0 ? (
                    <p className="px-5 py-4 text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun retour ce mois</p>
                  ) : grouped.map((item, i) => {
                    const meta = CATEGORY_META[item.category];
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3.5"
                        style={{ borderBottom: i < grouped.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                        <p className="flex-1 text-[13px] truncate" style={{ color: "var(--foreground)" }}>{item.content}</p>
                        <span className="text-[13px] font-semibold flex-shrink-0" style={{ color: meta.color }}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
                <a href="/customer-feedback"
                  className="block w-full text-center py-3 text-[12px] font-medium"
                  style={{ background: "var(--background-elev)", borderTop: "1px solid var(--border-soft)", color: "var(--accent)" }}>
                  Voir plus
                </a>
              </div>
            );
          })()}


        </div>

        {/* Colonne droite : Défis + Classement + Ponctualité */}
        <div className="space-y-6">

          {/* 4. Demandes d'absence */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${pendingRequests.length > 0 ? "rgba(245,158,11,0.3)" : "var(--border)"}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: pendingRequests.length > 0 ? "rgba(245,158,11,0.05)" : "var(--background-elev)", borderBottom: `1px solid ${pendingRequests.length > 0 ? "rgba(245,158,11,0.2)" : "var(--border)"}` }}>
              <div className="flex items-center gap-2">
                <Inbox size={14} style={{ color: pendingRequests.length > 0 ? "var(--warning)" : "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Demandes d'absence</p>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--warning)", color: "var(--background)" }}>{pendingRequests.length}</span>
                )}
              </div>
              <a href="/requests" className="text-[11px]" style={{ color: "var(--accent)" }}>Tout voir</a>
            </div>
            <div style={{ background: "var(--background-elev)" }}>
              {pendingRequests.length === 0 ? (
                <p className="px-5 py-4 text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucune demande en attente</p>
              ) : (
                pendingRequests.map((req, i) => {
                  const TYPE_COLORS: Record<string, string> = { leave: "#8B5CF6", unavailability: "#F59E0B", late: "#EF4444", early_leave: "#F97316", shift_swap: "#06B6D4", other: "#71717A" };
                  const TYPE_LABELS: Record<string, string> = { leave: "Congé", unavailability: "Indispo", late: "Retard", early_leave: "Départ", shift_swap: "Échange", other: "Autre" };
                  const color = TYPE_COLORS[req.request_type] ?? "#71717A";
                  const datesStr = req.dates?.length ? req.dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })).join(", ") : null;
                  return (
                    <div key={req.id} style={{ borderBottom: i < pendingRequests.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                      <div className="px-4 py-3 flex items-start gap-2.5">
                        <div className="w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>{req.employee_name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{TYPE_LABELS[req.request_type] ?? req.request_type}</span>
                          </div>
                          <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{req.summary}</p>
                          {datesStr && <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{datesStr}</p>}
                        </div>
                      </div>
                      <div className="px-4 pb-3 flex gap-2">
                        <button onClick={() => approveRequest(req)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: "var(--success)", color: "white" }}>
                          <Check size={11} strokeWidth={2.5} />Valider
                        </button>
                        <button onClick={() => { setRefusingReq(req); setRefuseNote(""); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <X size={11} strokeWidth={2.5} />Refuser
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4b. Défis en cours */}
          {data.active_challenges_list.length > 0 && (
            <button
              onClick={() => setKpiPopup("challenges")}
              className="w-full rounded-xl overflow-hidden text-left transition-opacity hover:opacity-90"
              style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Trophy size={14} style={{ color: "#F59E0B" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Défis en cours</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>{data.active_challenges_list.length}</span>
                </div>
                <ChevronRight size={14} style={{ color: "var(--foreground-dim)" }} />
              </div>
              <div style={{ background: "var(--background-elev)" }}>
                {data.active_challenges_list.slice(0, 2).map((c, i) => {
                  const pct = c.target_value && c.target_value > 0 ? Math.min(100, Math.round((c.current_value / c.target_value) * 100)) : 0;
                  const daysLeft = c.ends_at ? Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000)) : null;
                  return (
                    <div key={c.id} className="px-4 py-3" style={{ borderBottom: i < Math.min(data.active_challenges_list.length, 2) - 1 ? "1px solid var(--border-soft)" : "none" }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{c.title}</p>
                        {daysLeft !== null && <span className="text-[9px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: daysLeft <= 2 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: daysLeft <= 2 ? "var(--danger)" : "var(--warning)" }}>{daysLeft}j</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "var(--background-soft)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "#F59E0B" }} />
                        </div>
                        <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{c.current_value}{c.target_value ? `/${c.target_value}` : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </button>
          )}

          {/* 5. Classement équipe */}
          {data.leaderboard.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center gap-2" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Classement équipe</p>
              </div>
              {data.leaderboard.map((member, i) => {
                const b = member.badge ? BADGE_CONFIG[member.badge] : null;
                return (
                  <button
                    key={member.profile_id}
                    onClick={() => openScoreDetail(member)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-white/[0.02] active:opacity-70"
                    style={{ background: "var(--background-elev)", borderBottom: i < data.leaderboard.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="w-6 text-center flex-shrink-0">
                      {b ? <BadgeRank rank={b.rank} color={b.color} bg={b.bg} size={22} /> : <span className="text-sm font-mono" style={{ color: "var(--foreground-dim)" }}>{i + 1}</span>}
                    </div>
                    <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={30} />
                    <p className="flex-1 text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{member.name}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{member.score}</p>
                      <p className="text-[9px] font-mono" style={{ color: "var(--foreground-dim)" }}>pts</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Modals */}
      {feedbackModal && modalMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: modalMeta.color }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{modalMeta.label}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: modalMeta.bg, color: modalMeta.color }}>{modalItems.length}</span>
              </div>
              <button onClick={() => setFeedbackModal(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 60px)" }}>
              {modalItems.length === 0 ? (
                <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun avis dans cette catégorie</p></div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {modalItems.map(item => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        {item.table_number && <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "var(--background-soft)", color: "var(--foreground-dim)" }}>Table {item.table_number}</span>}
                        <span className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{item.content}</p>
                      {item.confirmation_count > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <ThumbsUp size={11} style={{ color: "var(--foreground-dim)" }} />
                          <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{item.confirmation_count} collègue{item.confirmation_count > 1 ? "s" : ""} ont eu le même retour</span>
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

      {showAddProtocol && <AddProtocolModal data={data} onClose={() => setShowAddProtocol(false)} onAdded={handleProtocolAdded} />}
      {taskGaugePopup && <TaskGaugePopup stats={taskGaugePopup} onClose={() => setTaskGaugePopup(null)} establishmentId={data.establishment_id} profileId={data.my_profile_id} onValidated={() => { onTaskValidated(); }} />}

      {/* Protocol popup manager */}
      {protocolPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setProtocolPopup(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="flex items-start gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(6,182,212,0.1)" }}><BookOpen size={13} style={{ color: "var(--accent)" }} /></div>
                  {protocolPopup.is_mandatory && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}>Obligatoire</span>}
                </div>
                <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{protocolPopup.title}</p>
              </div>
              <button onClick={() => setProtocolPopup(null)} style={{ color: "var(--foreground-dim)", flexShrink: 0, marginLeft: 8 }}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {protocolPopup.content && <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground-muted)" }}>{protocolPopup.content}</p>}
              {protocolPopup.steps && protocolPopup.steps.length > 0 && (
                <div className="space-y-2">
                  {protocolPopup.steps.map((step, idx) => {
                    const key = `${protocolPopup.id}_${idx}`;
                    const taken = stepsTaken.has(key);
                    const done = stepsDone.has(key);
                    return (
                      <div key={idx} className="rounded-xl p-3" style={{ background: done ? "rgba(16,185,129,0.06)" : taken ? "rgba(6,182,212,0.05)" : "var(--background-soft)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : taken ? "rgba(6,182,212,0.2)" : "var(--border)"}` }}>
                        <div className="flex gap-2.5 items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                            style={{ background: done ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.15)", color: done ? "var(--success)" : "#A78BFA" }}>
                            {done ? "✓" : idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] leading-snug" style={{ color: done ? "var(--foreground-dim)" : "var(--foreground)", textDecoration: done ? "line-through" : "none" }}>{step.text}</p>
                            {step.frequency && <span className="text-[10px] font-mono mt-0.5 inline-block" style={{ color: "#A78BFA" }}>{{ daily: "Quotidien", opening: "Ouverture", closing: "Fermeture", continuous: "Continu" }[step.frequency] ?? step.frequency}</span>}
                            {step.photo_url && <img src={step.photo_url} alt="" className="mt-1.5 rounded-lg object-cover" style={{ width: "100%", maxHeight: 140 }} />}
                            {taken && !done && <p className="text-[10px] mt-1" style={{ color: "var(--accent)" }}>En cours</p>}
                          </div>
                        </div>
                        {!done && (
                          <div className="flex gap-1.5 mt-2.5 pl-7">
                            {!taken && <button onClick={() => setStepsTaken(prev => new Set([...prev, key]))} className="text-[11px] px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>Je prends</button>}
                            {taken && <button onClick={() => setStepsTaken(prev => { const s = new Set(prev); s.delete(key); return s; })} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Se désister</button>}
                            <button onClick={() => { setStepsDone(prev => new Set([...prev, key])); setStepsTaken(prev => { const s = new Set(prev); s.delete(key); return s; }); }} className="text-[11px] px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.25)" }}>Valider ✓</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!protocolPopup.content && (!protocolPopup.steps || protocolPopup.steps.length === 0) && <p className="text-sm text-center py-6" style={{ color: "var(--foreground-dim)" }}>Aucun contenu</p>}
            </div>
            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <a href="/protocols" className="block w-full text-center text-sm font-medium py-2.5 rounded-xl" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>Gérer les protocoles →</a>
            </div>
          </div>
        </div>
      )}

      {/* Refuse request modal — centered */}
      {refusingReq && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setRefusingReq(null); setRefuseNote(""); } }}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
            style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
            <div>
              <p className="text-[16px] font-bold">Refuser la demande</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>
                {refusingReq.employee_name} · {refusingReq.summary}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
                Motif <span className="normal-case tracking-normal font-normal">(optionnel)</span>
              </p>
              <textarea
                value={refuseNote}
                onChange={e => setRefuseNote(e.target.value)}
                placeholder="Ex: Service complet ce jour-là…"
                rows={3}
                className="w-full rounded-2xl px-4 py-3 text-[13px] outline-none resize-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRefusingReq(null); setRefuseNote(""); }}
                className="flex-1 rounded-2xl py-3 text-[13px] font-semibold"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                Annuler
              </button>
              <button onClick={() => refuseRequest(refusingReq, refuseNote)}
                className="flex-1 rounded-2xl py-3 text-[13px] font-bold"
                style={{ background: "var(--danger)", color: "white" }}>
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Popup */}
      {kpiPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setKpiPopup(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                {kpiPopup === "delays" && <><Clock size={14} style={{ color: "var(--warning)" }} /><p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Retards aujourd'hui</p></>}
                {kpiPopup === "feedback" && <><MessageSquare size={14} style={{ color: "var(--accent)" }} /><p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Avis clients aujourd'hui</p></>}
                {kpiPopup === "challenges" && <><Trophy size={14} style={{ color: "var(--warning)" }} /><p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Défis actifs</p></>}
                {kpiPopup === "protocols" && <><BookOpen size={14} style={{ color: "var(--accent)" }} /><p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Lectures en attente</p></>}
                {kpiPopup === "requests" && <><Inbox size={14} style={{ color: "var(--warning)" }} /><p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Demandes en attente</p></>}
              </div>
              <button onClick={() => setKpiPopup(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>

            {/* Corps */}
            <div className="overflow-y-auto flex-1">

              {/* RETARDS */}
              {kpiPopup === "delays" && (
                <div className="p-5">
                  {data.today_delays === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-2xl mb-1">✓</p>
                      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Aucun retard aujourd'hui</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Clock size={20} style={{ color: "var(--warning)" }} />
                        <div>
                          <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{data.today_delays}</p>
                          <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>retard{data.today_delays > 1 ? "s" : ""} déclaré{data.today_delays > 1 ? "s" : ""} ce jour</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {data.leaderboard.filter(m => m.today_delay_count > 0).map(m => (
                          <div key={m.profile_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                            <KarafAvatar firstName={m.first_name} lastName={m.last_name} avatarUrl={m.avatar_url} size={28} />
                            <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{m.name}</p>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
                              {m.today_delay_count} retard{m.today_delay_count > 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AVIS CLIENTS */}
              {kpiPopup === "feedback" && (() => {
                const today = new Date().toISOString().split("T")[0];
                const todayItems = data.feedback_items.filter(f => f.created_at.startsWith(today));
                return (
                  <div>
                    {todayItems.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun avis signalé aujourd'hui</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {todayItems.map(item => {
                          const meta = CATEGORY_META[item.category];
                          return (
                            <div key={item.id} className="px-5 py-4">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                                {item.table_number && <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Table {item.table_number}</span>}
                                <span className="text-[10px] ml-auto" style={{ color: "var(--foreground-dim)" }}>{new Date(item.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-[13px] leading-snug" style={{ color: "var(--foreground-muted)" }}>{item.content}</p>
                              {item.confirmation_count > 0 && (
                                <p className="text-[11px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
                                  +{item.confirmation_count} collègue{item.confirmation_count > 1 ? "s" : ""} confirme{item.confirmation_count > 1 ? "nt" : ""}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DÉFIS */}
              {kpiPopup === "challenges" && (
                <div>
                  {data.active_challenges_list.length === 0 ? (
                    <div className="px-5 py-10 text-center"><p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun défi actif</p></div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {data.active_challenges_list.map(c => {
                        const pct = c.target_value && c.target_value > 0 ? Math.min(100, Math.round((c.current_value / c.target_value) * 100)) : 0;
                        const daysLeft = c.ends_at ? Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000)) : null;
                        return (
                          <div key={c.id} className="px-5 py-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.title}</p>
                              {daysLeft !== null && <span className="text-[9px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: daysLeft <= 2 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: daysLeft <= 2 ? "var(--danger)" : "var(--warning)" }}>{daysLeft}j</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "var(--background-soft)" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "var(--warning)" }} />
                              </div>
                              <span className="text-[12px] font-mono font-semibold flex-shrink-0" style={{ color: "var(--foreground)" }}>{pct}%</span>
                            </div>
                            <p className="text-[11px] mt-1" style={{ color: "var(--foreground-dim)" }}>{c.current_value}{c.target_value ? ` / ${c.target_value}` : ""}{c.unit ? ` ${c.unit}` : ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PROTOCOLES — lectures en attente */}
              {kpiPopup === "protocols" && (
                <div>
                  {protocols.filter(p => p.show_on_dashboard && p.read_count < p.total_members && p.total_members > 0).length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-2xl mb-1">✓</p>
                      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Tous les protocoles ont été lus</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {protocols.filter(p => p.show_on_dashboard && p.read_count < p.total_members).map(p => {
                        const pct = p.total_members > 0 ? Math.round((p.read_count / p.total_members) * 100) : 0;
                        const remaining = p.total_members - p.read_count;
                        return (
                          <div key={p.id} className="px-5 py-4">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-sm font-medium flex-1" style={{ color: "var(--foreground)" }}>{p.title}</p>
                              {p.is_mandatory && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>Obligatoire</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "var(--background-soft)" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                              </div>
                              <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
                                {p.read_count}/{p.total_members} · {remaining} en attente
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* DEMANDES EN ATTENTE */}
              {kpiPopup === "requests" && (
                <div>
                  {pendingRequests.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-2xl mb-1">✓</p>
                      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Aucune demande en attente</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {pendingRequests.map(req => {
                        const TYPE_COLORS: Record<string, string> = { leave: "#8B5CF6", unavailability: "#F59E0B", late: "#EF4444", early_leave: "#F97316", shift_swap: "#06B6D4", other: "#71717A" };
                        const TYPE_LABELS: Record<string, string> = { leave: "CONGÉ", unavailability: "INDISPO", late: "RETARD", early_leave: "DÉPART", shift_swap: "ÉCHANGE", other: "AUTRE" };
                        const color = TYPE_COLORS[req.request_type] ?? "#71717A";
                        const datesStr = req.dates?.length ? req.dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })).join(", ") : null;
                        return (
                          <div key={req.id} className="px-5 py-4">
                            <div className="flex items-start gap-2 mb-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{req.employee_name}</span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{TYPE_LABELS[req.request_type] ?? req.request_type}</span>
                                </div>
                                <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>{req.summary}</p>
                                {datesStr && <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{datesStr}</p>}
                                {req.reason && <p className="text-[11px] mt-0.5 italic" style={{ color: "var(--foreground-dim)" }}>{req.reason}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => approveRequest(req)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold" style={{ background: "var(--success)", color: "white" }}>
                                <Check size={12} strokeWidth={2.5} />Valider
                              </button>
                              <button onClick={() => { setRefusingReq(req); setRefuseNote(""); setKpiPopup(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                <X size={12} strokeWidth={2.5} />Refuser
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer — lien vers la page complète */}
            <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <a
                href={kpiPopup === "delays" ? "/delays" : kpiPopup === "feedback" ? "/customer-feedback" : kpiPopup === "challenges" ? "/challenges" : kpiPopup === "requests" ? "/requests" : "/protocols"}
                className="block w-full py-2.5 text-center text-sm font-semibold rounded-lg"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}
                onClick={() => setKpiPopup(null)}>
                Voir tout →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI ANALYSIS PANEL ─────────────────────────── */}
      {showAiPanel && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.4)", WebkitBackdropFilter: "blur(2px)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowAiPanel(false)}
        />
      )}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--background)",
          borderLeft: "1px solid var(--border)",
          transform: showAiPanel ? "translateX(0)" : "translateX(100%)",
          boxShadow: showAiPanel ? "-4px 0 32px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <BrainCircuit size={16} style={{ color: "var(--primary-foreground)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Analyse IA</p>
              <p className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>30 derniers jours</p>
            </div>
          </div>
          <button onClick={() => setShowAiPanel(false)} style={{ color: "var(--foreground-dim)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {aiLoading && aiContent === "" ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "var(--foreground-dim)" }}>
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Analyse en cours…</p>
            </div>
          ) : aiContent ? (
            <div className="prose prose-sm max-w-none" style={{ color: "var(--foreground)" }}>
              {aiContent.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-3" />;
                if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
                  return <p key={i} className="text-base font-bold mt-5 mb-2" style={{ color: "var(--foreground)" }}>{trimmed.replace(/^#+\s+/, "")}</p>;
                }
                if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                  return <p key={i} className="text-sm font-semibold mt-4 mb-1" style={{ color: "var(--foreground)" }}>{trimmed.replace(/\*\*/g, "")}</p>;
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                  return (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full" style={{ background: "var(--accent)", marginTop: 7 }} />
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{trimmed.replace(/^[-•]\s+/, "")}</p>
                    </div>
                  );
                }
                // Handle inline bold (**text**)
                if (trimmed.includes("**")) {
                  const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i} className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {parts.map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j} style={{ color: "var(--foreground)" }}>{part.replace(/\*\*/g, "")}</strong>
                          : part
                      )}
                    </p>
                  );
                }
                return <p key={i} className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--foreground-muted)" }}>{trimmed}</p>;
              })}
              {aiLoading && (
                <span className="inline-flex items-center gap-1 text-xs mt-2" style={{ color: "var(--foreground-dim)" }}>
                  <Loader2 size={11} className="animate-spin" /> Génération…
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!aiLoading && aiContent && (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={runAiAnalysis}
              className="w-full py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
            >
              <BrainCircuit size={14} /> Relancer l'analyse
            </button>
          </div>
        )}
      </div>

      {/* Score detail popup */}
      {scoreDetailMember && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) setScoreDetailMember(null); }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "var(--background)", border: "1px solid var(--border)", maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <KarafAvatar firstName={scoreDetailMember.first_name} lastName={scoreDetailMember.last_name} avatarUrl={scoreDetailMember.avatar_url} size={34} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>{scoreDetailMember.name}</p>
                <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                  {scoreDetailMember.score} pts ce mois
                </p>
              </div>
            </div>
            <button onClick={() => setScoreDetailMember(null)} style={{ color: "var(--foreground-dim)" }}><X size={16} /></button>
          </div>
          {/* Events list */}
          <div className="overflow-y-auto flex-1">
            {scoreDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
              </div>
            ) : scoreDetailEvents.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun point ce mois-ci</p>
              </div>
            ) : (
              <div>
                {scoreDetailEvents.map((ev, i) => {
                  const isLast = i === scoreDetailEvents.length - 1;
                  const typeMap: Record<string, { label: string; color: string }> = {
                    protocol_view: { label: "Protocole lu", color: "#06B6D4" },
                    kudo_from_manager: { label: "Bravo manager", color: "#8B5CF6" },
                    kudo_from_peer: { label: "Bravo collègue", color: "#8B5CF6" },
                    review_received: { label: "Avis client", color: "#F59E0B" },
                    challenge_won: { label: "Défi gagné", color: "#10B981" },
                    manual_bonus: { label: "Bonus", color: "#F97316" },
                  };
                  const t = typeMap[ev.source_type] ?? { label: ev.source_type, color: "var(--foreground-dim)" };
                  const d = new Date(ev.created_at);
                  return (
                    <div key={ev.id} className="flex items-center gap-3 px-5 py-3"
                      style={{ borderBottom: isLast ? "none" : "1px solid var(--border-soft)" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>
                          {ev.source_label || ev.reason || t.label}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: `${t.color}15`, color: t.color }}>
                            {t.label}
                          </span>
                          <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>
                            {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold flex-shrink-0" style={{ color: "var(--foreground)" }}>+{ev.points}</span>
                    </div>
                  );
                })}
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
type QuickModal = "delay" | null;

function EmployeeDashboard({ data, onTaskValidated }: { data: DashboardData; onTaskValidated: () => void }) {
  const supabase = createClient();
  const myStats = data.leaderboard.find(m => m.profile_id === data.my_profile_id);
  const myRank = data.leaderboard.findIndex(m => m.profile_id === data.my_profile_id) + 1;
  const myBadge = myStats?.badge ? BADGE_CONFIG[myStats.badge] : null;
  const { theme, toggleTheme } = useTheme();
  const [greeting, setGreeting] = useState("Bonjour");
  useEffect(() => { const h = new Date().getHours(); setGreeting(h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"); }, []);

  const [modal, setModal] = useState<QuickModal>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set(data.my_confirmed_feedback));
  const [confirmCounts, setConfirmCounts] = useState<Record<string, number>>(
    Object.fromEntries(data.feedback_items.map(f => [f.id, f.confirmation_count]))
  );
  const [taskGaugePopup, setTaskGaugePopup] = useState<TaskStat | null>(null);
  const [fbDismissed, setFbDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("karaf-fb-dismissed");
      const localIds = stored ? (JSON.parse(stored) as string[]) : [];
      const validIds = new Set(data.feedback_items.map(f => f.id));
      const allDismissed = [...localIds, ...data.my_confirmed_feedback].filter(id => validIds.has(id));
      return new Set(allDismissed);
    } catch { return new Set(data.my_confirmed_feedback); }
  });
  const [mandatoryListOpen, setMandatoryListOpen] = useState(false);
  const [protocolPopup, setProtocolPopup] = useState<Protocol | null>(null);
  const [readProtocols, setReadProtocols] = useState<Set<string>>(new Set(data.protocols.filter(p => p.is_read).map(p => p.id)));
  const [stepsTaken, setStepsTaken] = useState<Set<string>>(new Set());
  const [stepsDone, setStepsDone] = useState<Set<string>>(new Set());

  const [statsPopup, setStatsPopup] = useState<"score" | "shifts" | null>(null);
  const [lastMonthData, setLastMonthData] = useState<{ score: number; shifts: number } | null>(null);
  const [currentMonthShifts, setCurrentMonthShifts] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);

  const openStatsPopup = async (type: "score" | "shifts") => {
    setStatsPopup(type);
    setBarsVisible(false);
    if (lastMonthData !== null) { setTimeout(() => setBarsVisible(true), 80); return; }
    setLoadingStats(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastEnd   = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [lmScore, lmShifts, cmShifts] = await Promise.all([
        supabase.from("score_events").select("points")
          .eq("profile_id", data.my_profile_id).eq("establishment_id", data.establishment_id)
          .gte("created_at", lastStart.toISOString()).lt("created_at", lastEnd.toISOString()),
        supabase.from("shifts").select("tips,tips_2")
          .eq("user_id", data.my_profile_id).eq("establishment_id", data.establishment_id)
          .gte("shift_date", lastStart.toISOString().slice(0, 10)).lt("shift_date", lastEnd.toISOString().slice(0, 10)),
        supabase.from("shifts").select("tips,tips_2")
          .eq("user_id", data.my_profile_id).eq("establishment_id", data.establishment_id)
          .gte("shift_date", thisStart.toISOString().slice(0, 10)),
      ]);
      const sumTips = (rows: { tips: number | null; tips_2: number | null }[]) =>
        rows.reduce((s, r) => s + (r.tips ?? 0) + (r.tips_2 ?? 0), 0);
      setLastMonthData({
        score: (lmScore.data ?? []).reduce((s: number, e: { points: number }) => s + e.points, 0),
        shifts: sumTips((lmShifts.data ?? []) as { tips: number | null; tips_2: number | null }[]),
      });
      setCurrentMonthShifts(sumTips((cmShifts.data ?? []) as { tips: number | null; tips_2: number | null }[]));
    } finally {
      setLoadingStats(false);
      setTimeout(() => setBarsVisible(true), 80);
    }
  };

  const openProtocol = async (p: Protocol) => {
    setProtocolPopup(p);
    if (!readProtocols.has(p.id)) {
      setReadProtocols(prev => new Set([...prev, p.id]));
      if (!DEV_MODE) {
        fetch('/api/protocols/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocol_id: p.id }),
        }).catch(() => {});
      }
    }
  };
  const [fbSwipeX, setFbSwipeX] = useState<Record<string, number>>({});
  const fbTouchStartX = useRef<Record<string, number>>({});
  const fbMouseDown = useRef<Record<string, boolean>>({});
  const SWIPE_THRESHOLD = 90;

  const handleFbTouchStart = (id: string, clientX: number) => {
    fbTouchStartX.current[id] = clientX;
  };
  const handleFbTouchMove = (id: string, clientX: number) => {
    const dx = clientX - (fbTouchStartX.current[id] ?? clientX);
    if (dx < 0) setFbSwipeX(prev => ({ ...prev, [id]: dx }));
  };
  const handleFbMouseDown = (id: string, clientX: number) => {
    fbMouseDown.current[id] = true;
    fbTouchStartX.current[id] = clientX;
  };
  const handleFbMouseMove = (id: string, clientX: number) => {
    if (!fbMouseDown.current[id]) return;
    const dx = clientX - (fbTouchStartX.current[id] ?? clientX);
    if (dx < 0) setFbSwipeX(prev => ({ ...prev, [id]: dx }));
  };
  const handleFbMouseUp = (id: string) => {
    if (!fbMouseDown.current[id]) return;
    fbMouseDown.current[id] = false;
    handleFbTouchEnd(id);
  };
  const handleFbTouchEnd = (id: string) => {
    if ((fbSwipeX[id] ?? 0) < -SWIPE_THRESHOLD) {
      setFbDismissed(prev => {
        const next = new Set([...prev, id]);
        try { localStorage.setItem("karaf-fb-dismissed", JSON.stringify([...next])); } catch {}
        return next;
      });
      if (!DEV_MODE) {
        const sb = createClient();
        sb.auth.getUser().then(({ data: { user } }) => {
          if (user) (sb.from("feedback_reads") as unknown as { upsert: (v: object) => Promise<unknown> }).upsert({ feedback_id: id, profile_id: user.id });
        });
      }
    }
    setFbSwipeX(prev => ({ ...prev, [id]: 0 }));
  };

  const [delayDate, setDelayDate] = useState(new Date().toISOString().split("T")[0]);
  const [delayMinutes, setDelayMinutes] = useState("15");
  const [delayReason, setDelayReason] = useState<"transport" | "personal" | "health" | "other">("transport");
  const closeModal = () => { setModal(null); setSubmitting(false); setDelayMinutes("15"); setDelayDate(new Date().toISOString().split("T")[0]); setDelayReason("transport"); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); closeModal(); setTimeout(() => setSuccessMsg(null), 3000); };

  const submitDelay = async () => {
    const mins = parseInt(delayMinutes, 10);
    if (!mins || mins <= 0) return;
    setSubmitting(true);
    if (DEV_MODE) { showSuccess("Retard déclaré ✓"); return; }
    await supabase.from("delays").insert({ establishment_id: data.establishment_id, employee_id: data.my_profile_id, shift_date: delayDate, delay_minutes: mins, reason: delayReason });
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishmentId: data.establishment_id,
        title: 'Retard déclaré',
        body: `${data.my_first_name} a déclaré ${mins} min de retard.`,
        url: '/delays',
        targetRole: 'manager',
      }),
    }).catch(() => {});
    showSuccess("Retard déclaré ✓");
  };

  const todayStat = data.task_stats.find(s => s.period === "today");
  const todayPct = todayStat && todayStat.total > 0 ? Math.round((todayStat.done / todayStat.total) * 100) : 0;
  const todayAllDone = todayStat ? todayStat.done >= todayStat.total && todayStat.total > 0 : false;

  const toggleConfirm = async (feedbackId: string) => {
    const isConfirmed = confirmedIds.has(feedbackId);
    const delta = isConfirmed ? -1 : 1;
    setConfirmedIds(prev => { const next = new Set(prev); if (isConfirmed) next.delete(feedbackId); else next.add(feedbackId); return next; });
    setConfirmCounts(prev => ({ ...prev, [feedbackId]: (prev[feedbackId] ?? 0) + delta }));
    if (!DEV_MODE) {
      if (isConfirmed) {
        await supabase.from("feedback_reads").delete().eq("profile_id", data.my_profile_id).eq("feedback_id", feedbackId);
      } else {
        await (supabase.from("feedback_reads") as unknown as { upsert: (v: object) => Promise<unknown> }).upsert({ profile_id: data.my_profile_id, feedback_id: feedbackId });
      }
    }
  };

  return (
    <div className="px-4 py-8 lg:px-10 max-w-7xl">
      {/* Greeting */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Mon tableau de bord</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            {greeting}{data.my_first_name ? `, ${data.my_first_name}` : ""} 👋
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: "var(--foreground-dim)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
          title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Actions rapides — tout en haut */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={() => setModal("delay")} className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-left transition-opacity active:scale-[0.97]" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
            <Clock size={15} style={{ color: "var(--warning)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>Retard</p>
            <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Déclarer</p>
          </div>
        </button>
        <button onClick={() => setShowFeedbackModal(true)} className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-left transition-opacity active:scale-[0.97]" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)" }}>
            <MessageSquare size={15} style={{ color: "var(--accent)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>Avis client</p>
            <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Signaler</p>
          </div>
        </button>
      </div>

      {/* Tips du mois — mode dispatch uniquement */}
      {data.tip_mode === "dispatch" && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--foreground-dim)" }}>Pourboires ce mois</p>
            <p className="text-[20px] font-bold font-mono" style={{ color: "#F59E0B" }}>{data.tips_this_month > 0 ? `${data.tips_this_month.toFixed(0)} €` : "—"}</p>
          </div>
          <a href="/shifts" className="text-[11px] px-3 py-1.5 rounded-base" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>Voir shifts →</a>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-medium" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "var(--success)" }}>
          {successMsg}
        </div>
      )}

      <PushNotificationBanner establishmentId={data.establishment_id} />

      {/* Alert protocoles — obligatoires OU épinglés sur dashboard non lus */}
      {(() => {
        const unreadPriority = data.protocols.filter(p => (p.is_mandatory || p.show_on_dashboard) && !readProtocols.has(p.id));
        const hasMandatory = unreadPriority.some(p => p.is_mandatory);
        return unreadPriority.length > 0 && (
          <button
            onClick={() => {
              if (unreadPriority.length === 1) {
                openProtocol(unreadPriority[0]);
              } else {
                setMandatoryListOpen(true);
              }
            }}
            className="w-full flex items-start gap-3 rounded-xl px-4 py-4 mb-6 transition-opacity hover:opacity-80 text-left"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle size={18} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {unreadPriority.length} protocole{unreadPriority.length > 1 ? "s" : ""} {hasMandatory ? "obligatoire" : "publié"}{unreadPriority.length > 1 ? "s" : ""} à lire
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
                Appuie pour {unreadPriority.length === 1 ? "lire et confirmer" : "voir la liste"}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />
          </button>
        );
      })()}

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* Colonne gauche */}
        <div className="space-y-6">

          {/* Protocoles — masqués si tous lus */}
          {data.protocols.some(p => !readProtocols.has(p.id)) && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Protocoles</p>
                </div>
                <a href="/protocols" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
              </div>
              {data.protocols.filter(p => !readProtocols.has(p.id)).slice(0, 3).map((p, i, arr) => {
                const isRead = readProtocols.has(p.id);
                return (
                  <button key={p.id} onClick={() => openProtocol(p)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-opacity hover:opacity-75"
                    style={{ background: isRead ? "var(--background-elev)" : "rgba(239,68,68,0.04)", borderBottom: i < arr.length - 1 ? `1px solid ${isRead ? "var(--border)" : "rgba(239,68,68,0.15)"}` : "none" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isRead ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${isRead ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                      {isRead ? <Check size={13} style={{ color: "var(--success)" }} /> : <BookOpen size={12} style={{ color: "var(--danger)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: isRead ? "var(--foreground)" : "var(--danger)" }}>{p.title}</p>
                      <p className="text-[11px]" style={{ color: isRead ? "var(--success)" : "rgba(239,68,68,0.7)" }}>
                        {p.is_mandatory && !isRead ? "⚠ Obligatoire · " : ""}{isRead ? "Lu ✓" : "Appuie pour lire"}
                      </p>
                    </div>
                    <ChevronRight size={13} style={{ color: isRead ? "var(--foreground-dim)" : "var(--danger)", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}


          {/* Tâches — jauge */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: todayAllDone ? "var(--success)" : "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Mes tâches</p>
              </div>
              <a href="/me/tasks" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
            </div>
            <div className="p-5 space-y-4" style={{ background: "var(--background-elev)" }}>
              {data.task_stats.map(stat => {
                const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
                const allDone = stat.done >= stat.total && stat.total > 0;
                const color = allDone ? "var(--success)" : pct >= 50 ? "var(--accent)" : "var(--warning)";
                return (
                  <button key={stat.period} onClick={() => setTaskGaugePopup(stat)} className="w-full text-left transition-opacity hover:opacity-80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{stat.label}</span>
                        <ChevronRight size={12} style={{ color: "var(--foreground-dim)" }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono" style={{ color: allDone ? "var(--success)" : "var(--foreground-dim)" }}>{stat.done}/{stat.total}</span>
                        <span className="text-[11px] font-mono font-semibold" style={{ color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--background-soft)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </button>
                );
              })}
              {data.task_stats.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--foreground-dim)" }}>Aucune tâche assignée</p>
              )}
              {data.overdue_weekly_tasks.length > 0 && (
                <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--warning)" }}>
                    À faire cette semaine · {data.overdue_weekly_tasks.length}
                  </p>
                  <div className="space-y-1.5">
                    {data.overdue_weekly_tasks.map(t => (
                      <a key={t.id} href="/me/tasks"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <span className="text-[11px]" style={{ color: "var(--warning)" }}>⚠</span>
                        <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{t.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Retours clients récents */}
          {data.feedback_items.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Retours clients</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowFeedbackModal(true)} className="text-[11px] px-2.5 py-1 rounded-md font-medium" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>+ Signaler</button>
                  <a href="/customer-feedback" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
                </div>
              </div>
              <div style={{ background: "var(--background-elev)" }}>
                {data.feedback_items.slice(0, 3).filter(item => !fbDismissed.has(item.id)).map((item, i, arr) => {
                  const meta = CATEGORY_META[item.category];
                  const confirmed = confirmedIds.has(item.id);
                  const count = confirmCounts[item.id] ?? 0;
                  const swipeX = fbSwipeX[item.id] ?? 0;
                  const swipeProgress = Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD);
                  return (
                    <div key={item.id} className="relative overflow-hidden" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      {/* Fond swipe */}
                      <div className="absolute inset-0 flex items-center justify-end pr-4" style={{ background: "rgba(239,68,68,0.1)", opacity: swipeProgress }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>Pas eu ce retour</span>
                          <X size={14} style={{ color: "var(--danger)" }} />
                        </div>
                      </div>
                      {/* Carte */}
                      <div
                        className="px-5 py-3.5"
                        onTouchStart={e => handleFbTouchStart(item.id, e.touches[0].clientX)}
                        onTouchMove={e => handleFbTouchMove(item.id, e.touches[0].clientX)}
                        onTouchEnd={() => handleFbTouchEnd(item.id)}
                        onMouseDown={e => handleFbMouseDown(item.id, e.clientX)}
                        onMouseMove={e => handleFbMouseMove(item.id, e.clientX)}
                        onMouseUp={() => handleFbMouseUp(item.id)}
                        onMouseLeave={() => handleFbMouseUp(item.id)}
                        style={{
                          transform: `translateX(${swipeX}px)`,
                          transition: swipeX === 0 ? "transform 0.2s ease" : "none",
                          background: "var(--background-elev)",
                          cursor: "grab",
                          userSelect: "none",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                          {item.table_number && <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Table {item.table_number}</span>}
                          <span className="text-[11px] ml-auto" style={{ color: "var(--foreground-dim)" }}>{new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                        <p className="text-[13px] leading-snug mb-2" style={{ color: "var(--foreground-muted)" }}>{item.content}</p>
                        <button onClick={() => toggleConfirm(item.id)} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all" style={{ background: confirmed ? meta.bg : "var(--background-soft)", color: confirmed ? meta.color : "var(--foreground-dim)", border: `1px solid ${confirmed ? meta.border : "var(--border)"}` }}>
                          <ThumbsUp size={10} fill={confirmed ? "currentColor" : "none"} />
                          {confirmed ? "Confirmé" : "Moi aussi"}
                          {count > 0 && <span className="opacity-70">· {count}</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {data.feedback_items.slice(0, 3).every(item => fbDismissed.has(item.id)) && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Tous les retours ont été traités ✓</p>
                    <a href="/customer-feedback" className="text-[12px] mt-1 block" style={{ color: "var(--accent)" }}>Voir l'historique</a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Colonne droite : Défis + Classement + Score */}
        <div className="space-y-6">

          {/* Défis en cours */}
          {data.active_challenges_list.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Trophy size={14} style={{ color: "#F59E0B" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Défis en cours</p>
                </div>
                <a href="/challenges" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
              </div>
              {data.active_challenges_list.map((c, i) => {
                const pct = c.target_value && c.target_value > 0 ? Math.min(100, Math.round((c.current_value / c.target_value) * 100)) : 0;
                const daysLeft = c.ends_at ? Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000)) : null;
                return (
                  <div key={c.id} className="px-4 py-3.5" style={{ background: "var(--background-elev)", borderBottom: i < data.active_challenges_list.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.title}</p>
                      {daysLeft !== null && <span className="text-[9px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: daysLeft <= 2 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: daysLeft <= 2 ? "var(--danger)" : "var(--warning)" }}>{daysLeft}j</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "var(--background-soft)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#F59E0B" }} />
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Classement */}
          {data.leaderboard.length > 1 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Classement</p>
                </div>
                <a href="/scoring" className="text-[11px]" style={{ color: "var(--accent)" }}>Voir tout</a>
              </div>
              {data.leaderboard.slice(0, 3).map((member, i) => {
                const b = member.badge ? BADGE_CONFIG[member.badge] : null;
                const isMe = member.profile_id === data.my_profile_id;
                return (
                  <div key={member.profile_id} className="px-4 py-3 flex items-center gap-3"
                    style={{ background: isMe ? "rgba(6,182,212,0.05)" : "var(--background-elev)", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                    {b ? <BadgeRank rank={b.rank} color={b.color} bg={b.bg} size={22} /> : <span className="text-sm font-mono w-6 text-center flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{i + 1}</span>}
                    <KarafAvatar firstName={member.first_name} lastName={member.last_name} avatarUrl={member.avatar_url} size={28} />
                    <p className="text-sm flex-1" style={{ color: "var(--foreground)", fontWeight: isMe ? 600 : 400 }}>
                      {member.name}{isMe ? " (toi)" : ""}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star size={10} style={{ color: b?.color ?? "var(--foreground-dim)" }} />
                      <p className="text-sm font-semibold" style={{ color: b?.color ?? "var(--foreground-dim)" }}>{member.score}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips ce mois */}
          <button onClick={() => openStatsPopup("shifts")}
            className="w-full rounded-xl p-4 text-left flex items-center justify-between transition-opacity active:opacity-70"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--foreground-dim)" }}>Tips ce mois</p>
              <p className="text-2xl font-bold font-mono" style={{ color: "#F59E0B" }}>
                {currentMonthShifts !== null ? `${currentMonthShifts.toFixed(0)} €` : "—"}
              </p>
            </div>
            <BarChart2 size={18} style={{ color: "#F59E0B", opacity: 0.6 }} />
          </button>

          {/* Score / Ponctualité */}
          <button onClick={() => openStatsPopup("score")}
            className="w-full rounded-xl p-5 text-left transition-opacity active:opacity-70"
            style={{ background: myBadge ? "rgba(245,158,11,0.05)" : "var(--background-elev)", border: `1px solid ${myBadge ? "rgba(245,158,11,0.3)" : "var(--border)"}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Mon score</p>
              <div className="flex items-center gap-2">
                {myBadge && <BadgeRank rank={myBadge.rank} color={myBadge.color} bg={myBadge.bg} size={24} />}
                <BarChart2 size={13} style={{ color: "var(--foreground-dim)" }} />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold leading-none" style={{ color: myBadge?.color ?? "var(--foreground)" }}>
                {myStats?.score ?? "—"}
              </p>
              <p className="text-[12px] pb-0.5" style={{ color: "var(--foreground-dim)" }}>
                {myRank > 0 ? `${myRank}${myRank === 1 ? "er" : "ème"} sur ${data.leaderboard.length}` : ""}
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Stats comparison popup */}
      {statsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setStatsPopup(null); }}>
          <div className="w-full max-w-md rounded-2xl p-5"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>

            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {statsPopup === "score" ? "Mon score" : "Tips"} — évolution
              </p>
              <button onClick={() => setStatsPopup(null)} style={{ color: "var(--foreground-dim)" }}>
                <X size={18} />
              </button>
            </div>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: "var(--accent)" }} />
                <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Chargement…</p>
              </div>
            ) : (() => {
              const current = statsPopup === "score" ? (myStats?.score ?? 0) : (currentMonthShifts ?? 0);
              const last    = lastMonthData ? (statsPopup === "score" ? lastMonthData.score : lastMonthData.shifts) : null;
              if (last === null) return <p className="text-center text-sm py-8" style={{ color: "var(--foreground-dim)" }}>Données indisponibles.</p>;
              const pct = last > 0 ? Math.round(((current - last) / last) * 100) : current > 0 ? 100 : 0;
              const isUp = pct >= 0;
              const isNeutral = pct === 0 && last === 0 && current === 0;
              const maxVal = Math.max(current, last, 1);
              const unit = statsPopup === "score" ? "pts" : "€";
              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-[56px] leading-none font-bold font-mono"
                      style={{ color: isNeutral ? "var(--foreground-dim)" : isUp ? "var(--success)" : "var(--danger)" }}>
                      {isNeutral ? "—" : `${isUp ? "+" : ""}${pct}%`}
                    </p>
                    <p className="text-[12px] mt-2" style={{ color: "var(--foreground-dim)" }}>
                      {isNeutral ? "Pas de données à comparer" : `${isUp ? "en hausse" : "en baisse"} vs mois dernier`}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Ce mois", val: current, color: isNeutral ? "var(--foreground-dim)" : isUp ? "var(--success)" : "var(--danger)", delay: "0s", bold: true },
                      { label: "Mois dernier", val: last, color: "var(--border-strong)", delay: "0.1s", bold: false },
                    ].map(({ label, val, color, delay, bold }) => (
                      <div key={label}>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>{label}</span>
                          <span className="text-[15px] font-mono" style={{ color: bold ? "var(--foreground)" : "var(--foreground-dim)", fontWeight: bold ? 600 : 400 }}>
                            {val} <span className="text-[11px]">{unit}</span>
                          </span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 10, background: "var(--background-soft)" }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: barsVisible ? `${(val / maxVal) * 100}%` : "0%",
                              background: color,
                              transition: `width 0.7s cubic-bezier(0.34,1.56,0.64,1) ${delay}`,
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delay modal */}
      {modal === "delay" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
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
                <input type="date" value={delayDate} onChange={e => setDelayDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--warning)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Durée (minutes)</label>
                <input type="number" min="1" max="480" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} placeholder="15" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--warning)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Raison</label>
                <select value={delayReason} onChange={e => setDelayReason(e.target.value as typeof delayReason)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="transport">Transport</option>
                  <option value="personal">Personnel</option>
                  <option value="health">Santé</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <button onClick={submitDelay} disabled={submitting || !delayMinutes || parseInt(delayMinutes, 10) <= 0} className="w-full py-3 mt-1 text-sm font-semibold rounded-lg transition-opacity" style={{ background: "var(--warning)", color: "var(--primary-foreground)", opacity: (submitting || !delayMinutes || parseInt(delayMinutes, 10) <= 0) ? 0.5 : 1 }}>
                {submitting ? "Envoi…" : "Déclarer le retard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal — full AI-powered modal */}
      {showFeedbackModal && (
        <NewFeedbackModal
          establishmentId={data.establishment_id}
          profileId={data.my_profile_id}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => showSuccess("Avis client enregistré ✓")}
        />
      )}


      {/* Popup protocole */}
      {protocolPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setProtocolPopup(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="flex items-start justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: readProtocols.has(protocolPopup.id) ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.1)" }}>
                  <BookOpen size={13} style={{ color: readProtocols.has(protocolPopup.id) ? "var(--success)" : "var(--accent)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{protocolPopup.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {protocolPopup.is_mandatory && <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Obligatoire</span>}
                    {readProtocols.has(protocolPopup.id) && <span className="text-[10px] font-medium" style={{ color: "var(--success)" }}>Lu ✓</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setProtocolPopup(null)} style={{ color: "var(--foreground-dim)", flexShrink: 0, marginLeft: 8 }}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {protocolPopup.attachment_type === "image" && protocolPopup.attachment_url && (
                <img src={protocolPopup.attachment_url} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 220 }} />
              )}
              {protocolPopup.content && <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground-muted)" }}>{protocolPopup.content}</p>}
              {protocolPopup.steps && protocolPopup.steps.length > 0 && (
                <div className="space-y-2">
                  {protocolPopup.steps.map((step, idx) => {
                    const key = `${protocolPopup.id}_${idx}`;
                    const taken = stepsTaken.has(key);
                    const done = stepsDone.has(key);
                    return (
                      <div key={idx} className="rounded-xl p-3" style={{ background: done ? "rgba(16,185,129,0.06)" : taken ? "rgba(6,182,212,0.05)" : "var(--background-soft)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : taken ? "rgba(6,182,212,0.2)" : "var(--border)"}` }}>
                        <div className="flex gap-2.5 items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                            style={{ background: done ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.15)", color: done ? "var(--success)" : "#A78BFA" }}>
                            {done ? "✓" : idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] leading-snug" style={{ color: done ? "var(--foreground-dim)" : "var(--foreground)", textDecoration: done ? "line-through" : "none" }}>{step.text}</p>
                            {step.frequency && <span className="text-[10px] font-mono mt-0.5 inline-block" style={{ color: "#A78BFA" }}>{{ daily: "Quotidien", opening: "Ouverture", closing: "Fermeture", continuous: "Continu" }[step.frequency] ?? step.frequency}</span>}
                            {step.photo_url && <img src={step.photo_url} alt="" className="mt-1.5 rounded-lg object-cover" style={{ width: "100%", maxHeight: 120 }} />}
                            {taken && !done && <p className="text-[10px] mt-1" style={{ color: "var(--accent)" }}>En cours · {data.my_first_name || "moi"}</p>}
                          </div>
                        </div>
                        {!done && (
                          <div className="flex gap-1.5 mt-2.5 pl-7">
                            {!taken && <button onClick={() => setStepsTaken(prev => new Set([...prev, key]))} className="text-[11px] px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>Je prends</button>}
                            {taken && <button onClick={() => setStepsTaken(prev => { const s = new Set(prev); s.delete(key); return s; })} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>Se désister</button>}
                            <button onClick={() => { setStepsDone(prev => new Set([...prev, key])); setStepsTaken(prev => { const s = new Set(prev); s.delete(key); return s; }); }} className="text-[11px] px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.25)" }}>Valider ✓</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!protocolPopup.content && (!protocolPopup.steps || protocolPopup.steps.length === 0) && <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun contenu pour ce protocole.</p>}
            </div>
            <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              {readProtocols.has(protocolPopup.id) ? (
                <div className="flex items-center justify-center gap-2 py-2"><Check size={14} style={{ color: "var(--success)" }} /><p className="text-sm font-medium" style={{ color: "var(--success)" }}>Lecture confirmée</p></div>
              ) : (
                <button onClick={async () => { setReadProtocols(prev => new Set([...prev, protocolPopup.id])); setProtocolPopup(null); if (!DEV_MODE) { const sb = createClient(); const { data: { user } } = await sb.auth.getUser(); if (user) await (sb.from("protocol_reads") as unknown as { upsert: (v: object) => Promise<unknown> }).upsert({ protocol_id: protocolPopup.id, profile_id: user.id }); } }}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg" style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
                  Confirmer la lecture ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Liste protocoles obligatoires */}
      {mandatoryListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setMandatoryListOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={14} style={{ color: "var(--danger)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Lectures obligatoires</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
                  {data.protocols.filter(p => (p.is_mandatory || p.show_on_dashboard) && !readProtocols.has(p.id)).length} restant{data.protocols.filter(p => (p.is_mandatory || p.show_on_dashboard) && !readProtocols.has(p.id)).length > 1 ? "s" : ""}
                </span>
              </div>
              <button onClick={() => setMandatoryListOpen(false)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.protocols.filter(p => p.is_mandatory || p.show_on_dashboard).map(p => {
                const isRead = readProtocols.has(p.id);
                return (
                  <button key={p.id}
                    onClick={() => { setMandatoryListOpen(false); if (!isRead) openProtocol(p); }}
                    disabled={isRead}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-opacity"
                    style={{ opacity: isRead ? 0.5 : 1, cursor: isRead ? "default" : "pointer" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isRead ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: isRead ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(239,68,68,0.2)" }}>
                      {isRead
                        ? <Check size={14} style={{ color: "var(--success)" }} />
                        : <BookOpen size={13} style={{ color: "var(--danger)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{p.title}</p>
                      <p className="text-[11px]" style={{ color: isRead ? "var(--success)" : "var(--danger)" }}>
                        {isRead ? "Confirmé ✓" : "À lire →"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {data.protocols.filter(p => p.is_mandatory).every(p => readProtocols.has(p.id)) && (
              <div className="px-5 py-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Tous les protocoles obligatoires sont lus ✓</p>
              </div>
            )}
          </div>
        </div>
      )}

      {taskGaugePopup && <TaskGaugePopup stats={taskGaugePopup} onClose={() => setTaskGaugePopup(null)} establishmentId={data.establishment_id} profileId={data.my_profile_id} onValidated={() => { onTaskValidated(); }} />}
    </div>
  );
}
