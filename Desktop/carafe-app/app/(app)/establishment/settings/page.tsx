"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

interface EstablishmentInfo {
  name: string;
  city: string | null;
}

export default function EstablishmentSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) {
      setEstablishment({ name: "Le Comptoir Dev", city: "Paris" });
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
      .select("role, establishments(name, city)")
      .eq("profile_id", user.id)
      .in("role", ["owner", "manager"])
      .limit(1)
      .maybeSingle();

    if (!data) { router.push("/dashboard"); return; }

    const est = data.establishments as unknown as EstablishmentInfo | null;
    if (!est) { router.push("/dashboard"); return; }

    setEstablishment(est);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-4xl">
        <div className="rounded-xl h-20 animate-pulse" style={{ background: "var(--background-elev)" }} />
      </div>
    );
  }

  if (!establishment) return null;

  return (
    <div className="px-4 py-8 lg:px-8 max-w-4xl">
      <MonoLabel size="xs" className="mb-6 block">Paramètres</MonoLabel>

      <div
        className="rounded-xl p-5"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          {establishment.name}
        </p>
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          {establishment.city ?? ""}
        </p>
      </div>

      <div
        className="mt-4 rounded-xl p-4"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
      >
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          Paramètres complets disponibles prochainement.
        </p>
      </div>
    </div>
  );
}
