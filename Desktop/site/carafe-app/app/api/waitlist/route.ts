import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim()?.toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  // TODO: connecter Resend / Mailchimp ici
  console.log(`[waitlist] Nouvelle inscription : ${email}`);

  return NextResponse.json({ ok: true }, { status: 200 });
}
