import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: inv, error } = await admin
    .from("invitations")
    .select("id, establishment_id, role, status, expires_at, staff_status, hourly_rate")
    .eq("token", token)
    .single();

  if (error || !inv) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  if (inv.status !== "pending") return NextResponse.json({ error: "Invitation déjà utilisée ou expirée" }, { status: 400 });
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: "Invitation expirée" }, { status: 400 });

  const { data: existing } = await admin
    .from("establishment_members")
    .select("id")
    .eq("establishment_id", inv.establishment_id)
    .eq("profile_id", user.id)
    .single();

  if (existing) {
    await admin.from("invitations").update({ status: "accepted" }).eq("id", inv.id);
    return NextResponse.json({ ok: true, already_member: true });
  }

  const { error: memberError } = await admin
    .from("establishment_members")
    .insert({ establishment_id: inv.establishment_id, profile_id: user.id, role: inv.role, staff_status: (inv as Record<string, unknown>).staff_status ?? null });

  if (!memberError && (inv as Record<string, unknown>).hourly_rate) {
    await admin.from("profiles").update({ hourly_rate: (inv as Record<string, unknown>).hourly_rate }).eq("id", user.id);
  }

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  await admin.from("invitations").update({ status: "accepted" }).eq("id", inv.id);

  return NextResponse.json({ ok: true });
}
