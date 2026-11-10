import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "brey.theodore4@gmail.com";

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: ADMIN_EMAIL,
  });

  if (error || !data?.properties) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }

  const { hashed_token, verification_type } = data.properties;
  return NextResponse.json({ token_hash: hashed_token, type: verification_type });
}
