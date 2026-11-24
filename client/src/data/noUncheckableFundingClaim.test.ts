/**
 * No page states a funding rule that /independence/ cannot back (24 Nov 2026).
 *
 * /independence/ says "Funding sources: not yet published". The home story, five deck worlds and the
 * llms sitemap said "we take no money from anything we rank" (or "takes no money from anything it
 * ranks", "is never paid by any party it ranks", "no revenue from any ranked party"). With the sources
 * unpublished, a reader cannot check that. They now say what /how-we-work/ says: no one can buy a place,
 * a score or a removal. The owner's doctrine list in facts.json is a record, not page copy, and is left as it is.
 * Against master's files the scan goes red, listing each file and line.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const CLAIM = /takes? no money from anything|no money from anything ranked|never paid by (?:any|a) (?:ranked )?party|no revenue from any ranked party/i;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe("funding is stated only as /independence/ states it", () => {
  it("/independence/ says the sources are not yet published", () => {
    expect(readFileSync(resolve(ROOT, "client/src/pages/Independence.tsx"), "utf8")).toContain("Funding sources: not yet published");
  });

  it("no page source or llms sitemap entry claims money is never taken from a ranked party", () => {
    const files = [...sources(resolve(ROOT, "client/src")), resolve(ROOT, "public/llms-sitemap.xml")];
    const hits = files.flatMap((f) =>
      readFileSync(f, "utf8")
        .split("\n")
        .flatMap((line, i) => (CLAIM.test(line) ? [`${relative(ROOT, f)}:${i + 1}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it("the home story and the deck worlds say what /how-we-work/ says instead", () => {
    const said = /no one can buy a place, a score or a removal/i;
    for (const f of [
      "client/src/components/home/StoryWorld.tsx",
      "client/src/components/home/LivingStages.tsx",
      "client/src/data/deckWorlds/coliseum.ts",
      "client/src/data/deckWorlds/evidenceRail.ts",
      "client/src/data/deckWorlds/livingLedger.ts",
      "client/src/data/deckWorlds/metrology.ts",
      "client/src/data/deckWorlds/pricingRisk.ts",
    ]) {
      expect(readFileSync(resolve(ROOT, f), "utf8"), f).toMatch(said);
    }
  });
});
