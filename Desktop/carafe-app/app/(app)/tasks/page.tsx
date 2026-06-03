"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { EmptyState } from "@/components/ui/custom/EmptyState";
import {
  CheckCircle2, Circle, Camera, AlertTriangle, ChevronDown, ChevronUp,
  RefreshCw, Users, UtensilsCrossed, Wine, Briefcase, Sunrise, Sunset, Zap,
  X, Plus, Clock, Settings, BookOpen, ZoomIn, User,
} from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";
import type { TaskCategory, TaskTargetRole } from "@/lib/types/database";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

interface Protocol {
  id: string;
  title: string;
  content: string;
  category: string;
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
  const [savingOneShot, setSavingOneShot] = useState(false);
  const [protocolModal, setProtocolModal] = useState<Protocol | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("employee");
  const [estId, setEstId] = useState(DEV_ESTABLISHMENT_ID);

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
    const { data: member } = await supabase
      .from("establishment_members")
      .select("establishment_id, role")
      .eq("profile_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .eq("is_active", true)
      .single();

    if (!member) { setLoading(false); return; }
    setUserRole(member.role);
    setEstId(member.establishment_id);

    const [{ data: tmpl }, { data: comp }, { data: shots }, { data: protos }, { data: memberRows }] = await Promise.all([
      supabase.from("task_templates").select("*").eq("establishment_id", member.establishment_id).eq("is_active", true).order("display_order"),
      supabase.from("task_completions").select("*, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("service_date", today),
      supabase.from("task_one_shots").select("*, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("due_date", today),
      supabase.from("protocols").select("id, title, content, category").eq("establishment_id", member.establishment_id),
      supabase.from("establishment_members").select("profile_id, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("is_active", true),
    ]);

    setTemplates((tmpl ?? []) as TaskTemplate[]);
    setCompletions(
      ((comp ?? []) as (TaskCompletion & { profiles: { first_name: string | null; last_name: string | null } | null })[])
        .map(c => ({ ...c, validator_name: c.profiles ? `${c.profiles.first_name ?? ""} ${c.profiles.last_name ?? ""}`.trim() : "—" }))
    );
    setOneShots(
      ((shots ?? []) as (TaskOneShot & { profiles: { first_name: string | null; last_name: string | null } | null })[])
        .map(s => ({ ...s, creator_name: s.profiles ? `${s.profiles.first_name ?? ""} ${s.profiles.last_name ?? ""}`.trim() : "—" }))
    );
    setProtocols((protos ?? []) as Protocol[]);
    setMembers(
      ((memberRows ?? []) as Array<{ profile_id: string; profiles: { first_name: string | null; last_name: string | null } | null }>).map(m => ({
        profile_id: m.profile_id,
        name: [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "Membre",
      }))
    );
    setLoading(false);
  }, [today, devRole]);

  useEffect(() => { load(); }, [load]);

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
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member) { setValidating(null); return; }

    await supabase.from("task_completions").insert({
      establishment_id: member.establishment_id,
      task_template_id: templateId || null,
      task_one_shot_id: oneShotId || null,
      validated_by: userId!,
      service_date: today,
    });
    await load();
    setValidating(null);
  }

  function resetOneShotForm() {
    setNewOneShotTitle("");
    setNewOneShotDesc("");
    setNewOneShotRole("all");
    setNewOneShotAssignedTo("");
    setNewOneShotRequiresPhoto(false);
    setNewOneShotIsCritical(false);
  }

  async function createOneShot() {
    if (!newOneShotTitle.trim()) return;
    setSavingOneShot(true);
    if (DEV_MODE) {
      setOneShots(prev => [...prev, {
        id: `os-${Date.now()}`,
        title: newOneShotTitle,
        description: newOneShotDesc || null,
        target_role: newOneShotRole,
        due_date: today,
        requires_photo: newOneShotRequiresPhoto,
        is_critical: newOneShotIsCritical,
        assigned_to: newOneShotAssignedTo || null,
        is_validated: false,
        creator_name: "Dev Mode",
        protocol_id: null,
      }]);
      setShowOneShotModal(false);
      resetOneShotForm();
      setSavingOneShot(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member) { setSavingOneShot(false); return; }

    const { error: insertError } = await supabase.from("task_one_shots").insert({
      establishment_id: member.establishment_id,
      created_by: userId!,
      title: newOneShotTitle,
      description: newOneShotDesc || null,
      target_role: newOneShotRole,
      assigned_to: newOneShotAssignedTo || null,
      requires_photo: newOneShotRequiresPhoto,
      is_critical: newOneShotIsCritical,
      due_date: today,
    });
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

  const byCategory = (cat: TaskCategory) =>
    filteredTemplates.filter(t => t.category === cat && isWindowOpen(t.category, currentHour));

  const totalTasks = filteredTemplates.filter(t => isWindowOpen(t.category, currentHour)).length + oneShots.length;
  const doneTasks = completions.length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const allDone = totalTasks > 0 && doneTasks >= totalTasks;

  const filterButtons: FilterRole[] = ["all", "manager", "salle", "cuisine", "bar"];

  return (
    <div className="px-4 py-6 lg:px-8 pb-32 max-w-2xl">
      <div className="mb-6">
        <MonoLabel size="xs" className="mb-1 block">Tâches du jour</MonoLabel>
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Tâches</h1>
        {isManager && (
          <div className="flex items-center gap-2">
            <Link
              href="/establishment/tasks"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
              style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
            >
              <Settings size={12} />
              Configurer
            </Link>
            <button
              onClick={() => setShowOneShotModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
              style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              <Plus size={12} />
              Tâche ponctuelle
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
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {filterButtons.map(r => {
          const Icon = ROLE_ICON[r === "all" ? "all" : r];
          return (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-base text-[11px] font-medium transition-colors"
              style={{
                background: filterRole === r ? "rgba(6,182,212,0.1)" : "var(--background-elev)",
                color: filterRole === r ? "var(--accent)" : "var(--foreground-dim)",
                border: filterRole === r ? "1px solid rgba(6,182,212,0.25)" : "1px solid var(--border)",
              }}
            >
              <Icon size={10} />
              {r === "all" ? "Tous" : ROLE_LABEL[r]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(["opening", "continuous", "closing"] as TaskCategory[]).map(cat => {
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

                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 px-4 py-3 transition-colors"
                          style={{ background: isDone ? "rgba(16,185,129,0.04)" : "var(--background)" }}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {isDone ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} /> : <Circle size={18} style={{ color: "var(--foreground-dim)" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13px] font-medium" style={{ color: isDone ? "var(--foreground-muted)" : "var(--foreground)", textDecoration: isDone ? "line-through" : "none" }}>
                                {task.title}
                              </span>
                              {task.is_critical && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                                  <AlertTriangle size={9} />HACCP
                                </span>
                              )}
                              {task.requires_photo && !isDone && <Camera size={12} style={{ color: "var(--foreground-dim)" }} />}
                            </div>

                            {isDone && comp ? (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                                  {comp.validator_name} · {relTime(comp.validated_at)}
                                  {comp.is_catchup && " · rattrapage"}
                                </p>
                                {comp.photo_url && (
                                  <button
                                    onClick={() => setLightboxUrl(comp.photo_url)}
                                    className="flex-shrink-0 relative rounded-md overflow-hidden transition-opacity hover:opacity-80"
                                    style={{ width: 32, height: 32 }}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={comp.photo_url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                                      <ZoomIn size={11} color="white" />
                                    </div>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                {task.description && <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{task.description}</p>}
                                {linkedProtocol && (
                                  <button onClick={() => setProtocolModal(linkedProtocol)} className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium transition-opacity hover:opacity-80" style={{ color: "var(--accent)" }}>
                                    <BookOpen size={10} />Voir le protocole
                                  </button>
                                )}
                              </>
                            )}

                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>
                                {ROLE_LABEL[task.target_role]}
                              </span>
                            </div>
                          </div>
                          {!isDone && (
                            <button
                              onClick={() => validateTask(task.id)}
                              disabled={isValidatingThis}
                              className="flex-shrink-0 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
                              style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)", opacity: isValidatingThis ? 0.5 : 1 }}
                            >
                              {isValidatingThis ? <RefreshCw size={12} className="animate-spin" /> : "Valider"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tâches ponctuelles */}
          {oneShots.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "var(--background-elev)" }}>
                <Clock size={14} style={{ color: "var(--foreground-dim)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Ponctuelles</span>
              </div>
              <div className="divide-y" style={{ borderTop: "1px solid var(--border-soft)" }}>
                {oneShots.map(shot => {
                  const comp = completionMap.get(shot.id);
                  const isDone = shot.is_validated || !!comp;
                  const linkedProtocol = shot.protocol_id ? protocols.find(p => p.id === shot.protocol_id) : null;
                  const assignedMember = shot.assigned_to ? members.find(m => m.profile_id === shot.assigned_to) : null;

                  return (
                    <div key={shot.id} className="flex items-start gap-3 px-4 py-3" style={{ background: isDone ? "rgba(16,185,129,0.04)" : "var(--background)" }}>
                      <div className="mt-0.5">
                        {isDone ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} /> : <Circle size={18} style={{ color: "var(--foreground-dim)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-medium" style={{ color: isDone ? "var(--foreground-muted)" : "var(--foreground)", textDecoration: isDone ? "line-through" : "none" }}>
                            {shot.title}
                          </p>
                          {shot.is_critical && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                              <AlertTriangle size={9} />HACCP
                            </span>
                          )}
                          {shot.requires_photo && !isDone && <Camera size={12} style={{ color: "var(--foreground-dim)" }} />}
                        </div>
                        {shot.description && <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{shot.description}</p>}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                            Ajouté par {shot.creator_name}
                          </p>
                          {assignedMember ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>
                              <User size={9} />→ {assignedMember.name}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>
                              {ROLE_LABEL[shot.target_role]}
                            </span>
                          )}
                        </div>
                        {!isDone && linkedProtocol && (
                          <button onClick={() => setProtocolModal(linkedProtocol)} className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium" style={{ color: "var(--accent)" }}>
                            <BookOpen size={10} />Voir le protocole
                          </button>
                        )}
                      </div>
                      {!isDone && (
                        <button
                          onClick={() => validateTask("", shot.id)}
                          disabled={validating === shot.id}
                          className="flex-shrink-0 px-3 py-1.5 rounded-base text-[12px] font-medium"
                          style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}
                        >
                          Valider
                        </button>
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

      {/* Modal tâche ponctuelle (riche) */}
      {showOneShotModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={e => { if (e.target === e.currentTarget) { setShowOneShotModal(false); resetOneShotForm(); } }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>Tâche ponctuelle</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Tâche à faire aujourd'hui uniquement</p>
              </div>
              <button onClick={() => { setShowOneShotModal(false); resetOneShotForm(); }} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre *</label>
                <input type="text" placeholder="Ex: Vérifier livraison vin" value={newOneShotTitle} onChange={e => setNewOneShotTitle(e.target.value)} autoFocus className="w-full px-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel)</span></label>
                <textarea value={newOneShotDesc} onChange={e => setNewOneShotDesc(e.target.value)} placeholder="Détails ou instructions…" rows={2} className="w-full px-3 py-2 rounded-base text-[13px] outline-none resize-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>

              {/* Poste cible */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Poste cible</label>
                <select value={newOneShotRole} onChange={e => setNewOneShotRole(e.target.value as TaskTargetRole)} className="w-full px-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  {(["all", "manager", "salle", "cuisine", "bar"] as TaskTargetRole[]).map(r => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </div>

              {/* Assigner à une personne */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  <div className="flex items-center gap-1.5">
                    <User size={11} />
                    Assigner à une personne <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel)</span>
                  </div>
                </label>
                <select value={newOneShotAssignedTo} onChange={e => setNewOneShotAssignedTo(e.target.value)} className="w-full px-3 py-2 rounded-base text-[13px] outline-none" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="">Tout le poste sélectionné</option>
                  {members.map(m => (
                    <option key={m.profile_id} value={m.profile_id}>{m.name}</option>
                  ))}
                </select>
                {newOneShotAssignedTo && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--foreground-dim)" }}>
                    Réservée à cette personne uniquement.
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <label className="flex items-center gap-3 cursor-pointer pt-3">
                  <input type="checkbox" checked={newOneShotRequiresPhoto} onChange={e => setNewOneShotRequiresPhoto(e.target.checked)} className="rounded" style={{ accentColor: "var(--accent)" }} />
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--foreground)" }}>Photo obligatoire pour valider</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>La personne devra prendre une photo</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={newOneShotIsCritical} onChange={e => setNewOneShotIsCritical(e.target.checked)} className="rounded" style={{ accentColor: "#F59E0B" }} />
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--foreground)" }}>Tâche critique (hygiène / sécurité)</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Marquée HACCP dans la liste</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => { setShowOneShotModal(false); resetOneShotForm(); }} className="flex-1 py-2.5 rounded-base text-[13px] font-medium" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>Annuler</button>
              <button onClick={createOneShot} disabled={!newOneShotTitle.trim() || savingOneShot} className="flex-1 py-2.5 rounded-base text-[13px] font-semibold" style={{ background: newOneShotTitle.trim() ? "var(--accent)" : "var(--background-elev)", color: newOneShotTitle.trim() ? "#09090B" : "var(--foreground-dim)", opacity: savingOneShot ? 0.7 : 1 }}>
                {savingOneShot ? "Création…" : "Créer la tâche"}
              </button>
            </div>
          </div>
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
    </div>
  );
}
