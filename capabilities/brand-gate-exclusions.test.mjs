/**
 * brand-gate-exclusions.test.mjs — the per-page opt-out list cannot grow in silence.
 *
 * `scripts/brand-gate.mjs` carries EXCLUDE_PAGES: surfaces where a forbidden display string is
 * allowed because it is legitimate IN THAT CONTEXT. Each entry is reasoned in the file, and the
 * reasoning is good:
 *
 *   refutation-ledger  the honest retraction page — it renders the Byzantine/BFT retraction
 *                      HISTORY, so naming the term is the page's whole job
 *   mcps / mcp-        a catalogue of third-party MCPs whose own names contain "BFT" and
 *                      "Sovereign" ("BFT Progress Council MCP"). Renaming them would
 *                      misrepresent someone else's artifact
 *   j-space            the signed-event viewer, rendering production chain records
 *   regulator-console, ai-transparency, authority, badges
 *
 * The file also states the condition for removing one: "Remove an entry here only once that
 * surface has had its own de-brand pass", and for the registry specifically, "Gated again after
 * that rewrite."
 *
 * THE RISK IS NOT THE LIST, IT IS THAT IT IS PROSE. An exclusion is how doctrine enforcement is
 * switched off for a page. Eight are switched off today, each for a stated reason, and nothing
 * mechanical notices if a ninth is added — or if the promised curation rewrite lands and the
 * exclusion is never removed. That is the same shape as a KNOWN_DUPLICATES list rotting into
 * permanent permission, which this lane already guarded for routes.
 *
 * WHY THIS MATTERS TODAY, with evidence. A live scan of all 383 URLs in the production sitemap
 * found exactly one page carrying a forbidden term outside a retraction context: /mcps, which is
 * on this list for the documented reason above. So the list is currently doing its job and
 * nothing more. Separately, `public/games-charter.html` shipped the retracted BFT claim to
 * production through the SEPARATE filename `allowOn` hole — proving what an unwatched exemption
 * costs.
 *
 * This asserts the count and the membership. It takes no view on whether an entry is right.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(here, "..", "scripts", "brand-gate.mjs"), "utf8");

/** The surfaces excluded at audit, 2026-09-05. Adding one is a deliberate act. */
const EXCLUDED_AT_AUDIT = [
  "regulator-console",
  "refutation-ledger",
  "mcps",
  "mcp-",
  "ai-transparency",
  "authority",
  "badges",
  "j-space",
];

function excludeLine() {
  const m = src.match(/const EXCLUDE_PAGES\s*=\s*\/(.+?)\/;/);
  return m ? m[1] : "";
}

describe("brand-gate's per-page exclusions", () => {
  it("finds the exclusion list (guards against the parse matching nothing)", () => {
    assert.ok(excludeLine().length > 20, "EXCLUDE_PAGES could not be read");
  });

  it("every surface excluded at audit is still excluded for the same reason", () => {
    const line = excludeLine();
    const gone = EXCLUDED_AT_AUDIT.filter((e) => !line.includes(e));
    assert.deepEqual(
      gone,
      [],
      `${gone.join(", ")} is no longer excluded. If that surface has had its de-brand pass, ` +
        `good — remove it from EXCLUDED_AT_AUDIT here in the same change, so the two records ` +
        `cannot disagree about which pages are ungated.`,
    );
  });

  it("no NEW surface has been excluded without being recorded", () => {
    // The whole point. An exclusion switches doctrine enforcement off for a page; it should
    // never be possible to do that quietly.
    const line = excludeLine();
    // Extract path-like tokens, not regex fragments. Splitting on "|" breaks INSIDE groups
    // such as `refutation-ledger(\/|\.html|$)` and yields "html" three times — which is how
    // the first version of this assertion failed against an unmodified file. Match identifier
    // shapes instead, and drop the regex vocabulary that is not a surface name.
    const NOISE = new Set(["html", "htm", "json", "txt"]);
    const tokens = [...new Set((line.match(/[a-z][a-z0-9-]{2,}/g) ?? []))].filter(
      (t) => !NOISE.has(t),
    );
    const unrecorded = tokens.filter(
      (t) => !EXCLUDED_AT_AUDIT.some((e) => t.includes(e) || e.includes(t)),
    );
    assert.deepEqual(
      unrecorded,
      [],
      `these surfaces are newly excluded from brand-gate: ${unrecorded.join(", ")}. Excluding ` +
        `a page turns off the doctrine rules for it — certify, rank-for-sale, pricing, the ` +
        `retracted BFT claim. Record it here with its reason, as the existing entries are.`,
    );
  });

  it("the file still states the condition for removing an entry", () => {
    // Without it the list is just a list, and the next reader has no rule to apply.
    assert.match(
      src,
      /Remove an entry here only once that surface has had its own de-brand pass/,
      "brand-gate no longer states when an exclusion may be removed. That sentence is what " +
        "stops the list becoming permanent permission.",
    );
  });
});
