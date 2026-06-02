"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import Link from "next/link";
import { EmptyState } from "@/components/ui/custom/EmptyState";
import {
  Plus, Pencil, ToggleLeft, ToggleRight, AlertTriangle, Camera,
  Sunrise, Sunset, Zap, X, GripVertical, ChevronDown, ChevronUp, BookOpen, ChevronLeft,
} from "lucide-react";
import type { TaskCategory, TaskTargetRole, TaskFrequency } from "@/lib/types/database";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

interface Protocol {
  id: string;
  title: string;
  category: string;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  target_role: TaskTargetRole;
  frequency: TaskFrequency;
  requires_photo: boolean;
  is_critical: boolean;
  is_active: boolean;
  display_order: number;
  assigned_to: string | null;
  protocol_id: string | null;
  section_id: string | null;
}

interface Member {
  profile_id: string;
  name: string;
}

interface TaskSection {
  id: string;
  name: string;
}

interface ModalState {
  mode: "create" | "edit";
  task?: TaskTemplate;
}

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  opening: "Ouverture",
  closing: "Fermeture",
  continuous: "En continu",
  custom: "Personnalisé",
};

const CATEGORY_ICON: Record<TaskCategory, React.ElementType> = {
  opening: Sunrise,
  closing: Sunset,
  continuous: Zap,
  custom: Plus,
};

const ROLE_LABEL: Record<TaskTargetRole, string> = {
  all: "Tous",
  salle: "Salle",
  cuisine: "Cuisine",
  bar: "Bar",
  manager: "Manager",
};

const FREQ_LABEL: Record<TaskFrequency, string> = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  per_service: "À chaque service",
};

const DEV_PROTOCOLS: Protocol[] = [
  { id: "p1", title: "Procédure ouverture caisse", category: "opening" },
  { id: "p2", title: "Contrôle températures HACCP", category: "hygiene" },
  { id: "p3", title: "Protocole nettoyage cuisine", category: "hygiene" },
];

const DEV_TASKS: TaskTemplate[] = [
  { id: "t1", title: "Ouverture caisse", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 1, assigned_to: null, protocol_id: "p1", section_id: "s1" },
  { id: "t2", title: "Contrôle température frigos", description: "Vérifier entre 2°C et 4°C", category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 2, assigned_to: null, protocol_id: "p2", section_id: "s1" },
  { id: "t3", title: "Briefing équipe", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 3, assigned_to: null, protocol_id: null, section_id: "s1" },
  { id: "t4", title: "Mise en place de la salle", description: null, category: "opening", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 4, assigned_to: null, protocol_id: null, section_id: "s1" },
  { id: "t5", title: "Mise en place cuisine", description: null, category: "opening", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 5, assigned_to: null, protocol_id: null, section_id: "s1" },
  { id: "t6", title: "Fermeture caisse", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 6, assigned_to: null, protocol_id: null, section_id: "s2" },
  { id: "t7", title: "Nettoyage salle", description: null, category: "closing", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 7, assigned_to: null, protocol_id: null, section_id: "s2" },
  { id: "t8", title: "Nettoyage hotte", description: "Hotte dégraissée, filtres vérifiés", category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 8, assigned_to: null, protocol_id: "p3", section_id: "s2" },
  { id: "t9", title: "Plonge terminée", description: null, category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 9, assigned_to: null, protocol_id: null, section_id: "s2" },
];

const emptyForm = (): Omit<TaskTemplate, "id" | "display_order" | "is_active"> => ({
  title: "",
  description: "",
  category: "opening",
  target_role: "all",
  frequency: "daily",
  requires_photo: false,
  is_critical: false,
  assigned_to: null,
  protocol_id: null,
  section_id: null,
});

const DEV_MEMBERS: Member[] = [
  { profile_id: "m1", name: "Yasmine Benali" },
  { profile_id: "m2", name: "Rayan Dupont" },
  { profile_id: "m3", name: "Léa Martin" },
];

const DEV_SECTIONS: TaskSection[] = [
  { id: "s1", name: "Ouverture" },
  { id: "s2", name: "Fermeture" },
];

