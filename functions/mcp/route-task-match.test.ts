/**
 * The free MCP door, end to end in-process: tools/call route with only a task picks the tool whose
 * purpose the request names (7 Oct 2026 retest: it answered board_totals to "which tool verifies a
 * signed card"). The census read is served from the committed index; no board read is needed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { CENSUS_PATH } from "../_lib/route/census";

const CENSUS = JSON.parse(readFileSync(join(__dirname, "..", "..", "public", "interop", "effect-binding-census-index.json"), "utf8"));
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };

async function routeCall(task: string) {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp/free", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "route", arguments: { task } } }),
    }),
    env: {},
    params: {},
  } as never);
  const text = await res.text();
  return (res.headers.get("content-type") ?? "").includes("text/event-stream")
    ? JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""))
    : JSON.parse(text);
}

afterEach(() => vi.unstubAllGlobals());

describe("/mcp/free tools/call route: the request picks the tool", () => {
  for (const [task, want] of [
    ["which tool verifies a signed card", "mcp:verify_card"],
    ["how did safety measure", "mcp:get_axis"],
    ["is example.com/mcp safe", "mcp:server_evidence"],
    ["I got a card from a vendor, is it real?", "mcp:verify_card"],
    ["which AI is safest", "mcp:board_totals"],
    ["Is this AI model safe to use?", "mcp:board_totals"],
    ["what scores did Claude get", "mcp:board_totals"],
  ] as const) {
    it(`"${task}" -> ${want}`, async () => {
      vi.stubGlobal("fetch", vi.fn(async (u: string) => {
        const body = String(u) === `https://councilof.ai${CENSUS_PATH}` ? CENSUS : null;
        return body ? new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }) : new Response("{}", { status: 404 });
      }));
      const d = await routeCall(task);
      const sc = d.result.structuredContent;
      expect(d.result.isError).toBe(false);
      expect(sc.state).toBe("ROUTED");
      expect(sc.chosen.id).toBe(want);
      expect(sc.task_match.state).toBe("MATCHED");
      expect((d.result.content[0].text as string).split("\n")[0]).toContain(`ROUTED to ${want}: its purpose matches the request`);
    });
  }

  it("a request no tool answers is UNTESTED, not board_totals", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(CENSUS), { status: 200, headers: { "content-type": "application/json" } })));
    const d = await routeCall("what is the weather in Paris tomorrow");
    expect(d.result.structuredContent.state).toBe("UNTESTED");
    expect(d.result.structuredContent.chosen).toBeNull();
    expect(d.result.isError).toBe(false);
  });
});
