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

    const prompt = `Tu es un consultant expert en restauration. Analyse ces retours clients collectés par l'équipe ${period} et fais un debrief concis et actionnable.

RETOURS (${feedbacks.length} au total) :
${feedbackLines}

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "points_forts": ["phrase courte", "phrase courte"],
  "points_ameliorer": ["phrase courte", "phrase courte"],
  "tendance": "1-2 phrases sur la dynamique générale de la période",
  "recommandations": ["action concrète", "action concrète", "action concrète"]
}

Règles :
- Maximum 4 points forts et 4 points à améliorer
- Exactement 3 recommandations, formulées comme des actions concrètes à faire cette semaine
- Tiens compte du nombre d'échos (collègues qui confirment) pour pondérer l'importance
- Si un retour revient souvent, mets-le en avant
- Sois direct, pas de langue de bois`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    let parsed: {
      points_forts: string[];
      points_ameliorer: string[];
      tendance: string;
      recommandations: string[];
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
