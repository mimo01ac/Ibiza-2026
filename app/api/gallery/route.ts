import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || "past_trips";
    const supabase = await createClient();
    const { data } = await supabase
      .from("gallery_photos")
      .select("*, profile:profiles(*)")
      .eq("category", category)
      .order("created_at", { ascending: false });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

// Accepts JSON body with { filePath, category, caption } for direct-uploaded files
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const supabase = createAdminClient();
    const contentType = req.headers.get("content-type") || "";

    let filePath: string;
    let category: string;
    let caption: string | null;

    if (contentType.includes("application/json")) {
      // Direct upload path: file already in Supabase via signed URL
      const body = await req.json();
      filePath = body.filePath;
      category = body.category || "ibiza_2026";
      caption = body.caption || null;

      if (!filePath) {
        return NextResponse.json({ error: "No filePath provided" }, { status: 400 });
      }
    } else {
      // Legacy: file uploaded through the API (small files only)
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      category = (formData.get("category") as string) || "ibiza_2026";
      caption = (formData.get("caption") as string) || null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      filePath = `${category}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, buffer, { contentType: file.type });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    const { data: urlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("gallery_photos")
      .insert({
        file_path: filePath,
        file_url: urlData.publicUrl,
        caption,
        category,
        uploaded_by: profile.id,
      })
      .select("*, profile:profiles(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
