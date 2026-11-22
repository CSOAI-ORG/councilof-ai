/**
 * The G8 limits at the MCP door, read from this commit's real board (2026-11-22).
 *
 * Owner ruling G8, 2026-11-21T02:12Z: the subject-axis hold covers ten axes (C-2026-1120-01) and the
 * claim-maintenance row rests on neither re-read (C-2026-1120-03). Each row states that as
 * axes[<axis>].limit on GET /api/gspc, and getAxisTool copies a stated limit verbatim (#4558,
 * axis-limit.test.ts, on synthetic rows). On 2026-11-20 the gateway answered axis_watchdog-ingest with
 * MEASURED, "a real run stands behind this row", and nothing else. These cases serve the real
 * /api/gspc handler behind fetch, so get_axis and every held axis_* tool are held to the rows' own
 * words, and a row that states no limit still gets no limit key.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { onRequestGet as gspcGet } from "../api/gspc";

vi.setConfig({ testTimeout: 60_000 });
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };
const NOW = "2026-11-22T12:00:00.000Z";

const HELD: Record<string, string> = {
  "lab-practice": "C-2026-1120-01",
  "company-practice": "C-2026-1120-01",
  "measurer-integrity": "C-2026-1120-01",
  "harness-fidelity": "C-2026-1120-01",
  "interop-conformance": "C-2026-1120-01",
  "humanoid-deployment": "C-2026-1120-01",
  "regulator-transparency": "C-2026-1120-01",
  "interpretability-reproducibility": "C-2026-1120-01",
  "claim-maintenance": "C-2026-1120-03",
  "serving-fidelity": "C-2026-1120-01",
  "watchdog-ingest": "C-2026-1120-01",
};

type Row = { axis: string; status?: string; n?: number; limit?: string };
let board: { axes: Row[] };

/** This commit's GET /api/gspc, through its own handler (no network, empty edge cache). */
async function realGspc(url: string): Promise<Response> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  return gspcGet({
    request: new Request(url),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof gspcGet>[0]);
}

beforeEach(async () => {
  board = (await (await realGspc("https://councilof.ai/api/gspc")).json()) as { axes: Row[] };
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(NOW) });
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(url).pathname === "/api/gspc" ? realGspc(url) : new Response("<!doctype html>", { status: 404 });
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

type Msg = { result?: { structuredContent?: Record<string, unknown>; isError?: boolean }; error?: { message: string } };
async function call(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    }),
    env: {},
  } as never);
  const text = await res.text();
  const msg = ((res.headers.get("content-type") ?? "").includes("text/event-stream")
    ? JSON.parse(
        text
          .replace(/\r\n/g, "\n")
          .split(/\n\n/)
          .map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n"))
          .filter(Boolean)
          .pop() ?? "{}",
      )
    : JSON.parse(text)) as Msg;
  expect(msg.error, name).toBeUndefined();
  expect(msg.result?.isError, name).toBe(false);
  return msg.result?.structuredContent ?? {};
}

describe("G8 limits on POST /mcp, from this commit's board", () => {
  it("get_axis and axis_<id> answer each held row's limit verbatim, citing its correction, beside the row's own status and n", async () => {
    for (const [axis, id] of Object.entries(HELD)) {
      const row = board.axes.find((a) => a.axis === axis);
      expect(typeof row?.limit, axis).toBe("string");
      for (const [tool, args] of [["get_axis", { axis }], [`axis_${axis}`, {}]] as const) {
        const answer = await call(tool, args);
        expect(answer.state, `${tool} ${axis}`).toBe("LIVE");
        expect(answer.axis, `${tool} ${axis}`).toBe(axis);
        expect(answer.limit, `${tool} ${axis}`).toBe(row?.limit);
        expect(String(answer.limit), `${tool} ${axis}`).toContain(`(${id})`);
        expect(answer.status, `${tool} ${axis}`).toBe(row?.status);
        expect(answer.n, `${tool} ${axis}`).toBe(row?.n);
      }
    }
  });

  it("a row with no stated limit still gets no limit key: axis_safety and get_axis effect-binding", async () => {
    for (const [tool, args] of [["axis_safety", {}], ["get_axis", { axis: "effect-binding" }]] as const) {
      const answer = await call(tool, args);
      expect(answer.state, tool).toBe("LIVE");
      expect(Object.prototype.hasOwnProperty.call(answer, "limit"), tool).toBe(false);
    }
  });
});
