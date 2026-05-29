import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Fichier PDF requis" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analyse ce protocole et extrais les étapes à suivre sous forme de liste numérotée claire.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte supplémentaire :
{
  "steps": [
    "Première étape",
    "Deuxième étape",
    "..."
  ]
}

Règles :
- Chaque étape doit être une action concrète et concise (1-2 lignes max)
- Maximum 20 étapes
- Garde la langue du document (français si le document est en français)
- Si le document ne contient pas de procédure claire, extrais les points clés à retenir
- Commence directement par le JSON, aucun texte avant ou après`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: { steps: string[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: "Impossible d'analyser le document" }, { status: 422 });
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: "Aucune étape trouvée dans le document" }, { status: 422 });
    }

    return NextResponse.json({ steps: parsed.steps.slice(0, 20) });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
