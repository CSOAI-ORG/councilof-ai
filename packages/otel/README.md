# packages/otel

OpenTelemetry **GenAI semantic-convention** spans for the harness and the MCP door.

No OTLP **collector** to run, no Langfuse to rebuild. `genai_spans.py` emits the OTLP/JSON
wire shape directly and **exports to a FILE**; the sha256 of those exact bytes is the
`otel_trace_hash`, the OTLP `traceId` is the `otel_trace_id`. Both are **OPTIONAL** card
fields — absent = **UNCHECKABLE**, never hidden and never faked. A signed GSPC card is valid
without them; they only make the *runtime* observable. This is **not a 23rd axis**.

## Flag — normal runs are unaffected

Everything is behind `CSOAI_OTEL`. Unset / `0` / `false` => every call is a cheap no-op,
`card_fields()` returns `{}`, and no file is written. `CSOAI_OTEL=1` turns spans on.
`CSOAI_OTEL_DIR` picks the export directory (default `packages/otel/exports/`).

## Harness (Python)

```python
from genai_spans import Tracer
t = Tracer("csoai-owem-card-pipeline")
with t.genai_span("chat", model="clan-csoai-plain:latest", system="ollama") as span:
    span["gen_ai.usage.input_tokens"] = 42     # None stays absent, never 0
fields = t.card_fields()   # {} when disabled; {otel_trace_id, otel_trace_hash} when on
```

Wired minimally into `harness/owem/card_pipeline.py::chat` (the model call = one GenAI span).

## MCP door (edge)

`functions/mcp/_otel.ts` instruments `tools/call`. Cloudflare Pages has **no filesystem**, so
edge file-export is UNCHECKABLE by design: the span is logged to the Workers tail (the OTLP
sink there) and the trace id rides back on an `x-otel-trace-id` header. No-op unless the
`CSOAI_OTEL` var is set.

**The edge span observes the DOOR, not the tool.** The door's span is a **transport
observation**: it starts before dispatch and ends when the response HEADERS arrive, or when
dispatch itself fails. Its duration is the wall-clock time the call actually took. Its status
is derived from what the door observed, and it is never a constant.

The tool's own JSON-RPC result arrives as an SSE frame the edge does not consume, so a
tool-level error inside a 200 response is **not observed** here and is **not asserted** either
way. An HTTP status therefore never becomes a tool-success verdict: a 2xx leaves the span
**UNSET**, and every span carries `csoai.mcp.tool_outcome = "UNOBSERVED"` and
`csoai.mcp.effect_outcome = "UNOBSERVED"` to say so. Only a 5xx upstream or a transport
failure is recorded as ERROR (`error.type` = `http_5xx` or `transport_error`). The stage the
span reached is stated in `csoai.mcp.observation_stage` (`response_headers` or
`transport_error`).

The tool name in the span comes from the server's registry only. A caller-supplied name that
the registry does not know is omitted rather than logged, so no caller-controlled text and no
private argument reaches the telemetry. The trace id rides back on the caught error response
too, so a failed dispatch stays correlatable.

`functions/mcp/_otel.ts` also exports `withToolSpan`, a **wrapping** observation that starts
before the call, ends after it settles, and reports the door's own view — OK when the door
saw no failure, ERROR when an exception escaped or the upstream answered outside 2xx. Its
spans carry `csoai.mcp.outcome.scope = "door"`, which says exactly that: OK means "the door's
call settled without an observable failure", not "the tool succeeded". It is the observation
the door used before the transport observation above became the one it emits.

> An earlier version emitted the span *before* the call with `status: { code: 1 }` hard-coded
> and `endTimeUnixNano` taken at construction time. Every call was therefore logged as OK
> with a ~0 ms duration — including calls that threw. A measurement body cannot ship a span
> that asserts a success nobody observed. Fixed 2026-10-25.

## Tests

`python3 packages/otel/test_genai_spans.py` — proves disabled is a no-op with absent fields,
enabled exports OTLP whose sha256 matches the two card fields, and a `None` attribute is
dropped (absent, never zero).

`npx vitest run functions/mcp/_otel.test.ts` — proves the wrapping observation records what
happened: disabled is a pure passthrough (no span, no header); enabled records a real
duration; a call that throws is recorded as ERROR with `error.type` and re-thrown; a non-2xx
upstream is recorded as ERROR with `http.response.status_code`; and the observation scope is
stated on every span.

`npx vitest run functions/mcp/_otel.transport.test.ts` — proves the transport observation the
door emits records only what it saw: nothing is emitted before the response headers arrive; a
2xx leaves the status UNSET and marks the tool and effect outcomes UNOBSERVED; a 5xx and a
transport failure are ERROR; the observation is emitted once; an unknown caller-supplied tool
name is omitted; a backwards wall clock is clamped; and neither a logging failure nor a
failure to initialise tracing can change the MCP response.

## Permissionless Route Receipt adapter

`route_receipt.py` converts the first GenAI span in an OTLP/JSON export into the public
`csoai.route-receipt/0.1` envelope. It copies only allow-listed route metadata and numeric
usage. Raw messages, prompts, responses, tool arguments and tool results are never copied.
The caller supplies request, response and route-policy SHA-256 digests, so private content
is not required.

The output is intentionally unsigned and unsubmitted. Signing, admission to the public root,
and any x402 delivery remain separate verified stages.

```bash
python3 packages/otel/route_receipt.py trace.otlp.json \
  --output route-receipt.json \
  --request-sha256 "$REQUEST_SHA256" \
  --response-sha256 "$RESPONSE_SHA256" \
  --policy-sha256 "$POLICY_SHA256" \
  --source-url https://example.org/public-fixture
```

`python3 packages/otel/test_route_receipt.py` proves metadata mapping, latency/usage handling,
truthful unsigned state, and that sensitive GenAI content fields never enter the receipt.

The adapter preserves source observation time and rejects missing or invalid timestamps,
reversed durations, malformed digests, invalid trace/span IDs, conflicting cloud regions,
and invalid cost/token values. Missing optional
usage remains null; measured zero remains zero. The requested model is a declaration;
only `gen_ai.response.model` supplies the span-reported observed model. A server hostname
is never treated as a cloud region; `cloud.region` may come from the span or its resource,
but conflicting values are rejected. These labels are supplied by the trace producer and
are not independently verified identities. SHA-256 digests are not anonymization and
can expose guessable content; decide whether content is suitable for public commitment.
