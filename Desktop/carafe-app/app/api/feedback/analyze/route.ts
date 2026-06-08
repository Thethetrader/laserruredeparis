import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FeedbackInput {
  item_cat: string;
  tonality: "positive" | "negative";
  item: string;
  content: string;
  echo_count: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { feedbacks, period } = await req.json() as {
      feedbacks: FeedbackInput[];
      period: string;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json({ error: "Aucun retour à analyser" }, { status: 400 });
    }

    const feedbackLines = feedbacks.map(f => {
      const echo = f.echo_count > 0 ? ` (${f.echo_count} collègue${f.echo_count > 1 ? "s" : ""} ont entendu pareil)` : "";
      return `- [${f.tonality === "positive" ? "POSITIF" : "NEGATIF"}] ${f.item_cat.toUpperCase()} · ${f.item} : « ${f.content} »${echo}`;
    }).join("\n");

    const prompt = `Tu es un consultant expert en restauration. Analyse ces retours clients collectés par l'équipe ${period}.

RETOURS (${feedbacks.length} au total) :
${feedbackLines}

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "tendance": "1 phrase max sur la dynamique générale",
  "tableau": [
    { "item": "nom du plat/service", "categorie": "cuisine|salle|bar|accueil", "sentiment": "positive|negative", "resume": "ce qui est dit en 5-8 mots", "echos": 0 }
  ],
  "actions": ["action concrète cette semaine", "action concrète", "action concrète"]
}

Règles :
- Une ligne dans tableau par plat/sujet distinct (regroupe les doublons)
- "echos" = nombre total de clients ayant mentionné ce point (inclus les échos confirmés)
- Exactement 3 actions, formulées comme ordres directs
- Sois direct, pas de langue de bois`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    let parsed: {
      tendance: string;
      tableau: Array<{ item: string; categorie: string; sentiment: string; resume: string; echos: number }>;
      actions: string[];
    };

    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("no JSON");
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: "Réponse IA invalide — réessayez" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, analysis: parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
