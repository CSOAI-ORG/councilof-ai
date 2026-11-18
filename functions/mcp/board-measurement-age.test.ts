/**
 * measurement_age on the board readers (board_totals, get_axis and every axis_* tool): how old each
 * axis's measurement is, counted from the board's own measurement_time evidence
 * (functions/api/_gspc_measurement_time.ts). Fetch, build and deploy times never refresh it, and the
 * board publishes no maximum age, so no row is called CURRENT or STALE here. "34 measured" says a
 * run stands behind every slot; it does not say when, and this is where a reader finds out.
 * The stdio twin (mcp/gspc-server/index.mjs) is held to the same shape by stdio-board-parity.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { boardMeasurementAge, measurementAge, utcDayOf } from "./_board";

vi.setConfig({ testTimeout: 60_000 });
const HEADERS = { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" };
const NOW = "2026-11-17T12:00:00.000Z";

const BOARD = {
  measured_on: { date: "behavioural axes 2026-08-12" },
  totals: { axes: 5, measured_axes: 4, unmeasured_axes: 1, public_count: "5 axes · 4 measured" },
  measurement_time_contract: { global_freshness_policy: "UNSET" },
  axes: [
    { axis: "governance", family: "gspc", status: "MEASURED", n: 237, measurement_time: { state: "DAY", precision: "day", observed_on: "2026-08-12" } },
    { axis: "swarm", family: "gspc", status: "MEASURED", n: 37, measurement_time: { state: "NOT_AFTER", precision: "instant-upper-bound", not_after: "2026-08-19T09:24:39.162060+00:00" } },
    { axis: "watchdog-ingest", family: "subject", status: "MEASURED", n: 106, measurement_time: { state: "EXACT", precision: "instant", observed_at: "2026-11-02T04:17:24.499Z" } },
    { axis: "care", family: "gspc", status: "MEASURED", n: 199, measurement_time: { state: "UNCHECKABLE", precision: "unknown" } },
    { axis: "affect", family: "gspc", status: "UNMEASURED" },
  ],
};

describe("measurementAge reads the board's evidence, never the time of the read", () => {
  it("counts whole UTC days from DAY, EXACT and NOT_AFTER evidence", () => {
    expect(measurementAge({ state: "DAY", observed_on: "2026-08-12" }, "2026-11-17")).toEqual({ evidence_date: "2026-08-12", precision: "DAY", age_days: 97, age_is_minimum: false });
    expect(measurementAge({ state: "EXACT", observed_at: "2026-11-02T04:17:24.499Z" }, "2026-11-17")).toEqual({ evidence_date: "2026-11-02", precision: "EXACT", age_days: 15, age_is_minimum: false });
    // An upper bound on when the run happened: the run is at least this old, so the age is a minimum.
    expect(measurementAge({ state: "NOT_AFTER", not_after: "2026-08-19T09:24:39.162060+00:00" }, "2026-11-17")).toEqual({ evidence_date: "2026-08-19", precision: "NOT_AFTER", age_days: 90, age_is_minimum: true });
  });

  it("gives no date to evidence that carries none", () => {
    expect(measurementAge({ state: "UNCHECKABLE", precision: "unknown" }, "2026-11-17")).toBeNull();
    expect(measurementAge(null, "2026-11-17")).toBeNull();
    expect(measurementAge("not a date", "2026-11-17")).toBeNull();
  });

  it("reads a plain string as published and puts an offset instant on its UTC day", () => {
    expect(measurementAge("2026-01-01T02:00:00Z", "2026-01-02")).toMatchObject({ evidence_date: "2026-01-01", precision: "AS_PUBLISHED", age_days: 1 });
    expect(utcDayOf("2026-08-19T23:30:00-02:00")).toBe("2026-08-20");
  });
});

describe("boardMeasurementAge", () => {
  it("bands measured axes only, counts an undated one, and gives no CURRENT or STALE verdict", () => {
    const summary = boardMeasurementAge(BOARD, NOW, "summary");
    expect(summary).toEqual({
      oldest: "2026-08-12",
      newest: "2026-11-02",
      axes_by_age_days: { "0-30": 1, "31-90": 1, "91+": 1 },
      no_evidence_date: 1,
      basis: expect.any(String),
    });
    expect(JSON.stringify(summary)).not.toMatch(/CURRENT|STALE/);
  });

  it("full adds the read day, the board's own age policy and one line per measured axis", () => {
    const full = boardMeasurementAge(BOARD, NOW, "full") as Record<string, unknown>;
    expect(full.age_as_of_day).toBe("2026-11-17");
    expect(full.max_age_policy).toBe("UNSET");
    expect((full.per_axis as Array<{ axis: string }>).map((r) => r.axis)).toEqual(["governance", "swarm", "watchdog-ingest", "care"]);
  });
});

type Msg = { result?: { structuredContent?: Record<string, unknown>; isError?: boolean; content?: Array<{ text: string }> }; error?: { message: string } };
async function rpc(method: string, params: Record<string, unknown>): Promise<Msg> {
  const res = await onRequest({
    request: new Request("https://councilof.ai/mcp", { method: "POST", headers: HEADERS, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }),
    env: {},
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Msg;
  const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")).filter(Boolean);
  return JSON.parse(frames[frames.length - 1]) as Msg;
}
const firstLine = (m: Msg) => (m.result?.content?.[0]?.text ?? "").split("\n")[0];

describe("through the real /mcp door", () => {
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

  it("board_totals says how old the measurements are, in the payload and the summary line", async () => {
    const m = await rpc("tools/call", { name: "board_totals", arguments: {} });
    expect(m.result?.isError).toBe(false);
    expect(m.result?.structuredContent?.measurement_age).toMatchObject({ oldest: "2026-08-12", newest: "2026-11-02", no_evidence_date: 1 });
    expect(firstLine(m)).toContain("Measurement dates run from 2026-08-12 to 2026-11-02; 1 measured axis is over 90 days old.");
  });

  it("an axis tool's summary line is the axis answer with its age, not the tool's own name", async () => {
    expect(firstLine(await rpc("tools/call", { name: "axis_governance", arguments: {} }))).toBe(
      'MEASURED — axis "governance" (a real run stands behind this row; measured 2026-08-12, 97 days ago).',
    );
    expect(firstLine(await rpc("tools/call", { name: "get_axis", arguments: { axis: "swarm" } }))).toContain(
      "measured no later than 2026-08-19, at least 90 days ago",
    );
  });

  it("an unmeasured slot and an undated row get no age, never an invented one", async () => {
    const affect = await rpc("tools/call", { name: "get_axis", arguments: { axis: "affect" } });
    expect(affect.result?.structuredContent?.measurement_age).toBeNull();
    const care = await rpc("tools/call", { name: "get_axis", arguments: { axis: "care" } });
    expect(care.result?.structuredContent?.measurement_age).toBeNull();
    expect(firstLine(care)).toBe('MEASURED — axis "care" (a real run stands behind this row).');
  });
});
