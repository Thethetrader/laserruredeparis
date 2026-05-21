import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import type { Establishment, EstablishmentWithRole, Profile, UserRole } from "@/lib/types/database";

type MemberRow = { role: UserRole; establishments: Establishment };

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const DEV_PROFILE: Profile = {
  id: "dev-user",
  email: "dev@carafe.app",
  first_name: "Dev",
  last_name: "Mode",
  phone: null,
  avatar_url: null,
  external_combo_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEV_ESTABLISHMENT: EstablishmentWithRole = {
  id: "dev-establishment",
  owner_id: "dev-user",
  name: "Le Comptoir Dev",
  address: null,
  city: "Paris",
  postal_code: null,
  country: "FR",
  logo_url: null,
  subscription_tier: "trial",
  subscription_status: "active",
  trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
  weekly_recap_day: "monday",
  weekly_recap_enabled: true,
  created_at: new Date().toISOString(),
  role: "owner",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile;
  let establishments: EstablishmentWithRole[];

  if (DEV_MODE) {
    profile = DEV_PROFILE;
    establishments = [DEV_ESTABLISHMENT];
  } else {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [profileResult, membersResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("establishment_members").select("role, establishments(*)").eq("profile_id", user.id),
    ]);

    const fetchedProfile = profileResult.data as Profile | null;
    if (!fetchedProfile) redirect("/login");
    profile = fetchedProfile;

    const rawMembers = (membersResult.data ?? []) as unknown as MemberRow[];
    establishments = rawMembers
      .filter(m => m.establishments)
      .map(m => ({ ...m.establishments, role: m.role }));

    if (establishments.length === 0) redirect("/onboarding");
  }

  const establishment = establishments[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar establishment={establishment} establishments={establishments} />
      <TopBar profile={profile} establishment={establishment} establishments={establishments} />

      {/* mobile: pt-[56px] pb safe-area+60px desktop: pl-[240px], no top/bottom offset */}
      <main className="pt-[56px] lg:pt-0 lg:pb-0 lg:pl-[240px]"
        style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom))" }}>
        {children}
      </main>

      <BottomNav />
      <DevRoleSwitcher />
      <div className="fixed bottom-[72px] right-4 z-50 lg:bottom-4">
        <PushNotificationSetup establishmentId={establishment.id} />
      </div>
    </div>
  );
}
