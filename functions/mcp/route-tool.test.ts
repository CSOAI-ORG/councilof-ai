/**
 * The free MCP tool `route` on both doors, in-process: listed by tools/list, answered by tools/call with
 * a decide-only record whose event_id recomputes. The board read is served from the recorded fixture.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { computeEventId } from "../_lib/route/evidence";
import { BANNED_ROUTE_WORDS } from "../_lib/route/route";

const BOARD = JSON.parse(readFileSync(join(__dirname, "..", "..", "fixtures", "route-golden", "board-2026-09-30.json"), "utf8"));
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };

async function rpc(path: string, method: string, params: unknown) {
  const res = await onRequest({
    request: new Request(`https://councilof.ai${path}`, { method: "POST", headers: HEADERS, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }),
    env: {},
    params: {},
  } as never);
  const text = await res.text();
  const data = (res.headers.get("content-type") ?? "").includes("text/event-stream")
    ? JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""))
    : JSON.parse(text);
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe("MCP tool route (free, decide-only)", () => {
  for (const door of ["/mcp", "/mcp/free"]) {
    it(`${door}: tools/list names route with read-only annotations`, async () => {
      const d = await rpc(door, "tools/list", {});
      const t = d.result.tools.find((x: { name: string }) => x.name === "route");
      expect(t).toBeDefined();
      expect(t.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    });

    it(`${door}: tools/call route returns a decide-only record whose event_id recomputes`, async () => {
      vi.stubGlobal("fetch", vi.fn(async (u: string) => {
        expect(String(u)).toBe("https://councilof.ai/api/gspc");
        return new Response(JSON.stringify(BOARD), { status: 200, headers: { "content-type": "application/json" } });
      }));
      const d = await rpc(door, "tools/call", {
        name: "route",
        arguments: {
          task: "Summarise a public paragraph.",
          objective: { quality_axis: "governance" },
          candidates: [
            { id: "local:mistral-7b", kind: "local_gpu", model: "mistral:7b", endpoint: "local:ollama/mistral:7b", read_only: true },
            { id: "byok:deepseek-r1-8b", kind: "model", model: "deepseek-r1:8b", endpoint: "https://openrouter.ai/api/v1", read_only: true, cost_declared: 0.2 },
          ],
        },
      });
      const sc = d.result.structuredContent;
      expect(d.result.isError).toBe(false);
      expect(sc).toMatchObject({ state: "ROUTED", mode: "decide_only", signed: false, separation: "TIE" });
      expect(sc.chosen.choice_basis).toMatch(/^tie_break:/);
      expect(sc.record.profile).toBe("csoai.route-evidence/0.1");
      expect(sc.record.event_id).toBe(await computeEventId(sc.record));
      const text = d.result.content[0].text as string;
      expect(text.split("\n")[0]).not.toMatch(BANNED_ROUTE_WORDS);
      expect(text.split("\n")[0].toLowerCase()).not.toContain("leader");
    });
  }

  it("mode execute is NOT_ENABLED and fetches nothing", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const d = await rpc("/mcp/free", "tools/call", { name: "route", arguments: { task: "x", mode: "execute" } });
    expect(d.result.structuredContent).toMatchObject({ state: "NOT_ENABLED", http_status: 501 });
    expect(f).not.toHaveBeenCalled();
  });
});
