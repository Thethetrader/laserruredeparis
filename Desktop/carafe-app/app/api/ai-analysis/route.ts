import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { establishment_id } = await req.json();
  if (!establishment_id) return new Response("Missing establishment_id", { status: 400 });

  // Verify manager role
  const { data: member } = await supabase
    .from("establishment_members")
    .select("role")
    .eq("establishment_id", establishment_id)
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!member || (member.role !== "owner" && member.role !== "manager")) {
    return new Response("Forbidden", { status: 403 });
  }

  // Fetch data for the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [membersRes, delaysRes, taskTemplatesRes, taskCompletionsRes, protocolsRes, readsRes] = await Promise.all([
    supabase.from("establishment_members")
      .select("profile_id, role, job_title, profiles(first_name, last_name)")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true),
    supabase.from("delays")
      .select("employee_id, shift_date, profiles(first_name, last_name)")
      .eq("establishment_id", establishment_id)
      .gte("shift_date", startDate),
    supabase.from("task_templates")
      .select("id, title, category, frequency")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true),
    supabase.from("task_completions")
      .select("task_template_id, service_date")
      .eq("establishment_id", establishment_id)
      .gte("service_date", startDate)
      .lte("service_date", today),
    supabase.from("protocols")
      .select("id, title, is_mandatory")
      .eq("establishment_id", establishment_id),
    supabase.from("protocol_reads")
      .select("protocol_id, profile_id, read_at"),
  ]);

  // Process delays per person
  const members = (membersRes.data ?? []) as Array<{
    profile_id: string;
    role: string;
    job_title: string | null;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }>;

  const delays = (delaysRes.data ?? []) as Array<{
    employee_id: string;
    shift_date: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }>;

  const delayCounts: Record<string, { name: string; count: number; dates: string[] }> = {};
  for (const d of delays) {
    if (!delayCounts[d.employee_id]) {
      const memberData = members.find(m => m.profile_id === d.employee_id);
      const name = memberData?.profiles
        ? `${memberData.profiles.first_name ?? ""} ${memberData.profiles.last_name ?? ""}`.trim()
        : "Inconnu";
      delayCounts[d.employee_id] = { name, count: 0, dates: [] };
    }
    delayCounts[d.employee_id].count++;
    delayCounts[d.employee_id].dates.push(d.shift_date);
  }

  const delaysSummary = Object.values(delayCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(d => `- ${d.name} : ${d.count} retard${d.count > 1 ? "s" : ""} (dates : ${d.dates.slice(0, 5).join(", ")})`);

  // Process task completion rates
  const templates = (taskTemplatesRes.data ?? []) as Array<{ id: string; title: string; category: string; frequency: string }>;
  const completions = (taskCompletionsRes.data ?? []) as Array<{ task_template_id: string; service_date: string }>;

  // Count working days in the period (approximate: 30 days * 6/7 ≈ 26 days)
  const workingDays = Math.round(30 * (6 / 7));

  const completionsByTask: Record<string, number> = {};
  for (const c of completions) {
    if (c.task_template_id) {
      completionsByTask[c.task_template_id] = (completionsByTask[c.task_template_id] ?? 0) + 1;
    }
  }

  const taskRates = templates
    .filter(t => t.frequency === "daily" || t.frequency === "weekly")
    .map(t => {
      const expected = t.frequency === "daily" ? workingDays : Math.floor(workingDays / 5);
      const done = completionsByTask[t.id] ?? 0;
      const rate = expected > 0 ? Math.round((done / expected) * 100) : 0;
      return { title: t.title, category: t.category, rate, done, expected };
    })
    .sort((a, b) => a.rate - b.rate);

  const forgottenTasks = taskRates.slice(0, 8).map(t =>
    `- "${t.title}" (${t.category}) : complétée ${t.done}/${t.expected} fois = ${t.rate}%`
  );

  // Protocol reads
  const protocols = (protocolsRes.data ?? []) as Array<{ id: string; title: string; is_mandatory: boolean }>;
  const reads = (readsRes.data ?? []) as Array<{ protocol_id: string; profile_id: string }>;
  const nonOwnerCount = members.filter(m => m.role !== "owner").length;

  const readsByProtocol: Record<string, Set<string>> = {};
  for (const r of reads) {
    if (!readsByProtocol[r.protocol_id]) readsByProtocol[r.protocol_id] = new Set();
    readsByProtocol[r.protocol_id].add(r.profile_id);
  }

  const protocolReadRates = protocols.map(p => ({
    title: p.title,
    is_mandatory: p.is_mandatory,
    read: readsByProtocol[p.id]?.size ?? 0,
    total: nonOwnerCount,
    rate: nonOwnerCount > 0 ? Math.round(((readsByProtocol[p.id]?.size ?? 0) / nonOwnerCount) * 100) : 0,
  })).sort((a, b) => a.rate - b.rate);

  const lowReadProtocols = protocolReadRates.slice(0, 5).map(p =>
    `- "${p.title}"${p.is_mandatory ? " (obligatoire)" : ""} : lu par ${p.read}/${p.total} membres (${p.rate}%)`
  );

  const prompt = `Tu es un assistant de gestion pour un établissement de restauration / hôtellerie. Analyse ces données des 30 derniers jours et génère un rapport bref et actionnable en français.

## Données équipe
Nombre de membres actifs : ${members.filter(m => m.role !== "owner").length}

## Retards (30 derniers jours)
${delaysSummary.length > 0 ? delaysSummary.join("\n") : "Aucun retard enregistré."}

## Tâches les moins complétées (30 derniers jours)
${forgottenTasks.length > 0 ? forgottenTasks.join("\n") : "Toutes les tâches sont bien suivies."}

## Protocoles peu lus
${lowReadProtocols.length > 0 ? lowReadProtocols.join("\n") : "Tous les protocoles sont bien lus."}

---

Génère un rapport structuré avec ces sections :
1. **Vue d'ensemble** (2-3 phrases résumant l'état général)
2. **Points d'attention** (liste des problèmes identifiés, avec noms si pertinent)
3. **Recommandations concrètes** (3-5 actions prioritaires, courtes et actionnables)

Sois direct, factuel, et constructif. Évite les formulations génériques. Utilise des données chiffrées.`;

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        // stream ended
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
