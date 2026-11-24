/**
 * Held rows are printed only with their limit, and funding is stated once (24 Nov 2026).
 *
 * Read live that day:
 * - /board/ listed the ten held subject axes with their n ("Claim Maintenance 174 measured") and
 *   printed governance's positions (58.7%, 139/237), with no limit beside any of them. Since #4680,
 *   GET /api/gspc carries a `limit` on those rows, and the owner's holds say no figure from them goes
 *   out without it.
 * - /independence/ counted governance's TIE in its tally of re-ranked axes, again without the limit.
 * - /how-we-work/'s funding band said "Here is the whole answer ... We fund ourselves by selling
 *   signed evidence artefacts", while /independence/ says "Funding sources: not yet published".
 * Each check reads the code that prints the page, or runs the function that builds its rows.
 * Against master's files the row-model, renderer and funding checks go red.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadBoard } from "./axis-sets";

const ROOT = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const LIMIT = "We matched this bank's patterns on the raw page source, not on the text a reader sees.";

describe("a held row carries its limit from /api/gspc", () => {
  it("loadBoard keeps the row's limit, and leaves an unheld row without one", () => {
    const set = loadBoard({
      axes: [
        { axis: "serving-fidelity", kind: "measured-subject", status: "MEASURED", n: 38, limit: LIMIT },
        { axis: "safety", kind: "model-comparison", status: "MEASURED", n: 36 },
      ],
    });
    const byId = Object.fromEntries(set.rows.map((r) => [r.id, r]));
    expect(byId["serving-fidelity"].limit).toBe(LIMIT);
    expect(byId.safety.limit ?? null).toBeNull();
  });
});

describe("every board renderer that prints a held row prints its limit", () => {
  it("the field list on /board/", () => {
    expect(read("client/src/components/gspc/BoardField.tsx")).toMatch(/\{r\.limit && \([\s\S]{0,200}Held: \{r\.limit\}/);
  });
  it("the set table on /board/, in both layouts", () => {
    const src = read("client/src/pages/MeasurementBoard.tsx");
    expect(src.match(/\{r\.limit && \(/g)).toHaveLength(2);
    expect(src.match(/Held: \{r\.limit\}/g)).toHaveLength(2);
  });
  it("the positions table on /board/, which shows governance", () => {
    expect(read("client/src/components/gspc/LivingBoard.tsx")).toMatch(/board\.limit[\s\S]{0,300}Held: \{board\.limit\}/);
    expect(read("client/src/lib/livingBoard.ts")).toMatch(/export interface BoardAxis \{[\s\S]{0,200}limit\?: string;/);
  });
  it("the re-ranked tally on /independence/", () => {
    expect(read("client/src/pages/Independence.tsx")).toMatch(/data-testid="independence-held-limits"[\s\S]{0,400}Held: \{a\.axis\}: \{a\.limit\}/);
  });
});

describe("funding is stated as /independence/ states it", () => {
  const band = read("client/src/components/home/LivingStages.tsx");
  const independence = read("client/src/pages/Independence.tsx");
  it("/independence/ says the sources are not yet published", () => {
    expect(independence).toContain("Funding sources: not yet published");
  });
  it("/how-we-work/'s band claims no source and no complete answer, and points to that page", () => {
    expect(band).not.toMatch(/We\s+fund ourselves/);
    expect(band).not.toMatch(/whole\s+answer/);
    expect(band).not.toMatch(/We take no money from anything we rank/);
    expect(band).toMatch(/Our funding sources are not yet\s+published/);
    expect(band).toContain('secondary={{ href: "/independence/#funding", label: "How we are funded" }}');
  });
});
