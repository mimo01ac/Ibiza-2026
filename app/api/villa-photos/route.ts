import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("villa-photos")
      .list("", { limit: 50, sortBy: { column: "name", order: "asc" } });

    if (error) return NextResponse.json([]);

    const urls = (data ?? [])
      .filter((f) => !f.name.startsWith("."))
      .map((f) => {
        const { data: urlData } = supabase.storage
          .from("villa-photos")
          .getPublicUrl(f.name);
        return urlData.publicUrl;
      });

    return NextResponse.json(urls);
  } catch {
    return NextResponse.json([]);
  }
}
