# Stablecoin contract failures and retained diagnostics

## Scope

The promotion queue reads the existing frozen 425-identity cohort. This repair
changes tests and failure retention only. It does not modify the queue builder,
validator, readiness ledger, signed cards, source registry, recorded probes,
replay evidence, schedule, or existing release authority. Codex opens the PR;
only main Claude M4 merges under B4. No provider/RPC recapture is part of this repair.

## What the retained evidence explains

Scheduled run [39927044682](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/39927044682)
at source b500cf293a98f4c22566ff8a36553512949ab578 failed five of fourteen tests.

At reviewed master 0c90e7ffa89ce8457d5eb177a34565dc0885c546, readiness blob
7de7928f7c13ab5db2e638438614ca2c2cc28090 includes measured IDs 2, 250, 254 and 274.
EURQ (274) is the retained 28 August 2026 09:06:28.399 UTC observation, card
2a81dd2211a12685, PARTIAL_ONE_CHAIN_XRPL / AS_OF_RECORDED_CARD. Other deployments
and the current cross-chain aggregate remain unestablished; the holder field
remains withheld. This explains the stale three-measured and 405-pending tests:
EURCV 254 and EURQ 274 are the two measured identities without an attestation-page
registration, leaving 404 issuer-site-only identities pending review.

The separate runtime change from 18 to 17 deep-probed rows and nine to eight
replay-ready rows is **OPEN / UNCHECKABLE**. The run has no retained artifacts.
Its workflow refetched deep evidence before the contract gate and committed
only after success. The retained deep blob 8fa6eaa7b7fcda82e983242a288e3e3677276375,
dated 15 September 2026 02:06:49 UTC, is identical at the failed-run base and
reviewed master and still has 18 deep-probed rows. Its nine staging identities
are 286, 173, 237, 129, 14, 336, 246, 118 and 195. Aggregate counts do not identify
which runtime row changed or why. EURQ does not explain that separate change.

## Contract tests

Retained-input tests compare exact identity membership, source/readiness/replay
prerequisites, recorded dates and reported chains with queue output. The frozen
index blob 25a5353e58678e36595135d5eb30b0adcf29dbe6 pins all 425 identities;
ticker collisions remain separate IDs.

Controlled temporary fixtures use those identities with explicitly synthetic
readiness, source, deep and replay states. Their fixed counts are scenario
expectations, not new observations. One scenario adds EURQ's historical state
without changing deep/replay counts. Another deliberately removes ID286's
probe prerequisite to demonstrate the independent 18→17 / 9→8 transition;
**it does not attribute the historical failure to ID286**.

Negative controls cover every replay qualification field, missing source/probe,
duplicate/missing identity, generic catalog signatures, payment without a
measurement, and missing anchor prerequisites after count reconciliation.
The production validator and the scheduled queue byte-parity check remain intact.

Run offline with:

~~~sh
PYTHONPATH=scripts python3 -m unittest -v \
  scripts/test_stablecoin_deep_adapter.py \
  scripts/test_stablecoin_promotion_queue.py \
  scripts/test_stablecoin_failure_diagnostics.py
~~~

## Failure retention in the existing round

A baseline projection is recorded before refresh. If the existing round fails,
a second projection and their changed IDs are retained in the single
stablecoin-failure-diagnostics artifact for seven days. The original failed
step remains failed; there is no continue-on-error or replacement gate.

The projection accepts only the pinned numeric IDs, allowlisted state/action
labels, booleans, integer HTTP status codes, input hashes and mirror hashes.
It reads only fixed input paths and numeric-ID metadata paths. Inputs are
bounded to 8 MiB, metadata to 64 KiB, and the final report to 2 MiB; symlinks
are refused. Missing, invalid and oversized files carry explicit static states.
Even a baseline is reprojected before being included.

No URLs, query strings, response bodies, excerpts, findings, exception text,
arbitrary environment values, raw mirrors or job logs enter the artifact.
Queue bytes may predate current inputs if the builder failed; input hashes and
the boundary label make that distinction explicit. A changed ID identifies a
state transition, not its root cause or a new measurement. This mechanism
cannot reconstruct the missing artifact from run39927044682.

Hosted PR tests qualify these source contracts. Actual scheduled failure-artifact
retention and production behavior remain unverified until the owner releases
the change and the existing workflow produces a corresponding run.
