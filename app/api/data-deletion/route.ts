import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Facebook Data Deletion Callback.
 * Facebook POSTs a signed_request when a user requests data deletion.
 * We parse it, return a confirmation code and status URL.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    const appSecret = process.env.AUTH_FACEBOOK_SECRET;
    if (!appSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse the signed request
    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 }
      );
    }

    const userId = data.user_id;
    const confirmationCode = `del_${userId}_${Date.now()}`;
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ibiza-2026.vercel.app"}/data-deletion?code=${confirmationCode}`;

    // Log the deletion request (actual deletion handled by admin)
    console.log(
      `[data-deletion] Facebook user ${userId} requested data deletion. Code: ${confirmationCode}`
    );

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("[data-deletion] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseSignedRequest(
  signedRequest: string,
  secret: string
): { user_id: string; algorithm: string } | null {
  const [encodedSig, payload] = signedRequest.split(".", 2);
  if (!encodedSig || !payload) return null;

  // Decode the signature
  const sig = Buffer.from(
    encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );

  // Verify HMAC-SHA256
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

  // Decode the payload
  const decoded = Buffer.from(
    payload.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");

  return JSON.parse(decoded);
}
