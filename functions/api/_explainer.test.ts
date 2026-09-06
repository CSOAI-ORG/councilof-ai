import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * WHY THIS EXISTS (2026-09-06). Every metered door handed the buyer an explainer link, and every
 * one of them pointed at /pricing-free — a page that renders "Evidence review in progress. This
 * legacy page is temporarily withdrawn." The estate's own SKU-INDEX had already recorded that
 * withdrawal and named the replacement ("the BUYER rail is /pricing and /api/x402"), but the
 * doors were never repointed, so seven call sites across six files kept sending buyers there.
 *
 * This matters more under the owner ruling of 6 Sep 2026 than it did before: the ruling moves ALL
 * pricing to the 402 itself, which makes the 402's explainer the one place a buyer is told how
 * payment works. A withdrawn page is the worst possible target for it.
 *
 * The guard is on the SHAPE of the mistake, not the one URL: a door may not hand a buyer a link
 * to a page the estate has withdrawn.
 */
const FUNCS = new URL("../", import.meta.url).pathname;

// pages the estate has withdrawn, retired or quarantined — never a buyer-facing destination
const WITHDRAWN = ["/pricing-free"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts") && !p.includes(".test.")) out.push(p);
  }
  return out;
}
const FILES = walk(FUNCS);
const rel = (f: string) => f.split("/functions/")[1] ?? f;

describe("no door sends a buyer to a withdrawn page", () => {
  for (const bad of WITHDRAWN) {
    it(`no function references ${bad}`, () => {
      const offenders = FILES.filter((f) => readFileSync(f, "utf8").includes(bad)).map(rel);
      expect(offenders, `${bad} is withdrawn and must not be a buyer destination`).toEqual([]);
    });
  }

  it("every explainer a door emits is a single absolute path on our own origin", () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/explainer:\s*(?:`\$\{origin\}([^`]*)`|u\("([^"]*)"\))/g)) {
        const path = m[1] ?? m[2];
        if (!path.startsWith("/")) bad.push(`${rel(f)}: ${path}`);
        for (const w of WITHDRAWN) if (path === w) bad.push(`${rel(f)}: ${path} (withdrawn)`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("at least one door actually emits an explainer, so this test cannot pass vacuously", () => {
    const withExplainer = FILES.filter((f) => /explainer:/.test(readFileSync(f, "utf8")));
    expect(withExplainer.length, "no door emits an explainer at all — the guard would be empty")
      .toBeGreaterThan(3);
  });
});
