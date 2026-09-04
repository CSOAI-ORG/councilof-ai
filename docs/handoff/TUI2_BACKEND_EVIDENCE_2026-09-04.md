# TUI 2 — backend evidence lane

**Date:** 2026-09-04
**Branch:** `codex/council-release-live`
**Checkpoint:** reviewed current-master checkpoint; refresh evidence at handoff
**Owner:** TUI 2 backend/evidence operator

## Outcome

Deliver one fail-closed request-to-evidence lifecycle: scoped request,
reviewed intent, bounded execution, reproduction, independent admission,
signing, root inclusion and separately verified witness state. Every
transition is durable, idempotent and attributable.

**Current state:** the candidate contains the intake, job, fabric, learning,
provider-canary and bounded-executor surfaces; the latest focused backend
checkpoint passed 48/48. The action-job API is still a single-writer staging
ledger with no provider execution, and the Phase-1 executor is an in-memory test
fixture only. The complete durable execution, independent-admission and current
witness chain is not implemented and remains release-blocking. Legacy
learn-loop placeholder issuance and paid witness issuance now fail closed
pre-payment rather than presenting unverified proof-shaped values.

The public-root source contract is now versioned as
`/schema/public-root-v1.json`, while signing and current external witnessing
remain exclusively owned by the authorised GitHub workflow. Historical invalid
OTS, atom-root and anchor artefacts must stay preserved in the incident archive,
never rewritten into valid-looking evidence. Simulated 33-agent BFT and phantom
engine endpoints are explicitly outside the runtime contract.

## Business and GSPC purpose

- **Revenue:** turn a request into a deliverable, verifiable measurement and
  remediation receipt rather than an endpoint demo.
- **Growth:** expose one stable contract to Council OS, MCP, A2A, SDK and
  partner adapters.
- **IP:** protect the evidence state machine, exact-byte card contract and
  independent-admission boundary.
- **GSPC:** only independently admitted, reproducible measurements may update
  a cell; signatures and timestamps never decide the score.

## Exclusive path boundary

Write only within:

- `functions/api/evidence-intake*`, `action-jobs*`,
  `provider-canary*`, `fabric*`, `learning-scenarios*` and
  `agentic-fix*`
- `functions/_lib/phase1ActionExecutor*` and agreed evidence helpers
- `contracts/**` and `capabilities/**`
- `scripts/sign_mill_cards.py`, `scripts/card-evidence-trust.mjs`,
  `scripts/build-card-matrix.mjs`, `scripts/build-findings-index.mjs`,
  `scripts/adapters/witness_queue.py` and focused tests
- `scripts/badger/csoai-learn.py` and its focused test

Frontend, `App.tsx`, workflows, package metadata, generated public files and
release control belong to other lanes.

## Required work

1. Freeze one versioned command, event, capability and evidence schema.
2. Enforce request revisions, idempotency and a transactional single-writer
   boundary before enabling execution.
3. Execute only allowlisted, reviewed jobs; record provider/model revision,
   inputs, environment, outputs, timing and failure state.
4. Reproduce independently, then admit only exact matching digests under a
   separately governed adjudicator identity.
5. Sign an already admitted body; reduce only valid admitted records into
   GSPC; witness the exact root digest separately.
6. Keep task use, retention, external egress, model training and publication
   as distinct consent fields.
7. Emit the same lifecycle through MCP/A2A/AG-UI/A2UI projections without
   inventing transport-specific truth.

## Acceptance evidence

```bash
npx vitest run functions/api/evidence-intake.test.ts functions/api/action-jobs.test.ts functions/api/provider-canary.test.ts functions/api/fabric.test.ts functions/api/learning-scenarios.test.ts functions/_lib/phase1ActionExecutor.test.ts
PYTHONDONTWRITEBYTECODE=1 python3 scripts/adapters/test_witness_queue.py
git diff --check
```

Supply one deterministic replay, one rejected stale revision, one duplicate
idempotency replay, one bounded failure receipt, one reproduced bundle and one
independently admitted fixture. Prove that matrix output changes only after
admission and that pending versus independently verified witness states remain
distinct. Worker credentials must not include admission, signing, root,
publishing or deployment authority.

The latest focused backend selection passed **48/48**, and the witness-queue
adapter tests passed **5/5**. That is component evidence, not proof of the full
chain. At this checkpoint the evidence-integrity guard still blocks two
contaminated published roots, and the root/witness guard still blocks current
release because the schema, pointer and third-party proof inventory do not agree
with the current root.

## Non-goals

No arbitrary provider URLs, secret passthrough, hidden fallback, live spend,
frontend redesign, legal verdict, regulator approval, certification, external
publication, commit, merge or deployment.

## Handoff gates

Hand Claude the schema version, migrations, exact paths, focused test logs,
negative fixtures and operational dependencies. Stop on non-transactional
multi-writer state, self-admission, digest mismatch, secret-bearing receipts,
unbounded execution or any attempt to call witnessed evidence “correct”.
