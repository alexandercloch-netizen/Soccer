import { NextResponse } from "next/server";
import { COACH_COOKIE, digest, safeNext, timingSafeEqualHex } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const passcode = String(form.get("passcode") ?? "");
  const url = new URL(req.url);
  const next = safeNext(String(form.get("next") ?? "/"), url.origin);
  const expected = process.env.COACH_PASSCODE ?? "";
  const expectedDigest = await digest(expected);
  const match = expected.length > 0 && timingSafeEqualHex(await digest(passcode), expectedDigest);
  if (!match) {
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin), 303);
  }
  const res = NextResponse.redirect(new URL(next, url.origin), 303);
  res.cookies.set(COACH_COOKIE, expectedDigest, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 120,
  });
  return res;
}
