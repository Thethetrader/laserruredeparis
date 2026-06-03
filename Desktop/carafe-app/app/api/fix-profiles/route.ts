export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// One-time fix: copy first_name/last_name/phone/job_title from accepted invitations to profiles
export async function GET() {
  // Get all accepted invitations that have pre-filled data
  const { data: invitations, error } = await admin
    .from("invitations")
    .select("id, establishment_id, first_name, last_name, phone, job_title, staff_status")
    .eq("status", "accepted")
    .or("first_name.not.is.null,last_name.not.is.null");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];

  for (const inv of (invitations ?? [])) {
    // Find the member who accepted this invitation
    const { data: members } = await admin
      .from("establishment_members")
      .select("profile_id, job_title, staff_status")
      .eq("establishment_id", inv.establishment_id)
      .eq("is_active", true);

    for (const member of (members ?? [])) {
      // Check current profile
      const { data: profile } = await admin
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .eq("id", member.profile_id)
        .single();

      if (!profile) continue;

      // Only update if profile is missing name data
      if (profile.first_name && profile.last_name) continue;

      const updates: Record<string, string | null> = {};
      if (!profile.first_name && inv.first_name) updates.first_name = inv.first_name;
      if (!profile.last_name && inv.last_name) updates.last_name = inv.last_name;
      if (!profile.phone && inv.phone) updates.phone = inv.phone;

      if (Object.keys(updates).length === 0) continue;

      const { error: updateError } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", member.profile_id);

      // Also update job_title / staff_status on the membership if missing
      const memberUpdates: Record<string, string | null> = {};
      if (!member.job_title && inv.job_title) memberUpdates.job_title = inv.job_title;
      if (!member.staff_status && inv.staff_status) memberUpdates.staff_status = inv.staff_status;
      if (Object.keys(memberUpdates).length > 0) {
        await admin.from("establishment_members").update(memberUpdates).eq("profile_id", member.profile_id).eq("establishment_id", inv.establishment_id);
      }

      results.push({
        profile_id: member.profile_id,
        updated: updates,
        error: updateError?.message ?? null,
      });
    }
  }

  return NextResponse.json({ fixed: results.length, results });
}
