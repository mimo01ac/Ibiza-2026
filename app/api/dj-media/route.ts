import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("dj-media")
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (error) return NextResponse.json({ photos: [], tracks: [] });

    const files = (data ?? []).filter((f) => !f.name.startsWith("."));

    const photos: string[] = [];
    const tracks: { name: string; url: string }[] = [];

    for (const f of files) {
      const { data: urlData } = supabase.storage
        .from("dj-media")
        .getPublicUrl(f.name);
      const url = urlData.publicUrl;

      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)) {
        photos.push(url);
      } else if (/\.(mp3|wav|ogg|m4a)$/i.test(f.name)) {
        tracks.push({
          name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          url,
        });
      }
    }

    return NextResponse.json({ photos, tracks });
  } catch {
    return NextResponse.json({ photos: [], tracks: [] });
  }
}
