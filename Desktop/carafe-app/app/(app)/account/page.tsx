"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import { Camera, CheckCircle, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

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

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (DEV_MODE) {
      const mock: ProfileData = { id: "dev-user", first_name: "Dev", last_name: "Mode", avatar_url: null, email: "dev@carafe.app" };
      setProfile(mock);
      setFirstName(mock.first_name ?? "");
      setLastName(mock.last_name ?? "");
      setEstablishmentId("dev-establishment");
      setLoading(false);
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [profileRes, memberRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, avatar_url").eq("id", user.id).single(),
      supabase.from("establishment_members").select("establishment_id").eq("profile_id", user.id).eq("is_active", true).single(),
    ]);

    if (profileRes.data) {
      const p: ProfileData = { ...profileRes.data, email: user.email ?? "" };
      setProfile(p);
      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
    }
    if (memberRes.data) setEstablishmentId(memberRes.data.establishment_id);
    setLoading(false);
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    if (!DEV_MODE && profile) {
      setUploadingPhoto(true);
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;
      const { error } = await supabase.storage.from("profiles").upload(path, file, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("profiles").getPublicUrl(path);
        await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      }
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim()) return;
    setSaving(true);

    if (DEV_MODE) {
      setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    if (!profile) return;
    await supabase.from("profiles").update({ first_name: firstName.trim(), last_name: lastName.trim() }).eq("id", profile.id);
    setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const signOut = async () => {
    if (DEV_MODE) { router.push("/"); return; }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasChanges = profile && (firstName !== (profile.first_name ?? "") || lastName !== (profile.last_name ?? "") || avatarFile !== null);

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl">
        <div className="rounded-xl h-24 animate-pulse" style={{ background: "var(--background-elev)" }} />
      </div>
    );
  }

  if (!profile) return null;

  const displayAvatarUrl = avatarPreview ?? profile.avatar_url;

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <MonoLabel size="xs">Mon compte</MonoLabel>
        <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-75" style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
          <X size={15} />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <KarafAvatar
            firstName={firstName || profile.first_name}
            lastName={lastName || profile.last_name}
            avatarUrl={displayAvatarUrl}
            size={80}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center transition-opacity"
            style={{ width: 28, height: 28, background: "var(--accent)", color: "#09090B" }}>
            {uploadingPhoto
              ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Camera size={13} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handlePhotoChange} className="hidden" />
        </div>
        <p className="text-[11px] mt-3" style={{ color: "var(--foreground-dim)" }}>Appuie sur la caméra pour changer la photo</p>
      </div>

      {/* Name fields */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Informations personnelles</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Prénom</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-3 py-2 text-sm rounded-md outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Nom</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Ton nom de famille"
              className="w-full px-3 py-2 text-sm rounded-md outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>Email</label>
            <input
              value={profile.email}
              disabled
              className="w-full px-3 py-2 text-sm rounded-md outline-none"
              style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground-dim)", cursor: "not-allowed" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={saveProfile}
            disabled={saving || !hasChanges || !firstName.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-opacity"
            style={{ background: "var(--accent)", color: "#09090B", opacity: (saving || !hasChanges || !firstName.trim()) ? 0.4 : 1 }}>
            {saved
              ? <><CheckCircle size={14} /> Enregistré</>
              : saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-[12px]" style={{ color: "var(--success)" }}>✓ Modifications sauvegardées</span>}
        </div>
      </div>

      {/* Notifications */}
      {establishmentId && (
        <div className="rounded-xl px-5 py-4 mb-4 flex items-center justify-between gap-4"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>Notifications push</p>
            <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Reçois les alertes en temps réel</p>
          </div>
          <PushNotificationSetup establishmentId={establishmentId} />
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground-dim)" }}>
        <LogOut size={15} />
        Se déconnecter
      </button>
    </div>
  );
}
