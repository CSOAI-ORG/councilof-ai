/**
 * Time-to-correct is a published metric, so the timestamps under it are held to a rule:
 * every entry says WHEN the error was detected, WHO/WHAT detected it, and WHEN the correction
 * was public — each a value from first-hand evidence or the explicit word UNRECORDED. Absence is
 * not allowed: an entry that simply omits detected_at would look like "not applicable" rather
 * than "we did not record it", and the latency figure would silently shrink its denominator.
 */
import { describe, expect, it } from "vitest";
import {
  LEDGER,
  UNRECORDED,
  correctionLatency,
  timeToCorrect,
  timingProblems,
  type TimingEntry,
} from "./corrections";

const entries = LEDGER.corrections as TimingEntry[];

describe("corrections ledger: timing fields", () => {
  it("every entry carries detected_at, detected_by and published_at (a value or UNRECORDED)", () => {
    const problems = entries.flatMap(timingProblems);
    expect(problems).toEqual([]);
  });

  it("a new entry without detected_at is refused, and UNRECORDED is accepted", () => {
    const base = { id: "C-TEST-01", detected_by: UNRECORDED, published_at: UNRECORDED };
    expect(timingProblems(base).join(" ")).toMatch(/detected_at is missing/);
    expect(timingProblems({ ...base, detected_at: UNRECORDED })).toEqual([]);
    expect(timingProblems({ ...base, detected_at: "yesterday" }).join(" ")).toMatch(/not an ISO/);
  });

  it("a recorded timestamp must name its evidence", () => {
    const e = { id: "C-TEST-02", detected_at: "2026-09-26T08:00:00Z", detected_by: "persona test", published_at: UNRECORDED };
    expect(timingProblems(e).join(" ")).toMatch(/timing_evidence/);
    expect(timingProblems({ ...e, timing_evidence: ["a commit"] })).toEqual([]);
  });

  it("detected_by is a closed vocabulary", () => {
    const e = { id: "C-TEST-03", detected_at: UNRECORDED, published_at: UNRECORDED, detected_by: "a hunch" };
    expect(timingProblems(e).join(" ")).toMatch(/detected_by/);
  });

  it("publication before detection is refused", () => {
    const e = {
      id: "C-TEST-04", detected_by: "internal audit", timing_evidence: ["x"],
      detected_at: "2026-09-26T10:00:00Z", published_at: "2026-09-26T09:00:00Z",
    };
    expect(timingProblems(e).join(" ")).toMatch(/precedes detection/);
  });

  it("every entry dated 2026-09-26 or later is at least as complete as the rule requires", () => {
    const fresh = (LEDGER.corrections as Array<TimingEntry & { date?: string }>).filter((c) => (c.date ?? "") >= "2026-09-26");
    expect(fresh.length).toBeGreaterThan(0);
    for (const c of fresh) {
      expect(c.detected_at, String(c.id)).toBeDefined();
      expect(c.detected_by, String(c.id)).toBeDefined();
      expect(c.published_at, String(c.id)).toBeDefined();
    }
  });
});

describe("time_to_correct is derived, never stored", () => {
  it("no entry stores a time_to_correct of its own", () => {
    for (const c of entries) expect(Object.keys(c)).not.toContain("time_to_correct");
  });

  it("EXACT only when both are datetimes", () => {
    const t = timeToCorrect({ detected_at: "2026-09-26T08:52:00Z", published_at: "2026-09-26T10:08:40Z" });
    expect(t).toEqual({ kind: "EXACT", seconds: 4600 });
  });

  it("a day-precision detection yields an upper bound, never an exact figure", () => {
    const t = timeToCorrect({ detected_at: "2026-09-26", published_at: "2026-09-26T02:22:06Z" });
    expect(t.kind).toBe("UPPER_BOUND");
    expect((t as { seconds: number }).seconds).toBe(2 * 3600 + 22 * 60 + 6);
  });

  it("a first-hand window tightens the bound and gives a lower bound", () => {
    const t = timeToCorrect({
      detected_at: "2026-09-26",
      detected_window: { not_before: "2026-09-26T07:05:33Z", not_after: "2026-09-26T07:33:41Z", basis: "x" },
      published_at: "2026-09-26T07:34:07Z",
    });
    expect(t).toMatchObject({ kind: "UPPER_BOUND", seconds: 1714, lower_bound_seconds: 26 });
  });

  it("UNRECORDED on either side is UNMEASURED — never zero, never estimated", () => {
    expect(timeToCorrect({ detected_at: UNRECORDED, published_at: UNRECORDED }).kind).toBe("UNMEASURED");
    expect(timeToCorrect({ detected_at: "2026-09-26T08:00:00Z", published_at: UNRECORDED }).kind).toBe("UNMEASURED");
    expect(timeToCorrect({ detected_at: UNRECORDED, published_at: "2026-09-26T08:00:00Z" }).kind).toBe("UNMEASURED");
  });

  it("the served summary counts every entry exactly once and summarises only EXACT values", () => {
    const s = correctionLatency(entries);
    expect(s.exact + s.upper_bound + s.unmeasured).toBe(entries.length);
    expect(s.per_entry.every((x) => x.kind !== "UNMEASURED")).toBe(true);
    expect(s.exact).toBeGreaterThan(0);
  });
});
