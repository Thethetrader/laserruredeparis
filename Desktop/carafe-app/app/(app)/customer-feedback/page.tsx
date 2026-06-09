"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { Plus, X, RotateCcw, MoreHorizontal, Trash2, Eye, EyeOff, BarChart2, ChevronDown, Sparkles, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";

const DEV_MODE = false;
const DEV_PROFILE_ID = "dev-user";
const DEV_ESTABLISHMENT_ID = "dev-establishment";

type ItemCategory = "plat" | "boisson" | "service" | "ambiance" | "autre";
type Tonality = "positive" | "negative";
type OldCategory = "compliment" | "complaint" | "suggestion" | "incident";
type FilterKey = ItemCategory | "positive" | "negative" | "mine" | "echoed";

interface FeedbackView {
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

const ITEM_CATS: { key: ItemCategory; label: string; icon: string }[] = [
  { key: "plat",     label: "Plat",     icon: "🍽" },
  { key: "boisson",  label: "Boisson",  icon: "🥤" },
  { key: "service",  label: "Service",  icon: "👋" },
  { key: "ambiance", label: "Ambiance", icon: "🎵" },
  { key: "autre",    label: "Autre",    icon: "···" },
];

const CAT_LABELS: Record<ItemCategory, string> = {
  plat: "PLAT", boisson: "BOISSON", service: "SERVICE", ambiance: "AMBIANCE", autre: "AUTRE",
};

function toDBCategory(cat: ItemCategory, ton: Tonality): OldCategory {
  if (ton === "positive") return "compliment";
  if (cat === "ambiance") return "incident";
  return "complaint";
}

function fromDBCategory(cat: OldCategory): { item_cat: ItemCategory; tonality: Tonality } {
  if (cat === "compliment") return { item_cat: "service", tonality: "positive" };
  if (cat === "complaint")  return { item_cat: "service", tonality: "negative" };
  if (cat === "incident")   return { item_cat: "ambiance", tonality: "negative" };
  return { item_cat: "autre", tonality: "positive" };
}

function parseContent(raw: string): { item: string; content: string } {
  const sep = raw.indexOf(" · ");
  if (sep > 0) return { item: raw.slice(0, sep), content: raw.slice(sep + 3) };
  return { item: "", content: raw };
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

const DEV_FEEDBACKS: FeedbackView[] = [
  {
    id: "f1", reported_by: "profile-3",
    reporter_name: "Rayan Dupont", reporter_first: "Rayan", reporter_last: "Dupont", reporter_avatar: null,
    item_cat: "plat", tonality: "negative", item: "Tarte tatin",
    content: "trop sucrée, le client a pas fini son assiette",
    table_number: "5", echo_count: 3, is_echoed: false, is_mine: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "f2", reported_by: "profile-2",
    reporter_name: "Yasmine Benali", reporter_first: "Yasmine", reporter_last: "Benali", reporter_avatar: null,
    item_cat: "service", tonality: "positive", item: "Accueil soir",
    content: "la table 8 a trouvé l'accueil super chaleureux, ont demandé notre prénom",
    table_number: "8", echo_count: 1, is_echoed: true, is_mine: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "f3", reported_by: DEV_PROFILE_ID,
    reporter_name: "Dev Mode", reporter_first: "Dev", reporter_last: "Mode", reporter_avatar: null,
    item_cat: "boisson", tonality: "negative", item: "Vin blanc maison",
    content: "trop froid selon le client, a demandé à le réchauffer",
    table_number: "12", echo_count: 0, is_echoed: false, is_mine: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "f4", reported_by: "profile-2",
    reporter_name: "Yasmine Benali", reporter_first: "Yasmine", reporter_last: "Benali", reporter_avatar: null,
    item_cat: "ambiance", tonality: "negative", item: "Bruit en salle",
    content: "table 3 s'est plainte du bruit venant de la cuisine",
    table_number: "3", echo_count: 2, is_echoed: false, is_mine: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "f5", reported_by: "profile-3",
    reporter_name: "Rayan Dupont", reporter_first: "Rayan", reporter_last: "Dupont", reporter_avatar: null,
    item_cat: "plat", tonality: "positive", item: "Risotto champignons",
    content: "excellent, table 7 a demandé à féliciter le chef",
    table_number: "7", echo_count: 1, is_echoed: false, is_mine: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

type MonthFilter = "all" | "week" | "month" | "lastmonth";

const MONTH_LABELS: Record<MonthFilter, string> = {
  all: "Tous",
  week: "Cette semaine",
  month: "Ce mois",
  lastmonth: "Mois dernier",
};

export default function CustomerFeedbackPage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [feedbacks, setFeedbacks] = useState<FeedbackView[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState(DEV_MODE ? DEV_PROFILE_ID : "");
  const [establishmentId, setEstablishmentId] = useState(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("week");
  const [showSummary, setShowSummary] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [summaryPopup, setSummaryPopup] = useState<{ cat: string | null; tonality: "positive" | "negative" } | null>(null);
  const [userRole, setUserRole] = useState<string>("employee");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    tendance: string;
    tableau: Array<{ item: string; categorie: string; sentiment: string; resume: string; echos: number }>;
    actions: string[];
  } | null>(null);

  useEffect(() => {
    if (DEV_MODE) {
      setUserRole(devRole);
      setFeedbacks(DEV_FEEDBACKS);
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole, monthFilter]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProfileId(user.id);

    const _ceid = (typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null)?.[1];
    const _re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let _mq = supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true);
    if (_ceid && _re.test(_ceid)) _mq = _mq.eq("establishment_id", _ceid);
    let { data: memberData } = await _mq.limit(1).maybeSingle();
    if (!memberData && _ceid && _re.test(_ceid)) ({ data: memberData } = await supabase.from("establishment_members").select("role, establishment_id").eq("profile_id", user.id).eq("is_active", true).limit(1).maybeSingle());

    if (!memberData) { setLoading(false); return; }
    setEstablishmentId(memberData.establishment_id);
    setUserRole(memberData.role);

    const now = new Date();
    let rangeStart: string | null = null;
    let rangeEnd: string | null = null;
    if (monthFilter === "week") {
      rangeStart = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (monthFilter === "month") {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (monthFilter === "lastmonth") {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    const [feedbackRes, confirmedRes, membersRes] = await Promise.all([
      (() => {
        let q = supabase.from("customer_feedback").select("*")
          .eq("establishment_id", memberData.establishment_id)
          .order("created_at", { ascending: false });
        if (rangeStart) q = q.gte("created_at", rangeStart);
        if (rangeEnd) q = q.lt("created_at", rangeEnd);
        return q;
      })(),
      supabase.from("feedback_confirmations").select("feedback_id").eq("profile_id", user.id),
      supabase.from("establishment_members")
        .select("profile_id, profiles(first_name, last_name, avatar_url)")
        .eq("establishment_id", memberData.establishment_id),
    ]);

    const rawFeedback = (feedbackRes.data ?? []) as Array<{
      id: string; reported_by: string | null; category: OldCategory;
      content: string; table_number: string | null; created_at: string;
    }>;
    const confirmedSet = new Set((confirmedRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id));

    type MemberRow = { profile_id: string; profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null };
    const profileMap: Record<string, { first: string; last: string; avatar: string | null }> = {};
    (membersRes.data ?? [] as MemberRow[]).forEach((m: MemberRow) => {
      if (m.profiles) profileMap[m.profile_id] = { first: m.profiles.first_name ?? "", last: m.profiles.last_name ?? "", avatar: m.profiles.avatar_url };
    });

    const allFeedbackIds = rawFeedback.map(f => f.id);
    const echoCounts: Record<string, number> = {};
    if (allFeedbackIds.length > 0) {
      const echoRes = await supabase.from("feedback_confirmations").select("feedback_id").in("feedback_id", allFeedbackIds);
      (echoRes.data ?? []).forEach((r: { feedback_id: string }) => {
        echoCounts[r.feedback_id] = (echoCounts[r.feedback_id] ?? 0) + 1;
      });
    }

    const views: FeedbackView[] = rawFeedback.map(f => {
      const { item_cat, tonality } = fromDBCategory(f.category);
      const { item, content } = parseContent(f.content);
      const profile = f.reported_by ? profileMap[f.reported_by] : null;
      const firstName = profile?.first ?? "";
      const lastName = profile?.last ?? "";
      return {
        id: f.id, reported_by: f.reported_by,
        reporter_name: `${firstName} ${lastName}`.trim() || "Anonyme",
        reporter_first: firstName, reporter_last: lastName, reporter_avatar: profile?.avatar ?? null,
        item_cat, tonality,
        item: item || content.slice(0, 40),
        content: item ? content : f.content,
        table_number: f.table_number,
        echo_count: echoCounts[f.id] ?? 0,
        is_echoed: confirmedSet.has(f.id),
        is_mine: f.reported_by === user.id,
        created_at: f.created_at,
      };
    });

    const allIds = views.map(f => f.id);
    if (allIds.length > 0) {
      const [readsRes, dismissalsRes] = await Promise.all([
        supabase.from("feedback_reads").select("feedback_id").eq("profile_id", user.id).in("feedback_id", allIds),
        supabase.from("feedback_dismissals").select("feedback_id").eq("profile_id", user.id).in("feedback_id", allIds),
      ]);
      setReadIds(new Set((readsRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id)));
      setDismissedIds(new Set((dismissalsRes.data ?? []).map((r: { feedback_id: string }) => r.feedback_id)));
    }

    setFeedbacks(views);
    setLoading(false);
  }

  const isManager = userRole === "owner" || userRole === "manager";

  const handleAnalyze = async () => {
    if (feedbacks.length === 0) return;
    setAnalyzing(true);
    setAnalysis(null);
    setShowAnalysis(true);
    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbacks: feedbacks.map(f => ({
            item_cat: f.item_cat,
            tonality: f.tonality,
            item: f.item,
            content: f.content,
            echo_count: f.echo_count,
          })),
          period: MONTH_LABELS[monthFilter].toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.ok) setAnalysis(data.analysis);
      else setAnalysis(null);
    } catch {
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const markAsRead = async (id: string) => {
    setReadIds(prev => { const next = new Set(prev); next.add(id); return next; });
    if (!DEV_MODE && profileId) {
      await supabase.from("feedback_reads").upsert(
        { profile_id: profileId, feedback_id: id },
        { onConflict: "profile_id,feedback_id" }
      );
    }
  };

  const markAllRead = async () => {
    const ids = feedbacks.map(f => f.id);
    setReadIds(new Set(ids));
    showToast("Tous les retours marqués comme lus ✓");
    if (!DEV_MODE && profileId && ids.length > 0) {
      await supabase.from("feedback_reads").upsert(
        ids.map(id => ({ profile_id: profileId, feedback_id: id })),
        { onConflict: "profile_id,feedback_id" }
      );
    }
  };

  const unreadCount = feedbacks.filter(f => !readIds.has(f.id)).length;
  const dismissFeedback = async (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    if (!DEV_MODE && profileId) {
      await supabase.from("feedback_dismissals").upsert(
        { profile_id: profileId, feedback_id: id },
        { onConflict: "profile_id,feedback_id" }
      );
    }
  };

  const toggleEcho = async (id: string) => {
    const fb = feedbacks.find(f => f.id === id);
    if (!fb || fb.is_mine) return;
    const wasEchoed = fb.is_echoed;
    setFeedbacks(prev => prev.map(f => f.id === id
      ? { ...f, is_echoed: !wasEchoed, echo_count: wasEchoed ? Math.max(0, f.echo_count - 1) : f.echo_count + 1 }
      : f));
    if (!DEV_MODE) {
      if (wasEchoed) {
        await supabase.from("feedback_confirmations").delete().eq("profile_id", profileId).eq("feedback_id", id);
      } else {
        await (supabase.from("feedback_confirmations") as unknown as { upsert: (v: object) => Promise<unknown> })
          .upsert({ profile_id: profileId, feedback_id: id });
      }
    }
    if (!wasEchoed) showToast("Ton +1 est enregistré.");
  };

  const deleteFeedback = async (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    setDeleteTarget(null);
    if (!DEV_MODE) await supabase.from("customer_feedback").delete().eq("id", id);
  };

  const addFeedback = (fb: FeedbackView, msg?: string) => {
    setFeedbacks(prev => [fb, ...prev]);
    showToast(msg ?? "Retour publié ✓");
  };

  const echoExisting = async (feedbackId: string, reporterName: string) => {
    setFeedbacks(prev => prev.map(f => f.id === feedbackId
      ? { ...f, is_echoed: true, echo_count: f.echo_count + 1 }
      : f));
    if (!DEV_MODE) {
      await (supabase.from("feedback_confirmations") as unknown as { upsert: (v: object) => Promise<unknown> })
        .upsert({ profile_id: profileId, feedback_id: feedbackId });
    }
    showToast(`Ton +1 est enregistré sur le retour de ${reporterName.split(" ")[0]}.`);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const catFilters = [...activeFilters].filter(f => ITEM_CATS.some(c => c.key === f)) as ItemCategory[];
  const tonFilters = [...activeFilters].filter(f => f === "positive" || f === "negative") as Tonality[];
  const showMine = activeFilters.has("mine");
  const showEchoed = activeFilters.has("echoed");

  const filtered = feedbacks.filter(f => {
    if (catFilters.length > 0 && !catFilters.includes(f.item_cat)) return false;
    if (tonFilters.length > 0 && !tonFilters.includes(f.tonality)) return false;
    if (showMine && !f.is_mine) return false;
    if (showEchoed && !f.is_echoed) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aHot = a.echo_count >= 3 ? 1 : 0;
    const bHot = b.echo_count >= 3 ? 1 : 0;
    if (aHot !== bHot) return bHot - aHot;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-40 animate-pulse" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <MonoLabel size="xs" className="mb-2 block">Retour client</MonoLabel>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Retour client</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>{feedbacks.length} retour{feedbacks.length !== 1 ? "s" : ""} · {MONTH_LABELS[monthFilter].toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isManager && feedbacks.length > 0 && (
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80"
              style={{ background: "var(--background-elev)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              <Sparkles size={14} style={{ color: "var(--accent)" }} /> Analyser
            </button>
          )}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
            <Plus size={15} /> Nouveau retour
          </button>
        </div>
      </div>

      {/* Month filter */}
      <div className="flex gap-2 mb-5">
        {(["all", "week", "month", "lastmonth"] as MonthFilter[]).map(f => (
          <button key={f} onClick={() => setMonthFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={monthFilter === f
              ? { background: "var(--accent)", color: "var(--primary-foreground)" }
              : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
            {MONTH_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Read status + summary (manager only) */}
      {isManager && feedbacks.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
          <button
            onClick={() => setShowSummary(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ background: "var(--background-elev)" }}>
            <div className="flex items-center gap-2">
              <BarChart2 size={13} style={{ color: "var(--accent)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Récapitulatif</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>
                  {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={e => { e.stopPropagation(); markAllRead(); }}
                  className="text-[11px] px-2.5 py-1 rounded-md"
                  style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  Tout marquer lu
                </button>
              )}
              <ChevronDown size={14} style={{ color: "var(--foreground-dim)", transform: showSummary ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </div>
          </button>
          {showSummary && (
            <div className="p-4" style={{ background: "var(--background-soft)", borderTop: "1px solid var(--border)" }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ color: "var(--foreground-dim)" }}>
                    <th className="text-left font-mono uppercase text-[10px] tracking-widest pb-2">Catégorie</th>
                    <th className="text-center font-mono uppercase text-[10px] tracking-widest pb-2" style={{ color: "var(--success)" }}>▲ Pos</th>
                    <th className="text-center font-mono uppercase text-[10px] tracking-widest pb-2" style={{ color: "var(--warning)" }}>▼ Nég</th>
                    <th className="text-right font-mono uppercase text-[10px] tracking-widest pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {["plat", "service", "boisson", "ambiance", "autre"].map(cat => {
                    const catFbs = feedbacks.filter(f => f.item_cat === cat);
                    const pos = catFbs.filter(f => f.tonality === "positive").length;
                    const neg = catFbs.filter(f => f.tonality === "negative").length;
                    if (catFbs.length === 0) return null;
                    return (
                      <tr key={cat} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="py-2 font-medium capitalize" style={{ color: "var(--foreground)" }}>{cat}</td>
                        <td className="py-2 text-center">
                          {pos > 0 ? (
                            <button onClick={() => setSummaryPopup({ cat, tonality: "positive" })}
                              className="font-mono px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                              style={{ color: "var(--success)", background: "rgba(16,185,129,0.08)" }}>{pos}</button>
                          ) : <span className="font-mono" style={{ color: "var(--foreground-dim)" }}>—</span>}
                        </td>
                        <td className="py-2 text-center">
                          {neg > 0 ? (
                            <button onClick={() => setSummaryPopup({ cat, tonality: "negative" })}
                              className="font-mono px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                              style={{ color: "var(--warning)", background: "rgba(245,158,11,0.08)" }}>{neg}</button>
                          ) : <span className="font-mono" style={{ color: "var(--foreground-dim)" }}>—</span>}
                        </td>
                        <td className="py-2 text-right font-mono font-semibold" style={{ color: "var(--foreground)" }}>{catFbs.length}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td className="py-2 font-semibold text-[11px] font-mono uppercase" style={{ color: "var(--foreground-dim)" }}>Total</td>
                    <td className="py-2 text-center">
                      <button onClick={() => setSummaryPopup({ cat: null, tonality: "positive" })}
                        className="font-mono font-semibold px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                        style={{ color: "var(--success)", background: "rgba(16,185,129,0.08)" }}>
                        {feedbacks.filter(f => f.tonality === "positive").length}
                      </button>
                    </td>
                    <td className="py-2 text-center">
                      <button onClick={() => setSummaryPopup({ cat: null, tonality: "negative" })}
                        className="font-mono font-semibold px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                        style={{ color: "var(--warning)", background: "rgba(245,158,11,0.08)" }}>
                        {feedbacks.filter(f => f.tonality === "negative").length}
                      </button>
                    </td>
                    <td className="py-2 text-right font-mono font-semibold" style={{ color: "var(--foreground)" }}>{feedbacks.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: "none" }}>
        {ITEM_CATS.map(({ key, label }) => {
          const active = activeFilters.has(key);
          return (
            <button key={key} onClick={() => toggleFilter(key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={active
                ? { background: "var(--accent)", color: "var(--primary-foreground)" }
                : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
              {label}
            </button>
          );
        })}

        <div className="w-px flex-shrink-0 self-stretch mx-1" style={{ background: "var(--border)" }} />

        <button onClick={() => toggleFilter("negative")}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={activeFilters.has("negative")
            ? { background: "rgba(245,158,11,0.2)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.4)" }
            : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
          ▼ Négatifs
        </button>
        <button onClick={() => toggleFilter("positive")}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={activeFilters.has("positive")
            ? { background: "rgba(16,185,129,0.2)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.4)" }
            : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
          ▲ Positifs
        </button>

        <div className="w-px flex-shrink-0 self-stretch mx-1" style={{ background: "var(--border)" }} />

        <button onClick={() => toggleFilter("mine")}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={activeFilters.has("mine")
            ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.3)" }
            : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
          Mes retours
        </button>
        <button onClick={() => toggleFilter("echoed")}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={activeFilters.has("echoed")
            ? { background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.3)" }
            : { background: "var(--background-elev)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
          Mes +1
        </button>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-medium mb-2" style={{ color: "var(--foreground)" }}>
            {activeFilters.size > 0
              ? "Aucun retour dans cette catégorie cette semaine."
              : "Aucun retour pour l'instant cette semaine."}
          </p>
          {activeFilters.size > 0 ? (
            <button onClick={() => setActiveFilters(new Set())} className="text-sm" style={{ color: "var(--accent)" }}>
              Réinitialiser les filtres
            </button>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-dim)" }}>
                Sois le premier à noter ce que tu entends en service.
              </p>
              <button onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
                <Plus size={14} /> Nouveau retour
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.filter(f => !dismissedIds.has(f.id)).map(f => (
            <FeedbackCard key={f.id} feedback={f}
              isRead={readIds.has(f.id)}
              isManager={isManager}
              onEcho={() => toggleEcho(f.id)}
              onDelete={() => setDeleteTarget(f.id)}
              onMarkRead={() => markAsRead(f.id)}
              onDismiss={() => dismissFeedback(f.id)} />
          ))}
        </div>
      )}

      {/* Dismissed feedbacks — collapsible section for all users */}
      {dismissedIds.size > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowDismissed(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <span className="text-[12px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
              Pas eu ce retour · {dismissedIds.size}
            </span>
            <ChevronDown size={14} style={{ color: "var(--foreground-dim)", transform: showDismissed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showDismissed && (
            <div className="space-y-3 mt-3" style={{ opacity: 0.55 }}>
              {feedbacks.filter(f => dismissedIds.has(f.id)).map(f => (
                <FeedbackCard key={f.id} feedback={f}
                  isRead={readIds.has(f.id)}
                  isManager={isManager}
                  onEcho={() => toggleEcho(f.id)}
                  onDelete={() => setDeleteTarget(f.id)}
                  onMarkRead={() => markAsRead(f.id)}
                  onDismiss={() => dismissFeedback(f.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary popup */}
      {summaryPopup && (() => {
        const popupFbs = feedbacks.filter(f =>
          f.tonality === summaryPopup.tonality &&
          (summaryPopup.cat === null || f.item_cat === summaryPopup.cat)
        );
        const isPos = summaryPopup.tonality === "positive";
        const title = summaryPopup.cat
          ? `${isPos ? "▲ Positifs" : "▼ Négatifs"} · ${summaryPopup.cat}`
          : `${isPos ? "▲ Tous les positifs" : "▼ Tous les négatifs"}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setSummaryPopup(null); }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "80vh", overflowY: "auto" }}>
              <div className="flex items-center justify-between px-5 py-4 sticky top-0"
                style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold capitalize" style={{ color: isPos ? "var(--success)" : "var(--warning)" }}>{title}</p>
                <button onClick={() => setSummaryPopup(null)} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                {popupFbs.map(f => (
                  <div key={f.id} className="rounded-xl p-3.5"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <KarafAvatar firstName={f.reporter_first} lastName={f.reporter_last} avatarUrl={f.reporter_avatar} size={22} />
                      <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>{f.reporter_name}</span>
                      <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>· {formatRelativeTime(f.created_at)}</span>
                      {f.echo_count > 0 && (
                        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>
                          +{f.echo_count}
                        </span>
                      )}
                    </div>
                    {f.item && <p className="text-[14px] font-medium mb-0.5" style={{ color: "var(--foreground)" }}>{f.item}</p>}
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>« {f.content} »</p>
                    {f.table_number && <p className="text-[10px] mt-1" style={{ color: "var(--foreground-dim)" }}>Table {f.table_number}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
          {toast}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Supprimer ce retour ?</p>
            <p className="text-[12px] mb-5" style={{ color: "var(--foreground-dim)" }}>Il ne sera plus visible pour ton équipe.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteFeedback(deleteTarget)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Supprimer
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl"
                style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis modal */}
      {showAnalysis && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget && !analyzing) setShowAnalysis(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "85vh", overflowY: "auto" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={15} style={{ color: "var(--accent)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Analyse IA</p>
                  <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{feedbacks.length} retours · {MONTH_LABELS[monthFilter].toLowerCase()}</p>
                </div>
              </div>
              {!analyzing && (
                <button onClick={() => setShowAnalysis(false)} style={{ color: "var(--foreground-dim)" }}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {analyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <span className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: "var(--accent)" }} />
                  <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Analyse en cours…</p>
                </div>
              )}

              {!analyzing && !analysis && (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: "var(--danger)" }}>Erreur lors de l'analyse. Réessaye.</p>
                  <button onClick={handleAnalyze} className="mt-3 text-sm" style={{ color: "var(--accent)" }}>Réessayer</button>
                </div>
              )}

              {!analyzing && analysis && (
                <>
                  {/* Tendance */}
                  <div className="rounded-xl p-3.5" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Activity size={12} style={{ color: "var(--accent)" }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--accent)" }}>Tendance</span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground)" }}>{analysis.tendance}</p>
                  </div>

                  {/* Tableau des avis */}
                  {analysis.tableau && analysis.tableau.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Avis par sujet</span>
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {/* Header */}
                        <div className="grid px-3 py-2" style={{ gridTemplateColumns: "1fr 80px 40px", background: "var(--background-soft)", borderBottom: "1px solid var(--border)" }}>
                          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Sujet</span>
                          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Ressenti</span>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-right" style={{ color: "var(--foreground-dim)" }}>Échos</span>
                        </div>
                        {/* Rows */}
                        {analysis.tableau.map((row, i) => {
                          const isPos = row.sentiment === "positive";
                          return (
                            <div key={i} className="px-3 py-3" style={{ borderBottom: i < analysis.tableau.length - 1 ? "1px solid var(--border)" : "none", background: "var(--background-elev)" }}>
                              <div className="grid items-start" style={{ gridTemplateColumns: "1fr 80px 40px" }}>
                                <div className="min-w-0 pr-2">
                                  <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{row.item}</p>
                                  <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{row.resume}</p>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: isPos ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: isPos ? "var(--success)" : "var(--danger)" }}>
                                    {isPos ? "▲ positif" : "▼ négatif"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  {row.echos > 0 && <span className="text-[12px] font-mono font-semibold" style={{ color: isPos ? "var(--success)" : "var(--danger)" }}>{row.echos}×</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setShowAnalysis(false)}
                    className="w-full py-3 text-sm font-medium rounded-xl mt-2"
                    style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                    Fermer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New feedback modal */}
      {showNewModal && (
        <NewFeedbackModal
          establishmentId={establishmentId}
          profileId={profileId}
          onClose={() => setShowNewModal(false)}
          onAdded={addFeedback}
          onEchoExisting={echoExisting}
        />
      )}
    </div>
  );
}

/* ─── FEEDBACK CARD ─────────────────────────────────── */
function FeedbackCard({ feedback: f, isRead, isManager, onEcho, onDelete, onMarkRead, onDismiss }: {
  feedback: FeedbackView;
  isRead: boolean;
  isManager: boolean;
  onEcho: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const SWIPE_THRESHOLD = 100;
  const isHot = f.echo_count >= 3;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setSwipeX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX;
    if (dx < 0) setSwipeX(dx);
  };

  const handleTouchEnd = () => {
    if (swipeX < -SWIPE_THRESHOLD) {
      setIsDismissing(true);
      setTimeout(() => onDismiss(), 250);
    } else {
      setSwipeX(0);
    }
  };

  if (isDismissing) return null;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Fond swipe "Pas eu" */}
      <div className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", opacity: Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD) }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: "var(--danger)" }}>Pas eu ce retour</span>
          <X size={16} style={{ color: "var(--danger)" }} />
        </div>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? "transform 0.25s ease" : "none",
          background: "var(--background-elev)",
          border: `1px solid ${isHot ? "rgba(6,182,212,0.3)" : !isRead ? "rgba(6,182,212,0.15)" : "var(--border)"}`,
          boxShadow: isHot ? "0 0 24px rgba(6,182,212,0.06)" : undefined,
          opacity: isRead && !isHot ? 0.85 : 1,
          borderRadius: "0.75rem",
        }}>

      {/* Unread indicator */}
      {!isRead && isManager && (
        <div className="flex items-center justify-between px-4 pt-2.5 pb-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-[10px] font-mono" style={{ color: "var(--accent)" }}>Non lu</span>
          </div>
          <button onClick={onMarkRead} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "var(--foreground-dim)" }}>
            <Eye size={10} /> Marquer lu
          </button>
        </div>
      )}
      {isRead && isManager && (
        <div className="flex items-center gap-1.5 px-4 pt-2.5">
          <EyeOff size={10} style={{ color: "var(--foreground-dim)" }} />
          <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>Lu</span>
        </div>
      )}

      {isHot && (
        <div className="flex items-center gap-1.5 px-4 pt-3">
          <RotateCcw size={10} style={{ color: "var(--accent)" }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Ça revient
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Author + time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <KarafAvatar firstName={f.reporter_first} lastName={f.reporter_last} avatarUrl={f.reporter_avatar} size={28} />
            <span className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>{f.reporter_name}</span>
            <span className="text-[11px] flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>· {formatRelativeTime(f.created_at)}</span>
          </div>
          {f.is_mine && (
            <div className="relative flex-shrink-0 ml-2">
              <button onClick={() => setMenuOpen(o => !o)} className="p-1 rounded-md" style={{ color: "var(--foreground-dim)" }}>
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 rounded-xl overflow-hidden"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)", minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm"
                    style={{ color: "var(--danger)" }}>
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border-soft)" }}>
            {CAT_LABELS[f.item_cat]}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
            style={f.tonality === "positive"
              ? { background: "rgba(16,185,129,0.08)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }
              : { background: "rgba(245,158,11,0.08)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.2)" }}>
            {f.tonality === "positive" ? "▲ Positif" : "▼ Négatif"}
          </span>
          {f.table_number && (
            <span className="text-[10px] font-mono" style={{ color: "var(--foreground-dim)" }}>Table {f.table_number}</span>
          )}
        </div>

        {/* Item + content */}
        {f.item && (
          <p className="text-lg font-medium leading-snug mb-1" style={{ color: "var(--foreground)" }}>{f.item}</p>
        )}
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>
          « {f.content} »
        </p>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "var(--border-soft)" }} />

      {/* Echo section */}
      <div className="px-4 py-3">
        {f.echo_count > 0 && (
          <p className="text-[12px] mb-2.5" style={{ color: "var(--foreground-dim)" }}>
            {f.echo_count} collègue{f.echo_count > 1 ? "s" : ""} {f.echo_count > 1 ? "ont" : "a"} entendu pareil
          </p>
        )}
        {f.is_mine ? (
          <p className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>Tu as publié ce retour.</p>
        ) : (
          <button onClick={onEcho}
            className="w-full py-2.5 text-[13px] font-medium rounded-xl transition-all active:scale-[0.98]"
            style={f.is_echoed
              ? { background: "rgba(6,182,212,0.08)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.25)" }
              : { background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
            {f.is_echoed ? "✓ Entendu (toi inclus)" : "+ J'ai entendu pareil"}
          </button>
        )}
        {!f.is_mine && (
          <p className="text-[10px] text-center mt-2" style={{ color: "var(--foreground-dim)" }}>
            ← Glisse à gauche si tu n'as pas eu ce retour
          </p>
        )}
      </div>
      </div>
    </div>
  );
}


/* ─── NEW FEEDBACK MODAL ──────────────────────────────── */
interface SimilarMatch {
  feedback_id: string;
  confidence: "high" | "medium" | "low";
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

type ModalStep = "form" | "checking" | "suggestion";

function NewFeedbackModal({ establishmentId, profileId, onClose, onAdded, onEchoExisting }: {
  establishmentId: string;
  profileId: string;
  onClose: () => void;
  onAdded: (f: FeedbackView, msg?: string) => void;
  onEchoExisting: (feedbackId: string, reporterName: string) => void;
}) {
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
    onAdded(fb);
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
    onEchoExisting(match.feedback_id, match.reporter_name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && step !== "checking") onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* ── FORM / CHECKING ── */}
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
              {/* Category */}
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

              {/* Tonality */}
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

              {/* Item */}
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

              {/* Content */}
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

              {/* Table */}
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

              {/* Footer */}
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

        {/* ── SUGGESTION ── */}
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
                    ✓ Oui, c'est ça — +1
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
