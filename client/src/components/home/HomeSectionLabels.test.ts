import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(resolve(__dirname, f), "utf8");
const sections = ["HomeResults.tsx", "HomeProducts.tsx", "HomeEvidence.tsx", "HomeDevelopers.tsx", "HomePublicJourney.tsx"];

describe("home section labels and the living board", () => {
  it("leaves numbering to the hero index, so a label cannot disagree with it", () => {
    for (const f of sections) expect(read(f), f).not.toMatch(/className="hp-eyebrow">\d{2} \//);
    expect(read("HomeHero.tsx")).toMatch(/<span>06<\/span> For developers/);
  });

  it("keeps the report band from rendering a second board", () => {
    expect(read("HomeMine.tsx")).not.toContain("LivingBoardStrip");
    expect(read("HomeResults.tsx")).not.toContain("LivingBoardStrip");
  });
});
