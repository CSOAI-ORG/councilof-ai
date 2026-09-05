# Hermes — post-release audit and coordination lane

**Date:** 2026-09-04

**Base under audit:** resolve and record the latest `origin/master` commit at the start of each audit; never reuse a branch or SHA from an older handoff

**Owner:** Hermes audit/coordination operator

## Outcome

Maintain one current claim-to-evidence view across product, runtime, GSPC,
commercial and release work. Give every gap one owner and stop transcript
claims, duplicate tasks, stale counts or configured-but-unprobed integrations
from becoming release truth.

## Truth checkpoint to preserve

- Exact public-root candidate: **154 coverage leaves**, `root.json` SHA-256
  `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`,
  Merkle root
  `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745`.
- Ed25519 and Rekor verify. OTS is `STAMPED_PENDING_BITCOIN`, not confirmed
  Bitcoin. PQC is planned.
- The **335-card signed-card catalogue is separate**. Historical union:
  **25 roots / 937 entries**, with **904** individually signed and **33**
  unsigned wrappers.
- The 33-member/23-target Council is a governance design, not a live BFT
  runtime. Latest measured independence: `rho=1`, `n_eff=1`.
- Games and training are `PRACTICE_ONLY`. Live battle, general repair and
  independent runtime admission are unavailable unless fresh evidence proves a
  later implementation.

Treat this as a dated checkpoint. Recompute every count and state from current
artifacts before publishing a later audit.

## Bounded post-release deliverables

1. **Revenue evidence artifact:** a ledger separating settled receipts,
   qualified requests, proposals and forecasts. Unknown and zero are different;
   no local test is a customer or revenue event.
2. **Growth evidence artifact:** a reachability/provenance inventory for the
   canonical site, Hugging Face and protocol discovery surfaces. Do not infer
   adoption from files, downloads, catalogue entries or HTTP 200 alone.
3. **IP artifact:** a source/licence/database-right/OIN-scope register for every
   included dataset or generated artifact, plus a secret/privacy scan result.
   No patent filing, disclosure or external submission is authorised.
4. **GSPC artifact:** a claim/state/evidence/owner/time/blocker ledger covering
   candidate, admission, signature, root inclusion and each witness separately.

## Exclusive path boundary

Hermes may write only:

- `docs/handoff/HERMES_AUDIT_COORDINATION_2026-09-04.md`
- `docs/handoff/HERMES_CLAIM_EVIDENCE_LEDGER_2026-09-04.md`
- explicitly requested `docs/handoff/HERMES_*` audit artifacts

All code, Functions, public/generated assets, package/workflow files and other
lane documents are read-only. Hermes does not hold signing, provider,
financial, publishing or deployment credentials.

## Required work

1. Capture resolved base commit, active owners and exact changed-path manifests.
2. Record each important claim with state, evidence reference, owner,
   observation time and blocker.
3. Keep `DECLARED`, `CATALOGUED`, `CONFIGURED_UNCHECKED`,
   `RUNTIME_OBSERVED`, `ADMITTED_VERIFIED`, `SIGNED`, `ROOT_INCLUDED` and
   `WITNESSED` distinct.
4. Reconcile frontend states with backend receipts and public artifacts,
   including the separate public-root and signed-card corpora.
5. Audit duplicate routes, deletions, generated output, licences, consent,
   credentials, private transcripts and forbidden compliance claims.
6. Track revenue, grants, distribution and standards participation as separate
   evidence classes. Do not send outreach or manufacture totals.
7. Give Claude Master an exact `INCLUDE`, `EXCLUDE`, `QUARANTINE`,
   `UNRELATED` classification with no duplicated or missing owner.

## Acceptance evidence and metrics

The ledger must cover the dashboard, canonical tabs, candidate intake, reviewed
jobs, provider canaries, reproduction, admission, signing, GSPC reduction,
root inclusion, witness rails, practice eligibility, protocol projections and
observed production state.

Use this shape:

| Claim | State | Evidence reference | Owner | Observed at | Blocker |
| --- | --- | --- | --- | --- | --- |

```bash
git fetch origin master
git rev-parse origin/master
git status --short
git diff --check
rg -n 'MEASURED|SIGNED|ROOT_INCLUDED|WITNESSED|live|working' client functions scripts docs
npm run guard:wallet-secrets
npm run guard:evidence-integrity
npm run guard:council-truth
npm run guard:root-witness
```

Required audit metrics:

- 100% of positive claims in the reviewed manifest have an evidence reference,
  observation time, owner and scope;
- zero silent promotion between evidence states;
- zero unowned changed paths, leaked secrets or private operator material;
- revenue, growth, IP and GSPC artifacts each have a reproducible local source;
- zero external email, publication, deployment, submission or spend.

## Non-goals and handoff gates

No product implementation, model training, signing, witnessing, spending,
email, publishing, merging, deployment, regulator verdict, patent filing or
certification claim. Stop release for secrets, unresolved ownership, unreviewed
deletions, private material, unsupported compliance language,
non-reproducible counts or disagreement between receipts and artifacts. Hand
Claude Master the final classification, ledger, warnings and owner decisions.
