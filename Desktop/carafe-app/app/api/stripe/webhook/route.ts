export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.type === "signup") {
      await handleSignup(session, meta);
    } else if (meta.type === "add_establishment") {
      await handleAddEstablishment(session, meta);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSignup(session: Stripe.Checkout.Session, meta: Record<string, string>) {
  const { pending_signup_id } = meta;
  if (!pending_signup_id) return;

  const { data: pending } = await admin
    .from("pending_signups")
    .select("*")
    .eq("id", pending_signup_id)
    .single();

  if (!pending) return;

  // Create user
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: pending.email,
    password: pending.password,
    email_confirm: true,
    user_metadata: { first_name: pending.first_name, last_name: pending.last_name },
  });

  if (userError || !userData.user) return;
  const userId = userData.user.id;

  // Link Stripe customer to profile
  if (session.customer) {
    await admin.from("profiles").update({ stripe_customer_id: session.customer as string }).eq("id", userId);
  }

  // Create establishment
  const { data: estab } = await admin
    .from("establishments")
    .insert({
      name: pending.establishment_name,
      owner_id: userId,
      subscription_status: "active",
      subscription_tier: pending.size === "large" ? "large" : "small",
      stripe_subscription_id: session.subscription as string,
    })
    .select()
    .single();

  if (!estab) { await admin.auth.admin.deleteUser(userId); return; }

  await admin.from("establishment_members").insert({
    establishment_id: estab.id,
    profile_id: userId,
    role: "owner",
  });

  // Clean up pending signup
  await admin.from("pending_signups").delete().eq("id", pending_signup_id);
}

async function handleAddEstablishment(_session: Stripe.Checkout.Session, meta: Record<string, string>) {
  const { user_id, establishment_name, city, size } = meta;
  if (!user_id || !establishment_name) return;

  const { data: estab } = await admin
    .from("establishments")
    .insert({
      name: establishment_name,
      city: city || null,
      owner_id: user_id,
      subscription_status: "active",
      subscription_tier: size === "large" ? "large" : "small",
      stripe_subscription_id: _session.subscription as string,
    })
    .select()
    .single();

  if (!estab) return;

  await admin.from("establishment_members").insert({
    establishment_id: estab.id,
    profile_id: user_id,
    role: "owner",
  });
}
