/**
 * OpenTelemetry GenAI spans for the /mcp door — behind a flag, no collector.
 *
 * Cloudflare Pages Functions have no filesystem, so the harness's "export OTLP to FILES"
 * has no local sink here: on the edge the span is written to the request log (Workers tail
 * is the OTLP sink) and the trace id is surfaced on an `x-otel-trace-id` response header.
 * File export at the edge is therefore UNCHECKABLE by design and never faked.
 *
 * Enabled ONLY when the `CSOAI_OTEL` binding/var is an explicit on value. Unset => every
 * function here is a no-op and no header is added; normal /mcp traffic is unaffected.
 *
 * WHAT THE SPAN OBSERVES — and what it does not.
 *
 * The span WRAPS the proxied tool call. It starts before the call, ends after the call
 * settles, and the duration is the wall-clock time the call actually took. The status is
 * DERIVED from what the door observed: an exception that escaped the call, or an upstream
 * HTTP status outside 2xx. It is never a constant.
 *
 * (An earlier version of this file hard-coded `status: { code: 1 }` and emitted the span
 * BEFORE the tool ran, so every call was recorded as OK with a near-zero duration whether it
 * succeeded or threw. A measurement body cannot ship a span that asserts a success it never
 * observed. See the receipt for the before/after.)
 *
 * The tool's own JSON-RPC result arrives as an SSE frame. The edge does not consume that
 * stream, so a tool-level error inside a 200 response is NOT observed here and is not
 * asserted either way. Every span carries `csoai.mcp.outcome.scope = "door"`, which says
 * exactly that: OK means "the door's call settled without an observable failure", and is not
 * a statement about what the tool answered.
 */

const _SCHEMA_URL = "https://opentelemetry.io/schemas/1.28.0";

