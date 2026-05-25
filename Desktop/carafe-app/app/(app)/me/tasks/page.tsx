"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { EmptyState } from "@/components/ui/custom/EmptyState";
import {
  CheckCircle2, Circle, Camera, AlertTriangle, RefreshCw,
  X, Sunrise, Sunset, Zap, Clock, Wifi, WifiOff
} from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";
import type { TaskCategory, TaskTargetRole } from "@/lib/types/database";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

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
}

interface TaskCompletion {
  id: string;
  task_template_id: string | null;
  task_one_shot_id: string | null;
  validated_by: string;
  validated_at: string;
  photo_url: string | null;
  notes: string | null;
  service_date: string;
  is_catchup: boolean;
  validator_name?: string;
  pending_sync?: boolean;
}

interface TaskOneShot {
  id: string;
  title: string;
  description: string | null;
  target_role: TaskTargetRole;
  due_date: string;
  requires_photo: boolean;
  is_validated: boolean;
}

interface ValidateModalState {
  taskId: string;
  oneShotId?: string;
  title: string;
  requiresPhoto: boolean;
  isCatchup?: boolean;
}

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  opening: "Ouverture",
  closing: "Fermeture",
  continuous: "Au cours du service",
  custom: "Ponctuel",
};

const CATEGORY_ICON: Record<TaskCategory, React.ElementType> = {
  opening: Sunrise,
  closing: Sunset,
  continuous: Zap,
  custom: Clock,
};

const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const DEV_TEMPLATES: TaskTemplate[] = [
  { id: "t1", title: "Ouverture caisse", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 1 },
  { id: "t2", title: "Contrôle température frigos", description: "Entre 2°C et 4°C", category: "opening", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 2 },
  { id: "t3", title: "Briefing équipe", description: null, category: "opening", target_role: "manager", frequency: "daily", requires_photo: false, is_critical: false, display_order: 3 },
  { id: "t6", title: "Fermeture caisse", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 6 },
  { id: "t9", title: "Contrôle fermeture des points sensibles", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 9 },
];

const DEV_YESTERDAY_MISSING: TaskTemplate[] = [
  { id: "t6", title: "Fermeture caisse", description: null, category: "closing", target_role: "manager", frequency: "daily", requires_photo: true, is_critical: true, display_order: 6 },
];

const DEV_ONE_SHOTS: TaskOneShot[] = [
  { id: "os1", title: "Vérifier livraison vin", description: "Commercial Durand vers 10h", target_role: "manager", due_date: new Date().toISOString().split("T")[0], requires_photo: false, is_validated: false },
];

function isWindowOpen(category: TaskCategory, hour: number): boolean {
  if (category === "opening") return hour >= 5;
  if (category === "closing") return hour >= 14;
  return true;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return "hier";
}

