import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { email, password, first_name, last_name, establishment_name } = await req.json();

  if (!email || !password || !first_name || !last_name || !establishment_name) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  // Create user via admin (auto-confirmed, no email sent)
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (userError || !userData.user) {
    const msg = userError?.message ?? "Erreur création compte";
    // Handle duplicate email
    if (msg.includes("already") || msg.includes("existe")) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = userData.user.id;

  // Create establishment
  const { data: estab, error: estabError } = await admin
    .from("establishments")
    .insert({ name: establishment_name, owner_id: userId })
    .select()
    .single();

  if (estabError || !estab) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erreur création établissement" }, { status: 500 });
  }

  // Create owner membership
  const { error: memberError } = await admin
    .from("establishment_members")
    .insert({ establishment_id: estab.id, profile_id: userId, role: "owner" });

  if (memberError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erreur création membership" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, establishmentId: estab.id });
}
