import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const establishmentId = formData.get("establishmentId") as string | null;

  if (!file || !establishmentId) {
    return NextResponse.json({ error: "Fichier et établissement requis" }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const path = `${establishmentId}/${Date.now()}_${file.name}`;
  const bytes = await file.arrayBuffer();
  const { data, error } = await admin.storage
    .from("protocol-attachments")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Upload échoué" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from("protocol-attachments")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}
