/**
 * Connect consolidation (ONE-PRODUCT-PLAN lane 2) retires developer doors into one hub, but these
 * routes each have their own job and are KEPT (CRITIC E6 / A4). No redirect may take them over.
 *   /dispute/   objection door (Corrections section + footer)
 *   /start/     "Get a signed measurement card": the commissioning door (Board: request a measurement)
 *   /api/assess EU AI Act screening helper (agent skill eu-ai-act-screen)
 *   /badge/     badge page, /api/badge the global-board image (navigation, not a model score)
 *   /status/    service status
 *   /reach/     reach entity pages
 *   /api/momentum  feeds the home strip and footer
 * And /tools/ stays the working developer door until /connect/ passes its own DONE WHEN.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const KEPT = ["/dispute", "/start", "/api/assess", "/badge", "/api/badge", "/status", "/reach", "/api/momentum", "/tools"];

function rules(file: string): Array<[string, string]> {
  return readFileSync(resolve(ROOT, file), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/))
    .map(([src, dst]) => [src, dst] as [string, string]);
}

describe("kept routes are not redirected away", () => {
  const all = rules("public/_redirects");
  it.each(KEPT)("%s is served where it is (only the bare->slash canonical rule is allowed)", (p) => {
    // The one permitted rule is the bare form canonicalising to its own slash form.
    expect(all.filter(([src, dst]) => src === p && dst !== p + "/")).toEqual([]);
    expect(all.filter(([src]) => src === p + "/")).toEqual([]);
    // No splat (other than the SPA fallback /*) may swallow it.
    expect(all.filter(([src]) => src.length > 2 && src.endsWith("*") && (p + "/").startsWith(src.slice(0, -1)))).toEqual([]);
  });
});
