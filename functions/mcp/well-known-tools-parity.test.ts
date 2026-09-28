/**
 * The MCP discovery documents state the SAME tool fleet the door's tools/list serves (2026-09-28).
 *
 * /.well-known/mcp.json and /.well-known/mcp/server-card.json said 13 tools while tools/list said 16
 * until 26 Sep. The contract-parity instrument (scripts/census/contract-parity.py) compares each
 * declared tool list and count with a live tools/list and marks a service INCONSISTENT on any
 * difference — including this one. scripts/harness-x/render.mjs now renders both documents from
 * functions/mcp/gspc-tools.json + paid-tools.json (what [[path]].ts serves); this test calls the
 * handler itself, on /mcp and on /mcp/free, and fails when a name, a count or a digest differs.
 * The digest is the instrument's: sha256 of the sorted names joined by "\n".
 */
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import MCP_JSON from "../../public/.well-known/mcp.json";
import SERVER_CARD from "../../public/.well-known/mcp/server-card.json";

const ORIGIN = "https://councilof.ai";
const namesSha = (names: string[]) => createHash("sha256").update([...names].sort().join("\n")).digest("hex");

async function toolsList(path: "/mcp" | "/mcp/free"): Promise<string[]> {
  const response = await onRequest({
    request: new Request(`${ORIGIN}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }),
    env: {},
    params: {},
    waitUntil: () => {},
  } as never);
  const text = await response.text();
  const data = text.includes("data:")
    ? text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).find((l) => l.includes('"tools"'))
    : text;
  const msg = JSON.parse(data ?? "{}") as { result?: { tools?: { name: string }[] } };
  return (msg.result?.tools ?? []).map((t) => t.name);
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network is mocked"); })));
afterEach(() => vi.unstubAllGlobals());

describe("/.well-known MCP descriptors state what tools/list serves", () => {
  it("/mcp: mcp.json measured.* and planted.tools — names, count and digest", async () => {
    const live = await toolsList("/mcp");
    expect(live.length).toBeGreaterThan(0);
    const m = MCP_JSON as any;
    expect(m.measured.tools).toEqual(live);
    expect(m.planted.tools).toEqual(live);
    expect(m.measured.total_tools).toBe(live.length);
    expect(m.measured.tool_names_sha256).toBe(namesSha(live));
  });

  it("/mcp: server-card capabilities.* — names, counts and digest", async () => {
    const live = await toolsList("/mcp");
    const free = await toolsList("/mcp/free");
    const c = (SERVER_CARD as any).capabilities;
    expect(c.tools).toEqual(live);
    expect(c.total_tools).toBe(live.length);
    expect(c.free_tools).toBe(free.length);
    expect(c.metered_tools).toBe(live.length - free.length);
    expect(c.tool_names_sha256).toBe(namesSha(live));
  });

  it("/mcp/free: the free list, its count and digest in both documents", async () => {
    const free = await toolsList("/mcp/free");
    expect(free.length).toBeGreaterThan(0);
    const m = MCP_JSON as any;
    const c = (SERVER_CARD as any).capabilities;
    expect(m.servers[0].free_tools).toEqual(free);
    expect(m.servers[0].free_tool_names_sha256).toBe(namesSha(free));
    expect(m.measured.free_tools).toBe(free.length);
    expect(c.free_door_tool_names).toEqual(free);
    expect(c.free_door_tool_names_sha256).toBe(namesSha(free));
  });

  it("no prose line naming the door states a tool count other than the served one", async () => {
    const live = (await toolsList("/mcp")).length;
    const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
      "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
    for (const doc of [MCP_JSON, SERVER_CARD]) {
      for (const line of JSON.stringify(doc, null, 2).split("\n").filter((l) => l.includes("councilof.ai/mcp"))) {
        for (const m of line.matchAll(/\b(\d+|[a-z]+) (?:tools|MCP tools)\b/gi)) {
          const n = /^\d+$/.test(m[1]) ? Number(m[1]) : WORDS.indexOf(m[1].toLowerCase());
          if (n >= 0) expect(n, line).toBe(live);
        }
      }
    }
  });
});
