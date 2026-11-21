/**
 * A board row's stated limit on the MCP board readers: get_axis and every axis_* tool (2026-11-20).
 *
 * GET /api/gspc serves what an axis's score does not show as axes[<axis>].limit, a string on the
 * row itself; a row that states no limit has no key at all (C-2026-1120-02, #4550). getAxisTool
 * copied a fixed list of row fields without it, so POST /mcp dropped the limit, and so did every
 * A2A per-tool skill, which runs the same dispatch (a2a.axis-limit.test.ts). These cases hold the
 * door to the row: a stated limit is copied verbatim, next to the row's note, and a row with none
 * gets no limit key and an otherwise identical answer. The stdio twin is held to the same answer in
 * stdio-board-parity.test.ts. Synthetic fixtures only: no live board.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };
const NOW = "2026-11-20T12:00:00.000Z";
// Fixture text, not any board row's wording.
const LIMIT = "Fixture limit: this score shows agreement with the fixture bank's labels only, not the skill its task names.";

type Row = Record<string, unknown>;
const row = (axis: string, extra: Row = {}): Row => ({
  axis, family: "gspc", kind: "model-comparison", status: "MEASURED", n: 237, accuracy: 0.7, interval: [0.64, 0.76],
  separation: "TIE", leader: "fixture-model", dataset: "fixture-bank", note: `${axis}: fixture note.`,
  measurement_time: { state: "DAY", precision: "day", observed_on: "2026-08-12" }, ...extra,
});
/** governance states a limit (or not, with limit=false); safety never does. */
const boardWith = (limit: boolean) => ({
  measured_on: { date: "2026-08-12" },
  totals: { axes: 2, measured_axes: 2, unmeasured_axes: 0, public_count: "2 axes · 2 measured" },
  axes: [row("governance", limit ? { limit: LIMIT } : {}), row("safety")],
});

type Msg = { result?: { structuredContent?: Record<string, unknown>; isError?: boolean; content?: Array<{ text: string }> }; error?: { message: string } };
async function call(name: string, args: Record<string, unknown>): Promise<Msg> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    }),
    env: {},
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Msg;
  const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")).filter(Boolean);
  return JSON.parse(frames[frames.length - 1]) as Msg;
}
const answer = (m: Msg): Record<string, unknown> => {
  expect(m.error).toBeUndefined();
  expect(m.result?.isError).toBe(false);
  return m.result?.structuredContent ?? {};
};
const has = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key);
const without = (o: Record<string, unknown>, key: string) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));

let board: ReturnType<typeof boardWith>;
beforeEach(() => {
  board = boardWith(true);
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(NOW) });
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path === "/api/gspc" ? Response.json(board) : new Response("<!doctype html>", { status: 404 });
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("a row's stated limit through the real /mcp door", () => {
  it("get_axis copies the row's limit verbatim, after its note; a row without one gets no limit key and an otherwise identical answer", async () => {
    const m = await call("get_axis", { axis: "governance" });
    const gov = answer(m);
    expect(gov.limit).toBe(LIMIT);
    // A client that reads only the text content sees it too.
    expect(m.result?.content?.[0]?.text).toContain(`"limit": ${JSON.stringify(LIMIT)}`);
    const keys = Object.keys(gov);
    expect(keys[keys.indexOf("note") + 1]).toBe("limit");

    const safety = answer(await call("get_axis", { axis: "safety" }));
    expect(has(safety, "limit")).toBe(false);

    // The limit is the only difference a stated limit makes: same fields, same order, same values.
    board = boardWith(false);
    const unstated = answer(await call("get_axis", { axis: "governance" }));
    expect(has(unstated, "limit")).toBe(false);
    expect(without(gov, "limit")).toStrictEqual(unstated);
    expect(Object.keys(without(gov, "limit"))).toEqual(Object.keys(unstated));
  });

  it("an axis_* tool copies its row's limit verbatim; one whose row states none has no limit key", async () => {
    const gov = answer(await call("axis_governance", {}));
    expect(gov.limit).toBe(LIMIT);
    expect(gov).toStrictEqual(answer(await call("get_axis", { axis: "governance" })));

    const safety = answer(await call("axis_safety", {}));
    expect(has(safety, "limit")).toBe(false);
    expect(safety).toStrictEqual(answer(await call("get_axis", { axis: "safety" })));
  });
});
