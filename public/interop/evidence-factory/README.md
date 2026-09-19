# Evidence factory registry

This directory joins generated catalogs, a job plan, and receipts from bounded public-source observations. Registry generation itself performs no measurement, signing, scheduling, payment, or public release. Collected observations remain separate from evidence admission.

- `subject-registry.json` preserves scoped source identities, byte hashes, input observation times, historical claims and unresolved identity mappings. Current measurement state remains `DISCOVERED` until a separate evidence admission process accepts a fresh run.
- `contract-registry.json` pins inspected collector entrypoints and source hashes. An existing callable is not proof that its dependencies, controls or execution succeeded. Legacy fixed dates, cohort scope and output restrictions remain explicit.
- `job-matrix.json` is a plan, with no assigned owner, no scheduled jobs and no spend, signing or publication authority. Group cohort collectors by their deduplication key; running a complete cohort once per subject is not authorized by this matrix.
- `axis-goal-reconciliation.json` separately compares the historical mapping vocabulary with a retained live board response. Unresolved references block automatic execution.
- `evidence-graph.json` joins exact subject IDs to each recorded observation or unresolved disposition. It includes every registry row, including subjects not run in this batch. Its summary is not a measurement total.
- `token-observations-2026-09-19.json` retains structured ETH, LINK and ONDO observations, official identity sources, one finalized block, per-provider metadata and receipt hashes. Raw source pages and headers remain in a private capture.

Population counts describe catalog rows, not unique economic assets. The historical SWIFT seed and supplemental registry are joined by their existing bank IDs. Stablecoin and XRPL entries remain separately scoped; a shared name, symbol or issuer alone does not establish that two rows identify the same instrument. Possible alias overlap is a review queue, never an automatic merge.

The 19 September generation contains 473 scoped rows: 427 stablecoin inventory identities, 26 public institution/disclosure subjects, 16 named XRPL subjects, one BENJI fund, and ETH/LINK/ONDO. The fresh upstream inventory added IDs 441 and 442 relative to the historical 425; it removed none. The source-lead registry and promotion queue still cover the historical 425. The two new rows retain explicit missing source/queue mappings and no admitted measurement. The exact fresh index and comparison are retained as `stablecoin-index-2026-09-19.json` and `stablecoin-discovery-delta-2026-09-19.json`.

Historical signed or measured claims remain under `historical_source_claims`. They cannot promote the registry's fresh measurement or proof states. `source_state` identifies whether input bytes match the recorded Git commit; `public_readback_state` remains unchecked until a separate anonymous read verifies public bytes.

Rebuild from the repository root:

```sh
python3 scripts/build_evidence_factory_registry.py \
  --identity-manifest evidence/evidence-factory/token-identities.json \
  --stablecoin-index public/interop/evidence-factory/stablecoin-index-2026-09-19.json
python3 -m unittest discover -s scripts -p test_evidence_factory_registry.py
```

Omit `--identity-manifest` only when the token identity input is unavailable. The generator then records the missing cohort explicitly and inserts no guessed contracts. Use `--generated-at` with an existing artifact's timestamp for a deterministic rebuild from the same source commit and identical working bytes.

Omitting `--stablecoin-index` uses the committed historical baseline. An override pins its own exact bytes, source time and commit/working-file state; importing a fresh index never rewrites the historical source mappings or backlog.

Rebuild the reference reconciliation and evidence graph:

```sh
python3 scripts/reconcile_evidence_factory_bindings.py \
  --definition public/interop/master-harness-index-v0.4.json \
  --board evidence/evidence-factory/gspc-response.json \
  --board-receipt evidence/evidence-factory/gspc-receipt.json \
  --output public/interop/evidence-factory/axis-goal-reconciliation.json
python3 scripts/build_evidence_factory_graph.py \
  --registry public/interop/evidence-factory/subject-registry.json \
  --input evidence/evidence-factory/cohort-dispositions-2026-09-19.json \
  --input public/interop/evidence-factory/token-observations-2026-09-19.json \
  --output public/interop/evidence-factory/evidence-graph.json
```

The retained batch comprises 25 stablecoin source-page dispositions, 16 named XRPL catalog dispositions, 26 public institution/disclosure dispositions, and three token observations. The stablecoin cohort was selected from the frozen 425-row baseline; the fresh discovery of 427 rows did not silently change the batch after execution. BENJI and other unrun subjects remain visible.

XRPL account observations are pinned to a validated ledger. They do not establish the catalog label's issuer attribution or an asset-to-currency mapping; asset supply remains null. SWIFT source retrieval does not refresh the historical institution claims or expose private transaction traffic. The two token RPC providers may share infrastructure: matching responses are observations, not independent state proofs. Issuer-page extraction candidates require review.

Retained response bytes, HTTP error bodies, and request records live in the operator's private capture with a file-hash manifest. Public artifacts contain structured facts, URLs, times, and hashes. A digest identifies bytes; it does not establish that the source claim is correct. No object in this batch has been admitted, signed, rooted, or independently delivered through the protected website by these scripts.

For a new bounded capture, use a new empty output path. The cohort collector checks every input file against the requested source commit before making requests. It limits concurrency, response size and time, preserves explicit gaps, and does not use signing keys, paid endpoints, private accounts or a new scheduler. A process exit alone is not a successful measurement: inspect the lane receipts and row dispositions.
