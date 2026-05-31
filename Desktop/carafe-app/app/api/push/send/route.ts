import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

webpush.setVapidDetails(
  'mailto:brey.theodore4@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { establishmentId, userId, title, body, url } = await req.json();
  const supabase = await createClient();

  let query = supabase.from('push_subscriptions').select('*').eq('establishment_id', establishmentId);
  if (userId) query = query.eq('profile_id', userId);

  const { data: subs } = await query;
  if (!subs?.length) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch {
      // Subscription expired or invalid
    }
  }
  return NextResponse.json({ sent });
}
