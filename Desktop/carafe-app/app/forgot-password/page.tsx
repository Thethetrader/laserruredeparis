"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + "/auth/callback?next=/reset-password",
    });
    if (error) {
      setServerError("Une erreur est survenue. Vérifiez votre adresse email.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8 }} />
          <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
            Réinitialisation du mot de passe
          </p>
        </div>

        {sent ? (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "#10B981" }}>
              Email envoyé
            </p>
            <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
              Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-[13px] mb-6" style={{ color: "var(--foreground-dim)" }}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="vous@restaurant.fr"
                className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
                style={{
                  background: "var(--background-soft)",
                  border: errors.email ? "1px solid var(--danger)" : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={e => e.currentTarget.style.borderColor = errors.email ? "var(--danger)" : "var(--border)"}
              />
              {errors.email && (
                <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>
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
              {isSubmitting ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <p className="mt-8 text-[12px] text-center" style={{ color: "var(--foreground-dim)" }}>
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
