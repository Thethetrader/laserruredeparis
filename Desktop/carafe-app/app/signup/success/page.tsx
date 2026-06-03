"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"waiting" | "ready" | "error">("waiting");

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }

    // Poll until the webhook has created the account (max 15s)
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch(`/api/stripe/checkout/status?session_id=${sessionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ready) { clearInterval(interval); setStatus("ready"); }
      }
      if (attempts >= 15) { clearInterval(interval); setStatus("ready"); }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (status === "waiting") {
    return (
      <div className="text-center">
        <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <p className="text-[15px] font-medium mb-2" style={{ color: "var(--foreground)" }}>Activation en cours…</p>
        <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Votre compte est en cours de création.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <CheckCircle size={28} style={{ color: "#10B981" }} />
        </div>
      </div>
      <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>Paiement confirmé !</p>
      <p className="text-[13px] mb-8" style={{ color: "var(--foreground-dim)" }}>
        Votre compte a été créé. Connectez-vous pour accéder à l&apos;application.
      </p>
      <Link href="/login" className="inline-block w-full py-2.5 text-sm font-medium rounded-base text-center" style={{ background: "var(--accent)", color: "#09090B" }}>
        Se connecter
      </Link>
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
