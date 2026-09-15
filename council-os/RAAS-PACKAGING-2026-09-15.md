# RaaS packaging: what exists today, stage by stage (15 Sep 2026)

Source: a third-party compute-and-outreach review (15 Sep), checked against the live site.
Every endpoint below was read over HTTP on 2026-09-15 between 06:18Z and 06:36Z. The status
code shown is what `curl https://councilof.ai<path>` returned. A route that answers
`NOT_IMPLEMENTED` (HTTP 501) counts as **NOT BUILT**, and so does a 404.

Register: measurement, not certification. No stage sells a favourable finding, a suppression,
a rank or an implied accreditation. Verification stays free. This document states no price;
where a paid door exists, the amount lives only in its own x402 challenge. A 402 challenge is
not settlement, delivery or revenue. The measured-party funding rule stays as it is until
the owner decides otherwise.

## The pipeline

public evidence → free verification → evidence bundle / replay → approved change monitoring → repeat use

### 1. Public evidence

| endpoint | HTTP | what it is |
|---|---|---|
| `/api/gspc` | 200 | the board |
| `/api/state` | 200 | corpus and chain state (see `council-os/CARD-CORPORA.md` before quoting any card count) |
| `/api/cards` | 200 | living signed-card registry |
| `/api/hub-cards` | 200 | per-model, per-axis measured cells |
| `/api/root` | 200 | the public Merkle root |
| `/interop/root-witness-latest.json` | 200 | the root's witness record |
| `/api/corrections` | 200 | the public corrections ledger |
| `/feed.xml` | 200 | the feed |
| `/api/distribution-ledger` | **404** | producer on master, never deployed (see #2512 and #2513) |

State: **BUILT** (distribution ledger pending a green deploy).

### 2. Free verification

| endpoint | HTTP | what it is |
|---|---|---|
| `/api/verify` | 200 | GET explains the check; POST verifies a card through the same `functions/_lib/cardVerify.ts` the MCP `verify_card` tool uses |
| `/api/receipts/verify` | 200 | receipt verification |
| `/api/verify-tally` | 200 | verification tally |
| `/api/verify-card` | 501 | NOT BUILT (NOT_IMPLEMENTED) |
| `/api/verify-batch` | 501 | NOT BUILT (NOT_IMPLEMENTED) |
| `/api/witness` | 503 | paid witness issuance QUARANTINED_PRE_RELEASE; body says `nothing_charged: true` and points to a free status door |

State: **BUILT** for single-card and receipt verification. Batch verification is **NOT BUILT**.

### 3. Evidence bundle / replay

| endpoint | HTTP | what it is |
|---|---|---|
| `/api/evidence-bundle?obligation=article-50` | 200 | free preview: the obligation record, the counsel gate, relevant already-signed cards |
| `/api/evidence-bundle?obligation=…&bundle=1` | 402 | x402 challenge for an OSCAL 1.1.0 assessment-results bundle assembled from already-signed cards. "Relevant-to", never a determination |
| `/api/evidence-pack` | 200 | unsigned explanatory template mapping a receipt to insurer evidence classes; the relying party must verify each cited card |
| `/api/receipts/batch` | 402 | x402 challenge |
| `/api/replay`, `/replay` | 404 | **NOT BUILT**: no endpoint re-runs a published measurement from its pinned bank, model revision and decode settings |

State: bundle **BUILT** (preview free, bundle behind x402). Replay **NOT BUILT**.

### 4. Approved change monitoring

| endpoint | HTTP | what it is |
|---|---|---|
| `/api/subscribe` | 501 | **NOT BUILT**: "Create and persist an attestation-monitoring subscription"; body says no durable worker or store |
| `/api/corpus-watch` | 501 | **NOT BUILT**: "Return a sourced, current corpus inventory" |

State: **NOT BUILT.** A new endpoint name is not a monitoring service. Monitoring exists only
once these exist and are published: cadence, freshness bound, outage handling, delivery
channel, cancellation, and support terms. None of the six exists today.

### 5. Repeat use

| endpoint | HTTP | what it is |
|---|---|---|
| `/api/commission-queue` | 200 | mill-visible commission intents (a queue row is not a measurement) |
| `/api/commissions` | 200 | commission records |
| `/api/revenue` | 200 | `one_number` = distinct non-self payers across facilitator-confirmed non-zero settlements |

State: payer counting is **BUILT**. A per-buyer repeat-use measure (the same payer returning for a
later subject-version or change) is **NOT BUILT**. Bot counters, forks and self-payments are
never repeat use.

## Field definition: production cost per accepted result

`cost_per_accepted_result` (per period, per method):

```
cost_per_accepted_result =
  ( allocated_compute
  + provider_usage
  + failed_and_retried_work
  + retention
  + attributable_review )
  / newly_accepted_results
```

- **newly_accepted_results**: count of new (subject, subject revision, method) results in the
  period that passed exact artifact admission, signature, and supported root inclusion.
  Queued jobs, staged unsigned cards, signed receipts without admission, and re-served existing
  results are not counted.
- **allocated_compute**: GPU/CPU time attributed to the period's runs (pod, HF Jobs, Kaggle), at
  the provider's billed rate.
- **provider_usage**: inference-provider charges billed to the organisation for those runs (for
  Hugging Face router calls, the organisation named in `X-HF-Bill-To`).
- **failed_and_retried_work**: the compute and provider usage of runs that did not produce an
  accepted result: transport errors, ALL_UNPARSED runs, intake rejections, re-runs.
- **retention**: storage of run evidence (items, run manifests, intake datasets) for the period.
- **attributable_review**: human or agent review time spent admitting the period's results.
- **Undefined when `newly_accepted_results` is 0.** Record it as UNMEASURED; never report it as
  zero or infinity.

Delivery cost (serving an existing result to many readers) is a **separate** field and is never
folded into this one. Serving is cheap but not free. A smaller bank must never be used to lower
this number. The 30-item operational minimum is not a claim of scientific sufficiency.

No values are recorded in this document.
