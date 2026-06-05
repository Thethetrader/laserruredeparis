import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { query, protocols } = body ?? {};

  if (!query || !Array.isArray(protocols) || protocols.length === 0) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });
  }

  const protocolList = protocols
    .map((p: { id: string; title: string; content?: string; steps?: { text: string }[] }) => {
      const steps = (p.steps ?? []).map((s) => s.text).join(", ");
      return `ID: ${p.id}\nTitre: ${p.title}\nContenu: ${p.content ?? ""}\nÉtapes: ${steps}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `Tu es LIA, un assistant IA pour la gestion d'un restaurant.
Tu dois trouver les protocoles les plus pertinents par rapport à la demande de l'utilisateur.
Réponds UNIQUEMENT avec un tableau JSON d'IDs de protocoles dans l'ordre de pertinence décroissante.
Format exact: ["id1","id2","id3"]
N'inclure que les protocoles vraiment pertinents (0 à 5 maximum).
Si aucun protocole n'est pertinent, retourne [].`;

  const userPrompt = `Recherche: "${query}"\n\nProtocoles disponibles:\n${protocolList}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[protocol-search] Claude API error:", err);
      return NextResponse.json({ error: "Erreur API." }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const ids: string[] = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ ids });
  } catch (e) {
    console.error("[protocol-search] Error:", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
