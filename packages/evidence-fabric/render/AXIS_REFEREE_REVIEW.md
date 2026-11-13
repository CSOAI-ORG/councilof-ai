# Referee observations in the existing axis/charter review

Status: source candidate, unsigned, review only. This renderer reuses `csoai.evidence-event/0.1`; it creates no new canonical event schema, case store, grader, authority service or scheduler. It complements the instrument correction in PR #4021. It does not demonstrate independent referees or a fault-tolerant consensus network.

## Input and output

`axis_referee_review.py` accepts the existing `csoai.axis-specialist-index/1.0` bytes and an array of existing evidence events. Each event explicitly names relevant existing axes in `observed.axis_ids`. The input index retains its charter digest and reviewed article references. The output is a separate derived review view, not a replacement for the canonical index.

The renderer validates the existing event identity through `event.py`, binds exact input-file digests and retains source read times. It projects only whitelisted metadata, not claim text or free-form observation content. Every row remains HOLD, may_apply=false and replies=HELD. Unknown independence remains NOT_ESTABLISHED; signatures are NOT_PERFORMED, not implicitly trusted. No network, model, credential, signing, reply, publication or source-write action is present. The CLI prints to stdout only.

Comparison requires both retained prior-event bytes and their observation time. No supplied baseline means comparison unavailable, not all observations newly discovered. Duplicate event IDs and different signature wrappers do not multiply observations. A removed reference is no longer observed, not a resolved finding. Input digests bind the supplied baseline but do not authenticate its custodian; the existing archive owner must qualify baseline selection.

## Reproduce without external services

From the repository root:

```sh
python3 -B -m unittest discover -s packages/evidence-fabric/tests -p test_axis_referee_review.py -v
python3 -B packages/evidence-fabric/render/axis_referee_review.py --index public/axis-specialists/index.json --events OWNER_REVIEWED_EVENTS.json --as-of UTC_TIMESTAMP
```

For a comparison also supply `--previous-events` and `--previous-as-of`. Inputs are bounded to 2 MiB, symlink paths are rejected, and unknown axes/duplicate identities/malformed JSON/invalid digests/naive or future dates fail closed. The source is not executed merely by reading an input.

## Actual local qualification on 7 November 2026

36 Python tests passed using synthetic fixtures. These cover the 34-row shape, held authority, no private text propagation, exact source binding, malformed inputs, duplicate observations, signatures-as-wrappers, unchanged replay, source-time checks, and new/carried/no-longer-observed sets. The existing canonical `event.py` was byte-checked against blob `7fa0d64ea0a02e322ac72dab446c2b2345d0844f` at `01b10c7e551d9a217250f73c1b8c68c0ca444675` and was not modified.

A separate actual-source exercise used the exact 34-axis index from that revision: 34,304 bytes, SHA-256 `99b675260be323284e441a8782931c930ef1c0ae86b366a377b32365b84d5586`, Git blob `00fac83e4d08e9bd3dc1c8014de7ee7b84522cd0`. Its underlying board snapshot is dated 2 November, not a new live measurement. Four retained baseline-versus-candidate regression observations and one independence-unknown observation yielded five distinct events, linked as proposed review topics to governance, measurer-integrity, harness-fidelity, claim-maintenance, provenance and effect-binding. All 34 rows remained present and held. Replaying the same events produced five carried references, no new/no-longer-observed events. Original index bytes remained unchanged.

The Node instrument suite, Python projection suite and finite quorum-topology probe were also executed concurrently as three isolated jobs; all exited 0. This is same-author verification, not a separate organisation's acceptance. No signed historical artifact was rewritten or re-attested.

## Existing-owner handoff

- Instrument/referee owner reviews #4021 and qualifies actual principal, provider, control-plane, key and data dependencies. Correlation alone cannot establish independence.
- Evidence/index owner chooses the authoritative retained event capture and comparison baseline. These references remain review metadata, not increments to model n, scores or legal coverage.
- Charter owner reviews the six proposed relevance links against the already-pinned article map; the charter itself is unchanged.
- Daily reporting owner may compose this pure renderer after the existing producer once adopted. No schedule or automatic ingestion was changed by this candidate.
- Release owner runs the normal protected gates and public-byte readback. No draft output is labelled live.
- Authenticated humans retain consequential decisions. Replies and upstream submissions stay held; no new challenge or external reply was sent.

The original axis generator deletes unexpected JSON files in its output directory; do not place a separate persistent store there. Integrate a reviewed projection through the existing producer instead of hand-editing generated mirrors. Keep signed source bytes, previous charter versions and original event envelopes intact.
