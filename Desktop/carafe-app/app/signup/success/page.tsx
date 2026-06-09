"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) {
    return <p className="text-sm text-center" style={{ color: "var(--danger)" }}>Lien invalide.</p>;
  }

  const handleCreate = async () => {
    if (password.length < 8) { setError("8 caractères minimum"); return; }
    setError(null);
    setStatus("loading");

    const res = await fetch("/api/stripe/checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, password }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erreur. Réessayez."); setStatus("idle"); return; }

    setStatus("done");
    setTimeout(() => router.push("/login"), 2000);
  };

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <CheckCircle size={28} style={{ color: "#10B981" }} />
          </div>
        </div>
        <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Compte créé !</p>
        <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Redirection vers la connexion…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)" }}>
          <CheckCircle size={24} style={{ color: "var(--accent)" }} />
        </div>
      </div>
      <p className="text-[16px] font-semibold mb-1 text-center" style={{ color: "var(--foreground)" }}>Paiement confirmé !</p>
      <p className="text-[13px] mb-8 text-center" style={{ color: "var(--foreground-dim)" }}>
        Créez votre mot de passe pour finaliser votre compte.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--foreground-dim)" }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            className="w-full px-3 py-2.5 text-sm rounded-base outline-none"
            style={{ background: "var(--background-soft)", border: error ? "1px solid var(--danger)" : "1px solid var(--border)", color: "var(--foreground)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)"}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
          />
          {error && <p className="mt-1 text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>}
        </div>

        <button
          onClick={handleCreate}
          disabled={status === "loading"}
          className="w-full py-2.5 text-sm font-medium rounded-base transition-opacity flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: status === "loading" ? 0.6 : 1 }}
        >
          {status === "loading" ? <><Loader2 size={14} className="animate-spin" />Création…</> : "Créer mon compte"}
        </button>
      </div>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karaf" style={{ height: 64, width: "auto", marginBottom: 8 }} />
        </div>
        <Suspense fallback={null}>
          <SuccessInner />
        </Suspense>
      </div>
    </div>
  );
}
