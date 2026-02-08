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
    const { data } = await supabase
      .from("event_comments")
      .select("*, profile:profiles(*)")
      .eq("entity_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(
  req: NextRequest,
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

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("event_comments")
      .insert({
        entity_id: id,
        user_id: profile.id,
        content: content.trim(),
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // consume params
    const session = await getSessionOrThrow();
    const profile = await getProfileByEmail(
      session.user!.email!,
      session.user!.name,
      session.user!.image
    );

    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: "commentId required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: comment } = await supabase
      .from("event_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (comment.user_id !== profile.id && !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("event_comments").delete().eq("id", commentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
