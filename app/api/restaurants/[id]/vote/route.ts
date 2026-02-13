import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
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

    const { data: existing } = await supabase
      .from("restaurant_votes")
      .select("id")
      .eq("restaurant_id", id)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      await supabase.from("restaurant_votes").delete().eq("id", existing.id);
    } else {
      await supabase.from("restaurant_votes").insert({
        restaurant_id: id,
        user_id: profile.id,
      });
    }

    const { count } = await supabase
      .from("restaurant_votes")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", id);

    return NextResponse.json({
      vote_count: count ?? 0,
      user_voted: !existing,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
