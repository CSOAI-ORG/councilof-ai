/**
 * ONE tool-count sentence, derived (public audit 2026-09-28, fix #19), and the two MCP discovery
 * files rendered whole from one source (fix #24).
 *
 * #19. /connect-gspc/ said "Seven free read-only tools" and "13 tools", the home page 16,
 * /connect/claude/ 12 and npm 0.2.2 "eight free readers" — for two doors. Every surface that states
 * a count now either derives it from the files tools/list serves or carries the one sentence,
 * with every number an array length. (The sentence as it read then was "14 free tools at
 * /mcp/free; 19 at /mcp (14 free + 5 metered)". The npm package is versioned separately.
 * Neither number is written down here now: the sentence is computed from the lock, and the lock
 * is rendered from council-os/capabilities.json.)
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
    // The fleet lock (tool-fleet.lock.json) is 47 + 5 since 2026-10-26 (the 33 axis tools joined the 14 free readers on 2026-10-26);
    // if the fleet changes, the lock changes in the same commit and this literal is the one line to update.
    expect([nFree, nPaid]).toEqual([47, 5]);
    expect(EXPECTED).toBe("47 free tools at /mcp/free; 52 at /mcp (47 free + 5 metered). The npm package is versioned separately.");
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

/**
 * #3502. The last four surfaces that still carried a hand-written fleet size.
 *
 * The fleet count has been copied by hand into six places so far, and each copy went stale
 * in its own way: smoke.mjs, wired-tools.test.mjs, the published prose in llms-install.md,
 * the published Claude plugin manifest at public/.claude-plugin/plugin.json (which said
 * "16 tools (12 free, 4 x402-metered)" at version 1.4.3 while the door served 52 at 1.4.4),
 * the public page public/what-is-new.html (which said the route describes four tools), and
 * the staged mcp.so submission (which named 12 tools and npm 0.2.2).
 *
 * Two of them are now DERIVED at build time — the plugin manifest is emitted by
 * scripts/harness-x/render.mjs from pluginCore — and this test holds the two that are still
 * prose to the same numbers. A fleet change turns it red instead of leaving a stale claim
 * on a live page.
 */
describe("#3502 the last hand-written fleet sizes are held to the manifests", () => {
  const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
  const FLEET = `${nFree + nPaid} tools (${nFree} free, ${nPaid} x402-metered)`;

  it("the published Claude plugin manifest carries the derived fleet and the live version", () => {
    const plugin = JSON.parse(read("public/.claude-plugin/plugin.json"));
    expect(plugin.description).toContain(FLEET);
    expect(plugin.version).toBe(REGISTRY_DESCRIPTOR.version);
    // and it is rendered, not typed: the renderer owns it, so it cannot drift from pluginCore
    expect(read("scripts/harness-x/render.mjs")).toContain('emit("public/.claude-plugin/plugin.json"');
    expect(read("council-os/distribution.json")).toContain("public/.claude-plugin/plugin.json");
  });

  it("the public what-is-new page names no frozen tool list and no frozen count", () => {
    const page = read("public/what-is-new.html");
    // the old claim: "The public MCP route describes board_totals, get_axis, verify_card, and list_cards."
    expect(page).not.toMatch(/describes <code>board_totals<\/code>/);
    for (const stale of [/19 tools/, /16 tools/, /12 tools/, /8 free readers/, /Twelve MCP tools/]) {
      expect(page).not.toMatch(stale);
    }
    // it points at the live source instead of freezing a number here
    expect(page).toContain("tools/list");
  });

  it("the staged mcp.so submission names the derived fleet, every paid tool, and the published version", () => {
    const doc = read("docs/operations/submissions/mcp-so-submission.md");
    expect(doc).toContain(`${nFree + nPaid} MCP tools`);
    expect(doc).toContain(`${nFree} free readers`);
    expect(doc).toContain(`${nPaid} x402-metered`);
    for (const t of PAID.tools.map((t: { name: string }) => t.name)) {
      expect(doc).toContain(`\`${t}\``);
    }
    // the stdio line installs one exact version, and that version is the package's
    const version = (JSON.parse(read("mcp/gspc-server/package.json")) as { version: string }).version;
    expect(doc).toContain(`csoai-gspc-mcp (v${version})`);
    expect(doc).toContain(`npx -y csoai-gspc-mcp@${version}`);
  });

  it("no working document still says the fleet was 19 tools", () => {
    expect(read("council-os/ADR-005-DRAFT-capability-router-layers.md")).not.toMatch(/The 19 MCP tools stay/);
  });
});
