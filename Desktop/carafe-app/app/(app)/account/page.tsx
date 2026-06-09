"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { Camera, CheckCircle, LogOut, X, Calendar, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { useDevRole } from "@/hooks/useDevRole";
import { revalidateLayoutCache } from "@/app/actions";

const DEV_MODE = false;

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const PERIODS_FR = ["Matin", "Après-midi", "Soir"];
const HOURS_FR = ["7h", "8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h", "23h"];

interface AvailabilitySlot {
  day: string;
  period: string;
  hour_start?: string;
  hour_end?: string;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string;
}

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [devRole] = useDevRole();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Contrat + disponibilités
  const [contractType, setContractType] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [savingAvail, setSavingAvail] = useState(false);
  const [savedAvail, setSavedAvail] = useState(false);

  // Éditeur de slot en cours
  const [editDay, setEditDay] = useState(DAYS_FR[4]); // Vendredi par défaut
  const [editPeriod, setEditPeriod] = useState(PERIODS_FR[2]); // Soir
  const [editHourStart, setEditHourStart] = useState("18h");
  const [editHourEnd, setEditHourEnd] = useState("23h");

  useEffect(() => {
    if (DEV_MODE) {
      const mock: ProfileData = { id: "dev-user", first_name: "Rayan", last_name: "Dupont", avatar_url: null, email: "rayan@restaurant.fr" };
      setProfile(mock);
      setFirstName(mock.first_name ?? "");
      setLastName(mock.last_name ?? "");
      setEstablishmentId("dev-establishment");
      // Simuler un contrat extra avec des dispos existantes
      const isEmployee = devRole === "employee";
      setContractType(isEmployee ? "extra" : "cdi");
      setAvailability(isEmployee ? [
        { day: "Vendredi", period: "Soir", hour_start: "18h", hour_end: "23h" },
        { day: "Samedi", period: "Soir", hour_start: "18h", hour_end: "23h" },
      ] : []);
      setLoading(false);
      return;
    }
    loadProfile();
  }, [devRole]);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [profileRes, memberRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, avatar_url, contract_type, availability").eq("id", user.id).single(),
      supabase.from("establishment_members")
        .select("id, establishment_id")
        .eq("profile_id", user.id).eq("is_active", true).single(),
    ]);

    if (profileRes.data) {
      const p: ProfileData = { ...profileRes.data, email: user.email ?? "" };
      setProfile(p);
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setContractType((profileRes.data as any).contract_type ?? null);
      setAvailability((profileRes.data as any).availability ?? []);
    }
    if (memberRes.data) {
      setEstablishmentId(memberRes.data.establishment_id);
      setMemberId(memberRes.data.id);
    }
    setLoading(false);
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    setPhotoError(null);
    setAvatarPreview(URL.createObjectURL(file));
    if (!DEV_MODE && profile) {
      setUploadingPhoto(true);
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `avatars/${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("profiles").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        setPhotoError(`Erreur upload: ${uploadError.message}`);
      } else {
        const { data: { publicUrl } } = supabase.storage.from("profiles").getPublicUrl(path);
        const urlWithBust = `${publicUrl}?t=${Date.now()}`;
        const { error: dbError } = await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", profile.id);
        if (dbError) {
          console.error("Profile update error:", dbError);
          setPhotoError(`Erreur sauvegarde: ${dbError.message}`);
        } else {
          setProfile(prev => prev ? { ...prev, avatar_url: urlWithBust } : prev);
          setAvatarPreview(urlWithBust);
          localStorage.setItem("karaf-avatar-url", urlWithBust);
          window.dispatchEvent(new CustomEvent("karaf-avatar-updated", { detail: urlWithBust }));
          await revalidateLayoutCache();
          router.refresh();
        }
      }
      setUploadingPhoto(false);
      setAvatarFile(null);
    } else {
      setAvatarFile(file);
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim()) return;
    setSaving(true);
    if (DEV_MODE) {
      setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev);
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); return;
    }
    if (!profile) return;
    await supabase.from("profiles").update({ first_name: firstName.trim(), last_name: lastName.trim() }).eq("id", profile.id);
    setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const addSlot = () => {
    const already = availability.some(s => s.day === editDay && s.period === editPeriod);
    if (already) return;
    setAvailability(prev => [...prev, { day: editDay, period: editPeriod, hour_start: editHourStart, hour_end: editHourEnd }]);
  };

  const removeSlot = (i: number) => setAvailability(prev => prev.filter((_, idx) => idx !== i));

  const saveAvailability = async () => {
    setSavingAvail(true);
    if (!DEV_MODE && profile) {
      await supabase.from("profiles").update({ availability } as any).eq("id", profile.id);
    }
    setSavingAvail(false); setSavedAvail(true); setTimeout(() => setSavedAvail(false), 2500);
  };

  const signOut = async () => {
    if (DEV_MODE) { router.push("/"); return; }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasChanges = profile && (firstName !== (profile.first_name ?? "") || lastName !== (profile.last_name ?? "") || avatarFile !== null);

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-lg">
        <div className="rounded-xl h-24 animate-pulse" style={{ background: "var(--background-elev)" }} />
      </div>
    );
  }

  if (!profile) return null;

  const displayAvatarUrl = avatarPreview ?? profile.avatar_url;

  return (
    <div className="px-4 py-8 lg:px-8 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <MonoLabel size="xs">Mon compte</MonoLabel>
        <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-75" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
          <X size={15} />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <KarafAvatar firstName={firstName || profile.first_name} lastName={lastName || profile.last_name} avatarUrl={displayAvatarUrl} size={80} />
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: "var(--accent)", color: "var(--primary-foreground)" }}>
            {uploadingPhoto ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Camera size={13} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
        </div>
        <p className="text-[11px] mt-3" style={{ color: "var(--foreground-dim)" }}>Appuie sur la caméra pour changer la photo</p>
        {photoError && <p className="text-[11px] mt-1 text-center" style={{ color: "#ef4444" }}>{photoError}</p>}
        {contractType && (
          <span className="mt-2 text-[11px] font-mono px-2 py-0.5 rounded"
            style={{ background: contractType === "extra" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.08)", color: contractType === "extra" ? "var(--warning)" : "var(--accent)" }}>
            {{ cdi: "CDI", cdd: "CDD", extra: "Extra" }[contractType] ?? contractType}
          </span>
        )}
      </div>

      {/* Infos personnelles */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Informations personnelles</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Prénom</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ton prénom" className="w-full px-3 py-2 text-sm rounded-md outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Nom</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ton nom de famille" className="w-full px-3 py-2 text-sm rounded-md outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Email</label>
            <input value={profile.email} disabled className="w-full px-3 py-2 text-sm rounded-md outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)", cursor: "not-allowed" }} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveProfile} disabled={saving || !hasChanges || !firstName.trim()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-opacity" style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (saving || !hasChanges || !firstName.trim()) ? 0.4 : 1 }}>
            {saved ? <><CheckCircle size={14} /> Enregistré</> : saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-[12px]" style={{ color: "var(--success)" }}>✓ Sauvegardé</span>}
        </div>
      </div>

      {/* Disponibilités — affiché pour tous mais surtout utile pour les extras */}
      {(contractType === "extra" || contractType === null) && (
        <div className="rounded-xl p-5 mb-4" style={{ background: "var(--background-elev)", border: "1px solid rgba(6,182,212,0.3)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Mes disponibilités</p>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--foreground-dim)" }}>
            Le manager peut consulter tes créneaux disponibles pour planifier les services.
          </p>

          {/* Créneaux existants */}
          {availability.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
                  <div className="text-left">
                    <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>{slot.day}</p>
                    <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>
                      {slot.period}{slot.hour_start && slot.hour_end ? ` · ${slot.hour_start}–${slot.hour_end}` : ""}
                    </p>
                  </div>
                  <button onClick={() => removeSlot(i)} className="ml-1 flex-shrink-0" style={{ color: "rgba(6,182,212,0.6)" }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {availability.length === 0 && (
            <p className="text-[12px] mb-4 text-center py-3 rounded-lg" style={{ color: "var(--foreground-dim)", background: "var(--background-soft)", border: "1px dashed var(--border)" }}>
              Aucun créneau ajouté
            </p>
          )}

          {/* Ajouter un créneau */}
          <div className="rounded-xl p-3 mb-3" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>Ajouter un créneau</p>

            {/* Jours */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DAYS_FR.map(d => (
                <button key={d} onClick={() => setEditDay(d)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                  style={{ background: editDay === d ? "rgba(6,182,212,0.15)" : "var(--background-elev)", color: editDay === d ? "var(--accent)" : "var(--foreground-dim)", border: editDay === d ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Périodes */}
            <div className="flex gap-1.5 mb-2">
              {PERIODS_FR.map(p => (
                <button key={p} onClick={() => setEditPeriod(p)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                  style={{ background: editPeriod === p ? "rgba(6,182,212,0.15)" : "var(--background-elev)", color: editPeriod === p ? "var(--accent)" : "var(--foreground-dim)", border: editPeriod === p ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--border)" }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Heures */}
            <div className="flex items-center gap-2 mb-3">
              <select value={editHourStart} onChange={e => setEditHourStart(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] rounded-lg outline-none" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>→</span>
              <select value={editHourEnd} onChange={e => setEditHourEnd(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] rounded-lg outline-none" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {HOURS_FR.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <button onClick={addSlot}
              disabled={availability.some(s => s.day === editDay && s.period === editPeriod)}
              className="w-full py-2 text-[12px] font-semibold rounded-lg transition-opacity"
              style={{ background: "var(--accent)", color: "#fff", opacity: availability.some(s => s.day === editDay && s.period === editPeriod) ? 0.4 : 1 }}>
              {availability.some(s => s.day === editDay && s.period === editPeriod) ? "Créneau déjà ajouté" : `+ Ajouter ${editDay.slice(0, 3)} ${editPeriod} ${editHourStart}–${editHourEnd}`}
            </button>
          </div>

          {/* Sauvegarder */}
          <button onClick={saveAvailability} disabled={savingAvail}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-opacity"
            style={{ background: savedAvail ? "rgba(16,185,129,0.9)" : "var(--accent)", color: "#fff", opacity: savingAvail ? 0.6 : 1 }}>
            {savedAvail ? <><Check size={14} /> Disponibilités enregistrées</> : savingAvail ? "Enregistrement…" : "Enregistrer mes disponibilités"}
          </button>
        </div>
      )}

      {/* Notifications */}
      {establishmentId && (
        <div className="rounded-xl px-5 py-4 mb-4 flex items-center justify-between gap-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>Notifications push</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Reçois les alertes en temps réel</p>
          </div>
          <PushNotificationSetup establishmentId={establishmentId} />
        </div>
      )}

      {/* Déconnexion */}
      <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
        <LogOut size={15} />
        Se déconnecter
      </button>
    </div>
  );
}
