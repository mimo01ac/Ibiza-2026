import { NextResponse } from "next/server";

function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function GET() {
  return NextResponse.json({
    authSecretSet: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    guestPasswordSet: !!process.env.GUEST_PASSWORD,
    guestPasswordLength: process.env.GUEST_PASSWORD?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  });
}

// Simulates the exact authorize() logic
export async function POST(req: Request) {
  const body = await req.json();
  const credentials = body;

  const name = String(credentials.name ?? "").trim();
  const password = String(credentials.password ?? "");
  const envPassword = process.env.GUEST_PASSWORD;

  const nameCheck = !!name;
  const passwordCheck = !!password;
  const passwordMatch = password === envPassword;

  let result = null;
  if (nameCheck && passwordCheck && passwordMatch) {
    const normalized = normalizeGuestName(name);
    result = {
      id: `guest_${normalized}`,
      name,
      email: `guest_${normalized}@ibiza-2026.app`,
    };
  }

  return NextResponse.json({
    nameReceived: name,
    nameCheck,
    passwordLength: password.length,
    passwordCheck,
    envPasswordLength: envPassword?.length ?? 0,
    passwordMatch,
    authorizeResult: result ? "User object" : "null",
    wouldSucceed: !!result,
  });
}
