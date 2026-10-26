import { afterEach, describe, expect, it, vi } from "vitest";
import { buildToolSpan, otelEnabled, withToolSpan, withTraceHeader } from "./_otel";

/**
 * The edge OTel span must record what happened, not what was assumed.
 *
 * The bug this pins: the span used to be emitted BEFORE the proxied tool call, with
 * `status: { code: 1 }` hard-coded and `endTimeUnixNano` taken at construction time. Every
 * call was therefore logged as OK with a ~0ms duration — including calls that threw and
 * calls the upstream answered with an error. For a measurement body that is the worst
 * possible default: the telemetry asserted a success nobody observed.
 *
 * The span now wraps the call. These tests pin the three states it must be able to
 * distinguish, and pin that "door" scope is stated on every span (the tool's own SSE
 * result is not read at the edge, so OK never claims the tool succeeded).
 */

const ON = { CSOAI_OTEL: "1" };
const OFF = { CSOAI_OTEL: "0" };

type Span = {
  traceId: string;
  spanId: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: Record<string, unknown> }>;
  status: { code: number; message?: string };
};

function spansFrom(log: ReturnType<typeof vi.spyOn>): Span[] {
  return log.mock.calls.map((c) => JSON.parse(String(c[0])) as { resourceSpans: Array<{ scopeSpans: Array<{ spans: Span[] }> }> })
    .flatMap((r) => r.resourceSpans.flatMap((rs) => rs.scopeSpans.flatMap((ss) => ss.spans)));
}

function attr(span: Span, key: string): unknown {
  return span.attributes.find((a) => a.key === key)?.value;
}

function attrString(span: Span, key: string): string | undefined {
  const v = attr(span, key);
  return typeof v === "object" && v !== null && "stringValue" in v ? String(v.stringValue) : undefined;
}

function attrInt(span: Span, key: string): number | undefined {
  const v = attr(span, key);
  return typeof v === "object" && v !== null && "intValue" in v ? Number(v.intValue) : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("otelEnabled", () => {
  it("is off unless explicitly on", () => {
    expect(otelEnabled(undefined)).toBe(false);
    expect(otelEnabled({})).toBe(false);
    expect(otelEnabled(OFF)).toBe(false);
    expect(otelEnabled({ CSOAI_OTEL: "" })).toBe(false);
    expect(otelEnabled({ CSOAI_OTEL: "maybe" })).toBe(false);
  });

  it("is on for the explicit on values", () => {
    expect(otelEnabled(ON)).toBe(true);
    expect(otelEnabled({ CSOAI_OTEL: "TRUE" })).toBe(true);
    expect(otelEnabled({ CSOAI_OTEL: " on " })).toBe(true);
  });
});

describe("withToolSpan — flag off", () => {
  it("is a pure passthrough: no span, no trace id, the response comes back", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = new Response("ok", { status: 200 });
    const out = await withToolSpan(OFF, "get_axis", async () => res);
    expect(out.response).toBe(res);
    expect(out.traceId).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });

  it("does not swallow an error when the flag is off", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      withToolSpan(OFF, "get_axis", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});

describe("withToolSpan — flag on, call succeeds", () => {
  it("records OK with a real duration, and hands back the trace id", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = new Response("ok", { status: 200 });
    const out = await withToolSpan(ON, "get_axis", async () => {
      await sleep(12);
      return res;
    });

    expect(out.response).toBe(res);
    expect(out.traceId).toMatch(/^[0-9a-f]{32}$/);

    const spans = spansFrom(log);
    expect(spans).toHaveLength(1);
    const span = spans[0];
    expect(span.status.code).toBe(1);
    expect(span.traceId).toBe(out.traceId);
    expect(span.name).toBe("execute_tool get_axis");
    expect(attrString(span, "gen_ai.tool.name")).toBe("get_axis");
    expect(attrString(span, "gen_ai.operation.name")).toBe("execute_tool");
    expect(attrInt(span, "http.response.status_code")).toBe(200);

    // The duration is the wall-clock time the call actually took, not ~0.
    const elapsedNs = Number(span.endTimeUnixNano) - Number(span.startTimeUnixNano);
    expect(elapsedNs).toBeGreaterThanOrEqual(10_000_000);
  });

  it("states the observation scope, and omits error.type rather than reporting zero", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await withToolSpan(ON, "get_axis", async () => new Response("ok", { status: 200 }));
    const span = spansFrom(log)[0];
    expect(attrString(span, "csoai.mcp.outcome.scope")).toBe("door");
    expect(attr(span, "error.type")).toBeUndefined();
  });
});

describe("withToolSpan — flag on, the call fails", () => {
  it("records ERROR and re-throws when the proxied call throws", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      withToolSpan(ON, "get_axis", async () => {
        await sleep(5);
        throw new TypeError("fetch failed");
      }),
    ).rejects.toThrow("fetch failed");

    const spans = spansFrom(log);
    expect(spans).toHaveLength(1);
    const span = spans[0];
    // The regression: this used to be a hard-coded 1 (OK).
    expect(span.status.code).toBe(2);
    expect(attrString(span, "error.type")).toBe("TypeError");
    expect(span.status.message).toContain("fetch failed");
    // The span is not lost when the call fails.
    expect(Number(span.endTimeUnixNano)).toBeGreaterThanOrEqual(Number(span.startTimeUnixNano));
  });

  it("records ERROR when the upstream answers with a non-2xx status", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await withToolSpan(ON, "get_axis", async () => new Response("nope", { status: 502 }));
    expect(out.response.status).toBe(502);

    const span = spansFrom(log)[0];
    expect(span.status.code).toBe(2);
    expect(attrString(span, "error.type")).toBe("http_502");
    expect(attrInt(span, "http.response.status_code")).toBe(502);
  });

  it("never reports OK for a call that failed", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await withToolSpan(ON, "get_axis", async () => new Response("nope", { status: 500 })).catch(() => {});
    for (const span of spansFrom(log)) expect(span.status.code).not.toBe(1);
  });
});

describe("withToolSpan — no tool name", () => {
  it("does not emit a span for a call that is not a tool call", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await withToolSpan(ON, null, async () => new Response("ok", { status: 200 }));
    expect(out.traceId).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });
});

describe("buildToolSpan — pure shape", () => {
  it("carries the scope attribute and drops absent values instead of zeroing them", () => {
    const span = buildToolSpan({
      traceId: "a".repeat(32),
      spanId: "b".repeat(16),
      toolName: "get_axis",
      startedAtNs: 1000,
      endedAtNs: 2000,
      statusCode: 1,
    }) as { resourceSpans: Array<{ scopeSpans: Array<{ spans: Span[] }> }> };
    const s = span.resourceSpans[0].scopeSpans[0].spans[0];
    expect(attrString(s, "csoai.mcp.outcome.scope")).toBe("door");
    expect(attr(s, "error.type")).toBeUndefined();
    expect(attr(s, "http.response.status_code")).toBeUndefined();
  });
});

describe("withTraceHeader", () => {
  it("adds the trace id header when there is one", () => {
    const res = withTraceHeader(new Response("ok", { status: 200 }), "c".repeat(32));
    expect(res.headers.get("x-otel-trace-id")).toBe("c".repeat(32));
    expect(res.status).toBe(200);
  });

  it("passes the response through untouched when there is no trace id", () => {
    const original = new Response("ok", { status: 200 });
    expect(withTraceHeader(original, null)).toBe(original);
  });
});
