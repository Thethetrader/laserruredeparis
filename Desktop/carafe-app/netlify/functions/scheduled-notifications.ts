import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

interface Schedule {
  id: string;
  establishment_id: string;
  title: string;
  body: string;
  url: string;
  hour: number;
  days_of_week: number[];
  target_role: string | null;
}

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Member {
  profile_id: string;
}

export const handler = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
    return { statusCode: 500, body: "Missing env vars" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  webpush.setVapidDetails(
    "mailto:brey.theodore4@gmail.com",
    vapidPublic,
    vapidPrivate
  );

  // Get Paris-local hour and day of week
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const parisHour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const parisWeekday = weekdayNames.indexOf(
    parts.find((p) => p.type === "weekday")?.value ?? "Sun"
  );

  const { data: schedules } = await supabase
    .from("notification_schedules")
    .select("*")
    .eq("is_active", true)
    .eq("hour", parisHour)
    .contains("days_of_week", [parisWeekday]);

  if (!schedules?.length) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
  }

  let totalSent = 0;

  for (const schedule of schedules as Schedule[]) {
    let query = supabase
      .from("push_subscriptions")
      .select("*")
      .eq("establishment_id", schedule.establishment_id);

    if (schedule.target_role) {
      const { data: members } = await supabase
        .from("establishment_members")
        .select("profile_id")
        .eq("establishment_id", schedule.establishment_id)
        .eq("role", schedule.target_role)
        .eq("is_active", true);
      const ids = (members as Member[] | null)?.map((m) => m.profile_id) ?? [];
      if (!ids.length) continue;
      query = query.in("profile_id", ids);
    }

    const { data: subs } = await query;
    if (!subs?.length) continue;

    const payload = JSON.stringify({
      title: schedule.title,
      body: schedule.body,
      url: schedule.url,
    });

    for (const sub of subs as Subscription[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        totalSent++;
      } catch {
        // expired or invalid subscription — skip silently
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ sent: totalSent }) };
};
