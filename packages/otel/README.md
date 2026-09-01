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

## Tests

`python3 packages/otel/test_genai_spans.py` — proves disabled is a no-op with absent fields,
enabled exports OTLP whose sha256 matches the two card fields, and a `None` attribute is
dropped (absent, never zero).
