/**
 * GET /api/otel — collector presence.
 * LIVE only if a collector answers. Else UNCHECKABLE. Not a 23rd axis.
 */
const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () =>
  json({
    schema: "csoai.otel-status/0.1",
    writes_board: false,
    collector: "UNCHECKABLE",
    otlp: "not exported",
    gen_ai_spans: "not emitted",
    otel_trace_id: null,
    otel_trace_hash: null,
    honesty:
      "No OTLP on councilof.ai. Cards without a trace id stay valid GSPC. They are blind to runtime. Not Datadog. Not an axis.",
  });
