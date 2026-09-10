import { NextResponse } from "next/server";
import { COACH_COOKIE, digest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const passcode = String(form.get("passcode") ?? "");
  const nextRaw = String(form.get("next") ?? "/");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  const expected = process.env.COACH_PASSCODE;
  const url = new URL(req.url);
  if (!expected || passcode !== expected) {
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin), 303);
  }
  const res = NextResponse.redirect(new URL(next, url.origin), 303);
  res.cookies.set(COACH_COOKIE, await digest(expected), {
    httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 120,
  });
  return res;
}
