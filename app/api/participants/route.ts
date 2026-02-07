import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("is_confirmed", true)
      .order("updated_at", { ascending: true });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
