# Hermes handoff — audit and coordination lane

**Snapshot:** 2026-09-04  
**Worktree under audit:** `/Users/nicholas/clawd/worktrees/council-master-consolidation`  
**Branch:** `codex/council-master-consolidation`  
**Authority:** observe, reconcile and report; do not deploy
**Execution authority:** `docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`

## Mission

Keep one evidence-backed picture of what exists, what works, what is duplicated
and what remains only declared. Coordinate the other lanes by proof, not by
repeating historical status claims.

**Primary business outcome:** keep revenue, growth, IP and GSPC decisions tied
to evidence, owners and freshness so execution compounds rather than spawning
new rundowns.

## Scope and ownership

Own:

- `docs/handoff/` execution handoffs and audit reports;
- a claim-to-evidence ledger for UI, API, provider, measurement, root and
  witness assertions;
- the lane/path ownership matrix and collision log;
- the verified/unverified attachment register and release secret/privacy scan;
- the revenue, growth, IP, standards-membership and owner-decision scorecard;
- collision detection across TUI 1, TUI 2 and Claude release work;
- independent snapshots and reconciliation of current counts, known gaps,
  owner gates and final release state; reducers remain TUI 2's responsibility;
- read-only inspection of the worktree, local preview and task outputs.

Do not own product implementation, signing keys, provider credentials,
production state or external communications.

## Audit invariants and baseline

- Production has not received this consolidation branch.
- Card inventory: 1,066 signature-valid legacy-unadjudicated records.
- Admitted/quotable cells: 0. Regulation findings: 0.
- Provider GET status is not a probe. Authenticated POST canaries are bounded
  `UNMEASURED` operational evidence only.
- Action jobs persist reviewed intent/state receipts in
  `SINGLE_WRITER_STAGING`; they never start a worker or provider call.
- Candidate intake never trains, publishes, signs, witnesses or updates GSPC.
- A2A declarations, AG-UI presentation transport and future A2UI surfaces are
  not end-to-end execution proof.
- The dedicated admitted-training source is absent by default; historical
  learning corpora are preserved but unsafe for retraining.
- Local coordination service reachability has not been established in this
  session; do not report a connected coordination mesh from stale state.
- Pasted TUI/Hermes transcripts are `UNVERIFIED_TRANSCRIPT` until reproduced
  from exact repository/runtime evidence. Quantity, revenue, market and OTS
  totals in the new attachments are not a baseline.
- A wallet secret appears in repository/readiness material. Never repeat or
  fund it; mark it compromised and require rotation plus release/history scan.

## Audit procedure

- [ ] First work package: update the seeded claim ledger, classify the 382
      dirty paths, quarantine transcript-only totals and give Claude the first
      exact release-candidate manifest.
- [ ] Capture branch, commit, `git status --short` and active task ownership.
- [ ] Classify every dirty path as `INCLUDE`, `EXCLUDE`, `QUARANTINE` or
      `UNRELATED`, with one writer and one handoff recipient.
- [ ] For every “live”, “working”, “measured”, “signed”, “anchored”, “trained”
      or “fixed” claim, record the exact file, endpoint, receipt and timestamp.
- [ ] Classify each surface as `DECLARED`, `CATALOGUED`, `CONFIGURED_UNCHECKED`,
      `RUNTIME_OBSERVED`, `ADMITTED_VERIFIED`, `SIGNED`, `ROOT_INCLUDED` or
      `WITNESSED`; never collapse the states.
- [ ] Compare dashboard tabs, static pages and redirects to identify duplicate
      capability entry points and assign one canonical owner.
- [ ] Review deletions and generated outputs separately from authored code.
- [ ] Reconcile TUI 1 screenshots/tests with TUI 2 receipts/contracts.
- [ ] Give Claude a release manifest containing only reviewed paths, gates,
      known warnings and owner approvals.
- [ ] Maintain a commercial/IP table that distinguishes observed revenue,
      settled receipts, pipeline, proposal, grant funding and unsupported
      forecast; apply the OIN scope check to any patent proposal.
- [ ] After any approved release, independently verify live routes and counts;
      do not accept a deploy log as proof of the served result.

## Required audit artifact

Produce one compact table with these columns:

| Claim | State | Evidence reference | Owner | Freshness | Blocker |
| ----- | ----- | ------------------ | ----- | --------- | ------- |

It must cover at least dashboard shell, each canonical tab, candidate intake,
action ledger, Hugging Face canary, RunPod canary, reproduction, admission,
card signing, matrix/findings reducer, root inclusion, each witness rail,
training eligibility, A2A, A2UI, AG-UI and production deployment.

It must also cover the Hugging Face eligible denominator, 3090/A100 worker
state, safe-offload durability class, current XRPL primitive coverage, x402
settlement, exposed-secret remediation, product revenue evidence, grants and
standards/board status.

The seeded ledger is
`docs/handoff/HERMES_CLAIM_EVIDENCE_LEDGER_2026-09-04.md`. Update that file by
evidence and timestamp; do not create competing status rundowns.

## Proof of done

- Every positive claim has reproducible evidence; every gap has one owner.
- The manifest contains no duplicated work assignment or unowned P0.
- Counts reconcile with `public/signed/card-matrix.json` and
  `public/signed/findings_index.json`.
- The release lane can stage by explicit path from the manifest.
- Unknowns remain explicitly unknown; stale historical notes are not promoted.

Useful read-only checks:

```bash
git branch --show-current
git status --short
jq '.counts' public/signed/card-matrix.json
jq '.counts' public/signed/findings_index.json
rg -n 'MEASURED|SIGNED|WITNESSED|live|working' client functions scripts docs
```

## Dependencies

- TUI 1: current screenshots, component/E2E results and duplicate-route map.
- TUI 2: schema contracts, focused tests and immutable receipts.
- Claude: proposed release manifest, workflow URL and served-domain checks.
- Owner: explicit deploy, paid-probe, credential and external-action decisions.

## Do not claim or deploy

- Do not infer runtime from catalogs, configuration, UI labels or old handoffs.
- Do not say “100/100”, autonomous, anchored, regulator-approved or trained
  without current receipts that establish that exact fact.
- Do not sign, witness, spend, send, publish, merge or deploy from Hermes.
