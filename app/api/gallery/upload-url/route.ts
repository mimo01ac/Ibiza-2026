import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const { filename, category } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "No filename" }, { status: 400 });
    }

    const filePath = `${category || "ibiza_2026"}/${Date.now()}-${filename}`;
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from("gallery")
      .createSignedUploadUrl(filePath);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
