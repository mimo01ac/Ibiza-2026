import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("flights")
      .select("*, profile:profiles(*)")
      .order("arrival_date", { ascending: true });

    return NextResponse.json(data ?? []);
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

    // Upsert — one flight entry per user
    const { data, error } = await supabase
      .from("flights")
      .upsert(
        {
          user_id: profile.id,
          arrival_date: body.arrival_date,
          arrival_time: body.arrival_time || null,
          departure_date: body.departure_date,
          departure_time: body.departure_time || null,
          flight_number_in: body.flight_number_in || null,
          flight_number_out: body.flight_number_out || null,
          notes: body.notes || null,
        },
        { onConflict: "user_id" }
      )
      .select("*, profile:profiles(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
