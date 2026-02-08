import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail, requireAdmin } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );
    return NextResponse.json({ is_confirmed: profile.is_confirmed ?? false, profile_id: profile.id });
  } catch {
    return NextResponse.json({ is_confirmed: false, profile_id: null });
  }
}

export async function POST() {
  try {
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const supabase = createAdminClient();
    const newValue = !profile.is_confirmed;

    const { error } = await supabase
      .from("profiles")
      .update({ is_confirmed: newValue })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ is_confirmed: newValue });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

// Admin: unconfirm a participant by profile ID
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    await requireAdmin(session.user!.email!);

    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_confirmed: false })
      .eq("id", profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
