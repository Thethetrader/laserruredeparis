import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface SimilarMatch {
  feedback_id: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  reporter_name: string;
  reporter_first: string;
  reporter_last: string;
  reporter_avatar: string | null;
  item: string;
  content: string;
  echo_count: number;
  created_at: string;
}

export interface CheckSimilarResponse {
  similar_found: boolean;
  matches: SimilarMatch[];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ similar_found: false, matches: [] });
  }

  try {
    const { category, item, content, tonality, establishment_id } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [feedbackRes, membersRes, echoRes] = await Promise.all([
      supabase.from("customer_feedback")
        .select("id, reported_by, category, content, table_number, created_at")
        .eq("establishment_id", establishment_id)
        .neq("reported_by", user.id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("establishment_members")
        .select("profile_id, profiles(first_name, last_name, avatar_url)")
        .eq("establishment_id", establishment_id),
      supabase.from("feedback_confirmations")
        .select("feedback_id")
        .eq("establishment_id", establishment_id),
    ]);

    const existing = (feedbackRes.data ?? []) as Array<{
      id: string; reported_by: string | null; category: string;
      content: string; table_number: string | null; created_at: string;
    }>;

    if (existing.length === 0) {
      return NextResponse.json({ similar_found: false, matches: [] });
    }

    type MemberRow = { profile_id: string; profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null };
    const profileMap: Record<string, { first: string; last: string; avatar: string | null }> = {};
    (membersRes.data ?? [] as MemberRow[]).forEach((m: MemberRow) => {
      if (m.profiles) profileMap[m.profile_id] = { first: m.profiles.first_name ?? "", last: m.profiles.last_name ?? "", avatar: m.profiles.avatar_url };
    });

    const echoCounts: Record<string, number> = {};
    (echoRes.data ?? []).forEach((r: { feedback_id: string }) => {
      echoCounts[r.feedback_id] = (echoCounts[r.feedback_id] ?? 0) + 1;
    });

    function parseContent(raw: string) {
      const sep = raw.indexOf(" · ");
      if (sep > 0) return { item: raw.slice(0, sep), content: raw.slice(sep + 3) };
      return { item: "", content: raw };
    }

    function dbCatToTonality(cat: string) {
      return cat === "compliment" ? "positive" : "negative";
    }

    const existingList = existing.map(f => {
      const { item: fItem, content: fContent } = parseContent(f.content);
      const fTon = dbCatToTonality(f.category);
      return { id: f.id, item: fItem || fContent.slice(0, 40), content: fItem ? fContent : f.content, tonality: fTon, created_at: f.created_at };
    });

    const samePolarity = existingList.filter(f => f.tonality === tonality);
    if (samePolarity.length === 0) {
      return NextResponse.json({ similar_found: false, matches: [] });
    }

    const feedbackListStr = samePolarity.map(f =>
      `ID: ${f.id} | Item: "${f.item}" | Contenu: "${f.content}" | Tonalité: ${f.tonality} | Date: ${new Date(f.created_at).toLocaleDateString("fr-FR")}`
    ).join("\n");

    const prompt = `Tu es un assistant qui analyse les retours clients dans un restaurant.

Un serveur s'apprête à publier un nouveau retour. Compare-le à la liste des retours actifs des 7 derniers jours et détermine s'il est très similaire à l'un d'eux.

DEUX RETOURS SONT SIMILAIRES SI :
1. Ils concernent le même item (ou un synonyme évident)
2. Ils expriment la même critique ou le même éloge (synonyme évident accepté)
3. Ils ont la même tonalité (positif/négatif)

NE SONT PAS SIMILAIRES :
- Critiques différentes sur le même item (ex: "trop sucré" vs "trop cuit")
- Items différents même avec la même critique
- Tonalités opposées
- Retours vagues sans item commun clairement identifiable

Nouveau retour :
- Catégorie : ${category}
- Item : "${item}"
- Contenu : "${content}"
- Tonalité : ${tonality}

Retours existants (mêmes 7 jours, même tonalité) :
${feedbackListStr}

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "similar_found": true,
  "matches": [
    {
      "feedback_id": "uuid",
      "confidence": "high",
      "reason": "explication courte en français"
    }
  ]
}

N'inclus dans "matches" que les retours de confidence "high" ou "medium". Maximum 3 matches. Si aucun match clair, retourne {"similar_found": false, "matches": []}.`;

    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);

    const text = (response as Anthropic.Message).content[0].type === "text"
      ? (response as Anthropic.Message).content[0].text
      : "";

    let aiResult: { similar_found: boolean; matches: Array<{ feedback_id: string; confidence: string; reason: string }> };
    try {
      aiResult = JSON.parse(text);
    } catch {
      return NextResponse.json({ similar_found: false, matches: [] });
    }

    if (!aiResult.similar_found || !aiResult.matches?.length) {
      return NextResponse.json({ similar_found: false, matches: [] });
    }

    const strongMatches = aiResult.matches.filter(m => m.confidence === "high" || m.confidence === "medium").slice(0, 3);
    if (strongMatches.length === 0) {
      return NextResponse.json({ similar_found: false, matches: [] });
    }

    const enriched: SimilarMatch[] = strongMatches.map(m => {
      const fb = existing.find(f => f.id === m.feedback_id);
      if (!fb) return null;
      const { item: fItem, content: fContent } = parseContent(fb.content);
      const profile = fb.reported_by ? profileMap[fb.reported_by] : null;
      return {
        feedback_id: fb.id,
        confidence: m.confidence as "high" | "medium" | "low",
        reason: m.reason,
        reporter_name: profile ? `${profile.first} ${profile.last}`.trim() : "Anonyme",
        reporter_first: profile?.first ?? "",
        reporter_last: profile?.last ?? "",
        reporter_avatar: profile?.avatar ?? null,
        item: fItem || fContent.slice(0, 40),
        content: fItem ? fContent : fb.content,
        echo_count: echoCounts[fb.id] ?? 0,
        created_at: fb.created_at,
      };
    }).filter(Boolean) as SimilarMatch[];

    return NextResponse.json({ similar_found: enriched.length > 0, matches: enriched });
  } catch {
    return NextResponse.json({ similar_found: false, matches: [] });
  }
}
