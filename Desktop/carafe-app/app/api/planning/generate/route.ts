import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ServicePeriod {
  start: string;
  end: string;
  salle: number;
  cuisine: number;
  bar: number;
}

interface ServiceNeeds {
  midi: ServicePeriod;
  soir: ServicePeriod;
  service_days: number[];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { establishment_id, week_start, needs } = await req.json() as {
      establishment_id: string;
      week_start: string;
      needs: ServiceNeeds;
    };

    const supabase = await createClient();

    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, staff_status, profiles(first_name, weekly_hours)")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    if (!members?.length) {
      return NextResponse.json({ error: "Aucun employé actif" }, { status: 400 });
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

    const staff = members.map((m: any) => ({
      id: m.profile_id,
      name: (m.profiles as any)?.first_name ?? "Employé",
      role: m.staff_status ?? "serveur",
      weekly_hours: (m.profiles as any)?.weekly_hours ?? 35,
    }));

    const prompt = `Tu es un gestionnaire de restaurant expert. Génère un planning hebdomadaire optimisé.

ÉQUIPE :
${staff.map((s: {id: string; name: string; role: string; weekly_hours: number}) => `- id:"${s.id}" | ${s.name} | rôle:${s.role} | contrat:${s.weekly_hours}h/semaine`).join("\n")}

BESOINS DE LA SEMAINE :
Jours de service : ${serviceDayLabels}

Service du midi (${needs.midi.start}–${needs.midi.end}) :
- Salle : ${needs.midi.salle} personnes
- Cuisine : ${needs.midi.cuisine} personnes
- Bar : ${needs.midi.bar} personnes

Service du soir (${needs.soir.start}–${needs.soir.end}) :
- Salle : ${needs.soir.salle} personnes
- Cuisine : ${needs.soir.cuisine} personnes
- Bar : ${needs.soir.bar} personnes

RÈGLES :
- Au moins 2 jours de repos par semaine par personne
- Respecte le rôle de chaque employé (salle→serveur/chef_de_rang/responsable, cuisine→cuisinier/commis/plongeur, bar→barman/responsable)
- Répartis équitablement les jours entre les employés
- Ne dépasse pas les heures contractuelles hebdomadaires
- Pour les serveurs/chefs de rang/barmen : assigner soit midi soit soir ou les deux selon les besoins
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
      const clean = text.startsWith("{") ? text : text.slice(text.indexOf("{"));
      parsed = JSON.parse(clean);
    } catch {
      console.error("AI response:", text);
      return NextResponse.json({ error: "Réponse IA invalide — réessayez" }, { status: 500 });
    }

    // Validate user_ids
    const validIds = new Set(staff.map((s: {id: string}) => s.id));
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
