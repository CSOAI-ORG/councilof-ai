# packages/otel

OpenTelemetry GenAI semantic conventions for the harness and MCP door.

Tonight: **no OTLP exporter**. `GET /api/otel` is UNCHECKABLE until a collector answers. Cards may carry optional `otel_trace_id` + `otel_trace_hash`. Absent = UNCHECKABLE, not hidden. Not a 23rd axis. Signed GSPC cards remain valid without a trace id — they are just blind to runtime.

A Collector to files is enough later. Sign the file hash. That is the repro pack’s missing half. You do not need Datadog.
