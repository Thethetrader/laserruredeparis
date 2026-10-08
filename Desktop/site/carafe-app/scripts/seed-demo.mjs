// Demo seed script — populates the admin account with realistic restaurant data
// Run with: node scripts/seed-demo.mjs

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://gkeudbpzwwzypxmvuqkt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZXVkYnB6d3d6eXB4bXZ1cWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg5MjAxMiwiZXhwIjoyMTA0NDY4MDEyfQ.Gl0mOoXZhU6iKGWAiTAh-A3IipKTkaeHP1PXWAXNgVY";
const ADMIN_EMAIL = "brey.theodore4@gmail.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function dateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

// ─── 1. Trouver le profil admin ──────────────────────────────────────────────
const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
if (usersErr) throw usersErr;

const adminUser = users.find(u => u.email === ADMIN_EMAIL);
if (!adminUser) throw new Error(`Utilisateur ${ADMIN_EMAIL} introuvable`);
const adminId = adminUser.id;
console.log("✓ Admin trouvé:", adminId);

// ─── 2. Trouver l'établissement ───────────────────────────────────────────────
const { data: memberRow } = await supabase
  .from("establishment_members")
  .select("establishment_id")
  .eq("profile_id", adminId)
  .eq("is_active", true)
  .limit(1)
  .single();

if (!memberRow) throw new Error("Aucun établissement trouvé pour cet admin");
const estId = memberRow.establishment_id;
console.log("✓ Établissement:", estId);

// ─── 3. Membres de l'équipe fictifs ──────────────────────────────────────────
const employees = [
  { first_name: "Sophie",  last_name: "Martin",   job_title: "Cheffe de salle",    role: "manager" },
  { first_name: "Lucas",   last_name: "Bernard",  job_title: "Serveur",            role: "employee" },
  { first_name: "Emma",    last_name: "Dubois",   job_title: "Serveuse",           role: "employee" },
  { first_name: "Nathan",  last_name: "Moreau",   job_title: "Barman",             role: "employee" },
  { first_name: "Chloé",   last_name: "Lefebvre", job_title: "Serveuse",           role: "employee" },
  { first_name: "Tom",     last_name: "Simon",    job_title: "Runner",             role: "employee" },
  { first_name: "Léa",     last_name: "Laurent",  job_title: "Hôtesse d'accueil",  role: "employee" },
];

const profileIds = [];

for (const emp of employees) {
  const email = `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@karaf-demo.fr`;

  // Créer l'utilisateur auth
  const { data: authUser } = await supabase.auth.admin.createUser({
    email,
    password: "KarafDemo2025!",
    email_confirm: true,
  });

  const uid = authUser?.user?.id ?? randomUUID();

  // Upsert le profil
  await supabase.from("profiles").upsert({
    id: uid,
    email,
    first_name: emp.first_name,
    last_name: emp.last_name,
  });

  // Ajouter comme membre
  await supabase.from("establishment_members").upsert({
    establishment_id: estId,
    profile_id: uid,
    role: emp.role,
    job_title: emp.job_title,
    hired_at: dateStr(-Math.floor(Math.random() * 365 + 30)),
    is_active: true,
  });

  profileIds.push({ id: uid, ...emp });
  console.log(`  + ${emp.first_name} ${emp.last_name} (${emp.role})`);
}

