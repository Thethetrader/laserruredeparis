import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { establishment_id, role, email } = await req.json();
  if (!establishment_id || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: member } = await supabase
    .from("establishment_members")
    .select("role")
    .eq("establishment_id", establishment_id)
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (member.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (member.role === "manager" && role === "manager") return NextResponse.json({ error: "Managers can only invite employees" }, { status: 403 });

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({ establishment_id, role, email: email || null, invited_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://karaf.fr";
  const link = `${base}/invite/${invitation.token}`;

  return NextResponse.json({ invitation, link });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const establishment_id = url.searchParams.get("establishment_id");
  if (!establishment_id) return NextResponse.json({ error: "Missing establishment_id" }, { status: 400 });

  const { data: member } = await supabase
    .from("establishment_members")
    .select("role")
    .eq("establishment_id", establishment_id)
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!member || member.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await admin
    .from("invitations")
    .select("id, email, role, status, expires_at, created_at, profiles(first_name, last_name)")
    .eq("establishment_id", establishment_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({ invitations: data ?? [] });
}
