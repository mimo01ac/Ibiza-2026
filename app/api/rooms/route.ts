import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, requireAdmin } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch rooms
    const { data: rooms } = await supabase
      .from("room_allocations")
      .select("id, room_name, description, created_at, updated_at")
      .order("room_name", { ascending: true });

    // Fetch all assignments with profiles
    const { data: assignments } = await supabase
      .from("room_assignments")
      .select("room_id, user_id, profile:profiles(id, display_name, avatar_url)");

    // Merge assignments into rooms
    const result = (rooms ?? []).map((room) => ({
      ...room,
      profiles: (assignments ?? [])
        .filter((a) => a.room_id === room.id)
        .map((a) => a.profile)
        .filter(Boolean),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    await requireAdmin(session.user!.email!);

    const { room_id, user_id, action } = await req.json();
    const supabase = createAdminClient();

    if (action === "remove") {
      const { error } = await supabase
        .from("room_assignments")
        .delete()
        .eq("room_id", room_id)
        .eq("user_id", user_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Add assignment — remove from other rooms first (each user in one room)
      await supabase
        .from("room_assignments")
        .delete()
        .eq("user_id", user_id);

      const { error } = await supabase
        .from("room_assignments")
        .insert({ room_id, user_id });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
