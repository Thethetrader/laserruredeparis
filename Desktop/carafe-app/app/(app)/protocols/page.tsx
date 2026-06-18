"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { LucideIcon, Plus, ChevronDown, ChevronUp, CheckCircle, BookOpen, AlertCircle, FileText, Image, Upload, ExternalLink, ChevronLeft, ChevronRight, X, UtensilsCrossed, Wine, Users, ShieldCheck, Sunrise, Sunset, Sparkles, LayoutGrid, Wand2, Trash2, LayoutDashboard } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = false;
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type ProtocolCategory = string;

interface CustomCategory {
  id: string;
  name: string;
  color: string;
}
type AttachmentType = "pdf" | "image" | null;

interface StepItem {
  text: string;
  frequency?: "daily" | "opening" | "closing" | "continuous";
  photo_url?: string;
}

function parseSteps(raw: unknown): StepItem[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(s => typeof s === "string" ? { text: s } : s as StepItem);
}

interface ProtocolStepData { gallery: string[]; steps: StepItem[] }
function parseProtocolSteps(raw: unknown): ProtocolStepData {
  if (!raw) return { gallery: [], steps: [] };
  if (Array.isArray(raw)) return { gallery: [], steps: raw.map(s => typeof s === "string" ? { text: s } : s as StepItem) };
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { gallery?: unknown; items?: unknown };
    return {
      gallery: Array.isArray(obj.gallery) ? (obj.gallery as string[]) : [],
      steps: Array.isArray(obj.items) ? (obj.items as unknown[]).map(s => typeof s === "string" ? { text: s as string } : s as StepItem) : [],
    };
  }
  return { gallery: [], steps: [] };
}

function buildStepsPayload(steps: StepItem[], gallery: string[]): unknown {
  if (steps.length === 0 && gallery.length === 0) return null;
  if (gallery.length === 0) return steps;
  return { items: steps, gallery };
}

const STEP_FREQ_LABELS: Record<string, string> = {
  daily: "Quotidien", opening: "Ouverture", closing: "Fermeture", continuous: "Continu",
};

interface Protocol {
  id: string;
  establishment_id: string;
  author_id: string;
  title: string;
  content: string;
  category: ProtocolCategory;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
  read_count?: number;
  author_name?: string;
  attachment_url?: string | null;
  attachment_type?: AttachmentType;
  attachment_name?: string | null;
  steps?: StepItem[] | string[] | null;
  show_on_dashboard?: boolean;
}

const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: "salle",     name: "Salle",      color: "rgba(113,113,122,0.18)" },
  { id: "cuisine",   name: "Cuisine",    color: "rgba(245,158,11,0.15)" },
  { id: "bar",       name: "Bar",        color: "rgba(6,182,212,0.15)" },
  { id: "accueil",   name: "Accueil",    color: "rgba(16,185,129,0.15)" },
  { id: "hygiene",   name: "Hygiène",    color: "rgba(99,102,241,0.15)" },
  { id: "securite",  name: "Sécurité",   color: "rgba(239,68,68,0.15)" },
  { id: "ouverture", name: "Ouverture",  color: "rgba(16,185,129,0.12)" },
  { id: "fermeture", name: "Fermeture",  color: "rgba(245,158,11,0.12)" },
];

const ICON_POOL: LucideIcon[] = [LayoutGrid, UtensilsCrossed, Wine, Users, Sparkles, ShieldCheck, Sunrise, Sunset, BookOpen, FileText, Wand2, LayoutDashboard];

const COLOR_PALETTE = [
  "rgba(113,113,122,0.18)",
  "rgba(245,158,11,0.15)",
  "rgba(6,182,212,0.15)",
  "rgba(16,185,129,0.15)",
  "rgba(99,102,241,0.15)",
  "rgba(239,68,68,0.15)",
  "rgba(251,146,60,0.15)",
  "rgba(168,85,247,0.15)",
];

const DEV_PROTOCOLS: Protocol[] = [
  {
    id: "p1",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Plan de salle & numérotation des tables",
    content: "Référez-vous au plan ci-dessous pour le placement des couverts et la numérotation des tables.\n\n- Tables 1–8 : côté fenêtre\n- Tables 9–14 : côté bar\n- Tables 15–18 : terrasse",
    category: "salle",
    is_mandatory: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    read_count: 4,
    author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    attachment_type: "image",
    attachment_name: "plan_de_salle.jpg",
  },
  {
    id: "p2",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Dressage des tables",
    content: "Ordre de mise en place :\n1. Nappe propre et centrée\n2. Assiette de présentation\n3. Couverts (fourchette gauche, couteau droit, cuillère à soupe)\n4. Verre à eau puis verre à vin\n5. Serviette pliée sur assiette\n6. Pain et beurre si menu",
    category: "salle",
    is_mandatory: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    read_count: 3,
    author_name: "Dev Mode",
    attachment_url: null,
    attachment_type: null,
  },
  {
    id: "p3",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Normes HACCP Températures",
    content: "Températures de conservation obligatoires :\n- Produits frais : 0°C à +4°C\n- Surgelés : -18°C\n- Plats chauds en service : minimum +63°C\n\nEnregistrer les températures matin et soir dans le registre HACCP.",
    category: "hygiene",
    is_mandatory: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    read_count: 5,
    author_name: "Dev Mode",
    attachment_url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    attachment_type: "pdf",
    attachment_name: "HACCP_Températures.pdf",
  },
  {
    id: "p4",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Procédure d'ouverture",
    content: "1. Vérifier les températures des frigos\n2. Allumer la ventilation\n3. Préparer la caisse\n4. Nettoyer et dresser les tables\n5. Vérifier les réservations du jour\n6. Briefer l'équipe à 11h30",
    category: "ouverture",
    is_mandatory: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    read_count: 6,
    author_name: "Dev Mode",
    attachment_url: null,
    attachment_type: null,
  },
  {
    id: "p5",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Procédure de fermeture",
    content: "1. Encaisser et clôturer la caisse\n2. Nettoyer la salle et les tables\n3. Ranger et filmer les préparations\n4. Vérifier les températures frigos\n5. Éteindre les équipements\n6. Activer l'alarme et fermer à clé",
    category: "fermeture",
    is_mandatory: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    read_count: 4,
    author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    attachment_type: "image",
    attachment_name: "cuisine_fermeture.jpg",
  },
  {
    id: "p6",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Carte des cocktails & accords mets",
    content: "Les cocktails signature de la maison :\n- Spritz Karaf : Aperol, prosecco, orange\n- Negroni Blanc : gin, lillet blanc, Campari\n\nAccords recommandés :\n- Viandes rouges → Bordeaux rouge\n- Poissons → Chablis ou Sancerre",
    category: "bar",
    is_mandatory: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    read_count: 2,
    author_name: "Dev Mode",
    attachment_url: null,
    attachment_type: null,
  },
  {
    id: "p7",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Accueil & placement des clients",
    content: "1. Sourire et saluer dès l'entrée\n2. Demander si réservation\n3. Guider jusqu'à la table\n4. Présenter la carte et les suggestions du jour\n5. Proposer un apéritif dans les 3 minutes",
    category: "accueil",
    is_mandatory: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    read_count: 5,
    author_name: "Dev Mode",
    attachment_url: null,
    attachment_type: null,
  },
  {
    id: "p8",
    establishment_id: DEV_ESTABLISHMENT_ID,
    author_id: DEV_PROFILE_ID,
    title: "Organisation de la cuisine en service",
    content: "Postes et responsabilités :\n- Chef de partie chaud : poêles, grillades, sauces\n- Chef de partie froid : entrées, desserts, garnitures\n- Plongeur : vaisselle en continu\n\nCommunication : annoncer chaque plat à l'envoi.",
    category: "cuisine",
    is_mandatory: false,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    read_count: 3,
    author_name: "Dev Mode",
    attachment_url: null,
    attachment_type: null,
  },
];

