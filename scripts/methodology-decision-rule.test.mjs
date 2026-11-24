// /methodology/ states its decision rule, the uncertainty it does and does not cover, and the dated rule
// changes (gaps A5, A7 and A8, 22 Nov 2026). Each statement is tied here to the code or record it describes,
// so a change to the producer turns this red until the page is changed with it:
// - the producer (scripts/gspc_separation_from_rows.py) runs an exact two-sided McNemar at 0.05 and applies
//   no correction across axes; the page must say both;
// - every correction id the page cites exists in the ledger the site serves (functions/api/corrections.ts);
// - the old white paper may not stand unmarked while it claims a Benjamini-Hochberg correction.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const page = read("client/src/pages/Methodology.tsx");
const producer = read("scripts/gspc_separation_from_rows.py");
const served = read("functions/api/_gspc_rows_separation.ts");

describe("the decision rule on /methodology/ is the producer's", () => {
  it("is two-sided and exact, as the producer computes it", () => {
    expect(producer).toMatch(/def mcnemar\(b, c\):[\s\S]{0,200}p = 2 \* sum\(comb\(n, i\)/);
    expect(page).toContain("an exact two-sided McNemar test on the items where the");
  });

  it("uses the producer's threshold", () => {
    expect(served).toContain("SEPARATED iff exact McNemar p<0.05");
    expect(page).toContain("at α = 0.05");
  });

  it("says no correction is made across axes, and the producer makes none", () => {
    const correction = /bonferroni|holm|benjamini|hochberg|false discovery|\bfdr\b/i;
    expect(producer).not.toMatch(correction);
    expect(served).not.toMatch(correction);
    expect(page).toContain("No correction is made for testing several axes at once");
  });

  it("computes the chance count from the board's own totals, never a typed number", () => {
    expect(page).toMatch(/const tested = separated \+ ties;/);
    expect(page).toMatch(/expected: \(tested \* 0\.05\)\.toFixed\(2\)/);
    expect(page).toMatch(/t\.comparison_axes !== tested \+ untested\) return null/);
  });
});

describe("the uncertainty budget names what is not measured", () => {
  it("marks the three sources nothing has measured", () => {
    const budget = page.slice(page.indexOf('data-testid="methodology-uncertainty-budget"'), page.indexOf('data-testid="methodology-rule-changes"'));
    expect(budget.match(/>UNMEASURED</g)).toHaveLength(3);
    expect(budget).toContain("The grading rules and reference answers");
    expect(budget).toContain("Prompt wording and harness choices");
    expect(budget).toContain("Whether a bank represents the behaviour it is named for");
  });
});

describe("every cited correction exists", () => {
  it("in the ledger the site serves", () => {
    const ledger = read("functions/api/corrections.ts");
    const cited = [...new Set(page.match(/C-2026-\d{4}-\d{2}/g) ?? [])];
    expect(cited.length).toBeGreaterThanOrEqual(4);
    for (const id of cited) expect(ledger, id).toContain(`"${id}"`);
  });
});

describe("the 25 Aug white paper is marked superseded", () => {
  it("before its Benjamini-Hochberg line", () => {
    const paper = read("docs/METHODOLOGY-WHITE-PAPER.md");
    const note = paper.indexOf("**Superseded");
    const bh = paper.indexOf("Benjamini-Hochberg family");
    expect(note).toBeGreaterThan(-1);
    expect(note).toBeLessThan(bh);
    expect(paper).toContain("No Benjamini-Hochberg or other multiple-testing correction is applied across axes.");
  });
});
