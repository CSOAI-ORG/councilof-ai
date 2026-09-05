# TUI 2 — post-release backend and evidence lane

**Date:** 2026-09-04

**Base:** resolve and record the latest `origin/master` commit when work starts; never reuse a branch or SHA written in an older handoff

**Owner:** TUI 2 backend/evidence operator

## Outcome

Harden one fail-closed request-to-evidence lifecycle: scoped request, reviewed
intent, bounded execution, reproduction, independent admission, signing, root
inclusion and separately verified witness state. Every implemented transition
must be durable, idempotent and attributable. Anything not implemented returns
an explicit unavailable state and useful next step.

## Truth checkpoint to preserve

- The current exact public-root candidate has **154 coverage leaves**,
  `root.json` SHA-256
  `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`
  and Merkle root
  `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745`.
- Its Ed25519 signature and Rekor entry verify. OTS is
  `STAMPED_PENDING_BITCOIN`, not confirmed on Bitcoin.
- The **335-card signed-card catalogue is separate** from that public root. The
  historical union is **25 roots / 937 entries**, comprising **904**
  individually signed and **33** unsigned wrappers.
- Evidence-integrity and candidate root/witness gates pass at this checkpoint.
  Re-run them on fresh bytes; never infer that a later root also passes.
- General agentic repair, independent runtime admission, live BFT and live
  two-model battle remain unavailable. The Council has 33 designed members and
  a 23-member quorum target, but no live BFT runtime; the latest experiment
  measured `rho=1`, `n_eff=1`.
- PQC is planned. Games and learning are `PRACTICE_ONLY`; they cannot write
  GSPC or issue evidence by themselves.

## Bounded post-release deliverables

1. **Revenue evidence artifact:** one local request → reviewed job → bounded
   result → retest → candidate-receipt fixture, plus a failed-job receipt. No
   payment, settlement or customer-revenue claim.
2. **Growth evidence artifact:** one conformance matrix showing HTTP, MCP, A2A,
   AG-UI, A2UI and SDK projections preserve the same canonical command/event
   identifiers. A configured adapter remains `CONFIGURED_UNCHECKED` until a
   reproducible runtime probe exists.
3. **IP artifact:** versioned command, event, capability and evidence schemas
   with compatibility tests, canonicalization rules and a provenance/licence
   manifest. Do not expose signing keys, private inputs or crown-jewel internals.
4. **GSPC artifact:** one deterministic reducer fixture proving that only
   independently admitted, reproducible evidence changes a cell; signing,
   timestamps, practice scores and pending witnesses do not.

## Exclusive path boundary

Write only within:

- `functions/api/evidence-intake*`, `action-jobs*`, `provider-canary*`,
  `fabric*`, `learning-scenarios*` and `agentic-fix*`
- `functions/_lib/phase1ActionExecutor*` and agreed evidence helpers
- `contracts/**` and `capabilities/**`
- `scripts/sign_mill_cards.py`, `scripts/card-evidence-trust.mjs`,
  `scripts/build-card-matrix.mjs`, `scripts/build-findings-index.mjs`,
  `scripts/adapters/witness_queue.py` and focused tests
- `scripts/badger/csoai-learn.py`, its focused test, and this handoff document

Frontend, `App.tsx`, workflows, package metadata, generated public files and
release control belong to other lanes.

## Required work

1. Freeze one versioned command, event, capability and evidence schema.
2. Enforce request revisions, idempotency and a transactional single-writer
   boundary before enabling any real execution.
3. Execute only allowlisted, reviewed jobs. Record provider/model revision,
   inputs, environment, outputs, timing and failure state without secrets.
4. Reproduce independently, then admit only exact matching digests under a
   separately governed adjudicator identity.
5. Sign only an already admitted body; reduce only valid admitted records into
   GSPC; witness the exact root digest separately.
6. Keep task use, retention, external egress, model training and publication as
   distinct opt-in consent fields.
7. Emit the same lifecycle through each protocol projection without inventing
   transport-specific truth.
8. Keep PQC, BFT, payment, live provider execution and general remediation
   disabled until their own implementation and negative-test gates pass.

## Acceptance evidence and metrics

```bash
npx vitest run functions/api/evidence-intake.test.ts functions/api/action-jobs.test.ts functions/api/provider-canary.test.ts functions/api/fabric.test.ts functions/api/learning-scenarios.test.ts functions/_lib/phase1ActionExecutor.test.ts
PYTHONDONTWRITEBYTECODE=1 python3 scripts/adapters/test_witness_queue.py
npm run guard:evidence-integrity
npm run guard:council-truth
python3 scripts/root-witness-release-gate.py --selftest
python3 scripts/root-witness-release-gate.py --phase candidate
git diff --check
```

Supply fresh logs and an exact changed-path manifest. Required contract metrics:

- one deterministic replay with byte-identical identifiers;
- one rejected stale revision and one idempotent duplicate replay;
- one bounded failure receipt, one reproduced bundle and one independently
  admitted fixture;
- 6/6 protocol projections parse the same canonical lifecycle fixture;
- zero GSPC changes before admission and zero worker access to admission,
  signing, root, publishing or deployment authority;
- zero external provider calls, spend, email or publication during this lane.

## Non-goals and handoff gates

No arbitrary provider URLs, secret passthrough, hidden fallback, live spend,
frontend redesign, legal verdict, regulator approval, certification, external
email/publication, commit, merge or deployment. Stop on non-transactional
multi-writer state, self-admission, digest mismatch, secret-bearing receipts,
unbounded execution or any attempt to call witnessed evidence “correct.”
Hand Claude Master the schema versions, migrations, exact paths, test logs,
negative fixtures and operational dependencies.
