export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { session_id, password } = await req.json();

  if (!session_id || !password || password.length < 8) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Retrieve session from Stripe to verify payment
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return NextResponse.json({ error: "Session Stripe introuvable" }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Paiement non confirmé" }, { status: 402 });
  }

  const meta = session.metadata ?? {};
  if (meta.type !== "signup") {
    return NextResponse.json({ error: "Type de session invalide" }, { status: 400 });
  }

  const { email, first_name, last_name, establishment_name, size } = meta;
  if (!email || !first_name || !last_name || !establishment_name) {
    return NextResponse.json({ error: "Métadonnées manquantes" }, { status: 400 });
  }

  // Check if account already exists (idempotency)
  const { data: existing } = await admin.auth.admin.getUserByEmail(email);
  if (existing?.user) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  // Create user
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (userError || !userData.user) {
    const msg = userError?.message ?? "Erreur création compte";
    if (msg.includes("already") || msg.includes("existe")) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = userData.user.id;

  // Link Stripe customer
  if (session.customer) {
    await admin.from("profiles").update({ stripe_customer_id: session.customer as string }).eq("id", userId);
  }

  // Create establishment
  const { data: estab, error: estabError } = await admin
    .from("establishments")
    .insert({
      name: establishment_name,
      owner_id: userId,
      subscription_status: "active",
      subscription_tier: size === "large" ? "large" : "small",
      stripe_subscription_id: session.subscription as string,
    })
    .select()
    .single();

  if (estabError || !estab) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erreur création établissement" }, { status: 500 });
  }

  // Create owner membership
  await admin.from("establishment_members").insert({
    establishment_id: estab.id,
    profile_id: userId,
    role: "owner",
  });

  return NextResponse.json({ ok: true });
}
