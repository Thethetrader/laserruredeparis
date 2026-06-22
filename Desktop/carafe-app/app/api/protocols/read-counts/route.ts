import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { establishment_id } = await req.json();
  if (!establishment_id) return NextResponse.json({ error: "establishment_id requis" }, { status: 400 });

  // Verify user is a member of this establishment
  const { data: member } = await supabase
    .from("establishment_members")
    .select("role")
    .eq("profile_id", user.id)
    .eq("establishment_id", establishment_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all protocol IDs for this establishment
  const { data: protocols } = await admin
    .from("protocols")
    .select("id")
    .eq("establishment_id", establishment_id);

  const protocolIds = (protocols ?? []).map((p: { id: string }) => p.id);
  if (protocolIds.length === 0) return NextResponse.json({ reads: [] });

  const { data: reads } = await admin
    .from("protocol_reads")
    .select("protocol_id, profile_id")
    .in("protocol_id", protocolIds);

  return NextResponse.json({ reads: reads ?? [] });
}
