"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

const DEV_MODE = false;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setServerError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }
    if (inviteToken) {
      router.push(`/invite/${inviteToken}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <>
      {/* Dev mode bypass */}
      {DEV_MODE && (
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 text-sm font-medium rounded-base flex items-center justify-center gap-2 transition-colors"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", color: "var(--accent)" }}
          >
            <span className="font-mono text-[10px] tracking-widest uppercase">DEV</span>
            Accès direct sans identifiant
          </button>
          <div className="flex items-center gap-3 mt-5 mb-1">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--foreground-dim)" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            style={{ background: "var(--background-soft)", border: errors.email ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = errors.email ? "var(--danger)" : "var(--border)"}
          />
          {errors.email && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-[11px] mono" style={{ color: "var(--foreground-dim)" }}>
              Oublié ?
            </Link>
          </div>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3 py-2.5 text-sm rounded-base outline-none transition-colors"
            style={{ background: "var(--background-soft)", border: errors.password ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = errors.password ? "var(--danger)" : "var(--border)"}
          />
          {errors.password && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>}
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
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-8 text-[12px] text-center" style={{ color: "var(--foreground-dim)" }}>
        Pas encore de compte ?{" "}
        <Link href="/signup" style={{ color: "var(--accent)" }}>
          Créer un compte
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] mb-8 transition-opacity hover:opacity-70" style={{ color: "var(--foreground-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l&apos;accueil
        </Link>
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8 }} />
          <p className="text-[13px] mt-1.5" style={{ color: "var(--foreground-dim)" }}>
            Connexion à votre espace
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
