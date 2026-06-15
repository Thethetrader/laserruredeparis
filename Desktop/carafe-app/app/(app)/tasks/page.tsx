"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { EmptyState } from "@/components/ui/custom/EmptyState";
import {
  CheckCircle2, Circle, Camera, AlertTriangle, ChevronDown, ChevronUp,
  RefreshCw, Users, UtensilsCrossed, Wine, Briefcase, Sunrise, Sunset, Zap,
  X, Plus, Clock, Settings, BookOpen, ZoomIn, User, Pencil, Trash2, RotateCcw,
} from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";
import type { TaskCategory, TaskTargetRole } from "@/lib/types/database";
import { parseTipSettings, DEFAULT_TIP_SETTINGS, STAFF_STATUSES, type StaffStatus, type TipSettings } from "@/lib/shifts";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

interface Protocol {
  id: string;
  title: string;
  content: string;
  category: string;
  steps?: string[] | null;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  target_role: TaskTargetRole;
  frequency: string;
  requires_photo: boolean;
  is_critical: boolean;
  display_order: number;
  protocol_id: string | null;
}

interface TaskCompletion {
  id: string;
  task_template_id: string | null;
  task_one_shot_id: string | null;
  validated_by: string;
  validated_at: string;
  photo_url: string | null;
  notes: string | null;
  is_catchup: boolean;
  validator_name?: string;
}

interface TaskOneShot {
  id: string;
  title: string;
  description: string | null;
  target_role: TaskTargetRole;
  due_date: string;
  requires_photo: boolean;
  is_critical: boolean;
  assigned_to: string | null;
  is_validated: boolean;
  creator_name?: string;
  protocol_id: string | null;
}

interface Member { profile_id: string; name: string; }

type FilterRole = "all" | TaskTargetRole;

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  opening: "Ouverture",
  closing: "Fermeture",
  continuous: "En continu",
  custom: "Ponctuel",
};

const ROLE_LABEL: Record<TaskTargetRole, string> = {
  all: "Tous",
  salle: "Salle",
  cuisine: "Cuisine",
  bar: "Bar",
  manager: "Manager",
};

const ROLE_ICON: Record<TaskTargetRole, React.ElementType> = {
  all: Users,
  salle: Users,
  cuisine: UtensilsCrossed,
  bar: Wine,
  manager: Briefcase,
};

const DEV_PROTOCOLS: Protocol[] = [
  { id: "p1", title: "Procédure ouverture caisse", content: "1. Vérifier le fond de caisse (200€)\n2. Compter les billets par coupure\n3. Valider dans le logiciel de caisse", category: "opening" },
  { id: "p2", title: "Contrôle températures HACCP", content: "Mesurer chaque frigo avec le thermomètre sonde.\n\nFrigo 1 & 2 : 2°C – 4°C\nCongélateur : -18°C max\n\nSi hors norme : alerter le responsable immédiatement.", category: "hygiene" },
];

const DEV_TEMPLATES: TaskTemplate[] = [
  { id: "t1", title: "Ouverture caisse", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 1, protocol_id: "p1" },
  { id: "t2", title: "Contrôle température frigos", description: "Vérifier que les frigos sont entre 2°C et 4°C", category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 2, protocol_id: "p2" },
  { id: "t3", title: "Briefing équipe", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: false, is_critical: false, display_order: 3, protocol_id: null },
  { id: "t4", title: "Mise en place de la salle", description: null, category: "opening", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, display_order: 4, protocol_id: null },
  { id: "t5", title: "Mise en place cuisine", description: null, category: "opening", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, display_order: 5, protocol_id: null },
  { id: "t6", title: "Fermeture caisse", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 6, protocol_id: null },
  { id: "t7", title: "Nettoyage salle", description: null, category: "closing", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, display_order: 7, protocol_id: null },
  { id: "t8", title: "Nettoyage hotte", description: "Hotte dégraissée, filtres vérifiés", category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: true, is_critical: true, display_order: 8, protocol_id: null },
  { id: "t9", title: "Plonge terminée", description: null, category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, display_order: 9, protocol_id: null },
];

const DEV_COMPLETIONS: TaskCompletion[] = [
  { id: "c1", task_template_id: "t1", task_one_shot_id: null, validated_by: "profile-2", validated_at: new Date(Date.now() - 3600000 * 2).toISOString(), photo_url: null, notes: null, is_catchup: false, validator_name: "Yasmine B." },
  { id: "c2", task_template_id: "t3", task_one_shot_id: null, validated_by: "profile-2", validated_at: new Date(Date.now() - 3600000 * 1.5).toISOString(), photo_url: null, notes: null, is_catchup: false, validator_name: "Yasmine B." },
  { id: "c3", task_template_id: "t4", task_one_shot_id: null, validated_by: "profile-3", validated_at: new Date(Date.now() - 3600000 * 3).toISOString(), photo_url: null, notes: null, is_catchup: false, validator_name: "Rayan D." },
];

const DEV_ONE_SHOTS: TaskOneShot[] = [
  { id: "os1", title: "Vérifier livraison vin", description: "Le commercial Durand passe vers 10h", target_role: "manager", due_date: new Date().toISOString().split("T")[0], requires_photo: false, is_critical: false, assigned_to: null, is_validated: false, creator_name: "Yasmine B.", protocol_id: null },
];

