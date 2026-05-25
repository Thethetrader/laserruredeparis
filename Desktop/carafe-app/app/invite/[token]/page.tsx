"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  employee: "Employé",
};

interface InviteData {
  id: string;
  role: string;
  status: string;
  establishment_name: string;
  establishment_city: string;
  invited_by: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [inviteRes, { data: { user } }] = await Promise.all([
        fetch(`/api/invitations/${token}`),
        supabase.auth.getUser(),
      ]);
      const data = await inviteRes.json();
      if (inviteRes.ok) setInvite(data);
      else setError(data.error ?? "Invitation introuvable");
      setIsLoggedIn(!!user);
      setLoading(false);
    }
    load();
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    const res = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setError(data.error ?? "Erreur lors de l'acceptation");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (!invite || invite.status === "expired" || invite.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            {invite?.status === "accepted" ? "Invitation déjà utilisée" : "Invitation invalide"}
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-dim)" }}>
            {invite?.status === "accepted"
              ? "Ce lien a déjà été utilisé."
              : invite?.status === "expired"
              ? "Ce lien d'invitation a expiré (7 jours)."
              : error ?? "Ce lien n'existe pas."}
          </p>
          <Link href="/login" className="inline-block px-5 py-2.5 text-sm font-medium rounded-md"
            style={{ background: "var(--accent)", color: "#09090B" }}>
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karaf" style={{ height: 52, width: "auto" }} />
        </div>

        {accepted ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>Bienvenue dans l&apos;équipe !</p>
            <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Redirection en cours…</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>
                Invitation
              </p>
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                {invite.establishment_name}
              </p>
              {invite.establishment_city && (
                <p className="text-sm mb-4" style={{ color: "var(--foreground-dim)" }}>{invite.establishment_city}</p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-1 rounded"
                  style={{ background: invite.role === "manager" ? "rgba(139,92,246,0.12)" : "rgba(161,161,170,0.1)", color: invite.role === "manager" ? "#8B5CF6" : "var(--foreground-dim)" }}>
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </span>
                <span className="text-sm" style={{ color: "var(--foreground-dim)" }}>
                  · Invité par <span style={{ color: "var(--foreground)" }}>{invite.invited_by}</span>
                </span>
              </div>
            </div>

            {error && (
              <p className="text-[12px] px-3 py-2 rounded-md mb-4" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </p>
            )}

            {isLoggedIn ? (
              <button onClick={accept} disabled={accepting}
                className="w-full py-3 text-sm font-medium rounded-md transition-opacity"
                style={{ background: "var(--accent)", color: "#09090B", opacity: accepting ? 0.6 : 1 }}>
                {accepting ? "Acceptation…" : "Rejoindre l'équipe"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center mb-4" style={{ color: "var(--foreground-muted)" }}>
                  Connecte-toi pour rejoindre <strong style={{ color: "var(--foreground)" }}>{invite.establishment_name}</strong>
                </p>
                <Link href={`/signup?invite=${token}`}
                  className="block w-full py-3 text-sm font-medium rounded-md text-center"
                  style={{ background: "var(--accent)", color: "#09090B" }}>
                  Créer un compte
                </Link>
                <Link href={`/login?invite=${token}`}
                  className="block w-full py-3 text-sm font-medium rounded-md text-center"
                  style={{ background: "var(--background-soft)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                  J&apos;ai déjà un compte
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
