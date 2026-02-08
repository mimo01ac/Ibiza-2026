import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", id);

    let userLiked = false;
    try {
      const session = await getSessionOrThrow();
      const profile = await getProfileByEmail(
        session.user!.email!,
        session.user!.name,
        session.user!.image
      );
      const { data: existing } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", id)
        .eq("user_id", profile.id)
        .single();
      userLiked = !!existing;
    } catch {
      // Not logged in — just show count
    }

    return NextResponse.json({ like_count: count ?? 0, user_liked: userLiked });
  } catch {
    return NextResponse.json({ like_count: 0, user_liked: false });
  }
}

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
      .from("comment_likes")
      .select("id")
      .eq("comment_id", id)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      await supabase.from("comment_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("comment_likes").insert({
        comment_id: id,
        user_id: profile.id,
      });
    }

    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", id);

    return NextResponse.json({
      like_count: count ?? 0,
      user_liked: !existing,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
