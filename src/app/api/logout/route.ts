import { NextResponse } from "next/server";
import { COACH_COOKIE } from "@/lib/auth";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", new URL(req.url).origin), 303);
  res.cookies.set(COACH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
