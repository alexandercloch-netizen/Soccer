import { NextResponse, type NextRequest } from "next/server";
import { COACH_COOKIE, gateMode, isValidCoachCookie } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const mode = gateMode();
  if (mode === "open") return NextResponse.next();
  if (mode === "locked") {
    return new NextResponse("Coach view is locked: no COACH_PASSCODE is configured for this deployment.", { status: 503, headers: { "cache-control": "no-store" } });
  }
  const ok = await isValidCoachCookie(req.cookies.get(COACH_COOKIE)?.value);
  if (ok) {
    const res = NextResponse.next();
    res.headers.set("cache-control", "private, no-store");
    return res;
  }
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Coach sign-in required" }, { status: 401 });
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/team/:path*", "/api/ai/:path*"] };
