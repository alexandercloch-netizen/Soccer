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

export async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(`goodsport:${value}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidCoachCookie(cookie: string | undefined): Promise<boolean> {
  const pass = process.env.COACH_PASSCODE;
  if (!pass) return true;
  if (!cookie) return false;
  return cookie === (await digest(pass));
}
