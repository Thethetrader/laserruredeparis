"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { X, Check } from "lucide-react";

const DEV_MODE = false;

export type ItemCategory = "plat" | "boisson" | "service" | "ambiance" | "autre";
export type Tonality = "positive" | "negative";
type ModalStep = "form" | "checking" | "suggestion";
type OldCategory = "compliment" | "complaint" | "suggestion" | "incident";

export interface FeedbackView {
  id: string;
  reported_by: string | null;
  reporter_name: string;
  reporter_first: string;
  reporter_last: string;
  reporter_avatar: string | null;
  item_cat: ItemCategory;
  tonality: Tonality;
  item: string;
  content: string;
  table_number: string | null;
  echo_count: number;
  is_echoed: boolean;
  is_mine: boolean;
  created_at: string;
}

export interface SimilarMatch {
  feedback_id: string;
  confidence: "high" | "medium";
  reason: string;
  reporter_name: string;
  reporter_first: string;
  reporter_last: string;
  reporter_avatar: string | null;
  item: string;
  content: string;
  echo_count: number;
  created_at: string;
}

export const ITEM_CATS: { key: ItemCategory; label: string; icon: string }[] = [
  { key: "plat",     label: "Plat",     icon: "🍽" },
  { key: "boisson",  label: "Boisson",  icon: "🥤" },
  { key: "service",  label: "Service",  icon: "👋" },
  { key: "ambiance", label: "Ambiance", icon: "🎵" },
  { key: "autre",    label: "Autre",    icon: "···" },
];

