/**
 * First-Fine Watch never shows an old figure as current (7 Oct 2026 retest: the headline read
 * "days since fining powers: 22", true on 24 Aug, six weeks later).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FFW } from "./enforcement";
import { builtInFineWatch, dateLabel, eurLabel, FRESH_DAYS, readFineWatch } from "./firstFineWatch";

// The /api/fines body as served on 7 Oct 2026 (the fields this page reads).
const FEED = {
  as_of: "2026-08-24",
  freshness: { rows_last_reviewed: "2026-08-24" },
  first_fine_watch: { eu_ai_act_fines_collected_eur: 0, enforcement_powers_live_since: "2026-08-02", days_since_powers_live: 22 },
};
const OCT7 = new Date("2026-10-07T03:30:00Z");

describe("First-Fine Watch headline freshness", () => {
  it("7 Oct: the 24 Aug figure is labelled stale with its date and age", () => {
    const r = readFineWatch(FEED, OCT7)!;
    expect(r).toMatchObject({ eur: 0, asOf: "2026-08-24", powersOn: "2026-08-02", daysPowersToCheck: 22, ageDays: 44, stale: true, from: "live" });
    expect(dateLabel(r.asOf)).toBe("24 Aug 2026");
    expect(eurLabel(r.eur)).toBe("€0");
  });

  it("a figure checked within FRESH_DAYS is current, with its date", () => {
    const r = readFineWatch({ ...FEED, as_of: "2026-10-01" }, OCT7)!;
    expect(r.stale).toBe(false);
    expect(r.ageDays).toBe(6);
    expect(FRESH_DAYS).toBeLessThan(44);
  });

  it("days from powers to check come from the record's two dates, never today's clock", () => {
    const a = readFineWatch(FEED, OCT7)!;
    const b = readFineWatch(FEED, new Date("2027-01-01T00:00:00Z"))!;
    expect(a.daysPowersToCheck).toBe(22);
    expect(b.daysPowersToCheck).toBe(22);
    expect(b.ageDays).toBeGreaterThan(a.ageDays);
  });

  it("a feed without the figure or its dates is not read (the page keeps the dated built-in figure)", () => {
    expect(readFineWatch({}, OCT7)).toBeNull();
    expect(readFineWatch({ ...FEED, as_of: "recently", freshness: {} }, OCT7)).toBeNull();
    const b = builtInFineWatch(OCT7);
    expect(b).toMatchObject({ from: "built-in", asOf: "2026-08-24", stale: true });
  });

  it("the built-in figure is the feed's: same date as functions/api/fines.ts AS_OF, no typed day count", () => {
    const src = readFileSync(join(__dirname, "..", "..", "..", "functions", "api", "fines.ts"), "utf8");
    expect(src.match(/const AS_OF = "(\d{4}-\d{2}-\d{2})"/)?.[1]).toBe(FFW.asOf);
    expect(src.match(/const POWERS_LIVE = "(\d{4}-\d{2}-\d{2})"/)?.[1]).toBe(FFW.powersOnIso);
    expect(FFW.counter).toContain(dateLabel(FFW.asOf));
    expect("daysSincePowers" in FFW).toBe(false);
  });

  it("the page source prints no typed count and labels a stale headline", () => {
    const page = readFileSync(join(__dirname, "..", "pages", "FirstFineWatch.tsx"), "utf8");
    expect(page).not.toMatch(/daysSincePowers/);
    expect(page).toContain("Not updated since");
    expect(page).toContain('fetch("/api/fines"');
  });
});
