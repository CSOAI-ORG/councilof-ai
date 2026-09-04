# Hermes — audit and coordination lane

**Date:** 2026-09-04
**Branch under review:** `codex/council-release-live`
**Checkpoint:** reconciled from `origin/master` at `24291d5d0`; evidence is time-stamped
**Owner:** Hermes audit/coordination operator

## Outcome

Maintain one current claim-to-evidence view across product, runtime, GSPC,
commercial and release work. Give each gap one owner and prevent transcript
claims, duplicate tasks or stale counts from becoming release truth.

**Current state:** build the claim ledger from this branch and fresh runtime
evidence; do not import totals or status assertions from older handoffs. The
audit established that the public “33-agent BFT council” was a local
single-process simulation with placeholder keys and hard-coded affirmative
votes, while the latest real independence experiment measured `rho=1` and
`n_eff=1` across three lineages on two providers. It also found simulated
engine protocol doors, speculative Web3 rails and invalid or mismatched public
proof-shaped artefacts. The candidate now labels or quarantines those surfaces,
while the witness lane preserves incident history outside the served tree.
Legacy learn-loop placeholder issuance and the paid witness SKU fail closed;
neither is evidence of a working witness product.

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

At the last complete pre-remediation checkpoint, the local GSPC API reported
**22 axes / 22 measured** with **14 model-comparison axes and 8
deterministic-fact axes**, and the full unit suite passed **1,442/1,442 across
132 files**. These are time-stamped audit counts, not durable estate totals.
Refresh them on the final frozen commit and distinguish current-root workflow
requirements from quarantined historical incidents.

## Non-goals

No product implementation, model training, signing, witnessing, spending,
emailing, publishing, merging, deployment, regulator verdict or certification
claim. A transcript or configuration flag is not runtime evidence.

## Handoff gates

Stop release for secrets, unresolved path ownership, unreviewed deletions,
private operator material, unsupported compliance language, non-reproducible
counts or disagreement between receipts and published artifacts. Hand Claude
the final classification, evidence ledger, known warnings and owner approvals.
