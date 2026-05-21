"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { Plus, MessageSquare, ThumbsUp } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type FeedbackCategory = "compliment" | "complaint" | "suggestion" | "incident";
type FeedbackStatus = "open" | "in_progress" | "resolved";

interface Feedback {
  id: string;
  establishment_id: string;
  reported_by: string | null;
  category: FeedbackCategory;
  content: string;
  table_number: string | null;
  status: FeedbackStatus;
  created_at: string;
  confirmation_count: number;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  compliment: "Compliment",
  complaint: "Réclamation",
  suggestion: "Suggestion",
  incident: "Incident",
};

const CATEGORY_STYLE: Record<FeedbackCategory, { bg: string; color: string; border: string }> = {
  compliment: { bg: "rgba(16,185,129,0.1)",  color: "#10B981",         border: "rgba(16,185,129,0.25)" },
  complaint:  { bg: "rgba(239,68,68,0.1)",   color: "var(--danger)",   border: "rgba(239,68,68,0.25)" },
  suggestion: { bg: "rgba(6,182,212,0.1)",   color: "var(--accent)",   border: "rgba(6,182,212,0.25)" },
  incident:   { bg: "rgba(245,158,11,0.1)",  color: "var(--warning)",  border: "rgba(245,158,11,0.25)" },
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const STATUS_STYLE: Record<FeedbackStatus, { color: string }> = {
  open: { color: "var(--warning)" },
  in_progress: { color: "var(--accent)" },
  resolved: { color: "var(--success)" },
};

const DEV_FEEDBACK: Feedback[] = [
  { id: "f1", establishment_id: DEV_ESTABLISHMENT_ID, reported_by: DEV_PROFILE_ID, category: "compliment", content: "Le client de la table 5 a adoré le risotto aux champignons. Il a demandé à féliciter le chef.", table_number: "5", status: "resolved", created_at: new Date(Date.now() - 86400000).toISOString(), confirmation_count: 2 },
  { id: "f2", establishment_id: DEV_ESTABLISHMENT_ID, reported_by: DEV_PROFILE_ID, category: "complaint",  content: "Attente trop longue table 12 a attendu 45 minutes pour les entrées. Le groupe était mécontent.", table_number: "12", status: "in_progress", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), confirmation_count: 3 },
  { id: "f3", establishment_id: DEV_ESTABLISHMENT_ID, reported_by: "profile-2",    category: "suggestion", content: "Un client suggère d'ajouter des options végétaliennes au menu plusieurs personnes de son groupe étaient déçues.", table_number: null, status: "open", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), confirmation_count: 1 },
  { id: "f4", establishment_id: DEV_ESTABLISHMENT_ID, reported_by: "profile-2",    category: "incident",   content: "Verre cassé en salle, client légèrement blessé pris en charge immédiatement.", table_number: "8", status: "open", created_at: new Date(Date.now() - 4 * 86400000).toISOString(), confirmation_count: 4 },
  { id: "f5", establishment_id: DEV_ESTABLISHMENT_ID, reported_by: "profile-3",    category: "compliment", content: "Service excellent ce soir, accueil très chaleureux selon le client. Il reviendra.", table_number: null, status: "resolved", created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(), confirmation_count: 1 },
];

