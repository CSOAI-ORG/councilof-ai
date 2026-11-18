// /leaderboard is a linked door, so both of its forms must reach the Leaderboard pane at the edge.
//
// Measured 18 Nov 2026: https://councilof.ai/leaderboard answered 308 to /dashboard?tab=leaderboard and
// https://councilof.ai/leaderboard/ answered 404. The bare rule was derived from App.tsx's <Redirect> stub,
// which emits the slashless form only, and no file or Function serves /leaderboard/.
//
// The rules are read from the committed public/_redirects, which is what the edge applies;
// scripts/committed-bytes.node-test.mjs holds that file to a fresh run of scripts/generate-redirects.mjs.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(join(ROOT, "public/_redirects"), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split(/\s+/));
const catchAll = rules.findIndex(([from]) => from === "/*");

describe("/leaderboard answers in both forms", () => {
  it.each(["/leaderboard", "/leaderboard/"])("%s 308s to the Leaderboard pane, once", (path) => {
    const own = rules.filter(([from]) => from === path);
    expect(own).toEqual([[path, "/dashboard?tab=leaderboard", "308"]]);
    // An exact rule must sit above the splat rules and the SPA catch-all.
    expect(catchAll).toBeGreaterThan(0);
    expect(rules.indexOf(own[0])).toBeLessThan(catchAll);
  });
});
