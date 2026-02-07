import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// One-time cleanup endpoint — delete after use
export async function POST() {
  const supabase = createAdminClient();

  const { data: oBeach, error: e1 } = await supabase
    .from("events")
    .delete()
    .ilike("club", "%O Beach%")
    .select("id, title, club");

  const { data: ibizaRocks, error: e2 } = await supabase
    .from("events")
    .delete()
    .ilike("club", "%Ibiza Rocks%")
    .select("id, title, club");

  return NextResponse.json({
    deleted: {
      oBeach: { count: oBeach?.length ?? 0, error: e1?.message ?? null },
      ibizaRocks: { count: ibizaRocks?.length ?? 0, error: e2?.message ?? null },
    },
  });
}