export default function ProtocolsPage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<string>("employee");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [profileId, setProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<ProtocolCategory | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const [galleryLightbox, setGalleryLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<ProtocolCategory>("salle");
  const [formMandatory, setFormMandatory] = useState(false);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formSteps, setFormSteps] = useState<StepItem[]>([]);
  const [formGallery, setFormGallery] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [showCatManager, setShowCatManager] = useState(false);
  const [catInput, setCatInput] = useState("");
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0]);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [savingCats, setSavingCats] = useState(false);

  useEffect(() => {
    if (DEV_MODE) {
      setRole(devRole);
      setProtocols(DEV_PROTOCOLS);
      setLoading(false);
      return;
    }
    loadData();
  }, [devRole]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProfileId(user.id);

    const activeEstId = typeof document !== "undefined" ? (document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) ?? [])[1] ?? null : null;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validActiveId = activeEstId && uuidRe.test(activeEstId) ? activeEstId : null;
    let memberQ = supabase.from("establishment_members").select("role, establishment_id")
      .eq("profile_id", user.id).eq("is_active", true);
    if (validActiveId) memberQ = memberQ.eq("establishment_id", validActiveId);
    const { data: memberData } = await memberQ.limit(1).maybeSingle();

    if (!memberData) { setLoading(false); return; }

    setRole(memberData.role);
    setEstablishmentId(memberData.establishment_id);

    const [{ data: protocolData }, { data: readData }, { data: estData }] = await Promise.all([
      supabase.from("protocols").select("*").eq("establishment_id", memberData.establishment_id).order("created_at", { ascending: false }),
      supabase.from("protocol_reads").select("protocol_id").eq("profile_id", user.id),
      supabase.from("establishments").select("protocol_categories").eq("id", memberData.establishment_id).single(),
    ]);

    setProtocols((protocolData ?? []) as Protocol[]);
    setReads(new Set(Array.from((readData ?? []).map((r: { protocol_id: string }) => r.protocol_id))));
    if (estData?.protocol_categories && Array.isArray(estData.protocol_categories)) {
      const cats = estData.protocol_categories as CustomCategory[];
      setCategories(cats);
      if (cats.length > 0) setFormCategory(cats[0].id as ProtocolCategory);
    }
    setLoading(false);
  }

  const isManager = role === "owner" || role === "manager";

  const saveCats = async (updated: CustomCategory[]) => {
    setSavingCats(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("establishments").update({ protocol_categories: updated as any }).eq("id", establishmentId);
    setCategories(updated);
    setSavingCats(false);
  };

  const addOrUpdateCat = async () => {
    if (!catInput.trim()) return;
    const id = catEditId ?? catInput.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const updated = catEditId
      ? categories.map(c => c.id === catEditId ? { ...c, name: catInput.trim(), color: catColor } : c)
      : [...categories, { id, name: catInput.trim(), color: catColor }];
    await saveCats(updated);
    setCatInput(""); setCatEditId(null); setCatColor(COLOR_PALETTE[0]);
  };

  const deleteCat = async (id: string) => {
    await saveCats(categories.filter(c => c.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const markAsRead = async (protocolId: string) => {
    if (DEV_MODE) { setReads(prev => new Set(Array.from(prev).concat(protocolId))); return; }
    await supabase.from("protocol_reads").upsert({ protocol_id: protocolId, profile_id: profileId });
    setReads(prev => new Set(Array.from(prev).concat(protocolId)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    setFormFile(file);
    // Auto-analyse uniquement pour les PDFs
    if (file.type === "application/pdf") {
      setTimeout(() => extractStepsFromFile(file), 0);
    }
  };

  const extractStepsFromFile = async (file: File) => {
    setExtracting(true);
    setFormSteps([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/protocols/extract-steps", { method: "POST", body: fd });
      const data = await res.json();
      if (data.steps) setFormSteps(data.steps.map((s: string) => ({ text: s })));
    } finally {
      setExtracting(false);
    }
  };

  const extractSteps = async () => {
    if (!formFile) return;
    await extractStepsFromFile(formFile);
    // L'image servait uniquement à l'analyse — ne pas la conserver comme pièce jointe
    if (formFile.type.startsWith("image/")) {
      setFormFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getAttachmentType = (file: File): AttachmentType => {
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("image/")) return "image";
    return null;
  };

  const openFormForCategory = (cat: ProtocolCategory) => {
    setFormCategory(cat);
    setShowForm(true);
  };

  const createProtocol = async () => {
    if (!formTitle.trim()) return;
    setSubmitting(true);

    let attachmentUrl: string | null = null;
    let attachmentType: AttachmentType = null;
    let attachmentName: string | null = null;
    try {

    if (formFile) {
      if (DEV_MODE) {
        attachmentType = getAttachmentType(formFile);
        attachmentName = formFile.name;
        attachmentUrl = URL.createObjectURL(formFile);
      } else {
        const fd = new FormData();
        fd.append("file", formFile);
        fd.append("establishmentId", establishmentId);
        const res = await fetch("/api/protocols/upload-attachment", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || !json.url) {
          setFormError(json.error ?? "Erreur upload. Réessayez.");
          setSubmitting(false);
          return;
        }
        attachmentUrl = json.url;
        attachmentType = getAttachmentType(formFile);
        attachmentName = formFile.name;
      }
    }

    if (DEV_MODE) {
      const newP: Protocol = {
        id: `p-${Date.now()}`,
        establishment_id: DEV_ESTABLISHMENT_ID,
        author_id: DEV_PROFILE_ID,
        title: formTitle,
        content: formContent,
        category: formCategory,
        is_mandatory: formMandatory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        read_count: 0,
        author_name: "Dev Mode",
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName,
        steps: formSteps.length > 0 ? formSteps as unknown as undefined : null,
      };
      setProtocols(prev => [newP, ...prev]);
      resetForm();
      setSubmitting(false);
      return;
    }

    if (editingProtocol) {
      const updatePayload = {
        title: formTitle,
        content: formContent || "",
        category: formCategory as unknown as undefined,
        is_mandatory: formMandatory,
        steps: buildStepsPayload(formSteps, formGallery) as unknown as undefined,
        updated_at: new Date().toISOString(),
        ...(attachmentUrl ? { attachment_url: attachmentUrl, attachment_type: attachmentType ?? undefined, attachment_name: attachmentName ?? undefined } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("protocols") as any).update(updatePayload).eq("id", editingProtocol.id);
      if (error) { setFormError(error.message); setSubmitting(false); return; }
      setProtocols(prev => prev.map(p => p.id === editingProtocol.id ? { ...p, ...updatePayload, attachment_url: attachmentUrl ?? p.attachment_url, attachment_type: attachmentType ?? p.attachment_type, attachment_name: attachmentName ?? p.attachment_name } as Protocol : p));
      resetForm();
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.from("protocols").insert({
      establishment_id: establishmentId,
      author_id: profileId,
      title: formTitle,
      content: formContent || "",
      category: formCategory as unknown as undefined,
      is_mandatory: formMandatory,
      attachment_url: attachmentUrl ?? undefined,
      attachment_type: attachmentType ?? undefined,
      attachment_name: attachmentName ?? undefined,
      steps: buildStepsPayload(formSteps, formGallery),
    }).select().single();

    if (error) {
      setFormError(error.message ?? "Erreur lors de la création. Réessayez.");
      setSubmitting(false);
      return;
    }
    if (data) {
      setProtocols(prev => [data as Protocol, ...prev]);
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishmentId,
          title: 'Nouveau protocole',
          body: `"${formTitle}" a été publié. Appuie pour le lire.`,
          url: '/protocols',
        }),
      }).catch(() => {});
    }
    resetForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erreur inattendue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormCategory("salle");
    setFormMandatory(false); setFormFile(null); setFormSteps([]); setFormGallery([]);
    setFormError(null); setEditingProtocol(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(false);
  };

  function openEditForm(protocol: Protocol) {
    setEditingProtocol(protocol);
    setFormTitle(protocol.title);
    setFormContent(protocol.content ?? "");
    setFormCategory(protocol.category as ProtocolCategory);
    setFormMandatory(protocol.is_mandatory);
    const parsed = parseProtocolSteps(protocol.steps);
    setFormSteps(parsed.steps);
    setFormGallery(parsed.gallery);
    setFormFile(null);
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProtocol(id: string) {
    if (!confirm("Supprimer ce protocole ? Cette action est irréversible.")) return;
    if (DEV_MODE) {
      setProtocols(prev => prev.filter(p => p.id !== id));
      return;
    }
    await supabase.from("protocols").delete().eq("id", id);
    setProtocols(prev => prev.filter(p => p.id !== id));
  }

  async function toggleDashboard(protocol: Protocol) {
    const newValue = !protocol.show_on_dashboard;
    if (!DEV_MODE) {
      await supabase.from("protocols").update({ show_on_dashboard: newValue }).eq("id", protocol.id);
    }
    setProtocols(prev => prev.map(p => p.id === protocol.id ? { ...p, show_on_dashboard: newValue } : p));
  }

  const allCategories = categories.map(c => c.id);

  const getCat = (id: string) => categories.find(c => c.id === id) ?? { id, name: id, color: "rgba(113,113,122,0.15)" };
  const getCatIcon = (id: string): LucideIcon => ICON_POOL[categories.findIndex(c => c.id === id) % ICON_POOL.length] ?? BookOpen;

  const categoryProtocols = (cat: string) => protocols.filter(p => p.category === cat);

  const categoryUnread = (cat: string) =>
    categoryProtocols(cat).filter(p => !reads.has(p.id)).length;

  const filteredProtocols = selectedCategory
    ? [...protocols.filter(p => p.category === selectedCategory)].sort((a, b) => {
        if (isManager) return 0;
        const aRead = reads.has(a.id);
        const bRead = reads.has(b.id);
        if (aRead === bRead) {
          if (!aRead && a.is_mandatory !== b.is_mandatory) return a.is_mandatory ? -1 : 1;
          return 0;
        }
        return aRead ? 1 : -1;
      })
    : [];

  const totalUnread = protocols.filter(p => !reads.has(p.id)).length;
  const totalUnreadMandatory = protocols.filter(p => !reads.has(p.id) && p.is_mandatory).length;

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl h-20 animate-pulse mb-3" style={{ background: "var(--background-elev)" }} />)}
      </div>
    );
  }

  /* ── Category grid view ── */
  if (!selectedCategory) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <MonoLabel size="xs" className="mb-2 block">Protocoles</MonoLabel>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Protocoles</h1>
              {!isManager && totalUnread > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: totalUnreadMandatory > 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                    color: totalUnreadMandatory > 0 ? "var(--danger)" : "var(--warning)",
                    border: `1px solid ${totalUnreadMandatory > 0 ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}>
                  {totalUnread} à lire
                </span>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
              {protocols.length} protocole{protocols.length !== 1 ? "s" : ""} · {allCategories.filter(c => categoryProtocols(c).length > 0).length} catégories
            </p>
          </div>
          {isManager && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCatManager(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                <Wand2 size={13} /> Catégories
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
                style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
                <Plus size={14} /> Nouveau
              </button>
            </div>
          )}
        </div>

        {/* Unread mandatory banner */}
        {!isManager && totalUnreadMandatory > 0 && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              <span style={{ fontWeight: 600 }}>{totalUnreadMandatory} protocole{totalUnreadMandatory > 1 ? "s" : ""} obligatoire{totalUnreadMandatory > 1 ? "s" : ""}</span>
              {" "}à valider ouvrez-les et confirmez votre lecture.
            </p>
          </div>
        )}

        {/* Create form */}
        {showForm && isManager && (
          <ProtocolForm
            formTitle={formTitle} setFormTitle={setFormTitle}
            formContent={formContent} setFormContent={setFormContent}
            formCategory={formCategory} setFormCategory={setFormCategory}
            categories={categories}
            formMandatory={formMandatory} setFormMandatory={setFormMandatory}
            formFile={formFile} setFormFile={setFormFile}
            formSteps={formSteps} setFormSteps={setFormSteps}
            formGallery={formGallery} setFormGallery={setFormGallery}
            establishmentId={establishmentId}
            extracting={extracting} onExtractSteps={extractSteps}
            fileInputRef={fileInputRef} handleFileChange={handleFileChange}
            isEditing={!!editingProtocol} submitting={submitting} onSubmit={createProtocol} onCancel={resetForm}
            error={formError}
          />
        )}

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3">
          {allCategories.map(cat => {
            const catData = getCat(cat);
            const count = categoryProtocols(cat).length;
            const unread = categoryUnread(cat);
            const Icon = getCatIcon(cat);
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="rounded-xl p-4 text-left transition-all active:scale-[0.98]"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-lg p-2" style={{ background: catData.color }}>
                    <Icon size={16} strokeWidth={1.5} style={{ color: "var(--foreground-muted)" }} />
                  </div>
                  {!isManager && unread > 0 && (
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
                  {catData.name}
                </p>
                <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                  {count} protocole{count !== 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>

        {protocols.length === 0 && (
          <div className="rounded-xl flex flex-col items-center justify-center py-16 mt-3"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <BookOpen size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
            <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun protocole pour le moment</p>
            {isManager && <button onClick={() => setShowForm(true)} className="mt-4 text-sm" style={{ color: "var(--accent)" }}>Créer le premier protocole</button>}
          </div>
        )}

        {/* Category manager modal */}
        {showCatManager && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md rounded-2xl p-5" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Gérer les catégories</h2>
                <button onClick={() => { setShowCatManager(false); setCatInput(""); setCatEditId(null); }} style={{ color: "var(--foreground-dim)" }}><X size={18} /></button>
              </div>

              {/* Existing categories */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {categories.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color.replace(/[\d.]+\)$/, "1)") }} />
                    <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                    <button onClick={() => { setCatEditId(c.id); setCatInput(c.name); setCatColor(c.color); }}
                      className="text-[11px] px-2 py-0.5 rounded" style={{ color: "var(--accent)", background: "rgba(6,182,212,0.08)" }}>Modifier</button>
                    <button onClick={() => deleteCat(c.id)} style={{ color: "var(--foreground-dim)" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              {/* Add/edit form */}
              <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--foreground-dim)" }}>
                  {catEditId ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </p>
                <div className="flex gap-2 mb-3">
                  <input value={catInput} onChange={e => setCatInput(e.target.value)}
                    placeholder="Nom de la catégorie"
                    className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {COLOR_PALETTE.map(col => (
                    <button key={col} onClick={() => setCatColor(col)}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{ background: col.replace(/[\d.]+\)$/, "1)"), borderColor: catColor === col ? "var(--foreground)" : "transparent" }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  {catEditId && (
                    <button onClick={() => { setCatEditId(null); setCatInput(""); setCatColor(COLOR_PALETTE[0]); }}
                      className="flex-1 py-2 rounded-lg text-sm"
                      style={{ background: "var(--background-soft)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                      Annuler
                    </button>
                  )}
                  <button onClick={addOrUpdateCat} disabled={savingCats || !catInput.trim()}
                    className="flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (!catInput.trim() || savingCats) ? 0.5 : 1 }}>
                    {savingCats ? "Sauvegarde…" : catEditId ? "Enregistrer" : "Ajouter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Category detail view ── */
  const catData = getCat(selectedCategory!);
  const catLabel = catData.name;
  const CatIcon = getCatIcon(selectedCategory!);
  const catUnread = categoryUnread(selectedCategory!);
  const catUnreadMandatory = filteredProtocols.filter(p => !reads.has(p.id) && p.is_mandatory).length;
  const catAttachments = filteredProtocols.filter(p => p.attachment_url);

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button onClick={() => { setSelectedCategory(null); setShowForm(false); setViewMode("list"); }}
            className="flex-shrink-0 rounded-lg p-2 mt-0.5"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <MonoLabel size="xs" className="mb-1 block">Protocoles</MonoLabel>
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5" style={{ background: catData.color }}>
                <CatIcon size={14} strokeWidth={1.5} style={{ color: "var(--foreground-muted)" }} />
              </div>
              <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{catLabel}</h1>
              {!isManager && catUnread > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: catUnreadMandatory > 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                    color: catUnreadMandatory > 0 ? "var(--danger)" : "var(--warning)",
                    border: `1px solid ${catUnreadMandatory > 0 ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}>
                  {catUnread} à lire
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-dim)" }}>
              {filteredProtocols.length} protocole{filteredProtocols.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isManager && (
          <button onClick={() => openFormForCategory(selectedCategory)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md flex-shrink-0"
            style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}>
            <Plus size={14} /> Nouveau
          </button>
        )}
      </div>

      {/* Unread mandatory banner */}
      {!isManager && catUnreadMandatory > 0 && (
        <div className="rounded-xl px-4 py-3 mb-6 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            <span style={{ fontWeight: 600 }}>{catUnreadMandatory} protocole{catUnreadMandatory > 1 ? "s" : ""} obligatoire{catUnreadMandatory > 1 ? "s" : ""}</span>
            {" "}à valider dans cette catégorie.
          </p>
        </div>
      )}

      {/* Create form */}
      {showForm && isManager && (
        <ProtocolForm
          formTitle={formTitle} setFormTitle={setFormTitle}
          formContent={formContent} setFormContent={setFormContent}
          formCategory={formCategory} setFormCategory={setFormCategory}
          categories={categories}
          formMandatory={formMandatory} setFormMandatory={setFormMandatory}
          formFile={formFile} setFormFile={setFormFile}
          formSteps={formSteps} setFormSteps={setFormSteps}
          formGallery={formGallery} setFormGallery={setFormGallery}
          establishmentId={establishmentId}
          extracting={extracting} onExtractSteps={extractSteps}
          fileInputRef={fileInputRef} handleFileChange={handleFileChange}
          isEditing={!!editingProtocol} submitting={submitting} onSubmit={createProtocol} onCancel={resetForm}
          error={formError}
        />
      )}

      {/* View toggle — only if there are attachments */}
      {catAttachments.length > 0 && (
        <div className="flex gap-2 mb-5">
          {(["list", "gallery"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={viewMode === mode
                ? { background: catData.color, color: "var(--foreground)", border: "1px solid var(--border)" }
                : { background: "transparent", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
              {mode === "list" ? "Protocoles" : `Photos · ${catAttachments.length}`}
            </button>
          ))}
        </div>
      )}

      {/* Gallery view */}
      {viewMode === "gallery" && catAttachments.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {catAttachments.map(p => (
              <div key={p.id}>
                {p.attachment_type === "image" ? (
                  <button
                    onClick={() => {
                      const imageUrls = catAttachments.filter(a => a.attachment_type === "image").map(a => a.attachment_url!);
                      const idx = imageUrls.indexOf(p.attachment_url!);
                      setGalleryLightbox({ urls: imageUrls, index: idx >= 0 ? idx : 0 });
                    }}
                    className="w-full rounded-xl overflow-hidden transition-opacity active:opacity-75"
                    style={{ aspectRatio: "1", display: "block" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.attachment_url!}
                      alt={p.attachment_name ?? p.title}
                      className="w-full h-full"
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ) : (
                  <a href={p.attachment_url!} target="_blank" rel="noopener noreferrer"
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-2 transition-opacity active:opacity-75"
                    style={{ aspectRatio: "1", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <FileText size={28} strokeWidth={1.5} style={{ color: "#F87171" }} />
                    <span className="text-[10px] font-mono px-2 text-center line-clamp-2" style={{ color: "#F87171" }}>
                      {p.attachment_name ?? "PDF"}
                    </span>
                  </a>
                )}
                <p className="text-[11px] mt-1.5 px-0.5 truncate" style={{ color: "var(--foreground-dim)" }}>{p.title}</p>
              </div>
            ))}
          </div>

          {/* Lightbox */}
          {galleryLightbox && (
            <PhotoLightbox
              urls={galleryLightbox.urls}
              initialIndex={galleryLightbox.index}
              onClose={() => setGalleryLightbox(null)}
            />
          )}
        </>
      )}

      {/* List */}
      {(viewMode === "list" || catAttachments.length === 0) && (filteredProtocols.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <BookOpen size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun protocole dans cette catégorie</p>
          {isManager && (
            <button onClick={() => openFormForCategory(selectedCategory)} className="mt-4 text-sm" style={{ color: "var(--accent)" }}>
              Créer le premier protocole
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProtocols.map(protocol => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              isManager={isManager}
              isExpanded={expanded.has(protocol.id)}
              isRead={reads.has(protocol.id)}
              onToggle={() => toggleExpanded(protocol.id)}
              onMarkRead={() => markAsRead(protocol.id)}
              onEdit={() => openEditForm(protocol)}
              onDelete={() => deleteProtocol(protocol.id)}
              onToggleDashboard={() => toggleDashboard(protocol)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

/* ── Photo lightbox — swipe, pinch zoom, double-tap, bouton fermer bas ── */
function PhotoLightbox({ urls, initialIndex, onClose }: { urls: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastPinchDist = useRef<number | null>(null);
  const lastTapTime = useRef(0);

  function getPinchDist(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      lastPinchDist.current = null;
    } else if (e.touches.length === 2) {
      lastPinchDist.current = getPinchDist(e);
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dist = getPinchDist(e);
      setScale(s => Math.min(Math.max(s * (dist / lastPinchDist.current!), 1), 5));
      lastPinchDist.current = dist;
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.changedTouches.length === 1 && scale < 1.15) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (Math.abs(dx) > 50 && dy < 80) {
        if (dx < 0 && index < urls.length - 1) { setIndex(i => i + 1); setScale(1); }
        else if (dx > 0 && index > 0) { setIndex(i => i - 1); setScale(1); }
        return;
      }
      const now = Date.now();
      if (now - lastTapTime.current < 300) setScale(s => s > 1 ? 1 : 2.5);
      lastTapTime.current = now;
    }
    lastPinchDist.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
      style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(8px)" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => { if (scale <= 1) onClose(); }}>

      {urls.length > 1 && index > 0 && (
        <button onClick={e => { e.stopPropagation(); setIndex(i => i - 1); setScale(1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 1 }}>
          <ChevronLeft size={20} />
        </button>
      )}
      {urls.length > 1 && index < urls.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIndex(i => i + 1); setScale(1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 1 }}>
          <ChevronRight size={20} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt=""
        draggable={false}
        className="rounded-xl"
        style={{
          objectFit: "contain",
          maxHeight: "72vh",
          maxWidth: "90vw",
          transform: `scale(${scale})`,
          transition: scale === 1 ? "transform 0.25s ease" : "none",
          touchAction: "none",
        }}
        onClick={e => e.stopPropagation()}
      />

      {urls.length > 1 && (
        <div className="flex gap-1.5 mt-5" onClick={e => e.stopPropagation()}>
          {urls.map((_, i) => (
            <button key={i} onClick={() => { setIndex(i); setScale(1); }}
              className="rounded-full transition-all"
              style={{ width: i === index ? 18 : 6, height: 6, background: i === index ? "#fff" : "rgba(255,255,255,0.35)" }} />
          ))}
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
        style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
        <X size={16} />Fermer
      </button>
    </div>
  );
}

interface ProtocolCardProps {
  protocol: Protocol;
  isManager: boolean;
  isExpanded: boolean;
  isRead: boolean;
  onToggle: () => void;
  onMarkRead: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleDashboard?: () => void;
}

function ProtocolCard({ protocol, isManager, isExpanded, isRead, onToggle, onMarkRead, onEdit, onDelete, onToggleDashboard }: ProtocolCardProps) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const needsValidation = !isManager && !isRead;
  const hasPdf = protocol.attachment_type === "pdf";
  const { gallery, steps: parsedSteps } = parseProtocolSteps(protocol.steps);
  const hasSteps = parsedSteps.length > 0;
  const stepPhotos = parsedSteps.filter(s => s.photo_url).map(s => s.photo_url!);
  const allPhotos = [
    ...(protocol.attachment_type === "image" && protocol.attachment_url ? [protocol.attachment_url] : []),
    ...gallery,
    ...stepPhotos,
  ];
  const hasImage = allPhotos.length > 0;
  const openLightbox = (url: string) => {
    const idx = allPhotos.indexOf(url);
    setLightbox({ urls: allPhotos, index: idx >= 0 ? idx : 0 });
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--background-elev)", border: `1px solid ${needsValidation && protocol.is_mandatory ? "rgba(239,68,68,0.3)" : "var(--border)"}` }}>

      <div onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-3 cursor-pointer">
        {!isManager && (
          <div className="flex-shrink-0 rounded-full mt-1.5" style={{
            width: 7, height: 7,
            background: isRead ? "var(--foreground-dim)" : protocol.is_mandatory ? "var(--danger)" : "var(--warning)",
            opacity: isRead ? 0.3 : 1,
          }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {protocol.is_mandatory && (
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}>
                Obligatoire
              </span>
            )}
            {hasPdf && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(239,68,68,0.08)", color: "#F87171" }}>
                <FileText size={9} /> PDF
              </span>
            )}
            {hasImage && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(6,182,212,0.08)", color: "#A1A1AA" }}>
                <Image size={9} /> {allPhotos.length > 1 ? `${allPhotos.length} photos` : "Photo"}
              </span>
            )}
            {hasSteps && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(139,92,246,0.08)", color: "#A78BFA" }}>
                <CheckCircle size={9} /> {parsedSteps.length} étapes
              </span>
            )}
            {isRead && !isManager && <CheckCircle size={12} style={{ color: "var(--success)" }} />}
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{protocol.title}</p>
          <div className="flex items-center gap-3 mt-1">
            {protocol.author_name && <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>{protocol.author_name}</span>}
            <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
              {new Date(protocol.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
            {isManager && protocol.read_count !== undefined && (
              <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                {protocol.read_count} lecture{protocol.read_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" style={{ marginTop: 2 }}>
          {isManager && isExpanded && (
            <>
              <button onClick={e => { e.stopPropagation(); onToggleDashboard?.(); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  color: protocol.show_on_dashboard ? "var(--accent)" : "var(--foreground-dim)",
                  background: protocol.show_on_dashboard ? "rgba(6,182,212,0.1)" : "var(--background-elev)",
                  border: `1px solid ${protocol.show_on_dashboard ? "rgba(6,182,212,0.3)" : "var(--border)"}`,
                }}>
                <LayoutDashboard size={10} />
                {protocol.show_on_dashboard ? "Affiché sur le dashboard" : "Afficher sur le dashboard"}
              </button>
              <button onClick={e => { e.stopPropagation(); onEdit?.(); }}
                className="p-1.5 rounded-base transition-opacity hover:opacity-100 opacity-50"
                style={{ color: "var(--accent)" }} title="Modifier">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete?.(); }}
                className="p-1.5 rounded-base transition-opacity hover:opacity-100 opacity-50"
                style={{ color: "var(--danger)" }} title="Supprimer">
                <Trash2 size={13} />
              </button>
            </>
          )}
          <span style={{ color: "var(--foreground-dim)" }}>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {hasImage && allPhotos.length > 0 && (
            <div>
              {/* Photo principale */}
              <div className="relative cursor-pointer" onClick={() => openLightbox(allPhotos[0])}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={allPhotos[0]}
                  alt={protocol.attachment_name ?? protocol.title}
                  className="w-full object-cover"
                  style={{ maxHeight: 320 }}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium backdrop-blur-sm"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  <ExternalLink size={11} /> {allPhotos.length > 1 ? `1 / ${allPhotos.length}` : "Ouvrir"}
                </div>
              </div>
              {/* Miniatures si plusieurs photos */}
              {allPhotos.length > 1 && (
                <div className="flex gap-2 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {allPhotos.map((url, idx) => (
                    <button key={idx} onClick={() => openLightbox(url)}
                      className="flex-shrink-0 rounded-lg overflow-hidden"
                      style={{ width: 72, height: 52, opacity: idx === 0 ? 1 : 0.75, outline: idx === 0 ? "2px solid var(--accent)" : "none" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {hasPdf && protocol.attachment_url && (
            <div>
              <div className="relative" style={{ height: 420 }}>
                <iframe
                  src={protocol.attachment_url}
                  className="w-full h-full"
                  style={{ border: "none" }}
                  title={protocol.attachment_name ?? protocol.title}
                />
              </div>
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ borderTop: "1px solid var(--border)", background: "var(--background-soft)" }}>
                <FileText size={13} style={{ color: "var(--foreground-dim)" }} />
                <span className="text-[12px] flex-1 truncate" style={{ color: "var(--foreground-dim)" }}>
                  {protocol.attachment_name ?? "document.pdf"}
                </span>
                <a href={protocol.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#F87171" }}>
                  <ExternalLink size={11} /> Ouvrir
                </a>
              </div>
            </div>
          )}
          {hasSteps && (
            <div className="px-5 py-4" style={{ borderTop: hasPdf || hasImage ? "1px solid var(--border)" : undefined }}>
              {/* (slider géré dans la section photos principale) */}
              <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
                Étapes
              </p>
              <ol className="space-y-2.5">
                {parsedSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-[11px] font-mono font-semibold rounded-md px-1.5 py-0.5 mt-0.5"
                      style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", minWidth: 24, textAlign: "center" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {step.photo_url && (
                        <button onClick={() => openLightbox(step.photo_url!)} className="mb-1.5 rounded-lg overflow-hidden block" style={{ width: 120, height: 80 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={step.photo_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      )}
                      <span className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{step.text}</span>
                      {step.frequency && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA" }}>
                          {STEP_FREQ_LABELS[step.frequency] ?? step.frequency}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {protocol.content && (
            <div className="px-5 py-4">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed"
                style={{ color: "var(--foreground-muted)" }}>
                {protocol.content}
              </pre>
            </div>
          )}
          {!isManager && (
            <div className="px-5 pb-5">
              {isRead ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
                  <CheckCircle size={15} /> <span>Lu et validé</span>
                </div>
              ) : (
                <button onClick={onMarkRead}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-md"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <CheckCircle size={15} /> J'ai lu et compris ce protocole
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {lightbox && (
        <PhotoLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

interface ProtocolFormProps {
  formTitle: string; setFormTitle: (v: string) => void;
  formContent: string; setFormContent: (v: string) => void;
  formCategory: string; setFormCategory: (v: string) => void;
  categories: CustomCategory[];
  formMandatory: boolean; setFormMandatory: (v: boolean) => void;
  formFile: File | null; setFormFile: (v: File | null) => void;
  formSteps: StepItem[]; setFormSteps: (v: StepItem[]) => void;
  formGallery: string[]; setFormGallery: (v: string[]) => void;
  establishmentId: string;
  extracting: boolean; onExtractSteps: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing?: boolean;
  submitting: boolean; onSubmit: () => void; onCancel: () => void;
  error?: string | null;
}

function ProtocolForm({
  formTitle, setFormTitle, formContent, setFormContent,
  formCategory, setFormCategory, categories, formMandatory, setFormMandatory,
  formFile, setFormFile, formSteps, setFormSteps, formGallery, setFormGallery,
  establishmentId, extracting, onExtractSteps,
  fileInputRef, handleFileChange,
  isEditing, submitting, onSubmit, onCancel, error,
}: ProtocolFormProps) {
  const [extractImage, setExtractImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("establishmentId", establishmentId);
      const res = await fetch("/api/protocols/upload-attachment", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.url) urls.push(json.url);
    }
    setFormGallery([...formGallery, ...urls]);
    setUploadingGallery(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleStepPhotoUpload = async (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStepIndex(stepIndex);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("establishmentId", establishmentId);
    const res = await fetch("/api/protocols/upload-attachment", { method: "POST", body: fd });
    const json = await res.json();
    if (res.ok && json.url) updateStep(stepIndex, "photo_url", json.url);
    setUploadingStepIndex(null);
    e.target.value = "";
  };

  useEffect(() => {
    if (!formFile || formFile.type === "application/pdf") {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formFile]);

  const updateStep = (index: number, field: keyof StepItem, value: string) => {
    const next = [...formSteps];
    next[index] = { ...next[index], [field]: value };
    setFormSteps(next);
  };

  const removeStep = (index: number) => {
    setFormSteps(formSteps.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setFormSteps([...formSteps, { text: "" }]);
  };

  return (
    <div className="rounded-xl p-5 mb-6" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
      <p className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>{isEditing ? "Modifier le protocole" : "Nouveau protocole"}</p>
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Titre</label>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Procédure de nettoyage"
            className="w-full px-3 py-2 text-sm rounded-md outline-none"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Contenu <span style={{ fontWeight: 400, textTransform: "none" }}>(optionnel si pièce jointe)</span></label>
          <textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Décrivez le protocole..."
            rows={3} className="w-full px-3 py-2 text-sm rounded-md outline-none resize-none"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>Pièce jointe <span style={{ fontWeight: 400, textTransform: "none" }}>PDF ou image (optionnel)</span></label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={extractImage}
                onChange={e => setExtractImage(e.target.checked)}
                className="rounded"
                style={{ accentColor: "#A78BFA", width: 13, height: 13 }}
              />
              <span className="text-[11px]" style={{ color: "#A78BFA" }}>Extraire les étapes avec l'IA</span>
            </label>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange} className="hidden" />
          {formFile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                style={{ background: "var(--background-soft)", border: "1px solid var(--accent)" }}>
                {formFile.type === "application/pdf"
                  ? <FileText size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  : <Image size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                <p className="text-sm flex-1 truncate" style={{ color: "var(--foreground)" }}>{formFile.name}</p>
                <button onClick={() => { setFormFile(null); setFormSteps([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>✕</button>
              </div>
              {formSteps.length === 0 && formFile.type === "application/pdf" && (
                <button onClick={onExtractSteps} disabled={extracting}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-opacity"
                  style={{
                    background: extracting ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    color: "#A78BFA",
                    opacity: extracting ? 0.7 : 1,
                  }}>
                  <Wand2 size={14} className={extracting ? "animate-spin" : ""} />
                  {extracting ? "Analyse IA en cours…" : "Analyser avec l'IA"}
                </button>
              )}
              {formFile.type !== "application/pdf" && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {previewUrl && <img src={previewUrl} alt="Aperçu" className="w-full rounded-md object-cover" style={{ maxHeight: 180 }} />}
                  {extractImage && formSteps.length === 0 && (
                    <button onClick={onExtractSteps} disabled={extracting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-opacity"
                      style={{
                        background: extracting ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.1)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        color: "#A78BFA",
                        opacity: extracting ? 0.7 : 1,
                      }}>
                      <Wand2 size={14} className={extracting ? "animate-spin" : ""} />
                      {extracting ? "Analyse IA en cours…" : "Analyser avec l'IA"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-md text-sm transition-colors"
              style={{ background: "var(--background-soft)", border: "1px dashed var(--border-strong)", color: "var(--foreground-dim)" }}>
              <Upload size={14} />
              Importer un PDF ou une image
            </button>
          )}
        </div>

        {/* Galerie photos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
              Photos <span style={{ fontWeight: 400, textTransform: "none" }}>({formGallery.length} ajoutée{formGallery.length !== 1 ? "s" : ""})</span>
            </label>
            <button type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-opacity"
              style={{ background: "rgba(6,182,212,0.1)", color: "#67E8F9", border: "1px solid rgba(6,182,212,0.2)", opacity: uploadingGallery ? 0.6 : 1 }}>
              {uploadingGallery ? <span className="animate-spin inline-block" style={{ fontSize: 11 }}>⟳</span> : <Plus size={11} />}
              {uploadingGallery ? "Upload…" : "Ajouter"}
            </button>
          </div>
          <input ref={galleryInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.heic" multiple onChange={handleGalleryChange} className="hidden" />
          {formGallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {formGallery.map((url, i) => (
                <div key={i} className="relative flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 80, height: 60 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setFormGallery(formGallery.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 rounded-full flex items-center justify-center"
                    style={{ width: 18, height: 18, background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Steps editor */}
        {formSteps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
                Étapes extraites
              </label>
                <button onClick={onExtractSteps} disabled={extracting}
                  className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-opacity"
                  style={{ color: "#A78BFA", opacity: extracting ? 0.5 : 1 }}>
                  <Wand2 size={10} /> {extracting ? "…" : "Ré-analyser"}
                </button>
            </div>
            <div className="space-y-1.5 rounded-xl p-3" style={{ background: "var(--background-soft)", border: "1px solid rgba(139,92,246,0.2)" }}>
              {formSteps.map((step, i) => (
                <div key={i} className="rounded-lg p-2.5 space-y-1.5" style={{ background: "var(--background)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-[11px] font-mono font-semibold rounded px-1.5 py-1"
                      style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", minWidth: 22, textAlign: "center" }}>
                      {i + 1}
                    </span>
                    <input
                      value={step.text}
                      onChange={e => updateStep(i, "text", e.target.value)}
                      className="flex-1 px-2 py-1 text-sm rounded outline-none"
                      style={{ background: "transparent", border: "1px solid transparent", color: "var(--foreground)" }}
                      onFocus={e => e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"}
                      onBlur={e => e.currentTarget.style.borderColor = "transparent"}
                      placeholder="Décrivez l'étape…"
                    />
                    <button onClick={() => removeStep(i)} className="flex-shrink-0 p-1 rounded opacity-40 hover:opacity-100"
                      style={{ color: "var(--foreground-dim)" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <select value={step.frequency ?? ""} onChange={e => updateStep(i, "frequency", e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-base outline-none"
                      style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: step.frequency ? "#A78BFA" : "var(--foreground-dim)" }}>
                      <option value="">Fréquence (optionnel)</option>
                      <option value="daily">Quotidien</option>
                      <option value="opening">Ouverture</option>
                      <option value="closing">Fermeture</option>
                      <option value="continuous">Continu</option>
                    </select>
                    {/* Photo par étape */}
                    {step.photo_url ? (
                      <div className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={step.photo_url} alt="" className="rounded object-cover flex-shrink-0" style={{ width: 36, height: 26 }} />
                        <button onClick={() => updateStep(i, "photo_url", "")}
                          className="flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1 text-[11px] px-2 py-1 rounded cursor-pointer flex-shrink-0"
                        style={{ background: "rgba(6,182,212,0.08)", color: uploadingStepIndex === i ? "rgba(103,232,249,0.5)" : "#67E8F9", border: "1px solid rgba(6,182,212,0.15)" }}>
                        {uploadingStepIndex === i
                          ? <span className="animate-spin inline-block text-[10px]">⟳</span>
                          : <Image size={11} />}
                        Photo
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => handleStepPhotoUpload(i, e)}
                          disabled={uploadingStepIndex !== null} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addStep}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[12px] mt-1 transition-opacity"
                style={{ color: "#A78BFA", border: "1px dashed rgba(139,92,246,0.3)" }}>
                <Plus size={11} /> Ajouter une étape
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Catégorie</label>
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setFormMandatory(!formMandatory)}
                className="relative flex-shrink-0 rounded-sm transition-colors cursor-pointer"
                style={{ width: 18, height: 18, background: formMandatory ? "var(--accent)" : "var(--background-soft)", border: `1px solid ${formMandatory ? "var(--accent)" : "var(--border)"}` }}>
                {formMandatory && (
                  <svg className="absolute inset-0 m-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#09090B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Obligatoire</span>
            </label>
          </div>
        </div>
        {error && (
          <p className="text-[12px] px-3 py-2 rounded-md" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onSubmit} disabled={submitting || !formTitle.trim()}
            className="px-4 py-2 text-sm font-medium rounded-md transition-opacity"
            style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (submitting || !formTitle.trim()) ? 0.5 : 1 }}>
            {submitting ? "Enregistrement…" : isEditing ? "Enregistrer" : "Créer"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md"
            style={{ background: "var(--background-soft)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
