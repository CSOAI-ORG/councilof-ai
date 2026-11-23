import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COUNT_FREE_TEXT,
  PUBLISHED_WITH_COUNTS,
  TOOLS_POINTER,
  namesNoNumber,
  registryEntryText,
} from "../../scripts/harness-x/registry-text.mjs";

/**
 * The MCP Registry freezes an entry once it is published. ai.councilof/gspc 1.4.4 said "19 tools (14
 * free, 5 x402-metered)" and gspc-free 1.4.4 said "14 free read-only tools" from 2026-09-30 to
 * 2026-11-21, while the doors grew to 54 and 49 tools under that same version. From the version after
 * 1.5.0, the rendered entries name kinds of tool, never a count or a list, and point at tools/list.
 * 1.5.0 was published with counts, so while the source still says 1.5.0 the renderer keeps that shape
 * (owner ruling, 21 Nov 2026: the count-free texts start with the next gateway version).
 */
const REPO = join(__dirname, "../..");
const read = (p: string) => readFileSync(join(REPO, p), "utf8");
const PP = "io.modelcontextprotocol.registry/publisher-provided";
const SAMPLE = { fleetLine: "3 tools (2 free, 1 x402-metered)", freeIds: ["a", "b"], paidIds: ["c"], servedFree: ["a", "b"] };
const ENTRIES = [
  "distribution/mcp-registry/ai.councilof-gspc/server.json",
  "distribution/mcp-registry/ai.councilof-gspc-free/server.json",
];

describe("MCP Registry entries are count-free from the version after 1.5.0", () => {
  it("any later version names kinds of tool, with no number and no list", () => {
    for (const version of ["1.5.1", "1.6.0", "2.0.0"]) {
      const t = registryEntryText(version, SAMPLE);
      for (const k of ["gspc", "gspcFree"] as const) {
        expect(t[k].description).toBe(COUNT_FREE_TEXT[k]);
        expect(t[k].description.length).toBeLessThanOrEqual(100);
        expect(namesNoNumber(t[k].description)).toBe(true);
        expect(t[k].tools).toEqual({ "ai.councilof/tools": TOOLS_POINTER });
      }
    }
    expect(TOOLS_POINTER).toMatch(/tools\/list/);
  });

  it("the rule can go red: a count is a number, a key name is not", () => {
    expect(namesNoNumber("54 tools (49 free, 5 x402-metered): GSPC board")).toBe(false);
    expect(namesNoNumber("Signed AI measurements over MCP, version 1.5.1")).toBe(false);
    expect(namesNoNumber("Ed25519 card verify, x402-metered evidence")).toBe(true);
  });

  it("1.5.0 keeps exactly the shape the registry holds for it", () => {
    const t = registryEntryText(PUBLISHED_WITH_COUNTS, SAMPLE);
    expect(t.gspc.description).toBe("3 tools (2 free, 1 x402-metered): GSPC board, evidence, Ed25519 card verify. Measurement only.");
    expect(t.gspc.tools).toEqual({ "ai.councilof/fleet": { free: ["a", "b"], paid: ["c"] } });
    expect(t.gspcFree.description).toBe("2 free read-only tools: GSPC board, signed card and capsule verify, Merkle proofs, route.");
    expect(t.gspcFree.tools).toEqual({ "ai.councilof/fleet": { free: ["a", "b"], paid: [] } });
  });

  it("the committed entries follow the rule for the committed version", () => {
    const version = JSON.parse(read("mcp/gspc-server/server.json")).version;
    for (const p of ENTRIES) {
      const doc = JSON.parse(read(p));
      expect(doc.version, p).toBe(version);
      if (version === PUBLISHED_WITH_COUNTS) {
        expect(doc._meta[PP], p).toHaveProperty("ai.councilof/fleet");
        continue;
      }
      expect(namesNoNumber(doc.description), p).toBe(true);
      expect(doc._meta[PP], p).not.toHaveProperty("ai.councilof/fleet");
      expect(doc._meta[PP]["ai.councilof/tools"], p).toBe(TOOLS_POINTER);
    }
  });
});
