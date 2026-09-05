# TUI 2 handoff — backend and evidence execution

**Snapshot:** 2026-09-04  
**Worktree:** `/Users/nicholas/clawd/worktrees/council-master-consolidation`  
**Branch:** `codex/council-master-consolidation`  
**Release state:** contracts and staging only; no production executor
**Execution authority:** `docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`

## Mission

Build the missing, auditable execution path between a reviewed user intent and
an admitted GSPC measurement. Each transition must emit immutable evidence and
must fail closed. No frontend state or signature may promote evidence.

**Primary business outcome:** defensible GSPC IP and deliverable measurement
work. The proof is one externally checkable request/receipt chain, not endpoint,
card or worker count.

## Scope and ownership

Own backend/evidence work in:

- `functions/api/evidence-intake.ts`, `report.ts`, `regulator-findings.ts`
- `functions/api/action-jobs.ts`, `provider-canary.ts`, `fabric.ts`
- `functions/api/agentic-fix.ts` and future bounded worker routes
- `scripts/sign_mill_cards.py`, `scripts/card-evidence-trust.mjs`
- `scripts/build-card-matrix.mjs`, `scripts/build-findings-index.mjs`
- `scripts/adapters/witness_queue.py`
- `scripts/badger/csoai-learn.py`
- `contracts/`, `capabilities/` and generated protocol schemas introduced for
  the canonical RAS/capability contract
- corresponding focused tests

TUI 1 owns presentation. Claude owns release/deploy orchestration.

## Current truth

- `public/signed/card-matrix.json`: 1,066 verified legacy records, 0 admitted
  cells, 0 quotable cells.
- `public/signed/findings_index.json`: 0 findings.
- `/api/evidence-intake` verifies and optionally stores a candidate; it starts
  no worker and writes no board or training corpus.
- `/api/action-jobs` is a reviewed-intent/state receipt ledger using LEADS KV.
  It is explicitly `SINGLE_WRITER_STAGING`, with no concurrency guarantee and
  all execution effects false.
- `/api/provider-canary` GET never probes. Authenticated POST can make one
  server-controlled, one-token Hugging Face or RunPod probe and returns an
  `UNMEASURED` operational receipt.
- `/api/agentic-fix` proposes only. There is no production repair executor.
- Witnessing proves digest existence, not correctness, reproduction,
  measurement or compliance.

## Non-negotiable invariants

1. Workflow, evidence, measurement, admission/signature, root, witness,
   approval, consent and payment are orthogonal state dimensions. Only a valid
   independent admission over exact digests can create `MEASURED`; `SIGNED`,
   `ROOT_INCLUDED` and `WITNESSED` remain separate facts.
2. A measurement admission uses `csoai.measurement-admission/0.1`, binds exact
   body/evidence/reproduction/method digests, and verifies under a separately
   pinned adjudicator key.
3. Signing seals an already admitted `MEASURED` body; it never decides status.
4. Cards remain at or below 3,072 canonical bytes.
5. No arbitrary provider URLs, token passthrough, hidden fallback, user prompt
   in a canary, or secret material in receipts.
6. Task use, audit retention, external egress, model training and public
   release are distinct consent fields.
7. Training input is limited to direct, non-symlink rows in
   `_queue/training-admitted`, with explicit `model_training:true`, provenance,
   licence and verified independent admission.

## Execution order

- [ ] First work package: freeze the machine-readable state/command contract,
      create the capability-registry seed and drive one local fixture through
      the durable request boundary before adding another provider or rail.
- [ ] Phase 1: publish one schema/version, legal transition table and generated
      capability registry; then implement transactional request/event storage,
      idempotency, revisions and the bounded executor fixture.
- [ ] Replace KV head/index concurrency with a Durable Object or transactional
      D1 design before enabling more than one writer or any executor.
- [ ] Add a bounded worker that consumes an immutable reviewed job, records
      exact provider/model revision and input digest, and is idempotent.
- [ ] Emit a reproduction receipt containing item I/O, seed, environment,
      method version, timestamps and output digest.
