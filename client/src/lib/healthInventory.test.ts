import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  boardHealthLine,
  HEALTH_FACTS,
  HEALTH_NEVER,
  HEALTH_PUBLIC_LINE,
  HEALTH_RULING,
  healthLine,
  LIVE_HEALTH_PIN,
} from "./healthInventory";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Health inventory — correct facts, not a score", () => {
  it("quotes N of M and refuses a fused health number", () => {
    expect(HEALTH_RULING).toMatch(/never one number/i);
    expect(HEALTH_PUBLIC_LINE).toMatch(/N measured of M declared/);
    expect(LIVE_HEALTH_PIN.declared).toBe(22);
    expect(LIVE_HEALTH_PIN.measured).toBe(22);
    expect(LIVE_HEALTH_PIN.empty).toBe(0);
    expect(LIVE_HEALTH_PIN.corrections).toBe(30);
    expect(LIVE_HEALTH_PIN.not_a_certification).toBe(true);
    expect(HEALTH_NEVER.some((n) => /0–100 health score|0-100 health score/i.test(n))).toBe(true);
    expect(HEALTH_NEVER.some((n) => /mean of axis/i.test(n))).toBe(true);
    expect(HEALTH_FACTS.some((f) => f.id === "empty-slots" && /Empty is a fact/i.test(f.means))).toBe(
      true,
    );
  });

  it("formats a per-digest line without inventing a grade", () => {
    expect(
      healthLine({
        measured: 22,
        declared: 22,
        verify: "pass",
        evidence: "present",
        rerun: "empty",
        eligibility: "ELIGIBLE",
        corrections: 0,
      }),
    ).toBe(
      "22 measured of 22 declared; verify pass; evidence present; rerun empty; eligibility ELIGIBLE; corrections touching this digest 0.",
    );
    expect(boardHealthLine()).toMatch(/22 measured of 22 declared/);
    expect(boardHealthLine()).toMatch(/corrections touching this digest 30/);
    const blob = JSON.stringify({ HEALTH_RULING, HEALTH_NEVER, HEALTH_FACTS, LIVE_HEALTH_PIN });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(products).toContain("HealthInventory");
  });
});
