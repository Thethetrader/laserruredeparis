import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { establishment_id, date, tips }: { establishment_id: string; date: string; tips: Record<string, number> } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: membership } = await service
      .from("establishment_members")
      .select("role")
      .eq("establishment_id", establishment_id)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "manager"])
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { data: shifts } = await service
      .from("shifts")
      .select("id, user_id")
      .eq("establishment_id", establishment_id)
      .eq("shift_date", date);

    if (!shifts?.length) return NextResponse.json({ error: "Aucun shift trouvé" }, { status: 404 });

    for (const shift of shifts) {
      const amount = tips[shift.user_id] ?? 0;
      await service.from("shifts").update({ tips: amount, tips_2: 0 }).eq("id", shift.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