export function otelEnabled(env: Record<string, unknown> | undefined): boolean {
  const v = String((env?.CSOAI_OTEL ?? "")).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function hex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

type Attr = { key: string; value: Record<string, unknown> };
function attrs(d: Record<string, unknown>): Attr[] {
  const out: Attr[] = [];
  for (const [k, v] of Object.entries(d)) {
    if (v === null || v === undefined) continue; // absent, not zero
    if (typeof v === "boolean") out.push({ key: k, value: { boolValue: v } });
    else if (typeof v === "number" && Number.isInteger(v)) out.push({ key: k, value: { intValue: String(v) } });
    else if (typeof v === "number") out.push({ key: k, value: { doubleValue: v } });
    else out.push({ key: k, value: { stringValue: String(v) } });
  }
  return out;
}

/** OTel StatusCode. 1 = OK, 2 = ERROR. */
export type SpanStatusCode = 1 | 2;

/** Everything the door observed about one proxied tool call. */
export type ToolSpanObservation = {
  traceId: string;
  spanId: string;
  toolName: string;
  startedAtNs: number;
  endedAtNs: number;
  statusCode: SpanStatusCode;
  statusMessage?: string;
  errorType?: string;
  httpStatus?: number;
  extra?: Record<string, unknown>;
};

/**
 * Build the OTLP/JSON span for one observed call. Pure: no clock, no randomness, no I/O.
 * Kept separate so the shape can be asserted without intercepting the log line.
 */
export function buildToolSpan(o: ToolSpanObservation): unknown {
  return {
    resourceSpans: [
      {
        resource: { attributes: attrs({ "service.name": "csoai-gspc-mcp-door" }) },
        scopeSpans: [
          {
            scope: { name: "csoai.mcp.door", version: "0.2.0" },
            schemaUrl: _SCHEMA_URL,
            spans: [
              {
                traceId: o.traceId,
                spanId: o.spanId,
                name: `execute_tool ${o.toolName}`,
                kind: 2, // SERVER
                startTimeUnixNano: String(o.startedAtNs),
                endTimeUnixNano: String(o.endedAtNs),
                attributes: attrs({
                  "gen_ai.operation.name": "execute_tool",
                  "gen_ai.tool.name": o.toolName,
                  // The observation boundary, stated on every span.
                  "csoai.mcp.outcome.scope": "door",
                  ...(o.httpStatus === undefined ? {} : { "http.response.status_code": o.httpStatus }),
                  ...(o.errorType === undefined ? {} : { "error.type": o.errorType }),
                  ...(o.extra ?? {}),
                }),
                status: {
                  code: o.statusCode,
                  ...(o.statusMessage ? { message: o.statusMessage } : {}),
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export type ToolSpanResult = { traceId: string | null; response: Response };

/**
 * Run `fn` and record what actually happened to it.
 *
 * Flag off (or no tool name): exactly `await fn()`, no span, no header, no allocation.
 * Flag on: the span is emitted AFTER the call settles, with a real duration and a status
 * derived from the observed outcome. A throw is recorded as ERROR and then re-thrown — the
 * span is never lost because the call failed.
 */
export async function withToolSpan(
  env: Record<string, unknown> | undefined,
  toolName: string | null,
  fn: () => Promise<Response>,
  extra: Record<string, unknown> = {},
): Promise<ToolSpanResult> {
  if (!toolName || !otelEnabled(env)) return { traceId: null, response: await fn() };

  const traceId = hex(16);
  const startedAtNs = Date.now() * 1_000_000;
  const emit = (statusCode: SpanStatusCode, statusMessage?: string, errorType?: string, httpStatus?: number) => {
    // Workers tail is the OTLP sink at the edge; there is no file to hash here.
    console.log(
      JSON.stringify(
        buildToolSpan({
          traceId,
          spanId: hex(8),
          toolName,
          startedAtNs,
          endedAtNs: Date.now() * 1_000_000,
          statusCode,
          statusMessage,
          errorType,
          httpStatus,
          extra,
        }),
      ),
    );
  };

  try {
    const response = await fn();
    if (response.ok) {
      emit(1, undefined, undefined, response.status);
    } else {
      emit(2, `upstream responded HTTP ${response.status}`, `http_${response.status}`, response.status);
    }
    return { traceId, response };
  } catch (err) {
    emit(
      2,
      err instanceof Error ? err.message : String(err),
      err instanceof Error && err.name ? err.name : "Error",
    );
    throw err;
  }
}

/** Copy a Response adding the trace-id header. No-op passthrough when traceId is null. */
// ── transport observation (this pull request's contract) ────────────────────────────────────
// A second, stricter observation boundary, kept alongside withToolSpan above.
//
// withToolSpan WRAPS the proxied call and reports OK when the door observed no failure.
// startToolRequestSpan observes only what the door can actually see — the response HEADERS,
// or a transport failure — and leaves the status UNSET for every 2xx, because a 200 does not
// establish that the tool completed, settled, delivered, or had any external effect.
//
// Both are exported and both are tested; the /mcp door uses the transport observation below,
// so an HTTP status is never promoted into a tool-success verdict.
type TransportAttr = { key: string; value: { stringValue: string } | { intValue: string } };
export type ToolRequestSpan = {
  readonly traceId: string;
  responseHeaders(status: number): void;
  transportError(): void;
};

/**
 * Start without emitting a completed span. toolName must come from the server's
 * registry; null represents an unknown name, never raw caller-controlled text.
 * MCP attributes follow the development MCP conventions; the csoai.* attributes
 * describe this narrower observation boundary, not conformance or effect proof.
 */
export function startToolRequestSpan(
  env: Record<string, unknown> | undefined,
  toolName: string | null,
): ToolRequestSpan | null {
  try {
    if (!otelEnabled(env)) return null;
    const traceId = hex(16);
    const spanId = hex(8);
    const startMs = Date.now();
    let ended = false;
    const finish = (stage: "response_headers" | "transport_error", status?: number) => {
      if (ended) return;
      ended = true;
      try {
        const attributes: TransportAttr[] = [
          { key: "mcp.method.name", value: { stringValue: "tools/call" } },
          { key: "csoai.mcp.observation_stage", value: { stringValue: stage } },
          { key: "csoai.mcp.tool_outcome", value: { stringValue: "UNOBSERVED" } },
          { key: "csoai.mcp.effect_outcome", value: { stringValue: "UNOBSERVED" } },
        ];
        if (toolName !== null) {
          attributes.push({ key: "gen_ai.tool.name", value: { stringValue: toolName } });
        }
        if (status !== undefined) {
          attributes.push({ key: "http.response.status_code", value: { intValue: String(status) } });
        }
        const error = stage === "transport_error" || (status !== undefined && status >= 500);
        if (error) {
          attributes.push({
            key: "error.type",
            value: { stringValue: stage === "transport_error" ? "transport_error" : "http_5xx" },
          });
        }
        console.log(JSON.stringify({
          resourceSpans: [{
            resource: { attributes: [{ key: "service.name", value: { stringValue: "csoai-gspc-mcp-door" } }] },
            scopeSpans: [{
              // No schemaUrl: the old 1.28 URL did not define these attributes.
              scope: { name: "csoai.mcp.door", version: "0.2.0" },
              spans: [{
                traceId,
                spanId,
                name: toolName === null ? "tools/call" : `tools/call ${toolName}`,
                kind: 2, // SERVER, observed through response headers only.
                startTimeUnixNano: String(BigInt(startMs) * 1_000_000n),
                endTimeUnixNano: String(BigInt(Math.max(startMs, Date.now())) * 1_000_000n),
                attributes,
                status: { code: error ? 2 : 0 }, // ERROR / UNSET; never infer tool success.
              }],
            }],
          }],
        }));
      } catch {
        // Logging/clock failures cannot turn completed paid work into a retryable error.
      }
    };
    return {
      traceId,
      responseHeaders: (status) => finish("response_headers", status),
      transportError: () => finish("transport_error"),
    };
  } catch {
    // Optional telemetry must not prevent dispatch if its initialization fails.
    return null;
  }
}

/** Add correlation without reading, cloning, buffering, or draining the body. */
export function withTraceHeader(res: Response, traceId: string | null): Response {
  if (!traceId) return res;
  const h = new Headers(res.headers);
  h.set("x-otel-trace-id", traceId);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
