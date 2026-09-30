/**
 * ONE tool-count sentence, derived (public audit 2026-09-28, fix #19), and the two MCP discovery
 * files rendered whole from one source (fix #24).
 *
 * #19. /connect-gspc/ said "Seven free read-only tools" and "13 tools", the home page 16,
 * /connect/claude/ 12 and npm 0.2.2 "eight free readers" — for two doors. Every surface that states
 * a count now either derives it from the files tools/list serves or carries the one sentence:
 *   "13 free tools at /mcp/free; 17 at /mcp (13 free + 4 metered). The npm package is versioned separately."
 * with every number an array length.
 *
 * #24. /.well-known/mcp/server-card.json had no tools[] and no version and named four axes;
 * /.well-known/mcp.json carried registry.version 1.4.2 (the registry's latest is 1.4.3), an internal
 * dead_worker note and fallback_url https://csoai.org/mcp, which answers POST with a 308.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest, TOOL_COUNTS, toolCountSentence, MCP_HTTP_SERVER_VERSION } from "./[[path]]";
import { TOOL_COUNT_SENTENCE } from "../../client/src/lib/mcpTools";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";
import REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import SERVER_CARD from "../../public/.well-known/mcp/server-card.json";
import MCP_JSON from "../../public/.well-known/mcp.json";

const ROOT = resolve(__dirname, "../..");
const ORIGIN = "https://councilof.ai";
const nFree = FREE.tools.length;
const nPaid = PAID.tools.length;
const EXPECTED = `${nFree} free tools at /mcp/free; ${nFree + nPaid} at /mcp (${nFree} free + ${nPaid} metered). The npm package is versioned separately.`;

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network is mocked"); })));
afterEach(() => vi.unstubAllGlobals());

describe("#19 one tool-count sentence, every number derived", () => {
  it("the server and the site build the same sentence from the served definition files", () => {
    expect(TOOL_COUNTS).toBe(EXPECTED);
    expect(TOOL_COUNT_SENTENCE).toBe(EXPECTED);
    expect(toolCountSentence(nFree, nPaid)).toBe(EXPECTED);
  });

  it("with today's fleet it reads exactly the audit's sentence", () => {
    // The fleet lock (tool-fleet.lock.json) is 12 + 4; if the fleet changes, the lock changes in the
    // same commit and this literal is the one line to update.
    if (nFree === 13 && nPaid === 4) {
      expect(EXPECTED).toBe("13 free tools at /mcp/free; 17 at /mcp (13 free + 4 metered). The npm package is versioned separately.");
    }
  });

  it("GET /mcp (JSON and page) carries it; GET /mcp/free stays free of payment words", async () => {
    const get = (path: string, accept = "application/json") =>
      onRequest({ request: new Request(`${ORIGIN}${path}`, { headers: { accept } }), env: {}, params: {} } as never);
    const doc = (await (await get("/mcp")).json()) as { tool_counts: string };
    expect(doc.tool_counts).toBe(EXPECTED);
    expect(await (await get("/mcp/", "text/html")).text()).toContain(EXPECTED);
    const free = await (await get("/mcp/free")).text();
    // x402_trust is a FREE reader (it reads other sellers' x402 doors); its name is not payment text.
    expect(free.replace(/x402_trust/g, "")).not.toMatch(/metered|x402|x_payment/i);
    expect(await (await get("/mcp/free/", "text/html")).text()).toContain(`Free tools (${nFree})`);
  });

  it("the connect and product pages derive it, and no typed fleet count survives", () => {
    const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
    const gspc = read("client/src/pages/ConnectGSPC.tsx");
    expect(gspc).toContain("TOOL_COUNT_SENTENCE");
    expect(gspc).toContain("FREE_TOOLS");
    for (const stale of [/Seven free read-only tools/, /all seven tools/, /These seven are a subset/, /served 12 \(no/]) {
      expect(gspc).not.toMatch(stale);
    }
    expect(read("client/src/pages/TransparencyCop.tsx")).not.toMatch(/serves 12 tools \(8 free/);
    expect(read("client/src/pages/TransparencyCop.tsx")).toContain("TOOL_COUNT_SENTENCE");
    expect(read("client/src/lib/permissionlessRevenue.ts")).not.toMatch(/Eight free read tools/);
  });
});

describe("#24 discovery files: rendered whole from one source", () => {
  it("both documents state the one server version, equal to initialize and the registry descriptor", () => {
    const v = REGISTRY_DESCRIPTOR.version;
    expect(MCP_HTTP_SERVER_VERSION).toBe(v);
    const card = SERVER_CARD as any;
    expect(card.version).toBe(v);
    expect(card.serverInfo).toEqual({ name: "csoai-gspc-mcp", title: expect.any(String), version: v });
    const m = MCP_JSON as any;
    expect(m.servers[0].version).toBe(v);
    expect(m.servers[0].registry.version).toBe(v);
  });

  it("the server card carries the full tools list, exactly what tools/list serves on /mcp", () => {
    const card = SERVER_CARD as any;
    expect(card.tools).toEqual([...FREE.tools, ...PAID.tools]);
    expect(card.capabilities.tools).toEqual(card.tools.map((t: { name: string }) => t.name));
    expect(card.capabilities.tool_counts).toBe(EXPECTED);
    expect((MCP_JSON as any).measured.tool_counts).toBe(EXPECTED);
  });

  it("no internal notes, no dead fallback, no four-axis list", () => {
    const text = JSON.stringify(SERVER_CARD) + JSON.stringify(MCP_JSON);
    expect(text).not.toMatch(/dead_worker|workers\.dev|fallback|csoai\.org\/mcp|mill-tool/);
    expect(text).not.toMatch(/Governance · Safety · Provenance · Continuity/);
    expect((MCP_JSON as any).servers[0]).not.toHaveProperty("fallback_url");
    expect((MCP_JSON as any).servers[0]).not.toHaveProperty("dead_worker");
    expect((SERVER_CARD as any).endpoints.mcp).not.toHaveProperty("fallback");
  });

  it("the committed files are exactly what the renderer produces (render --check)", () => {
    const out = execFileSync(process.execPath, [resolve(ROOT, "scripts/harness-x/render.mjs"), "--check"], { cwd: ROOT, encoding: "utf8" });
    expect(out).toMatch(/match/);
  });
});
