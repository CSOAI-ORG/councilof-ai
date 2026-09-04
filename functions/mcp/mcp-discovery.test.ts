/**
 * The registry entry is a shopfront: it is how an agent decides whether to connect at all, and
 * it had drifted away from the server it advertises.
 *
 *   · server.json told the MCP registry "12 tools (7 free, 5 x402)". The live server serves 11 —
 *     7 free and 4 paid — because witness_hash was quarantined and dropped from the catalogue.
 *     An agent that budgeted for five purchasable tools finds four.
 *   · the served serverInfo.version read "0.1.0" while the published package was 0.2.1 and the
 *     registry entry said 1.2.0. Three numbers for one server, so a client could not tell which
 *     build it had reached.
 *
 * These pin the advertisement to the thing advertised. The counts are derived from the same two
 * sources tools/list is built from, so the description cannot drift again without failing here.
 */
import { describe, expect, it } from "vitest";
import GSPC_TOOLS from "./gspc-tools.json";
import PAID from "./paid-tools.json";
import SERVER from "../../mcp/gspc-server/server.json";
import PKG from "../../mcp/gspc-server/package.json";

const FREE = (GSPC_TOOLS as { tools: unknown[] }).tools.length;
const PAID_N = PAID.tools.length;

describe("MCP registry entry describes the server it actually is", () => {
  it("advertises the true free and paid counts", () => {
    const d = SERVER.description;
    const m = d.match(/(\d+)\s+tools\s*\((\d+)\s+free,\s*(\d+)\s+x402\)/i);
    expect(m, `description must state counts: ${d}`).toBeTruthy();
    const [, total, free, paid] = m!.map(Number);
    expect(free).toBe(FREE);
    expect(paid).toBe(PAID_N);
    expect(total).toBe(FREE + PAID_N);
  });

  it("the advertised total equals what tools/list would return", () => {
    expect(FREE + PAID_N).toBe(11);
  });

  it("the served version is the published package version, not a third number", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("./[[path]].ts", import.meta.url), "utf8"),
    );
    const m = src.match(/const MCP_SERVER_VERSION = "([^"]+)"/);
    expect(m, "serverInfo version must come from one named const").toBeTruthy();
    expect(m![1]).toBe(PKG.version);
    // and nothing may hardcode a version beside it
    expect(src).not.toMatch(/serverInfo:\s*\{[^}]*version:\s*"/);
  });

  it("no quarantined tool is advertised for sale", () => {
    expect(PAID.tools.map((t) => t.name)).not.toContain("witness_hash");
  });
});
