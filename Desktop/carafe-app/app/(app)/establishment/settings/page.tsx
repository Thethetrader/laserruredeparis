import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import type { Establishment } from "@/lib/types/database";

export default async function EstablishmentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("establishment_members")
    .select("role, establishments(*)")
    .eq("profile_id", user.id)
    .in("role", ["owner", "manager"])
    .single() as { data: { role: string; establishments: Establishment } | null };

  if (!data?.establishments) redirect("/dashboard");

  const establishment = data.establishments;

  return (
    <div className="px-4 py-8 lg:px-8 max-w-lg">
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
          Paramètres complets disponibles en Phase 2.
        </p>
      </div>
    </div>
  );
}
