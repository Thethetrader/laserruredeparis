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
    .select("id, establishment_id, role, status, expires_at, first_name, last_name, phone, job_title, staff_status, hourly_rate, contract_type, weekly_hours")
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

  // Create member with all pre-filled info from invitation
  const { error: memberError } = await admin
    .from("establishment_members")
    .insert({
      establishment_id: inv.establishment_id,
      profile_id: user.id,
      role: inv.role,
      job_title: inv.job_title || null,
      staff_status: inv.staff_status || null,
      hired_at: new Date().toISOString().split("T")[0],
    });

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // Update profile with pre-filled info from invitation
  const profileUpdates: Record<string, unknown> = {};
  if (inv.first_name) profileUpdates.first_name = inv.first_name;
  if (inv.last_name) profileUpdates.last_name = inv.last_name;
  if (inv.phone) profileUpdates.phone = inv.phone;
  if (inv.hourly_rate) profileUpdates.hourly_rate = inv.hourly_rate;
  if (inv.contract_type) profileUpdates.contract_type = inv.contract_type;
  if (inv.weekly_hours) profileUpdates.weekly_hours = inv.weekly_hours;

  if (Object.keys(profileUpdates).length > 0) {
    await admin.from("profiles").update(profileUpdates).eq("id", user.id);
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("id", inv.id);

  return NextResponse.json({ ok: true });
}
