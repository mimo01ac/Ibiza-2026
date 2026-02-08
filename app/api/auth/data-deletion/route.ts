import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://ibiza-2026.vercel.app";

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight (Meta sends a preflight before the real POST)
// ---------------------------------------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// GET — Meta validates the URL exists before saving it in App settings
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Data deletion callback endpoint" },
    { headers: CORS_HEADERS }
  );
}

// ---------------------------------------------------------------------------
// POST — Meta Data Deletion Callback
//
// Flow:
//   1. Meta POSTs form-data with `signed_request` (base64url-encoded)
//   2. We verify the HMAC-SHA256 signature using AUTH_FACEBOOK_SECRET
//   3. Extract the Facebook user_id from the payload
//   4. Look up the user in Supabase by `facebook_id`
//   5. Delete all related rows across every table
//   6. Delete uploaded files from Supabase Storage
//   7. Log the deletion in `data_deletion_requests` for GDPR compliance
//   8. Return { url, confirmation_code } so Meta can show a status page
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // --- Parse the signed_request from form data ---
    let signedRequest: string | null = null;
    try {
      const formData = await req.formData();
      signedRequest = formData.get("signed_request") as string;
    } catch {
      // Not form-encoded — could be a validation ping
    }

    // Validation ping (no signed_request) — return a valid stub
    if (!signedRequest) {
      const code = `del_validation_${Date.now()}`;
      console.log("[data-deletion] Validation ping (no signed_request)");
      return NextResponse.json(
        { url: `${BASE_URL}/data-deletion?code=${code}`, confirmation_code: code },
        { headers: CORS_HEADERS }
      );
    }

    // --- Verify signature ---
    const appSecret = process.env.AUTH_FACEBOOK_SECRET;
    if (!appSecret) {
      console.error("[data-deletion] AUTH_FACEBOOK_SECRET not configured");
      return jsonError("Server configuration error", 500);
    }

    const payload = parseSignedRequest(signedRequest, appSecret);
    if (!payload) {
      console.error("[data-deletion] Invalid signed_request signature");
      return jsonError("Invalid signature", 403);
    }

    const facebookUserId = payload.user_id;
    const confirmationCode = `del_${facebookUserId}_${Date.now()}`;
    const statusUrl = `${BASE_URL}/data-deletion?code=${confirmationCode}`;

    console.log(
      `[data-deletion] Deletion requested for Facebook user ${facebookUserId}. Code: ${confirmationCode}`
    );

    // --- Look up profile by facebook_id ---
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, auth_user_email, display_name")
      .eq("facebook_id", facebookUserId)
      .single();

    const deletedData: Record<string, number> = {};

    if (profile) {
      const uid = profile.id;

      // Delete child rows first (foreign-key order)
      const tables: { table: string; column: string }[] = [
        { table: "event_votes", column: "user_id" },
        { table: "event_comments", column: "user_id" },
        { table: "wildcard_votes", column: "user_id" },
        { table: "wildcard_comments", column: "user_id" },
        { table: "flights", column: "user_id" },
      ];

      for (const { table, column } of tables) {
        const { count } = await supabase
          .from(table)
          .delete({ count: "exact" })
          .eq(column, uid);
        deletedData[table] = count ?? 0;
      }

      // Events created by this user
      const { count: eventsCount } = await supabase
        .from("events")
        .delete({ count: "exact" })
        .eq("created_by", uid);
      deletedData.events = eventsCount ?? 0;

      // Wildcards submitted by this user
      const { count: wildcardsCount } = await supabase
        .from("wildcards")
        .delete({ count: "exact" })
        .eq("submitted_by", uid);
      deletedData.wildcards = wildcardsCount ?? 0;

      // Unassign from rooms (don't delete the room, just clear user_id)
      const { count: roomsCount } = await supabase
        .from("room_allocations")
        .update({ user_id: null })
        .eq("user_id", uid);
      deletedData.room_allocations_cleared = roomsCount ?? 0;

      // Gallery photos — delete files from storage, then records
      const { data: photos } = await supabase
        .from("gallery_photos")
        .select("id, file_path")
        .eq("uploaded_by", uid);

      if (photos && photos.length > 0) {
        const filePaths = photos.map((p) => p.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from("gallery").remove(filePaths);
        }
        const { count: photosCount } = await supabase
          .from("gallery_photos")
          .delete({ count: "exact" })
          .eq("uploaded_by", uid);
        deletedData.gallery_photos = photosCount ?? 0;
      }

      // Finally delete the profile itself
      await supabase.from("profiles").delete().eq("id", uid);
      deletedData.profile = 1;

      console.log(
        `[data-deletion] Deleted data for profile ${uid} (${profile.auth_user_email}):`,
        deletedData
      );
    } else {
      console.log(
        `[data-deletion] No profile found for Facebook user ${facebookUserId} — nothing to delete`
      );
    }

    // --- Log the deletion request for GDPR audit trail ---
    await supabase.from("data_deletion_requests").insert({
      facebook_user_id: facebookUserId,
      confirmation_code: confirmationCode,
      status: profile ? "completed" : "no_data_found",
      deleted_data: deletedData,
      profile_email: profile?.auth_user_email ?? null,
    });

    // --- Return the response Meta expects ---
    return NextResponse.json(
      { url: statusUrl, confirmation_code: confirmationCode },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[data-deletion] Unhandled error:", error);
    const code = `del_error_${Date.now()}`;
    return NextResponse.json(
      { url: `${BASE_URL}/data-deletion?code=${code}`, confirmation_code: code },
      { headers: CORS_HEADERS }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

/**
 * Parse and verify Meta's signed_request.
 * Format: base64url(signature).base64url(json_payload)
 * Signature = HMAC-SHA256(payload, app_secret)
 */
function parseSignedRequest(
  signedRequest: string,
  secret: string
): { user_id: string; algorithm: string; issued_at: number } | null {
  try {
    const [encodedSig, encodedPayload] = signedRequest.split(".", 2);
    if (!encodedSig || !encodedPayload) return null;

    // Decode signature (base64url → buffer)
    const sig = Buffer.from(
      encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );

    // Compute expected signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(encodedPayload)
      .digest();

    // Timing-safe comparison to prevent timing attacks
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

    // Decode payload
    const decoded = Buffer.from(
      encodedPayload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");

    const data = JSON.parse(decoded);

    // Meta uses HMAC-SHA256
    if (data.algorithm?.toUpperCase() !== "HMAC-SHA256") {
      console.warn("[data-deletion] Unexpected algorithm:", data.algorithm);
    }

    return data;
  } catch {
    return null;
  }
}
