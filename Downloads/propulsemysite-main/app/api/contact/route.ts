import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const { name, email, message } = await req.json();

  // Sécurité : ne jamais mettre le mot de passe en dur !
  // On va lire les infos depuis les variables d'environnement
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const to = "brey.theodore4@gmail.com";

  if (!user || !pass) {
    return NextResponse.json({ error: "Email non configuré" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: user,
      to,
      subject: `Nouveau message de ${name}`,
      text: `Email: ${email}\n\nMessage:\n${message}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
} 