export default function MyTasksPage() {
  const [devRole] = useDevRole();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [yesterdayMissing, setYesterdayMissing] = useState<TaskTemplate[]>([]);
  const [oneShots, setOneShots] = useState<TaskOneShot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ValidateModalState | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalPhoto, setModalPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justValidated, setJustValidated] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  const myRole: TaskTargetRole = DEV_MODE
    ? (devRole === "employee" ? "salle" : "manager")
    : "manager";

  const load = useCallback(async () => {
    setLoading(true);
    if (DEV_MODE) {
      setTemplates(DEV_TEMPLATES.filter(t => t.target_role === myRole || t.target_role === "all"));
      setYesterdayMissing(DEV_YESTERDAY_MISSING.filter(t => t.target_role === myRole || t.target_role === "all"));
      setOneShots(DEV_ONE_SHOTS.filter(s => s.target_role === myRole || s.target_role === "all"));
      setCompletions([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id, role, job_title").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member) { setLoading(false); return; }

    const estId = member.establishment_id;
    const role = (member.role as "owner" | "manager" | "employee") === "employee" ? "salle" : "manager";

    const [{ data: tmpl }, { data: comp }, { data: yesterday }, { data: shots }] = await Promise.all([
      supabase.from("task_templates").select("*").eq("establishment_id", estId).eq("is_active", true).in("target_role", [role, "all"]).order("display_order"),
      supabase.from("task_completions").select("*").eq("establishment_id", estId).eq("service_date", today),
      supabase.from("task_templates").select("*").eq("establishment_id", estId).eq("is_active", true).in("target_role", [role, "all"]),
      supabase.from("task_one_shots").select("*").eq("establishment_id", estId).eq("due_date", today).in("target_role", [role, "all"]),
    ]);

    const completedYesterday = new Set(
      ((await supabase.from("task_completions").select("task_template_id").eq("establishment_id", estId).eq("service_date", YESTERDAY)).data ?? []).map((c: { task_template_id: string | null }) => c.task_template_id)
    );
    const missing = (yesterday ?? []).filter((t: TaskTemplate) => !completedYesterday.has(t.id));

    setTemplates((tmpl ?? []) as TaskTemplate[]);
    setCompletions((comp ?? []) as TaskCompletion[]);
    setYesterdayMissing(missing as TaskTemplate[]);
    setOneShots((shots ?? []) as TaskOneShot[]);
    setLoading(false);
  }, [today, myRole]);

  useEffect(() => { load(); }, [load]);

  function openModal(t: TaskTemplate | TaskOneShot, isCatchup = false, oneShotId?: string) {
    setModalState({
      taskId: "id" in t ? t.id : "",
      oneShotId,
      title: t.title,
      requiresPhoto: t.requires_photo,
      isCatchup,
    });
    setModalNotes("");
    setModalPhoto(null);
  }

  async function submitValidation() {
    if (!modalState) return;
    setSubmitting(true);

    const isPhoto = !!modalPhoto;
    let photoUrl: string | null = null;

    if (DEV_MODE) {
      const fakeComp: TaskCompletion = {
        id: `c-${Date.now()}`,
        task_template_id: modalState.oneShotId ? null : modalState.taskId,
        task_one_shot_id: modalState.oneShotId ?? null,
        validated_by: DEV_PROFILE_ID,
        validated_at: new Date().toISOString(),
        photo_url: null,
        notes: modalNotes || null,
        service_date: today,
        is_catchup: modalState.isCatchup ?? false,
      };
      setCompletions(prev => [...prev, fakeComp]);
      if (modalState.oneShotId) setOneShots(prev => prev.map(s => s.id === modalState.oneShotId ? { ...s, is_validated: true } : s));
      if (modalState.isCatchup) setYesterdayMissing(prev => prev.filter(t => t.id !== modalState.taskId));
      setJustValidated(prev => [...prev, modalState.taskId]);
      setTimeout(() => setJustValidated(prev => prev.filter(id => id !== modalState.taskId)), 2000);
      setModalState(null);
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: member } = await supabase.from("establishment_members").select("establishment_id").eq("profile_id", userId ?? "").eq("is_active", true).single();
    if (!member) { setSubmitting(false); return; }

    if (modalPhoto && isOnline) {
      const fileName = `${member.establishment_id}/${today}/${modalState.taskId}-${Date.now()}.${modalPhoto.name.split(".").pop()}`;
      const { data: uploadData } = await supabase.storage.from("task-photos").upload(fileName, modalPhoto);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("task-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    const compData = {
      establishment_id: member.establishment_id,
      task_template_id: modalState.oneShotId ? null : modalState.taskId,
      task_one_shot_id: modalState.oneShotId ?? null,
      validated_by: userId!,
      service_date: today,
      photo_url: photoUrl,
      notes: modalNotes || null,
      is_catchup: modalState.isCatchup ?? false,
    };

    if (!isOnline) {
      const pendingKey = `pending_tasks_${member.establishment_id}`;
      const pending = JSON.parse(localStorage.getItem(pendingKey) ?? "[]");
      localStorage.setItem(pendingKey, JSON.stringify([...pending, { ...compData, photo: modalPhoto ? await modalPhoto.text() : null }]));
    } else {
      await supabase.from("task_completions").insert(compData);
    }

    await load();
    setJustValidated(prev => [...prev, modalState.taskId]);
    setTimeout(() => setJustValidated(prev => prev.filter(id => id !== modalState.taskId)), 2000);
    setModalState(null);
    setSubmitting(false);
  }

  const completionMap = new Map(completions.map(c => [c.task_template_id ?? c.task_one_shot_id, c]));
  const pendingSync = completions.filter(c => c.pending_sync).length;

  const getTasksForCategory = (cat: TaskCategory) =>
    templates.filter(t => t.category === cat && isWindowOpen(t.category, currentHour));

  const allTasks = templates.filter(t => isWindowOpen(t.category, currentHour));
  const allDone = allTasks.length > 0 && allTasks.every(t => completionMap.has(t.id)) && oneShots.every(s => s.is_validated);

  return (
    <div className="px-4 py-6 pb-32 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <MonoLabel size="xs">Mes tâches</MonoLabel>
        {pendingSync > 0 && (
          <div className="flex items-center gap-1.5" style={{ color: "#F59E0B" }}>
            <WifiOff size={12} />
            <span className="text-[11px]">{pendingSync} en attente de synchro</span>
          </div>
        )}
        {!isOnline && pendingSync === 0 && (
          <div className="flex items-center gap-1.5" style={{ color: "var(--foreground-dim)" }}>
            <WifiOff size={12} />
            <span className="text-[11px]">Hors ligne</span>
          </div>
        )}
      </div>

      {allDone && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
          <p className="text-[13px]" style={{ color: "var(--success)" }}>Toutes les tâches du jour sont faites. Bravo l'équipe.</p>
        </div>
      )}

      {/* Tâches à rattraper */}
      {yesterdayMissing.length > 0 && (
        <div
          className="rounded-xl mb-5 overflow-hidden animate-in slide-in-from-top-2 duration-400"
          style={{ border: "1px solid rgba(6,182,212,0.25)", boxShadow: "0 0 16px rgba(6,182,212,0.06)" }}
        >
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(6,182,212,0.06)" }}>
            <RefreshCw size={13} style={{ color: "var(--accent)" }} />
            <span className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>Tâches à rattraper · hier</span>
          </div>
          <div className="divide-y" style={{ borderTop: "1px solid rgba(6,182,212,0.15)" }}>
            {yesterdayMissing.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--background)" }}>
                <Circle size={16} style={{ color: "rgba(6,182,212,0.5)", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{task.title}</p>
                  {task.description && <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{task.description}</p>}
                </div>
                <button
                  onClick={() => openModal(task, true)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-base text-[12px] font-medium"
                  style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}
                >
                  Rattraper
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(["opening", "continuous", "closing"] as TaskCategory[]).map(cat => {
            const tasks = getTasksForCategory(cat);
            if (tasks.length === 0) return null;
            const CatIcon = CATEGORY_ICON[cat];

            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <CatIcon size={12} style={{ color: "var(--foreground-dim)" }} />
                  <MonoLabel size="xs">{CATEGORY_LABEL[cat]}</MonoLabel>
                </div>
                <div className="space-y-1.5">
                  {tasks.map(task => {
                    const comp = completionMap.get(task.id);
                    const isDone = !!comp;
                    const justDone = justValidated.includes(task.id);

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                        style={{
                          background: isDone ? "rgba(16,185,129,0.06)" : "var(--background-elev)",
                          border: justDone ? "1px solid rgba(16,185,129,0.4)" : isDone ? "1px solid rgba(16,185,129,0.15)" : "1px solid var(--border)",
                          boxShadow: justDone ? "0 0 12px rgba(16,185,129,0.15)" : "none",
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
                        ) : (
                          <Circle size={18} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-[13px] font-medium"
                              style={{
                                color: isDone ? "var(--foreground-muted)" : "var(--foreground)",
                                textDecoration: isDone ? "line-through" : "none",
                              }}
                            >
                              {task.title}
                            </span>
                            {task.is_critical && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
                              >
                                <AlertTriangle size={8} />
                                HACCP
                              </span>
                            )}
                            {task.requires_photo && !isDone && (
                              <Camera size={12} style={{ color: "var(--foreground-dim)" }} />
                            )}
                          </div>
                          {isDone && comp && (
                            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                              Validé {relTime(comp.validated_at)}
                              {comp.is_catchup && " · rattrapage"}
                              {comp.pending_sync && " · synchro en attente"}
                            </p>
                          )}
                        </div>
                        {!isDone && (
                          <button
                            onClick={() => openModal(task)}
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
            );
          })}

          {/* Tâches ponctuelles */}
          {oneShots.filter(s => !s.is_validated).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} style={{ color: "var(--foreground-dim)" }} />
                <MonoLabel size="xs">Ponctuelles</MonoLabel>
              </div>
              <div className="space-y-1.5">
                {oneShots.filter(s => !s.is_validated).map(shot => (
                  <div
                    key={shot.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
                  >
                    <Circle size={18} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{shot.title}</p>
                      {shot.description && (
                        <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{shot.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => openModal(shot, false, shot.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-base text-[12px] font-medium"
                      style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}
                    >
                      Valider
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allTasks.length === 0 && oneShots.length === 0 && (
            <EmptyState message="Aucune tâche pour le moment." sub="Profite-en." />
          )}
        </div>
      )}

      {/* Modal de validation */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {modalState.isCatchup ? "Rattrapage" : "Valider"}
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{modalState.title}</p>
              </div>
              <button onClick={() => setModalState(null)} style={{ color: "var(--foreground-dim)" }}>
                <X size={18} />
              </button>
            </div>

            {modalState.requiresPhoto && (
              <div className="mb-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[13px] font-medium transition-colors"
                  style={{
                    background: modalPhoto ? "rgba(16,185,129,0.08)" : "var(--background)",
                    border: modalPhoto ? "1px solid rgba(16,185,129,0.3)" : "2px dashed var(--border-strong)",
                    color: modalPhoto ? "var(--success)" : "var(--foreground-dim)",
                  }}
                >
                  {modalPhoto ? (
                    <>
                      <CheckCircle2 size={14} />
                      {modalPhoto.name}
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      Ajouter une photo
                    </>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setModalPhoto(e.target.files?.[0] ?? null)} />
                {!isOnline && (
                  <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "#F59E0B" }}>
                    <WifiOff size={10} />
                    Photo synchronisée dès la reconnexion
                  </p>
                )}
              </div>
            )}

            <input
              type="text"
              placeholder="Notes (optionnel)"
              value={modalNotes}
              onChange={e => setModalNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-base text-[13px] outline-none mb-4"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setModalState(null)}
                className="flex-1 py-2.5 rounded-base text-[13px] font-medium"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}
              >
                Annuler
              </button>
              <button
                onClick={submitValidation}
                disabled={submitting || (modalState.requiresPhoto && !modalPhoto && isOnline)}
                className="flex-1 py-2.5 rounded-base text-[13px] font-semibold transition-colors"
                style={{
                  background: "var(--success)",
                  color: "#09090B",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Validation…" : "Tâche validée"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
