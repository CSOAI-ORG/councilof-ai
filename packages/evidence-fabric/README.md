# evidence-fabric: one evidence event, five carriers

Code Apache-2.0. The `csoai.evidence-event/0.1` schema and the field mappings below are CC0-1.0.

`csoai.evidence-event/0.1` is one observation taken from a record that already exists. It says what was
declared, what was observed, which state that leaves, and the limits of the read. It is evidence, not a
verdict. The renderers only change its shape. None of them mints a measurement.

```sh
python3 event.py validate EVENTS.jsonl
python3 render/ocsf.py    EVENTS.jsonl > findings.ocsf.jsonl     # OCSF 1.9.0 Detection Finding (2004)
python3 render/otel.py    EVENTS.jsonl > evaluation.otlp.json    # OTel event gen_ai.evaluation.result
python3 render/sarif.py   EVENTS.jsonl > evidence.sarif          # SARIF 2.1.0
python3 render/intoto.py  EVENTS.jsonl > statements.jsonl        # in-toto Statement v1
python3 render/ecs_hec.py EVENTS.jsonl > hec.ndjson              # ECS document in HEC NDJSON
python3 render/oasf_eval.py EVENTS.jsonl --events-url URL > eval.json # OASF 1.1.0 core/evaluation module (id 102)
python3 ingest/sarif_in.py REPORT.sarif --read-at <UTC> > events.jsonl    # third-party SARIF, declared side
python3 event.py payload <member> EVENTS.jsonl --as-of <UTC> > batch.json # unsigned batch record to sign
python3 verify.py batch.json batch.signed.json EVENTS.jsonl --did did.json --tamper-control
python3 -m pytest -q .                                            # tests (needs pytest, jsonschema, pyyaml, cryptography)
```

## Rules the code enforces

The tests show that each of these rules can reject an event.

- `state` has six values: CONSISTENT, DIVERGENT, PARTIAL, UNMEASURED, UNCHECKABLE and NOT_DISCRIMINATING. There is no pass state and no grade.
- **UNMEASURED and UNCHECKABLE never carry a number.** `value` must be `null`, and every renderer refuses the event otherwise (`tests/test_doctrine.py`).
  - This test was written first and failed first. With the renderer guard absent (lane commit `8abff609f`), 20 of its cases failed. They pass once the guard is added.
- `value` is set only when a number was actually measured. It is never an estimate.
- A CONSISTENT event must carry a negative control that was actually run. A control that came back other than expected is refused.
- `limits[]` must hold at least one entry.
- `event_id` = `sha256:` + sha256 of the RFC 8785 (JCS) bytes of the event, leaving out `event_id`, `signature` and `anchors`.
  - Signature and anchors are attestations *about* the event and are added afterwards, so an OTS upgrade does not change the id.
  - A correction is a new event whose `supersedes` names the previous id. The old event is never edited.

## Mapping

| Field | OCSF 1.9.0 Detection Finding (2004; never 2003 Compliance Finding) | OTel `gen_ai.evaluation.result` (Development) | SARIF 2.1.0 result | in-toto Statement v1 | ECS (HEC) |
|---|---|---|---|---|---|
| event_id | `finding_info.uid`, `metadata.uid` | `csoai.event_id` | `fingerprints["csoai/event_id/v1"]`, `guid` (derived) | `subject[0]` digest | `event.id`, `related.hash` |
| subject.locator | `resources[].uid` | `csoai.subject.locator` | `artifactLocation.uri` | `predicate.subject` | `url.full` |
| claim.text | `finding_info.desc` | `gen_ai.evaluation.explanation` | `message.text` | `predicate.claim` | `message` |
| method | `finding_info.analytic` | `gen_ai.evaluation.name` | `ruleId`, `tool.driver` | `predicate.method` | `rule.*` |
| state | `status_id`: CONSISTENT 4, DIVERGENT 1, else 99 + `status_detail` | `gen_ai.evaluation.score.label` | `kind`: pass / fail / open / review / notApplicable | `predicate.state` | `event.outcome`: success / failure / unknown |
| value | `unmapped.csoai.value`, **only if measured** | `gen_ai.evaluation.score.value`, **absent unless measured** | `properties.value`, **absent unless measured** | `predicate.value` (null) | `csoai.value`, **only if measured** |
| declared / observed | `evidences[].data` (two items) | `csoai.declared_sha256`, `csoai.observed_sha256` | `properties.*_sha256` | `predicate.declared/observed` | `csoai.*_sha256` |
| negative control, limits, signature, anchors | `unmapped.csoai.*` | `csoai.*` | `properties.*` | `predicate.*` | `csoai.*` |

Carrier choices, with the reason for each:

- **Severity.** OCSF `severity_id` is always 1 (Informational), because we do not rate risk.
- **OCSF value field.**
  - OCSF has no field for a measured value.
  - `confidence_score` is the event source's confidence and `risk_score` is a risk rating. Neither of them is our measurement, so the value goes under `unmapped`.
  - This departs from the 30 Sep plan, which put the value in `confidence_score`.