export function toDBCategory(cat: ItemCategory, ton: Tonality): OldCategory {
  if (ton === "positive") return "compliment";
  if (cat === "ambiance") return "incident";
  return "complaint";
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return "à l'instant";
  if (mins < 60)  return `il y a ${mins}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return `hier à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (days < 7)   return d.toLocaleDateString("fr-FR", { weekday: "long" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface Props {
  establishmentId: string;
  profileId: string;
  onClose: () => void;
  onAdded?: (f: FeedbackView, msg?: string) => void;
  onEchoExisting?: (feedbackId: string, reporterName: string) => void;
  onSuccess?: () => void;
}

export function NewFeedbackModal({ establishmentId, profileId, onClose, onAdded, onEchoExisting, onSuccess }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<ModalStep>("form");
  const [cat, setCat] = useState<ItemCategory>("plat");
  const [ton, setTon] = useState<Tonality | null>(null);
  const [item, setItem] = useState("");
  const [content, setContent] = useState("");
  const [table, setTable] = useState("");
  const [matches, setMatches] = useState<SimilarMatch[]>([]);

  const canSubmit = item.trim().length > 0 && content.trim().length > 0 && ton !== null;

  const buildNewFeedback = (): FeedbackView => ({
    id: `f-${Date.now()}`,
    reported_by: profileId,
    reporter_name: "Moi", reporter_first: "", reporter_last: "", reporter_avatar: null,
    item_cat: cat, tonality: ton!,
    item: item.trim(), content: content.trim(),
    table_number: table.trim() || null,
    echo_count: 0, is_echoed: false, is_mine: true,
    created_at: new Date().toISOString(),
  });

  const publishDirectly = async (fb: FeedbackView) => {
    if (!DEV_MODE) {
      const storedContent = `${fb.item} · ${fb.content}`;
      const { data } = await supabase.from("customer_feedback").insert({
        establishment_id: establishmentId,
        reported_by: profileId,
        category: toDBCategory(fb.item_cat, fb.tonality),
        content: storedContent,
        table_number: fb.table_number,
      }).select().single();
      if (data) fb.id = (data as { id: string }).id;
    }
    if (onAdded) onAdded(fb);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handlePublish = async () => {
    if (!canSubmit || !ton) return;
    setStep("checking");

    if (DEV_MODE) {
      await new Promise(r => setTimeout(r, 1200));
      const itemLower = item.toLowerCase();
      if (itemLower.includes("tarte") || itemLower.includes("sucr")) {
        setMatches([{
          feedback_id: "f1", confidence: "high",
          reason: "Même item (Tarte tatin) avec une critique similaire sur le sucre",
          reporter_name: "Rayan Dupont", reporter_first: "Rayan", reporter_last: "Dupont", reporter_avatar: null,
          item: "Tarte tatin", content: "trop sucrée, le client a pas fini son assiette",
          echo_count: 3, created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        }]);
        setStep("suggestion");
      } else {
        publishDirectly(buildNewFeedback());
      }
      return;
    }

    try {
      const res = await fetch("/api/feedback/check-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat, item: item.trim(), content: content.trim(),
          tonality: ton, establishment_id: establishmentId,
        }),
      });
      const data = await res.json();
      if (data.similar_found && data.matches?.length > 0) {
        setMatches(data.matches);
        setStep("suggestion");
      } else {
        publishDirectly(buildNewFeedback());
      }
    } catch {
      publishDirectly(buildNewFeedback());
    }
  };

  const handleEchoExisting = (match: SimilarMatch) => {
    if (onEchoExisting) onEchoExisting(match.feedback_id, match.reporter_name);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && step !== "checking") onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>

        {(step === "form" || step === "checking") && (
          <>
            <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nouveau retour client</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Note ce qu'un client vient de dire. Garde ça court.</p>
              </div>
              <button onClick={onClose} className="ml-3 flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ITEM_CATS.map(opt => (
                    <button key={opt.key} onClick={() => setCat(opt.key)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-[0.96]"
                      style={cat === opt.key
                        ? { background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.35)" }
                        : { background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                      <span className="text-base leading-none">{opt.icon}</span>
                      <span className="text-[10px] font-medium" style={{ color: cat === opt.key ? "var(--accent)" : "var(--foreground-dim)" }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
                  Tonalité <span className="font-sans normal-case tracking-normal text-[10px]" style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTon("negative")}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={ton === "negative"
                      ? { background: "rgba(245,158,11,0.12)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.35)" }
                      : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                    ▼ Négatif
                  </button>
                  <button onClick={() => setTon("positive")}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={ton === "positive"
                      ? { background: "rgba(16,185,129,0.12)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.35)" }
                      : { background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
                    ▲ Positif
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Item concerné <span className="font-sans normal-case tracking-normal" style={{ fontWeight: 400 }}>(max 60)</span>
                </label>
                <div className="relative">
                  <input value={item} onChange={e => setItem(e.target.value.slice(0, 60))}
                    placeholder="Ex: Tarte tatin, Vin blanc, Accueil…"
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none" style={{ color: "var(--foreground-dim)" }}>{item.length}/60</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Ce qu'a dit le client <span className="font-sans normal-case tracking-normal" style={{ fontWeight: 400 }}>(max 120)</span>
                </label>
                <div className="relative">
                  <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 120))}
                    placeholder="Ex: trop sucrée"
                    rows={2}
                    className="w-full px-3 py-2 pb-5 text-sm rounded-lg outline-none resize-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                  <span className="absolute right-3 bottom-2 text-[10px] font-mono pointer-events-none" style={{ color: "var(--foreground-dim)" }}>{content.length}/120</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                  Table <span className="font-sans normal-case tracking-normal" style={{ fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input value={table} onChange={e => setTable(e.target.value)} placeholder="Ex: 12"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-3 text-sm font-medium rounded-xl"
                  style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                  Annuler
                </button>
                <button onClick={handlePublish} disabled={!canSubmit || step === "checking"}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl transition-opacity flex items-center justify-center gap-2"
                  style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (!canSubmit || step === "checking") ? 0.6 : 1 }}>
                  {step === "checking" ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Vérification…
                    </>
                  ) : "Publier"}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "suggestion" && (
          <>
            <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                On a trouvé un retour très proche.
              </p>
              <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>
                C'est ce que tu voulais dire ?
              </p>
            </div>

            <div className="p-4 space-y-3">
              {matches.map(m => (
                <div key={m.feedback_id} className="rounded-xl overflow-hidden"
                  style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <KarafAvatar firstName={m.reporter_first} lastName={m.reporter_last} avatarUrl={m.reporter_avatar} size={24} />
                      <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{m.reporter_name}</span>
                      <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>· {formatRelativeTime(m.created_at)}</span>
                    </div>
                    {m.item && (
                      <p className="text-[14px] font-medium mb-0.5" style={{ color: "var(--foreground)" }}>{m.item}</p>
                    )}
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>
                      « {m.content} »
                    </p>
                    {m.echo_count > 0 && (
                      <p className="text-[11px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
                        {m.echo_count} collègue{m.echo_count > 1 ? "s" : ""} ont entendu pareil
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleEchoExisting(m)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all"
                    style={{ background: "rgba(6,182,212,0.08)", color: "var(--accent)", borderTop: "1px solid var(--border)" }}>
                    <Check size={14} /> Oui, c'est ça — +1
                  </button>
                </div>
              ))}

              <button onClick={() => publishDirectly(buildNewFeedback())}
                className="w-full py-3 text-sm font-medium rounded-xl transition-all"
                style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                Non, c'est différent — Publier mon retour
              </button>

              <button onClick={() => setStep("form")}
                className="w-full py-2 text-[13px]"
                style={{ color: "var(--foreground-dim)" }}>
                ← Modifier mon retour
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
