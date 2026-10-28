import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { otelEnabled, startToolRequestSpan, withTraceHeader } from "./_otel";

type Span = {
  traceId: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  status: { code: number };
  attributes: { key: string; value: { stringValue?: string; intValue?: string } }[];
};
let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => { log = vi.spyOn(console, "log").mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

function emitted(): Span[] {
  return log.mock.calls.map(([line]) => JSON.parse(String(line)).resourceSpans[0].scopeSpans[0].spans[0]);
}
function attributes(span: Span) {
  return Object.fromEntries(span.attributes.map(({ key, value }) => [key, value.stringValue ?? value.intValue]));
}

describe("MCP transport observations", () => {
  it.each([undefined, {}, { CSOAI_OTEL: false }, { CSOAI_OTEL: "false" }, { CSOAI_OTEL: "0" }])(
    "stays off without explicit enablement: %j", (env) => {
      const random = vi.spyOn(crypto, "getRandomValues");
      expect(startToolRequestSpan(env, "get_root")).toBeNull();
      expect(random).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    },
  );

  it.each(["1", "true", "yes", "on", " TRUE "])("accepts explicit flag %s", (flag) => {
    expect(otelEnabled({ CSOAI_OTEL: flag })).toBe(true);
  });

  it("emits only after response headers, with elapsed time and no success assertion", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_001);
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    expect(log).not.toHaveBeenCalled();
    clock.mockReturnValue(1_800_000_000_126);
    trace.responseHeaders(200);
    expect(emitted()).toHaveLength(1);
    const span = emitted()[0];
    expect(span.traceId).toBe(trace.traceId);
    expect(span.startTimeUnixNano).toBe("1800000000001000000");
    expect(span.endTimeUnixNano).toBe("1800000000126000000");
    expect(span.status.code).toBe(0);
    expect(attributes(span)).toMatchObject({
      "mcp.method.name": "tools/call",
      "http.response.status_code": "200",
      "csoai.mcp.observation_stage": "response_headers",
      "csoai.mcp.tool_outcome": "UNOBSERVED",
      "csoai.mcp.effect_outcome": "UNOBSERVED",
    });
    expect(attributes(span)["gen_ai.operation.name"]).toBeUndefined();
  });

  it.each([200, 202, 204, 400, 402])("never promotes HTTP %s into tool success", (status) => {
    const trace = startToolRequestSpan({ CSOAI_OTEL: "on" }, "get_root")!;
    trace.responseHeaders(status);
    expect(emitted()[0].status.code).toBe(0);
  });

  it("records an HTTP server failure without inventing an external-effect verdict", () => {
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    trace.responseHeaders(503);
    expect(emitted()[0].status.code).toBe(2);
    expect(attributes(emitted()[0])).toMatchObject({
      "error.type": "http_5xx",
      "http.response.status_code": "503",
      "csoai.mcp.effect_outcome": "UNOBSERVED",
    });
  });

  it("records one transport error and ignores later terminal callbacks", () => {
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    trace.transportError();
    trace.responseHeaders(200);
    trace.transportError();
    expect(emitted()).toHaveLength(1);
    expect(emitted()[0].status.code).toBe(2);
    expect(attributes(emitted()[0])).toMatchObject({
      "error.type": "transport_error",
      "csoai.mcp.observation_stage": "transport_error",
    });
    expect(attributes(emitted()[0])["http.response.status_code"]).toBeUndefined();
  });

  it("does not rewrite a recorded response as a later failure", () => {
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    trace.responseHeaders(200);
    trace.transportError();
    expect(emitted()).toHaveLength(1);
    expect(emitted()[0].status.code).toBe(0);
  });

  it("omits an unknown caller-supplied tool name", () => {
    startToolRequestSpan({ CSOAI_OTEL: true }, null)!.responseHeaders(400);
    expect(emitted()[0].name).toBe("tools/call");
    expect(attributes(emitted()[0])["gen_ai.tool.name"]).toBeUndefined();
  });

  it("keeps overlapping requests separate when they finish out of order", () => {
    const a = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    const b = startToolRequestSpan({ CSOAI_OTEL: true }, "verify_card")!;
    expect(a.traceId).not.toBe(b.traceId);
    b.responseHeaders(200);
    a.transportError();
    expect(emitted().map((span) => [span.traceId, span.status.code])).toEqual([
      [b.traceId, 0], [a.traceId, 2],
    ]);
  });

  it("clamps a backwards wall clock instead of emitting negative duration", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    clock.mockReturnValue(900);
    trace.responseHeaders(200);
    expect(emitted()[0].endTimeUnixNano).toBe(emitted()[0].startTimeUnixNano);
  });

  it("does not fail dispatch when trace initialization is unavailable", () => {
    vi.spyOn(crypto, "getRandomValues").mockImplementation(() => { throw new Error("unavailable"); });
    expect(startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });

  it("does not turn a log-sink failure into a failed or duplicated operation", () => {
    log.mockImplementation(() => { throw new Error("log unavailable"); });
    const trace = startToolRequestSpan({ CSOAI_OTEL: true }, "get_root")!;
    expect(() => trace.responseHeaders(200)).not.toThrow();
    expect(() => trace.transportError()).not.toThrow();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("adds a trace header to an unfinished SSE response without pulling its body", async () => {
    const pull = vi.fn();
    const body = new ReadableStream<Uint8Array>({ pull }, { highWaterMark: 0 });
    const original = new Response(body, {
      headers: { "content-type": "text/event-stream", "cache-control": "no-store" },
    });
    const response = withTraceHeader(original, "a".repeat(32));
    await Promise.resolve();
    expect(response.body).toBe(body);
    expect(response.bodyUsed).toBe(false);
    expect(pull).not.toHaveBeenCalled();
    expect(response.headers.get("x-otel-trace-id")).toBe("a".repeat(32));
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await response.body!.cancel();
  });

  it("passes through the exact response when tracing is disabled", () => {
    const response = new Response("unchanged");
    expect(withTraceHeader(response, null)).toBe(response);
  });
});
