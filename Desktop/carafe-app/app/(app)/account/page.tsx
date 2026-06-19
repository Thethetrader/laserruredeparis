"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils/compress-image";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { Camera, CheckCircle, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { useDevRole } from "@/hooks/useDevRole";
import { revalidateLayoutCache } from "@/app/actions";

const DEV_MODE = false;

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string;
  phone: string | null;
}

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [devRole] = useDevRole();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [contractType, setContractType] = useState<string | null>(null);

  useEffect(() => {
    if (DEV_MODE) {
      const mock: ProfileData = { id: "dev-user", first_name: "Rayan", last_name: "Dupont", avatar_url: null, email: "rayan@restaurant.fr" };
      setProfile(mock);
      setFirstName(mock.first_name ?? "");
      setLastName(mock.last_name ?? "");
      setEstablishmentId("dev-establishment");
      // Simuler un contrat extra avec des dispos existantes
      setContractType(devRole === "employee" ? "extra" : "cdi");
      setLoading(false);
      return;
    }
    loadProfile();
  }, [devRole]);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [profileRes, memberRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, avatar_url, phone, contract_type").eq("id", user.id).single(),
      supabase.from("establishment_members")
        .select("id, establishment_id")
        .eq("profile_id", user.id).eq("is_active", true).single(),
    ]);

    if (profileRes.data) {
      const p: ProfileData = { ...profileRes.data, email: user.email ?? "" };
      setProfile(p);
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setPhone((profileRes.data as any).phone ?? "");
      setContractType((profileRes.data as any).contract_type ?? null);
    }
    if (memberRes.data) {
      setEstablishmentId(memberRes.data.establishment_id);
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
      const compressed = await compressImage(file, 400, 0.82);
      const path = `${profile.id}.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        setPhotoError(`Erreur upload: ${uploadError.message}`);
      } else {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
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
    await supabase.from("profiles").update({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() || null } as any).eq("id", profile.id);
    setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const signOut = async () => {
    if (DEV_MODE) { router.push("/"); return; }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasChanges = profile && (firstName !== (profile.first_name ?? "") || lastName !== (profile.last_name ?? "") || phone !== (profile.phone ?? "") || avatarFile !== null);

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
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Téléphone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 00 00 00 00" type="tel" className="w-full px-3 py-2 text-sm rounded-md outline-none" style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }} onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"} onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveProfile} disabled={saving || !hasChanges || !firstName.trim()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-opacity" style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: (saving || !hasChanges || !firstName.trim()) ? 0.4 : 1 }}>
            {saved ? <><CheckCircle size={14} /> Enregistré</> : saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-[12px]" style={{ color: "var(--success)" }}>✓ Sauvegardé</span>}
        </div>
      </div>

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
