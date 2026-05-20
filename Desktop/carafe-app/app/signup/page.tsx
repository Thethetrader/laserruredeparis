"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  establishment_name: z.string().min(2, "Nom de l'établissement requis"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { first_name: data.first_name, last_name: data.last_name },
      },
    });

    if (signupError || !authData.user) {
      setServerError(signupError?.message ?? "Une erreur est survenue. Réessayez.");
      return;
    }

    // Create establishment
    const { data: estab, error: estabError } = await supabase
      .from("establishments")
      .insert({ name: data.establishment_name, owner_id: authData.user.id })
      .select()
      .single();

    if (estabError || !estab) {
      setServerError("Compte créé, mais erreur lors de la création de l'établissement.");
      return;
    }

    // Add owner as member
    await supabase.from("establishment_members").insert({
      establishment_id: estab.id,
      profile_id: authData.user.id,
      role: "owner",
    });

    router.push("/dashboard");
    router.refresh();
  };

  const fields = [
    { name: "first_name" as const, label: "Prénom", type: "text", placeholder: "Marie" },
    { name: "last_name" as const, label: "Nom", type: "text", placeholder: "Dupont" },
    { name: "establishment_name" as const, label: "Nom de votre établissement", type: "text", placeholder: "Le Comptoir des Halles" },
    { name: "email" as const, label: "Email", type: "email", placeholder: "marie@restaurant.fr" },
    { name: "password" as const, label: "Mot de passe", type: "password", placeholder: "8 caractères minimum" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <span className="font-mono text-[13px] tracking-widest uppercase" style={{ color: "var(--accent)" }}>
            [ CARAFE ]
          </span>
          <p className="mt-1.5 text-[13px]" style={{ color: "var(--foreground-dim)" }}>
            14 jours gratuits · Sans carte bancaire
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                {label}
              </label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
                style={{
                  background: "var(--background-soft)",
                  border: errors[name] ? "1px solid var(--danger)" : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = errors[name] ? "var(--danger)" : "var(--border)"}
              />
              {errors[name] && (
                <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors[name]?.message}</p>
              )}
            </div>
          ))}

          {serverError && (
            <p className="text-[12px] px-3 py-2 rounded-base" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium rounded-base transition-opacity"
            style={{ background: "var(--accent)", color: "#09090B", opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? "Création…" : "Créer mon compte"}
          </button>
        </form>

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
