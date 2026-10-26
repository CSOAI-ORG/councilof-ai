# Existing paid-door delivery records — 14 October 2026

Codex continuation in the existing PR #3107 branch, using the existing Source handlers and Priority 3 intake `crqmv6bil1hlj80kjy` with `autoMerge:false`. Main Claude M4 alone merges or closes after the four required checks on the actual final published head. This code does not deploy or authorize a paid run.

## Resulting behavior

All 27 advertised paid entries resolve to 14 existing implementations. The 26 missing entries across 13 implementations now use the existing unsigned delivery recorder. The existing signed-data-feed uses the same adapter, awaits its asynchronous serializer, and reports a throwing store as `ERROR`.

The adapter hashes the exact prepared HTTP body and returns the same bytes, status, status text and original artifact/payment headers. It adds the delivery-record state and CORS exposure. Rows remain `csoai.x402.delivery-record/0.1` under `delivery:tx:<transaction>`, with the existing settlement/receipt joins and top-level transaction. No store, registry, product, SKU, signer or intake is introduced. Runtime non-string transaction metadata creates an honest no-transaction gap rather than discarding the consumed paid body.

State distinguishes `WRITTEN`, `ALREADY_RECORDED`, `CONFLICT`, `ERROR`, `UNKNOWN`, `UNRECORDED_NO_STORE` and `UNRECORDED_NO_TRANSACTION`. A different, malformed or falsely signed observed row is not overwritten. Identical sequential replay keeps its original row and timestamp. Storage/hash failure and missing metadata preserve the prepared response.

One per-call 250 ms timer anchors the entire record get/put operation. Both phases race the same timeout promise; no delay is recomputed from `Date.now()` or `performance.now()`. This matters because deployed Workers expose I/O-dependent clocks. A late get cannot start a put after timeout. A timed-out invoked put reports `UNKNOWN`, may commit later, and is neither claimed cancelled nor automatically retried. Bounded read-only reconciliation returns a qualified row or null; null includes unreadable/timed-out storage and is not proof of absence. Runtime scheduling and KV visibility do not support a production latency or one-minute visibility guarantee. [Cloudflare timer behavior](https://developers.cloudflare.com/workers/runtime-apis/performance/), [KV visibility](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

Wrapper changes preserve all five paid HTTP-200 failure bodies and report `PAID_NOT_DELIVERED` without a success row. Their successful delta response now retains the observed settlement echo. Provider-history required-source and selected-leaf failures likewise preserve the original paid response body/status and echo, but bypass successful recording; a readable empty history remains eligible. A malformed provider cursor is refused before settlement. Successfully completed RAS probes with negative findings remain valid delivered measurements.

Valid zero-selected evidence bundles remain `ASSEMBLED-EMPTY`, with zero observations/cards and an exact successful-body row. Free preview, missing/unknown input, invoice quotation, declined payment, HEAD and failed output do not acquire a success row. Invoice quotation remains the existing HTTP-200 quotation, not a delivery.

The actual MCP adapter forwards one configured same-origin request and refuses automatic redirects carrying payment authorization. It reports the underlying HTTP artifact's bookkeeping state and explicitly excludes its re-enveloped JSON-RPC body from that digest. Paid-not-delivered HTTP-200 responses stay errors. Unreadable bodies keep delivery `UNKNOWN`/`isError:true`; an observed opaque settlement header stays `REPORTED_BY_ROUTE`, without independent verification. With authorization but no echo the state is `UNCONFIRMED`; with neither it is `NOT_REQUESTED`.

## Validation and CI adoption

RunPod B3 delivery suite: **98 offline checks passed**, 2026-10-14 05:03:58 UTC, inner Node exit zero and reaped, peak RSS 96,358,400 bytes under the 96 MiB guard, no OOM, provider calls or installations. The original invoice-fixture failure is retained separately; its expectation was corrected from 402 to the existing 200 quotation and explicit no-delivery assertions. Worker transport/budget/grading suite: **31 separate offline tests passed**, with socket/DNS access denied. These are distinct results, not live payment or model qualification.

The stdlib runner `scripts/test_paid_delivery_records.mjs` retains the immutable response expressions and entrypoint blobs in `scripts/fixtures/paid_delivery_seams.json`. It denies external fetch, links explicit synthetic transports, forbids Git transport during baseline reads, and reports SHA256 pins for all 18 tested source/fixture files. Actual feed serialization/card hashing and full wrapper, proof, provider and evidence handlers are exercised with synthetic inputs. The 27 seam cases are not 27 full route integrations.

Controls cover exact binary/Unicode bytes and headers, free/refusal/error paths, malformed transactions, missing/throwing/stalled storage, late commit/rejection, one shared timer under aliased/frozen/backward clocks, replay/conflicts, explicit empty assembly, provider completeness, bounded reconciliation, MCP body/envelope distinction, unreadable-body settlement states and redirect policy. Parsing covers all 16 changed TypeScript files; it is not a semantic typecheck or deployed Workers reproduction.

The existing required `gates` job now selects Node 22.23.3 for these runners, fetches and verifies the exact baseline `10046fd8b60d75be66bd1f9dbf54155cca26dec3`, executes both the Python worker and Node/VM delivery suites, and restores the original Node 20 build runtime afterward. No new workflow or dependency is added. The insertion and Bash syntax were checked on B3; actual hosted invocation, log results and all four final-head checks remain required. Historical green checks on the worker or partial publication do not qualify this successor.

## Boundaries and retained owner decisions

KV get-then-put remains non-atomic across concurrent regions; an interleaved control demonstrates that limitation. No compare-and-swap, cross-region first-writer, retained-body, network receipt, buyer acceptance, payment finality, source truth or certification claim is made. No historical body or transaction is reconstructed or backfilled.

The hypothetical schema-0.2/HANDLER_THREW design and the held PR #3099/#3104 attestation composition remain with the existing main owner. This patch deliberately preserves the current 0.1 success-body contract and legacy rows; it does not falsely report those future changes as implemented. Signing/admission and production remain held. The earlier 63/74-check publish packets are historical and explicitly superseded by the consolidated successor.
