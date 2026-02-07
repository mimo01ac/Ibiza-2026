import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: wildcards } = await supabase
      .from("wildcards")
      .select("*, wildcard_votes(count), profile:profiles(*)")
      .order("created_at", { ascending: false });

    let userVotes: string[] = [];
    try {
      const session = await getSessionOrThrow();
      const profile = await getProfileByEmail(
        session.user!.email!,
        session.user!.name,
        session.user!.image
      );
      const { data: votes } = await supabase
        .from("wildcard_votes")
        .select("wildcard_id")
        .eq("user_id", profile.id);
      userVotes = (votes ?? []).map((v) => v.wildcard_id);
    } catch {
      // not logged in
    }

    const result = (wildcards ?? []).map((w) => ({
      ...w,
      vote_count: w.wildcard_votes?.[0]?.count ?? 0,
      user_voted: userVotes.includes(w.id),
      wildcard_votes: undefined,
    }));

    // Sort by votes desc
    result.sort((a, b) => b.vote_count - a.vote_count);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wildcards")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category: body.category?.trim() || null,
        submitted_by: profile.id,
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
