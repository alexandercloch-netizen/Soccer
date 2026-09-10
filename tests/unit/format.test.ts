import { describe, it, expect } from "vitest";
import { upcoming, fmtTime, weekKey, todayIso } from "@/lib/format";
import { makeTeam } from "../factories";

describe("schedule helpers", () => {
  it("pins today via GOODSPORT_NOW", () => { expect(todayIso()).toBe("2026-09-10"); });
  it("upcoming sorts by date then time and drops cancelled and undated", () => {
    const t = makeTeam();
    t.events[0].status = "cancelled";
    t.events.push({ id: "x", teamId: "t1", kind: "pictureDay", title: "Pic", date: null, status: "tentative" });
    const next = upcoming(t.events, "2026-09-10");
    expect(next.every((e) => e.date && e.date >= "2026-09-10" && e.status !== "cancelled")).toBe(true);
    for (let i = 1; i < next.length; i++) expect((next[i - 1].date! + (next[i - 1].startTime ?? "")) <= (next[i].date! + (next[i].startTime ?? ""))).toBe(true);
  });
  it("formats times without seconds and with AM/PM", () => {
    expect(fmtTime("09:00")).toBe("9 AM"); expect(fmtTime("17:30")).toBe("5:30 PM"); expect(fmtTime(undefined)).toBe("Time TBD");
  });
  it("weekKey returns the Monday of the week", () => { expect(weekKey("2026-09-12")).toBe("2026-09-07"); expect(weekKey("2026-09-07")).toBe("2026-09-07"); });
});
