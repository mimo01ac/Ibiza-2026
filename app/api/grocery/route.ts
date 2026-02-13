import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorizeItem } from "@/lib/grocery/categorize";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: items } = await supabase
      .from("grocery_items")
      .select("*, grocery_item_votes(count), profile:profiles!added_by(id, display_name, avatar_url)")
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
        .from("grocery_item_votes")
        .select("grocery_item_id")
        .eq("user_id", profile.id);
      userVotes = (votes ?? []).map((v) => v.grocery_item_id);
    } catch {
      // not logged in
    }

    const result = (items ?? []).map((item) => ({
      ...item,
      vote_count: item.grocery_item_votes?.[0]?.count ?? 0,
      user_voted: userVotes.includes(item.id),
      grocery_item_votes: undefined,
    }));

    // Sort: unpurchased first, then by created_at ascending
    result.sort((a, b) => {
      if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
      return 0; // already ordered by created_at from query
    });

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
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = body.category || (await categorizeItem(name));
    const quantity = Math.max(1, parseInt(body.quantity) || 1);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        name,
        category,
        quantity,
        added_by: profile.id,
      })
      .select("*, profile:profiles!added_by(id, display_name, avatar_url)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This item already exists in the list" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ...data, vote_count: 0, user_voted: false },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