- [ ] Implement a separate admission service/key path; never let the worker or
      board signer self-admit.
- [ ] Phase 2: bind admission, isolated signing, root inclusion and verified
      witness state to the fixture, with exact-byte negative tests.
- [ ] Reduce only admitted, signature-verified cards into the matrix, findings
      and GSPC board.
- [ ] Generate root inclusion evidence, then independently request OTS/Rekor/
      EAS/XRPL witnesses against that exact root digest.
- [ ] Add durable A2A task state/history/artifacts, validated A2UI messages and
      an AG-UI run/tool/state event stream around the same job identity.
- [ ] Phase 3: generate MCP, A2A, AG-UI/A2UI, OpenAPI and the single Hugging
      Face Explorer projection from the proven contract.
- [ ] Research current XRPL Credentials, MPT and permissioned features from
      official sources, then add pinned-ledger read fixtures only. Persist
      `ENABLED`, `SUPPORTED_NOT_ENABLED` and `UNSUPPORTED` separately; do not
      carry the attachment's universal RWA/MPT claim into code or copy.
- [ ] Quarantine the existing XRPL settlement outputs: the tracked sample marks
      all ten rows `MEASURED` despite three fetch errors per row, lacks subject
      and instrument digests, and stores a digest in a signature-shaped field.
      Route replacements through candidate, reproduction and independent
      admission before signing.
- [ ] Replace the two public atom-root OTS stamps whose embedded file digests no
      longer bind the current JSON. Freeze exact bytes, stamp once, then test
      digest binding and pending-versus-Bitcoin state independently.
- [ ] Rebuild SCITT from standards-conformant primitives: genuine COSE_Sign1
      creation and verification, protected issuer/subject claims, current
      `application/scitt-statement+cose` and
      `application/scitt-receipt+cose` media types, SCRAPI fixtures, and receipt
      verification. Existing placeholder vectors are negative fixtures only.
- [ ] Keep learning downstream of explicit training eligibility; do not ingest
      game/report queues or historical corpora.

## Proof of done

```bash
npx vitest run functions/api/evidence-intake.test.ts \
  functions/api/action-jobs.test.ts \
  functions/api/provider-canary.test.ts \
  functions/api/fabric.test.ts
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  scripts.badger.test_csoai_learn
PYTHONDONTWRITEBYTECODE=1 python3 scripts/adapters/test_witness_queue.py
npx vitest run scripts/sign_mill_cards.test.mjs \
  scripts/card-evidence-trust.test.mjs
node scripts/build-card-matrix.mjs
node scripts/build-findings-index.mjs
```

Proof must include one deterministic job replay, one failed/timed-out provider
receipt, one successful configured canary receipt, one reproduced evidence
bundle, one separately signed admission, and a matrix rebuild that changes only
after the admission verifies. Use fixtures or staging credentials; do not spend
or publish during verification.

Also prove stale-revision rejection, concurrent-writer handling, duplicate
idempotency replay, distinct executor/reproducer/adjudicator/signer/publisher
identities, an exact signed-digest inclusion proof, and distinct OTS
`PENDING` versus Bitcoin-verified states. A RunPod or Hugging Face worker must
hold no admission, signing, root, deploy or publishing credential.

It must also reject the current hardcoded XRPL sample, both mismatched public
OTS stamps, an all-zero COSE signature and a copied legacy signature over a new
COSE `Sig_structure`. No SCITT state becomes `WITNESSED` from media type,
submission acknowledgement or an unverified receipt alone.

## Dependencies

- Owner-provided provider credentials and explicit permission for paid probes.
- Durable Object/D1 binding and migration approved by the release lane.
- Independent adjudicator key governance.
- TUI 1 must consume states without inventing transitions.

## Do not claim or deploy

- A canary is not provider coverage, a benchmark, a grade or user inference.
- A stored job is not executed work. A witness is not evidence validity.
- Do not claim autonomous fixes, live A2A tasks, GSPC updates or training until
  the corresponding receipts exist and verify.
- Do not commit, push or deploy from this lane.
