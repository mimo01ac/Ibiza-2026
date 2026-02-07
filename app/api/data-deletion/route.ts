import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * OPTIONS — CORS preflight for Facebook.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * GET — Facebook validates the URL exists before saving it.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Data deletion callback endpoint" },
    { headers: CORS_HEADERS }
  );
}

/**
 * POST — Facebook Data Deletion Callback.
 * Facebook POSTs a signed_request when a user requests data deletion.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("[data-deletion] Missing signed_request in POST body");
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const appSecret = process.env.AUTH_FACEBOOK_SECRET;
    if (!appSecret) {
      console.error("[data-deletion] AUTH_FACEBOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Parse and verify the signed request
    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      console.error("[data-deletion] Invalid signed_request signature");
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const userId = data.user_id;
    const confirmationCode = `del_${userId}_${Date.now()}`;
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ibiza-2026.vercel.app"}/data-deletion?code=${confirmationCode}`;

    console.log(
      `[data-deletion] Facebook user ${userId} requested data deletion. Code: ${confirmationCode}`
    );

    return NextResponse.json(
      {
        url: statusUrl,
        confirmation_code: confirmationCode,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[data-deletion] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

function parseSignedRequest(
  signedRequest: string,
  secret: string
): { user_id: string; algorithm: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".", 2);
    if (!encodedSig || !payload) return null;

    const sig = Buffer.from(
      encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest();

    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

    const decoded = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
