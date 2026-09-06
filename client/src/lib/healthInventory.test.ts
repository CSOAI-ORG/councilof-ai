import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  boardCorrectionsLine,
  boardHealthLine,
  HEALTH_FACTS,
  HEALTH_NEVER,
  HEALTH_PUBLIC_LINE,
  HEALTH_RULING,
  healthLine,
  LIVE_HEALTH_PIN,
  readCorrectionsCount,
} from "./healthInventory";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Health inventory — correct facts, not a score", () => {
  it("quotes N of M and refuses a fused health number", () => {
    expect(HEALTH_RULING).toMatch(/never one number/i);
    expect(HEALTH_PUBLIC_LINE).toMatch(/N measured of M declared/);
    expect(LIVE_HEALTH_PIN.declared).toBe(22);
    expect(LIVE_HEALTH_PIN.measured).toBe(22);
    expect(LIVE_HEALTH_PIN.empty).toBe(0);
    expect(LIVE_HEALTH_PIN.corrections).toBe(47);
    expect(LIVE_HEALTH_PIN.as_at).toBeTruthy();
    expect(LIVE_HEALTH_PIN.corrections_as_at).toBeTruthy();
    // the pin's own header cites 969 items and the live board sums 969
    expect(LIVE_HEALTH_PIN.items).toBe(969);
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
    // The board line must NOT answer the per-digest question with the whole-ledger
    // total. No per-digest query exists, so the only true answer is "unknown".
    expect(boardHealthLine()).toMatch(/corrections touching this digest unknown/);
    expect(boardHealthLine()).not.toMatch(/corrections touching this digest \d/);
    const blob = JSON.stringify({ HEALTH_RULING, HEALTH_NEVER, HEALTH_FACTS, LIVE_HEALTH_PIN });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(products).toContain("HealthInventory");
  });
});

describe("the corrections count is derived, never typed", () => {
  it("counts the ledger array, because the ledger publishes no count field", () => {
    expect(readCorrectionsCount({ corrections: [1, 2, 3] })).toEqual({ state: "live", count: 3 });
  });

  it("treats an unreachable ledger as unread, never as zero", () => {
    // "0 corrections" would read as "we have never been wrong". Absent is not zero.
    for (const doc of [null, undefined, {}, { corrections: null }, { count: 47 }, "nope"]) {
      const r = readCorrectionsCount(doc);
      expect(r.state).toBe("unread");
      expect(JSON.stringify(r)).not.toMatch(/"count":\s*0/);
    }
  });

  it("an empty ledger is still a live read of zero", () => {
    expect(readCorrectionsCount({ corrections: [] })).toEqual({ state: "live", count: 0 });
  });

  it("quotes the live figure with the door it came from", () => {
    const line = boardCorrectionsLine({ state: "live", count: 47 });
    expect(line).toContain("47 corrections in the ledger");
    expect(line).toContain("GET /api/corrections");
    expect(line).not.toMatch(/as at/i);
  });

  it("labels the fallback a pin, with its date — never as a current count", () => {
    const line = boardCorrectionsLine({ state: "unread", reason: "HTTP 500" });
    expect(line).toContain("HTTP 500");
    expect(line).toContain("a pin, not a live count");
    expect(line).toContain(LIVE_HEALTH_PIN.corrections_as_at);
    expect(line).toContain("GET /api/corrections");
  });

  it("names the corrections door on the page, not just the board door", () => {
    const health = readFileSync(resolve(__dirname, "../components/HealthInventory.tsx"), "utf8");
    expect(health).toContain("/api/corrections");
    // and the pinned figure is no longer rendered as part of the coverage sentence
    expect(health).not.toMatch(/\{LIVE_HEALTH_PIN\.corrections\} corrections/);
  });
});
