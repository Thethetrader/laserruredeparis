import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"] as const;
type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf";
    const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "PDF ou image requis (jpg, png, webp)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `Analyse ce document et extrais les étapes à suivre sous forme de liste numérotée claire.

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
- Si le document contient une checklist, une procédure, un protocole ou des instructions visuelles, extrais-les comme étapes
- Si c'est une image (photo, schéma, affiche), décris les étapes ou points clés visibles
- Si le document ne contient pas de procédure claire, extrais les points clés à retenir
- Commence directement par le JSON, aucun texte avant ou après`;

    type ContentBlock =
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
      | { type: "text"; text: string };

    const contentBlocks: ContentBlock[] = isPdf
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: prompt },
        ]
      : [
          { type: "image", source: { type: "base64", media_type: file.type as ImageMediaType, data: base64 } },
          { type: "text", text: prompt },
        ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: contentBlocks }],
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
