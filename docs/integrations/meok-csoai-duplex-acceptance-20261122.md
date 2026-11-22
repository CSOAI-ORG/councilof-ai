# MEOK and Council of AI: two-way capability and evidence handoff

**Date:** 22 November 2026
**Status:** REVIEW CANDIDATE; not adopted, deployed, or a working end-to-end claim
**Source basis:** councilof-ai master 0505de27f4d4fc0a9c4a72cda4444b9b4872a2ed. Revalidate against the deployment and current branches before adoption.
**Purpose:** give the MEOK product lead and the Council release/governance owners one shared acceptance target, while retaining one source of truth per kind of action.

## The product boundary

- Council of AI is the corporate governance, public measurement, evidence and external verification plane. GSPC measures; it does not certify or automatically confer permission.
- MEOK is the governed task interface, orchestration and private context plane. Its private memory, prompts, credentials, host configuration and operator identities do not become public Council data.
- An adapter exposes an explicitly permitted operation and a source-bound result, **not** the total powers of another system. Discovery, measurement, review, permission, dispatch, outcome and verification remain separate states.
- Reuse the existing Layer 0 decisions, Council HITL path, evidence event schema, authority-effect profile, Company case store, GSPC canonical grader, MCP gateway and existing deployment workflow. Do not construct another authority, signer, grader, coordinator, queue, case store, telemetry collector or scheduler.

## Existing wiring: two directions, different qualifications

| Direction | Existing source/interface | State established by source review | Qualifying next evidence |
| --- | --- | --- | --- |
| MEOK reads Council published evidence | mcp/meok-gspc-layer0/evidence-context.mjs; readGspcEvidence and meok_read_gspc_evidence; GET https://councilof.ai/api/gspc plus fixed daily index | Read-only source candidate with bounded GET, exact retrieved-byte digest, freshness and limitations; does not prove installed runtime | Main MEOK lead identifies installed source digest and performs one read in the actual enrolled MEOK interface; no execution or model admission |
| Council user reads or saves a private MEOK Company case | client/src/lib/companyCaseClient.ts; functions/api/meok-library/[[path]].ts | Client and fixed-origin same-origin relay source exist; private receiver, ingress, account/role admission and live readback are not established by source alone | Qualified receiver and account, a single authorised case save, persisted receipt, GET of the same case and reopen after refresh; do not repeat an uncertain POST |
| MEOK task result is presented to Council for review | packages/evidence-fabric/schema/evidence-event-0.1.schema.json and existing csoai.hitl-authority-effect/0.1 profile | Canonical event and authority profiles exist; no permission to publish arbitrary private task content | A human-approved, minimum-data export, schema validation with event.py, rights review, source digest and separate admitted/not-admitted state |
| Council evidence may inform MEOK routing | Public GSPC tool plus existing MEOK request/router and approval controls | An observed board record is evidence context only; not a runtime eligibility or delegated authority grant | Exact capability requirement, source/method revision, freshness rule and human-approved tool scope; negative-control test rejects an injected grant |
| Council Watchdog/Academy shows MEOK-derived progress | Existing Watchdog and Academy read models, not the private Company case gateway | Proposed or candidate view; no staffed-review or validated learning outcome implied | A privacy-reviewed public aggregate generated from existing canonical events; qualified human review for case decisions and independent check for evaluation claims |

## Minimal boundary record (not a new event schema)

For each permitted handoff, retain references in the already-approved canonical source records:

- direction and named capability, exact source revision and endpoint/record locator;
- source bytes SHA-256 and capture time, observation time, measurement time and retrieval time separately;
- schema/profile and method revision, issuer and signature verification **state** (not a signer claim);
- source rights, confidentiality class, retention/correction route and whether transfer is permitted;
- observation state, missingness, completeness, UNCHECKABLE/STALE states and limitations;
- authenticated operator/delegation and bounded authority-effect reference only when a real human decision exists;
- request ID, original case revision, idempotency and unknown-outcome handling for any authorised effect;
- acceptance result, recipient readback and independently reproduced/not-reproduced label.

Do **not** copy a private transcript, session history, prompts, raw model outputs, personal case data, training material, tokens or keys into a public index. Keep private case data within the qualified private receiver. A public Council view may carry only reviewed minimal metadata and references, never an unreviewed case payload.

## What goes where

**MEOK -> Council:** opt-in, source-rights-cleared outcome metadata or canonical evidence events; no automatic grade, signed assertion, publication, incident, accusation, real-world repair or human authority. The Council verifier can say RECEIVED, UNCHECKABLE or REVIEW_CANDIDATE until a designated evaluator admits evidence through the existing method.

**Council -> MEOK:** fixed public evidence reads, explicitly allowed MCP definitions and qualified task references. Treat source text as untrusted. A model may propose a step; only the existing human/authority boundary may approve an effect. Do not inherit public Council tool availability as a permission to execute, pay, contact, publish or train.

