import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { encodeAguiGspcSse, snapshotFromGspcPayload, toAguiStateDelta, fetchLiveGspcSnapshot } from "./aguiGspcStream";
import { onRequest } from "../../../functions/api/agui/[[path]]";

// Scoped contract checks from AG-UI event documentation and RFC 6902.
// Not an official SDK conformance suite, browser run, or model invocation.
const wire = {
  totals: { axes: 2, measured_axes: 1, unmeasured_axes: 1, public_count: "2 axes, 1 measured" },
  measured_on: { date: "2026-08-12" },
  axes: [
    { axis: "source", status: "MEASURED", n: 2, accuracy: null },
    { axis: "unknown", status: "UNMEASURED", n: null, accuracy: null },
  ],
};
type E = Record<string, any>;
function decode(text: string): E[] {
  return text.trim().split(/\r?\n\r?\n/).filter(Boolean).map((frame) => {
    const lines = frame.split(/\r?\n/);
    const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
    const data = JSON.parse(lines.filter((line) => line.startsWith("data: ")).map((line) => line.slice(6)).join("\n"));
    expect(data.type).toBe(event);
    return data;
  });
}
function assertComplete(events: E[]) {
  expect(events.map((e) => e.type)).toEqual([
    "RUN_STARTED", "STATE_DELTA", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED",
  ]);
  expect(events[0].threadId).toEqual(expect.any(String));
  expect(events[0].threadId.length).toBeGreaterThan(0);
  expect(events[0].runId.length).toBeGreaterThan(0);
  expect(events[5].threadId).toBe(events[0].threadId);
  expect(events[5].runId).toBe(events[0].runId);
  expect(events[2].messageId.length).toBeGreaterThan(0);
  expect(events[2].role).toBe("assistant");
  expect(events[3].messageId).toBe(events[2].messageId);
  expect(events[4].messageId).toBe(events[2].messageId);
  expect(events[3].delta.length).toBeGreaterThan(0);
}
function context(method = "GET", sub = "gspc-state") {
  return { request: new Request(`https://councilof.ai/api/agui/${sub}`, { method }), params: { path: sub.split("/") }, env: {} } as any;
}
function upstream(value: unknown = wire, status = 200) {
  return vi.stubGlobal("fetch", vi.fn(async () => Response.json(value, { status })));
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("existing AG-UI GSPC bridge interoperability", () => {
  it("brackets one data projection with matching run and message identities", () => {
    assertComplete(decode(encodeAguiGspcSse(snapshotFromGspcPayload(wire))));
  });
  it("uses different ephemeral identities for separate requests", () => {
    const snap = snapshotFromGspcPayload(wire);
    const a = decode(encodeAguiGspcSse(snap)); const b = decode(encodeAguiGspcSse(snap));
    expect(a[0].runId).not.toBe(b[0].runId);
    expect(a[0].threadId).not.toBe(b[0].threadId);
    expect(a.find((e) => e.type === "TEXT_MESSAGE_CONTENT")!.messageId).not.toBe(b.find((e) => e.type === "TEXT_MESSAGE_CONTENT")!.messageId);
  });
  it("initializes a new state object instead of replacing nonexistent members", () => {
    const delta = toAguiStateDelta(snapshotFromGspcPayload(wire)).delta;
    expect(delta[0]).toMatchObject({ op: "add", path: "/gspc" });
    expect(delta.find((op) => op.path === "/gspc/empty_visible")).toMatchObject({ op: "add" });
    const state: E = { unrelated: 42 };
    // The three emitted object-member operations only; not a generic JSON-Patch implementation.
    for (const op of delta) {
      const keys = op.path.slice(1).split("/"); let parent = state;
      for (const key of keys.slice(0, -1)) { expect(Object.hasOwn(parent, key)).toBe(true); parent = parent[key]; }
      const key = keys.at(-1)!;
      if (op.op === "replace") expect(Object.hasOwn(parent, key)).toBe(true);
      else expect(op.op).toBe("add");
      parent[key] = structuredClone(op.value);
    }
    expect(state.unrelated).toBe(42); expect(state.gspc.empty_visible).toEqual(["unknown"]);
  });
  it("retains source measurement time separately from the current HTTP read", () => {
    const snap = snapshotFromGspcPayload(wire) as E;
    expect(snap.source_measurement_date).toBe("2026-08-12");
    expect((snapshotFromGspcPayload({ axes: [] }) as E).source_measurement_date).toBeNull();
  });
  it("labels the operation as presentation without inventing a model or tool run", () => {
    const events = decode(encodeAguiGspcSse(snapshotFromGspcPayload(wire)));
    expect(events[0].metadata).toMatchObject({ operation: "public_evidence_projection", modelInvoked: false, toolInvoked: false });
    expect(events.some((e) => e.type.startsWith("TOOL_CALL"))).toBe(false);
    expect(events.find((e) => e.type === "STATE_DELTA")!.delta[0].value.measured[0].accuracy).toBeNull();
  });
  it("does not turn source newlines into injected SSE events", () => {
    const malicious = { ...wire, totals: { ...wire.totals, public_count: "value\n\nevent: TOOL_CALL_START\ndata: {}" } };
    const events = decode(encodeAguiGspcSse(snapshotFromGspcPayload(malicious)));
    assertComplete(events); expect(events).toHaveLength(6);
  });
  it("does not mutate the source record while adding transport metadata", () => {
    const original = structuredClone(wire); const snap = snapshotFromGspcPayload(wire);
    encodeAguiGspcSse(snap); expect(wire).toEqual(original);
  });
  it("serves the same complete event contract from the existing same-origin handler", async () => {
    upstream(); const response = await onRequest(context());
    expect(response.status).toBe(200); expect(response.headers.get("content-type")).toContain("text/event-stream");
    const events = decode(await response.text()); assertComplete(events);
    expect(events[1].delta[0].value).toEqual(snapshotFromGspcPayload(wire));
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("returns no response body for HEAD", async () => {
    upstream(); const response = await onRequest(context("HEAD"));
    expect(response.status).toBe(200); expect(await response.text()).toBe("");
  });
  it("keeps preflight local and advertises HEAD accurately", async () => {
    upstream(); const response = await onRequest(context("OPTIONS"));
    expect(response.status).toBe(204); expect(response.headers.get("access-control-allow-methods")).toContain("HEAD");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects a mutating method without fetching or delegating", async () => {
    upstream(); const response = await onRequest(context("POST"));
    expect(response.status).toBe(405); expect(fetch).not.toHaveBeenCalled();
  });
  it("does not manufacture a finished stream for an upstream error", async () => {
    upstream({ error: "unavailable" }, 503); const response = await onRequest(context());
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("RUN_FINISHED");
  });
  it("rejects a malformed upstream payload", async () => {
    upstream({ not_axes: [] }); const response = await onRequest(context()); expect(response.status).toBe(502);
  });
  it("does not silently enable an unconfigured agent or MEOK runtime", async () => {
    upstream(); const response = await onRequest(context("GET", "chat"));
    expect(response.status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it("detects the exact retained public two-event response as incomplete", () => {
    const raw = readFileSync(new URL("./__fixtures__/agui-gspc-20260929.sse", import.meta.url), "utf8");
    const events = decode(raw); expect(events).toHaveLength(2);
    expect(events[1].messageId).toBeUndefined(); expect(() => assertComplete(events)).toThrow();
  });
  it("detects a mismatched message ID rather than accepting a plausible stream", () => {
    const events = decode(encodeAguiGspcSse(snapshotFromGspcPayload(wire)));
    const content = events.find((e) => e.type === "TEXT_MESSAGE_CONTENT")!; content.messageId = "wrong-message";
    expect(() => assertComplete(events)).toThrow();
  });
});

// Source shape and response-boundary controls; not GSPC measurement validation.
describe("source-backed counts and malformed-payload boundaries", () => {
  it("does not infer missing source totals or public wording from returned rows", () => {
    const snap = snapshotFromGspcPayload({ axes: wire.axes });
    expect(snap.totals).toEqual({ axes: null, measured_axes: null, unmeasured_axes: null });
    expect(snap.public_count).toBe("Source did not supply a public count.");
    expect(decode(encodeAguiGspcSse(snap))[3].delta).not.toContain("0 empty");
  });
  it("keeps explicitly source-reported zero distinct from missing totals", () => {
    const snap = snapshotFromGspcPayload({ axes: [], totals: { axes: 0, measured_axes: 0, unmeasured_axes: 0, public_count: "0 reported axes" } });
    expect(snap.totals).toEqual({ axes: 0, measured_axes: 0, unmeasured_axes: 0 });
    expect(snap.public_count).toBe("0 reported axes");
  });
  it.each([null, [], {}, { axes: null }, { axes: {} }].map((value) => [value]))("rejects a malformed root instead of creating a successful empty board: %j", (value) => {
    expect(() => snapshotFromGspcPayload(value)).toThrow();
  });
  it.each([null, {}, { axis: 1, status: "MEASURED" }, { axis: "a", status: null }, { axis: " ", status: "MEASURED" }])("rejects a malformed row instead of silently dropping or relabelling it: %j", (row) => {
    expect(() => snapshotFromGspcPayload({ axes: [row] })).toThrow();
  });
  it("rejects duplicate axis identities rather than inflating displayed coverage", () => {
    expect(() => snapshotFromGspcPayload({ axes: [wire.axes[0], wire.axes[0]] })).toThrow();
  });
  it("rejects missing array slots instead of silently omitting them", () => {
    expect(() => snapshotFromGspcPayload({ axes: new Array(1) })).toThrow();
  });
  it("requires the axes property to belong to the received record", () => {
    expect(() => snapshotFromGspcPayload(Object.create({ axes: wire.axes }))).toThrow();
  });
  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, true, "0"])("rejects malformed declared counts instead of deriving replacements: %s", (value) => {
    expect(() => snapshotFromGspcPayload({ axes: wire.axes, totals: { axes: value } })).toThrow();
  });
  it("preserves exact supplied public wording without converting it to our own count", () => {
    const value = "  source wording — partial view  ";
    expect(snapshotFromGspcPayload({ ...wire, totals: { ...wire.totals, public_count: value } }).public_count).toBe(value);
  });
  it("retains other source statuses without declaring them unmeasured", () => {
    const snap = snapshotFromGspcPayload({ axes: [{ axis: "a", status: "HELD" }] });
    expect(snap.empty[0].status).toBe("HELD");
    expect(decode(encodeAguiGspcSse(snap))[3].delta).not.toContain("0 empty");
  });
  it("accepts the current captured public payload and preserves its source totals and clock", () => {
    const raw = readFileSync(new URL("./__fixtures__/gspc-wire-20260929T093707Z.json", import.meta.url), "utf8");
    const source = JSON.parse(raw); const snap = snapshotFromGspcPayload(source);
    expect(snap.public_count).toBe(source.totals.public_count);
    for (const key of ["axes", "measured_axes", "unmeasured_axes"] as const) expect(snap.totals[key]).toBe(source.totals[key]);
    expect(snap.source_measurement_date).toBe(source.measured_on.date);
    expect(snap.measured.length + snap.empty.length).toBe(source.axes.length);
    expect(JSON.stringify(source)).toBe(JSON.stringify(JSON.parse(raw)));
  });
  it("rejects malformed rows through the actual local handler", async () => {
    upstream({ axes: [null] }); const response = await onRequest(context());
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("RUN_FINISHED");
  });
  it("uses the same payload rejection from the exported browser fetch helper", async () => {
    upstream({ axes: [null] }); await expect(fetchLiveGspcSnapshot()).rejects.toThrow();
  });
});

describe("cancellation and HTTP error boundaries", () => {
  it.each(["upstream-error", "malformed-row", "bad-json", "network-error"])("keeps HEAD bodyless on %s", async (mode) => {
    if (mode === "upstream-error") upstream({}, 503);
    if (mode === "malformed-row") upstream({ axes: [null] });
    if (mode === "bad-json") vi.stubGlobal("fetch", vi.fn(async () => new Response("{")));
    if (mode === "network-error") vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("internal request detail"); }));
    const response = await onRequest(context("HEAD"));
    expect(response.status).toBe(502); expect(await response.text()).toBe("");
  });
  it("does not fetch for an already cancelled request", async () => {
    upstream(); const control = new AbortController(); control.abort(); const ctx = context();
    ctx.request = new Request(ctx.request.url, { signal: control.signal });
    const response = await onRequest(ctx);
    expect(response.status).toBe(408); expect(fetch).not.toHaveBeenCalled();
  });
  it("propagates cancellation and cannot emit success after the request is cancelled", async () => {
    const control = new AbortController(); const ctx = context();
    ctx.request = new Request(ctx.request.url, { signal: control.signal });
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      expect(init?.signal).toBe(ctx.request.signal); control.abort(); return Response.json(wire);
    }));
    const response = await onRequest(ctx);
    expect(response.status).toBe(408); expect(await response.text()).not.toContain("RUN_FINISHED");
  });
  it("leaves a cancelled browser-helper call rejected even when a mock upstream ignores the signal", async () => {
    const control = new AbortController();
    vi.stubGlobal("fetch", vi.fn(async () => { control.abort(); return Response.json(wire); }));
    await expect(fetchLiveGspcSnapshot(fetch, "/api/gspc", control.signal)).rejects.toThrow();
  });
  it("does not expose arbitrary internal exception messages in a public error response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("INTERNAL_DIAGNOSTIC_MARKER"); }));
    const response = await onRequest(context()); const text = await response.text();
    expect(response.status).toBe(502); expect(text).not.toContain("INTERNAL_DIAGNOSTIC_MARKER");
    expect(JSON.parse(text).error).toBe("gspc_fetch_failed");
  });
});
