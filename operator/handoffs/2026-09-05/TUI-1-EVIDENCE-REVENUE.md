# Goal mode — TUI 1: RAS, evidence, remediation and revenue rails

Paste everything below into TUI 1.

```text
GOAL MODE: BACKEND RAS + EVIDENCE + REMEDIATION + REVENUE RAILS.

You own the governed backend path. Do not redesign the website or dashboard, build N-site crawlers, publish datasets/packages, send messages, merge, push or deploy. Codex/root is the sole release coordinator.

Work continuously within your owned branch: inspect, edit, test and document without asking for routine permission. Stop only for an external write, estate signing-key use, payment/spend, account or OAuth change, autonomous schedule activation, destructive action, or an ambiguity that changes the evidence contract.

Read first:
- operator/MASTER-RELEASE-LEDGER-2026-09-05.md
- operator/audits/COUNCIL-OS-RUNTIME-TRUTH-GATE-2026-09-05.md
- docs/handoff/COUNCIL_OS_GSPC_MASTER_BLUEPRINT_2026-09-04.md
- docs/REVENUE-LOOPS.md, treating its dated capability claims as assertions to re-test rather than current truth

OBJECTIVE

Deliver one durable, replayable Request Attestation Service journey that turns a scoped request into evidence, a bounded human-approved repair, a deterministic retest and a downloadable candidate receipt. Then define honest metering around delivered work. Do not sell or imply a grade, regulatory verdict, certification, witness, settlement or successful fix that was not independently verified.

CURRENT VERIFIED BOUNDARY — RECHECK IT

- Central chat can make safe reads, but guarded actions stop at review.
- The action ledger is SINGLE_WRITER_STAGING and reports durable:false; it performs no provider call, worker execution, board write, training or egress.
- /api/receipts/latest is UNPUBLISHED with no settlement-receipt stream.
- Request-attestation exposes a parseable x402 acceptance and corpus preview; no owner-supervised settle/delivery was proven by the current runtime audit.
- RunPod outputs are unsigned UNMEASURED candidates. The GPU is never an admission, signing, root or release authority.
- Signing and OTS preserve exact-byte evidence after work. They neither perform the repair nor prove legal compliance.

WORK PACKAGE A — ONE CANONICAL RAS SPINE

1. Use this work lifecycle and no competing work state machine:
   REQUESTED → SCOPED → OBSERVATION_AUTHORIZED → OBSERVED → CANDIDATE_FINDING → REMEDIATION_PROPOSED → ACTION_APPROVED → REMEDIATED → RETESTED → REPRODUCED → ADMITTED → MEASURED → MONITORED → REOPENED. Read-only observation consent is distinct from action approval; ACTION_APPROVED binds the exact proposal digest and expires when its revision changes.
2. Keep evidence publication as a vector, not later rungs of the work state: signature_state, root_inclusion_state and witnesses[rail] each retain their own exact-byte status and evidence. There is no aggregate WITNESSED flag. Every command carries schema_version, request_revision, idempotency_key, actor, role, timestamp, purpose and separate consent decisions. Every event binds prior_state, next_state, command_digest and event_digest.
3. Replace staging-only state with the repo-appropriate serialized Durable Object or transactional D1 design. Prove authentication, tenant isolation, optimistic/stale revision rejection, idempotent replay, concurrent writers, retry, crash recovery and an application-enforced append-only event history with tamper-evident digest checks. Disclose that the underlying Durable Object or D1 store remains administratively mutable; do not call the storage itself immutable.
4. Keep control-plane roles separate: requester, approver, executor, reproducer, adjudicator, signer and release writer. A single test fixture may model the roles, but the contract may not collapse them.

WORK PACKAGE B — FIRST REAL VERTICAL JOURNEY

Build one deliberately narrow fixture: ingest a malformed or unverifiable card, diagnose the exact deterministic defect, explain it, propose a reversible canonical repair, obtain explicit approval, apply it only in a sandbox, run the same verifier again and issue a downloadable candidate receipt.

Required proof:
- negative path retained, with no receipt or state leap;
- approval binds the exact proposal digest and expires on revision change;
- before/after bytes, tool identity, environment, side effects and rollback are recorded;
- retest uses the named frozen instrument;
- independent replay may agree or disagree without being coerced;
- the result remains CANDIDATE/RETESTED until reproduction and admission occur;
- no production mutation, payment, signing, anchoring, publication or board write.

WORK PACKAGE C — EVIDENCE AND WITNESS TRUTH

Priority regression from the email audit: inspect `CSOAI-ORG/a2a-signed-receipts@daaa2306f3d702082e716e8c8c2504ce7697f29b/interceptor.py` before reusing its contract. `verify_receipt` still returns `(bool, str)`: both INVALID and UNCHECKABLE map to False, while `except InvalidSignature` names an exception that is not imported. Reproduce these cases locally, add a typed VALID/INVALID/UNCHECKABLE result and explicit compatibility handling, and test malformed envelopes, bad signatures, failed resolution and every consuming caller. Recheck current HEAD before editing; no external message should describe this as a proven structured three-state repair until the code and caller tests support that claim.

1. Maintain exact-byte separation between MEASURED, signature_state, root_inclusion_state and witnesses[rail]. One verified rail may not advance another rail or a case-wide status.
2. Inventory OTS artefacts as target path/hash, sidecar path/hash, parser state, calendar state, Bitcoin-attested state and exact-byte match. Preserve PENDING, ORPHANED, INVALID, UNKNOWN and BITCOIN_ATTESTED separately.
3. Require did:web key resolution, signature verification, reproducible Merkle inclusion and bounded card_count. Self-embedded keys are UNCHECKABLE. Never fabricate Rekor, EAS, SCITT or OTS-shaped identifiers.
4. Never clear a stale signature by changing its content ID alone. The signature bytes must verify over the canonical current body under the pinned key.

WORK PACKAGE D — GUIDED DOMAIN TOOL CONTRACTS

Define typed request, evidence, proposed-action, approval, retest and receipt schemas for these packs. Only the card-repair fixture must execute in this lane; the rest may remain explicit PREVIEW/PLANNED contracts with deterministic fixtures.

- Enterprise/GPAI: inventory system/model/harness/version, determine scoped obligations, map evidence gaps, propose a control or configuration change, retest and monitor.
- COBOL/legacy: ingest copybook and job lineage, map fields and controls, propose a sandboxed program/mapping diff, run before/after fixtures and preserve rollback. Never claim the mainframe is certified.
- Bonds, tokenized assets, ledgers and contracts: keep underlying legal instrument, issuer identity, contract/account controls and evidence/witness transactions as four distinct facts. Add versioned ERC-3643/T-REX, XRPL/EVM and document/contract adapter interfaces without deriving reserve quality or legal permission from an on-chain flag.
- Insurance/procurement: produce provenance, control-delta, freshness and uncertainty packs. Underwriters and procurers retain pricing, coverage and award decisions.
- Regulators/public sector: scope jurisdiction and authority, show cited evidence and policy simulation assumptions, support review/appeal/reopening and never impersonate enforcement or legal determination.

WORK PACKAGE E — REVENUE AS DELIVERED WORK

1. Re-probe every revenue rail and classify it VERIFIED, LOCAL_CANDIDATE, OWNER_GATED, UNAVAILABLE or RETIRED. Configuration is not runtime proof.
2. Keep x402 host, resource and sampled-resource censuses on their own denominators. Do not combine them into one market percentage.
3. For each commercial unit, name payer/job, exact deliverable, free preview, completion predicate, metering event, refund/failure behaviour, evidence state and human authority retained:
   - commissioned measurement and separately operated replay; admission remains firewalled and is never purchased;
   - bounded remediation plus retest;
   - monitored change/reopening service;
   - evidence packs and provenance/freshness feeds for enterprises, assessors, procurement and insurance;
   - metered MCP/API actions, only after an owner-supervised settle proves exact artefact delivery;
   - legacy/ledger/domain integration work;
   - learning programmes that issue scoped activity attestations, never accredited certificates.
4. Verification, public board reads, KB atoms and public evidence stay free. Never sell a score, rank, certification, regulator conclusion, token, credit or cash-settled index.
5. Stage npm/x402/account actions only. Owner approval is required for 2FA, publication, wallet use, payment or account changes.

WORK PACKAGE F — CONSENT, PRIVACY AND COST

- Record task use, retention, external egress, model training, publication and marketing consent separately. Training is off by default.
- Do not put private cases, answers or customer evidence into public atoms or shared training without specific rights. Define withdrawal, deletion, retention and immutable-proof disclosures.
- Every execution plan carries a currency-denominated ceiling, GPU/CPU estimate, network-egress class, timeout and cancellation rule. Default external spend for this lane is £0.
- Produce unit economics from observed execution and delivered receipts, not speculative traffic.

DELIVER

1. operator/audits/EVIDENCE-REVENUE-TRUTH-2026-09-05.md
2. a machine-readable RAS state/capability inventory
3. the durable action-ledger design and migration/rollback note
4. the tested card diagnose → approve → sandbox repair → retest → candidate-receipt fixture
5. typed guided-tool contracts for the five domain packs
6. a commercial-unit ledger with capability state, metering point and owner gates
7. exact changed-file manifest, commands, pass/fail output and remaining blockers

ACCEPTANCE GATES

- stale revisions, duplicate idempotency keys and concurrent writers behave deterministically;
- no state can skip its required evidence;
- denial, timeout, crash, rollback and mismatched reproduction remain visible;
- no signature, root or witness state advances without exact-byte verification;
- no public/private data crosses its consent boundary;
- no claim of BFT, compliance, certification, settlement, revenue or completed repair exceeds proof;
- hand off one bounded reviewed change set to Codex/root; do not integrate it yourself.
```