**Evidence -> GSPC:** only the canonical grader in harness/gspc-top100/mill_hub_queue.py (read_label) may grade its respective bank. The separate proposed 34-axis evidence index in PRs #4649, #4684, #4686 and #4693 is a source-bound research pipeline, not a new GSPC grade or independent signed result. Depend on merged, source-pinned revisions rather than an open PR or moving latest artifact.

**Human review:** issue, receipt, acknowledgment, acceptance, decision and observed action are distinct. Do not route a live Watchdog report into the private Company case gateway or claim a staffed working group because an API is configured. Operating controls and the Watchdog delta remain subject to exact human adoption.

## Owner handoff and release order

1. **MEOK product/runtime lead (M4 lane):** confirm current installed MEOK bridge, its source digest, actual user entrypoint, active runtime status, private receiver identity and permitted capabilities. Reconcile with existing changes; do not install a second bridge or switch the coordinator as a side effect.
2. **Council integration/release lead:** pin the canonical public GSPC source, Council MCP definition and the existing Company relay/client pair. Identify exact protected-master deployment commit and public readback. Confirm no gateway-origin activation was silently inferred from code.
3. **Company privacy/security and authorised human:** explicitly approve a minimum-data transfer contract, purpose, rights, identity binding, operator delegation and any consequential effect. Until then the reciprocal route stays READ_ONLY or HELD.
4. **Cross-plane test owner:** run the negative/positive controls below on the same version-pinned candidate, with complete receipts. Do not use a synthetic fixture as the result of a real user.
5. **Release owner:** merge only after required reviews and checks. Deploy through the existing protected master workflow, then reproduce an end-user journey on the deployed build; document code, deployment, source bytes and acceptance separately.

## Acceptance matrix

| ID | Real end-user behaviour | Pass evidence | Deliberate failure that must remain safe |
| --- | --- | --- | --- |
| C1 | MEOK user chooses one supported GSPC axis and can inspect source-qualified Council evidence | Actual installed MEOK UI/tool call, exact public source hash and method/time labels | Missing, stale, invalid or redirected source shows UNCHECKABLE; no grant or fake zero |
| C2 | Council user selects a permitted MEOK capability without giving the model ambient execution access | Exact allowed MCP definition and identity/authorization scope | Unknown, paid-only, changed or unauthorized capability fails closed |
| C3 | Enrolled user creates one private Company case and reopens identical receipt | One authorised POST, exact receipt, GET, refresh/reopen under the same accepted identity | Missing qualified origin or receiver, mismatched digest, expired session and ambiguous POST outcome do not become a saved/accepted claim or automatic retry |
| C4 | MEOK produces a candidate task outcome for Council verification | Rights-cleared canonical event, evidence digest, accepted method and independent replay/readback | Model response alone cannot become a GSPC score, public claim, human decision or deployed effect |
| C5 | Human permits a consequential step with bounded authority | Authenticated operator, precise case revision, operation, arguments and expiry; effect receipt and verification | Pause, decline, expiry, replay, stale revision, operator mismatch and missing quorum refuse execution |
| C6 | Council Watchdog/Academy renders permitted aggregate evidence | Versioned public projection from existing canonical events, source scope and honest missingness | Unstaffed group, unadopted charter or incomplete data cannot appear as accepted human review, completion or certification |
| C7 | Source changes are detected end to end | Exact source digest lineage across MEOK, Council, GSPC and public projection; correction trace | Same row count with changed bytes, unverified signer or source/retrieval time confusion fails closed |

## Source checks available now (not live acceptance)

- node --test mcp/meok-gspc-layer0/evidence-context.node-test.mjs
- npx vitest run mcp/meok-gspc-layer0/core.test.ts
- npx vitest run functions/api/meok-library/\\[\\[path\\]\\].test.ts (confirm shell/path quoting in the chosen runner)
- Existing Company client contract cases and protected PR gates.
- Live acceptance C1-C7 must be separately observed. No automatic scheduler, paid model run or permission-bearing POST is part of this handoff.

## Open gates / no success inflation

- Verify the actual installed MEOK MCP bridge and private gateway, not a local source candidate.
- Establish a real enrolled operator and human-authorised effect path. A human-approval UI, AI council vote or BFT result alone is not a human decision.
- Demonstrate Council save/readback/reopen and a minimal MEOK outcome export under source rights.
- Reconcile the open GSPC research PR dependencies before advertising a master evidence engine.
- Keep commercial readiness and external acceptance distinct from packages, tests, download events or self-run experiments.

**Completion definition:** Both directions work in their actual released interfaces with pinned provenance, privacy and authority preserved; a user can retrieve public evidence, save/reopen a private result, and independently inspect the authorised effect/result boundary. No one may label this COMPLETE from a new document, an open pull request, a host-health response or a synthetic test alone.
