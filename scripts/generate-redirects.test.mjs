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

// Every <Redirect> stub answers its trailing-slash form too. Measured 18 Nov 2026: 17 of the 26
// stub rules answered 404 with a trailing slash while the slashless form 308'd, because the derived
// rule carried the slashless form only (scripts/generate-redirects.mjs, STUB_ENTRIES).
const STUB_SLASH_404_20261118 = [
  "/a2ui", "/attestation-network", "/catalog", "/ceremony", "/lookup", "/map-regions", "/mcp-tools",
  "/public-dashboard", "/real-world", "/regions", "/relevance-map", "/risk-heatmap", "/sovereign",
  "/sovereign-network", "/sovereign-twin", "/world", "/world-3d",
];

describe("each <Redirect> stub answers its trailing-slash form", () => {
  it.each(STUB_SLASH_404_20261118)("%s/ goes where its slashless form goes, once, above the catch-all", (path) => {
    const bare = rules.filter(([from]) => from === path);
    const slash = rules.filter(([from]) => from === `${path}/`);
    expect(bare).toHaveLength(1);
    expect(slash).toEqual([[`${path}/`, bare[0][1], "308"]]);
    expect(rules.indexOf(slash[0])).toBeLessThan(catchAll);
  });

  // Something already answers these slash forms: the /governance/ page in public/, and Pages
  // Functions for the others (each answered 308 itself on 18 Nov 2026). No rule may shadow them.
  it.each(["/governance/", "/gspc-scoreboard/", "/sovereign-pricing/", "/about-ceasai/", "/ceasai-training/", "/sov3/"])(
    "%s is left to what already serves it",
    (path) => {
      expect(rules.filter(([from]) => from === path)).toEqual([]);
    },
  );
});
