import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data, error } = await admin
    .from("invitations")
    .select("id, role, status, expires_at, establishment_id, establishments(name, city), profiles(first_name, last_name)")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });

  const expired = new Date(data.expires_at) < new Date();
  if (expired && data.status === "pending") {
    await admin.from("invitations").update({ status: "expired" }).eq("token", token);
  }

  const estab = data.establishments as { name: string; city: string } | null;
  const inviter = data.profiles as { first_name: string | null; last_name: string | null } | null;

  return NextResponse.json({
    id: data.id,
    role: data.role,
    status: expired ? "expired" : data.status,
    establishment_name: estab?.name ?? "",
    establishment_city: estab?.city ?? "",
    invited_by: inviter ? `${inviter.first_name ?? ""} ${inviter.last_name ?? ""}`.trim() : "un manager",
  });
}
