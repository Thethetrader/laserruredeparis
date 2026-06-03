"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users } from "lucide-react";

const directorSchema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  establishment_name: z.string().min(2, "Nom de l'établissement requis"),
  email: z.string().email("Adresse email invalide"),
});

const memberSchema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

type DirectorData = z.infer<typeof directorSchema>;
type MemberData = z.infer<typeof memberSchema>;
type Size = "small" | "large";

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const isInvite = !!inviteToken;

  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [size, setSize] = useState<Size>("small");

  const directorForm = useForm<DirectorData>({ resolver: zodResolver(directorSchema) });
  const memberForm = useForm<MemberData>({ resolver: zodResolver(memberSchema) });

  const onSubmitDirector = async (data: DirectorData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "signup",
          size,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          establishment_name: data.establishment_name,
        }),
      });

      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Erreur. Réessayez."); return; }
      if (!json.url) { setServerError("Lien de paiement manquant. Réessayez."); return; }
      window.location.href = json.url;
    } catch {
      setServerError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    }
  };

  const onSubmitMember = async (data: MemberData) => {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { first_name: data.first_name, last_name: data.last_name } },
    });
    if (error) { setServerError(error.message ?? "Erreur. Réessayez."); return; }
    router.push(`/invite/${inviteToken}`);
    router.refresh();
  };

  const directorFields = [
    { name: "first_name" as const, label: "Prénom", type: "text", placeholder: "Marie" },
    { name: "last_name" as const, label: "Nom", type: "text", placeholder: "Dupont" },
    { name: "establishment_name" as const, label: "Nom de votre établissement", type: "text", placeholder: "Le Comptoir des Halles" },
    { name: "email" as const, label: "Email", type: "email", placeholder: "marie@restaurant.fr" },
  ];

  const memberFields = [
    { name: "first_name" as const, label: "Prénom", type: "text", placeholder: "Marie" },
    { name: "last_name" as const, label: "Nom", type: "text", placeholder: "Dupont" },
    { name: "email" as const, label: "Email", type: "email", placeholder: "marie@restaurant.fr" },
    { name: "password" as const, label: "Mot de passe", type: "password", placeholder: "8 caractères minimum" },
  ];

  if (isInvite) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = memberForm;
    return (
      <>
        <p className="mt-1.5 text-[13px] mb-10" style={{ color: "var(--foreground-dim)" }}>
          Créez votre compte pour rejoindre l&apos;équipe
        </p>
        <form onSubmit={handleSubmit(onSubmitMember)} className="space-y-4">
          {memberFields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>{label}</label>
              <input {...register(name)} type={type} placeholder={placeholder}
                className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
                style={{ background: "var(--background-soft)", border: errors[name] ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = errors[name] ? "var(--danger)" : "var(--border)"} />
              {errors[name] && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors[name]?.message}</p>}
            </div>
          ))}
          {serverError && <p className="text-[12px] px-3 py-2 rounded-base" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-2.5 text-sm font-medium rounded-base transition-opacity" style={{ background: "var(--accent)", color: "#09090B", opacity: isSubmitting ? 0.6 : 1 }}>
            {isSubmitting ? "Création…" : "Créer mon compte"}
          </button>
        </form>
      </>
    );
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = directorForm;
  const price = size === "small" ? "29€/mois" : "39€/mois";

  return (
    <>
      <p className="mt-1.5 text-[13px] mb-8" style={{ color: "var(--foreground-dim)" }}>
        Abonnement mensuel · Sans engagement
      </p>

      {/* Sélecteur de taille */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
          Taille de votre équipe
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["small", "large"] as Size[]).map((s) => {
            const active = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className="flex flex-col items-start px-4 py-3 rounded-base text-left transition-colors"
                style={{
                  background: active ? "rgba(6,182,212,0.08)" : "var(--background-soft)",
                  border: active ? "1px solid rgba(6,182,212,0.4)" : "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={12} style={{ color: active ? "var(--accent)" : "var(--foreground-dim)" }} />
                  <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: active ? "var(--accent)" : "var(--foreground-dim)" }}>
                    {s === "small" ? "< 20" : "≥ 20"}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {s === "small" ? "29€" : "39€"}<span className="text-[11px] font-normal" style={{ color: "var(--foreground-dim)" }}>/mois</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitDirector)} className="space-y-4">
        {directorFields.map(({ name, label, type, placeholder }) => (
          <div key={name}>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>{label}</label>
            <input {...register(name)} type={type} placeholder={placeholder}
              className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
              style={{ background: "var(--background-soft)", border: errors[name] ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = errors[name] ? "var(--danger)" : "var(--border)"} />
            {errors[name] && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors[name]?.message}</p>}
          </div>
        ))}
        {serverError && <p className="text-[12px] px-3 py-2 rounded-base" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{serverError}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full py-2.5 text-sm font-medium rounded-base transition-opacity" style={{ background: "var(--accent)", color: "#09090B", opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting ? "Redirection…" : `Continuer · ${price}`}
        </button>
        <p className="text-center text-[11px]" style={{ color: "var(--foreground-dim)" }}>
          Paiement sécurisé par Stripe · Votre mot de passe sera créé après le paiement
        </p>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8 }} />
        </div>
        <Suspense fallback={null}>
          <SignupInner />
        </Suspense>
        <p className="mt-8 text-[12px] text-center" style={{ color: "var(--foreground-dim)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
