/**
 * The G8 limits on POST /api/a2a, read from this commit's real board (2026-11-22).
 *
 * Owner ruling G8, 2026-11-21T02:12Z: the subject-axis hold covers ten axes (C-2026-1120-01) and the
 * claim-maintenance row rests on neither re-read (C-2026-1120-03). Each row states that as
 * axes[<axis>].limit on GET /api/gspc. The gspc-board skill (deriveBoard) copies a stated limit
 * verbatim and the per-tool skills run the POST /mcp dispatch (#4558, a2a.axis-limit.test.ts, on
 * synthetic rows). These cases serve the real /api/gspc handler behind fetch, so both A2A paths are
 * held to the rows' own words.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./a2a";
import { onRequestGet as gspcGet } from "./gspc";

vi.setConfig({ testTimeout: 60_000 });
const ORIGIN = "https://councilof.ai";
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
  board = (await (await realGspc(`${ORIGIN}/api/gspc`)).json()) as { axes: Row[] };
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
        params: { message: { messageId: "m-g8", role: "ROLE_USER", parts: [{ data, mediaType: "application/json" }] } },
      }),
    }),
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  expect(json.error).toBeUndefined();
  return json.result.message.parts[1].data;
};

describe("G8 limits on POST /api/a2a, from this commit's board", () => {
  it("gspc-board carries each held row's limit verbatim, citing its correction, and no limit key on a row that states none", async () => {
    const data = await a2a({ skill: "gspc-board", input: {} });
    expect(data.state).toBe("DERIVED");
    const derived = data.axes as Row[];
    expect(derived.map((a) => a.axis)).toEqual(board.axes.map((a) => a.axis));
    for (const [axis, id] of Object.entries(HELD)) {
      const row = board.axes.find((a) => a.axis === axis);
      const got = derived.find((a) => a.axis === axis);
      expect(typeof row?.limit, axis).toBe("string");
      expect(got?.limit, axis).toBe(row?.limit);
      expect(String(got?.limit), axis).toContain(`(${id})`);
      expect(got?.status, axis).toBe(row?.status);
      expect(got?.n, axis).toBe(row?.n);
    }
    const stating = derived.filter((a) => Object.prototype.hasOwnProperty.call(a, "limit")).map((a) => a.axis);
    expect(stating).toEqual(board.axes.filter((a) => typeof a.limit === "string").map((a) => a.axis));
  });

  it("the per-tool skills get_axis and axis_<id> answer each held row's limit verbatim", async () => {
    for (const [axis, id] of Object.entries(HELD)) {
      const row = board.axes.find((a) => a.axis === axis);
      for (const [skill, input] of [["get_axis", { axis }], [`axis_${axis}`, {}]] as const) {
        const data = await a2a({ skill, input });
        expect(data, `${skill} ${axis}`).toMatchObject({ kind: "TOOL_RESULT", skill, metered: false });
        const answer = data.result.structuredContent;
        expect(answer.axis, `${skill} ${axis}`).toBe(axis);
        expect(answer.limit, `${skill} ${axis}`).toBe(row?.limit);
        expect(String(answer.limit), `${skill} ${axis}`).toContain(`(${id})`);
      }
    }
  });
});
