# Research evidence cycle

This optional local adapter turns retained repository observations into the existing
`csoai.evidence-event/0.1` format, with the existing SARIF and OpenTelemetry
renderers. It does not replace claim maintenance, the GSPC grader, the host
controller, signing, the public corrections ledger or an approval registry.

A repeatable cycle is: collect a bounded snapshot, compare it with reviewed pins,
retain immutable events, inspect the changed-source queue, verify a selected
predecessor, and export the same observations for another consumer. Identical
inputs and evaluation time reuse the same cycle. Repeating a capture with the
latest cycle as its parent also reuses it. New observations link to earlier
ones through the existing `supersedes` field; old bytes are preserved.

## Run

Use a trusted checkout and Python 3. No additional dependencies or network access
are needed by the adapter or receiver.

```sh
python3 packages/evidence-fabric/research_cycle.py build \
  --catalogue /private/catalogue.json --observations /private/observations.json \
  --store /private/research-cycles --as-of 2026-10-30T12:00:00Z

python3 packages/evidence-fabric/research_cycle.py build \
  --catalogue /private/catalogue.json --observations /private/new-observations.json \
  --store /private/research-cycles --as-of 2026-10-31T12:00:00Z \
  --previous /private/research-cycles/PREVIOUS_ID \
  --expected-previous PREVIOUS_MANIFEST_SHA256

python3 packages/evidence-fabric/research_cycle.py verify \
  /private/research-cycles/CYCLE_ID --expected-manifest MANIFEST_SHA256

python3 packages/evidence-fabric/research_cycle.py verify-chain \
  /private/research-cycles/CYCLE_ID --expected-manifest MANIFEST_SHA256 \
  --previous /private/research-cycles/PREVIOUS_ID \
  --expected-previous PREVIOUS_MANIFEST_SHA256

python3 packages/evidence-fabric/research_cycle_view.py \
  /private/research-cycles/CYCLE_ID --expected-manifest MANIFEST_SHA256 \
  --output /private/research-cycle.html

python3 packages/evidence-fabric/research_cycle.py verify-packet \
  /private/Council_Research_Evidence_Cycle.json --expected-manifest MANIFEST_SHA256
```

The viewer can export the complete data packet, native events, SARIF or OTel,
filter states and reopen a downloaded packet. Its browser check verifies byte
consistency with the independently selected manifest digest. The Python reader
also rederives all events, summary counts and both carriers using trusted local
code. Neither check authenticates the producer. A receiver must obtain the
expected digest through its own trusted channel. Received code is never imported.
The current packet carries a parent reference; use `verify-chain` with both
selected directories and digests to verify the actual parent and event links.

## Inputs and evidence meaning

The catalogue uses `council.research-catalogue/1`, with unique `records[].id`,
repository `repo`, full `commit` and `runtime_status: NOT_RUN`. Non-repository
records are counted separately and are explicitly not remeasured.

The observations input is a JSON list. Every entry has `repo`, a full
`observed_commit`, explicit UTC `observed_at`, and the exact public locator
`https://api.github.com/repos/OWNER/REPO/commits?per_page=1`. Collection is a
separate authorized, read-only operation. Stated URLs are provenance declarations,
not authenticated collection. This adapter makes no HTTP calls or API-token use.

- Matching stored pins: `CONSISTENT` only for that comparison.
- Different stored pins: `DIVERGENT`; review the upstream diff before adoption.
- Missing observation: `UNMEASURED` and no numeric value.
- Observation older than the chosen window: `UNCHECKABLE` and no numeric value.
- Future observations, duplicate IDs, contradictory input structure, unsupported
  reader revisions and missing/wrong expected digests: rejected.
- Every comparison exercises a deliberately changed revision through the same
  comparator. This tests discrimination of the comparison, not the collector.

The default freshness window is 24 hours and is an explicit local policy,
not an external standard. All events carry limits. No runtime, safety, business
adoption, legal status, person, model-quality or institutional review result is
inferred. No numeric scores are produced, no signatures or anchors are minted,
and no action permission is granted.

## Storage and verification

Each content-addressed directory contains two source inputs, a binding record,
native events, summary, OTel and SARIF. The manifest covers every payload byte.
Inputs and output files are bounded. The receiver only accepts its known file
names, rejects symlinks, never runs received code and rederives accounting even
when an attacker recomputes a manifest. Readers and writers use the same pinned
adapter/event/renderer sources. A different implementation requires explicit
requalification; it is not automatically imported from a received packet.

Creation uses a local process lock, staged files, fsync and rename. A corrupted
existing cycle is rejected, not overwritten. This is a local filesystem
coordination mechanism, not distributed execution idempotency or a signed log.

Do not publish private catalogues or generated packets as repository fixtures.
Generated private evidence remains separate from this generic source contribution.
No daemon, cron entry, provider dispatch or public deployment is installed.

## Validation

```sh
python3 -m unittest discover -s packages/evidence-fabric/tests \
  -p test_research_cycle.py -v
```

The focused cases cover comparison states, missing/stale/future observations,
rejected input identities, source binding, idempotent/concurrent creation,
chronology, selected-parent verification, portable packets, wrong digests,
symlinks, rewritten accounting, a deliberately broken comparator, no-network
operation and native/SARIF/OTel identity parity. These are software checks, not
measurements of the researched products.
