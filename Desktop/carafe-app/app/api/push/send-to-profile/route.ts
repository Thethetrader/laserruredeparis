import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:brey.theodore4@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { establishmentId, title, body, url, targetProfileId, senderProfileId } = await req.json();

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase.from('push_subscriptions').select('*').eq('establishment_id', establishmentId);

  if (targetProfileId) {
    // DM → only the recipient
    query = query.eq('profile_id', targetProfileId);
  } else {
    // Général → all members except sender
    const { data: members } = await supabase
      .from('establishment_members')
      .select('profile_id')
      .eq('establishment_id', establishmentId)
      .eq('is_active', true);
    const profileIds = (members ?? [])
      .map((m: { profile_id: string }) => m.profile_id)
      .filter((id: string) => id !== senderProfileId);
    if (!profileIds.length) return NextResponse.json({ sent: 0 });
    query = query.in('profile_id', profileIds);
  }

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
      // expired or invalid subscription, skip
    }
  }
  return NextResponse.json({ sent });
}