// ─── 4. Protocols ─────────────────────────────────────────────────────────────
const protocols = [
  {
    title: "Ouverture de l'établissement",
    category: "opening",
    content: "Procédure complète d'ouverture du restaurant.",
    is_mandatory: true,
    steps: [
      { text: "Désactiver l'alarme (code: voir coffre)" },
      { text: "Allumer les lumières en salle et en cuisine" },
      { text: "Vérifier la température du réfrigérateur (entre 0°C et 4°C)", frequency: "quotidien" },
      { text: "Dresser les tables selon le plan de salle" },
      { text: "Remplir les carafes d'eau et préparation des mises en place" },
      { text: "Allumer la machine à café et effectuer un test" },
    ],
  },
  {
    title: "Fermeture de l'établissement",
    category: "closing",
    content: "Procédure de fermeture en fin de service.",
    is_mandatory: true,
    steps: [
      { text: "Encaisser les dernières tables et clôturer la caisse" },
      { text: "Nettoyer et ranger le bar" },
      { text: "Passer le balai et la serpillère en salle" },
      { text: "Éteindre tous les équipements (four, plaques, hotte)" },
      { text: "Vérifier toutes les fenêtres et portes" },
      { text: "Activer l'alarme et fermer à clé" },
    ],
  },
  {
    title: "Hygiène des mains",
    category: "hygiene",
    content: "Protocole de lavage des mains obligatoire.",
    is_mandatory: true,
    steps: [
      { text: "Se mouiller les mains à l'eau tiède" },
      { text: "Appliquer du savon et frotter pendant 30 secondes" },
      { text: "Rincer soigneusement" },
      { text: "Sécher avec un essuie-mains jetable" },
    ],
  },
  {
    title: "Accueil client",
    category: "service",
    content: "Standards d'accueil et de prise en charge des clients.",
    is_mandatory: false,
    steps: [
      { text: "Accueillir le client dans les 30 secondes suivant son entrée" },
      { text: "Proposer une table en tenant compte des réservations" },
      { text: "Présenter la carte et la carte des vins" },
      { text: "Prendre la commande des boissons en premier" },
    ],
  },
  {
    title: "Gestion d'une réclamation client",
    category: "service",
    content: "Comment gérer un client mécontent avec professionnalisme.",
    is_mandatory: false,
    steps: [
      { text: "Écouter le client sans l'interrompre" },
      { text: "S'excuser sincèrement et remercier le client de signaler le problème" },
      { text: "Proposer une solution immédiate (refaire le plat, geste commercial...)" },
      { text: "Informer le manager si nécessaire" },
      { text: "Noter l'incident dans le registre des feedbacks" },
    ],
  },
  {
    title: "Sécurité incendie",
    category: "security",
    content: "Procédure d'évacuation en cas d'incendie.",
    is_mandatory: true,
    steps: [
      { text: "Déclencher l'alarme incendie" },
      { text: "Appeler le 18 ou le 112" },
      { text: "Évacuer les clients par les sorties de secours" },
      { text: "Ne jamais utiliser les ascenseurs" },
      { text: "Pointer l'ensemble du personnel au point de rassemblement (parking)" },
    ],
  },
];

const protocolRows = [];
for (const p of protocols) {
  const { data } = await supabase.from("protocols").insert({
    establishment_id: estId,
    author_id: adminId,
    title: p.title,
    category: p.category,
    content: p.content,
    is_mandatory: p.is_mandatory,
    steps: p.steps ?? null,
  }).select("id").single();
  if (data) protocolRows.push(data.id);
}
console.log(`✓ ${protocolRows.length} protocoles créés`);

// Marquer certains protocoles comme lus par quelques membres
for (const pid of protocolRows.slice(0, 3)) {
  for (const emp of profileIds.slice(0, 4)) {
    await supabase.from("protocol_reads").upsert({ protocol_id: pid, profile_id: emp.id });
  }
}

// ─── 5. Retards ───────────────────────────────────────────────────────────────
const delayData = [
  { emp: 0, days: 12, minutes: 15, shift: "morning",   reason: "transport" },
  { emp: 1, days: 8,  minutes: 25, shift: "evening",   reason: "personal" },
  { emp: 2, days: 5,  minutes: 10, shift: "afternoon",  reason: "transport" },
  { emp: 3, days: 3,  minutes: 30, shift: "morning",   reason: "other" },
  { emp: 1, days: 1,  minutes: 20, shift: "evening",   reason: "transport" },
  { emp: 4, days: 15, minutes: 45, shift: "morning",   reason: "health" },
  { emp: 5, days: 2,  minutes: 12, shift: "afternoon",  reason: "transport" },
];

for (const d of delayData) {
  await supabase.from("delays").insert({
    establishment_id: estId,
    employee_id: profileIds[d.emp].id,
    reported_by: adminId,
    shift_date: dateStr(-d.days),
    shift_type: d.shift,
    delay_minutes: d.minutes,
    reason: d.reason,
  });
}
console.log(`✓ ${delayData.length} retards créés`);

// ─── 6. Challenges ────────────────────────────────────────────────────────────
const now = new Date();
const challenges = [
  {
    title: "Zéro retard cette semaine",
    description: "Toute l'équipe présente à l'heure du lundi au vendredi. Café offert vendredi pour tout le monde !",
    target_value: 0,
    current_value: 1,
    unit: "retards",
    starts_at: dateStr(-7),
    ends_at: dateStr(0),
    status: "active",
  },
  {
    title: "100 avis Google en 1 mois",
    description: "Mobilisons-nous pour demander des avis à nos clients satisfaits. Objectif : 100 nouveaux avis 5 étoiles.",
    target_value: 100,
    current_value: 67,
    unit: "avis",
    starts_at: dateStr(-20),
    ends_at: dateStr(10),
    status: "active",
  },
  {
    title: "Formation protocoles complète",
    description: "Tous les membres de l'équipe doivent avoir lu et validé les 6 protocoles obligatoires.",
    target_value: 6,
    current_value: 6,
    unit: "protocoles lus",
    starts_at: dateStr(-14),
    ends_at: dateStr(-1),
    status: "completed",
  },
  {
    title: "Meilleur service du mois - Service du soir",
    description: "L'équipe du soir vise 0 feedback négatif sur tout le mois d'octobre.",
    target_value: 0,
    current_value: 2,
    unit: "plaintes",
    starts_at: dateStr(-30),
    ends_at: dateStr(1),
    status: "active",
  },
];

