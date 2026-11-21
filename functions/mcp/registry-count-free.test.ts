import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";

/**
 * The MCP Registry freezes an entry when it is published: "Once published, the version string (and
 * other metadata) cannot be changed". ai.councilof/gspc 1.4.4 said "19 tools (14 free, 5
 * x402-metered)" and gspc-free 1.4.4 said "14 free read-only tools" from 2026-09-30 to 2026-11-21,
 * while the doors served up to 54 and 49 tools under that same version. So the rendered registry
 * entries name kinds of tool, never a count or a list of names, and point at tools/list.
 */
const REPO = join(__dirname, "../..");
const read = (p: string) => readFileSync(join(REPO, p), "utf8");
const ENTRIES = [
  "distribution/mcp-registry/ai.councilof-gspc/server.json",
  "distribution/mcp-registry/ai.councilof-gspc-free/server.json",
  "distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json",
];
const PP = "io.modelcontextprotocol.registry/publisher-provided";
const HTTP_VERSION = /export const MCP_HTTP_SERVER_VERSION = "([^"]+)"/.exec(read("functions/mcp/[[path]].ts"))?.[1];

describe("MCP Registry entries state nothing a later release could falsify", () => {
  for (const p of ENTRIES) {
    it(`${p} names kinds of tool, not a number or a list`, () => {
      const doc = JSON.parse(read(p));
      expect(doc.description.length).toBeLessThanOrEqual(100);
      // Ed25519 and x402 are names; any other digit is a count or a version.
      expect(doc.description.replace(/\bEd25519\b|\bx402\b/gi, "")).not.toMatch(/\d/);
      expect(doc._meta[PP]).not.toHaveProperty("ai.councilof/fleet");
      expect(doc._meta[PP]["ai.councilof/tools"]).toMatch(/tools\/list/);
    });
  }

  it("every entry carries the version that initialize answers with", () => {
    expect(HTTP_VERSION).toBeTruthy();
    for (const p of ENTRIES) expect(JSON.parse(read(p)).version).toBe(HTTP_VERSION);
    expect(REGISTRY_DESCRIPTOR.version).toBe(HTTP_VERSION);
  });
});
