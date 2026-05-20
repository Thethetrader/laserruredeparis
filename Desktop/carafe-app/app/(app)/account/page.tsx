import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { CarafeAvatar } from "@/components/ui/custom/CarafeAvatar";
import type { Profile } from "@/lib/types/database";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) redirect("/login");

  return (
    <div className="px-4 py-8 lg:px-8 max-w-lg">
      <MonoLabel size="xs" className="mb-6 block">Mon compte</MonoLabel>

      <div
        className="rounded-xl p-5 flex items-center gap-4"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
      >
        <CarafeAvatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          avatarUrl={profile.avatar_url}
          size={48}
        />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>
            {user.email}
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl p-4"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
      >
        <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
          Modification du profil disponible en Phase 2.
        </p>
      </div>
    </div>
  );
}
