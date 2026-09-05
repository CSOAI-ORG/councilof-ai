import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NSITES_FLAGS, PLUGIN_HARVEST } from "../../client/src/lib/nSitesFlags";
import {
  OPENINGS,
  OPEN_SDKS,
} from "../../client/src/lib/permissionlessRevenue";
import { PLAYBOOK_CLAIMS } from "../../client/src/lib/playbookAudit";
import { FILL_ROWS } from "../../client/src/lib/productFill";
import { TERMINAL_ROWS } from "../../client/src/lib/governanceTerminal";
import HTTP_REGISTRY_DESCRIPTOR from "../../mcp/gspc-server/server.json";
import STDIO_PAID from "../../mcp/gspc-server/paid-tools.json";
import CAPABILITY_REGISTRY from "../../capabilities/registry.json";
import MCP_WELL_KNOWN from "../../public/.well-known/mcp.json";
import MCP_SERVER_CARD from "../../public/.well-known/mcp/server-card.json";
import PLUGIN_MCP from "../../plugins/gspc/.mcp.json";
import PLUGIN from "../../plugins/gspc/plugin.json";
import { onRequest } from "./[[path]]";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

type ToolDefinition = { name: string; description?: string; csoai?: unknown };

const ORIGIN = "https://councilof.ai";
const HTTP_MCP = `${ORIGIN}/mcp`;
const FREE_NAMES = (FREE.tools as ToolDefinition[]).map((tool) => tool.name);
const PAID_NAMES = (PAID.tools as ToolDefinition[]).map((tool) => tool.name);
const HTTP_TOOL_NAMES = [...FREE_NAMES, ...PAID_NAMES];
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;
const COPIED_TOOL_COUNT =
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(?:(?:free|paid|read|metered|HTTP|MCP|x402)[-\s]+)*tools?\b/i;
const COPIED_TOOL_LIST = /\bboard_totals\b[\s\S]*\bget_axis\b/;

const here = dirname(fileURLToPath(import.meta.url));
const pluginReadme = readFileSync(
  resolve(here, "../../plugins/gspc/README.md"),
  "utf8",
);

function countPattern(count: number, qualifier: string): RegExp {
  const word = NUMBER_WORDS[count];
  return new RegExp(
    `\\b(?:${count}${word ? `|${word}` : ""})\\s+${qualifier}\\b`,
    "i",
  );
}

async function listHttpTools(): Promise<string[]> {
  const response = await onRequest({
    request: new Request(HTTP_MCP, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    }),
    env: {},
    params: {},
  } as never);
  const body = (await response.json()) as {
    result: { tools: ToolDefinition[] };
  };
  return body.result.tools.map((tool) => tool.name);
}

