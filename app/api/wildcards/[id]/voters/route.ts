import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("wildcard_votes")
      .select("user_id, profile:profiles(id, display_name, avatar_url)")
      .eq("wildcard_id", id);

    const voters = (data ?? []).map((v) => v.profile).filter(Boolean);
    return NextResponse.json({ voters });
  } catch {
    return NextResponse.json({ voters: [] });
  }
}
