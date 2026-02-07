import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const envPassword = process.env.GUEST_PASSWORD;
  const inputPassword = body.password as string;

  return NextResponse.json({
    envPasswordSet: !!envPassword,
    envPasswordLength: envPassword?.length ?? 0,
    envPasswordFirst3: envPassword?.slice(0, 3) ?? "",
    inputPasswordLength: inputPassword?.length ?? 0,
    inputPasswordFirst3: inputPassword?.slice(0, 3) ?? "",
    exactMatch: inputPassword === envPassword,
    trimmedMatch: inputPassword?.trim() === envPassword?.trim(),
  });
}
