import { NextResponse, type NextRequest } from "next/server";
import { COACH_COOKIE, isValidCoachCookie, passcodeConfigured } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  if (!passcodeConfigured()) return NextResponse.next();
  const ok = await isValidCoachCookie(req.cookies.get(COACH_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Coach sign-in required" }, { status: 401 });
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/team/:path*", "/api/ai/:path*"] };
