"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nom de l'établissement requis (2 caractères minimum)"),
  city: z.string().min(1, "Ville requise"),
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const establishmentName = watch("name");

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: estab, error: estabError } = await supabase
      .from("establishments")
      .insert({ name: data.name, city: data.city, owner_id: user.id })
      .select()
      .single();

    if (estabError || !estab) {
      setServerError("Erreur lors de la création de l'établissement. Réessayez.");
      return;
    }

    const { error: memberError } = await supabase.from("establishment_members").insert({
      establishment_id: estab.id,
      profile_id: user.id,
      role: "owner",
    });

    if (memberError) {
      setServerError("Établissement créé, mais erreur lors de l'ajout du membre.");
      return;
    }

    setStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/FONDCLAIRLOGO.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8, mixBlendMode: "multiply" }} />
          <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
            Bienvenue configurons votre espace
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-[11px] font-mono font-medium"
                style={{
                  width: 24,
                  height: 24,
                  background: step >= s ? "var(--accent)" : "var(--background-elev)",
                  border: step >= s ? "none" : "1px solid var(--border)",
                  color: step >= s ? "#09090B" : "var(--foreground-dim)",
                }}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className="flex-1 h-px"
                  style={{
                    width: 40,
                    background: step > s ? "var(--accent)" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <p className="text-[15px] font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Votre établissement
              </p>
              <p className="text-[13px] mb-6" style={{ color: "var(--foreground-dim)" }}>
                Donnez un nom à votre restaurant, bar ou café.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                Nom de l&apos;établissement
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Le Comptoir des Halles"
                className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
                style={{
                  background: "var(--background-soft)",
                  border: errors.name ? "1px solid var(--danger)" : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = errors.name ? "var(--danger)" : "var(--border)"}
              />
              {errors.name && (
                <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                Ville
              </label>
              <input
                {...register("city")}
                type="text"
                placeholder="Paris"
                className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
                style={{
                  background: "var(--background-soft)",
                  border: errors.city ? "1px solid var(--danger)" : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = errors.city ? "var(--danger)" : "var(--border)"}
              />
              {errors.city && (
                <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.city.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-[12px] px-3 py-2 rounded-base" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-medium rounded-base transition-opacity"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? "Création…" : "Créer mon établissement"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <div className="flex justify-center mb-6">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <CheckCircle size={28} style={{ color: "#10B981" }} />
              </div>
            </div>
            <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              C&apos;est parti !
            </p>
            <p className="text-[13px] mb-1" style={{ color: "var(--foreground-dim)" }}>
              <span style={{ color: "var(--foreground)" }}>{establishmentName}</span> a été créé avec succès.
            </p>
            <p className="text-[13px] mb-8" style={{ color: "var(--foreground-dim)" }}>
              Votre espace est prêt à être configuré.
            </p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-2.5 text-sm font-medium rounded-base text-center transition-opacity"
              style={{ background: "var(--accent)", color: "var(--primary-foreground)" }}
            >
              Accéder à l&apos;app
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
