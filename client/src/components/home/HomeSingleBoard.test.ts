import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (name: string) => readFileSync(resolve(__dirname, name), "utf8");

describe("one homepage board, with the existing reports and signup preserved", () => {
  it("has exactly one live GSPC strip owner in HomeResults", () => {
    const results = source("HomeResults.tsx");
    const mine = source("HomeMine.tsx");
    expect(results.match(/data-testid="home-living-strip"/g)).toHaveLength(1);
    expect(results).toContain("<LivingBoardStrip");
    expect(mine).not.toContain('data-testid="home-living-strip"');
    expect(mine).not.toContain("<LivingBoardStrip");
    expect(mine).not.toContain("import LivingBoardStrip");
  });

  it("retains the independent reports, verification route and working signup", () => {
    const mine = source("HomeMine.tsx");
    expect(mine).toContain('data-testid="home-report-archive-band"');
    expect(mine).toContain('href="/reports/daily-signal/"');
    expect(mine).toContain('href="/gspc-verify/"');
    expect(mine).toContain("<NewsletterSignup />");
  });
});
