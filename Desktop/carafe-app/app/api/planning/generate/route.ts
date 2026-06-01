import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { establishmentId, weekStart, serviceNeeds, breakSettings } = await req.json();

  // Verify manager
  const { data: member } = await supabase.from("establishment_members")
    .select("role").eq("establishment_id", establishmentId).eq("profile_id", user.id)
    .eq("is_active", true).single();
  if (!member || !["owner","manager"].includes(member.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch team with contracts and availability
  const { data: team } = await supabase.from("establishment_members")
    .select("profile_id, staff_status, profiles(first_name, weekly_hours, contract_type, hourly_rate)")
    .eq("establishment_id", establishmentId).eq("is_active", true).eq("role", "employee");

  // Calculate week dates
  const weekDates: string[] = [];
  const start = new Date(weekStart + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }
  const dayNames = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

  const teamData = (team ?? []).map(m => {
    const prof = m.profiles as { first_name: string | null; weekly_hours: number | null; contract_type: string | null } | null;
    return {
      id: m.profile_id,
      name: prof?.first_name ?? "Inconnu",
      post: m.staff_status ?? "autre",
      contract: prof?.contract_type ?? "CDI",
      weekly_hours: prof?.weekly_hours ?? 35,
    };
  });

  const breakInfo = breakSettings
    ? `Pauses: ≤6h→${breakSettings.break_under_6h}min, 6-8h→${breakSettings.break_6h_to_8h}min, >8h→${breakSettings.break_over_8h}min`
    : "Pauses: ≤6h→0min, 6-8h→20min, >8h→30min";

  const prompt = `Tu es un assistant de planification pour un restaurant. Génère un planning hebdomadaire optimisé.

SEMAINE DU ${weekStart} (${dayNames[0]} au ${dayNames[6]})
DATES: ${weekDates.join(", ")}

ÉQUIPE:
${JSON.stringify(teamData, null, 2)}

BESOINS PAR SERVICE:
${JSON.stringify(serviceNeeds, null, 2)}

${breakInfo}

RÈGLES:
- Respecte les heures contractuelles hebdomadaires (heures nettes après pauses)
- Chaque employé doit avoir au moins 1 jour de repos par semaine
- Service midi: 11h00-15h00 (ou 11h30-15h30), soir: 18h00-23h00 (ou 19h00-23h30)
- Journée complète: 10h00-18h00 ou 11h00-19h00
- Respecte les postes (serveur reste serveur, cuisinier reste cuisinier)
- Si un employé dépasse ses heures contractuelles, c'est des heures supplémentaires

Réponds UNIQUEMENT avec un JSON valide de cette forme exacte:
{
  "shifts": [
    {
      "user_id": "uuid-de-l-employe",
      "shift_date": "2024-01-15",
      "start_time": "11:00",
      "end_time": "15:00",
      "service": "midi",
      "hours_worked": 4.0
    }
  ],
  "summary": "Résumé en 2 phrases du planning généré"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
  
  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json(result);
}
