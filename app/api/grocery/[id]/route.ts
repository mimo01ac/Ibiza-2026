import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getProfileByEmail } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
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

    const body = await req.json();
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};

    if (body.category !== undefined) {
      const valid = ["food_snacks", "drinks", "other"];
      if (!valid.includes(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updates.category = body.category;
    }

    if (body.quantity !== undefined) {
      updates.quantity = Math.max(1, parseInt(body.quantity) || 1);
    }

    if (body.is_purchased !== undefined) {
      updates.is_purchased = !!body.is_purchased;
      updates.purchased_by = body.is_purchased ? profile.id : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("grocery_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE(
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

    // Check ownership or admin
    const { data: item } = await supabase
      .from("grocery_items")
      .select("added_by")
      .eq("id", id)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (item.added_by !== profile.id && !profile.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase.from("grocery_items").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
