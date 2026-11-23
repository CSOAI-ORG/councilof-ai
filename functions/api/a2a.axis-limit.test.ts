/**
 * A board row's stated limit on POST /api/a2a (2026-11-20).
 *
 * GET /api/gspc serves what an axis's score does not show as axes[<axis>].limit, a string on the
 * row itself; a row that states no limit has no key at all (C-2026-1120-02, #4550). Two A2A paths
 * read rows. The per-tool skills (get_axis, axis_*) run the dispatch POST /mcp runs, which copied a
 * fixed field list without the limit. The gspc-board skill (deriveBoard) copied its own fixed set
 * of fields per row, and the limit was not one of them. These cases hold both paths to the row: a
 * stated limit is copied verbatim, and a row with none gets no limit key and the same fields.
 * Synthetic fixtures only: no live board.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { onRequestPost } from "./a2a";
import { onRequest as mcpOnRequest } from "../mcp/[[path]]";

const ORIGIN = "https://councilof.ai";
const NOW = "2026-11-20T12:00:00.000Z";
// Fixture text, not any board row's wording.
const LIMIT = "Fixture limit: this score shows agreement with the fixture bank's labels only, not the skill its task names.";

type Row = Record<string, unknown>;
const BOARD = {
  measured_on: { date: "2026-08-12" },
  totals: { lid: "2 axes measured · fixture lid · not a certificate.", public_count: "2 axes · 2 measured", axes: 2, measured_axes: 2 },
  axes: [
    {
      axis: "governance", family: "gspc", kind: "model-comparison", status: "MEASURED", n: 237, separation: "UNTESTED",
      public_leader_state: "EXCLUDED_OWN_MODEL", note: "governance: fixture note.", limit: LIMIT,
    },
    {
      axis: "safety", family: "gspc", kind: "model-comparison", status: "MEASURED", n: 36, separation: "SEPARATED",
      leader: "fixture-model", note: "safety: fixture note.",
    },
  ] as Row[],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(NOW) });
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path === "/api/gspc" ? Response.json(BOARD) : new Response("<!doctype html>", { status: 404 });
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const has = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const a2a = async (data: unknown): Promise<any> => {
  const res = await onRequestPost({
    request: new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "SendMessage",
        params: { message: { messageId: "m-limit", role: "ROLE_USER", parts: [{ data, mediaType: "application/json" }] } },
      }),
    }),
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  expect(json.error).toBeUndefined();
  return json.result.message.parts[1].data;
};

/** POST /mcp tools/call, decoded from SSE or JSON, so the two doors can be compared. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mcpCall = async (name: string, args: Record<string, unknown>): Promise<any> => {
  const res = await mcpOnRequest({
    request: new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } }),
    }),
    env: {},
    params: {},
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text).result;
  const line = text.split("\n").find((l) => l.startsWith("data:"));
  return JSON.parse((line ?? "data: {}").slice(5)).result;
};

describe("a row's stated limit on POST /api/a2a", () => {
  it("the per-tool skills get_axis and axis_governance copy the row's limit, as POST /mcp answers; axis_safety has no limit key", async () => {
    for (const [skill, input] of [["get_axis", { axis: "governance" }], ["axis_governance", {}]] as const) {
      const data = await a2a({ skill, input });
      expect(data).toMatchObject({ kind: "TOOL_RESULT", skill, metered: false });
      expect(data.result.structuredContent.limit, skill).toBe(LIMIT);
      expect(data.result.structuredContent).toStrictEqual((await mcpCall(skill, input)).structuredContent);
    }
    const safety = await a2a({ skill: "axis_safety", input: {} });
    expect(has(safety.result.structuredContent, "limit")).toBe(false);
    expect(safety.result.structuredContent).toStrictEqual((await mcpCall("axis_safety", {})).structuredContent);
  });

  it("gspc-board keeps the row's limit on the axis that states one; a row with none has no limit key and the same derived fields", async () => {
    const data = await a2a({ skill: "gspc-board", input: {} });
    expect(data.state).toBe("DERIVED");
    const [gov, safety] = data.axes;
    expect(gov.axis).toBe("governance");
    expect(gov.limit).toBe(LIMIT);
    expect(safety).toStrictEqual({
      axis: "safety", family: "gspc", kind: "model-comparison", status: "MEASURED", n: 36,
      separation: "SEPARATED", leader: "fixture-model", public_leader_state: null,
    });
    // The limit is the only key a stated limit adds, after the derived fields, in their order.
    expect(Object.keys(gov)).toEqual([...Object.keys(safety), "limit"]);
  });
});
