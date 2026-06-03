export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { stripe, getPriceId } from "@/lib/stripe";

const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, size } = body as { type: "signup" | "add_establishment"; size: "small" | "large" };

  if (!size || !["small", "large"].includes(size)) {
    return NextResponse.json({ error: "Taille invalide" }, { status: 400 });
  }

  if (type === "signup") {
    const { email, password, first_name, last_name, establishment_name } = body;
    if (!email || !password || !first_name || !last_name || !establishment_name) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // Store pending signup temporarily
    const { data: pending, error: pendingError } = await admin
      .from("pending_signups")
      .insert({ email, password, first_name, last_name, establishment_name, size })
      .select("id")
      .single();

    if (pendingError || !pending) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: getPriceId("first", size), quantity: 1 }],
      metadata: { type: "signup", pending_signup_id: pending.id },
      customer_email: email,
      success_url: `${APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/signup`,
      locale: "fr",
    });

    // Save session_id to pending signup
    await admin.from("pending_signups").update({ stripe_session_id: session.id }).eq("id", pending.id);

    return NextResponse.json({ url: session.url });
  }

  if (type === "add_establishment") {
    const { establishment_name, city } = body;
    if (!establishment_name) {
      return NextResponse.json({ error: "Nom de l'établissement requis" }, { status: 400 });
    }

    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    // Get or create Stripe customer
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email, first_name, last_name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: getPriceId("add", size), quantity: 1 }],
      metadata: {
        type: "add_establishment",
        user_id: user.id,
        establishment_name,
        city: city ?? "",
        size,
      },
      success_url: `${APP_URL}/establishment/switch?added=1`,
      cancel_url: `${APP_URL}/establishment/add`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Type invalide" }, { status: 400 });
}
