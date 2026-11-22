import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ALL_TOOL_NAMES, toolSummary } from "./mcpTools";
import { NSITES_FLAGS, PLUGIN_HARVEST } from "./nSitesFlags";
import { LIVE_PIN } from "./sovExternalAudit";

/**
 * The client's own tool counts are DERIVED, not typed.
 *
 * WHY THIS FILE EXISTS (2026-11-06). The MCP door serves 54 tools: 49 free and 5
 * x402-metered, read from the two files the door itself serves
 * (functions/mcp/gspc-tools.json and functions/mcp/paid-tools.json). The published
 * discovery document says exactly that — public/.well-known/mcp.json carries
 * measured.total_tools = 54, free_tools = 49, metered_tools = 5, and the full
 * name list under measured.tools and planted.tools.
 *
 * MEASURED 6 Nov 2026, three client sources still said seven:
 *
 *   nSitesFlags.ts    "Public board, seven MCP tools, signed cards. Consent first."
 *                     "Claude, Cursor, Kimi, Grok — one JSON, seven tools."
 *                     a seven-name list, as if that were the served set
 *   sovExternalAudit.ts   the same seven-name list
 *   productFill.ts    "Reads the public board: board_totals, get_axis, … verify_inclusion."
 *
 * So the site understated our own surface by 47 tools, and it understated the
 * very document it points at. The count was never hard to derive: mcpTools.ts
 * already exported ALL_TOOL_NAMES and toolSummary(), and nSitesFlags.ts already
 * used ALL_TOOL_NAMES.length for the npm note. These strings were simply never
 * wired to them.
 *
 * This test is the gate that keeps them wired. It does not pin "54": it pins the
 * DERIVED value, so the day a tool is added to the door the client follows, and
 * the day one is removed the client follows too.
 */
const flagsSrc = readFileSync(resolve(__dirname, "./nSitesFlags.ts"), "utf8");
const auditSrc = readFileSync(resolve(__dirname, "./sovExternalAudit.ts"), "utf8");
const fillSrc = readFileSync(resolve(__dirname, "./productFill.ts"), "utf8");

describe("the client's own tool counts are derived, not typed", () => {
  it("the client states the door's real count", () => {
    const mcp = NSITES_FLAGS.find((f) => f.id === "mcp-http");
    expect(mcp?.plant).toContain(`${ALL_TOOL_NAMES.length} tools`);
    expect(PLUGIN_HARVEST.plugin_reads).toContain(`${ALL_TOOL_NAMES.length} MCP tools`);
  });

  it("no client source types a tool count or a hand-written tool list", () => {
    for (const src of [flagsSrc, auditSrc, fillSrc]) {
      // A typed count is the defect. "seven tools" was the typed one; the rule is
      // the shape, so a future "nine tools" fails here too.
      expect(src).not.toMatch(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(MCP\s+)?tools\b/i);
      // A hand-written list of tool names is the same defect wearing a hat: the
      // served set is ALL_TOOL_NAMES, and a frozen prefix of it goes stale.
      expect(src).not.toMatch(/["'`]board_totals\s*[·,]\s*get_axis/);
    }
  });

  it("the planted lists are the derived shortlist, and name the rest honestly", () => {
    expect(LIVE_PIN.mcp_planted).toBe(toolSummary(7));
    expect(LIVE_PIN.mcp_planted).toContain(`+ ${ALL_TOOL_NAMES.length - 7} more`);
    const plugin = NSITES_FLAGS.find((f) => f.id === "mcp-http");
    expect(plugin?.note).toContain(toolSummary(6));
    expect(plugin?.note).toContain("No 23rd axis.");
  });
});
