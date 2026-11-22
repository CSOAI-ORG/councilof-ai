import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 17 Nov 2026 at 1440 px: the first way to raise a dispute (a bare mailto with subject only) sat
 * 2,196 px down /dispute/, below the path, standing and entitlements. These checks read the page
 * source in render order. Against master before this change, all three fail.
 */
const page = readFileSync(resolve(__dirname, "Dispute.tsx"), "utf8");

describe("/dispute offers the way to raise one on the first screen", () => {
  it("puts the call to action before the path is explained", () => {
    const quick = page.indexOf('data-testid="dispute-quick-start"');
    const path = page.indexOf(">The path</h2>");
    expect(quick).toBeGreaterThan(-1);
    expect(quick).toBeLessThan(path);
    expect(page).toContain('href="#how-to-raise"');
    expect(page).toMatch(/<h2 id="how-to-raise"/);
  });

  it("opens one email, from both places, with what the page asks for laid out", () => {
    expect(page.match(/href=\{DISPUTE_MAILTO\}/g)).toHaveLength(2);
    for (const line of ["What I contest", "The specific claim I am raising", "Primary source, if any", "Name and organisation"]) {
      expect(page).toContain(line);
    }
  });

  it("keeps the subject the intake already sorts on", () => {
    expect(page).toContain("?subject=Dispute&body=");
  });
});
