// Central dev-mode data — 30 salariés fictifs, données complètes pour démo client

export const DEV_ESTABLISHMENT_ID = "dev-establishment";
export const DEV_PROFILE_ID = "dev-user";

const dAgo = (d: number, h = 0) =>
  new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();
const today = new Date().toISOString().split("T")[0];

// ─── EMPLOYÉS ────────────────────────────────────────────────────────────────

export const DEV_EMPLOYEES = [
  { profile_id: "profile-2",  first_name: "Yasmine",    last_name: "Benali",     job_title: "Chef de salle",      role: "manager",  contract: "cdi",   hired: "2023-01-15", email: "yasmine.benali@karaf-demo.fr",    phone: "06 12 34 56 78", score: 94, delays: 0, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-3",  first_name: "Alexandre",  last_name: "Bonnet",     job_title: "Maître d'hôtel",     role: "manager",  contract: "cdi",   hired: "2022-06-01", email: "alexandre.bonnet@karaf-demo.fr",  phone: "06 22 33 44 55", score: 87, delays: 1, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-4",  first_name: "Julien",     last_name: "Perrin",     job_title: "Chef de cuisine",    role: "manager",  contract: "cdi",   hired: "2021-09-15", email: "julien.perrin@karaf-demo.fr",     phone: "06 33 44 55 66", score: 81, delays: 0, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-5",  first_name: "Rayan",      last_name: "Dupont",     job_title: "Serveur",            role: "employee", contract: "cdi",   hired: "2024-06-01", email: "rayan.dupont@karaf-demo.fr",      phone: "06 98 76 54 32", score: 76, delays: 2, today_delays: 1, protocols_read: 4 },
  { profile_id: "profile-6",  first_name: "Léa",        last_name: "Martin",     job_title: "Serveuse",           role: "employee", contract: "cdd",   hired: "2024-09-01", email: "lea.martin@karaf-demo.fr",        phone: "07 11 22 33 44", score: 72, delays: 1, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-7",  first_name: "Antoine",    last_name: "Moreau",     job_title: "Barman",             role: "employee", contract: "cdi",   hired: "2023-04-10", email: "antoine.moreau@karaf-demo.fr",    phone: "06 55 44 33 22", score: 68, delays: 0, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-8",  first_name: "Sofia",      last_name: "Nguyen",     job_title: "Serveuse",           role: "employee", contract: "cdi",   hired: "2023-07-20", email: "sofia.nguyen@karaf-demo.fr",      phone: "07 66 77 88 99", score: 65, delays: 1, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-9",  first_name: "Hugo",       last_name: "Bernard",    job_title: "Chef de rang",       role: "employee", contract: "cdi",   hired: "2022-11-05", email: "hugo.bernard@karaf-demo.fr",      phone: "06 44 55 66 77", score: 62, delays: 2, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-10", first_name: "Camille",    last_name: "Lefebvre",   job_title: "Hôtesse",            role: "employee", contract: "cdd",   hired: "2024-03-01", email: "camille.lefebvre@karaf-demo.fr",  phone: "07 11 22 44 55", score: 59, delays: 0, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-11", first_name: "Théo",       last_name: "Rousseau",   job_title: "Serveur",            role: "employee", contract: "extra", hired: "2024-07-15", email: "theo.rousseau@karaf-demo.fr",     phone: "06 77 88 99 00", score: 55, delays: 3, today_delays: 1, protocols_read: 2 },
  { profile_id: "profile-12", first_name: "Emma",       last_name: "Petit",      job_title: "Serveuse",           role: "employee", contract: "cdi",   hired: "2023-02-28", email: "emma.petit@karaf-demo.fr",        phone: "07 00 11 22 33", score: 52, delays: 1, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-13", first_name: "Lucas",      last_name: "Simon",      job_title: "Plongeur",           role: "employee", contract: "cdi",   hired: "2023-10-01", email: "lucas.simon@karaf-demo.fr",       phone: "06 33 22 11 00", score: 49, delays: 2, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-14", first_name: "Inès",       last_name: "Roux",       job_title: "Caissière",          role: "employee", contract: "cdi",   hired: "2022-08-15", email: "ines.roux@karaf-demo.fr",         phone: "07 44 55 66 88", score: 46, delays: 0, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-15", first_name: "Mathis",     last_name: "David",      job_title: "Commis de salle",    role: "employee", contract: "extra", hired: "2025-01-10", email: "mathis.david@karaf-demo.fr",      phone: "06 55 66 77 88", score: 43, delays: 4, today_delays: 1, protocols_read: 2 },
  { profile_id: "profile-16", first_name: "Chloé",      last_name: "Bertrand",   job_title: "Serveuse",           role: "employee", contract: "cdd",   hired: "2024-11-01", email: "chloe.bertrand@karaf-demo.fr",    phone: "07 88 99 00 11", score: 40, delays: 1, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-17", first_name: "Nathan",     last_name: "Morel",      job_title: "Barman",             role: "employee", contract: "cdi",   hired: "2023-05-20", email: "nathan.morel@karaf-demo.fr",      phone: "06 00 11 22 33", score: 37, delays: 2, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-18", first_name: "Jade",       last_name: "Fontaine",   job_title: "Chef de rang",       role: "employee", contract: "cdi",   hired: "2022-12-01", email: "jade.fontaine@karaf-demo.fr",     phone: "07 22 33 44 55", score: 34, delays: 1, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-19", first_name: "Tom",        last_name: "Girard",     job_title: "Serveur",            role: "employee", contract: "extra", hired: "2025-02-01", email: "tom.girard@karaf-demo.fr",        phone: "06 11 22 33 44", score: 31, delays: 5, today_delays: 2, protocols_read: 1 },
  { profile_id: "profile-20", first_name: "Zoé",        last_name: "Lambert",    job_title: "Réceptionniste",     role: "employee", contract: "cdi",   hired: "2023-09-01", email: "zoe.lambert@karaf-demo.fr",       phone: "07 33 44 55 66", score: 28, delays: 0, today_delays: 0, protocols_read: 5 },
  { profile_id: "profile-21", first_name: "Manon",      last_name: "Durand",     job_title: "Serveuse",           role: "employee", contract: "cdd",   hired: "2024-05-15", email: "manon.durand@karaf-demo.fr",      phone: "06 44 55 66 77", score: 25, delays: 2, today_delays: 0, protocols_read: 2 },
  { profile_id: "profile-22", first_name: "Baptiste",   last_name: "Lecomte",    job_title: "Commis de cuisine",  role: "employee", contract: "cdi",   hired: "2023-08-01", email: "baptiste.lecomte@karaf-demo.fr",  phone: "07 55 66 77 88", score: 22, delays: 3, today_delays: 0, protocols_read: 2 },
  { profile_id: "profile-23", first_name: "Clara",      last_name: "Chevalier",  job_title: "Serveuse",           role: "employee", contract: "cdi",   hired: "2022-10-15", email: "clara.chevalier@karaf-demo.fr",   phone: "06 66 77 88 99", score: 19, delays: 1, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-24", first_name: "Maxime",     last_name: "Blanc",      job_title: "Cuisinier",          role: "employee", contract: "cdi",   hired: "2021-11-01", email: "maxime.blanc@karaf-demo.fr",      phone: "07 77 88 99 00", score: 17, delays: 4, today_delays: 1, protocols_read: 1 },
  { profile_id: "profile-25", first_name: "Lucie",      last_name: "Henry",      job_title: "Hôtesse",            role: "employee", contract: "extra", hired: "2025-03-01", email: "lucie.henry@karaf-demo.fr",       phone: "06 88 99 00 11", score: 14, delays: 2, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-26", first_name: "Raphaël",    last_name: "Garnier",    job_title: "Barman",             role: "employee", contract: "cdd",   hired: "2024-08-20", email: "raphael.garnier@karaf-demo.fr",   phone: "07 99 00 11 22", score: 12, delays: 1, today_delays: 0, protocols_read: 2 },
  { profile_id: "profile-27", first_name: "Noémie",     last_name: "Faure",      job_title: "Serveuse",           role: "employee", contract: "cdi",   hired: "2023-03-15", email: "noemie.faure@karaf-demo.fr",      phone: "06 00 99 88 77", score: 10, delays: 3, today_delays: 0, protocols_read: 2 },
  { profile_id: "profile-28", first_name: "Anaïs",      last_name: "Renard",     job_title: "Caissière",          role: "employee", contract: "cdi",   hired: "2022-07-01", email: "anais.renard@karaf-demo.fr",      phone: "07 11 00 99 88", score: 8,  delays: 2, today_delays: 0, protocols_read: 3 },
  { profile_id: "profile-29", first_name: "Kevin",      last_name: "Martinez",   job_title: "Serveur",            role: "employee", contract: "extra", hired: "2025-01-20", email: "kevin.martinez@karaf-demo.fr",    phone: "06 22 11 00 99", score: 6,  delays: 6, today_delays: 2, protocols_read: 1 },
  { profile_id: "profile-30", first_name: "Sarah",      last_name: "Lemaire",    job_title: "Chef de rang",       role: "employee", contract: "cdi",   hired: "2023-06-10", email: "sarah.lemaire@karaf-demo.fr",     phone: "07 33 22 11 00", score: 4,  delays: 1, today_delays: 0, protocols_read: 4 },
  { profile_id: "profile-31", first_name: "Florian",    last_name: "Dupuis",     job_title: "Commis de salle",    role: "employee", contract: "extra", hired: "2024-12-01", email: "florian.dupuis@karaf-demo.fr",    phone: "06 44 33 22 11", score: 2,  delays: 4, today_delays: 1, protocols_read: 1 },
] as const;

const PROTOCOLS_TOTAL = 5;
type Badge = "gold" | "silver" | "bronze" | null;
function badge(i: number): Badge { return (["gold", "silver", "bronze"] as Badge[])[i] ?? null; }

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

export const DEV_LEADERBOARD = DEV_EMPLOYEES
  .slice().sort((a, b) => b.score - a.score)
  .map((e, i) => ({
    profile_id: e.profile_id,
    name: `${e.first_name} ${e.last_name}`,
    first_name: e.first_name,
    last_name: e.last_name,
    avatar_url: null as string | null,
    job_title: e.job_title as string | null,
    score: e.score,
    delays_count: e.delays,
    today_delay_count: e.today_delays,
    protocols_read: e.protocols_read,
    protocols_total: PROTOCOLS_TOTAL,
    badge: badge(i),
  }));

// ─── ÉQUIPE ───────────────────────────────────────────────────────────────────

export const DEV_TEAM_MEMBERS = [
  { id: "m1", profile_id: DEV_PROFILE_ID, role: "owner" as const, job_title: "Responsable", hired_at: "2021-01-01", is_active: true, first_name: "Dev", last_name: "Mode", email: "dev@carafe.app", avatar_url: null, contract_type: "cdi" as const, phone: null, availability: [] },
  ...DEV_EMPLOYEES.map((e, i) => ({
    id: `m${i + 2}`,
    profile_id: e.profile_id,
    role: e.role as "manager" | "employee",
    job_title: e.job_title,
    hired_at: e.hired,
    is_active: true,
    first_name: e.first_name,
    last_name: e.last_name,
    email: e.email,
    avatar_url: null as string | null,
    contract_type: e.contract as "cdi" | "cdd" | "extra",
    phone: e.phone,
    availability: [],
  })),
];

export const DEV_SCORING_MEMBERS = [
  { profile_id: DEV_PROFILE_ID, first_name: "Dev", last_name: "Mode", avatar_url: null, job_title: "Responsable" },
  ...DEV_EMPLOYEES.map(e => ({ profile_id: e.profile_id, first_name: e.first_name, last_name: e.last_name, avatar_url: null as string | null, job_title: e.job_title })),
];

export const DEV_TEAM_OPTIONS = [
  { profile_id: DEV_PROFILE_ID, name: "Dev Mode" },
  ...DEV_EMPLOYEES.map(e => ({ profile_id: e.profile_id, name: `${e.first_name} ${e.last_name}` })),
];

// ─── RETARDS ─────────────────────────────────────────────────────────────────

export const DEV_DELAYS_DATA = [
  { id: "d1",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-5",  reported_by: DEV_PROFILE_ID, shift_date: dAgo(1).split("T")[0],  shift_type: "morning", delay_minutes: 15, reason: "Problème de transport",    created_at: dAgo(1),  employee_name: "Rayan Dupont" },
  { id: "d2",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-3",  reported_by: DEV_PROFILE_ID, shift_date: dAgo(3).split("T")[0],  shift_type: "evening", delay_minutes: 30, reason: "Embouteillages",             created_at: dAgo(3),  employee_name: "Alexandre Bonnet" },
  { id: "d3",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-11", reported_by: DEV_PROFILE_ID, shift_date: dAgo(5).split("T")[0],  shift_type: "morning", delay_minutes: 20, reason: "Réveil raté",                created_at: dAgo(5),  employee_name: "Théo Rousseau" },
  { id: "d4",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-19", reported_by: DEV_PROFILE_ID, shift_date: dAgo(2).split("T")[0],  shift_type: "evening", delay_minutes: 45, reason: "Grève RATP",                 created_at: dAgo(2),  employee_name: "Tom Girard" },
  { id: "d5",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-15", reported_by: DEV_PROFILE_ID, shift_date: dAgo(7).split("T")[0],  shift_type: "morning", delay_minutes: 10, reason: null,                        created_at: dAgo(7),  employee_name: "Mathis David" },
  { id: "d6",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-29", reported_by: DEV_PROFILE_ID, shift_date: dAgo(4).split("T")[0],  shift_type: "evening", delay_minutes: 60, reason: "Urgence personnelle",        created_at: dAgo(4),  employee_name: "Kevin Martinez" },
  { id: "d7",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-24", reported_by: DEV_PROFILE_ID, shift_date: dAgo(10).split("T")[0], shift_type: "morning", delay_minutes: 25, reason: "Problème de voiture",       created_at: dAgo(10), employee_name: "Maxime Blanc" },
  { id: "d8",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-19", reported_by: DEV_PROFILE_ID, shift_date: dAgo(12).split("T")[0], shift_type: "evening", delay_minutes: 15, reason: null,                        created_at: dAgo(12), employee_name: "Tom Girard" },
  { id: "d9",  establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-31", reported_by: DEV_PROFILE_ID, shift_date: dAgo(6).split("T")[0],  shift_type: "morning", delay_minutes: 35, reason: "Voiture en panne",           created_at: dAgo(6),  employee_name: "Florian Dupuis" },
  { id: "d10", establishment_id: DEV_ESTABLISHMENT_ID, employee_id: "profile-9",  reported_by: DEV_PROFILE_ID, shift_date: dAgo(8).split("T")[0],  shift_type: "afternoon", delay_minutes: 10, reason: null,                     created_at: dAgo(8),  employee_name: "Hugo Bernard" },
];

// ─── PROTOCOLES ──────────────────────────────────────────────────────────────

export const DEV_PROTOCOLS = [
  {
    id: "p1", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Procédure d'ouverture",
    content: "Checklist complète à effectuer avant l'ouverture du service :\n\n1. Vérifier les températures des frigos (2°C–4°C)\n2. Allumer la ventilation et la climatisation\n3. Préparer la caisse (fond de caisse 200€)\n4. Nettoyer et dresser toutes les tables\n5. Vérifier les réservations du jour\n6. Briefing équipe à 11h30 en salle\n7. Accrocher l'ardoise du jour",
    category: "ouverture", is_mandatory: true,
    created_at: dAgo(14), updated_at: dAgo(2), read_count: 28, author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    attachment_type: "image", attachment_name: "salle_ouverture.jpg", show_on_dashboard: true,
    steps: [
      { text: "Contrôler les températures frigos", frequency: "opening" },
      { text: "Mettre en marche la ventilation", frequency: "opening" },
      { text: "Préparer le fond de caisse", frequency: "opening" },
      { text: "Dresser les tables (nappe, couverts, verres)", frequency: "opening" },
      { text: "Briefing équipe", frequency: "opening" },
    ],
  },
  {
    id: "p2", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Procédure de fermeture",
    content: "À effectuer obligatoirement après chaque service du soir :\n\n1. Encaisser et clôturer la caisse\n2. Nettoyer toutes les tables et les chaises\n3. Débarrasser et ranger la mise en place\n4. Vérifier que tous les plats sont rangés en chambre froide\n5. Nettoyage du sol (balai + serpillière)\n6. Vérification des frigos et congélateurs\n7. Éteindre tous les équipements\n8. Activer l'alarme et fermer à double tour",
    category: "fermeture", is_mandatory: true,
    created_at: dAgo(14), updated_at: dAgo(1), read_count: 25, author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1555396273-648ff5e73a5e?w=800&q=80",
    attachment_type: "image", attachment_name: "fermeture_cuisine.jpg", show_on_dashboard: true,
    steps: [
      { text: "Clôturer la caisse", frequency: "closing" },
      { text: "Nettoyer et ranger la salle", frequency: "closing" },
      { text: "Ranger les produits en chambre froide", frequency: "closing" },
      { text: "Nettoyage des sols", frequency: "closing" },
      { text: "Éteindre équipements et activer alarme", frequency: "closing" },
    ],
  },
  {
    id: "p3", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Normes HACCP — Températures",
    content: "Températures de conservation obligatoires :\n\n• Produits frais (frigos 1 & 2) : 0°C à +4°C\n• Surgelés (congélateur) : -18°C minimum\n• Plats chauds en service : minimum +63°C\n• Tranchage jambon/charcuterie : max +3°C\n\nEnregistrer les températures matin et soir dans le registre HACCP sur le comptoir.\n\nSi hors norme : alerter immédiatement le responsable, isoler les produits et ne pas les utiliser.",
    category: "hygiene", is_mandatory: true,
    created_at: dAgo(21), updated_at: dAgo(5), read_count: 29, author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    attachment_type: "image", attachment_name: "haccp_temperatures.jpg", show_on_dashboard: true,
    steps: [
      { text: "Relever la température frigo 1 et 2", frequency: "daily" },
      { text: "Relever la température congélateur", frequency: "daily" },
      { text: "Inscrire dans le registre HACCP", frequency: "daily" },
    ],
  },
  {
    id: "p4", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Plan de salle & numérotation des tables",
    content: "Référez-vous au plan ci-dessous pour le placement des couverts.\n\n• Tables 1–8 : côté fenêtre (vue jardin)\n• Tables 9–14 : côté bar (ambiance animée)\n• Tables 15–18 : terrasse couverte\n• Tables 19–22 : mezzanine (privatisable)\n\nCapacité maximale : 80 couverts (salle + terrasse).\nEn cas de doute sur une réservation, contacter Yasmine.",
    category: "salle", is_mandatory: false,
    created_at: dAgo(30), updated_at: dAgo(10), read_count: 20, author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    attachment_type: "image", attachment_name: "plan_de_salle.jpg", show_on_dashboard: true,
    steps: null,
  },
  {
    id: "p5", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Dressage des tables — standard maison",
    content: "Ordre de mise en place obligatoire :\n\n1. Nappe propre et centrée (sans plis)\n2. Assiette de présentation centrée\n3. Fourchette à gauche · Couteau droit (lame vers l'intérieur) · Cuillère à soupe\n4. Verre à eau (devant) puis verre à vin (légèrement à droite)\n5. Serviette pliée en éventail sur assiette\n6. Pain et ramequin de beurre si menu du jour\n\nSignaler immédiatement tout linge taché ou abîmé.",
    category: "salle", is_mandatory: false,
    created_at: dAgo(20), updated_at: dAgo(8), read_count: 22, author_name: "Dev Mode",
    attachment_url: null, attachment_type: null, attachment_name: null, show_on_dashboard: false,
    steps: null,
  },
  {
    id: "p6", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Accueil & placement des clients",
    content: "Déroulé de l'accueil :\n\n1. Sourire et saluer dès l'entrée (« Bonjour/Bonsoir, bienvenue »)\n2. Demander si réservation · Vérifier le nom\n3. Guider jusqu'à la table assignée\n4. Déposer les cartes (menu + carte des vins)\n5. Présenter les suggestions du chef dans les 2 minutes\n6. Proposer un apéritif dans les 3 minutes suivantes\n\nSi attente : proposer un siège au bar et donner un temps estimé honnête.",
    category: "accueil", is_mandatory: true,
    created_at: dAgo(15), updated_at: dAgo(4), read_count: 27, author_name: "Dev Mode",
    attachment_url: "https://images.unsplash.com/photo-1559526642-c89f7de0e6e4?w=800&q=80",
    attachment_type: "image", attachment_name: "accueil_clients.jpg", show_on_dashboard: true,
    steps: null,
  },
  {
    id: "p7", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Carte des cocktails & accords mets-vins",
    content: "Cocktails signature de la maison :\n\n• Spritz Karaf : Aperol, prosecco, tranche d'orange — 9€\n• Negroni Blanc : gin, Lillet blanc, Campari — 11€\n• Mojito Basilic : rhum blanc, basilic, citron vert — 10€\n\nAccords recommandés par le chef :\n• Viandes rouges → Côtes-du-Rhône / Bordeaux rouge\n• Poissons & fruits de mer → Chablis / Sancerre blanc\n• Fromages → Sauternes / Porto\n\nNe jamais proposer un accord de mémoire — consulter la carte en cas de doute.",
    category: "bar", is_mandatory: false,
    created_at: dAgo(10), updated_at: dAgo(3), read_count: 18, author_name: "Antoine Moreau",
    attachment_url: "https://images.unsplash.com/photo-1572116469696-6b13fbfc4cd0?w=800&q=80",
    attachment_type: "image", attachment_name: "cocktails_bar.jpg", show_on_dashboard: false,
    steps: null,
  },
  {
    id: "p8", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Organisation de la cuisine en service",
    content: "Postes et responsabilités en service :\n\n• Julien (Chef) : coordination générale, annonces à l'envoi\n• Maxime (Chaud) : poêles, grillades, sauces\n• Baptiste (Froid) : entrées froides, dressage des desserts\n• Lucas (Plonge) : vaisselle en continu, dès réception\n\nRègles de communication :\n• Annoncer chaque plat à l'envoi\n• « Oui chef » obligatoire pour confirmer\n• Pas de téléphone en cuisine pendant le service",
    category: "cuisine", is_mandatory: true,
    created_at: dAgo(18), updated_at: dAgo(6), read_count: 15, author_name: "Julien Perrin",
    attachment_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    attachment_type: "image", attachment_name: "organisation_cuisine.jpg", show_on_dashboard: true,
    steps: null,
  },
  {
    id: "p9", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Gestion des allergènes",
    content: "Les 14 allergènes majeurs à maîtriser :\n\nGluten · Crustacés · Œufs · Poissons · Arachides · Soja · Lait · Fruits à coque · Céleri · Moutarde · Sésame · Sulfites · Lupin · Mollusques\n\nProcédure en cas de demande client :\n1. Consulter la fiche allergènes en cuisine AVANT de répondre\n2. Ne JAMAIS affirmer sans vérification\n3. Contacter Julien (chef) si doute\n4. Proposer une alternative sûre\n5. En cas d'allergie sévère : prévenir la cuisine séparément",
    category: "hygiene", is_mandatory: true,
    created_at: dAgo(25), updated_at: dAgo(7), read_count: 24, author_name: "Dev Mode",
    attachment_url: null, attachment_type: null, attachment_name: null, show_on_dashboard: true,
    steps: null,
  },
  {
    id: "p10", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Sécurité — incendie & évacuation",
    content: "Consignes de sécurité incendie :\n\n• Extincteurs : entrée cuisine (CO2), hall d'entrée (poudre)\n• Sorties de secours : 2 issues en salle, 1 issue cuisine\n• Point de rassemblement : parking rue de Rivoli\n\nEn cas d'incendie :\n1. Alerter (18 ou 112)\n2. Évacuer les clients calmement sans courir\n3. Ne JAMAIS utiliser les ascenseurs\n4. Fermer les portes coupe-feu\n5. Se rendre au point de rassemblement\n\nRappel : exercice d'évacuation annuel obligatoire.",
    category: "securite", is_mandatory: true,
    created_at: dAgo(45), updated_at: dAgo(15), read_count: 26, author_name: "Dev Mode",
    attachment_url: null, attachment_type: null, attachment_name: null, show_on_dashboard: true,
    steps: null,
  },
  {
    id: "p11", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Nettoyage des équipements de cuisine",
    content: "Planning de nettoyage hebdomadaire :\n\n• Quotidien : surfaces de travail, plaques de cuisson, friteuses\n• Lundi : nettoyage approfondi des frigos\n• Mercredi : dégraissage de la hotte et des filtres\n• Vendredi : nettoyage du four basse température\n• Dimanche : nettoyage général cuisine (sol, murs carrelés)\n\nProduits à utiliser :\n• Dégraissant Pro (rouge) pour les surfaces chaudes\n• Désinfectant Multi-surfaces (bleu) pour les plans de travail\n• NE PAS mélanger les produits",
    category: "hygiene", is_mandatory: false,
    created_at: dAgo(12), updated_at: dAgo(2), read_count: 12, author_name: "Julien Perrin",
    attachment_url: null, attachment_type: null, attachment_name: null, show_on_dashboard: false,
    steps: [
      { text: "Nettoyer surfaces de travail", frequency: "daily" },
      { text: "Dégraisser plaques et friteuses", frequency: "daily" },
      { text: "Dégraissage hotte et filtres", frequency: "closing" },
    ],
  },
  {
    id: "p12", establishment_id: DEV_ESTABLISHMENT_ID, author_id: DEV_PROFILE_ID,
    title: "Prise de commande & upselling",
    content: "Méthode de prise de commande :\n\n1. Mémoriser les commandes (ne pas noter devant le client si possible)\n2. Répéter la commande pour confirmation\n3. Suggérer systématiquement :\n   • Une entrée si le client prend un plat\n   • Un dessert ou café en fin de repas\n   • Un verre de vin en accord avec le plat\n4. Mettre en avant les suggestions du chef et les plats à forte marge\n5. Envoyer la commande en cuisine dans les 2 minutes\n\nObjectif : panier moyen > 42€ par couvert.",
    category: "salle", is_mandatory: false,
    created_at: dAgo(8), updated_at: dAgo(1), read_count: 16, author_name: "Yasmine Benali",
    attachment_url: null, attachment_type: null, attachment_name: null, show_on_dashboard: false,
    steps: null,
  },
];

// ─── TÂCHES ───────────────────────────────────────────────────────────────────

export const DEV_TASK_TEMPLATES = [
  // OUVERTURE
  { id: "t1",  title: "Ouverture caisse",                  description: "Vérifier fond de caisse 200€",          category: "opening",   target_role: "manager", frequency: "daily",       requires_photo: true,  is_critical: true,  is_active: true, display_order: 1,  assigned_to: null, protocol_id: "p1" },
  { id: "t2",  title: "Contrôle températures frigos",      description: "Entre 2°C et 4°C, noter dans HACCP",    category: "opening",   target_role: "manager", frequency: "daily",       requires_photo: true,  is_critical: true,  is_active: true, display_order: 2,  assigned_to: null, protocol_id: "p3" },
  { id: "t3",  title: "Briefing équipe",                   description: null,                                     category: "opening",   target_role: "manager", frequency: "daily",       requires_photo: false, is_critical: false, is_active: true, display_order: 3,  assigned_to: null, protocol_id: null },
  { id: "t4",  title: "Mise en place salle",               description: "Nappes, couverts, verres",               category: "opening",   target_role: "salle",   frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 4,  assigned_to: null, protocol_id: "p5" },
  { id: "t5",  title: "Mise en place cuisine",             description: null,                                     category: "opening",   target_role: "cuisine", frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 5,  assigned_to: null, protocol_id: null },
  { id: "t6",  title: "Préparer le bar",                   description: "Glace, jus frais, garnitures cocktails", category: "opening",   target_role: "bar",     frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 6,  assigned_to: null, protocol_id: "p7" },
  // FERMETURE
  { id: "t7",  title: "Fermeture caisse",                  description: "Compter et clôturer",                    category: "closing",   target_role: "manager", frequency: "daily",       requires_photo: true,  is_critical: true,  is_active: true, display_order: 7,  assigned_to: null, protocol_id: null },
  { id: "t8",  title: "Nettoyage salle",                   description: null,                                     category: "closing",   target_role: "salle",   frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 8,  assigned_to: null, protocol_id: null },
  { id: "t9",  title: "Nettoyage hotte & filtres",         description: "Dégraissage complet",                    category: "closing",   target_role: "cuisine", frequency: "daily",       requires_photo: true,  is_critical: true,  is_active: true, display_order: 9,  assigned_to: null, protocol_id: "p11" },
  { id: "t10", title: "Plonge terminée & rangement",       description: null,                                     category: "closing",   target_role: "cuisine", frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 10, assigned_to: null, protocol_id: null },
  { id: "t11", title: "Vérification frigos fermeture",     description: "Températures + films alimentaires",      category: "closing",   target_role: "manager", frequency: "daily",       requires_photo: false, is_critical: true,  is_active: true, display_order: 11, assigned_to: null, protocol_id: "p3" },
  // EN CONTINU
  { id: "t12", title: "Vérifier propreté des toilettes",   description: "Toutes les 2 heures",                    category: "continuous", target_role: "salle",  frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 12, assigned_to: null, protocol_id: null },
  { id: "t13", title: "Réapprovisionner bar",              description: "Bouteilles, glaçons, garnitures",        category: "continuous", target_role: "bar",    frequency: "per_service", requires_photo: false, is_critical: false, is_active: true, display_order: 13, assigned_to: null, protocol_id: null },
  // HEBDOMADAIRE
  { id: "t14", title: "Nettoyage four basse température",  description: "Dégraissage complet four",               category: "closing",   target_role: "cuisine", frequency: "weekly",      requires_photo: true,  is_critical: false, is_active: true, display_order: 14, assigned_to: null, protocol_id: "p11" },
  { id: "t15", title: "Inventaire cave à vins",            description: "Mettre à jour le stock",                 category: "closing",   target_role: "bar",     frequency: "weekly",      requires_photo: false, is_critical: false, is_active: true, display_order: 15, assigned_to: null, protocol_id: null },
];

export const DEV_TASK_ONE_SHOTS = [
  { id: "os1", title: "Vérifier livraison vin Durand",    description: "Commande de 24 bouteilles Côtes-du-Rhône + 12 Chablis", target_role: "bar",     due_date: today,                              requires_photo: false, is_validated: false, assigned_to: "profile-7",  protocol_id: null },
  { id: "os2", title: "Former Florian à l'accueil",       description: "Protocole accueil + plan de salle à revoir ensemble",   target_role: "manager", due_date: dAgo(-2).split("T")[0],             requires_photo: false, is_validated: false, assigned_to: DEV_PROFILE_ID, protocol_id: "p6" },
  { id: "os3", title: "Remplacer filtre hotte cuisine",   description: "Filtre usé signalé par Julien, à changer ce soir",      target_role: "cuisine", due_date: today,                              requires_photo: true,  is_validated: false, assigned_to: "profile-4",  protocol_id: null },
];

// ─── RETOURS CLIENTS ─────────────────────────────────────────────────────────

export const DEV_FEEDBACKS = [
  { id: "f1",  reported_by: "profile-5",  reporter_name: "Rayan Dupont",    reporter_first: "Rayan",    reporter_last: "Dupont",    reporter_avatar: null, item_cat: "plat",     tonality: "negative", item: "Tarte tatin",           content: "trop sucrée, le client a pas fini son assiette",                      table_number: "5",  echo_count: 3,  is_echoed: false, is_mine: false, created_at: dAgo(0, 2) },
  { id: "f2",  reported_by: "profile-2",  reporter_name: "Yasmine Benali",  reporter_first: "Yasmine",  reporter_last: "Benali",    reporter_avatar: null, item_cat: "service",  tonality: "positive", item: "Accueil soir",           content: "la table 8 a trouvé l'accueil super chaleureux, ont demandé notre prénom", table_number: "8",  echo_count: 5,  is_echoed: true,  is_mine: false, created_at: dAgo(0, 5) },
  { id: "f3",  reported_by: DEV_PROFILE_ID, reporter_name: "Dev Mode",      reporter_first: "Dev",      reporter_last: "Mode",      reporter_avatar: null, item_cat: "boisson",  tonality: "negative", item: "Vin blanc maison",        content: "trop froid selon le client, a demandé à le réchauffer",               table_number: "12", echo_count: 1,  is_echoed: false, is_mine: true,  created_at: dAgo(1) },
  { id: "f4",  reported_by: "profile-2",  reporter_name: "Yasmine Benali",  reporter_first: "Yasmine",  reporter_last: "Benali",    reporter_avatar: null, item_cat: "ambiance", tonality: "negative", item: "Bruit en salle",          content: "table 3 s'est plainte du bruit venant de la cuisine",                  table_number: "3",  echo_count: 2,  is_echoed: false, is_mine: false, created_at: dAgo(2) },
  { id: "f5",  reported_by: "profile-5",  reporter_name: "Rayan Dupont",    reporter_first: "Rayan",    reporter_last: "Dupont",    reporter_avatar: null, item_cat: "plat",     tonality: "positive", item: "Risotto champignons",     content: "excellent, table 7 a demandé à féliciter le chef",                    table_number: "7",  echo_count: 4,  is_echoed: false, is_mine: false, created_at: dAgo(2) },
  { id: "f6",  reported_by: "profile-6",  reporter_name: "Léa Martin",      reporter_first: "Léa",      reporter_last: "Martin",    reporter_avatar: null, item_cat: "service",  tonality: "negative", item: "Temps d'attente",         content: "table 15 a attendu 40 min pour les entrées, client très mécontent",   table_number: "15", echo_count: 3,  is_echoed: false, is_mine: false, created_at: dAgo(3) },
  { id: "f7",  reported_by: "profile-7",  reporter_name: "Antoine Moreau",  reporter_first: "Antoine",  reporter_last: "Moreau",    reporter_avatar: null, item_cat: "boisson",  tonality: "positive", item: "Spritz Karaf",            content: "la table 9 a adoré notre cocktail signature, en ont commandé 3",      table_number: "9",  echo_count: 2,  is_echoed: false, is_mine: false, created_at: dAgo(3) },
  { id: "f8",  reported_by: "profile-8",  reporter_name: "Sofia Nguyen",    reporter_first: "Sofia",    reporter_last: "Nguyen",    reporter_avatar: null, item_cat: "plat",     tonality: "positive", item: "Pavé de bœuf",            content: "cuisson parfaite selon le client, a laissé 5 étoiles sur Google",      table_number: "2",  echo_count: 6,  is_echoed: true,  is_mine: false, created_at: dAgo(4) },
  { id: "f9",  reported_by: "profile-5",  reporter_name: "Rayan Dupont",    reporter_first: "Rayan",    reporter_last: "Dupont",    reporter_avatar: null, item_cat: "ambiance", tonality: "positive", item: "Ambiance générale",       content: "groupe de 10 personnes ravi de l'ambiance, prévoient de revenir",     table_number: "19", echo_count: 1,  is_echoed: false, is_mine: false, created_at: dAgo(4) },
  { id: "f10", reported_by: "profile-10", reporter_name: "Camille Lefebvre", reporter_first: "Camille", reporter_last: "Lefebvre",  reporter_avatar: null, item_cat: "service",  tonality: "negative", item: "Erreur de commande",      content: "servi un plat végétarien à un client qui avait commandé du poisson",  table_number: "6",  echo_count: 2,  is_echoed: false, is_mine: false, created_at: dAgo(5) },
  { id: "f11", reported_by: "profile-2",  reporter_name: "Yasmine Benali",  reporter_first: "Yasmine",  reporter_last: "Benali",    reporter_avatar: null, item_cat: "plat",     tonality: "negative", item: "Crème brûlée",            content: "sucre pas assez caramélisé, texture pas bonne ce soir",               table_number: "11", echo_count: 1,  is_echoed: false, is_mine: false, created_at: dAgo(5) },
  { id: "f12", reported_by: "profile-9",  reporter_name: "Hugo Bernard",    reporter_first: "Hugo",     reporter_last: "Bernard",   reporter_avatar: null, item_cat: "service",  tonality: "positive", item: "Service de table",        content: "table 4 très satisfaite du service, a tenu à remercier l'équipe",     table_number: "4",  echo_count: 3,  is_echoed: false, is_mine: false, created_at: dAgo(6) },
  { id: "f13", reported_by: "profile-6",  reporter_name: "Léa Martin",      reporter_first: "Léa",      reporter_last: "Martin",    reporter_avatar: null, item_cat: "boisson",  tonality: "negative", item: "Café",                    content: "table 13 trouve le café trop amer depuis le changement de fournisseur", table_number: "13", echo_count: 4,  is_echoed: true,  is_mine: false, created_at: dAgo(7) },
  { id: "f14", reported_by: "profile-7",  reporter_name: "Antoine Moreau",  reporter_first: "Antoine",  reporter_last: "Moreau",    reporter_avatar: null, item_cat: "plat",     tonality: "positive", item: "Planche apéro",           content: "table 1 a adoré la planche charcuterie, veulent la recette du houmous", table_number: "1", echo_count: 2,  is_echoed: false, is_mine: false, created_at: dAgo(8) },
  { id: "f15", reported_by: "profile-12", reporter_name: "Emma Petit",      reporter_first: "Emma",     reporter_last: "Petit",     reporter_avatar: null, item_cat: "ambiance", tonality: "negative", item: "Température",             content: "plusieurs clients ont trouvé la climatisation trop forte ce soir",    table_number: null, echo_count: 5,  is_echoed: true,  is_mine: false, created_at: dAgo(9) },
  { id: "f16", reported_by: "profile-5",  reporter_name: "Rayan Dupont",    reporter_first: "Rayan",    reporter_last: "Dupont",    reporter_avatar: null, item_cat: "plat",     tonality: "positive", item: "Poulpe grillé",           content: "table 16 subjuguée, première fois qu'ils mangent du poulpe comme ça", table_number: "16", echo_count: 2,  is_echoed: false, is_mine: false, created_at: dAgo(10) },
  { id: "f17", reported_by: "profile-2",  reporter_name: "Yasmine Benali",  reporter_first: "Yasmine",  reporter_last: "Benali",    reporter_avatar: null, item_cat: "service",  tonality: "positive", item: "Gestion d'une plainte",   content: "client mécontent géré parfaitement par Rayan, est reparti satisfait", table_number: "5",  echo_count: 7,  is_echoed: true,  is_mine: false, created_at: dAgo(11) },
  { id: "f18", reported_by: "profile-8",  reporter_name: "Sofia Nguyen",    reporter_first: "Sofia",    reporter_last: "Nguyen",    reporter_avatar: null, item_cat: "boisson",  tonality: "positive", item: "Sélection vins",          content: "table 20 impressionnée par la connaissance des vins de Hugo",         table_number: "20", echo_count: 1,  is_echoed: false, is_mine: false, created_at: dAgo(12) },
  { id: "f19", reported_by: "profile-9",  reporter_name: "Hugo Bernard",    reporter_first: "Hugo",     reporter_last: "Bernard",   reporter_avatar: null, item_cat: "plat",     tonality: "negative", item: "Burger végé",             content: "pain rassis selon le client, incident à signaler à la cuisine",       table_number: "10", echo_count: 3,  is_echoed: false, is_mine: false, created_at: dAgo(13) },
  { id: "f20", reported_by: "profile-10", reporter_name: "Camille Lefebvre", reporter_first: "Camille", reporter_last: "Lefebvre",  reporter_avatar: null, item_cat: "service",  tonality: "positive", item: "Anniversaire surprise",   content: "table 17 — chanson d'anniversaire et dessert offert, clients ravis",   table_number: "17", echo_count: 4,  is_echoed: true,  is_mine: false, created_at: dAgo(14) },
];

// ─── DÉFIS ────────────────────────────────────────────────────────────────────

export const DEV_CHALLENGES = [
  { id: "c1", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID, title: "100 avis Google ce mois", description: "Encourager les clients satisfaits à laisser un avis 5 étoiles sur Google My Business.", target_value: 100, current_value: 63, unit: "avis", starts_at: dAgo(20), ends_at: dAgo(-10), status: "active",    created_at: dAgo(20), winner_name: null },
  { id: "c2", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID, title: "Zéro gaspillage alimentaire", description: "Réduire les déchets alimentaires en cuisine grâce à une meilleure gestion des stocks.", target_value: 4, current_value: 2, unit: "semaines sans gaspillage", starts_at: dAgo(14), ends_at: dAgo(-14), status: "active", created_at: dAgo(14), winner_name: null },
  { id: "c3", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID, title: "Zéro retard cette semaine", description: "Toute l'équipe à l'heure pendant 7 jours consécutifs.", target_value: 7, current_value: 3, unit: "jours sans retard", starts_at: dAgo(3), ends_at: dAgo(-4), status: "active", created_at: dAgo(3), winner_name: null },
  { id: "c4", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID, title: "Meilleure note client — avril", description: "Le serveur avec la meilleure note client moyenne du mois gagne.", target_value: null, current_value: 0, unit: null, starts_at: dAgo(40), ends_at: dAgo(10), status: "completed", created_at: dAgo(40), winner_name: "Yasmine Benali" },
  { id: "c5", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID, title: "Ventes cocktails maison", description: "Dépasser 200 cocktails signature vendus sur le mois.", target_value: 200, current_value: 183, unit: "cocktails", starts_at: dAgo(28), ends_at: dAgo(2), status: "completed", created_at: dAgo(28), winner_name: "Antoine Moreau" },
];

// ─── SONDAGES (RDV & PLANNING) ────────────────────────────────────────────────

const topInvitees = DEV_EMPLOYEES.slice(0, 8).map(e => ({
  poll_id: "poll-1", member_id: e.profile_id, member_name: `${e.first_name} ${e.last_name}`,
}));

export const DEV_POLLS = [
  {
    id: "poll-1", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID,
    title: "Réunion mensuelle équipe — juin",
    description: "Point mensuel sur les objectifs, retours clients du mois et préparation de l'été.",
    proposed_date: dAgo(-18).split("T")[0],
    proposed_time: "14:30",
    status: "open",
    created_at: dAgo(2), creator_name: "Dev Mode",
    invitees: [
      { poll_id: "poll-1", member_id: DEV_PROFILE_ID, member_name: "Dev Mode" },
      ...topInvitees,
    ],
    votes: [
      { id: "v1", poll_id: "poll-1", voter_id: DEV_PROFILE_ID, response: "yes",   voter_name: "Dev Mode" },
      { id: "v2", poll_id: "poll-1", voter_id: "profile-2",    response: "yes",   voter_name: "Yasmine Benali" },
      { id: "v3", poll_id: "poll-1", voter_id: "profile-3",    response: "yes",   voter_name: "Alexandre Bonnet" },
      { id: "v4", poll_id: "poll-1", voter_id: "profile-4",    response: "maybe", voter_name: "Julien Perrin" },
      { id: "v5", poll_id: "poll-1", voter_id: "profile-5",    response: "no",    voter_name: "Rayan Dupont" },
      { id: "v6", poll_id: "poll-1", voter_id: "profile-6",    response: "yes",   voter_name: "Léa Martin" },
    ],
  },
  {
    id: "poll-2", establishment_id: DEV_ESTABLISHMENT_ID, created_by: DEV_PROFILE_ID,
    title: "Formation hygiène HACCP obligatoire",
    description: "Formation de 3h avec un formateur externe. Tous les membres de l'équipe doivent participer.",
    proposed_date: dAgo(-25).split("T")[0],
    proposed_time: "09:30",
    status: "open",
    created_at: dAgo(3), creator_name: "Dev Mode",
    invitees: DEV_EMPLOYEES.slice(0, 12).map(e => ({ poll_id: "poll-2", member_id: e.profile_id, member_name: `${e.first_name} ${e.last_name}` })),
    votes: [
      { id: "v7",  poll_id: "poll-2", voter_id: "profile-2",  response: "yes",   voter_name: "Yasmine Benali" },
      { id: "v8",  poll_id: "poll-2", voter_id: "profile-3",  response: "yes",   voter_name: "Alexandre Bonnet" },
      { id: "v9",  poll_id: "poll-2", voter_id: "profile-4",  response: "yes",   voter_name: "Julien Perrin" },
      { id: "v10", poll_id: "poll-2", voter_id: "profile-5",  response: "maybe", voter_name: "Rayan Dupont" },
      { id: "v11", poll_id: "poll-2", voter_id: "profile-6",  response: "yes",   voter_name: "Léa Martin" },
      { id: "v12", poll_id: "poll-2", voter_id: "profile-7",  response: "maybe", voter_name: "Antoine Moreau" },
      { id: "v13", poll_id: "poll-2", voter_id: "profile-8",  response: "no",    voter_name: "Sofia Nguyen" },
    ],
  },
  {
    id: "poll-3", establishment_id: DEV_ESTABLISHMENT_ID, created_by: "profile-2",
    title: "Team building — bowling ou karting ?",
    description: "Vote pour choisir l'activité du prochain team building prévu fin juin.",
    proposed_date: dAgo(-30).split("T")[0],
    proposed_time: "19:00",
    status: "open",
    created_at: dAgo(1), creator_name: "Yasmine Benali",
    invitees: DEV_EMPLOYEES.slice(0, 10).map(e => ({ poll_id: "poll-3", member_id: e.profile_id, member_name: `${e.first_name} ${e.last_name}` })),
    votes: [
      { id: "v14", poll_id: "poll-3", voter_id: "profile-2",  response: "yes",   voter_name: "Yasmine Benali" },
      { id: "v15", poll_id: "poll-3", voter_id: "profile-5",  response: "yes",   voter_name: "Rayan Dupont" },
      { id: "v16", poll_id: "poll-3", voter_id: "profile-6",  response: "yes",   voter_name: "Léa Martin" },
      { id: "v17", poll_id: "poll-3", voter_id: "profile-7",  response: "maybe", voter_name: "Antoine Moreau" },
      { id: "v18", poll_id: "poll-3", voter_id: "profile-9",  response: "no",    voter_name: "Hugo Bernard" },
    ],
  },
];

// ─── SCORE EVENTS ─────────────────────────────────────────────────────────────

const PROTO_LABELS = ["Procédure ouverture", "Normes HACCP", "Accueil clients", "Fermeture caisse", "Gestion allergènes"];
const REVIEW_TABLES = [2, 4, 5, 7, 8, 9, 11, 14, 16, 18];

export const DEV_SCORE_EVENTS = DEV_EMPLOYEES.flatMap((emp, empIdx) => {
  const events: {
    id: string; profile_id: string; source_type: string; source_label: string | null;
    reason: string | null; attributed_by_name: string | null; points: number; created_at: string;
  }[] = [];
  let n = empIdx * 20;
  const id = () => `se${n++}`;

  for (let j = 0; j < emp.protocols_read; j++) {
    events.push({ id: id(), profile_id: emp.profile_id, source_type: "protocol_view", source_label: PROTO_LABELS[j % 5], reason: null, attributed_by_name: null, points: 1, created_at: dAgo(28 - j * 4) });
  }

  let rem = emp.score - emp.protocols_read;

  const reviews = Math.min(Math.floor(rem / 5), 4);
  for (let j = 0; j < reviews; j++) {
    events.push({ id: id(), profile_id: emp.profile_id, source_type: "review_received", source_label: `Table ${REVIEW_TABLES[(empIdx + j) % REVIEW_TABLES.length]}`, reason: null, attributed_by_name: null, points: 5, created_at: dAgo(22 - j * 5) });
    rem -= 5;
  }

  if (rem >= 10 && empIdx % 3 === 0) {
    events.push({ id: id(), profile_id: emp.profile_id, source_type: "challenge_won", source_label: empIdx % 2 === 0 ? "100 avis Google" : "Ventes cocktails", reason: null, attributed_by_name: null, points: 10, created_at: dAgo(9) });
    rem -= 10;
  }

  while (rem >= 2) {
    const mgr = empIdx % 2 === 0 ? "Dev Mode" : "Yasmine Benali";
    events.push({ id: id(), profile_id: emp.profile_id, source_type: "kudo_from_manager", source_label: mgr, reason: null, attributed_by_name: null, points: 2, created_at: dAgo(Math.max(1, 18 - events.length)) });
    rem -= 2;
  }

  if (rem === 1) {
    events.push({ id: id(), profile_id: emp.profile_id, source_type: "kudo_from_peer", source_label: "Collègue", reason: null, attributed_by_name: null, points: 1, created_at: dAgo(1) });
  }

  return events;
});

// ─── STATS HEBDO (me/tasks) ───────────────────────────────────────────────────

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0]);
}
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export const DEV_WEEK_STATS = getLast7Days().map((date, i) => {
  const d = new Date(date);
  const done = [4, 5, 3, 5, 2, 5, 0][i];
  return { date, label: DAY_LABELS[d.getDay()], done, total: 5 };
});

export const DEV_MISSED_TASKS = [
  { taskId: "t7",  title: "Fermeture caisse",              missedDays: 2 },
  { taskId: "t9",  title: "Nettoyage hotte & filtres",     missedDays: 1 },
];
