# OTel span → card-v0 evidence input — Measure — 1 Sep 2026

**Status:** design + leftover docs. Grammar NAMED.  
**Surface:** `otel.span`  
**Locks:** Never grade from spans. Never MEASURED from spans. Never fill 7 empty. Board stays **22 · 15 · 7**. No mill instrument in this step. x402 sit (owner cut-off paste). Cobalt leave alone. No wrangler. Never certify.

CEO: proceed OTel as evidence inputs into outer envelope — design + leftover docs first; GenAI semantic conventions on benches only when safe.

---

## Thesis

An OpenTelemetry span (or short span fragment) becomes a **card-v0 leaf** with `surface: otel.span`. It feeds the **same outer envelope** as GSPC / XRPL / TRACE / Dorado. It is **evidence input**, not a behavioural grade.

```
OTel exporter / bench harness
        → adapter (make_card)
        → outer card-v0 (sha256 over payload)
        → public/root.json merkle
```

Root indexes cards. Chain / Rekor / OTS witness **root hash only**.

---

## Outer envelope (unchanged owner fields)

`schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · sig_ed25519?`

(+ optional live `did` / `tags`).

For this surface: `surface` = `otel.span`.

---

## Payload profile — `otel.span`

Hard cap: **3072 bytes** on canonical payload (`ensure_ascii=False`, sorted keys).

Suggested payload keys (nest only — never lift to outer):

| Key | Required | Notes |
|---|---|---|
| `trace_id` | yes | hex; from span context |
| `span_id` | yes | hex |
| `parent_span_id` | no | hex or omit |
| `name` | yes | span name |
| `kind` | no | INTERNAL / SERVER / CLIENT / … |
| `start_time_unix_nano` | yes | as recorded |
| `end_time_unix_nano` | no | if ended |
| `status_code` | no | UNSET / OK / ERROR — **not** a GSPC grade |
| `service_name` | no | resource `service.name` |
| `instrumentation` | no | `{ "name", "version" }` |
| `attrs_cite` | no | **allow-listed** attribute names + values safe to publish |
| `gen_ai` | no | **benches only when safe** — see below |
| `bench` | no | `{ "suite", "item_id", "run_id" }` when span is from a named GSPC bench harness |
| `note` | yes | honesty string: evidence input, not MEASURED |

**Fail-closed:** anything not in the allow-list goes in outer `unmeasured[]` by name (e.g. `"attrs:http.authorization"`, `"gen_ai.prompt"`), never invented into payload.

### Attribute allow-list (v0 design)

Safe by default (cite):

- `service.name`, `service.version`
- `deployment.environment` (if non-secret)
- `code.namespace`, `code.function` (bench harness only)
- GSPC harness tags: `gspc.axis`, `gspc.bank`, `gspc.run_id`, `gspc.item_id` (names only — not grades)

Never publish into payload:

- Secrets, tokens, `Authorization`, API keys, prompts/completions full text
- PII, emails, raw tool args with credentials
- Full GenAI prompt/completion bodies

### GenAI semantic conventions (benches only when safe)

- **HOLD** on production / third-party traffic.
- **OK on owned benches** when: (1) bank is frozen and public, (2) no secret material in attrs, (3) prompt/completion **hashes** may cite (`gen_ai.prompt_sha256`) — raw text stays off-card unless the bank item is already public and `unmeasured` names any redaction.
- GenAI attrs **never** become `result.accuracy` or a MEASURED stamp.
- Mapping is cite → evidence leaf only. Grading stays on frozen-bank GSPC runs under `gspc.behavioural`.

---

## Honesty gates

| Rule | Why |
|---|---|
| Span status ≠ axis grade | OTel OK/ERROR is runtime health, not behavioural MEASURED |
| No MEASURED from spans | Board authority remains GET `/api/gspc` |
| No fill-empty | 7 empty stay empty |
| `unmeasured[]` required | Name gaps; never invent |
| `sig_ed25519` may be null | Unsigned evidence leaf is fine; SIGNED GSPC path unchanged |
| One writer | `publish_public_root.py` — no second board |

---

## Example (unsigned — not a mint)

```json
{
  "schema": "https://councilof.ai/schema/card-v0.json",
  "surface": "otel.span",
  "subject": "bench harness span — example evidence input",
  "as_of": "2026-09-01T00:00:00Z",
  "source_urls": ["https://opentelemetry.io/docs/specs/semconv/"],
  "payload": {
    "trace_id": "00000000000000000000000000000001",
    "span_id": "0000000000000001",
    "name": "gspc.bench.item",
    "kind": "INTERNAL",
    "start_time_unix_nano": "0",
    "status_code": "OK",
    "service_name": "gspc-bench-harness",
    "bench": {"suite": "example", "item_id": "ex-0", "run_id": "example-not-a-mint"},
    "attrs_cite": {"gspc.axis": "governance"},
    "gen_ai": null,
    "note": "Evidence input only. Not a grade. Not MEASURED."
  },
  "sha256": "<hex of canonical payload>",
  "unmeasured": ["sig_ed25519", "gen_ai", "end_time_unix_nano"],
  "sig_ed25519": null
}
```

---

## Out of scope (this design)

- Shipping a live OTel exporter / mill instrumentation
- Grading models from span rates or error ratios
- `/proof-on-x402`
- TRACE upstream issue (see TRACE crosswalk — informative only until Nick names)
- Cobalt / AG-UI as evidence atoms (AG-UI = presentation only)

## Next

1. Leftover docs land with card-v0 grammar PR (additive; no MEASURED).  
2. Adapter stub later (CEO names).  
3. GenAI bench attrs only after a named safe bank + redaction check.

Filed: `/workspace/OTEL-SPAN-EVIDENCE-2026-09-01.md`
