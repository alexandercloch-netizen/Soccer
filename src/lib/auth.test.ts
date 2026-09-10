import { describe, it, expect } from "vitest";
import { safeNext, timingSafeEqualHex } from "./auth";

const origin = "https://goodsport.team";
describe("safeNext", () => {
  it("allows coach paths on the same origin", () => {
    expect(safeNext("/team/tottenham-fall-2026/roster", origin)).toBe("/team/tottenham-fall-2026/roster");
  });
  it("rejects protocol-relative and backslash tricks", () => {
    expect(safeNext("//evil.example/team/x", origin)).toBe("/");
    expect(safeNext("/\\evil.example", origin)).toBe("/");
    expect(safeNext("https://evil.example/team/x", origin)).toBe("/");
  });
  it("rejects non-coach paths and garbage", () => {
    expect(safeNext("/t/spurs26", origin)).toBe("/");
    expect(safeNext(undefined, origin)).toBe("/");
    expect(safeNext("::::", origin)).toBe("/");
  });
});
describe("timingSafeEqualHex", () => {
  it("compares equal and unequal strings", () => {
    expect(timingSafeEqualHex("abc", "abc")).toBe(true);
    expect(timingSafeEqualHex("abc", "abd")).toBe(false);
    expect(timingSafeEqualHex("abc", "ab")).toBe(false);
  });
});
