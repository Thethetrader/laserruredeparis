"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function getClient() {
  return createBrowserClient(
    "https://gkeudbpzwwzypxmvuqkt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZXVkYnB6d3d6eXB4bXZ1cWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4OTIwMTIsImV4cCI6MjEwNDQ2ODAxMn0.PuyktBQAZqZ-f5C-xkVMDg632F93X3tcDg2lxzD01wc",
    { db: { schema: "carafe" } }
  );
}

const DEMO_EMAIL = "demo@karaf.fr";
const DEMO_PASSWORD = "123456";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function dateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export default function SeedDemoPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function addLog(msg: string) {
    setLog(prev => [...prev, msg]);
  }

  async function runSeed() {
    setRunning(true);
    setLog([]);
    const supabase = getClient();

    try {
      // 1. Essayer de se connecter d'abord (compte déjà existant ?)
      addLog("Vérification du compte démo...");
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (loginError) {
        addLog(`ℹ️ Login : ${loginError.message}`);
        // Compte inexistant → on le crée via signUp
        addLog("Création du compte démo...");
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: { data: { first_name: "Demo", last_name: "Admin" } },
        });

        if (signupError) {
          addLog(`❌ Erreur création compte : ${signupError.message}`);
          setRunning(false);
          return;
        }

        if (!signupData.session) {
          addLog("⚠️ Confirmation email requise dans Supabase.");
          addLog("→ Va dans ton dashboard Supabase → Authentication → Settings");
          addLog("→ Désactive 'Confirm email', puis relance.");
          setRunning(false);
          return;
        }
        addLog(`✓ Compte créé : ${DEMO_EMAIL}`);
      } else {
        addLog("ℹ️ Compte déjà existant, on continue...");
      }

      // 3. Récupérer ou créer l'établissement
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user!.id;

      let estId: string;
      const { data: memberRow } = await supabase
        .from("establishment_members")
        .select("establishment_id")
        .eq("profile_id", adminId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (memberRow) {
        estId = memberRow.establishment_id;
        addLog("✓ Établissement existant trouvé");
      } else {
        // Créer l'établissement (nouveau compte)
        const { data: newEst, error: estError } = await supabase
          .from("establishments")
          .insert({ name: "Le Bistrot Parisien", owner_id: adminId } as any)
          .select("id")
          .single();
        if (estError || !newEst) {
          addLog(`❌ Erreur création établissement : ${estError?.message}`);
          setRunning(false);
          return;
        }
        estId = (newEst as any).id;
        await supabase.from("establishment_members").insert({
          establishment_id: estId, profile_id: adminId, role: "owner", is_active: true,
        } as any);
        addLog("✓ Établissement créé : Le Bistrot Parisien");
      }

      // 4. Membres de l'équipe fictifs
      const employees = [
        { first_name: "Sophie",  last_name: "Martin",   job_title: "Cheffe de salle",    role: "manager" as const },
        { first_name: "Lucas",   last_name: "Bernard",  job_title: "Serveur",            role: "employee" as const },
        { first_name: "Emma",    last_name: "Dubois",   job_title: "Serveuse",           role: "employee" as const },
        { first_name: "Nathan",  last_name: "Moreau",   job_title: "Barman",             role: "employee" as const },
        { first_name: "Chloé",   last_name: "Lefebvre", job_title: "Serveuse",           role: "employee" as const },
        { first_name: "Tom",     last_name: "Simon",    job_title: "Runner",             role: "employee" as const },
        { first_name: "Léa",     last_name: "Laurent",  job_title: "Hôtesse d'accueil",  role: "employee" as const },
      ];

      const profileIds: Array<{ id: string } & typeof employees[0]> = [];

      for (const emp of employees) {
        const fakeId = crypto.randomUUID();
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("first_name", emp.first_name)
          .eq("last_name", emp.last_name)
          .maybeSingle();

        const uid = existing?.id ?? fakeId;

        if (!existing) {
          await supabase.from("profiles").upsert({
            id: uid,
            email: `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@bistrot-demo.fr`,
            first_name: emp.first_name,
            last_name: emp.last_name,
          } as any);
        }

        const { data: existingMember } = await supabase
          .from("establishment_members")
          .select("id")
          .eq("establishment_id", estId)
          .eq("profile_id", uid)
          .maybeSingle();

        if (!existingMember) {
          await supabase.from("establishment_members").insert({
            establishment_id: estId,
            profile_id: uid,
            role: emp.role,
            job_title: emp.job_title,
            hired_at: dateStr(-Math.floor(Math.random() * 365 + 30)),
            is_active: true,
          } as any);
        }

        profileIds.push({ id: uid, ...emp });
      }
      addLog(`✓ ${profileIds.length} membres ajoutés`);

      // 5. Protocoles
      const protocols = [
        { title: "Ouverture de l'établissement", category: "opening", is_mandatory: true,
          content: "Procédure complète d'ouverture du restaurant.",
          steps: [
            { text: "Désactiver l'alarme" },
            { text: "Allumer les lumières en salle et en cuisine" },
            { text: "Vérifier la température du réfrigérateur (0°C à 4°C)", frequency: "quotidien" },
            { text: "Dresser les tables selon le plan de salle" },
            { text: "Remplir les carafes d'eau et préparer les mises en place" },
            { text: "Allumer la machine à café et effectuer un test" },
          ]},
        { title: "Fermeture de l'établissement", category: "closing", is_mandatory: true,
          content: "Procédure de fermeture en fin de service.",
          steps: [
            { text: "Encaisser les dernières tables et clôturer la caisse" },
            { text: "Nettoyer et ranger le bar" },
            { text: "Passer le balai et la serpillère en salle" },
            { text: "Éteindre tous les équipements (four, plaques, hotte)" },
            { text: "Vérifier toutes les fenêtres et portes" },
            { text: "Activer l'alarme et fermer à clé" },
          ]},
        { title: "Hygiène des mains", category: "hygiene", is_mandatory: true,
          content: "Protocole de lavage des mains obligatoire.",
          steps: [
            { text: "Se mouiller les mains à l'eau tiède" },
            { text: "Appliquer du savon et frotter pendant 30 secondes" },
            { text: "Rincer soigneusement" },
            { text: "Sécher avec un essuie-mains jetable" },
          ]},
        { title: "Accueil client", category: "service", is_mandatory: false,
          content: "Standards d'accueil et de prise en charge des clients.",
          steps: [
            { text: "Accueillir le client dans les 30 secondes suivant son entrée" },
            { text: "Proposer une table en tenant compte des réservations" },
            { text: "Présenter la carte et la carte des vins" },
            { text: "Prendre la commande des boissons en premier" },
          ]},
        { title: "Gestion d'une réclamation client", category: "service", is_mandatory: false,
          content: "Comment gérer un client mécontent avec professionnalisme.",
          steps: [
            { text: "Écouter le client sans l'interrompre" },
            { text: "S'excuser sincèrement et remercier le client" },
            { text: "Proposer une solution immédiate (refaire le plat, geste commercial...)" },
            { text: "Informer le manager si nécessaire" },
            { text: "Noter l'incident dans les feedbacks" },
          ]},
        { title: "Sécurité incendie", category: "security", is_mandatory: true,
          content: "Procédure d'évacuation en cas d'incendie.",
          steps: [
            { text: "Déclencher l'alarme incendie" },
            { text: "Appeler le 18 ou le 112" },
            { text: "Évacuer les clients par les sorties de secours" },
            { text: "Ne jamais utiliser les ascenseurs" },
            { text: "Rejoindre le point de rassemblement (parking)" },
          ]},
      ];

      const protocolIds: string[] = [];
      for (const p of protocols) {
        const { data } = await supabase.from("protocols").insert({
          establishment_id: estId, author_id: adminId,
          title: p.title, category: p.category as any, content: p.content,
          is_mandatory: p.is_mandatory, steps: p.steps,
        } as any).select("id").single();
        if (data) protocolIds.push((data as any).id);
      }
      for (const pid of protocolIds.slice(0, 3)) {
        for (const emp of profileIds.slice(0, 4)) {
          await supabase.from("protocol_reads").upsert({ protocol_id: pid, profile_id: emp.id } as any);
        }
      }
      addLog(`✓ ${protocolIds.length} protocoles créés`);

      // 6. Retards
      const delays = [
        { emp: 0, days: 12, minutes: 15, shift: "morning",   reason: "transport" },
        { emp: 1, days: 8,  minutes: 25, shift: "evening",   reason: "personal" },
        { emp: 2, days: 5,  minutes: 10, shift: "afternoon", reason: "transport" },
        { emp: 3, days: 3,  minutes: 30, shift: "morning",   reason: "other" },
        { emp: 1, days: 1,  minutes: 20, shift: "evening",   reason: "transport" },
        { emp: 4, days: 15, minutes: 45, shift: "morning",   reason: "health" },
        { emp: 5, days: 2,  minutes: 12, shift: "afternoon", reason: "transport" },
      ];
      for (const d of delays) {
        await supabase.from("delays").insert({
          establishment_id: estId, employee_id: profileIds[d.emp].id,
          reported_by: adminId, shift_date: dateStr(-d.days),
          shift_type: d.shift as any, delay_minutes: d.minutes, reason: d.reason,
        } as any);
      }
      addLog(`✓ ${delays.length} retards enregistrés`);

      // 7. Challenges
      const challenges = [
        { title: "Zéro retard cette semaine", description: "Toute l'équipe présente à l'heure. Café offert vendredi ! ☕",
          target_value: 0, current_value: 1, unit: "retards", starts_at: daysAgo(7), ends_at: daysAgo(0), status: "active" },
        { title: "100 avis Google en 1 mois", description: "Objectif : 100 nouveaux avis 5 étoiles 🌟",
          target_value: 100, current_value: 67, unit: "avis", starts_at: daysAgo(20), ends_at: dateStr(10), status: "active" },
        { title: "Formation protocoles complète", description: "Tous les membres doivent avoir lu les protocoles obligatoires.",
          target_value: 6, current_value: 6, unit: "protocoles lus", starts_at: daysAgo(14), ends_at: daysAgo(1), status: "completed" },
        { title: "Meilleur service du mois", description: "L'équipe du soir vise 0 feedback négatif.",
          target_value: 0, current_value: 2, unit: "plaintes", starts_at: daysAgo(30), ends_at: dateStr(1), status: "active" },
      ];
      for (const c of challenges) {
        await supabase.from("challenges").insert({ establishment_id: estId, created_by: adminId, ...c } as any);
      }
      addLog(`✓ ${challenges.length} challenges créés`);

      // 8. Feedbacks clients
      const feedbacks = [
        { category: "compliment", content: "Service impeccable ce soir, Sophie a été aux petits soins. On reviendra !", table_number: "12", status: "resolved", days: 1 },
        { category: "compliment", content: "La qualité des vins proposés est excellente. Le barman connaît très bien sa cave.", table_number: "5", status: "resolved", days: 2 },
        { category: "complaint",  content: "Attente de 25 minutes pour la commande sans explication.", table_number: "8", status: "in_progress", days: 1 },
        { category: "suggestion", content: "Proposer une option végétalienne serait super.", table_number: null, status: "open", days: 3 },
        { category: "compliment", content: "Ambiance parfaite, l'équipe est souriante et efficace. Un vrai bonheur !", table_number: "3", status: "resolved", days: 4 },
        { category: "incident",   content: "Verre brisé à la table 7, client légèrement blessé. Géré sur le moment.", table_number: "7", status: "resolved", days: 5 },
        { category: "complaint",  content: "La table réservée n'était pas disponible à l'heure prévue.", table_number: null, status: "open", days: 2 },
        { category: "compliment", content: "Lucas a offert un dessert pour l'anniversaire de ma femme. Geste magnifique !", table_number: "15", status: "resolved", days: 6 },
        { category: "suggestion", content: "Mettre la musique un peu moins forte le soir.", table_number: null, status: "open", days: 7 },
        { category: "complaint",  content: "Plat servi froid. Le steak aurait dû être chaud.", table_number: "2", status: "in_progress", days: 0 },
      ];
      for (const f of feedbacks) {
        await supabase.from("customer_feedback").insert({
          establishment_id: estId, reported_by: adminId,
          category: f.category as any, content: f.content,
          table_number: f.table_number, status: f.status as any,
          created_at: daysAgo(f.days),
        } as any);
      }
      addLog(`✓ ${feedbacks.length} feedbacks clients créés`);

      // 9. Tâches récurrentes
      const taskTemplates = [
        { title: "Mise en place salle", display_order: 1 },
        { title: "Polissage des couverts", display_order: 2 },
        { title: "Vérification des tables", display_order: 3 },
        { title: "Remplissage des carafes d'eau", display_order: 4 },
        { title: "Nettoyage de la machine à café", display_order: 5 },
        { title: "Rangement des stocks bar", display_order: 6 },
        { title: "Nettoyage du sol en salle", display_order: 7 },
        { title: "Inventaire des boissons", display_order: 8 },
      ];
      const templateIds: string[] = [];
      for (const t of taskTemplates) {
        const { data } = await supabase.from("task_templates").insert({
          establishment_id: estId, ...t, is_active: true,
        } as any).select("id").single();
        if (data) templateIds.push((data as any).id);
      }
      for (let day = 0; day <= 2; day++) {
        for (let i = 0; i < Math.min(5, templateIds.length); i++) {
          const emp = profileIds[i % profileIds.length];
          await supabase.from("task_completions").insert({
            establishment_id: estId, task_template_id: templateIds[i],
            profile_id: emp.id, service_date: dateStr(-day),
          } as any);
        }
      }
      addLog(`✓ ${templateIds.length} tâches récurrentes créées`);

      // 10. Messages chat général
      const chatMessages = [
        { sender: 0, content: "Bonjour l'équipe ! Rappel : réunion ce jeudi 10h pour le planning 📅", hours: 72 },
        { sender: 1, content: "Reçu ! On sera là 🙌", hours: 71 },
        { sender: 2, content: "Je serai en retard de 15 min jeudi, je préviens à l'avance", hours: 70 },
        { sender: 0, content: "OK Emma, pas de souci", hours: 69 },
        { sender: 3, content: "Le stock de bière IPA est presque épuisé, à commander avant vendredi 🍺", hours: 48 },
        { sender: 0, content: "Commandé ce matin, livraison demain Nathan ✓", hours: 47 },
        { sender: 4, content: "Service du midi super chargé aujourd'hui, bien géré en équipe 💪", hours: 24 },
        { sender: 1, content: "Mention spéciale à Tom pour le service aux tables 😄", hours: 23 },
        { sender: 5, content: "Merci ! On s'est bien battus haha", hours: 22 },
        { sender: 0, content: "Bravo à tous 🎉 Le patron a appelé pour féliciter l'équipe", hours: 21 },
        { sender: 6, content: "Quelqu'un peut me couvrir samedi soir ? Empêchement familial 🙏", hours: 3 },
        { sender: 2, content: "Je peux ! Tu me couvres dimanche midi en échange ?", hours: 2 },
        { sender: 6, content: "Deal ! Merci Emma 🙏", hours: 1 },
        { sender: 0, content: "Échange validé. Mettez à jour vos dispos. À demain !", hours: 0.5 },
      ];
      for (const m of chatMessages) {
        const senderId = profileIds[m.sender]?.id ?? adminId;
        await supabase.from("messages").insert({
          establishment_id: estId, sender_id: senderId,
          content: m.content, read_by: [senderId, adminId],
          created_at: new Date(Date.now() - m.hours * 3600 * 1000).toISOString(),
        } as any);
      }
      addLog(`✓ ${chatMessages.length} messages dans le chat`);

      // 11. Demandes RH
      const staffRequests = [
        {
          profile_id: profileIds[1].id,
          employee_name: `${profileIds[1].first_name} ${profileIds[1].last_name}`,
          establishment_id: estId,
          request_type: "swap",
          dates: [dateStr(3), dateStr(4)],
          summary: "Lucas demande à échanger son samedi soir avec dimanche midi",
          original_message: "Bonjour, je voudrais échanger mon samedi soir avec dimanche midi si possible",
          status: "pending", created_at: daysAgo(1),
        },
        {
          profile_id: profileIds[2].id,
          employee_name: `${profileIds[2].first_name} ${profileIds[2].last_name}`,
          establishment_id: estId,
          request_type: "leave",
          dates: [dateStr(7), dateStr(8), dateStr(9)],
          summary: "Emma demande 3 jours de congés la semaine prochaine",
          original_message: "J'aurais besoin de poser 3 jours de congés pour raisons personnelles",
          status: "approved", created_at: daysAgo(3),
        },
        {
          profile_id: profileIds[4].id,
          employee_name: `${profileIds[4].first_name} ${profileIds[4].last_name}`,
          establishment_id: estId,
          request_type: "availability",
          dates: [dateStr(-1)],
          summary: "Chloé signale une indisponibilité hier soir (urgence familiale)",
          original_message: "Je suis désolée mais j'avais une urgence hier soir",
          status: "pending", created_at: daysAgo(1),
        },
      ];
      for (const r of staffRequests) {
        await (supabase.from as any)("staff_requests").insert(r);
      }
      addLog(`✓ ${staffRequests.length} demandes RH créées`);

      // 12. Score events
      for (const emp of profileIds) {
        await supabase.from("score_events").insert([
          { establishment_id: estId, profile_id: emp.id, points: Math.floor(Math.random() * 200 + 50), reason: "Score initial", created_at: daysAgo(30) },
          { establishment_id: estId, profile_id: emp.id, points: 50, reason: "Protocoles lus", created_at: daysAgo(15) },
          { establishment_id: estId, profile_id: emp.id, points: Math.floor(Math.random() * 30 + 10), reason: "Tâches complétées", created_at: daysAgo(3) },
        ] as any);
      }
      addLog(`✓ Scores calculés`);

      addLog("✅ Compte démo prêt !");
      addLog(`   Email : ${DEMO_EMAIL}`);
      addLog(`   Mot de passe : ${DEMO_PASSWORD}`);
      setDone(true);
    } catch (err: any) {
      addLog(`❌ Erreur : ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: "monospace", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>🌱 Créer le compte démo</h1>
      <p style={{ marginBottom: 4, color: "#aaa", fontSize: 13 }}>Email : <b style={{ color: "#fff" }}>{DEMO_EMAIL}</b></p>
      <p style={{ marginBottom: 24, color: "#aaa", fontSize: 13 }}>Mot de passe : <b style={{ color: "#fff" }}>{DEMO_PASSWORD}</b></p>

      {!done && (
        <button
          onClick={runSeed}
          disabled={running}
          style={{
            padding: "12px 24px", background: running ? "#555" : "#16a34a",
            color: "white", border: "none", borderRadius: 8, cursor: running ? "default" : "pointer",
            fontSize: 14, marginBottom: 24,
          }}
        >
          {running ? "⏳ Création en cours..." : "🚀 Créer le compte démo"}
        </button>
      )}

      {done && (
        <div style={{ marginBottom: 24 }}>
          <a href="/login" style={{
            display: "inline-block", padding: "12px 24px", background: "#2563eb",
            color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14,
          }}>
            → Se connecter avec le compte démo
          </a>
        </div>
      )}

      <div style={{ background: "#111", borderRadius: 8, padding: 16 }}>
        {log.length === 0 && <span style={{ color: "#555" }}>Les logs apparaîtront ici...</span>}
        {log.map((l, i) => (
          <div key={i} style={{
            color: l.startsWith("❌") ? "#f87171" : l.startsWith("✅") || l.startsWith("✓") ? "#4ade80" : l.startsWith("ℹ️") ? "#60a5fa" : "#e5e7eb",
            fontSize: 13, lineHeight: 1.9,
          }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