describe("HTTP MCP capability parity", () => {
  it("serves the ordered union of the two canonical definition files", async () => {
    expect(new Set(HTTP_TOOL_NAMES).size).toBe(HTTP_TOOL_NAMES.length);
    expect(PAID_NAMES).not.toContain("witness_hash");
    expect(await listHttpTools()).toEqual(HTTP_TOOL_NAMES);
  });

  it("keeps paid-tool promises identical across HTTP, stdio and the capability registry", () => {
    const stdio = new Map(
      (STDIO_PAID.tools as ToolDefinition[]).map((tool) => [tool.name, tool]),
    );
    const registry = new Map(
      (CAPABILITY_REGISTRY.capabilities as Array<{ id: string; description?: string }>).map(
        (capability) => [capability.id, capability],
      ),
    );

    for (const tool of PAID.tools as ToolDefinition[]) {
      expect(stdio.get(tool.name)?.description).toBe(tool.description);
      expect(stdio.get(tool.name)?.csoai).toEqual(tool.csoai);
      expect(registry.get(tool.name)?.description).toBe(tool.description);
    }
  });

  it("keeps both public MCP manifests on the canonical names and counts", () => {
    expect(MCP_WELL_KNOWN.servers[0].url).toBe(HTTP_MCP);
    expect(MCP_WELL_KNOWN.measured.tools).toEqual(HTTP_TOOL_NAMES);
    expect(MCP_WELL_KNOWN.planted.tools).toEqual(HTTP_TOOL_NAMES);
    expect(MCP_WELL_KNOWN.measured).toMatchObject({
      total_tools: HTTP_TOOL_NAMES.length,
      free_tools: FREE_NAMES.length,
      metered_tools: PAID_NAMES.length,
    });

    expect(MCP_SERVER_CARD.endpoints.mcp.primary).toBe(HTTP_MCP);
    expect(MCP_SERVER_CARD.capabilities.tools).toEqual(HTTP_TOOL_NAMES);
    expect(MCP_SERVER_CARD.capabilities).toMatchObject({
      total_tools: HTTP_TOOL_NAMES.length,
      free_tools: FREE_NAMES.length,
      metered_tools: PAID_NAMES.length,
    });
    expect(HTTP_REGISTRY_DESCRIPTOR.description).toContain(
      `${HTTP_TOOL_NAMES.length} HTTP tools (${FREE_NAMES.length} free, ${PAID_NAMES.length} x402)`,
    );

    for (const summary of [
      MCP_WELL_KNOWN.measured.note,
      MCP_WELL_KNOWN.planted.note,
      MCP_SERVER_CARD.description,
      MCP_SERVER_CARD.endpoints.mcp.note,
    ]) {
      expect(summary).toMatch(countPattern(FREE_NAMES.length, "free"));
      expect(summary).toMatch(countPattern(PAID_NAMES.length, "x402"));
    }
  });

  it("makes the plugin discover capabilities instead of freezing another list", () => {
    expect(PLUGIN_MCP.mcpServers.gspc.url).toBe(HTTP_MCP);
    const copy = `${PLUGIN.description}\n${pluginReadme}`;
    expect(copy).toMatch(/tools\/list/i);
    expect(copy).not.toMatch(COPIED_TOOL_COUNT);
    expect(copy).not.toMatch(COPIED_TOOL_LIST);
  });

  it("keeps client plugin copy free of hard-coded tool counts and shortlists", () => {
    const nSitesHttp = NSITES_FLAGS.find((flag) => flag.id === "mcp-http");
    const nSitesPlugin = NSITES_FLAGS.find((flag) => flag.id === "plugin-gspc");
    const nSitesNpm = NSITES_FLAGS.find((flag) => flag.id === "npm-sdk");
    const playbookPlugin = PLAYBOOK_CLAIMS.find(
      (claim) => claim.id === "cursor-plugin",
    );
    const playbookFleet = PLAYBOOK_CLAIMS.find(
      (claim) => claim.id === "stale-300-mcp",
    );
    const fillPlugin = FILL_ROWS.find((row) => row.id === "plugin");
    const revenueHttp = OPEN_SDKS.find((sdk) => sdk.id === "mcp-http");
    const revenueNpm = OPEN_SDKS.find((sdk) => sdk.id === "npm");
    const revenueA2a = OPEN_SDKS.find((sdk) => sdk.id === "a2a-card");
    const a2aOpening = OPENINGS.find((opening) => opening.id === "a2a-tasks");
    const terminalMcp = TERMINAL_ROWS.find((row) => row.id === "moat-mcp");
    const terminalStaleCopy = TERMINAL_ROWS.find(
      (row) => row.id === "forgot-stale-copy",
    );
    const declarations = [
      PLUGIN_HARVEST.plugin_reads,
      nSitesHttp?.plant,
      nSitesHttp?.note,
      nSitesPlugin?.note,
      nSitesNpm?.note,
      playbookPlugin?.live,
      playbookFleet?.live,
      fillPlugin?.fills,
      revenueHttp?.eats,
      revenueNpm?.eats,
      revenueA2a?.eats,
      a2aOpening?.feed,
      terminalMcp?.does,
      terminalStaleCopy?.does,
    ];
    expect(declarations).not.toContain(undefined);
    const copy = declarations.join("\n");

    expect(copy).toMatch(/tools\/list/i);
    expect(copy).not.toMatch(COPIED_TOOL_COUNT);
    expect(copy).not.toMatch(COPIED_TOOL_LIST);
  });
});
