import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * WHY THIS EXISTS (2026-09-06). Smithery's listing for csoai/gspc advertises four tools the door
 * refuses BY NAME — measure, verify, jail-probe, enter-arena — and functions/mcp/[[path]].ts answers
 * tools/call for `measure` and `jail-probe` with -32601 and "mill-tool dropped". That listing is
 * Smithery's own cache of an older deployment: there is no smithery.yaml in this repository, so
 * nothing here produced it, and correcting it needs a republish under the owner's account.
 *
 * What this repository CAN guarantee is that a phantom never originates here. pack.mjs copies the
 * canonical tool definitions into the shipped server, and these assertions hold that copy to the
 * door's own list. If the two ever diverge, the packaged server is the thing that lied, and this
 * fails before it ships.
 */
const ROOT = resolve(__dirname, "../..");
const J = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const doorFree = J(resolve(ROOT, "functions/mcp/gspc-tools.json")).tools.map((t: any) => t.name);
const doorPaid = J(resolve(ROOT, "functions/mcp/paid-tools.json")).tools.map((t: any) => t.name);

describe("the packaged MCP server advertises exactly what the door serves", () => {
  it("reads the door's canonical lists, so this cannot pass vacuously", () => {
    expect(doorFree.length).toBeGreaterThan(3);
    expect(doorPaid.length).toBeGreaterThan(0);
  });

  it("pack.mjs copies from the canonical sources and invents nothing", () => {
    const pack = readFileSync(resolve(__dirname, "pack.mjs"), "utf8");
    expect(pack).toContain("functions/mcp/gspc-tools.json");
    expect(pack).toContain("functions/mcp/paid-tools.json");
    // a literal tool array inside the packer would be a second source of truth
    expect(pack, "the packer must copy tool names, never carry its own")
      .not.toMatch(/"(board_totals|measure|jail-probe|enter-arena)"\s*,/);
  });

  for (const [label, file] of [["free", "gspc-tools.json"], ["paid", "paid-tools.json"]] as const) {
    it(`the shipped ${label} list, if present, equals the door's`, () => {
      const p = resolve(__dirname, file);
      if (!existsSync(p)) return; // written at pack time; absent in a clean tree
      const shipped = J(p).tools.map((t: any) => t.name);
      expect(shipped).toEqual(label === "free" ? doorFree : doorPaid);
    });
  }

  it("no dropped mill-tool is advertised anywhere we control", () => {
    // the exact four Smithery still shows
    const dropped = ["measure", "jail-probe", "enter-arena"];
    const surfaces = ["glama.json", "server.json", "package.json", "README.md"]
      .map((f) => resolve(__dirname, f))
      .filter(existsSync);
    const bad: string[] = [];
    for (const s of surfaces) {
      const t = readFileSync(s, "utf8");
      for (const d of dropped) {
        // match a tool-shaped mention, not prose about the incident
        if (new RegExp(`"${d}"`).test(t)) bad.push(`${s.split("/").pop()}: ${d}`);
      }
    }
    expect(bad, "a manifest we own advertises a tool the door refuses by name").toEqual([]);
  });
});
