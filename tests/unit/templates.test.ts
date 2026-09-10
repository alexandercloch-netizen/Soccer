import { describe, it, expect } from "vitest";
import { SPORT_TEMPLATES, SportTemplateSchema, getTemplate, currentAgeBand } from "@/lib/sports/templates";
import { ACTIVITIES, defaultPlan, filterActivities } from "@/lib/data/activities";

describe("sport templates", () => {
  for (const id of Object.keys(SPORT_TEMPLATES)) {
    it(`${id} validates and has a current age band`, () => {
      const t = getTemplate(id);
      expect(SportTemplateSchema.safeParse(t).success).toBe(true);
      expect(currentAgeBand(t).id).toBe(t.ageBandId);
      expect(t.gear.player.length).toBeGreaterThan(0);
    });
    it(`${id} has at least one activity in its library and a scrimmage or station`, () => {
      const t = getTemplate(id);
      const acts = filterActivities({ sportId: t.sportId, ageBandId: t.ageBandId });
      expect(acts.length).toBeGreaterThan(0);
    });
  }
  it("activity ids are unique", () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("defaultPlan", () => {
  for (const id of ["soccer-u6", "tball"]) {
    it(`${id}: fills the requested minutes and respects the max block length`, () => {
      const t = getTemplate(id); const band = currentAgeBand(t);
      const plan = defaultPlan({ sportId: t.sportId, ageBandId: band.id, playerCount: 8, minutes: 60, maxBlockMinutes: band.maxBlockMinutes });
      const total = plan.reduce((s, b) => s + b.minutes, 0);
      expect(total).toBeGreaterThanOrEqual(55);
      expect(total).toBeLessThanOrEqual(65);
      const scrimIds = new Set(["scrimmage", ...ACTIVITIES.filter((a) => a.tags.includes("scrimmage")).map((a) => a.id)]);
      for (const b of plan) if (!["arrival", "water", "closing"].includes(b.activityId) && !scrimIds.has(b.activityId)) expect(b.minutes, b.name).toBeLessThanOrEqual(band.maxBlockMinutes);
      expect(plan[0].activityId).toBe("arrival");
      expect(plan[plan.length - 1].activityId).toBe("closing");
    });
  }
});