export default function EstablishmentTasksPage() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<TaskCategory, boolean>>({
    opening: false, closing: false, continuous: false, custom: false,
  });
  const [estId, setEstId] = useState<string>(DEV_ESTABLISHMENT_ID);
  const [ownerId, setOwnerId] = useState<string>(DEV_PROFILE_ID);
  const [members, setMembers] = useState<Member[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [sectionModal, setSectionModal] = useState<null | "create" | { id: string; name: string }>(null);
  const [sectionName, setSectionName] = useState("");
  const [view, setView] = useState<"sections" | "categories">("sections");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActive = useRef(false);

  function handleGripTouchStart(e: React.TouchEvent, taskId: string, cat: TaskCategory) {
    touchDragActive.current = false;
    longPressTimer.current = setTimeout(() => {
      touchDragActive.current = true;
      setDragId(taskId);
      try { navigator.vibrate?.(50); } catch (_) {}
    }, 450);
  }

  function handleGripTouchMove(e: React.TouchEvent, cat: TaskCategory) {
    if (!touchDragActive.current) { if (longPressTimer.current) clearTimeout(longPressTimer.current); return; }
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest("[data-task-id]");
    if (row) setDragOverId(row.getAttribute("data-task-id"));
  }

  function handleGripTouchEnd(cat: TaskCategory) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (touchDragActive.current && dragOverId) handleDrop(dragOverId, cat);
    touchDragActive.current = false;
    setDragId(null); setDragOverId(null);
  }

  const load = useCallback(async () => {
    setLoading(true);
    if (DEV_MODE) {
      setTasks(DEV_TASKS);
      setMembers(DEV_MEMBERS);
      setProtocols(DEV_PROTOCOLS);
      setSections(DEV_SECTIONS);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id, role").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member || member.role !== "owner") { setLoading(false); return; }

    setEstId(member.establishment_id);
    setOwnerId(userId!);

    const [{ data }, { data: memberRows }, { data: protoRows }] = await Promise.all([
      supabase.from("task_templates").select("*").eq("establishment_id", member.establishment_id).order("display_order"),
      supabase.from("establishment_members").select("profile_id, is_active, profiles(first_name, last_name)").eq("establishment_id", member.establishment_id).eq("is_active", true),
      supabase.from("protocols").select("id, title, category").eq("establishment_id", member.establishment_id).order("title"),
    ]);
    setTasks((data ?? []) as TaskTemplate[]);
    setMembers(
      ((memberRows ?? []) as Array<{ profile_id: string; profiles: { first_name: string | null; last_name: string | null } | null }>).map(m => ({
        profile_id: m.profile_id,
        name: [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ") || "Membre",
      }))
    );
    setProtocols((protoRows ?? []) as Protocol[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setModal({ mode: "create" });
  }

  function openEdit(task: TaskTemplate) {
    setForm({
      title: task.title,
      description: task.description ?? "",
      section_id: task.section_id ?? null,
      category: task.category,
      target_role: task.target_role,
      frequency: task.frequency,
      requires_photo: task.requires_photo,
      is_critical: task.is_critical,
      assigned_to: task.assigned_to ?? null,
      protocol_id: task.protocol_id ?? null,
    });
    setModal({ mode: "edit", task });
  }

  async function saveTask() {
    if (!form.title.trim()) return;
    setSaving(true);

    if (DEV_MODE) {
      if (modal?.mode === "create") {
        const newTask: TaskTemplate = {
          id: `t-${Date.now()}`,
          ...form,
          description: form.description || null,
          is_active: true,
          display_order: tasks.length + 1,
        };
        setTasks(prev => [...prev, newTask]);
      } else if (modal?.task) {
        setTasks(prev => prev.map(t => t.id === modal.task!.id ? { ...t, ...form, description: form.description || null } : t));
      }
      setModal(null);
      setSaving(false);
      return;
    }

    const supabase = createClient();
    if (modal?.mode === "create") {
      const maxOrder = Math.max(0, ...tasks.filter(t => t.category === form.category).map(t => t.display_order));
      await supabase.from("task_templates").insert({
        establishment_id: estId,
        created_by: ownerId,
        ...form,
        description: form.description || null,
        display_order: maxOrder + 1,
      });
    } else if (modal?.task) {
      await supabase.from("task_templates").update({ ...form, description: form.description || null }).eq("id", modal.task.id);
    }
    await load();
    setModal(null);
    setSaving(false);
  }

  async function toggleActive(task: TaskTemplate) {
    if (DEV_MODE) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !t.is_active } : t));
      return;
    }
    const supabase = createClient();
    await supabase.from("task_templates").update({ is_active: !task.is_active }).eq("id", task.id);
    await load();
  }

  async function deleteTask(task: TaskTemplate) {
    if (DEV_MODE) {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      return;
    }
    const supabase = createClient();
    await supabase.from("task_templates").delete().eq("id", task.id);
    await load();
  }

  async function handleDrop(targetId: string, cat: TaskCategory) {
    if (!dragId || dragId === targetId) return;
    const catTasks = tasks.filter(t => t.category === cat);
    const fromIdx = catTasks.findIndex(t => t.id === dragId);
    const toIdx = catTasks.findIndex(t => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...catTasks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const updatedTasks = tasks.map(t => {
      const newIdx = reordered.findIndex(r => r.id === t.id);
      return newIdx !== -1 ? { ...t, display_order: newIdx } : t;
    });
    setTasks(updatedTasks);

    if (!DEV_MODE) {
      const supabase = createClient();
      await Promise.all(reordered.map((t, i) =>
        supabase.from("task_templates").update({ display_order: i }).eq("id", t.id)
      ));
    }
  }

  const byCategory = (cat: TaskCategory) => tasks.filter(t => t.category === cat);

  return (
    <div className="px-4 py-6 lg:px-8 pb-32 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/tasks" className="flex items-center gap-1 text-[11px] mb-2" style={{ color: "var(--foreground-dim)" }}><ChevronLeft size={12} />Retour aux tâches</Link>
          <MonoLabel size="xs" className="mb-1 block">Paramètres</MonoLabel>
          <h1 className="text-[18px] font-semibold" style={{ color: "var(--foreground)" }}>Tâches récurrentes</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
            Définissez les tâches type de votre établissement
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-base text-[13px] font-medium transition-colors"
          style={{ background: "var(--accent)", color: "#09090B" }}
        >
          <Plus size={14} />
          Nouvelle tâche
        </button>
      </div>


      {/* View toggle */}
      <div className="flex items-center gap-1.5 mb-5">
        {(["sections", "categories"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
            style={{
              background: view === v ? "rgba(6,182,212,0.1)" : "var(--background-elev)",
              color: view === v ? "var(--accent)" : "var(--foreground-dim)",
              border: view === v ? "1px solid rgba(6,182,212,0.25)" : "1px solid var(--border)",
            }}>
            {v === "sections" ? "Sections" : "Catégories"}
          </button>
        ))}
      </div>

      {view === "sections" && (
        <div className="space-y-3 mb-5">
          {sections.map(section => {
            const sectionTasks = tasks.filter(t => t.section_id === section.id);
            return (
              <div key={section.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--background-elev)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{section.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--foreground-dim)" }}>
                      {sectionTasks.filter(t => t.is_active).length} tâche{sectionTasks.filter(t => t.is_active).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSectionName(section.name); setSectionModal({ id: section.id, name: section.name }); }}
                      className="p-1.5 rounded-base text-[11px] font-medium transition-colors flex items-center gap-1"
                      style={{ color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                      <Pencil size={11} />Modifier
                    </button>
                    <button onClick={() => { if (DEV_MODE) { setSections(prev => prev.filter(s => s.id !== section.id)); setTasks(prev => prev.map(t => t.section_id === section.id ? { ...t, section_id: null } : t)); } }}
                      className="p-1.5 rounded-base text-[11px] font-medium transition-colors flex items-center gap-1"
                      style={{ color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <X size={11} />Supprimer
                    </button>
                  </div>
                </div>
                <div style={{ background: "var(--background-elev)" }}>
                  {sectionTasks.length === 0 ? (
                    <p className="px-4 py-3 text-[12px]" style={{ color: "var(--foreground-dim)" }}>Aucune tâche dans cette section</p>
                  ) : sectionTasks.map((task, idx) => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid var(--border-soft)" }}>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px]" style={{ color: task.is_active ? "var(--foreground)" : "var(--foreground-dim)", textDecoration: task.is_active ? "none" : "line-through" }}>{task.title}</span>
                        {task.is_critical && <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>HACCP</span>}
                      </div>
                      <button onClick={() => openEdit(task)} className="p-1 rounded" style={{ color: "var(--foreground-dim)" }}><Pencil size={12} /></button>
                    </div>
                  ))}
                  <div className="px-4 py-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <button onClick={() => { setForm({ ...emptyForm(), section_id: section.id, category: (sectionTasks[0]?.category ?? "opening") }); setModal({ mode: "create" }); }}
                      className="flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-70"
                      style={{ color: "var(--accent)" }}>
                      <Plus size={12} />Ajouter une tâche
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.filter(t => !t.section_id).length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", opacity: 0.7 }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "var(--background-elev)" }}>
                <span className="text-[12px] font-medium" style={{ color: "var(--foreground-dim)" }}>Non assignées</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--foreground-dim)" }}>{tasks.filter(t => !t.section_id).length}</span>
              </div>
              {tasks.filter(t => !t.section_id).map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
                  <span className="flex-1 text-[13px]" style={{ color: "var(--foreground-dim)" }}>{task.title}</span>
                  <button onClick={() => openEdit(task)} className="p-1 rounded" style={{ color: "var(--foreground-dim)" }}><Pencil size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setSectionName(""); setSectionModal("create"); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors"
            style={{ border: "2px dashed var(--border)", color: "var(--foreground-dim)" }}>
            <Plus size={14} />Nouvelle section
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />)}
        </div>
      ) : view === "categories" ? (
        tasks.length === 0 ? (
          <EmptyState
            message="Aucune tâche configurée"
            sub="Créez votre première tâche récurrente"
            action={
              <button onClick={openCreate} className="px-4 py-2 rounded-base text-[13px] font-medium" style={{ background: "var(--accent)", color: "#09090B" }}>
                Créer une tâche
              </button>
            }
          />
        ) : (
        <div className="space-y-4">
          {(["opening", "continuous", "closing"] as TaskCategory[]).map(cat => {
            const catTasks = byCategory(cat);
            if (catTasks.length === 0) return null;
            const CatIcon = CATEGORY_ICON[cat];
            const isCollapsed = collapsed[cat];

            return (
              <div key={cat} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ background: "var(--background-elev)" }}
                >
                  <div className="flex items-center gap-2">
                    <CatIcon size={14} style={{ color: "var(--foreground-dim)" }} />
                    <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                      {CATEGORY_LABEL[cat]}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--foreground-dim)" }}>
                      {catTasks.filter(t => t.is_active).length} actives
                    </span>
                  </div>
                  {isCollapsed ? <ChevronDown size={14} style={{ color: "var(--foreground-dim)" }} /> : <ChevronUp size={14} style={{ color: "var(--foreground-dim)" }} />}
                </button>

                {!isCollapsed && (
                  <div className="divide-y" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    {catTasks.map(task => {
                      const linkedProtocol = task.protocol_id ? protocols.find(p => p.id === task.protocol_id) : null;
                      const isDragOver = dragOverId === task.id && dragId !== task.id;
                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 px-4 py-3 group transition-all"
                          draggable
                          data-task-id={task.id}
                          onDragStart={() => setDragId(task.id)}
                          onDragOver={e => { e.preventDefault(); setDragOverId(task.id); }}
                          onDrop={e => { e.preventDefault(); handleDrop(task.id, cat); setDragId(null); setDragOverId(null); }}
                          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                          style={{
                            background: "var(--background)",
                            opacity: task.is_active ? (dragId === task.id ? 0.4 : 1) : 0.5,
                            borderTop: isDragOver ? "2px solid var(--accent)" : undefined,
                          }}
                        >
                          <GripVertical size={14} className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none" style={{ color: "var(--foreground-dim)" }}
                            onTouchStart={e => handleGripTouchStart(e, task.id, cat)}
                            onTouchMove={e => handleGripTouchMove(e, cat)}
                            onTouchEnd={() => handleGripTouchEnd(cat)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{task.title}</span>
                              {task.is_critical && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                                  <AlertTriangle size={9} />HACCP
                                </span>
                              )}
                              {task.requires_photo && <Camera size={11} style={{ color: "var(--foreground-dim)" }} />}
                            </div>
                            {task.description && (
                              <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{task.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>
                                {ROLE_LABEL[task.target_role]}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)" }}>
                                {FREQ_LABEL[task.frequency]}
                              </span>
                              {task.assigned_to && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>
                                  → {members.find(m => m.profile_id === task.assigned_to)?.name ?? "Assigné"}
                                </span>
                              )}
                              {linkedProtocol && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(6,182,212,0.08)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>
                                  <BookOpen size={9} />
                                  {linkedProtocol.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(task)} className="p-1.5 rounded-base transition-colors" style={{ color: "var(--foreground-dim)" }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => toggleActive(task)} className="p-1.5 rounded-base transition-colors" style={{ color: task.is_active ? "var(--accent)" : "var(--foreground-dim)" }}>
                              {task.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )
      ) : null}

      {/* Modal créer/modifier */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                {modal.mode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}
              </h2>
              <button onClick={() => setModal(null)} style={{ color: "var(--foreground-dim)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Titre *</label>
                <input
                  type="text"
                  placeholder="Ex: Nettoyage hotte"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Description (optionnel)</label>
                <input
                  type="text"
                  placeholder="Détails ou instructions courtes"
                  value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as TaskCategory }))}
                    className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <option value="opening">Ouverture</option>
                    <option value="continuous">En continu</option>
                    <option value="closing">Fermeture</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Poste cible</label>
                  <select
                    value={form.target_role}
                    onChange={e => setForm(f => ({ ...f, target_role: e.target.value as TaskTargetRole }))}
                    className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    {(["all", "manager", "salle", "cuisine", "bar"] as TaskTargetRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Fréquence</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value as TaskFrequency }))}
                  className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="per_service">À chaque service</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "var(--foreground-dim)" }}>Assigner à</label>
                <select
                  value={form.assigned_to ?? ""}
                  onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value || null }))}
                  className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value="">Tout le poste sélectionné</option>
                  {members.map(m => (
                    <option key={m.profile_id} value={m.profile_id}>{m.name}</option>
                  ))}
                </select>
                {form.assigned_to && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--foreground-dim)" }}>
                    Cette tâche sera réservée à cette personne (prioritaire sur le poste).
                  </p>
                )}
              </div>

              {/* Protocole associé */}
              <div>
                <label className="text-[11px] mb-1 flex items-center gap-1.5" style={{ color: "var(--foreground-dim)" }}>
                  <BookOpen size={11} />
                  Protocole associé (optionnel)
                </label>
                <select
                  value={form.protocol_id ?? ""}
                  onChange={e => setForm(f => ({ ...f, protocol_id: e.target.value || null }))}
                  className="w-full px-3 py-2 rounded-base text-[13px] outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value="">Aucun protocole</option>
                  {protocols.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {form.protocol_id && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--foreground-dim)" }}>
                    L'employé pourra consulter ce protocole directement depuis la tâche.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requires_photo}
                    onChange={e => setForm(f => ({ ...f, requires_photo: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--foreground)" }}>Photo obligatoire pour valider</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>L'employé devra prendre une photo</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_critical}
                    onChange={e => setForm(f => ({ ...f, is_critical: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: "#F59E0B" }}
                  />
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--foreground)" }}>Tâche critique (hygiène / sécurité)</p>
                    <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Marquée HACCP, signalée dans les récaps</p>
                  </div>
                </label>
              </div>

              {modal.mode === "edit" && (
                <button
                  onClick={() => { deleteTask(modal.task!); setModal(null); }}
                  className="w-full py-2 rounded-base text-[12px] font-medium mt-1"
                  style={{ background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  Supprimer cette tâche
                </button>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-base text-[13px] font-medium"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
              >
                Annuler
              </button>
              <button
                onClick={saveTask}
                disabled={!form.title.trim() || saving}
                className="flex-1 py-2.5 rounded-base text-[13px] font-semibold"
                style={{
                  background: form.title.trim() ? "var(--accent)" : "var(--background-elev)",
                  color: form.title.trim() ? "#09090B" : "var(--foreground-dim)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Enregistrement…" : modal.mode === "create" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Section create/edit modal */}
      {sectionModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setSectionModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                {sectionModal === "create" ? "Nouvelle section" : "Modifier la section"}
              </h2>
              <button onClick={() => setSectionModal(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
            </div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Nom de la section *</label>
            <input
              type="text"
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder="Ex: Ouverture, Service du midi…"
              autoFocus
              className="w-full px-3 py-2.5 rounded-base text-[13px] outline-none mb-4"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <div className="flex gap-2">
              <button onClick={() => setSectionModal(null)}
                className="flex-1 py-2.5 rounded-base text-[13px] font-medium"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
                Annuler
              </button>
              <button
                disabled={!sectionName.trim()}
                onClick={() => {
                  if (!sectionName.trim()) return;
                  if (sectionModal === "create") {
                    const newSection: TaskSection = { id: `s-${Date.now()}`, name: sectionName.trim() };
                    setSections(prev => [...prev, newSection]);
                  } else {
                    setSections(prev => prev.map(s => s.id === sectionModal.id ? { ...s, name: sectionName.trim() } : s));
                  }
                  setSectionModal(null);
                  setSectionName("");
                }}
                className="flex-1 py-2.5 rounded-base text-[13px] font-semibold"
                style={{ background: "var(--accent)", color: "#09090B", opacity: sectionName.trim() ? 1 : 0.5 }}>
                {sectionModal === "create" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
