import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Check if gallery_photos table exists (admin)
  const admin = createAdminClient();
  const { data: adminData, error: adminError } = await admin
    .from("gallery_photos")
    .select("*")
    .limit(5);
  results.adminRead = { count: adminData?.length ?? 0, error: adminError?.message ?? null };

  // Test 2: Check with anon key
  try {
    const anon = await createClient();
    const { data: anonData, error: anonError } = await anon
      .from("gallery_photos")
      .select("*")
      .limit(5);
    results.anonRead = { count: anonData?.length ?? 0, error: anonError?.message ?? null };
  } catch (e) {
    results.anonRead = { error: e instanceof Error ? e.message : String(e) };
  }

  // Test 3: Check storage bucket
  const { data: bucketData, error: bucketError } = await admin.storage.getBucket("gallery");
  results.bucket = {
    exists: !!bucketData,
    public: bucketData?.public ?? null,
    error: bucketError?.message ?? null,
  };

  // Test 4: List files in storage
  const { data: files, error: filesError } = await admin.storage
    .from("gallery")
    .list("", { limit: 10 });
  results.storageFiles = {
    count: files?.length ?? 0,
    files: files?.map((f) => f.name) ?? [],
    error: filesError?.message ?? null,
  };

  return NextResponse.json(results);
}
