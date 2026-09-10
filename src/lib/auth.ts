/**
 * Minimal coach gate (phase 1). When COACH_PASSCODE is set, /team/* and
 * /api/ai/* require a cookie holding a SHA-256 digest of the passcode.
 * Parent pages under /t/<code> are never gated. Replace with real accounts
 * (magic link, per-team roles) in phase 2.
 */
export const COACH_COOKIE = "gs_coach";

export function passcodeConfigured(): boolean {
  return Boolean(process.env.COACH_PASSCODE);
}

/**
 * Fail closed in production: if no passcode is configured, the coach view is
 * unavailable rather than open. Local development can opt out with COACH_OPEN=1.
 */
export function gateMode(): "open" | "passcode" | "locked" {
  if (process.env.COACH_PASSCODE) return "passcode";
  if (process.env.NODE_ENV !== "production" || process.env.COACH_OPEN === "1") return "open";
  return "locked";
}

export async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(`goodsport:${value}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidCoachCookie(cookie: string | undefined): Promise<boolean> {
  const mode = gateMode();
  if (mode === "open") return true;
  if (mode === "locked" || !cookie) return false;
  const expected = await digest(process.env.COACH_PASSCODE!);
  return timingSafeEqualHex(cookie, expected);
}

/** Constant-time comparison of two hex strings (works in the edge runtime). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Only allow redirects back into the coach area on this origin. */
export function safeNext(next: string | null | undefined, origin: string): string {
  try {
    const u = new URL(next ?? "/", origin);
    if (u.origin === origin && u.pathname.startsWith("/team/")) return u.pathname + u.search;
  } catch {}
  return "/";
}
