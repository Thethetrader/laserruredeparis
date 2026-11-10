import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PlanningRules {
  allow_overtime?: boolean;
  consecutive_rest_days?: boolean;
  allow_split_shifts?: boolean;
}

/* ── Daily (v1) format ─────────────────────────────────────────────────────── */

interface ServiceEntry {
  id: string;
  name: string;
  start: string;
  end: string;
  staff: Record<string, number>;
}

interface DayConfig {
  services: ServiceEntry[];
  is_closed: boolean;
  validated: boolean;
}

interface DailyNeeds {
  type: "daily_v1";
  days: Record<string, DayConfig>;
  rules?: PlanningRules;
}

/* ── Legacy format ─────────────────────────────────────────────────────────── */

interface LegacyServicePeriod {
  start: string;
  end: string;
  staff: Record<string, number>;
}

interface LegacyNeeds {
  midi: LegacyServicePeriod;
  soir: LegacyServicePeriod;
  service_days: number[];
  rules?: PlanningRules;
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { establishment_id: clientEstId, week_start, needs } = await req.json() as {
      establishment_id?: string;
      week_start: string;
      needs: DailyNeeds | LegacyNeeds;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Resolve establishment
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

    // Load staff
    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, role, staff_status, profiles(first_name, weekly_hours)")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    const staff = (members ?? []).filter((m: any) => m.staff_status || m.role === "owner" || m.role === "manager");
    if (!staff.length) {
      return NextResponse.json({ error: "Aucun employé actif trouvé pour cet établissement." }, { status: 400 });
    }

    const staffMapped = staff.map((m: any) => ({
      id: m.profile_id,
      name: (m.profiles as any)?.first_name ?? "Employé",
      role: m.staff_status ?? (m.role === "owner" || m.role === "manager" ? "responsable" : "serveur"),
      weekly_hours: (m.profiles as any)?.weekly_hours ?? 35,
    }));

    // Build week dates from week_start (Monday)
    const monday = new Date(week_start + "T00:00:00Z");
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().split("T")[0];
    });

    let prompt: string;
    let serviceDayDates: string[];

    const staffLines = staffMapped.map((s: {id: string; name: string; role: string; weekly_hours: number}) =>
      `- id:"${s.id}" | ${s.name} | rôle:${s.role} | contrat:${s.weekly_hours}h/semaine`
    ).join("\n");

    const rulesObj = (needs as { rules?: PlanningRules }).rules ?? {};

    const rulesLines = [
      "- Au moins 2 jours de repos par semaine par personne",
      rulesObj.consecutive_rest_days !== false
        ? "- Les jours de repos doivent être consécutifs (2 jours de suite)"
        : "- Les jours de repos peuvent être non consécutifs",
      "- Respecte le rôle de chaque employé pour couvrir les besoins par poste",
      "- Répartis équitablement les jours entre les employés",
      rulesObj.allow_overtime
        ? "- Les heures supplémentaires sont autorisées si nécessaire"
        : "- Ne dépasse PAS les heures contractuelles hebdomadaires (strict)",
      rulesObj.allow_split_shifts
        ? "- Les coupures (midi ET soir le même jour) sont autorisées"
        : "- PAS de coupures : ne pas assigner midi ET soir le même jour à la même personne",
      "- Pour les serveurs/chefs de rang/barmen : assigner selon les besoins salle",
      "- Pour les cuisiniers/commis : assigner selon les besoins cuisine",
    ].join("\n");

    if ((needs as DailyNeeds).type === "daily_v1") {
      const dailyNeeds = needs as DailyNeeds;
      serviceDayDates = Object.entries(dailyNeeds.days)
        .filter(([date, cfg]) => !cfg.is_closed && (cfg.services?.length ?? 0) > 0 && weekDates.includes(date))
        .map(([date]) => date)
        .sort();

      const dayLines = serviceDayDates.map(date => {
        const cfg = dailyNeeds.days[date];
        const d = new Date(date + "T12:00:00Z");
        const dayIdx = (d.getUTCDay() + 6) % 7; // Mon=0
        const dayName = DAYS_FR[dayIdx];
        const serviceLines = cfg.services.map(svc => {
          const staffNeeds = Object.entries(svc.staff)
            .filter(([, n]) => n > 0)
            .map(([role, n]) => `${n} ${role}`)
            .join(", ");
          return `    • ${svc.name} (${svc.start}–${svc.end}) : ${staffNeeds || "aucun besoin défini"}`;
        }).join("\n");
        return `${dayName} ${date} :\n${serviceLines}`;
      }).join("\n\n");

      prompt = `Tu es un gestionnaire de restaurant expert. Génère un planning hebdomadaire optimisé.

ÉQUIPE :
${staffLines}

BESOINS PAR JOUR :
${dayLines}

RÈGLES :
${rulesLines}

IMPORTANT : Pour le champ "service", utilise le nom exact du service tel qu'indiqué dans les besoins (ex: "Midi", "Soir", "Service", etc.).

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "shifts": [
    {
      "user_id": "UUID_EXACT_DE_LA_LISTE",
      "shift_date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "service": "NOM_EXACT_DU_SERVICE"
    }
  ]
}`;

    } else {
      // Legacy format
      const legacyNeeds = needs as LegacyNeeds;
      serviceDayDates = weekDates.filter((_, i) => legacyNeeds.service_days.includes(i + 1));
      const serviceDayLabels = serviceDayDates.map((d, i) => {
        const dayIdx = legacyNeeds.service_days[i] - 1;
        return `${DAYS_FR[dayIdx]} ${d}`;
      }).join(", ");

      prompt = `Tu es un gestionnaire de restaurant expert. Génère un planning hebdomadaire optimisé.

ÉQUIPE :
${staffLines}

BESOINS DE LA SEMAINE :
Jours de service : ${serviceDayLabels}

Service du midi (${legacyNeeds.midi.start}–${legacyNeeds.midi.end}) :
${Object.entries(legacyNeeds.midi.staff || {}).filter(([,n]) => n > 0).map(([role, n]) => `- ${role} : ${n} personne${n > 1 ? 's' : ''}`).join('\n') || '- Aucun besoin défini'}

Service du soir (${legacyNeeds.soir.start}–${legacyNeeds.soir.end}) :
${Object.entries(legacyNeeds.soir.staff || {}).filter(([,n]) => n > 0).map(([role, n]) => `- ${role} : ${n} personne${n > 1 ? 's' : ''}`).join('\n') || '- Aucun besoin défini'}

RÈGLES :
${rulesLines}

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
    }

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

    // Validate user_ids and dates
    const validIds = new Set(staffMapped.map((s: {id: string}) => s.id));
    const serviceDaySet = new Set(serviceDayDates);
    const validShifts = parsed.shifts.filter(s =>
      s.user_id && validIds.has(s.user_id) &&
      s.shift_date && s.start_time && s.end_time &&
      serviceDaySet.has(s.shift_date)
    );

    if (validShifts.length === 0) {
      return NextResponse.json({ error: "Aucun shift valide généré — réessayez" }, { status: 500 });
    }

    // Upsert planning_week (preserve existing service_needs so day configs are kept)
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
