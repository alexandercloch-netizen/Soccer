import { describe, it, expect, beforeEach, afterEach } from "vitest";

const ORIGIN = "https://goodsport.team";
const form = (o: Record<string, string>) => new Request(`${ORIGIN}/api/login`, { method: "POST", body: new URLSearchParams(o), headers: { "content-type": "application/x-www-form-urlencoded" } });

describe("POST /api/login", () => {
  const prev = { ...process.env };
  beforeEach(() => { process.env.COACH_PASSCODE = "correct-horse"; });
  afterEach(() => { process.env = { ...prev }; });

  it("redirects to the requested coach path on success and sets an httpOnly cookie", async () => {
    const { POST } = await import("@/app/api/login/route");
    const res = await POST(form({ passcode: "correct-horse", next: "/team/test-team/roster" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/team/test-team/roster`);
    expect(res.headers.get("set-cookie")).toMatch(/gs_coach=.*HttpOnly/i);
  });
  it("bounces a wrong passcode back to the login page with no cookie", async () => {
    const { POST } = await import("@/app/api/login/route");
    const res = await POST(form({ passcode: "nope", next: "/team/test-team" }));
    expect(res.headers.get("location")).toContain("/login?error=1");
    expect(res.headers.get("set-cookie")).toBeNull();
  });
  it("never redirects off-origin or outside the coach area", async () => {
    const { POST } = await import("@/app/api/login/route");
    for (const next of ["/\\evil.example", "//evil.example", "https://evil.example/team/x", "/t/spurs26"]) {
      const res = await POST(form({ passcode: "correct-horse", next }));
      expect(res.headers.get("location"), next).toBe(`${ORIGIN}/`);
    }
  });
  it("refuses everything when no passcode is configured", async () => {
    delete process.env.COACH_PASSCODE;
    const { POST } = await import("@/app/api/login/route");
    const res = await POST(form({ passcode: "", next: "/team/test-team" }));
    expect(res.headers.get("location")).toContain("/login?error=1");
  });
});
