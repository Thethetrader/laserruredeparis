"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { EmptyState } from "@/components/ui/custom/EmptyState";
import {
  Plus, Pencil, ToggleLeft, ToggleRight, AlertTriangle, Camera,
  Sunrise, Sunset, Zap, X, GripVertical, ChevronDown, ChevronUp
} from "lucide-react";
import type { TaskCategory, TaskTargetRole, TaskFrequency } from "@/lib/types/database";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

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

const DEV_TASKS: TaskTemplate[] = [
  { id: "t1", title: "Ouverture caisse", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 1 },
  { id: "t2", title: "Contrôle température frigos", description: "Vérifier entre 2°C et 4°C", category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 2 },
  { id: "t3", title: "Briefing équipe", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 3 },
  { id: "t4", title: "Mise en place de la salle", description: null, category: "opening", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 4 },
  { id: "t5", title: "Mise en place cuisine", description: null, category: "opening", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 5 },
  { id: "t6", title: "Fermeture caisse", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 6 },
  { id: "t7", title: "Nettoyage salle", description: null, category: "closing", target_role: "salle", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 7 },
  { id: "t8", title: "Nettoyage hotte", description: "Hotte dégraissée, filtres vérifiés", category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: true, is_critical: true, is_active: true, display_order: 8 },
  { id: "t9", title: "Plonge terminée", description: null, category: "closing", target_role: "cuisine", frequency: "daily", requires_photo: false, is_critical: false, is_active: true, display_order: 9 },
];

const emptyForm = (): Omit<TaskTemplate, "id" | "display_order" | "is_active"> => ({
  title: "",
  description: "",
  category: "opening",
  target_role: "all",
  frequency: "daily",
  requires_photo: false,
  is_critical: false,
});

export default function EstablishmentTasksPage() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<TaskCategory, boolean>>({
    opening: false, closing: false, continuous: false, custom: false,
  });
  const [estId, setEstId] = useState<string>(DEV_ESTABLISHMENT_ID);
  const [ownerId, setOwnerId] = useState<string>(DEV_PROFILE_ID);

  const load = useCallback(async () => {
    setLoading(true);
    if (DEV_MODE) {
      setTasks(DEV_TASKS);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id, role").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member || member.role !== "owner") { setLoading(false); return; }

    setEstId(member.establishment_id);
    setOwnerId(userId!);

    const { data } = await supabase.from("task_templates").select("*").eq("establishment_id", member.establishment_id).order("display_order");
    setTasks((data ?? []) as TaskTemplate[]);
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
      category: task.category,
      target_role: task.target_role,
      frequency: task.frequency,
      requires_photo: task.requires_photo,
      is_critical: task.is_critical,
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

  const byCategory = (cat: TaskCategory) => tasks.filter(t => t.category === cat);

  return (
    <div className="px-4 py-6 lg:px-8 pb-32 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />)}
        </div>
      ) : tasks.length === 0 ? (
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
                    {catTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 px-4 py-3 group"
                        style={{
                          background: "var(--background)",
                          opacity: task.is_active ? 1 : 0.5,
                        }}
                      >
                        <GripVertical size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--foreground-dim)" }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                              {task.title}
                            </span>
                            {task.is_critical && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                                <AlertTriangle size={9} />HACCP
                              </span>
                            )}
                            {task.requires_photo && (
                              <Camera size={11} style={{ color: "var(--foreground-dim)" }} />
                            )}
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
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(task)}
                            className="p-1.5 rounded-base transition-colors"
                            style={{ color: "var(--foreground-dim)" }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => toggleActive(task)}
                            className="p-1.5 rounded-base transition-colors"
                            style={{ color: task.is_active ? "var(--accent)" : "var(--foreground-dim)" }}
                          >
                            {task.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal créer/modifier */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
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
    </div>
  );
}
