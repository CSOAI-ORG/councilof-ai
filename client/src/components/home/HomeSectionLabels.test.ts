import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 17 Nov 2026: the hero's index numbers the page 01–06 (03 Put evidence to work, 06 For developers),
 * while the sections' own labels said "02 / Put evidence to work" and "04 / For developers and agents".
 * The index keeps the numbers; section labels carry none. And the board totals ("34 axes · 34 measured")
 * sat over a 14-tile strip, five of them a bare dash, with nothing saying what the strip is.
 * Against master before this change, both checks fail.
 */
const read = (f: string) => readFileSync(resolve(__dirname, f), "utf8");
const sections = ["HomeResults.tsx", "HomeProducts.tsx", "HomeEvidence.tsx", "HomeDevelopers.tsx", "HomePublicJourney.tsx"];

describe("home section labels and the board strip", () => {
  it("leaves numbering to the hero index, so a label cannot disagree with it", () => {
    for (const f of sections) expect(read(f), f).not.toMatch(/className="hp-eyebrow">\d{2} \//);
    expect(read("HomeHero.tsx")).toMatch(/<span>06<\/span> For developers/);
  });

  it("says what the strip holds, from the payload's own count", () => {
    const results = read("HomeResults.tsx");
    expect(results).toContain('data-testid="home-strip-caption"');
    expect(results).toContain("{separation!.comparison} model-comparison axes");
    expect(results).toContain("A dash means no leading figure is published for that axis");
  });
});
