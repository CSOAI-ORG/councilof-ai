/**
 * The Claim maintenance card counts what the check rows say TODAY (7 Oct 2026 retest: the card said
 * "9 not yet due" from a 29 Sep run while three of those nine were past their due date).
 */
import { describe, expect, it } from "vitest";
import { checkStatus, chipOf, countsLine, readClaimChecks, registryWords, checkWords } from "./claimChecks";
import { claimMaintenanceFigure } from "./useLiveJson";

// The live /api/state rows as read on 7 Oct 2026 03:10Z (run_at 2026-09-29T16:55:06Z).
const STATE = {
  ledgers: {
    claim_maintenance: {
      state: "PROBED",
      run_at: "2026-09-29T16:55:06Z",
      counts: { CHANGED_CONFIRMED: 1, FETCH_FAILED: 1, NOT_YET_DUE: 9 },
      checks: [
        { registry_id: "claimreg-ai-assurance-and-settlement-2026-09-23-rev2", check: "scheduled-read", due: "2026-09-28", outcome: "CHANGED_CONFIRMED" },
        { registry_id: "claimreg-ondo-chainlink-2026-09-22-rev2", check: "day-7", due: "2026-09-29", outcome: "FETCH_FAILED" },
        { registry_id: "claimreg-hiring-platforms-2026-09-24-rev2", check: "scheduled-read", due: "2026-10-01", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-ai-assurance-and-settlement-2026-09-23-rev2", check: "day-7", due: "2026-10-02", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-hiring-platforms-2026-09-24-rev2", check: "day-7", due: "2026-10-02", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-ondo-chainlink-2026-09-22-rev2", check: "day-30", due: "2026-10-22", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-ai-assurance-and-settlement-2026-09-23-rev2", check: "day-30", due: "2026-10-25", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-hiring-platforms-2026-09-24-rev2", check: "day-30", due: "2026-10-25", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-ondo-chainlink-2026-09-22-rev2", check: "day-90", due: "2026-12-21", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-ai-assurance-and-settlement-2026-09-23-rev2", check: "day-90", due: "2026-12-24", outcome: "NOT_YET_DUE" },
        { registry_id: "claimreg-hiring-platforms-2026-09-24-rev2", check: "day-90", due: "2026-12-24", outcome: "NOT_YET_DUE" },
      ],
    },
  },
};
const OCT7 = new Date("2026-10-07T03:10:00Z");

describe("claim checks are counted for the day they are read", () => {
  it("7 Oct: three of the nine NOT_YET_DUE rows are overdue", () => {
    const r = readClaimChecks(STATE, OCT7)!;
    expect(r.counts).toMatchObject({ overdue: 3, not_yet_due: 6, changed: 1, not_read: 1 });
    expect(r.rows.length).toBe(11);
    expect(countsLine(r)).toBe("3 overdue · 1 source not read · 1 source changed · 6 not yet due");
    expect(chipOf(r)).toEqual({ text: "Behind schedule", tone: "warn" });
    // the chip is the state in words; each number is printed once, in the counts line
    expect(chipOf(r).text).not.toMatch(/\d/);
    // overdue rows first, oldest due date first
    expect(r.rows.slice(0, 3).map((x) => x.due)).toEqual(["2026-10-01", "2026-10-02", "2026-10-02"]);
    expect(r.runAt).toBe("2026-09-29T16:55:06Z");
  });

  it("on the run's own day the run-time outcomes stand", () => {
    const r = readClaimChecks(STATE, new Date("2026-09-29T17:00:00Z"))!;
    expect(r.counts).toMatchObject({ overdue: 0, not_yet_due: 9, changed: 1, not_read: 1 });
    expect(chipOf(r).text).toBe("A source was not read");
  });

  it("a check due today is not yet overdue; DUE_NOT_RUN is always overdue", () => {
    expect(checkStatus("NOT_YET_DUE", "2026-10-07", "2026-10-07")).toBe("not_yet_due");
    expect(checkStatus("NOT_YET_DUE", "2026-10-06", "2026-10-07")).toBe("overdue");
    expect(checkStatus("DUE_NOT_RUN", "2026-12-01", "2026-10-07")).toBe("overdue");
  });

  it("no rows -> null (the card says it could not read them; no number is put in their place)", () => {
    expect(readClaimChecks({ ledgers: { claim_maintenance: { counts: { NOT_YET_DUE: 9 }, checks: [] } } }, OCT7)).toBeNull();
    expect(readClaimChecks({}, OCT7)).toBeNull();
  });

  it("the figure producer counts from the rows, not from the run-time counts", () => {
    const f = claimMaintenanceFigure(STATE, OCT7)!;
    expect(f.value).toBe("3 overdue · 1 source not read · 1 source changed · 6 not yet due");
    expect(f.value).not.toContain("9 not yet due");
    expect(f.source).toContain("checks");
  });

  it("register and check names read as words", () => {
    expect(registryWords("hiring-platforms-2026-09-24-rev2")).toBe("hiring platforms");
    expect(registryWords("ai-assurance-and-settlement-2026-09-23-rev2")).toBe("AI assurance and settlement");
    expect(checkWords("day-30")).toBe("day-30 re-read");
    expect(checkWords("scheduled-read")).toBe("scheduled re-read");
  });
});
