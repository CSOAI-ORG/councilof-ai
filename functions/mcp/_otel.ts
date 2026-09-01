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

/** A single GenAI/tool span. Returns the trace id (for the response header) or null when off. */
export function toolSpan(
  env: Record<string, unknown> | undefined,
  toolName: string,
  extra: Record<string, unknown> = {},
): string | null {
  if (!otelEnabled(env)) return null;
  const traceId = hex(16);
  const start = Date.now() * 1_000_000;
  const span = {
    resourceSpans: [
      {
        resource: { attributes: attrs({ "service.name": "csoai-gspc-mcp-door" }) },
        scopeSpans: [
          {
            scope: { name: "csoai.mcp.door", version: "0.1.0" },
            schemaUrl: _SCHEMA_URL,
            spans: [
              {
                traceId,
                spanId: hex(8),
                name: `execute_tool ${toolName}`,
                kind: 2, // SERVER
                startTimeUnixNano: String(start),
                endTimeUnixNano: String(Date.now() * 1_000_000),
                attributes: attrs({
                  "gen_ai.operation.name": "execute_tool",
                  "gen_ai.tool.name": toolName,
                  ...extra,
                }),
                status: { code: 1 },
              },
            ],
          },
        ],
      },
    ],
  };
  // Workers tail is the OTLP sink at the edge; there is no file to hash here.
  console.log(JSON.stringify(span));
  return traceId;
}

/** Copy a Response adding the trace-id header. No-op passthrough when traceId is null. */
export function withTraceHeader(res: Response, traceId: string | null): Response {
  if (!traceId) return res;
  const h = new Headers(res.headers);
  h.set("x-otel-trace-id", traceId);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
