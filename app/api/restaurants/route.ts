import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("*, restaurant_votes(count)")
      .order("created_at", { ascending: true });

    let userVotes: string[] = [];
    try {
      const session = await getSessionOrThrow();
      const profile = await getProfileByEmail(
        session.user!.email!,
        session.user!.name,
        session.user!.image
      );
      const { data: votes } = await supabase
        .from("restaurant_votes")
        .select("restaurant_id")
        .eq("user_id", profile.id);
      userVotes = (votes ?? []).map((v) => v.restaurant_id);
    } catch {
      // not logged in
    }

    const result = (restaurants ?? []).map((r) => ({
      ...r,
      vote_count: r.restaurant_votes?.[0]?.count ?? 0,
      user_voted: userVotes.includes(r.id),
      restaurant_votes: undefined,
    }));

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
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: body.name,
        website_url: body.website_url || null,
        image_url: body.image_url || null,
        cuisine_type: body.cuisine_type || null,
        description: body.description || null,
        tripadvisor_rating: body.tripadvisor_rating || null,
        tripadvisor_url: body.tripadvisor_url || null,
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
