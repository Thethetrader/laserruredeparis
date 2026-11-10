export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminClient as admin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ ready: false });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const pendingId = session.metadata?.pending_signup_id;
    if (!pendingId) return NextResponse.json({ ready: true });

    // If pending_signup still exists, webhook hasn't fired yet
    const { data } = await admin.from("pending_signups").select("id").eq("id", pendingId).single();
    return NextResponse.json({ ready: !data });
  } catch {
    return NextResponse.json({ ready: false });
  }
}
