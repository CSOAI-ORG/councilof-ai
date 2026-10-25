/**
 * Opt-in MCP transport observations. No collector and no payload capture.
 *
 * This span ends when the SDK returns response headers, or rejects the request.
 * It does not observe a streamed body's completion, a tool's semantic outcome,
 * settlement, delivery, or any external effect. HTTP 200 therefore remains UNSET.
 * The CSOAI_OTEL flag stays off by default. Telemetry must never change delivery.
 */
export function otelEnabled(env: Record<string, unknown> | undefined): boolean {
  const v = String((env?.CSOAI_OTEL ?? "")).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function hex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

type Attr = { key: string; value: { stringValue: string } | { intValue: string } };
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
        const attributes: Attr[] = [
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
