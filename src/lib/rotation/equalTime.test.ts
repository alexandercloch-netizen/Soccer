import { describe, it, expect } from "vitest";
import { buildRotation } from "./equalTime";

const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("buildRotation", () => {
  it("gives 8 players at 4v4 over 4 quarters exactly equal time", () => {
    const r = buildRotation({ playerIds: eight, playersOnField: 4, periods: 4, periodMinutes: 8 });
    expect(r.maxSpread).toBe(0);
    expect(Object.values(r.minutesToday).every((m) => m === 16)).toBe(true);
    expect(r.warnings).toEqual([]);
  });

  it("never benches someone two periods in a row with 7 players", () => {
    const r = buildRotation({ playerIds: eight.slice(0, 7), playersOnField: 4, periods: 4, periodMinutes: 8 });
    for (let i = 1; i < r.periods.length; i++) {
      const repeat = r.periods[i].bench.filter((p) => r.periods[i - 1].bench.includes(p));
      expect(repeat).toEqual([]);
    }
    expect(r.maxSpread).toBeLessThanOrEqual(8);
  });

  it("plays everyone the whole game when fewer than a full side is present", () => {
    const r = buildRotation({ playerIds: ["a", "b", "c"], playersOnField: 4, periods: 4, periodMinutes: 8 });
    expect(r.periods.every((p) => p.bench.length === 0)).toBe(true);
    expect(r.warnings[0]).toMatch(/Only 3 present/);
  });

  it("uses the season ledger to break ties so under-played kids start", () => {
    const r = buildRotation({
      playerIds: eight, playersOnField: 4, periods: 4, periodMinutes: 8,
      seasonMinutes: { a: 40, b: 40, c: 40, d: 40, e: 8, f: 8, g: 8, h: 8 },
    });
    expect(r.periods[0].onField.sort()).toEqual(["e", "f", "g", "h"]);
  });

  it("is deterministic", () => {
    const a = buildRotation({ playerIds: eight, playersOnField: 4, periods: 4, periodMinutes: 8 });
    const b = buildRotation({ playerIds: eight, playersOnField: 4, periods: 4, periodMinutes: 8 });
    expect(a).toEqual(b);
  });
});
