import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The estate's own gates are written against TIME — "0 for 30 days", "≥1 repeat", "≥5 distinct in
 * 30d" — and none can be read from a single call to /api/revenue. This history is what makes them
 * answerable. Its integrity rules matter more than its contents: append-only, absent recorded as
 * null rather than zero, and every field copied rather than computed.
 */
const P = resolve(__dirname, "../public/interop/revenue-history.json");

describe("revenue-history", () => {
  it("exists and declares its schema", () => {
    expect(existsSync(P)).toBe(true);
    const d = JSON.parse(readFileSync(P, "utf8"));
    expect(d.schema).toBe("csoai.revenue-history/0.1");
    expect(d.days.length).toBeGreaterThan(0);
  });

  it("records one entry per day, in order, with no duplicates", () => {
    const d = JSON.parse(readFileSync(P, "utf8"));
    const dates = d.days.map((x: any) => x.date);
    expect(new Set(dates).size, "append-only means one row per day").toBe(dates.length);
    expect([...dates].sort()).toEqual(dates);
    expect(d.days_recorded).toBe(d.days.length);
  });

  it("never writes a zero where the counter was absent", () => {
    const d = JSON.parse(readFileSync(P, "utf8"));
    for (const day of d.days) {
      for (const k of ["all_time", "settlements", "self_settlements"]) {
        expect(k in day, `${day.date} dropped ${k} entirely`).toBe(true);
        // null is the honest record for absent; 0 would be a claim
        expect(day[k] === null || typeof day[k] === "number").toBe(true);
      }
    }
  });

  it("keeps the zero-buyer streak the gates are written against", () => {
    const d = JSON.parse(readFileSync(P, "utf8"));
    const run = [...d.days].reverse().findIndex((x: any) => (x.all_time ?? 0) > 0);
    const expected = run === -1 ? d.days.length : run;
    expect(d.consecutive_days_at_zero_buyers).toBe(expected);
  });

  it("says plainly that a self-settlement is not revenue", () => {
    const d = JSON.parse(readFileSync(P, "utf8"));
    expect(d.note).toMatch(/self-settlement is not revenue/i);
    expect(d.note).toMatch(/absent is recorded as null, never as zero/i);
  });
});
