import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

export async function POST(req: NextRequest) {
  try {
    const { planning_week_id } = await req.json() as { planning_week_id: string };

    // Auth check via user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Service client bypasses RLS for writing shifts
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is owner/manager of this planning week's establishment
    const { data: pw } = await service
      .from("planning_weeks")
      .select("id, establishment_id, status")
      .eq("id", planning_week_id)
      .single();

    if (!pw) return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });

    const { data: membership } = await service
      .from("establishment_members")
      .select("role")
      .eq("establishment_id", pw.establishment_id)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "manager"])
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Get planning shifts
    const { data: planningShifts } = await service
      .from("planning_shifts")
      .select("*")
      .eq("planning_week_id", planning_week_id);

    if (!planningShifts?.length) return NextResponse.json({ error: "Aucun shift à valider" }, { status: 400 });

    // Group by (user_id, shift_date) → merge midi+soir into one shifts row
    const byUserDate = new Map<string, typeof planningShifts>();
    for (const ps of planningShifts) {
      const key = `${ps.user_id}__${ps.shift_date}`;
      if (!byUserDate.has(key)) byUserDate.set(key, []);
      byUserDate.get(key)!.push(ps);
    }

    const shiftsToCreate = Array.from(byUserDate.values()).map(group => {
      const sorted = group.sort((a, b) => a.start_time.localeCompare(b.start_time));
      const first = sorted[0];
      const second = sorted[1];
      return {
        user_id: first.user_id,
        establishment_id: pw.establishment_id,
        shift_date: first.shift_date,
        start_time: first.start_time,
        end_time: first.end_time,
        hours_worked: calcHours(first.start_time, first.end_time),
        tips: 0,
        start_time_2: second?.start_time ?? null,
        end_time_2: second?.end_time ?? null,
        hours_worked_2: second ? calcHours(second.start_time, second.end_time) : 0,
        tips_2: 0,
      };
    });

    const { error: shiftError } = await service.from("shifts").insert(shiftsToCreate);
    if (shiftError) return NextResponse.json({ error: shiftError.message }, { status: 500 });

    await service
      .from("planning_weeks")
      .update({ status: "published", validated_at: new Date().toISOString() })
      .eq("id", planning_week_id);

    return NextResponse.json({ ok: true, shifts_created: shiftsToCreate.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
