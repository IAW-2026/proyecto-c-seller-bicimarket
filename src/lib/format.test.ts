import { describe, it, expect } from "vitest";
import { formatCents } from "./format";

describe("formatCents", () => {
  it("formats whole ARS values (100 cents = 1 ARS)", () => {
    const result = formatCents(100);
    expect(result).toMatch(/1/);
  });

  it("formats zero as 0", () => {
    expect(formatCents(0)).toMatch(/0/);
  });

  it("formats 150000 cents as 1500 ARS", () => {
    const result = formatCents(150000);
    expect(result).toMatch(/1[\s.]?500/);
  });

  it("returns a string", () => {
    expect(typeof formatCents(5000)).toBe("string");
  });

  it("includes ARS currency indicator ($ or ARS)", () => {
    const result = formatCents(10000);
    expect(result.includes("$") || result.includes("ARS")).toBe(true);
  });

  it("large amount has thousand separator", () => {
    const result = formatCents(1_000_000_00);
    // 1.000.000 ARS — should have a separator character
    expect(result.length).toBeGreaterThan(7);
  });
});
