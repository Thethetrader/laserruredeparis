import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import type { Establishment, EstablishmentWithRole, Profile, UserRole } from "@/lib/types/database";

type MemberRow = { role: UserRole; establishments: Establishment };

const DEV_MODE = false;

// Cache les données du layout 60s par user — évite 3 appels Supabase à chaque nav
const getCachedUserData = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const [profileRes, membersRes] = await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).single(),
      admin.from("establishment_members").select("role, establishments(*)").eq("profile_id", userId).eq("is_active", true),
    ]);
    return { profile: profileRes.data, members: membersRes.data };
  },
  ["layout-user-data"],
  { revalidate: 60, tags: ["layout-user-data"] }
);

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

const DEV_ESTABLISHMENTS_LIST: EstablishmentWithRole[] = [
  {
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
  },
  {
    id: "dev-establishment-2",
    owner_id: "dev-user",
    name: "La Brasserie Test",
    address: null,
    city: "Lyon",
    postal_code: null,
    country: "FR",
    logo_url: null,
    subscription_tier: "pro",
    subscription_status: "active",
    trial_ends_at: null,
    weekly_recap_day: "monday",
    weekly_recap_enabled: true,
    created_at: new Date().toISOString(),
    role: "manager",
  },
  {
    id: "dev-establishment-3",
    owner_id: "dev-user",
    name: "Chez Marcel",
    address: null,
    city: "Bordeaux",
    postal_code: null,
    country: "FR",
    logo_url: null,
    subscription_tier: "starter",
    subscription_status: "active",
    trial_ends_at: null,
    weekly_recap_day: "monday",
    weekly_recap_enabled: true,
    created_at: new Date().toISOString(),
    role: "employee",
  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile;
  let establishments: EstablishmentWithRole[];

  if (DEV_MODE) {
    profile = DEV_PROFILE;
    establishments = DEV_ESTABLISHMENTS_LIST;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { profile: fetchedProfile, members: fetchedMembers } = await getCachedUserData(user.id);

    if (!fetchedProfile) redirect("/login");
    profile = fetchedProfile as Profile;

    const rawMembers = (fetchedMembers ?? []) as unknown as MemberRow[];
    establishments = rawMembers
      .filter(m => m.establishments)
      .map(m => ({ ...m.establishments, role: m.role }));

    if (establishments.length === 0) redirect("/onboarding");
  }

  const cookieStore = cookies();
  const activeId = cookieStore.get("active_establishment_id")?.value;
  const establishment =
    (activeId && establishments.find(e => e.id === activeId)) || establishments[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar establishment={establishment} establishments={establishments} />
      <TopBar profile={profile} establishment={establishment} establishments={establishments} />

      <main className="pt-topbar-safe lg:pl-[240px] app-main-safe-pb">
        {children}
      </main>

      <BottomNav role={establishment.role} />
      <DevRoleSwitcher />
    </div>
  );
}
