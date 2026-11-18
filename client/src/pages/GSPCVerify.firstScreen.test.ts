import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Measured on 17 Nov 2026 at 390 px: "Try a published card" and the paste box started 1,597 px down,
 * about two phone screens, behind the result-state explanation. These checks read the page source in
 * render order. Against master before this change, the first two fail.
 */
const page = readFileSync(resolve(__dirname, "GSPCVerify.tsx"), "utf8");

describe("/gspc-verify offers the check before the explanation", () => {
  it("puts Try a published card in the hero, before the result-state explanation", () => {
    const quick = page.indexOf('data-testid="verify-quick-start"');
    const states = page.indexOf("Every check ends in one of three results");
    expect(quick).toBeGreaterThan(-1);
    expect(states).toBeGreaterThan(-1);
    expect(quick).toBeLessThan(states);
  });

  it("links the paste form through an anchor the record section carries", () => {
    expect(page).toContain('href="#check-record"');
    expect(page).toMatch(/<section id="check-record"/);
  });

  it("asks the card matrix for a third-party example before falling back to the chain", () => {
    const matrix = page.indexOf('"/signed/card-matrix.json"');
    const chain = page.indexOf('"/signed/chain.json"');
    expect(matrix).toBeGreaterThan(-1);
    expect(chain).toBeGreaterThan(matrix);
    expect(page).toContain("thirdPartyExampleCells(");
  });
});
