import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ is_request: false });

  const { message_id, message_content, establishment_id, sent_at } = await req.json();
  if (!message_content?.trim()) return NextResponse.json({ is_request: false });

  const { data: member } = await supabase
    .from("establishment_members")
    .select("role, profiles(first_name, last_name)")
    .eq("establishment_id", establishment_id)
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!member) return NextResponse.json({ is_request: false });
  const m = member as any;
  if (m.role === "owner" || m.role === "manager") {
    return NextResponse.json({ is_request: false });
  }

  const profile = m.profiles as any;
  const authorName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Employé";
  const dateStr = new Date(sent_at ?? Date.now()).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const prompt = `Tu analyses des messages d'employés de restaurant pour détecter les demandes adressées à leur manager.

MESSAGE : "${message_content}"
DATE D'ENVOI : ${dateStr}
AUTEUR : ${authorName}

TÂCHE : Détermine si ce message contient une demande explicite (congé, indisponibilité, retard, départ anticipé, échange de service).

Si oui, extrais les informations structurées.
Si non (message banal, question générale, salutation), retourne is_request: false.

RÉPONDS EN JSON UNIQUEMENT :
{
  "is_request": true,
  "confidence": "high",
  "request_type": "leave",
  "dates": ["2026-05-17"],
  "time": null,
  "reason": "mariage",
  "summary": "Indisponible samedi 17 mai (mariage)"
}

Si is_request est false :
{
  "is_request": false,
  "confidence": null,
  "request_type": null,
  "dates": null,
  "time": null,
  "reason": null,
  "summary": null
}

Ne détecte une demande que si confidence est high ou medium.
Types possibles : leave (congé), unavailability (indisponibilité), late (retard), early_leave (départ anticipé), shift_swap (échange), other.`;

  try {
    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 4000)
      ),
    ]);

    const msg = response as Anthropic.Message;
    const block = msg.content[0];
    const text = block.type === "text" ? (block as Anthropic.TextBlock).text.trim() : "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ is_request: false });

    const result = JSON.parse(jsonMatch[0]);
    if (!result.is_request || result.confidence === "low") {
      return NextResponse.json({ is_request: false });
    }

    return NextResponse.json({
      is_request: true,
      request_type: result.request_type ?? "other",
      dates: result.dates ?? [],
      time: result.time ?? null,
      reason: result.reason ?? null,
      summary: result.summary ?? message_content.slice(0, 80),
    });
  } catch {
    return NextResponse.json({ is_request: false });
  }
}