for (const c of challenges) {
  await supabase.from("challenges").insert({
    establishment_id: estId,
    created_by: adminId,
    ...c,
  });
}
console.log(`✓ ${challenges.length} challenges créés`);

// ─── 7. Feedbacks clients ──────────────────────────────────────────────────────
const feedbacks = [
  { category: "compliment", content: "Service impeccable ce soir, Sophie a été aux petits soins. On reviendra !", table_number: "12", status: "resolved", days: 1 },
  { category: "compliment", content: "La qualité des vins proposés est excellente. Le barman connaît très bien sa cave.", table_number: "5", status: "resolved", days: 2 },
  { category: "complaint",  content: "Attente de 25 minutes pour la commande sans explication. Le service du midi était débordé.", table_number: "8", status: "in_progress", days: 1 },
  { category: "suggestion", content: "Proposer une option végétalienne serait super, beaucoup de clients cherchent ça.", table_number: null, status: "open", days: 3 },
  { category: "compliment", content: "Ambiance parfaite, l'équipe est souriante et efficace. Un vrai bonheur !", table_number: "3", status: "resolved", days: 4 },
  { category: "incident",   content: "Verre brisé à la table 7 ce midi, client légèrement blessé à la main. Géré sur le moment.", table_number: "7", status: "resolved", days: 5 },
  { category: "complaint",  content: "La table réservée n'était pas disponible à l'heure prévue, on a dû attendre 20 min debout.", table_number: null, status: "open", days: 2 },
  { category: "compliment", content: "Lucas a offert un dessert pour l'anniversaire de ma femme spontanément. Geste magnifique !", table_number: "15", status: "resolved", days: 6 },
  { category: "suggestion", content: "Mettre de la musique un peu moins forte le soir, difficile de discuter.", table_number: null, status: "open", days: 7 },
  { category: "complaint",  content: "Plat servi froid. Le steak haché aurait dû être chaud.", table_number: "2", status: "in_progress", days: 0 },
];

for (const f of feedbacks) {
  await supabase.from("customer_feedback").insert({
    establishment_id: estId,
    reported_by: adminId,
    category: f.category,
    content: f.content,
    table_number: f.table_number,
    status: f.status,
    created_at: daysAgo(f.days),
  });
}
console.log(`✓ ${feedbacks.length} feedbacks clients créés`);

// ─── 8. Task templates ────────────────────────────────────────────────────────
const taskTemplates = [
  { title: "Mise en place salle", display_order: 1 },
  { title: "Polissage des couverts", display_order: 2 },
  { title: "Vérification des tables (propreté, nappe)", display_order: 3 },
  { title: "Remplissage des carafes d'eau", display_order: 4 },
  { title: "Nettoyage de la machine à café", display_order: 5 },
  { title: "Rangement des stocks bar", display_order: 6 },
  { title: "Nettoyage du sol en salle", display_order: 7 },
  { title: "Inventaire des boissons", display_order: 8 },
];

const templateIds = [];
for (const t of taskTemplates) {
  const { data } = await supabase.from("task_templates").insert({
    establishment_id: estId,
    ...t,
    is_active: true,
  }).select("id").single();
  if (data) templateIds.push(data.id);
}
console.log(`✓ ${templateIds.length} tâches récurrentes créées`);

// Quelques complétions de tâches sur les 3 derniers jours
for (let day = 0; day <= 2; day++) {
  const sDate = dateStr(-day);
  for (let i = 0; i < Math.min(5, templateIds.length); i++) {
    const emp = profileIds[i % profileIds.length];
    await supabase.from("task_completions").insert({
      establishment_id: estId,
      task_template_id: templateIds[i],
      profile_id: emp.id,
      service_date: sDate,
    }).select();
  }
}

