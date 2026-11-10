import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { adminClient as supabase } from '@/lib/supabase/admin';

webpush.setVapidDetails(
  'mailto:brey.theodore4@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { establishmentId, title, body, url, targetRole } = await req.json();

  let query = supabase.from('push_subscriptions').select('*').eq('establishment_id', establishmentId);

  if (targetRole) {
    // Filter to only members with the target role
    const { data: members } = await supabase
      .from('establishment_members')
      .select('profile_id')
      .eq('establishment_id', establishmentId)
      .eq('role', targetRole)
      .eq('is_active', true);
    const profileIds = members?.map((m: { profile_id: string }) => m.profile_id) ?? [];
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
      // Subscription may be expired or invalid skip silently
    }
  }
  return NextResponse.json({ sent });
}
