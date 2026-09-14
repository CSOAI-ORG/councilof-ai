# Commission payload — measurable `model` / `bank` ≠ SKU subject
**As of:** 2026-09-14T03:15:37Z · Measure design leaf · UNSIGNED · CEO NAMED after #2249 gap  
**Locks:** never invent MEASURED from payment · SIGNED still n≥30+4way+keystone · Hub HOLD stamps · board cite GET /api/gspc only · coordinate Infra `request-attestation.ts`

## Problem (proved)
LIVE commissions used `subject` as a single string. That field mixed:
- **SKU / campaign labels** (`payai-wrapper-0.01-2026-09-14`) → **UNFULFILLABLE** by hub mill
- **Ollama tags** (`llama3.2:3b`) → need KEEP dispatch, not hub-queue id
- **Intended hub-queue model ids** (rare today)

`GET /api/commissions` enqueues whatever `subject` was paid — mill cannot invent a bank or model from a SKU string.

## Doctrine
| Field | Meaning | Mill? |
|---|---|---|
| `sku` / offer id | What was purchased (request-attestation / commission_card) | Never graded |
| `subject` (legacy) | Keep for back-compat = display / receipt label | Prefer not as mill id |
| **`model`** | Measurable model id (hub-queue slug **or** installed Ollama tag) | **Required** for mill path |
| **`bank`** / `axis` | Frozen bank axis slug (optional; omit = all MODEL_AXES / emptiest) | Selects bank; never invents items |
| `fresh_run` | Always honest until published run | `UNMEASURED` until mill lands |

**UNFULFILLABLE SKU** (no `model`, or `model` not millable): receipt stays **receipt-only honest** — `enqueued:false` or `fulfillment:"UNFULFILLABLE"` · **no fake mill row** · no MEASURED invent.

## Proposed receipt / KV shape (additive)
```json
{
  "schema": "csoai.ras.commission/0.3",
  "surface": "ras.commission",
  "status": "COMMISSIONED",
  "sku": "request_attestation",
  "subject": "human label or sku echo",
  "model": "org/model-or-ollama-tag | null",
  "bank": "governance | null",
  "axis": "governance | null",
  "fulfillment": "QUEUED | UNFULFILLABLE | OLLAMA_CANDIDATE",
  "queue_ref": "https://councilof.ai/api/commissions | commission-queue row",
  "fresh_run": "UNMEASURED",
  "writes_board": false
}
```

`REVENUE_KV` `ras:<sha>` should store at least: `{subject, model, bank/axis, tx, as_of, fulfillment}`.

`/api/commissions` list items: expose `model` (mill key) separate from `subject` (label). Mill `--priority` reads **`model`**, falling back to `subject` only if it matches hub-queue / Ollama allowlist.

## Infra PR-A coordination
1. `request-attestation.ts` paid branch: parse `model=` (and optional `bank=`/`axis=`) query params; validate charset; if missing/unmillable → set `fulfillment: UNFULFILLABLE` on receipt (still issue receipt) — **do not** pretend QUEUED.
2. Free 402 preview: document required `model=` for mill path; SKU-only stays preview/receipt.
3. Do not flip `fresh_compute_excluded` until mill consumes a QUEUED `model`.
4. Measure #2251 inject uses **`model`** ids once schema lands; until then inject from commissions `subject` (current).

## Measure follow-ups (after Infra schema)
- Update `commission_priority.py` to prefer `model`
- Refresh `#2249` probe to score fulfillment by `model`∈hub-queue
- Honesty tests: payment with SKU-only → UNFULFILLABLE; payment with hub model → QUEUED/priority

## Non-goals
- Invent banks for B2/B4
- Mint MEASURED/SIGNED from settle
- Hub spray cold

## LIVE alignment (2026-09-14T03:20:57Z)

| Piece | Status |
|---|---|
| Measure #2249 commission-fulfillment probe | MERGED / UNSIGNED leaf |
| Measure #2251 inject missing commissioned ids | **MERGED** |
| Infra #2252 `/api/commission-queue` + `model`/`bank`/`fulfillment` on receipt | **OPEN** @ `431b4ce8` — sit NAMED |
| Measure follow-up: priority prefers QUEUED+model only | This PR (align) |

### Gap still open (CEO leaf)
#2252 `classifyCommissionTarget(subject)` **derives** `model` from the subject string. CEO lock wants measurable **`model` / `bank` as separate request fields** from SKU `subject`/`sku`.

**Next Infra additive (after #2252 tip):**
- Accept `?model=` + optional `?bank=` / `?axis=` on `request-attestation`
- `sku` / display `subject` never become mill ids when `model` is absent → `fulfillment: UNFULFILLABLE` (receipt-only honest)
- Do not set `enqueued:true` for UNFULFILLABLE (or set `enqueued:false` + still write receipt)
- Mill priority already ignores UNFULFILLABLE / null model once this align PR lands
