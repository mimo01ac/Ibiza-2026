import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail, requireAdmin } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: events } = await supabase
      .from("events")
      .select("*, event_votes(count)")
      .order("date", { ascending: true });

    // Get current user's votes if logged in
    let userVotes: string[] = [];
    try {
      const session = await getSessionOrThrow();
      const profile = await getProfileByEmail(
        session.user!.email!,
        session.user!.name,
        session.user!.image
      );
      const { data: votes } = await supabase
        .from("event_votes")
        .select("event_id")
        .eq("user_id", profile.id);
      userVotes = (votes ?? []).map((v) => v.event_id);
    } catch {
      // not logged in
    }

    const result = (events ?? []).map((e) => ({
      ...e,
      vote_count: e.event_votes?.[0]?.count ?? 0,
      user_voted: userVotes.includes(e.id),
      event_votes: undefined,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const profile = await requireAdmin(session.user!.email!);

    const body = await req.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: body.title,
        club: body.club,
        date: body.date,
        time: body.time || null,
        description: body.description || null,
        ticket_url: body.ticket_url || null,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
