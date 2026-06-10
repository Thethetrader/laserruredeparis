import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:brey.theodore4@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { establishmentId, title, body, url, targetRole } = await req.json();
  // Service role client to bypass RLS — needed to read all subscriptions for the establishment
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
