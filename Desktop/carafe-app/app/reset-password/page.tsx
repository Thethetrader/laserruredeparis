"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
  confirm: z.string().min(1, "Confirmation requise"),
}).refine(data => data.password === data.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.");
      return;
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/FONDCLAIRLOGO.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8, mixBlendMode: "multiply" }} />
          <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
            Nouveau mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
              Nouveau mot de passe
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
              style={{
                background: "var(--background-soft)",
                border: errors.password ? "1px solid var(--danger)" : "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = errors.password ? "var(--danger)" : "var(--border)"}
            />
            {errors.password && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
              Confirmer le mot de passe
            </label>
            <input
              {...register("confirm")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
              style={{
                background: "var(--background-soft)",
                border: errors.confirm ? "1px solid var(--danger)" : "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={e => e.currentTarget.style.borderColor = errors.confirm ? "var(--danger)" : "var(--border)"}
            />
            {errors.confirm && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.confirm.message}</p>
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
            {isSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </button>
        </form>

        <p className="mt-8 text-[12px] text-center" style={{ color: "var(--foreground-dim)" }}>
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
