export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { profile_id, establishment_id, profile_updates, member_updates } = body as {
    profile_id: string;
    establishment_id: string;
    profile_updates: Record<string, string | null>;
    member_updates: Record<string, string | null>;
  };

  // Vérifier que le caller est manager/owner de cet établissement
  const { data: myMember } = await supabase
    .from("establishment_members")
    .select("role")
    .eq("profile_id", user.id)
    .eq("establishment_id", establishment_id)
    .maybeSingle();

  const role = (myMember as { role: string } | null)?.role;
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const errors: string[] = [];

  if (Object.keys(profile_updates).length > 0) {
    const { error } = await admin.from("profiles").update(profile_updates).eq("id", profile_id);
    if (error) errors.push(error.message);
  }

  if (Object.keys(member_updates).length > 0) {
    const { error } = await admin
      .from("establishment_members")
      .update(member_updates)
      .eq("profile_id", profile_id)
      .eq("establishment_id", establishment_id);
    if (error) errors.push(error.message);
  }

  if (errors.length > 0) return NextResponse.json({ error: errors.join(", ") }, { status: 500 });
  return NextResponse.json({ ok: true });
}
