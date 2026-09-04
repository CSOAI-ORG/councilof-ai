# Hermes — audit and coordination lane

**Date:** 2026-09-04
**Branch under review:** `codex/council-release-candidate`
**Checkpoint:** reviewed current-master checkpoint; evidence is time-stamped
**Owner:** Hermes audit/coordination operator

## Outcome

Maintain one current claim-to-evidence view across product, runtime, GSPC,
commercial and release work. Give each gap one owner and prevent transcript
claims, duplicate tasks or stale counts from becoming release truth.

**Current state:** the candidate still has no refreshed Hermes claim ledger.
The current audit has, however, identified 22 immutable XRPL/COSE incident files,
two published atom roots with 20 quarantined leaves each, and a current-root
witness mismatch. The release guard reports the current 141-leaf root is not
bound by the existing 50-leaf sidecar/pointer and the wider OTS/archive inventory
remains invalid. Legacy learn-loop placeholder issuance and the paid witness SKU
now fail closed; neither is evidence of a working witness product. Build the
ledger from this branch and fresh runtime evidence; do not import totals or
status assertions from older handoffs.

## Business and GSPC purpose

- **Revenue:** distinguish settled receipts, qualified pipeline, proposals and
  forecasts so commercial decisions use observed evidence.
- **Growth:** identify the next measurable funnel constraint without generating
  duplicate surfaces or outreach.
- **IP:** track provenance, licence, database-right and OIN-scope decisions
  without exposing crown-jewel internals.
- **GSPC:** audit every transition from candidate through admission, signature,
  root and witness without collapsing those states.

## Exclusive path boundary

Hermes may write only:

- `docs/handoff/HERMES_AUDIT_COORDINATION_2026-09-04.md`
- `docs/handoff/HERMES_CLAIM_EVIDENCE_LEDGER_2026-09-04.md`
- explicitly requested `docs/handoff/HERMES_*` audit artifacts

All code, Functions, public/generated assets, package/workflow files and other
lane documents are read-only. Hermes does not hold signing, provider,
financial, publishing or deployment credentials.

## Required work

1. Capture branch/checkpoint, active owners and exact changed-path manifests.
2. Record each important claim with state, evidence reference, owner,
   observation time and blocker.
3. Keep `DECLARED`, `CATALOGUED`, `CONFIGURED_UNCHECKED`,
   `RUNTIME_OBSERVED`, `ADMITTED_VERIFIED`, `SIGNED`,
   `ROOT_INCLUDED` and `WITNESSED` distinct.
4. Reconcile frontend states with backend receipts and published artifacts.
5. Audit duplicate routes, deletions, generated output, licences, consent,
   credentials, private transcripts and forbidden product claims.
6. Track revenue, grants, distribution, standards participation and owner
   decisions as separate evidence classes.
7. Give Claude an exact release manifest with no duplicated assignment or
   unowned release blocker.

## Acceptance evidence

The claim ledger must cover the dashboard shell, canonical tabs, candidate
intake, reviewed jobs, provider canaries, reproduction, admission, signing,
GSPC reduction, root inclusion, each witness rail, training eligibility,
protocol projections and production deployment.

It must use this shape:

| Claim | State | Evidence reference | Owner | Observed at | Blocker |
| --- | --- | --- | --- | --- | --- |

Useful read-only checks:

```bash
git branch --show-current
git status --short
git diff --check
rg -n 'MEASURED|SIGNED|ROOT_INCLUDED|WITNESSED|live|working' +  client functions scripts docs
```

Counts must be read from current canonical artifacts at audit time, not copied
from older handoffs. Every positive runtime or commercial claim needs a
reproducible reference; every unknown remains explicit.

At the 2026-09-04 candidate checkpoint, the local GSPC API reported **22 axes /
22 measured** with **14 model-comparison axes and 8 deterministic-fact axes**.
The evidence-integrity guard blocked **2 roots** and the root/witness release
guard blocked **49 issues**, comprising the schema mismatch, stale current
sidecar/pointer, invalid or mismatched public OTS files, and distinct invalid
archive proof references. The earlier 1,018 figure counted repeated references
rather than the guard's deduplicated release-blocker output. These are
time-stamped audit counts, not durable
estate totals; refresh them on the frozen release candidate.

## Non-goals

No product implementation, model training, signing, witnessing, spending,
emailing, publishing, merging, deployment, regulator verdict or certification
claim. A transcript or configuration flag is not runtime evidence.

## Handoff gates

Stop release for secrets, unresolved path ownership, unreviewed deletions,
private operator material, unsupported compliance language, non-reproducible
counts or disagreement between receipts and published artifacts. Hand Claude
the final classification, evidence ledger, known warnings and owner approvals.
