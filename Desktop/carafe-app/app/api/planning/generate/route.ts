import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ServicePeriod {
  start: string;
  end: string;
  staff: Record<string, number>;
}

interface PlanningRules {
  allow_overtime?: boolean;
  consecutive_rest_days?: boolean;
  allow_split_shifts?: boolean;
}

interface ServiceNeeds {
  midi: ServicePeriod;
  soir: ServicePeriod;
  service_days: number[];
  rules?: PlanningRules;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { establishment_id: clientEstId, week_start, needs } = await req.json() as {
      establishment_id?: string;
      week_start: string;
      needs: ServiceNeeds;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Resolve establishment: validate client-provided ID (user must be member), otherwise fall back to their own
    let establishment_id: string | undefined;

    if (clientEstId) {
      const { data: membership } = await supabase
        .from("establishment_members")
        .select("establishment_id")
        .eq("profile_id", user.id)
        .eq("establishment_id", clientEstId)
        .eq("is_active", true)
        .maybeSingle();
      if (membership) establishment_id = clientEstId;
    }

    if (!establishment_id) {
      const { data: membership } = await supabase
        .from("establishment_members")
        .select("establishment_id")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .in("role", ["owner", "manager"])
        .limit(1)
        .maybeSingle();
      if (!membership) return NextResponse.json({ error: "Aucun établissement trouvé" }, { status: 403 });
      establishment_id = membership.establishment_id;
    }

    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, role, staff_status, profiles(first_name, weekly_hours)")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    // Include members with staff_status OR owner/manager (default to "responsable")
    const staff = (members ?? []).filter((m: any) => m.staff_status || m.role === "owner" || m.role === "manager");

    if (!staff.length) {
      return NextResponse.json({
        error: "Aucun employé actif trouvé pour cet établissement."
      }, { status: 400 });
    }

    // Build week dates from week_start (Monday)
    const monday = new Date(week_start + "T00:00:00Z");
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().split("T")[0];
    });

    const serviceDayDates = weekDates.filter((_, i) => needs.service_days.includes(i + 1));
    const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const serviceDayLabels = serviceDayDates.map((d, i) => {
      const dayIdx = needs.service_days[i] - 1;
      return `${DAYS_FR[dayIdx]} ${d}`;
    }).join(", ");

    const staffMapped = staff.map((m: any) => ({
      id: m.profile_id,
      name: (m.profiles as any)?.first_name ?? "Employé",
      role: m.staff_status ?? (m.role === "owner" || m.role === "manager" ? "responsable" : "serveur"),
      weekly_hours: (m.profiles as any)?.weekly_hours ?? 35,
    }));

    const prompt = `Tu es un gestionnaire de restaurant expert. Génère un planning hebdomadaire optimisé.

ÉQUIPE :
${staffMapped.map((s: {id: string; name: string; role: string; weekly_hours: number}) => `- id:"${s.id}" | ${s.name} | rôle:${s.role} | contrat:${s.weekly_hours}h/semaine`).join("\n")}

BESOINS DE LA SEMAINE :
Jours de service : ${serviceDayLabels}

Service du midi (${needs.midi.start}–${needs.midi.end}) :
${Object.entries(needs.midi.staff || {}).filter(([,n]) => n > 0).map(([role, n]) => `- ${role} : ${n} personne${n > 1 ? 's' : ''}`).join('\n') || '- Aucun besoin défini'}

Service du soir (${needs.soir.start}–${needs.soir.end}) :
${Object.entries(needs.soir.staff || {}).filter(([,n]) => n > 0).map(([role, n]) => `- ${role} : ${n} personne${n > 1 ? 's' : ''}`).join('\n') || '- Aucun besoin défini'}

RÈGLES :
- Au moins 2 jours de repos par semaine par personne
${needs.rules?.consecutive_rest_days !== false ? "- Les jours de repos doivent être consécutifs (2 jours de suite)" : "- Les jours de repos peuvent être non consécutifs"}
- Respecte le rôle de chaque employé pour couvrir les besoins par poste
- Répartis équitablement les jours entre les employés
${needs.rules?.allow_overtime ? "- Les heures supplémentaires sont autorisées si nécessaire" : "- Ne dépasse PAS les heures contractuelles hebdomadaires (strict)"}
${needs.rules?.allow_split_shifts ? "- Les coupures (midi ET soir le même jour) sont autorisées" : "- PAS de coupures : ne pas assigner midi ET soir le même jour à la même personne"}
- Pour les serveurs/chefs de rang/barmen : assigner selon les besoins salle
- Pour les cuisiniers/commis : assigner selon les besoins cuisine

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "shifts": [
    {
      "user_id": "UUID_EXACT_DE_LA_LISTE",
      "shift_date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "service": "midi" ou "soir"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    let parsed: { shifts: Array<{ user_id: string; shift_date: string; start_time: string; end_time: string; service: string }> };
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("no JSON object");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      console.error("AI response:", text);
      return NextResponse.json({ error: "Réponse IA invalide — réessayez" }, { status: 500 });
    }

    // Validate user_ids
    const validIds = new Set(staffMapped.map((s: {id: string}) => s.id));
    const validShifts = parsed.shifts.filter(s =>
      s.user_id && validIds.has(s.user_id) &&
      s.shift_date && s.start_time && s.end_time &&
      serviceDayDates.includes(s.shift_date)
    );

    if (validShifts.length === 0) {
      return NextResponse.json({ error: "Aucun shift valide généré — réessayez" }, { status: 500 });
    }

    // Upsert planning_week
    const { data: pw, error: pwError } = await supabase
      .from("planning_weeks")
      .upsert(
        { establishment_id, week_start, status: "draft", service_needs: needs, generated_at: new Date().toISOString() },
        { onConflict: "establishment_id,week_start" }
      )
      .select()
      .single();

    if (pwError || !pw) {
      return NextResponse.json({ error: pwError?.message ?? "Erreur création semaine" }, { status: 500 });
    }

    // Clear existing draft shifts
    await supabase.from("planning_shifts").delete().eq("planning_week_id", pw.id);

    // Insert new planning_shifts
    const { error: psError } = await supabase.from("planning_shifts").insert(
      validShifts.map(s => ({
        planning_week_id: pw.id,
        establishment_id,
        user_id: s.user_id,
        shift_date: s.shift_date,
        start_time: s.start_time,
        end_time: s.end_time,
        service: s.service ?? "midi",
        confirmation_status: "pending",
      }))
    );

    if (psError) {
      return NextResponse.json({ error: psError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, shifts_count: validShifts.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
