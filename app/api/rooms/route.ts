import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionOrThrow, requireAdmin } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("room_allocations")
      .select("*, profile:profiles(*)")
      .order("room_name", { ascending: true });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    await requireAdmin(session.user!.email!);

    const body = await req.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("room_allocations")
      .update({ user_id: body.user_id || null })
      .eq("id", body.room_id)
      .select("*, profile:profiles(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