const DEV_MEMBERS: Member[] = [
  { profile_id: "profile-2", name: "Yasmine Benali" },
  { profile_id: "profile-3", name: "Rayan Dupont" },
  { profile_id: "profile-4", name: "Léa Martin" },
];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return "hier";
}

function isWindowOpen(category: TaskCategory, hour: number): boolean {
  if (category === "opening") return hour >= 5;
  if (category === "closing") return hour >= 14;
  return true;
}

export default function TasksManagerPage() {
  const [devRole] = useDevRole();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [oneShots, setOneShots] = useState<TaskOneShot[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<Record<TaskCategory, boolean>>({
    opening: true, closing: true, continuous: true, custom: true,
  });
  const [validating, setValidating] = useState<string | null>(null);
  const [showOneShotModal, setShowOneShotModal] = useState(false);
  const [newOneShotTitle, setNewOneShotTitle] = useState("");
  const [newOneShotDesc, setNewOneShotDesc] = useState("");
  const [newOneShotRole, setNewOneShotRole] = useState<TaskTargetRole>("all");
  const [newOneShotAssignedTo, setNewOneShotAssignedTo] = useState("");
  const [newOneShotRequiresPhoto, setNewOneShotRequiresPhoto] = useState(false);
  const [newOneShotIsCritical, setNewOneShotIsCritical] = useState(false);
  const [selectedProtocolId, setSelectedProtocolId] = useState("");
  const [savingOneShot, setSavingOneShot] = useState(false);
  const [protocolModal, setProtocolModal] = useState<Protocol | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("employee");
  const [estId, setEstId] = useState(DEV_ESTABLISHMENT_ID);
  const [tipSettings, setTipSettings] = useState<TipSettings>(DEFAULT_TIP_SETTINGS);
  const [claims, setClaims] = useState<{ id: string; task_template_id: string | null; task_one_shot_id: string | null; profile_id: string; first_name: string | null }[]>([]);
  const [userId, setUserId] = useState("");
  const [myFirstName, setMyFirstName] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState<TaskTemplate | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  const load = useCallback(async () => {
    setLoading(true);
    if (DEV_MODE) {
      setUserRole(devRole);
      setTemplates(DEV_TEMPLATES);
      setCompletions(DEV_COMPLETIONS);
      setOneShots(DEV_ONE_SHOTS);
      setProtocols(DEV_PROTOCOLS);
      setMembers(DEV_MEMBERS);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const _uid = (await supabase.auth.getUser()).data.user?.id ?? "";
    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("establishment_id, role, establishments(tip_settings, protocol_categories)").eq("profile_id", _uid).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: member } = await _mq.limit(1).maybeSingle();
    if (!member && _ceid && _re.test(_ceid)) ({ data: member } = await supabase.from("establishment_members").select("establishment_id, role, establishments(tip_settings, protocol_categories)").eq("profile_id", _uid).eq("is_active", true).limit(1).maybeSingle());

    if (!member) { setLoading(false); return; }
    setUserRole(member.role);
    setEstId(member.establishment_id);
    const est = (member as unknown as { establishments?: { tip_settings: unknown } | null }).establishments;
    if (est) setTipSettings(parseTipSettings(est.tip_settings));

    const uid = (await supabase.auth.getUser()).data.user?.id ?? "";
    setUserId(uid);
    const { data: myProfile } = await supabase.from("profiles").select("first_name").eq("id", uid).single();
    setMyFirstName((myProfile as { first_name: string | null } | null)?.first_name ?? "");

    const [{ data: tmpl }, { data: comp }, { data: shots }, { data: protos }, { data: memberRows }, { data: claimsData }] = await Promise.all([
      supabase.from("task_templates").select("*").eq("establishment_id", member.establishment_id).eq("is_active", true).order("display_order"),
      supabase.from("task_completions").select("*, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("service_date", today),
      supabase.from("task_one_shots").select("*, profiles!task_one_shots_created_by_fkey(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("due_date", today),
      supabase.from("protocols").select("id, title, content, category, steps").eq("establishment_id", member.establishment_id),
      supabase.from("establishment_members").select("profile_id, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("is_active", true),
      supabase.from("task_claims").select("id, task_template_id, task_one_shot_id, profile_id, first_name, service_date").eq("establishment_id", member.establishment_id).eq("service_date", today),
    ]);
    setClaims((claimsData ?? []) as typeof claims);

    setTemplates((tmpl ?? []) as TaskTemplate[]);
    setCompletions(
      ((comp ?? []) as (TaskCompletion & { profiles: { first_name: string | null; last_name: string | null } | null })[])
        .map(c => ({ ...c, validator_name: c.profiles ? `${c.profiles.first_name ?? ""} ${c.profiles.last_name ?? ""}`.trim() : "—" }))
    );
    setOneShots(
      ((shots ?? []) as (TaskOneShot & { profiles: { first_name: string | null; last_name: string | null } | null })[])
        .map(s => ({ ...s, creator_name: s.profiles ? `${s.profiles.first_name ?? ""} ${s.profiles.last_name ?? ""}`.trim() : "—" }))
    );
    const protoCats = ((member as unknown as { establishments?: { protocol_categories?: Array<{ id: string }> } | null }).establishments?.protocol_categories ?? []);
    const validProtoCatIds = new Set(protoCats.map((c: { id: string }) => c.id));
    const allProtos = (protos ?? []) as Protocol[];
    setProtocols(validProtoCatIds.size > 0 ? allProtos.filter(p => validProtoCatIds.has(p.category)) : allProtos);
    setMembers(
      ((memberRows ?? []) as Array<{ profile_id: string; profiles: { first_name: string | null; last_name: string | null } | null }>).map(m => ({
        profile_id: m.profile_id,
        name: [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "Membre",
      }))
    );
    setLoading(false);
  }, [today, devRole]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (DEV_MODE || !estId || estId === DEV_ESTABLISHMENT_ID) return;
    const supabase = createClient();
    const channel = supabase
      .channel("task_claims_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_claims", filter: `establishment_id=eq.${estId}` }, async () => {
        const { data: fresh } = await supabase.from("task_claims").select("id, task_template_id, task_one_shot_id, profile_id, first_name, service_date").eq("establishment_id", estId).eq("service_date", today);
        setClaims((fresh ?? []) as { id: string; task_template_id: string | null; task_one_shot_id: string | null; profile_id: string; first_name: string | null }[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [estId, today]);

  const isManager = userRole === "owner" || userRole === "manager";

  async function validateTask(templateId: string, oneShotId?: string) {
    setValidating(templateId || oneShotId || null);
    if (DEV_MODE) {
      const fakeComp: TaskCompletion = {
        id: `c-${Date.now()}`,
        task_template_id: templateId || null,
        task_one_shot_id: oneShotId || null,
        validated_by: DEV_PROFILE_ID,
        validated_at: new Date().toISOString(),
        photo_url: null,
        notes: null,
        is_catchup: false,
        validator_name: "Dev Mode",
      };
      setCompletions(prev => [...prev, fakeComp]);
      if (oneShotId) setOneShots(prev => prev.map(s => s.id === oneShotId ? { ...s, is_validated: true } : s));
      setValidating(null);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId ?? "").eq("is_active", true).limit(1).maybeSingle();
    if (!member) { setValidating(null); return; }

    await supabase.from("task_completions").insert({
      establishment_id: member.establishment_id,
      task_template_id: templateId || null,
      task_one_shot_id: oneShotId || null,
      validated_by: userId!,
      service_date: today,
      is_catchup: false,
    });
    // Supprimer le claim si existant
    if (templateId) await supabase.from("task_claims").delete().eq("task_template_id", templateId).eq("service_date", today);
    if (oneShotId) await supabase.from("task_claims").delete().eq("task_one_shot_id", oneShotId).eq("service_date", today);
    await load();
    setValidating(null);
  }

  async function claimTask(taskTemplateId?: string, taskOneShotId?: string) {
    const key = taskTemplateId ?? taskOneShotId ?? "";
    setClaiming(key);
    const supabase = createClient();
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId).eq("is_active", true).limit(1).maybeSingle();
    if (!member) { setClaiming(null); return; }
    await supabase.from("task_claims").insert({
      establishment_id: member.establishment_id,
      task_template_id: taskTemplateId ?? null,
      task_one_shot_id: taskOneShotId ?? null,
      profile_id: userId,
      first_name: myFirstName,
      service_date: today,
    });
    await load();
    setClaiming(null);
  }

  async function unclaimTask(claimId: string) {
    setClaiming(claimId);
    const supabase = createClient();
    await supabase.from("task_claims").delete().eq("id", claimId);
    await load();
    setClaiming(null);
  }

  async function unvalidateTask(completionId: string) {
    const supabase = createClient();
    await supabase.from("task_completions").delete().eq("id", completionId);
    setCompletions(prev => prev.filter(c => c.id !== completionId));
  }

  async function handleDeleteTask(task: TaskTemplate) {
    if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
    const supabase = createClient();
    await supabase.from("task_templates").update({ is_active: false }).eq("id", task.id);
    setTemplates(prev => prev.filter(t => t.id !== task.id));
  }

  function resetOneShotForm() {
    setNewOneShotTitle("");
    setNewOneShotDesc("");
    setNewOneShotRole("all");
    setNewOneShotAssignedTo("");
    setNewOneShotRequiresPhoto(false);
    setNewOneShotIsCritical(false);
    setSelectedProtocolId("");
  }

  async function createOneShot() {
    const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);
    const steps = selectedProtocol?.steps ?? [];
    const hasSteps = steps.length > 0;
    if (!hasSteps && !newOneShotTitle.trim()) return;
    setSavingOneShot(true);
    if (DEV_MODE) {
      const newTasks = hasSteps
        ? steps.map((step, i) => ({
            id: `os-${Date.now()}-${i}`,
            title: step,
            description: null,
            target_role: newOneShotRole,
            due_date: today,
            requires_photo: newOneShotRequiresPhoto,
            is_critical: newOneShotIsCritical,
            assigned_to: newOneShotAssignedTo || null,
            is_validated: false,
            creator_name: "Dev Mode",
            protocol_id: selectedProtocolId || null,
          }))
        : [{ id: `os-${Date.now()}`, title: newOneShotTitle, description: newOneShotDesc || null, target_role: newOneShotRole, due_date: today, requires_photo: newOneShotRequiresPhoto, is_critical: newOneShotIsCritical, assigned_to: newOneShotAssignedTo || null, is_validated: false, creator_name: "Dev Mode", protocol_id: null }];
      setOneShots(prev => [...prev, ...newTasks]);
      setShowOneShotModal(false);
      resetOneShotForm();
      setSavingOneShot(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId ?? "").eq("is_active", true).limit(1).maybeSingle();
    if (!member) { setSavingOneShot(false); return; }

    const rows = hasSteps
      ? steps.map(step => ({
          establishment_id: member.establishment_id,
          created_by: userId!,
          title: step,
          description: null,
          target_role: newOneShotRole,
          assigned_to: newOneShotAssignedTo || null,
          requires_photo: newOneShotRequiresPhoto,
          is_critical: newOneShotIsCritical,
          due_date: today,
          protocol_id: selectedProtocolId || null,
        }))
      : [{
          establishment_id: member.establishment_id,
          created_by: userId!,
          title: newOneShotTitle,
          description: newOneShotDesc || null,
          target_role: newOneShotRole,
          assigned_to: newOneShotAssignedTo || null,
          requires_photo: newOneShotRequiresPhoto,
          is_critical: newOneShotIsCritical,
          due_date: today,
        }];

    const { error: insertError } = await supabase.from("task_one_shots").insert(rows);
    if (insertError) {
      console.error("Erreur création tâche ponctuelle:", insertError.message);
      setSavingOneShot(false);
      return;
    }
    await load();
    setShowOneShotModal(false);
    resetOneShotForm();
    setSavingOneShot(false);
  }

  const completionMap = new Map(completions.map(c => [c.task_template_id ?? c.task_one_shot_id, c]));

  const filteredTemplates = templates.filter(t =>
    filterRole === "all" || t.target_role === filterRole || t.target_role === "all"
  );

  const visibleOneShots = isManager
    ? oneShots
    : oneShots.filter(s =>
        s.assigned_to === userId ||
        (s.assigned_to === null && (s.target_role === "all" || s.target_role === userRole))
      );

  const byCategory = (cat: TaskCategory) =>
    filteredTemplates.filter(t => t.category === cat && isWindowOpen(t.category, currentHour));

  const visibleTemplateIds = new Set(filteredTemplates.filter(t => isWindowOpen(t.category, currentHour)).map(t => t.id));
  const visibleOneShotIds  = new Set(visibleOneShots.map(s => s.id));
  const totalTasks = visibleTemplateIds.size + visibleOneShotIds.size;
  const doneTasks  = completions.filter(c =>
    (c.task_template_id && visibleTemplateIds.has(c.task_template_id)) ||
    (c.task_one_shot_id  && visibleOneShotIds.has(c.task_one_shot_id))
  ).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const allDone = totalTasks > 0 && doneTasks >= totalTasks;

  const activeStatuses = (Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden?.includes(s));
  const roleLabel = (r: string) => {
    if (r === "all") return "Tous";
    if (r === "manager") return "Manager";
    const s = r as StaffStatus;
    return tipSettings.labels?.[s] ?? STAFF_STATUSES[s]?.label ?? r;
  };
  const filterButtons = ["all", "manager", ...activeStatuses] as string[];

  return (
    <div className="px-4 py-6 lg:px-8 pb-32 max-w-4xl">
      <div className="mb-6">
        <MonoLabel size="xs" className="mb-1 block">Tâches du jour</MonoLabel>
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Tâches</h1>
        {isManager && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOneShotModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
              style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
            >
              <Zap size={12} />
              Ponctuelle
            </button>
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
              style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
            >
              <Plus size={12} />
              Récurrente
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div>
          <p className="text-[22px] font-bold" style={{ color: allDone ? "var(--success)" : "var(--foreground)" }}>
            {doneTasks} <span className="text-[14px] font-normal" style={{ color: "var(--foreground-dim)" }}>/ {totalTasks}</span>
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>tâches validées · {pct}%</p>
        </div>
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={allDone ? "var(--success)" : "var(--accent)"} strokeWidth="3" strokeDasharray={`${pct * 0.942} 100`} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {allDone && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
          <p className="text-[13px]" style={{ color: "var(--success)" }}>Toutes les tâches du jour sont faites. Bravo l'équipe.</p>
        </div>
      )}

      {/* Filters */}
      {!loading && <div className="flex gap-1.5 mb-5 flex-wrap">
        {filterButtons.map(r => {
          const color = r !== "all" && r !== "manager" ? (tipSettings.colors[r as StaffStatus] ?? STAFF_STATUSES[r as StaffStatus]?.color) : undefined;
          return (
            <button
              key={r}
              onClick={() => setFilterRole(r as FilterRole)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-base text-[11px] font-medium transition-colors"
              style={{
                background: filterRole === r ? "rgba(6,182,212,0.1)" : "var(--background-elev)",
                color: filterRole === r ? "var(--accent)" : "var(--foreground-dim)",
                border: filterRole === r ? "1px solid rgba(6,182,212,0.25)" : "1px solid var(--border)",
              }}
            >
              {color && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
              {roleLabel(r)}
            </button>
          );
        })}
      </div>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(["opening", "continuous", "closing", "custom"] as TaskCategory[]).map(cat => {
            const tasks = byCategory(cat);
            if (tasks.length === 0) return null;
            const catIcon = cat === "opening" ? Sunrise : cat === "closing" ? Sunset : Zap;
            const CatIcon = catIcon;
            const expanded = expandedCategory[cat];
            const catDone = tasks.filter(t => completionMap.has(t.id)).length;

            return (
              <div key={cat} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setExpandedCategory(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ background: "var(--background-elev)" }}
                >
                  <div className="flex items-center gap-2">
                    <CatIcon size={14} style={{ color: "var(--foreground-dim)" }} />
                    <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{CATEGORY_LABEL[cat]}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: catDone === tasks.length ? "rgba(16,185,129,0.12)" : "var(--background)", color: catDone === tasks.length ? "var(--success)" : "var(--foreground-dim)" }}>
                      {catDone}/{tasks.length}
                    </span>
                  </div>
                  {expanded ? <ChevronUp size={14} style={{ color: "var(--foreground-dim)" }} /> : <ChevronDown size={14} style={{ color: "var(--foreground-dim)" }} />}
                </button>

                {expanded && (
                  <div className="divide-y" style={{ borderTop: "1px solid var(--border-soft)", borderColor: "var(--border-soft)" }}>
                    {tasks.map(task => {
                      const comp = completionMap.get(task.id);
                      const isDone = !!comp;
                      const isValidatingThis = validating === task.id;
                      const linkedProtocol = task.protocol_id ? protocols.find(p => p.id === task.protocol_id) : null;
                      const claim = claims.find(c => c.task_template_id === task.id);
                      const claimedByMe = claim?.profile_id === userId;
                      const isClaimingThis = claiming === task.id || claiming === claim?.id;

                      return (
                        <div key={task.id} className="flex items-start gap-3 px-4 py-3 transition-colors"
                          style={{ background: isDone ? "rgba(16,185,129,0.04)" : claim && !claimedByMe ? "rgba(245,158,11,0.02)" : "var(--background)" }}>
                          <div className="mt-0.5 flex-shrink-0">
                            {isDone ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} /> : <Circle size={18} style={{ color: claim && !claimedByMe ? "#F59E0B" : "var(--foreground-dim)" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13px] font-medium" style={{ color: isDone ? "var(--foreground-muted)" : claim && !claimedByMe ? "var(--foreground-dim)" : "var(--foreground)", textDecoration: isDone ? "line-through" : "none" }}>
                                {task.title}
                              </span>
                              {task.is_critical && <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}><AlertTriangle size={9} />HACCP</span>}
                              {task.requires_photo && !isDone && <Camera size={12} style={{ color: "var(--foreground-dim)" }} />}
                            </div>

                            {isDone && comp ? (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{comp.validator_name} · {relTime(comp.validated_at)}{comp.is_catchup && " · rattrapage"}</p>
                                {comp.photo_url && (
                                  <button onClick={() => setLightboxUrl(comp.photo_url)} className="flex-shrink-0 relative rounded-md overflow-hidden transition-opacity hover:opacity-80" style={{ width: 32, height: 32 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={comp.photo_url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}><ZoomIn size={11} color="white" /></div>
                                  </button>
                                )}
                                {isManager && (
                                  <button onClick={() => unvalidateTask(comp.id)} title="Annuler la validation"
                                    className="p-1 rounded-lg opacity-30 hover:opacity-80 transition-opacity"
                                    style={{ color: "var(--foreground-dim)" }}>
                                    <RotateCcw size={11} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                {claim && (
                                  <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: claimedByMe ? "var(--accent)" : "#F59E0B" }}>
                                    <span style={{ textDecoration: "line-through", opacity: 0.7 }}>{claimedByMe ? `En cours · ${myFirstName || "moi"}` : `Pris par ${claim.first_name ?? "quelqu'un"}`}</span>
                                    {claimedByMe && <button onClick={() => unclaimTask(claim.id)} className="text-[10px] ml-1 opacity-50 hover:opacity-100" style={{ color: "var(--foreground-dim)" }}>✕</button>}
                                  </p>
                                )}
                                {!claim && task.description && <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{task.description}</p>}
                                {linkedProtocol && <button onClick={() => setProtocolModal(linkedProtocol)} className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium transition-opacity hover:opacity-80" style={{ color: "var(--accent)" }}><BookOpen size={10} />Voir le protocole</button>}
                              </>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>{roleLabel(task.target_role)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            {!isDone && (
                              <>
                                {!claim && (
                                  <button onClick={() => claimTask(task.id)} disabled={isClaimingThis}
                                    className="px-2.5 py-1 rounded-base text-[11px] font-medium"
                                    style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)", opacity: isClaimingThis ? 0.5 : 1 }}>
                                    Je prends
                                  </button>
                                )}
                                {(!claim || claimedByMe) && (
                                  <button onClick={() => validateTask(task.id)} disabled={isValidatingThis}
                                    className="px-2.5 py-1 rounded-base text-[11px] font-medium"
                                    style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)", opacity: isValidatingThis ? 0.5 : 1 }}>
                                    {isValidatingThis ? <RefreshCw size={11} className="animate-spin" /> : "Valider"}
                                  </button>
                                )}
                              </>
                            )}
                            {isManager && (
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => setEditTask(task)} title="Modifier"
                                  className="p-1 rounded-lg transition-opacity hover:opacity-100 opacity-40"
                                  style={{ color: "var(--foreground-dim)" }}>
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDeleteTask(task)} title="Supprimer"
                                  className="p-1 rounded-lg transition-opacity hover:opacity-100 opacity-40"
                                  style={{ color: "#EF4444" }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tâches ponctuelles (one-shots) */}
          {visibleOneShots.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--background-elev)" }}>
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: "var(--foreground-dim)" }} />
                  <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Ponctuelles</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: visibleOneShots.filter(s => completionMap.has(s.id)).length === visibleOneShots.length ? "rgba(16,185,129,0.12)" : "var(--background)", color: visibleOneShots.filter(s => completionMap.has(s.id)).length === visibleOneShots.length ? "var(--success)" : "var(--foreground-dim)" }}>
                    {visibleOneShots.filter(s => completionMap.has(s.id)).length}/{visibleOneShots.length}
                  </span>
                </div>
              </div>
              <div className="divide-y" style={{ borderTop: "1px solid var(--border-soft)", borderColor: "var(--border-soft)" }}>
                {visibleOneShots.map(shot => {
                  const comp = completionMap.get(shot.id);
                  const isDone = !!comp;
                  const isValidatingThis = validating === shot.id;
                  const claim = claims.find(c => c.task_one_shot_id === shot.id);
                  const claimedByMe = claim?.profile_id === userId;
                  const isClaimingThis = claiming === shot.id || claiming === claim?.id;
                  return (
                    <div key={shot.id} className="flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{ background: isDone ? "rgba(16,185,129,0.04)" : claim && !claimedByMe ? "rgba(245,158,11,0.02)" : "var(--background)" }}>
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} /> : <Circle size={18} style={{ color: claim && !claimedByMe ? "#F59E0B" : "var(--foreground-dim)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-medium" style={{ color: isDone ? "var(--foreground-muted)" : "var(--foreground)", textDecoration: isDone ? "line-through" : "none" }}>{shot.title}</span>
                          {shot.is_critical && <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}><AlertTriangle size={9} />HACCP</span>}
                        </div>
                        {isDone && comp ? (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{comp.validator_name} · {relTime(comp.validated_at)}</p>
                        ) : (
                          <>
                            {claim && <p className="text-[11px] mt-0.5" style={{ color: claimedByMe ? "var(--accent)" : "#F59E0B" }}>{claimedByMe ? `En cours · ${myFirstName || "moi"}` : `Pris par ${claim.first_name ?? "quelqu'un"}`}</p>}
                            {shot.description && <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{shot.description}</p>}
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>par {shot.creator_name}</p>
                          </>
                        )}
                      </div>
                      {!isDone && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {!claim && (
                            <button onClick={() => claimTask(undefined, shot.id)} disabled={isClaimingThis}
                              className="px-2.5 py-1 rounded-base text-[11px] font-medium"
                              style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)", opacity: isClaimingThis ? 0.5 : 1 }}>
                              Je prends
                            </button>
                          )}
                          {(!claim || claimedByMe) && (
                            <button onClick={() => validateTask("", shot.id)} disabled={isValidatingThis}
                              className="px-2.5 py-1 rounded-base text-[11px] font-medium"
                              style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)", opacity: isValidatingThis ? 0.5 : 1 }}>
                              {isValidatingThis ? <RefreshCw size={11} className="animate-spin" /> : "Valider"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredTemplates.filter(t => isWindowOpen(t.category, currentHour)).length === 0 && oneShots.length === 0 && (
            <EmptyState message="Aucune tâche pour le moment." sub="Profite-en." />
          )}
        </div>
      )}

      {/* Modal protocole */}
      {protocolModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={e => { if (e.target === e.currentTarget) setProtocolModal(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: "var(--accent)" }} />
                <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{protocolModal.title}</p>
              </div>
              <button onClick={() => setProtocolModal(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground-muted)" }}>{protocolModal.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox photo */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4" style={{ color: "white" }} onClick={() => setLightboxUrl(null)}><X size={24} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {showOneShotModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowOneShotModal(false); resetOneShotForm(); } }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Tâche ponctuelle</p>
              <button onClick={() => { setShowOneShotModal(false); resetOneShotForm(); }} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</label>
                <input
                  value={newOneShotTitle}
                  onChange={e => setNewOneShotTitle(e.target.value)}
                  placeholder="Ex : Vérifier la livraison boissons"
                  className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description (optionnelle)</label>
                <textarea
                  value={newOneShotDesc}
                  onChange={e => setNewOneShotDesc(e.target.value)}
                  placeholder="Détails supplémentaires…"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Assigner à une personne</label>
                <select
                  value={newOneShotAssignedTo}
                  onChange={e => setNewOneShotAssignedTo(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value="">— Toute l&apos;équipe —</option>
                  {members.map(m => (
                    <option key={m.profile_id} value={m.profile_id}>{m.name}</option>
                  ))}
                </select>
              </div>
              {!newOneShotAssignedTo && (
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Rôle cible</label>
                  <select
                    value={newOneShotRole}
                    onChange={e => setNewOneShotRole(e.target.value as TaskTargetRole)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <option value="all">Tous</option>
                    <option value="manager">Manager</option>
                    {(Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden?.includes(s)).map(s => (
                      <option key={s} value={s}>{tipSettings.labels?.[s] ?? STAFF_STATUSES[s]?.label ?? s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setNewOneShotRequiresPhoto(v => !v)}
                    className="w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer"
                    style={{ background: newOneShotRequiresPhoto ? "var(--accent)" : "var(--border)", width: 34, height: 18 }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white transition-transform" style={{ transform: newOneShotRequiresPhoto ? "translateX(16px)" : "translateX(0)" }} />
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>Photo requise</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setNewOneShotIsCritical(v => !v)}
                    className="rounded-full flex items-center px-0.5 transition-colors cursor-pointer"
                    style={{ background: newOneShotIsCritical ? "#F59E0B" : "var(--border)", width: 34, height: 18 }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white transition-transform" style={{ transform: newOneShotIsCritical ? "translateX(16px)" : "translateX(0)" }} />
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>HACCP</span>
                </label>
              </div>
              <button
                onClick={createOneShot}
                disabled={savingOneShot || !newOneShotTitle.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#fff", opacity: (savingOneShot || !newOneShotTitle.trim()) ? 0.5 : 1 }}
              >
                {savingOneShot ? "Création…" : "Créer la tâche"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          estId={estId}
          protocols={protocols}
          tipSettings={tipSettings}
          onClose={() => setShowAddTask(false)}
          onSaved={() => { setShowAddTask(false); load(); }}
        />
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          tipSettings={tipSettings}
          onClose={() => setEditTask(null)}
          onSaved={(updated) => { setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditTask(null); }}
        />
      )}
    </div>
  );
}

/* ─── ADD TASK MODAL ─────────────────────────────────────── */
interface TaskStep {
  title: string;
  requires_photo: boolean;
  protocol_id: string;
}

function AddTaskModal({ estId, protocols, tipSettings, onClose, onSaved }: {
  estId: string;
  protocols: Protocol[];
  tipSettings: TipSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("opening");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [targetRoles, setTargetRoles] = useState<string[]>(["all"]);
  const [steps, setSteps] = useState<TaskStep[]>([{ title: "", requires_photo: false, protocol_id: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStatuses = (Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden?.includes(s));
  const roleOptions: { value: string; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "manager", label: "Manager" },
    ...activeStatuses.map(s => ({ value: s, label: tipSettings.labels?.[s] ?? STAFF_STATUSES[s]?.label ?? s })),
  ];

  function toggleRole(val: string) {
    if (val === "all") {
      setTargetRoles(["all"]);
      return;
    }
    setTargetRoles(prev => {
      const without = prev.filter(r => r !== "all");
      if (without.includes(val)) {
        const next = without.filter(r => r !== val);
        return next.length === 0 ? ["all"] : next;
      }
      return [...without, val];
    });
  }

  const CATS: { value: TaskCategory; label: string; icon: string }[] = [
    { value: "opening", label: "Ouverture", icon: "🌅" },
    { value: "closing", label: "Fermeture", icon: "🌙" },
    { value: "continuous", label: "Continu", icon: "⚡" },
    { value: "custom", label: "Ponctuel", icon: "📌" },
  ];

  function updateStep(i: number, patch: Partial<TaskStep>) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function addStep() {
    setSteps(prev => [...prev, { title: "", requires_photo: false, protocol_id: "" }]);
  }

  function removeStep(i: number) {
    if (steps.length === 1) return;
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }

  const canSave = name.trim().length > 0 && steps.every(s => s.title.trim().length > 0);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const { data: existing } = await supabase.from("task_templates").select("display_order").eq("establishment_id", estId).eq("category", category).order("display_order", { ascending: false }).limit(1).maybeSingle();
      let order = (existing?.display_order ?? 0) + 1;
      const roles = targetRoles.length === 0 ? ["all"] : targetRoles;
      for (const role of roles) {
        for (const step of steps) {
          const stepSuffix = steps.length > 1 ? ` — ${step.title.trim()}` : "";
          const roleSuffix = roles.length > 1 && role !== "all" ? ` (${roleOptions.find(r => r.value === role)?.label ?? role})` : "";
          const title = `${name.trim()}${stepSuffix}${roleSuffix}`;
          const { error: err } = await supabase.from("task_templates").insert({
            establishment_id: estId,
            title,
            category,
            frequency,
            target_role: role,
            requires_photo: step.requires_photo,
            protocol_id: step.protocol_id || null,
            is_critical: false,
            is_active: true,
            display_order: order++,
          });
          if (err) throw err;
        }
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nouvelle tâche</p>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">

          {/* Nom principal */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Nom principal</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Nettoyage cuisine, Ouverture caisse…"
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>

          {/* Postes concernés */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Postes concernés</label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map(opt => {
                const selected = targetRoles.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => toggleRole(opt.value)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={selected
                      ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.35)" }
                      : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Étapes */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
              Étapes {steps.length > 1 && <span style={{ color: "var(--foreground-dim)" }}>· {steps.length}</span>}
            </label>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="rounded-xl p-3.5 space-y-3"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    {steps.length > 1 && (
                      <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{i + 1}.</span>
                    )}
                    <input
                      value={step.title}
                      onChange={e => updateStep(i, { title: e.target.value })}
                      placeholder={steps.length === 1 ? "Détail de la tâche (optionnel)" : "Nom de l'étape"}
                      className="flex-1 px-3 py-2 text-[13px] rounded-lg outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                    />
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} style={{ color: "var(--foreground-dim)", flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Photo toggle */}
                  <button onClick={() => updateStep(i, { requires_photo: !step.requires_photo })}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all"
                    style={step.requires_photo
                      ? { background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }
                      : { background: "var(--background)", border: "1px solid var(--border)" }}>
                    <Camera size={13} style={{ color: step.requires_photo ? "var(--accent)" : "var(--foreground-dim)", flexShrink: 0 }} />
                    <span className="text-[12px]" style={{ color: step.requires_photo ? "var(--accent)" : "var(--foreground-muted)" }}>
                      {step.requires_photo ? "Photo obligatoire" : "Photo optionnelle"}
                    </span>
                    <div className="ml-auto w-8 h-4 rounded-full relative transition-all flex-shrink-0"
                      style={{ background: step.requires_photo ? "var(--accent)" : "var(--border)" }}>
                      <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: step.requires_photo ? "calc(100% - 14px)" : "2px" }} />
                    </div>
                  </button>

                  {/* Protocole */}
                  <div>
                    <select
                      value={step.protocol_id}
                      onChange={e => updateStep(i, { protocol_id: e.target.value })}
                      className="w-full px-3 py-2 text-[12px] rounded-lg outline-none"
                      style={{ background: step.protocol_id ? "rgba(167,139,250,0.08)" : "var(--background)", border: `1px solid ${step.protocol_id ? "rgba(167,139,250,0.3)" : "var(--border)"}`, color: step.protocol_id ? "#A78BFA" : "var(--foreground-muted)" }}>
                      <option value="">Pas de protocole lié</option>
                      {protocols.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Add step button */}
            <button onClick={addStep}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all"
              style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px dashed var(--border)" }}>
              <Plus size={13} />
              Ajouter une étape
            </button>
          </div>

          {error && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</p>}

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 text-sm font-medium rounded-xl"
              style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={!canSave || saving}
              className="flex-1 py-3 text-sm font-semibold rounded-xl transition-opacity"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (!canSave || saving) ? 0.5 : 1 }}>
              {saving ? "Création…" : (() => {
                const n = steps.length * (targetRoles.length || 1);
                return n > 1 ? `Créer ${n} tâches` : "Créer la tâche";
              })()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT TASK MODAL ─────────────────────────────────────── */
function EditTaskModal({ task, tipSettings, onClose, onSaved }: {
  task: TaskTemplate;
  tipSettings: TipSettings;
  onClose: () => void;
  onSaved: (updated: TaskTemplate) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [targetRole, setTargetRole] = useState<string>(task.target_role);
  const [frequency, setFrequency] = useState<"daily" | "weekly">(task.frequency as "daily" | "weekly");
  const [requiresPhoto, setRequiresPhoto] = useState(task.requires_photo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStatuses = (Object.keys(STAFF_STATUSES) as StaffStatus[]).filter(s => !tipSettings.hidden?.includes(s));
  const roleOptions: { value: string; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "manager", label: "Manager" },
    ...activeStatuses.map(s => ({ value: s, label: tipSettings.labels?.[s] ?? STAFF_STATUSES[s]?.label ?? s })),
  ];

  const CATS: { value: TaskCategory; label: string }[] = [
    { value: "opening", label: "Ouverture" },
    { value: "closing", label: "Fermeture" },
    { value: "continuous", label: "Continu" },
    { value: "custom", label: "Ponctuel" },
  ];

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("task_templates").update({
      title: title.trim(),
      category,
      target_role: targetRole,
      frequency,
      requires_photo: requiresPhoto,
    }).eq("id", task.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved({ ...task, title: title.trim(), category, target_role: targetRole as TaskTargetRole, frequency, requires_photo: requiresPhoto });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>

        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Modifier la tâche</p>
          <button onClick={onClose} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATS.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={category === c.value
                    ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.35)" }
                    : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Poste concerné</label>
            <div className="flex gap-2 flex-wrap">
              {roleOptions.map(opt => (
                <button key={opt.value} onClick={() => setTargetRole(opt.value)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={targetRole === opt.value
                    ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.35)" }
                    : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Fréquence</label>
            <div className="flex gap-2">
              {(["daily", "weekly"] as const).map(f => (
                <button key={f} onClick={() => setFrequency(f)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={frequency === f
                    ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.35)" }
                    : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                  {f === "daily" ? "Quotidienne" : "Hebdomadaire"}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setRequiresPhoto(!requiresPhoto)}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl transition-all"
            style={requiresPhoto
              ? { background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }
              : { background: "var(--background-soft)", border: "1px solid var(--border)" }}>
            <Camera size={13} style={{ color: requiresPhoto ? "var(--accent)" : "var(--foreground-dim)" }} />
            <span className="text-[12px]" style={{ color: requiresPhoto ? "var(--accent)" : "var(--foreground-muted)" }}>
              {requiresPhoto ? "Photo obligatoire" : "Photo optionnelle"}
            </span>
            <div className="ml-auto w-8 h-4 rounded-full relative flex-shrink-0"
              style={{ background: requiresPhoto ? "var(--accent)" : "var(--border)" }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: requiresPhoto ? "calc(100% - 14px)" : "2px" }} />
            </div>
          </button>

          {error && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 text-sm font-medium rounded-xl"
              style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={!title.trim() || saving}
              className="flex-1 py-3 text-sm font-semibold rounded-xl transition-opacity"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
