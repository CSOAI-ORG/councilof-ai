import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { onRequest, FREE_DEFINITIONS } from "./[[path]]";
import LOCK from "./tool-fleet.lock.json";
import { WORKING_GROUP_CATALOG_URI, WORKING_GROUP_REVIEW_PROMPT } from "./_working_groups";

const origin = "https://councilof.ai";
const source = readFileSync(new URL("../../public/working-groups/catalog.json", import.meta.url), "utf8");
const catalog = JSON.parse(source);
const network = vi.fn();
beforeEach(() => {
  network.mockReset();
  network.mockRejectedValue(new Error("Working-group participation must not make a subrequest"));
  vi.stubGlobal("fetch", network);
});
afterEach(() => vi.unstubAllGlobals());
const dispatch = (request: Request) => onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);
async function connect(door: string, mode: "auto" | "legacy") {
  const client = new Client({ name: "council-participation-test", version: "1.0.0" }, {
    capabilities: {}, versionNegotiation: { mode },
    supportedProtocolVersions: mode === "auto" ? ["2026-07-28", "2025-03-26"] : ["2025-03-26"],
  });
  await client.connect(new StreamableHTTPClientTransport(new URL(origin + door), {
    fetch: (input, init) => dispatch(new Request(input, init)),
  }));
  return client;
}
describe("public council participation through the actual HTTP MCP handler", () => {
  it.each([
    ["/mcp/free", "auto"], ["/mcp/free", "legacy"],
    ["/mcp", "auto"], ["/mcp", "legacy"],
  ] as const)("reads the exact register and all unsent drafts at %s with %s", async (door, mode) => {
    const client = await connect(door, mode);
    try {
      expect(client.getServerCapabilities()).toMatchObject({ resources: {}, prompts: {} });
      const resources = await client.listResources();
      expect(resources.resources.map(r => r.uri)).toEqual([WORKING_GROUP_CATALOG_URI]);
      const result = await client.readResource({ uri: WORKING_GROUP_CATALOG_URI });
      expect(result.contents).toEqual([{ uri: WORKING_GROUP_CATALOG_URI, mimeType: "application/json", text: source }]);
      const prompts = await client.listPrompts();
      expect(prompts.prompts.map(p => p.name)).toEqual([WORKING_GROUP_REVIEW_PROMPT]);
      for (const doc of catalog.documents) {
        const draft = await client.getPrompt({ name: WORKING_GROUP_REVIEW_PROMPT, arguments: { documentId: doc.id } });
        const text = draft.messages[0].content;
        expect(text.type).toBe("text");
        if (text.type !== "text") throw new Error("Expected a text draft");
        expect(text.text).toContain("UNSENT DRAFT");
        expect(text.text).toContain(doc.id + " · version " + doc.version);
        expect(text.text).toContain(doc.source.commit);
        expect(text.text).toContain("conflicts");
        expect(text.text).toContain("A named human must accept");
      }
      const tools = await client.listTools();
      expect(tools.tools.map(t => t.name).sort()).toEqual((door === "/mcp/free" ? FREE_DEFINITIONS.map(t => t.name) : [...LOCK.free, ...LOCK.paid]).sort());
      expect(network).not.toHaveBeenCalled();
    } finally { await client.close(); }
  });
  it("rejects unknown IDs, extra/private fields, arbitrary URIs and authority methods", async () => {
    const client = await connect("/mcp/free", "auto");
    try {
      for (const args of [{}, { documentId: "unknown" }, { documentId: "x".repeat(9000) }, { documentId: "COAI-WG-002", observation: "Must remain local" }]) {
        await expect(client.getPrompt({ name: WORKING_GROUP_REVIEW_PROMPT, arguments: args })).rejects.toThrow();
      }
      for (const uri of ["file:///etc/passwd", "https://attacker.invalid/private", WORKING_GROUP_CATALOG_URI + "?secret=1"]) {
        await expect(client.readResource({ uri })).rejects.toThrow();
      }
      await expect(client.getPrompt({ name: "appoint_reviewer" })).rejects.toThrow();
      await expect(client.callTool({ name: "approve_working_group", arguments: {} })).rejects.toThrow();
      expect(network).not.toHaveBeenCalled();
    } finally { await client.close(); }
  });
  it("keeps origin/host guards and advertises the browser alternative on both doors", async () => {
    for (const door of ["/mcp", "/mcp/free"]) {
      const page = await dispatch(new Request(origin + door));
      const data = await page.json();
      expect(data.working_groups).toMatchObject({ resource: WORKING_GROUP_CATALOG_URI, prompt: WORKING_GROUP_REVIEW_PROMPT, as_of: catalog.asOf });
      expect(data.working_groups.fallback).toContain("browser");
      for (const headers of [{ origin: "https://attacker.invalid" }, { host: "attacker.invalid" }]) {
        const denied = await dispatch(new Request(origin + door, { headers }));
        expect(denied.status).toBe(403);
      }
    }
    expect(network).not.toHaveBeenCalled();
  });
});
