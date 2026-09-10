import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { publicName } from "@/lib/types";

const PHONE = /\(\d{3}\)\s?\d{3}-\d{4}|\b\d{3}-\d{3}-\d{4}\b/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

describe("public seed files are contact-free", () => {
  const dir = path.join(process.cwd(), "data", "teams");
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    it(`${f} has no phone, guardian email, DOB, or full child surname`, () => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const data = JSON.parse(raw);
      const withoutAnnouncements = JSON.stringify({ ...data, announcements: [], org: { ...data.org, contactEmail: "" } });
      expect(withoutAnnouncements).not.toMatch(PHONE);
      expect(withoutAnnouncements).not.toMatch(EMAIL);
      for (const g of data.guardians) { expect(g.phone, `${g.id} phone`).toBeUndefined(); expect(g.email, `${g.id} email`).toBeUndefined(); expect(g.name.split(" ").pop()!.length, `${g.id} surname must be an initial or placeholder`).toBeLessThanOrEqual(6); }
      for (const p of data.players) expect(p.lastName.length, `${p.firstName} lastName must be an initial`).toBe(1);
      for (const p of data.players) expect(p.dob).toBeUndefined();
    });
  }
});

describe("publicName", () => {
  it("shows first name and last initial only", () => {
    expect(publicName({ firstName: "Arthur", lastName: "Lochness" })).toBe("Arthur L.");
    expect(publicName({ firstName: "Arthur", lastName: "L", nickname: "Artie" })).toBe("Artie L.");
  });
});
