"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { CheckCircle, Building2, Plus } from "lucide-react";
import type { UserRole } from "@/lib/types/database";

const DEV_MODE = false;

interface EstablishmentOption {
  id: string;
  name: string;
  city: string | null;
  role: UserRole;
}

const DEV_ESTABLISHMENTS: EstablishmentOption[] = [
  { id: "dev-establishment",   name: "Le Comptoir Dev",   city: "Paris",    role: "owner" },
  { id: "dev-establishment-2", name: "La Brasserie Test", city: "Lyon",     role: "manager" },
  { id: "dev-establishment-3", name: "Chez Marcel",       city: "Bordeaux", role: "employee" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Propriétaire",
  manager: "Manager",
  employee: "Employé",
};

const ROLE_STYLE: Record<UserRole, { color: string }> = {
  owner: { color: "var(--accent)" },
  manager: { color: "var(--accent)" },
  employee: { color: "var(--foreground-dim)" },
};

function SwitchEstablishmentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justAdded = searchParams.get("added") === "1";
  const supabase = createClient();
  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) {
      setEstablishments(DEV_ESTABLISHMENTS);
      const stored = localStorage.getItem("active_establishment_id") ?? "dev-establishment";
      setActiveId(stored);
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("establishment_members")
      .select("role, establishments(id, name, city)")
      .eq("profile_id", user.id)
      .eq("is_active", true);

    const mapped: EstablishmentOption[] = (data ?? [])
      .filter((m: { establishments: unknown }) => m.establishments)
      .map((m: {
        role: UserRole;
        establishments: { id: string; name: string; city: string | null };
      }) => ({
        id: m.establishments.id,
        name: m.establishments.name,
        city: m.establishments.city,
        role: m.role,
      }));

    setEstablishments(mapped);

    const stored = localStorage.getItem("active_establishment_id");
    const validId = (stored && mapped.find(e => e.id === stored)) ? stored : mapped[0]?.id;
    if (validId) {
      setActiveId(validId);
      document.cookie = `active_establishment_id=${validId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    setLoading(false);
  }

  const selectEstablishment = (id: string) => {
    localStorage.setItem("active_establishment_id", id);
    document.cookie = `active_establishment_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setActiveId(id);
    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "var(--background-elev)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8 max-w-md">
      <MonoLabel size="xs" className="mb-6 block">Établissements</MonoLabel>
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Changer d&apos;établissement
        </h1>
        <Link
          href="/establishment/add"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-[12px] font-medium transition-colors"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          <Plus size={13} />
          Ajouter
        </Link>
      </div>
      {justAdded && (
        <p className="text-[12px] px-3 py-2 rounded-base mb-4" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
          Établissement ajouté avec succès.
        </p>
      )}
      <p className="text-sm mb-8" style={{ color: "var(--foreground-dim)" }}>
        Sélectionnez l&apos;établissement que vous souhaitez gérer.
      </p>

      {establishments.length === 0 ? (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
        >
          <Building2 size={32} strokeWidth={1} style={{ color: "var(--foreground-dim)", marginBottom: 12 }} />
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Aucun établissement trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {establishments.map(estab => {
            const isActive = estab.id === activeId;
            return (
              <button
                key={estab.id}
                onClick={() => selectEstablishment(estab.id)}
                className="w-full text-left rounded-xl px-5 py-4 flex items-center gap-4 transition-colors"
                style={{
                  background: isActive ? "rgba(6,182,212,0.06)" : "var(--background-elev)",
                  border: isActive ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    background: isActive ? "rgba(6,182,212,0.1)" : "var(--background-soft)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Building2 size={16} style={{ color: isActive ? "var(--accent)" : "var(--foreground-dim)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {estab.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {estab.city && (
                      <span className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
                        {estab.city}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: ROLE_STYLE[estab.role].color }}
                    >
                      {ROLE_LABELS[estab.role]}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <CheckCircle size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SwitchEstablishmentPage() {
  return (
    <Suspense fallback={null}>
      <SwitchEstablishmentInner />
    </Suspense>
  );
}
