"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Nom requis (2 caractères minimum)"),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Size = "small" | "large";

export default function AddEstablishmentPage() {
  const router = useRouter();
  const [size, setSize] = useState<Size>("small");
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "add_establishment",
        size,
        establishment_name: data.name,
        city: data.city ?? "",
      }),
    });

    const json = await res.json();
    if (!res.ok) { setServerError(json.error ?? "Erreur. Réessayez."); return; }
    window.location.href = json.url;
  };

  const price = size === "small" ? "19€/mois" : "29€/mois";

  return (
    <div className="px-4 py-8 lg:px-8 max-w-md">
      <Link href="/establishment/switch" className="inline-flex items-center gap-2 mb-8 text-[13px]" style={{ color: "var(--foreground-dim)" }}>
        <ArrowLeft size={14} />
        Retour
      </Link>

      <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>Établissements</p>
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>Ajouter un établissement</h1>
      <p className="text-sm mb-8" style={{ color: "var(--foreground-dim)" }}>
        Un abonnement sera créé pour ce nouvel établissement.
      </p>

      {/* Sélecteur de taille */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--foreground-dim)" }}>
          Taille de l&apos;équipe
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
                  {s === "small" ? "19€" : "29€"}<span className="text-[11px] font-normal" style={{ color: "var(--foreground-dim)" }}>/mois</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
            Nom de l&apos;établissement
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="La Brasserie du Port"
            className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
            style={{ background: "var(--background-soft)", border: errors.name ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = errors.name ? "var(--danger)" : "var(--border)"}
          />
          {errors.name && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
            Ville <span style={{ color: "var(--foreground-dim)", fontWeight: 400 }}>(optionnel)</span>
          </label>
          <input
            {...register("city")}
            type="text"
            placeholder="Paris"
            className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
          />
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
          {isSubmitting ? "Redirection…" : `Continuer · ${price}`}
        </button>
        <p className="text-center text-[11px]" style={{ color: "var(--foreground-dim)" }}>
          Paiement sécurisé par Stripe
        </p>
      </form>
    </div>
  );
}