export default function CustomerFeedbackPage() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [devRole] = useDevRole();
  const [role, setRole] = useState<string>("employee");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [profileId, setProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set(["f2"]));
  const [confirmCounts, setConfirmCounts] = useState<Record<string, number>>({});
  const [filterCat, setFilterCat] = useState<FeedbackCategory | "all">("all");

  const [formCategory, setFormCategory] = useState<FeedbackCategory>("compliment");
  const [formContent, setFormContent] = useState("");
  const [formTable, setFormTable] = useState("");

  useEffect(() => {
    if (DEV_MODE) {
      setRole(devRole);
      setFeedbacks(DEV_FEEDBACK);
      setConfirmCounts(Object.fromEntries(DEV_FEEDBACK.map(f => [f.id, f.confirmation_count])));
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProfileId(user.id);

    const { data: memberData } = await supabase
      .from("establishment_members").select("role, establishment_id")
      .eq("profile_id", user.id).eq("is_active", true).single();

    if (!memberData) { setLoading(false); return; }

    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);

    const [feedbackRes, confirmedRes] = await Promise.all([
      supabase.from("customer_feedback").select("*").eq("establishment_id", memberData.establishment_id).order("created_at", { ascending: false }),
      supabase.from("feedback_confirmations").select("feedback_id").eq("profile_id", user.id),
    ]);

    const rawFeedback = (feedbackRes.data ?? []) as Feedback[];
    setFeedbacks(rawFeedback.map(f => ({ ...f, confirmation_count: 0 })));
    setConfirmCounts(Object.fromEntries(rawFeedback.map(f => [f.id, 0])));

    const myConfirmed = new Set((confirmedRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id));
    setConfirmedIds(myConfirmed);
    setLoading(false);
  }

  const isManager = role === "owner" || role === "manager";

  const stats = {
    total: feedbacks.length,
    open: feedbacks.filter(f => f.status === "open").length,
    resolved: feedbacks.filter(f => f.status === "resolved").length,
  };

  const submitFeedback = async () => {
    if (!formContent.trim()) return;
    setSubmitting(true);

    if (DEV_MODE) {
      const newF: Feedback = {
        id: `f-${Date.now()}`,
        establishment_id: DEV_ESTABLISHMENT_ID,
        reported_by: DEV_PROFILE_ID,
        category: formCategory,
        content: formContent,
        table_number: formTable || null,
        status: "open",
        created_at: new Date().toISOString(),
        confirmation_count: 0,
      };
      setFeedbacks(prev => [newF, ...prev]);
      setConfirmCounts(prev => ({ ...prev, [newF.id]: 0 }));
      resetForm();
      setSubmitting(false);
      return;
    }

    const { data } = await supabase.from("customer_feedback").insert({
      establishment_id: establishmentId,
      reported_by: profileId,
      category: formCategory,
      content: formContent,
      table_number: formTable || null,
    }).select().single();

    if (data) {
      const newF = { ...data, confirmation_count: 0 } as Feedback;
      setFeedbacks(prev => [newF, ...prev]);
      setConfirmCounts(prev => ({ ...prev, [newF.id]: 0 }));
    }
    resetForm();
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    if (DEV_MODE) { setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f)); return; }
    await supabase.from("customer_feedback").update({ status }).eq("id", id);
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const toggleConfirm = async (feedbackId: string) => {
    const isConfirmed = confirmedIds.has(feedbackId);
    const delta = isConfirmed ? -1 : 1;
    setConfirmedIds(prev => { const next = new Set(prev); if (isConfirmed) next.delete(feedbackId); else next.add(feedbackId); return next; });
    setConfirmCounts(prev => ({ ...prev, [feedbackId]: Math.max(0, (prev[feedbackId] ?? 0) + delta) }));
    if (!DEV_MODE) {
      if (isConfirmed) {
        await supabase.from("feedback_confirmations").delete().eq("profile_id", profileId).eq("feedback_id", feedbackId);
      } else {
        await (supabase.from("feedback_confirmations") as unknown as { upsert: (v: object) => Promise<unknown> }).upsert({ profile_id: profileId, feedback_id: feedbackId });
      }
    }
  };

  const resetForm = () => { setFormCategory("compliment"); setFormContent(""); setFormTable(""); setShowForm(false); };

  const displayedFeedbacks = filterCat === "all" ? feedbacks : feedbacks.filter(f => f.category === filterCat);

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: "var(--background-elev)" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Retours clients</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Retours clients</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>{feedbacks.length} avis au total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-opacity"
          style={{ background: "var(--accent)", color: "#09090B" }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Stats manager only */}
      {isManager && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "var(--foreground)" },
            { label: "Ouverts", value: stats.open, color: "var(--warning)" },
            { label: "Résolus", value: stats.resolved, color: "var(--success)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
              <p className="text-[11px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--foreground-dim)" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "compliment", "complaint", "suggestion", "incident"] as const).map(cat => {
          const active = filterCat === cat;
          const meta = cat !== "all" ? CATEGORY_STYLE[cat] : null;
          const count = cat === "all" ? feedbacks.length : feedbacks.filter(f => f.category === cat).length;
          return (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={active && meta
                ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }
                : active
                ? { background: "var(--background-elev)", color: "var(--foreground)", border: "1px solid var(--border)" }
                : { background: "transparent", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
              {cat === "all" ? "Tous" : CATEGORY_LABELS[cat]}
              <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>Nouveau retour client</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
              <select value={formCategory} onChange={e => setFormCategory(e.target.value as FeedbackCategory)}
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description</label>
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)}
                placeholder="Décrivez le retour client..." rows={3}
                className="w-full px-3 py-2 text-sm rounded-md outline-none resize-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Numéro de table <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
              <input value={formTable} onChange={e => setFormTable(e.target.value)} placeholder="Ex: 12"
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={submitFeedback} disabled={submitting || !formContent.trim()}
                className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
                style={{ background: "var(--accent)", color: "#09090B", opacity: (submitting || !formContent.trim()) ? 0.5 : 1 }}>
                {submitting ? "Envoi…" : "Soumettre"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 text-sm rounded-md"
                style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {displayedFeedbacks.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <MessageSquare size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun retour dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedFeedbacks.map(feedback => {
            const catStyle = CATEGORY_STYLE[feedback.category];
            const stStyle = STATUS_STYLE[feedback.status];
            const confirmed = confirmedIds.has(feedback.id);
            const count = confirmCounts[feedback.id] ?? 0;
            const isMyFeedback = feedback.reported_by === profileId;

            return (
              <div key={feedback.id} className="rounded-xl overflow-hidden"
                style={{ background: "var(--background-elev)", border: `1px solid ${confirmed ? catStyle.border : "var(--border)"}` }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                          {CATEGORY_LABELS[feedback.category]}
                        </span>
                        {feedback.table_number && (
                          <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>Table {feedback.table_number}</span>
                        )}
                        {isMyFeedback && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA" }}>
                            Toi
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{feedback.content}</p>
                      <p className="text-[11px] mt-2" style={{ color: "var(--foreground-dim)" }}>
                        {new Date(feedback.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isManager ? (
                        <select value={feedback.status} onChange={e => updateStatus(feedback.id, e.target.value as FeedbackStatus)}
                          className="text-[11px] font-mono px-2 py-1 rounded-md outline-none cursor-pointer"
                          style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: stStyle.color }}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k} style={{ color: "var(--foreground)" }}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded"
                          style={{ color: stStyle.color }}>
                          {STATUS_LABELS[feedback.status]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirm button employee only, not for own feedback */}
                {!isManager && !isMyFeedback && (
                  <div className="px-5 pb-4">
                    <button onClick={() => toggleConfirm(feedback.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: confirmed ? catStyle.bg : "var(--background-soft)",
                        color: confirmed ? catStyle.color : "var(--foreground-dim)",
                        border: `1px solid ${confirmed ? catStyle.border : "var(--border)"}`,
                      }}>
                      <ThumbsUp size={12} fill={confirmed ? "currentColor" : "none"} />
                      {confirmed ? "Tu as eu ce retour" : "Moi aussi j'ai eu ce retour"}
                      {count > 0 && <span className="ml-1 opacity-70">· {count}</span>}
                    </button>
                  </div>
                )}

                {/* Manager sees confirmation count */}
                {isManager && count > 0 && (
                  <div className="px-5 pb-4 flex items-center gap-1.5">
                    <ThumbsUp size={11} style={{ color: "var(--foreground-dim)" }} />
                    <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                      {count} membre{count > 1 ? "s" : ""} ont eu le même retour
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
