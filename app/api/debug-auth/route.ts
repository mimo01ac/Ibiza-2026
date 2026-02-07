import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    guestPasswordSet: !!process.env.GUEST_PASSWORD,
    guestPasswordLength: process.env.GUEST_PASSWORD?.length ?? 0,
    authSecretSet: !!process.env.AUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