- **SARIF level and guid.**
  - `level` is `"none"` whenever `kind` is not `fail`, as SARIF requires.
  - `guid` is the first 16 bytes of `event_id` laid out as a UUID. The full id is in `fingerprints`.
- **in-toto predicate type.**
  - The predicate type is `https://councilof.ai/spec/evidence-event/v0.1`, not `eval-result/v0.1`. That draft (in-toto/attestation PR #575, open, head `0c70fc3c`, read 30 Sep 2026) requires three things:
    - `claims[].passed`, which is a threshold verdict
    - `sampleSize`
    - exactly one model identity and one dataset identity
  - A declared-vs-observed record has none of these, and filling them in would invent a pass mark.
  - `assuranceLevel` is still set: `third_party` for our own method, `reproduced` for a re-run of someone else's method.
  - The DSSE envelope is emitted **unsigned**. `/api/board-sign` signs canonical JSON, not DSSE PAE bytes. The batch signature (below) covers the events.
- **ECS mapping.**
  - `event.category` is `["configuration"]`, never `intrusion_detection`.
  - `event.outcome` for UNMEASURED is `unknown`, never `success`.
  - `event.risk_score` is never emitted.
- **Live ingestion is UNMEASURED.** No SIEM, collector or tenant ingestion was run. Each golden output is checked only against the carrier's published schema or registry.

## Validators

Each validator is pinned under `vendor/`, and the tests read it offline.

| File | Source | sha256 |
|---|---|---|
| `ocsf-1.9.0-detection_finding.schema.json` | `https://schema.ocsf.io/schema/1.9.0/classes/detection_finding?profiles=` (read 30 Sep 2026) | b680763405d2e472cb3c3c52bd6ca9f5555f048445e8f6092c5cfdd53ae63161 |
| `sarif-schema-2.1.0.json` | oasis-tcs/sarif-spec@adbb670c `sarif-2.1/schema/sarif-schema-2.1.0.json` | c3b4bb2d6093897483348925aaa73af03b3e3f4bd4ca38cef26dcb4212a2682e |
| `oasf-1.1.0-module-evaluation.schema.json` | `https://schema.oasf.outshift.com/schema/1.1.0/modules/evaluation` (read 30 Sep 2026) | d1035648e15743cab5454eac11739a4bdbe0deb135d33b9007515d023c5b045d |
| `otel-genai-events.yaml`, `otel-genai-registry.yaml` | open-telemetry/semantic-conventions-genai@bcc7f9c2 `model/gen-ai/` | 55de2362…, 62f9f9ac… |
| `ecs-subset.json` | the fields we emit, taken from elastic/ecs@9868ff5b `generated/ecs/ecs_flat.yml` (sha256 4277630b…) | — |
| in-toto | `in-toto-attestation` (PyPI) `Statement.validate()`; the test is skipped if it is not installed | — |

## Signing a batch

Events are signed as a batch, through the existing board-sign path:

1. `python3 event.py payload <member> events.jsonl --as-of <UTC> > batch.json`
2. On the host that holds the caller token: `sign_record.py batch.json --artifact-path <path> --extra extra.json`. This POSTs `/api/board-sign` and writes `batch.signed.json`, a `.ots` file and `.ots.json`.
3. `python3 verify.py batch.json batch.signed.json events.jsonl --did did.json --tamper-control` must print VALID. It must also report every one-byte tamper as INVALID.

A signature checked with a supplied DID document establishes consistency between these bytes, the signature and that supplied key. Independent issuer/key authentication is not established merely by `did.json`, and the signature does not prove that any claim inside is true.

## Bridges: probes, ingesters, maintenance

| Path | What |
|---|---|
| `probe/release_parity.py` | Compares the latest version on the package registry (PyPI or npm) with the repository's latest release tag. |
| `probe/licence_parity.py` | Compares the licence the registry declares with the SPDX licence GitHub detects. NOASSERTION is reported as UNCHECKABLE. |
| `probe/quote_reread.py` | Re-reads a quoted claim at its URL and checks whether the quote is still there. This is the basic step of claim maintenance. |
| `probe/a2a_card.py` | Checks an A2A agent card at its well-known URI. It uses `scripts/census/a2a-card-probe.py`, with a control path on the same host. |
| `probe/mcp_registry.py` | Compares the MCP Registry's latest entry with the package registry or the image tags. When a remote endpoint is listed, it runs `scripts/census/mcp-remote-probe.py` against it. When no remote is listed, the result is UNMEASURED. |
| `probe/mcp_stdio_tools.py` | Compares a README's claim about which tools a server exposes with what the server's `tools/list` returns. It runs locally over stdio with no credentials. |
| `ingest/garak_in.py` | Reads a garak report and recounts it. garak holds the method; we hold the run and the recount. |
| `ingest/openshell_in.py`, `../../harness/openshell-adapter/ocsf_out.py` | Turns declared-vs-observed rows from the OpenShell adapter into events, and renders them as OCSF output. |
| `ingest/safe_in.py`, `safe_pack.py`, `safe_pack_verify.py` | Turns SAFE re-verification records into events, and builds the frozen pack from them. |
| `oasf/build_record.py` | Builds our OASF 1.1.0 record with a `core/evaluation` module. It is a sibling of the AGNTCY lane draft, which it does not edit. |
| `batch.py`, `anchor.py`, `verify.py` | Assemble a batch, log it in Rekor and upgrade its OTS proofs, and verify it offline. |
| `maintain.py`, `ops/maintain-cron.sh` | Plan, detect and run the day-7, day-30 and day-90 re-reads of each signed batch, then sign, anchor and store each one privately. |

All probes send read-only GET requests, or `initialize` plus `tools/list`. They send no credentials and never call a tool. Anything that needs an account is reported as UNMEASURED, with the reason.

### W3C Agent Conformance Reporting Format v0.1 (`render/w3c_acr01.py`)

Re-expresses events, GSPC board axes and signed-card states in the v0.1 per-check record of the W3C Agent Conformance and Benchmarking Community Group (text of 30 September 2026, list message [0087](https://lists.w3.org/Archives/Public/public-agent-conformance/2026Sep/0087.html); a Community Group text, not a W3C Standard). JSON key names are ours; v0.1 fixes fields and values, not a wire format.

```sh
python3 render/w3c_acr01.py EVENTS.jsonl --causes CAUSES.json > report.json
python3 render/w3c_acr01.py --validate report.json      # rows 1-14, run level, 5.4; exit 1 on any rejection
```

| event state | v0.1 state | cause |
|---|---|---|
| CONSISTENT | pass | none |
| DIVERGENT | fail | none |
| PARTIAL | inconclusive | declared by the producer (sidecar), else `unavailable`, labelled as a default |
| UNCHECKABLE | inconclusive | declared, else `unavailable` |
| UNMEASURED | not-exercised | declared, else `unavailable` |
| NOT_DISCRIMINATING | void | `evidence-does-not-hold` |

UNMEASURED and UNCHECKABLE never become pass or fail, on events, axes or cards. `other-verdict` and `discrimination` stay `unknown` (or `possible-not-demonstrated`) unless the renderer ran both sides of a delta-related pair itself. Our `negative_control {expected, got}` is a declaration, not a pair. Section 5.4 is answered with shown-by-run, control, prior-run or nothing, never with silence. The golden `tests/golden/w3c_acr01.safe-signature.json` is a real control-run fail: the board signature over the SAFE pack's FREEZE.json passes on the signed bytes, and each of three altered-preimage controls returns fail with its own rule, under the same checker revision and configuration digest.

### OASF 1.1.0 evaluation module (`render/oasf_eval.py`)

The ADS face of the same events. Every event becomes a `datasets[]` pointer (`<events-url>#<event_id>`, with state,
subject, method, holder, declared/observed sha256, control, limits, signature, OTS as key-value metadata). Only a
measured number becomes an `evaluation_report.metrics[]` entry (`type` gauge, UCUM unit, value as a string data
point). UNMEASURED and UNCHECKABLE never become a metric or a value, and no `overall_rating` or `overall_scores`
is ever written (`tests/test_oasf_eval.py`; fail-first run recorded in `receipts/F-OASF.fail-first.txt`). The golden
validates against the official module and record schemas served by schema.oasf.outshift.com.

### Offline SAFE pack readback (7 October 2026)

Use the repository source together with the reviewed `safe_freeze_v2.py` consumer beside it:

```sh
python3 packages/evidence-fabric/safe_pack_verify.py --offline --pack docs/standards/osaia-safe-evidence-pack
```

The external verifier reads the retained pack without replacing its stamped `verify.py` or other frozen bytes. The retained stamped `verify.py` can still print `VERIFIED`/exit 0 when signature material is absent. That historical byte/readback result establishes neither issuer authentication nor admission; use this external consumer for the corrected verdict contract. It checks sums, schema controls, derived events/renders and the freeze signature. A confirmed failed check returns `INVALID` (exit 1); unavailable files or dependencies return `UNCHECKABLE` (exit 2). When all checks hold under the supplied DID key, it returns `SELF_CONSISTENT_UNAUTHENTICATED_KEY` (exit 2), with `signature_valid: true` and `issuer_authenticated: null`. This consumer provides no independently authenticated issuer input and emits no `VERIFIED`/exit 0 result.

This source command requires the reviewed signature-consumer predecessor; it does not imply a published package release. PyPI 0.1.0 lacks `verify-safe-freeze`; the retained 0.1.1 candidate is not published. No production signing, OTS anchoring or admission is established by this readback. Future generated packs copy the same helper into `lib/` before freezing; historical packs remain immutable.
