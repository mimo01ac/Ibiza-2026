import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const supabase = createAdminClient();

    const { data: photo } = await supabase
      .from("gallery_photos")
      .select("uploaded_by, file_path")
      .eq("id", id)
      .single();

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (photo.uploaded_by !== profile.id && !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from storage
    await supabase.storage.from("gallery").remove([photo.file_path]);

    // Delete record
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