// ─── 9. Messages dans le chat général ──────────────────────────────────────────
const messages = [
  { sender: 0, content: "Bonjour l'équipe ! Rappel : réunion ce jeudi 10h pour le planning de la semaine prochaine 📅", days: 3 },
  { sender: 1, content: "Reçu ! On sera là 🙌", days: 3 },
  { sender: 2, content: "Je serai en retard de 15 min jeudi, je préviens à l'avance", days: 3 },
  { sender: 0, content: "OK Emma, pas de souci. On attend le début de la réunion", days: 3 },
  { sender: 3, content: "Le stock de bière IPA est presque épuisé, à commander avant vendredi svp", days: 2 },
  { sender: 0, content: "Commandé ce matin, livraison prévue demain Nathan ✓", days: 2 },
  { sender: 4, content: "Service du midi super chargé aujourd'hui, on a bien géré en équipe 💪", days: 1 },
  { sender: 1, content: "Oui c'était intense ! Mention spéciale à Tom pour le service aux tables 😄", days: 1 },
  { sender: 5, content: "Merci ! On s'est bien battus haha", days: 1 },
  { sender: 0, content: "Bravo à tous pour le coup de feu de ce midi 🎉 Le patron a appelé pour féliciter l'équipe", days: 1 },
  { sender: 6, content: "Est-ce que quelqu'un peut me couvrir samedi soir ? J'ai un empêchement familial", days: 0 },
  { sender: 2, content: "Je peux prendre ton service Léa ! Tu me couvres dimanche midi en échange ?", days: 0 },
  { sender: 6, content: "Deal ! Merci Emma 🙏", days: 0 },
  { sender: 0, content: "Échange validé. Mettez à jour vos dispos dans l'app. À demain !", days: 0 },
];

for (const m of messages) {
  const sender = m.sender === -1 ? adminId : profileIds[m.sender]?.id ?? adminId;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - m.days);
  createdAt.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 59));

  await supabase.from("messages").insert({
    establishment_id: estId,
    sender_id: sender,
    content: m.content,
    read_by: [sender, adminId],
    created_at: createdAt.toISOString(),
  });
}
console.log(`✓ ${messages.length} messages créés`);

// ─── 10. Demandes RH (staff_requests) ────────────────────────────────────────
const requests = [
  {
    profile_id: profileIds[1].id,
    employee_name: `${profileIds[1].first_name} ${profileIds[1].last_name}`,
    request_type: "swap",
    dates: [dateStr(3), dateStr(4)],
    summary: "Lucas demande à échanger son samedi soir avec dimanche midi",
    original_message: "Bonjour, je voudrais échanger mon samedi soir (12/10) avec dimanche midi (13/10) si possible",
    status: "pending",
    days: 1,
  },
  {
    profile_id: profileIds[2].id,
    employee_name: `${profileIds[2].first_name} ${profileIds[2].last_name}`,
    request_type: "leave",
    dates: [dateStr(7), dateStr(8), dateStr(9)],
    summary: "Emma demande 3 jours de congés la semaine prochaine",
    original_message: "J'aurais besoin de poser 3 jours de congés du 15 au 17 octobre pour raisons personnelles",
    status: "approved",
    days: 3,
  },
  {
    profile_id: profileIds[4].id,
    employee_name: `${profileIds[4].first_name} ${profileIds[4].last_name}`,
    request_type: "availability",
    dates: [dateStr(-1)],
    summary: "Chloé signale une indisponibilité hier soir (urgence familiale)",
    original_message: "Je suis désolée mais j'avais une urgence hier soir, je n'ai pas pu prévenir à temps",
    status: "pending",
    days: 1,
  },
];

for (const r of requests) {
  const { days, ...rest } = r;
  await (supabase.from)("staff_requests").insert({
    establishment_id: estId,
    ...rest,
    created_at: daysAgo(days),
  });
}
console.log(`✓ ${requests.length} demandes RH créées`);

// ─── 11. Score events ─────────────────────────────────────────────────────────
for (const emp of profileIds) {
  // Points de base aléatoires
  const basePoints = Math.floor(Math.random() * 200 + 50);
  await supabase.from("score_events").insert({
    establishment_id: estId,
    profile_id: emp.id,
    points: basePoints,
    reason: "Score initial",
    created_at: daysAgo(30),
  });

  // Points protocoles
  await supabase.from("score_events").insert({
    establishment_id: estId,
    profile_id: emp.id,
    points: 50,
    reason: "Protocoles lus",
    created_at: daysAgo(15),
  });
}
console.log(`✓ Score events créés pour ${profileIds.length} membres`);

console.log("\n✅ Seed terminé avec succès !");
console.log(`   Établissement: ${estId}`);
console.log(`   Membres ajoutés: ${profileIds.length}`);
console.log(`   → Ouvrez l'app et connectez-vous avec brey.theodore4@gmail.com`);
