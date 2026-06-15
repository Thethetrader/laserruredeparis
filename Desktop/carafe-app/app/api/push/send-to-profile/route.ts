import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:brey.theodore4@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { targetProfileId, title, body, url } = await req.json();
  if (!targetProfileId) return NextResponse.json({ error: 'Missing targetProfileId' }, { status: 400 });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('profile_id', targetProfileId);

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
      // Subscription expired or invalid, skip silently
    }
  }
  return NextResponse.json({ sent });
}
