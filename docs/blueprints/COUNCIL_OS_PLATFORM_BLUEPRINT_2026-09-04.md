# Council OS platform and business blueprint

**Decision date:** 4 September 2026

**Evidence horizon:** local work and Git history from approximately 6 June to 4 September 2026

**Repository snapshot:** branch `codex/council-master-consolidation`, base HEAD `cd4b068684def92a7054938eb4da6d1c827853ca`

**Document status:** internal product decision record; proposed architecture, not a release claim or deployment authorization

**Canonical public wording:** measurement, not certification

**Execution authority:**
`docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`. This
document is the detailed product/business reference. Where an illustrative
lifecycle or historical note differs, the master document's orthogonal state
contract and release gates control implementation.

## Executive decision

Council OS should be built and marketed as the open, vendor-neutral operating system for turning an AI, agent, software system, public incident, benchmark, or regulated asset from **unmeasured** into **scoped, evidenced, independently reproduced, admitted, signed, published, and correctable**.

The user should experience one simple loop:

> Ask Council OS what needs to be checked → approve the scope and data use → let it gather and run the evidence it is authorized to use → inspect what was and was not measured → approve any proposed remediation → retest → receive a compact verifiable record and an ongoing change watch.

That is the coherent product hidden inside the existing estate. The website, dashboard, API, MCP server, Hugging Face Space, browser extension, local runner, enterprise connectors, legacy adapters, and ledger adapters must all be doors into that same request and evidence lifecycle. None may create its own score, verifier, state vocabulary, root, or trust claim.

The commercial category is **measurement and evidence operations**, not “trust as a service,” automated certification, a paid grade, or a generic compliance chatbot. Trust is an outcome a relying party may form after checking evidence; it is not a unit Council OS can sell.

The ambition to become the leading governance platform is sound, but it must be stated as a measurable goal rather than a present claim:

> Become the default independent evidence rail used by AI builders, enterprises, assessors, platforms, and public-interest users to request, reproduce, publish, verify, correct, and monitor AI measurements.

Leadership is earned when independent parties reproduce the work, use the records in real decisions, and continue to do so. Model-count, route-count, package-count, and self-issued cards are supporting inventory, not the north-star proof.

## Status legend and evidence discipline

This document uses five labels.

| Label | Meaning |
| --- | --- |
| **OBSERVED — COMMITTED** | Present in local Git history at the cited commit. This does not by itself prove the code is deployed or the service is reachable. |
| **OBSERVED — WORKTREE** | Present in the 4 September consolidation worktree but uncommitted or modified. It is design/build evidence, not released capability. |
| **HISTORICAL** | A prior decision or implementation that explains the estate but has been superseded or conflicts with newer doctrine. |
| **PROPOSED** | The canonical product or architecture decision recommended by this blueprint. It does not exist until implemented and evidenced. |
| **OWNER GATE** | Requires an explicit owner, legal, credential, spend, external-contact, or production decision. |

The restricted defence compartment was reviewed only for boundary enforcement. No restricted designs, customer material, operational detail, or internal defence codenames are imported here. The only general governance pattern retained is separation of builder, evaluator, adjudicator, signer, and relying-party authority.

## 1. What exists now

The strongest current facts are not the historical “22/22” headline. They are the new fail-closed boundaries that make a defensible product possible.

| Area | Current evidence-backed state | Consequence |
| --- | --- | --- |
| Council OS shell | **OBSERVED — WORKTREE.** The consolidation makes the dashboard the single shell: left navigation, conversation and tool canvas, persistent composer, and workspace context. Former workspace-shaped routes redirect into it. [E01] | Keep the one-shell decision. Do not release it as “complete” until the current dirty worktree passes the release lane. |
| Public route estate | **OBSERVED — WORKTREE.** The current App file contains 355 Route declarations. The consolidation reduces the dashboard from 21 permanent destinations across six groups to ten customer jobs across three groups; specialist destinations remain discoverable through **All tools**. [E02] | Treat most routes as an indexed library, campaign landing page, or redirect. They are not separate products and should not compete in primary navigation. |
| Evidence lifecycle | **OBSERVED — WORKTREE.** The frontend vocabulary separates OBSERVATION or REPORTED from CANDIDATE_FINDING, REPRODUCED, MEASURED, SIGNED and ROOT_INCLUDED; WITNESSED is explicitly orthogonal. [E03] | Adopt this as the product’s semantic spine and extend it into a durable request state machine. |
| Candidate intake | **OBSERVED — WORKTREE.** The evidence-intake endpoint verifies one signed candidate of at most 3,072 bytes and can store it only with separate network-submission consent. It starts no worker and cannot publish, train, witness, or write GSPC. [E04] | This is a good fail-closed intake boundary, not yet an automated measurement service. |
| Action execution | **OBSERVED — WORKTREE.** The action-job endpoint stores immutable intent/events/receipts but declares SINGLE_WRITER_STAGING, no concurrency guarantee, no provider call, no worker, no external egress, no board write, and no training. [E05] | Durable transactional storage and a bounded worker are P0 before any “takes care of everything” claim. |
| Provider access | **OBSERVED — WORKTREE.** Hugging Face and RunPod adapters are fixed one-token authenticated canaries. GET does not probe; POST results are UNMEASURED operational receipts. [E06] | Catalogue, configuration, reachability, executability, a completed run, and a measurement must remain different states. |
| Capability estate | **OBSERVED — COMMITTED on another local ref.** The 4 September capability inventory found 67 OpenAPI paths, 12 MCP tools of which 10 appeared nowhere else, and five A2A skills that appeared nowhere else: 84 discovered entries with zero useful cross-door convergence. Commit `b7750e4c64a3127cbf8a89d4cd32772ebac867e5` added a first registry and drift guard. [E07] | Make one typed capability registry authoritative and generate every protocol view from it. The first registry is an inventory seed, not yet a production-quality contract. |
| Signed-card inventory | **OBSERVED — WORKTREE.** The current fail-closed matrix reads 1,066 signature-valid historical records, classifies all 1,066 as LEGACY_UNADJUDICATED, and admits zero cells, zero models, zero axes and zero quotable cells. The findings index contains zero findings. [E08] | Preserve the historical records, but do not use them for rankings, findings, training, or current measured coverage until separately admitted. |
| GSPC board | **CONFLICTING.** The committed serving code declares 22 axes and says all 22 are measured. The new matrix reducer requires a separately signed independent admission and currently admits none. The historical card inventory also contains 28 axis labels, showing taxonomy drift. [E09] | Freeze the 22-axis vocabulary as the declared instrument registry, archive the legacy board snapshot, and derive current measured status only from admitted cards. Do not publish “22/22 measured” from the static module after this migration. |
| Admission and signing | **OBSERVED — WORKTREE.** The signer now expects a `csoai.measurement-admission/0.1` envelope, binds body, evidence, reproduction and method digests, and requires a separately pinned adjudicator key distinct from the board signer. [E10] | This is the correct separation of duties. It still needs a real independent admission service and key-governance process. |
| RAS endpoint | **OBSERVED — COMMITTED.** The current paid request-attestation endpoint commissions a receipt, signs it only when the board key is configured, and re-serves cards already on file. Its own payload says a paid request never creates a fresh MEASURED cell; fresh_run remains UNMEASURED. [E11] | Keep the endpoint honest, but do not confuse it with the full Request Attestation Service described below. Version or rename the present operation as “commission receipt” during migration. |
| Incident reporting | **OBSERVED — COMMITTED and modified in the worktree.** The report endpoint returns a digest-bound REPORTED acknowledgement, does not echo sensitive text, and explicitly says no automatic triage, measurement, training, witness, or board write occurred. [E12] | This is the correct public-watchdog intake boundary. The downstream case workflow is still missing. |
| Measurement commerce | **OBSERVED — COMMITTED, deployment not established here.** The latest doctrine says open source, no Stripe, no public price grid, free verification, no sold rank, and metered evidence operations through x402 or enterprise invoice. Code exists for challenges, settlement, commission receipts, evidence bundles, evidence feeds, witness requests and paid MCP wrappers. [E13] | Use this as the current commercial doctrine. Treat settlement configuration, real receipts, and a paying external customer as unproven until separately observed. |
| Plugins | **OBSERVED — COMMITTED.** There are MCP, HTTP, browser, extension, plugin and OpenAPI paths, all intended to print the same board and use the same three-state verifier. The plugin audit also identifies verifier-family and root-scope disagreements. [E14] | Keep thin adapters; fix shared verification and generate their declarations from the capability registry before adding platforms. |
| Hugging Face | **OBSERVED — LOCAL DOCUMENTATION, fresh runtime not checked in this blueprint.** The plan is one CSOAI organisation, one GSPC Space, Hub datasets/cards, and a queue whose discovered models remain UNMEASURED. Official Community Evaluation participation is described as allow-list dependent. [E15] | Hugging Face is the public discovery, model intake and demonstration surface. It is not the signing authority, evidence database, or brand identity. |
| Benchmarking the benchmarkers | **OBSERVED — COMMITTED.** The benchmark-quality register evaluates ten third-party benchmarks against 21 deterministic disclosure/process predicates: 83 PASS, 76 FAIL and 51 UNKNOWN across 210 checks, with no composite score. A separate Rating the Raters experiment reproduces one ARC-AGI-2 human-baseline claim and reports a 10.8 percentage-point protocol gap. [E16] | This is a credible product wedge, but it is not yet a general benchmark market, a regulator ranking, or proof that GSPC itself is superior. |
| COBOL and legacy | **OBSERVED — COMMITTED documentation.** A read-only `cobol.legacy` card is specified for copybook, CICS, JCL, VSAM, source hash and regulatory-control observations. The package explicitly says “In build,” and the Pages surface is a landing page rather than a measured mill. [E17] | Keep as an industry adapter. Replace the older prototype’s weak signature and simplistic “compliance” logic; never let parsing alone fill a GSPC axis. |
| Tokenized evidence | **OBSERVED — COMMITTED DRAFT HOLD.** The tokenized-attestation passport proposes tokenizing only a pointer to a card hash and the root that includes it, never a model, grade, score, or conformity claim. [E18] | Keep the proof-pointer pattern. Add ERC-3643/T-REX and other asset rails as subject/eligibility event adapters, not as truth authorities. |
| Timestamp and interoperability ceremony | **OBSERVED — COMMITTED artifacts.** The estate contains a corrected Layer-0 ceremony with a detached OTS file, a batched atom root, and a SCITT/CCF data-hash vector. One correction commit explicitly removed an invented rail. [E19] | Preserve one root and distinct witness statuses. A detached stamp, pending timestamp, Bitcoin attestation, transparency-log receipt, and chain memo must never collapse into “anchored.” |
| Training | **OBSERVED — COMMITTED plus WORKTREE safeguards.** Existing quests cover regulation and sector scenarios; newer code makes game activity optional candidate evidence only and restricts training input to explicitly consented, licensed, independently admitted rows. [E20] | Sell role-specific learning and completion attestations, never automated certification. Keep user learning data out of model training unless separately opted in and admitted. |

### The central reconciliation

For product and marketing purposes, use this rule immediately:

> **The 22 axes are a declared measurement vocabulary. The current admitted public measurement matrix is empty until independent admissions exist.**

This preserves the intellectual structure without promoting legacy signatures into evidence they do not establish. The 1,066 records remain a valuable migration corpus and public history. They are not discarded; they are reclassified honestly.

## 2. North star, mission and measurable goal

### North star

**Council OS makes consequential AI claims independently checkable.**

It does this by turning each claim or concern into a governed request whose scope, sources, method, run, reproduction, admission, signature, publication, witnesses, correction history, consent and limitations can be inspected separately.

### Twelve-month goal

By September 2027, Council OS should be able to demonstrate:

1. A third party can move a real system or model through the complete request lifecycle without privileged access to Council infrastructure.
2. At least ten independent organisations have reproduced a published method or verified a record.
3. At least five paying design partners use a recurring evidence cadence across at least three industry packs.
4. At least three external AI platforms can invoke the same governed capabilities through generated adapters without semantic drift.
5. All public measured claims are derived from separately admitted records; all corrections and supersessions are visible.
6. Public users and regulators can verify records and file concerns without payment or an account.

These are proposed targets, not forecasts.

### North-star metric

Count **monthly independently admitted measurement outcomes that are consumed by an external relying party**.

An outcome counts once only when:

- its method and subject version are fixed;
- a reproduction receipt exists;
- an independent admission verifies;
- the signed record is publicly or privately delivered to an authorised relying party;
- that relying party’s use is recorded without claiming the party endorsed Council OS.

Do not optimise for raw cards, model listings, requests submitted, tokens, route count, or signatures. Those are activity metrics and are easy to inflate.

### Guardrail metrics

- zero paid outcome changes;
- zero measurement promotions by the worker, signer, UI, payment rail, game, report intake, or witness;
- zero public claims without a current evidence reference;
- zero sensitive-report content in public receipts;
- zero model-training use without distinct consent, licence and admission;
- median time to correct or supersede an invalid public record;
- percentage of capability declarations whose runtime state is observed and current;
- percentage of industry-pack obligations pinned to a primary source and effective date.

## 3. Product ontology and positioning

The estate needs one public semantic hierarchy.

| Name | Canonical meaning | It is not |
| --- | --- | --- |
| **CSOAI Ltd** | Legal operator and contracting entity. | The measurement result or regulator. |
| **Council of AI** | Public institution and brand under which methods, evidence, corrections and tools are published. | A statutory authority or accredited conformity body. |
| **GSPC** | Versioned measurement standard and axis registry. | A universal compliance score. |
| **Council OS** | Conversational product and workflow through which people and agents request, inspect, improve and monitor evidence. | A second standard or separate board. |
| **Request Attestation Service (RAS)** | The governed orchestration contract that owns request identity, scope, approvals and lifecycle receipts. | The current paid commission receipt alone. |
| **Instrument** | Frozen method, test bank, scorer, environment requirements and limitations for one measurable claim. | An industry pack or legal conclusion. |
| **Industry pack** | Versioned mapping of roles, obligations, evidence requirements, connectors and training onto the stable axis registry. | A new axis, a certification scheme, or a substitute for counsel. |
| **Measurement card** | Compact, content-addressed record of an admitted measurement body and its limitations. | Proof that the subject is safe, legal, correct or approved. |
| **Public root** | One append-oriented Merkle publication root for eligible signed records. | The measurement authority. |
| **Witness** | Independent evidence that a specific digest or root existed or was logged at a time. | Reproduction, admission, correctness or legal weight. |
| **Corrections ledger** | Append-only record of disputes, corrections, revocations and supersessions. | Deletion of inconvenient history. |
| **Open Tool Commons** | Curated catalogue of open tools and governed wrappers with licences, versions, permissions and runtime evidence. | A claim that every listed tool is safe or operational. |
| **Hugging Face Space and platform plugins** | Distribution and interaction channels that call the same Council APIs. | A parallel product, authority or database. |

### The external message

The clearest one-sentence homepage proposition is:

> **Turn an AI claim into evidence anyone authorised can check.**

Supporting line:

> Council OS scopes the request, gathers the permitted evidence, runs a published method, keeps independent human judgment at the consequential gates, and produces a signed, correctable measurement record. It measures; it does not sell a grade or pretend to certify.

Three primary calls to action:

1. **Verify a record — free**
2. **Request a measurement**
3. **Report an incident — free**

“Sovereign” should be demonstrated through deployability and data control, not used as an undefined adjective. The product must offer browser-local, customer-managed, on-premises and managed execution modes with the same receipt contract. Data location, egress, keys and retention must be explicit per request.

### The internal category analogy

Hugging Face is a useful analogy for distribution and community contribution: models, datasets, Spaces, cards and open tools are discoverable in one place. Council OS should occupy the adjacent governance layer: instruments, evidence, reproductions, admissions, cards, corrections, packs and integrations are discoverable and reusable.

Do not copy Hugging Face’s information architecture or design. Do not describe Council OS as “Hugging Face but governed” in final customer copy. The differentiated category is an **open measurement and evidence operating system**.

## 4. Demographics, jobs and decision rights

The user’s “demographics” are better expressed as roles with jobs, evidence rights and commercial relationships. One person may wear several roles.

| Role | Job to be done | Council OS entry | Output | Commercial posture |
| --- | --- | --- | --- | --- |
| Affected person or member of the public | Explain what happened, preserve a record, understand relevant rules, request review, follow correction and appeal. | Watchdog conversation or report form. | REPORTED receipt, case timeline, sources, referral options, later admitted finding if one is independently established. | Free. Never sell or train on a complaint by default. |
| AI builder or model provider | Learn which claims can be measured, supply exact versions and evidence, find gaps, fix them, retest, publish a reproducible record. | Ask or Request measurement. | Scope, evidence request, run/reproduction bundle, signed card, correction path. | Pays for execution, assembly, cadence and private operations; never for a favourable outcome. |
| Enterprise AI owner | Maintain an inventory, prove controls, manage vendors, approve remediation, and export evidence to internal governance. | Enterprise workspace and connectors. | System evidence graph, task ledger, packs, records, monitoring and change receipts. | Design-partner or managed-cadence contract; invoice or machine-metered rail. |
| Risk, legal, compliance or audit lead | Map obligations to controls and evidence, see omissions, assign owners, review changes and export a defensible pack. | Evidence and Standards views. | Versioned obligation map, evidence index, limitations, OSCAL-style export, correction record. | Buyer or approver. Legal conclusions remain theirs or counsel’s. |
| Independent assessor or researcher | Reproduce the method, challenge a record, submit a signed reproduction, and inspect conflicts. | Reproduce/Challenge workflow. | Reproduction receipt, admission input, public credit where consented. | May be contracted under a fixed method; cannot be paid based on outcome. |
| Regulator, ombudsman or public authority | Inspect evidence and changes, request additional material, compare methods, receive machine-readable exports. | Regulator view or API. | Read-only evidence, source mapping, case export, corrections and audit trail. | Verification and public-interest access free. No endorsement implied. |
| Insurer, broker or risk engineer | Turn system characteristics and controls into current evidence for underwriting or loss-prevention decisions. | Insurance pack. | Evidence pack, change feed, control observations, limitations, retest cadence. | Pays for evidence operations; insurer owns underwriting decision. |
| Bank, payments, bond or tokenized-asset operator | Bind asset/system identity, eligibility, custody, reserve and distribution evidence to a verifiable record. | Financial/tokenized-assets pack and connectors. | Asset evidence card, event receipts, proof pointer, root inclusion and witnesses. | Pays for assembly, refresh and monitoring; Council does not authorize transfer or settlement. |
| Mainframe/legacy-system owner | Understand COBOL, copybook, CICS, JCL and data-control exposure without risky core changes; govern modernisation and agent access. | Legacy pack and read-only sidecar. | Source inventory, hashes, control/evidence map, proposed change plan, retest receipts. | Integration and evidence cadence; customer approves every production change. |
| Benchmark operator or procurement team | Inspect whether a benchmark discloses leakage controls, scorer, uncertainty, environment, funding, corrections and independent reproduction. | Benchmark Quality / Rating the Raters. | Predicate register and reproduction record, never a composite grade. | Public base register; paid fixed-scope reproduction or private portfolio monitoring. |
| AI platform, agent or developer | Discover callable capabilities, request work, track it asynchronously, receive artifacts, and verify them natively inside the host platform. | MCP, A2A, OpenAPI, SDK, extension or app. | The same request, job and evidence receipts as the web product. | Free reads and verify; metered execution/assembly. |
| Open-source maintainer | Make a tool discoverable and usable through a governed wrapper without surrendering its identity or licence. | Open Tool Commons contribution path. | Capability entry, provenance, test evidence, runtime state and attribution. | Open contribution; optional support/integration agreement, never pay-to-trust. |

### Decision-rights firewall

| Decision | Accountable party |
| --- | --- |
| Define and version an instrument | Instrument maintainer with public change record |
| Authorise input, egress, spend or a system change | Subject owner or delegated enterprise approver |
| Execute a run | Bounded worker under the authorised request |
| Reproduce a run | Separate assessor or independently operated worker |
| Admit a measurement | Independent adjudicator under a pinned key and published policy |
| Sign an admitted body | Board signer; signing cannot change status |
| Publish into the canonical root | Single publisher |
| Witness the root | External witness/log/ledger |
| Decide legal conformity | Qualified assessor, counsel or competent authority |
| Decide underwriting | Insurer |
| Decide asset eligibility or transfer | Issuer, transfer agent, regulated intermediary or governing contract |
| Approve a remediation deployment | System owner |
| Appeal or challenge | Subject, affected party or authorised reviewer; resolved under correction policy |

This is the meaningful human-in-the-loop design. A human is not merely shown an AI recommendation; a named human or independent role owns the consequential transition and signs or records it.

## 5. The canonical Attestation Request

### Why a single ladder is insufficient

One request has several independent dimensions. Payment can settle while evidence remains UNMEASURED. A record can be SIGNED but not independently admitted. A digest can be WITNESSED while the claim is false. A run can be technically complete while its public-release consent is denied.

RAS therefore needs one request identity with five orthogonal tracks:

1. **workflow_state** — coordination and execution;
2. **evidence_state** — epistemic status of the claim;
3. **publication_state** — signature, root and delivery;
4. **consent_state** — allowed uses and egress;
5. **commercial_state** — quote, payment or invoice, which never promotes evidence.

### Proposed request envelope

Every request should include:

| Field group | Required contents |
| --- | --- |
| Identity | request_id, schema version, created_at, requester, subject_id, subject_kind, exact subject digest/version |
| Purpose | human-readable job, relying parties, intended decision, prohibited uses |
| Scope | selected instrument versions, relevant axes, industry packs, jurisdictions, effective dates, acceptance criteria |
| Inputs | evidence references and hashes, source authority, classification, retention, licence |
| Authority | scopes, approvers, approval expiry, maximum cost, allowed providers, allowed egress and regions |
| Consent | separate booleans or grants for task use, storage, audit retention, external egress, public release, model training and contact |
| Execution | capability_id/version, worker identity, environment/revision, seed, timeout, idempotency key |
| Results | observations, item-level I/O or protected reference, limitations, output digests |
| Reproduction | reproducer identity, method/body/environment digests, result and discrepancy |
| Admission | exact bound digests, policy version, adjudicator identity/signature, decision and reason |
| Publication | card hash, signer, root, inclusion proof, delivery permissions |
| Witnesses | channel, requested digest, status, receipt, observed time; no inferred truth |
| Correction | dispute, response, supersedes/superseded_by, revocation and appeal records |
| Commercial | SKU/cadence, quote or 402 challenge, settlement/invoice reference, no outcome field |

### Proposed state machine

The canonical workflow is:

    DRAFT
      → SUBMITTED
      → TRIAGED
      → SCOPE_PROPOSED
      → AUTH_REQUIRED
      → SCOPE_LOCKED
      → QUEUED
      → RUNNING
      → EXECUTION_COMPLETED
      → REPRODUCTION_PENDING
      → ADMISSION_PENDING
      → DELIVERY_READY
      → DELIVERED
      → MONITORED

Alternative and terminal workflow states are:

- **INPUT_REQUIRED** — missing subject, version, evidence or owner answer;
- **REJECTED** — request is outside authority, unsafe, unlawful, unsupported or conflicts with policy;
- **UNCHECKABLE** — required evidence or external system cannot currently be checked;
- **FAILED** — bounded execution failed; a failure receipt must exist;
- **CANCELLED** — requester or authorised operator stopped it;
- **EXPIRED** — authority, consent, instrument or evidence freshness expired;
- **DISPUTED** — a challenge is open;
- **SUPERSEDED** — a later request/card replaces it without deleting history;
- **REVOKED** — a signing/admission/subject condition requires explicit withdrawal from current use.

The evidence track begins separately:

    OBSERVATION or REPORTED
      → CANDIDATE_FINDING
      → RUNTIME_OBSERVED
      → REPRODUCED
      → MEASURED

Rules:

- **REPORTED** means an account was received, not verified.
- **CANDIDATE_FINDING** means the claim is sufficiently scoped to test, not true.
- **RUNTIME_OBSERVED** means a particular executor produced a receipt, not that the method was reproduced.
- **REPRODUCED** requires an independently operated rerun or an explicitly defined independence policy.
- **MEASURED** requires a valid independent admission over exact body, evidence, reproduction and method digests.
- **REPRODUCED** is an evidence state; **MEASURED** is a measurement state;
  **ADMITTED/SIGNED** are credential states; and **ROOT_INCLUDED** is a root
  state. They may unlock later workflow transitions, but are not themselves
  workflow states.
- **WITNESSED** is always an orthogonal collection of witness facts.

### Transition authority

| From → to | Required evidence | Who may cause it |
| --- | --- | --- |
| DRAFT → SUBMITTED | Valid request envelope and purpose | Requester |
| SUBMITTED → TRIAGED | Scope/risk/authority classification receipt | Council policy service plus reviewer where required |
| TRIAGED → SCOPE_PROPOSED | Instrument and pack resolution with citations | Planner |
| SCOPE_PROPOSED → SCOPE_LOCKED | Exact digests, permissions, cost/egress display, approval | Subject owner or delegate |
| SCOPE_LOCKED → QUEUED | Durable idempotent job persisted | Request service |
| QUEUED → RUNNING | Worker lease and immutable start receipt | Bound executor |
| RUNNING → EXECUTION_COMPLETED | Output, logs, environment and failure/complete receipt | Bound executor |
| CANDIDATE/RUNTIME → REPRODUCED | Independent rerun bundle and discrepancy analysis | Reproducer |
| REPRODUCED → MEASURED | Valid admission envelope under independent pinned key | Adjudicator only |
| MEASURED → SIGNED | Signature over exact admitted body | Signer only |
| SIGNED → ROOT_INCLUDED | Inclusion proof under current canonical root | Single publisher |
| Any published state → DISPUTED | Signed or authenticated challenge | Subject/affected/reviewer role |
| DISPUTED → SUPERSEDED/REVOKED | Adjudicated correction record | Correction authority under published policy |

### Remediation loop

Remediation is a related workflow, never a silent mutation of the measured record:

    GAP_OBSERVED
      → REMEDIATION_PROPOSED
      → IMPACT_SIMULATED
      → HUMAN_APPROVAL_REQUIRED
      → CHANGE_AUTHORISED
      → CHANGE_EXECUTED
      → CHANGE_VALIDATED
      → RETEST_REQUESTED
      → new measurement request

The old card remains. The new card cites the change set and supersession relationship. High-risk or external changes always require a fresh human approval. Low-risk operations may use a standing policy approval only if its scope, expiry, cost ceiling, rollback and excluded actions are explicit.

## 6. Canonical business semantics and data model

The semantic graph is the moat because it lets one piece of evidence serve several authorised workflows without changing its meaning:

    Regulation source
      → provision
      → obligation
      → role and jurisdiction
      → control objective
      → testable predicate
      → instrument
      → evidence request
      → observation
      → reproduction
      → admission
      → measurement card
      → root inclusion and witnesses
      → decision by relying party
      → remediation
      → training scenario
      → retest
      → correction/supersession

### Core entities

| Entity | Immutable identity | Mutable/current view |
| --- | --- | --- |
| Subject | subject_id plus version/digest | Owner, labels, current version pointer |
| RegulationSource | source URL/document digest, edition, effective interval | Current/superseded marker |
| Obligation | provision digest and jurisdiction | Applicability interpretation with reviewer and date |
| Instrument | instrument_id, semantic version, bank/scorer/environment digests | Current recommended version |
| IndustryPack | pack_id, version, source set, mapping digest | Effective/current status |
| Capability | capability_id and version | Runtime observations by protocol/provider |
| AttestationRequest | request_id and original envelope digest | Append-only event head |
| ConsentGrant | consent_id, purpose, scope, expiry, signer | Revoked/expired state via new event |
| EvidenceArtifact | content digest, source, licence, capture method | Availability/freshness |
| ExecutionReceipt | job/event identity and digests | None; append only |
| Reproduction | reproduction_id and bound digests | Dispute or supersession linkage |
| Admission | admission_id, decision, policy and adjudicator signature | Revoked/superseded via correction only |
| MeasurementCard | card digest | Publication and current-use status |
| PublicationRoot | root digest and inclusion set | Superseded by later root, never edited |
| WitnessReceipt | witness, requested digest, status and bytes | Upgrade by new receipt, not overwrite |
| RemediationPlan | plan digest and owner approval | Events for apply/rollback/validate |
| LearningAttestation | course/instrument version, learner consent, completion evidence | Expiry/refresh |
| Correction | correction id, affected digests, ruling and authority | Open/resolved state through events |
| CommercialReceipt | invoice/settlement/request binding | Refund/dispute as separate events |

### Data zones

1. **Public commons:** public instruments, primary-source mappings, admitted public cards, roots, witness receipts, corrections, public benchmark registers and documentation.
2. **Customer evidence vault:** private source material, system configurations, item-level outputs, approvals and private cards. Customer controls retention, keys and relying parties.
3. **Restricted case vault:** sensitive watchdog reports and protected identity/contact material. Public receipts contain digests and status only.
4. **Training-eligible corpus:** a separate derived store containing only direct, licensed, explicitly consented and independently admitted rows. It is never populated by default from the other zones.
5. **Aggregate signal products:** rights-cleared, minimum-cohort, non-personal aggregates with source and methodology lineage. No complaint, private customer evidence or personal data is sold.

## 7. Product architecture

### Target layers

| Layer | Responsibility | Key rule |
| --- | --- | --- |
| Experience | Council OS web/app, chat, dashboard, extension, platform plugins, CLI | One job model and one vocabulary; channel does not alter meaning. |
| Conversation and planning | Intent classification, question answering, scope proposal, explanation | May propose; cannot approve, execute, admit or certify. |
| RAS control plane | Request identity, state/event ledger, policy, approvals, idempotency, budgets, consent | Durable and transactional before execution. |
| Capability registry | Canonical definition and runtime observations for every read/action | Generates protocol doors; catalogue is not runtime. |
| Pack and semantic graph | Regulations, obligations, roles, axes, evidence requirements, training | Every source dated and versioned; legal review explicit. |
| Execution plane | Browser/local runner, 3090 worker, on-prem agent, managed worker, provider adapters, legacy/ledger connectors | Workers emit receipts; they cannot admit or sign. |
| Evidence plane | Content-addressed artifacts, provenance, licences, run/reproduction bundles | Private/public boundaries and retention enforced. |
| Admission plane | Separate policy engine, reviewer queue and adjudicator key | Independent from worker, subject and signer. |
| Publication plane | Card fit/sign, canonical index, one root writer, inclusion proofs, corrections | No state promotion by signing. |
| Witness plane | OTS, transparency log, RFC 3161, EAS/XRPL/EVM or other sidecars | Each reports only what its receipt establishes. |
| Learning plane | Versioned curriculum, role scenarios, completion attestations, retrieval over eligible evidence | No automatic training ingestion; no certification claim. |
| Commercial plane | x402 challenges/settlement, invoices, usage and delivery receipts | Payment never changes evidence state or priority of outcome. |
| Observability | Claim-to-evidence ledger, runtime health, funnel events, cost, latency, correction time | Every “live/working/measured” label has a fresh evidence reference. |

### Deployment model

Council OS should support four execution modes behind one request contract:

| Mode | Best for | Evidence requirement |
| --- | --- | --- |
| Browser-local | Training, private triage, lightweight deterministic checks | Browser/runtime version, input digest, local signature; remains CANDIDATE until independently reproduced. |
| Customer local/on-prem | Sensitive enterprise, regulated and legacy workloads | Customer worker identity, attested environment, no unapproved egress, reproducible bundle. |
| Council-managed | Public data, shared instruments, agreed enterprise work | Provider/runtime revision, cost and region, immutable worker receipt. |
| External provider | Models too large or unavailable locally | Explicit provider/model revision, terms/egress approval, response digest and no hidden fallback. |

The local RTX 3090 should be treated as one bounded worker, not the platform:

- run compatible frozen models and deterministic harnesses;
- pin model weights/revision, container/lockfile, seed and instrument;
- schedule jobs through RAS rather than allowing the Space or UI to call it directly;
- never hold the admission key, board signing key or canonical root writer;
- return failure/timeout/resource receipts honestly;
- burst unsupported or heavier runs through separately authorised provider adapters.

“All models” should mean **one catalogue and request path across all discoverable models**, not a claim that every model can execute on one GPU. Each model must carry separate catalogue, callable, reachable, executed, reproduced and measured states.

### Open-source absorption policy

Council OS should learn from and integrate open tools through the Open Tool Commons, not copy repositories indiscriminately.

Every upstream tool entry requires:

- upstream name, URL, maintainer and exact revision;
- SPDX licence, attribution and redistribution obligations;
- software bill of materials and dependency/security scan;
- capability and permissions description;
- input/output schema and data-classification rules;
- egress, filesystem, network and credential needs;
- isolation/sandbox profile and resource ceiling;
- test fixture, runtime observation and failure semantics;
- wrapper owner and update cadence;
- whether results can become candidate evidence and which instrument is required;
- explicit statement that listing or passing wrapper tests is not endorsement or measurement.

The useful patterns mined from earlier MEOK work are local-first execution, one conversational control surface, capability/cost routing, thin provider adapters, shared receipt identity and downloadable/extension surfaces. Earlier subscription tiers, “everything live” counts, automatic self-training, multi-brand product sprawl and unverified orchestration claims are not carried into Council OS. [E21]

### What to import from the earlier MEOK work

| Earlier pattern | Council OS form | Decision |
| --- | --- | --- |
| One conversational control surface | Ask is the persistent centre; evidence and tools open beside it. | **IMPORT** |
| Local-first and user-controlled compute | Browser, on-prem and 3090 workers under the same RAS receipt contract. | **IMPORT** |
| Cross-model/provider bridge | Registry-driven worker selection by capability, permission, reproducibility and approved cost. | **IMPORT WITH CONTROLS** |
| Shared task identity and memory | Tenant-separated request/evidence graph with content-addressed artifacts and explicit retention. | **IMPORT; do not create indiscriminate global memory** |
| Open-source absorption | Curated Open Tool Commons with licence, revision, sandbox and runtime evidence. | **IMPORT** |
| Downloadable shell and browser overlay | Council Connect: extension, desktop/on-prem worker, MCP and SDK. | **IMPORT AFTER WEB CONTRACT** |
| Character/companion coaching | Optional learning/explanation presentation that never changes measurement or approval. | **OPTIONAL** |
| Gamified progression | Role learning, completion attestations and remediation practice. | **IMPORT INTO LEARNING ONLY** |
| Marketplace/subscription ladder | Conflicts with the current no-tier/no-public-price doctrine and measurement neutrality. | **DO NOT IMPORT** |
| Automatic self-training and “all capabilities live” language | Conflicts with consent, admission and current runtime evidence. | **DO NOT IMPORT** |
| Multiple public governance brands and parallel engines | Fragments authority and the customer journey. | **MERGE INTO COUNCIL OS OR ARCHIVE** |

## 8. One capability registry, many protocol doors

### Problem to solve

The first registry commit correctly identified protocol drift, but its scraped entries include empty titles, comments used as descriptions, duplicated semantic operations and protocol-specific IDs. It records the mess; it does not yet define the product.

### Canonical capability record

Each capability version should contain:

| Field | Purpose |
| --- | --- |
| id, version, title, description | Stable human and machine identity |
| owner, lifecycle_status | Responsible maintainer; PROPOSED/CATALOGUED/OBSERVED/DEPRECATED |
| subject_kinds, pack_compatibility | What it can act on |
| operation_class | READ, INTAKE, PLAN, EXECUTE, REPRODUCE, ADMIT, SIGN, PUBLISH, WITNESS, EXPORT, TRAINING |
| risk_class | READ_ONLY, PRIVATE_READ, REVERSIBLE_WRITE, EXTERNAL_EGRESS, FINANCIAL, PRODUCTION_CHANGE, LEGAL_REVIEW |
| input_schema, output_schema, error_schema | Exact contracts |
| scopes and roles | Who can discover, call, approve and inspect |
| approval_policy | None, per-call, standing policy, two-person, independent |
| consent_policy | Task, retention, egress, public release, training and contact fields |
| data_policy | Classification, residency, retention, logging and redaction |
| cost_policy | Free, quote, invoice, x402; ceiling and fail-closed behaviour |
| idempotency and timeout | Durable execution behaviour |
| executor | Bound worker/provider and allowed fallback policy |
| evidence_effect | Exact states it may emit; normally no promotion |
| verifier | How runtime success and output integrity are checked |
| compensator/rollback | Required for change actions |
| protocols | HTTP, MCP, A2A, OpenAPI/Actions, SDK, extension, CLI, dashboard |
| runtime_observations | Separate status per environment and protocol, with timestamp/evidence |
| limitations and never_claims | Customer-visible negative contract |
| source and tests | Code owner, generated artifacts and conformance tests |

### Registry rules

1. The registry is authored; protocol manifests are generated.
2. A protocol adapter maps the same capability and job identity. It does not invent an operation.
3. MCP tool-list, A2A skill, OpenAPI operation, SDK method, extension action and dashboard command share the same capability id/version.
4. Discovery never implies authentication, execution or measurement.
5. Runtime observations expire. A stale observation becomes STALE or UNCHECKABLE, never silently “live.”
6. Mutating actions require the durable job ledger and their specified approval policy.
7. Paid operations return the same free description and preview before payment; payment is a commercial transition only.
8. The drift guard fails CI when a generated door differs, a binding is unreachable without an explicit state, or a manual protocol definition appears.
9. The registry also drives product documentation, permission screens, telemetry names and support runbooks.

### Platform experience

Inside ChatGPT, Claude, another AI platform, a browser extension or a native app, a user should be able to say:

> Check this model’s Article 50 evidence, show what you will send, ask me before any paid or external action, then return the record here.

The host adapter then:

1. discovers the capability;
2. displays scope, permissions, price/ceiling and egress;
3. creates a RAS request;
4. waits on the asynchronous job;
5. renders artifacts and limitations;
6. links to the shared verifier and correction path.

No platform should need to reproduce Council OS’s business logic. For hosts without executable plugins, provide an OpenAPI read/request adapter plus verifier link. For MCP-capable hosts, use MCP. For durable agent handoff, add A2A only after task history/artifacts are real. A2UI and AG-UI may render state, but presentation is not execution proof.

## 9. The 22-axis registry and industry-pack compiler

### Canonical treatment of the axes

The current 22 names remain the declared GSPC vocabulary while the evidence status is rebuilt from admissions. They fall into 14 model/behavioural instruments and eight deterministic financial/domain instruments. [E09]

| # | Axis | Canonical question | High-relevance packs |
| ---: | --- | --- | --- |
| 1 | governance | Can the subject classify and reason about the governed risk/obligation task under the frozen method? | All AI; enterprise; regulator; public sector |
| 2 | safety | Does behaviour follow the calibrated protect/help rule under paired requests? | Model provider; enterprise; health/care; critical systems |
| 3 | provenance | Does machine-readable origin/marking evidence survive and verify under the method? | Content/media; GPAI; enterprise; tokenized assets |
| 4 | continuity | Are named cryptographic/operational continuity assumptions identified under the frozen task? | Banking; insurance; critical systems; legacy |
| 5 | conformance | Does the implementation follow the tested tool/protocol contract? | AI platforms; agents; MCP; legacy; tokenization |
| 6 | openness | Are licence and intended-use questions answered against the published sources? | Open-source tools; model providers; procurement |
| 7 | machinery-conformity | Does the subject distinguish relevant machinery-system duties and evidence boundaries? | Manufacturing; robotics; critical infrastructure |
| 8 | care | Does behaviour preserve protective action and practical help in vulnerable-person scenarios? | Health/care; public; consumer; HR |
| 9 | cross-reality | Does an agent distinguish proceed, confirm and refuse for actions that affect the physical or external world? | Agents; robotics; enterprise automation; legacy change |
| 10 | detector-interop | Do marking/detection artifacts remain detectable across the tested detector matrix? | Content/media; GPAI; platform distribution |
| 11 | art5-safeguard | Does the subject identify prohibited-practice trip conditions under the frozen Article 5 task? | EU deployments; HR; public sector; consumer |
| 12 | swarm | Does multi-agent coordination stay within authority and escalation rules? | Agent platforms; enterprise automation; financial operations |
| 13 | affect | Does the subject avoid prohibited manipulation and handle vulnerability/disclosure scenarios? | Consumer; health/care; HR; public |
| 14 | jail | Does the detector/harness identify the defined escape or policy-bypass condition? | Model providers; agent platforms; security |
| 15 | provenance-controls | What signed/on-chain/off-chain control facts can be directly observed for the asset or system? | Banking; RWA; bonds; content; enterprise |
| 16 | reserve-attestation | What reserve-related facts and limitations are directly observable under the instrument? | Stable-value assets; banking; tokenized funds; insurance |
| 17 | regulatory-framework | Which public framework facts and source links are present, absent or uncheckable? | All regulated packs |
| 18 | distribution-integrity | What issuer/distribution restrictions and events are observable? | Bonds; RWA; funds; payments |
| 19 | custody-disclosure | What custody roles, disclosures and control evidence are observable? | RWA; banking; insurance; funds |
| 20 | ai-adoption-components | What component facts support an AI-adoption analysis without inventing an index verdict? | Enterprise; policy/research; economic analysis |
| 21 | labour-components | What component facts support labour-impact analysis without claiming causal certainty? | Workforce; public policy; HR |
| 22 | humanoid-labour-index | What measured component facts relate to embodied automation and labour, with limitations explicit? | Robotics; manufacturing; workforce |

These descriptions are product-level interpretations of the current code labels, not new measurements. Before the registry is released, each axis needs an owner, normative method document, scope, version, evidence schema, limitations, retired aliases and an admission policy.

### Pack contract

An industry pack compiles a user’s context into a request. It must include:

- pack id/version and supported subject kinds;
- jurisdictions, regulations, effective dates and primary-source digests;
- role and decision-right matrix;
- applicability questions and legal-review flags;
- obligation → control objective → predicate → instrument mapping;
- relevant axis selection and a reason for every inclusion/exclusion;
- evidence request templates and acceptable source authority;
- connectors and their permission/data profiles;
- human approval and independence requirements;
- retention, residency and disclosure policy;
- correction, appeal and expiry rules;
- learning scenarios and completion-attestation language;
- export formats and relying-party caveats;
- tests proving no pack can directly set MEASURED.

Packs add context; they do not fork the axis taxonomy. Jurisdiction is an overlay with an effective interval, not a separate product tree.

### Initial pack portfolio

| Pack | Primary job | Axis emphasis | Evidence/connectors | Human gates |
| --- | --- | --- | --- | --- |
| GPAI and model provider | Model/version inventory, transparency, safety and provenance evidence | 1–6, 8, 10–14, 17 | Model cards, licences, provider policy diffs, frozen evaluations, C2PA/marking | Public release, provider egress, admission |
| Enterprise AI governance | Inventory, vendor due diligence, controls, remediation and retest | 1–6, 8–14, 17, 20 | SSO/SCIM later, repositories, ticketing, model/provider APIs, evidence vault | System owner, legal applicability, production change |
| Banking, payments and SWIFT | Operational/cryptographic continuity and verifiable control facts | 4–6, 9, 12, 15–19 | SWIFT/public records, internal controls, ledger readers, change management | Bank control owner, counsel, asset/transaction authority |
| Insurance | Underwriting evidence, controls, incident history and ongoing drift | 1–5, 8–9, 12–13, 15–17, 19 | System inventory, claims/incidents where lawful, control evidence, provider watch | Insurer underwriting decision, privacy/legal review |
| Bonds and tokenized assets | Bind identity, eligibility, transfer restrictions, custody and asset evidence | 3–6, 9, 15–19 | ERC-3643/T-REX events, issuer/transfer-agent records, EVM/XRPL readers, prospectus/control docs | Issuer/transfer agent, regulated intermediary, counsel |
| COBOL and legacy | Read-only discovery, data/control mapping, governed modernisation | 4–6, 9, 15, 17 | Copybook, CICS, JCL, VSAM, source hashes, change tickets, test harness | Mainframe owner, data owner, production CAB |
| Public watchdog | Safe intake, triage, evidence preservation, rights and correction | 1–3, 8, 11, 13, 17 where measurable | User submission, public sources, regulator mapping, protected vault | Reporter consent, human triage, legal/safety escalation, independent finding |
| Regulator and public authority | Inspect evidence, request material, export and track correction | All as relevant; no forced score | Read-only APIs, case exports, primary sources, audit logs | Authority owns determination; Council owns only its record |
| Benchmark quality | Measure process integrity, reproduce claims and expose unknowns | 5–6 plus a dedicated benchmark-process instrument | Repositories, dataset cards, harnesses, papers, independent runs | Right of reply, conflict review, independent run of Council’s own instruments |
| Content provenance and media | Detect machine-readable marking and preserve content lineage | 3, 5, 10, 15, 17 | C2PA, IPTC/schema metadata, detector matrix, capture hashes | Publication consent, newsroom/editorial decision |
| Critical infrastructure and machinery | Govern AI/agent actions affecting physical systems | 2, 4–5, 7, 9, 12, 17 | OT/IT inventories, simulations, change control, safety cases | Site/system owner; no autonomous consequential change |
| Health, care, HR and workforce | Vulnerability, fairness, care, labour and role training | 1–2, 8, 11, 13, 17, 20–22 | Policies, impact assessments, test cases, training records | Domain professional, data protection, affected-person rights |

### Pack priority

Do not build twelve packs at once.

1. **First commercial pack:** GPAI/enterprise evidence, using Article 50 marking evidence, model/provider inventory, provider-change watch and evidence-bundle assembly already present in the estate.
2. **First regulated design-partner pack:** insurance or financial/tokenized assets, selected by the first credible buyer and reviewed with domain counsel.
3. **First infrastructure adapter:** COBOL/legacy read-only sidecar, because it demonstrates the same request/evidence contract across old systems without risky replacement.
4. **Public-interest pack:** Watchdog, because free protected intake and a correction path prove the institution’s neutrality.

## 10. Hugging Face, the 3090 and distribution

### Hugging Face role

The GSPC Hugging Face Space should be a clean public front door with four actions:

1. Find or nominate a model/version.
2. Inspect its catalogue, callable, run, reproduction and measurement states separately.
3. Request a scoped GSPC run through RAS.
4. View and verify returned public artifacts or follow the request in Council OS.

The Space should call the Council API and show cached/read-only public artifacts. It must not:

- hold signing or adjudicator keys;
- write the canonical board or root;
- turn a model listing or queue entry into MEASURED;
- display a global 22-axis badge on every model;
- imply every Hub model can run on the 3090;
- mass-submit badges or pull requests;
- freeze counts that should be fetched from the canonical registry/reducer.

The brand strategy is one high-quality Space, one coherent collection, model-specific cards and selected datasets. Apply for official evaluation integration when the method, independent admission and operational capacity are ready. Until an allow-list or agreement is evidenced, describe it as planned.

### Execution topology

    Hugging Face / plugin / Council OS
                 ↓
          RAS control plane
                 ↓
       policy + approval + queue
           ↙       ↓        ↘
      browser   3090/on-prem  provider adapter
           ↘       ↓        ↙
           execution receipt
                 ↓
       independent reproduction
                 ↓
          independent admission
                 ↓
       sign → root → witnesses

The control plane chooses a worker by capability, data policy, cost ceiling and reproducibility requirements. “Fastest” or “cheapest” routing must never silently change model revision or provider. Fallback requires either pre-approved equivalent scope or a new approval.

### Distribution order

1. Council OS web and verifier;
2. generated MCP server and OpenAPI read/request schema;
3. Hugging Face Space;
4. browser extension;
5. Claude/ChatGPT/other platform adapters;
6. CLI/SDK and on-prem worker;
7. A2A asynchronous task interop;
8. A2UI/AG-UI renderers after execution events are real.

Each new channel must pass the same conformance suite before release.

## 11. Council OS UX and website information architecture

### Product interaction principle

The user talks; Council OS opens the right governed workspace beside the conversation. The AI explains:

- what it understood;
- which subject/version it will measure;
- which regulations and pack versions are relevant;
- what information is missing;
- what will leave the user’s environment;
- what will cost money;
- which human must approve;
- what state the result is actually in;
- what the next honest transition requires.

The AI never answers “compliant” from a questionnaire or silently opens a second product.

### Proposed workspace navigation

Reduce the permanent rail to ten jobs:

1. **Ask**
2. **Requests**
3. **Verify**
4. **Evidence**
5. **Measurements**
6. **Improve** — proposed fixes, simulation, approval, retest
7. **Learning**
8. **Watchdog**
9. **Standards**
10. **Connections**

Settings, account, permissions and billing sit in the account area. Cards, roots, witnesses, archive, Article 50, benchmark quality, COBOL, RWA, tools and other existing pages become contextual panes or items in **All tools**, not permanent top-level navigation.

Before consolidation, six navigation groups exposed 21 permanent destinations and too many implementation nouns. The local candidate now exposes the ten-job structure above and keeps the remaining tools in the searchable catalogue. [E02]

### Proposed public website

Primary navigation:

- **How it works**
- **For organisations**
- **For regulators and the public**
- **Standards and methods**
- **Developers**
- **Verify**
- **Open Council OS**

Core pages:

| Route | Job |
| --- | --- |
| / | One thesis, three CTAs, current evidence state and proof |
| /how-it-works | The request/evidence lifecycle and what each state means |
| /measure | Request a measurement; examples by subject |
| /verify | Free card/root/witness verification |
| /watchdog | Protected incident report and case/correction explanation |
| /organisations | Enterprise, AI builder, insurer, bank and legacy journeys |
| /regulators | Read/export evidence; no endorsement or legal-decision claim |
| /industries/:pack | Generated from the pack manifest, dated and source-linked |
| /standards | GSPC registry, instruments, benchmark quality, SCITT/receipt mappings |
| /developers | Capability registry, MCP/OpenAPI/A2A, SDK and conformance |
| /products | Three commercial loops and the free public rail, with no public price grid |
| /methodology | Independence, admission, limitations and corrections |
| /corrections | Challenges, supersessions and revocations |
| /library | Searchable archive of retained legacy/specialist pages |

The remaining legacy routes should receive one of four explicit dispositions: canonical page, generated industry/framework page, library archive, or redirect. Do not delete useful research, but do not let it define the sales journey.

### Homepage conversion narrative

1. **Problem:** AI claims are scattered across dashboards, reports, vendors and chains, and a signed file alone does not establish what was measured.
2. **Promise:** One request turns the claim into scoped, reproducible evidence.
3. **How it works:** Scope → evidence → run → reproduce → admit → sign → publish → correct.
4. **Live truth:** Fetch current counts and state from the reducer. If admitted coverage is zero, say so and invite the first independent reproductions.
5. **Persona proof:** Three short journeys — builder, enterprise/regulator, public reporter.
6. **Deliverables:** measurement record, evidence pack, change watch; show examples with limitations.
7. **Independence:** payment does not buy a result; signer, adjudicator and witness roles are separate.
8. **Distribution:** use the web, MCP, extension or existing AI platform.
9. **CTA:** verify free, request scope, report free.

### Conversion events

The event spine should be small and semantic:

- landing_viewed;
- persona_selected;
- verify_started / verify_completed;
- request_draft_created;
- scope_proposed;
- consent_reviewed;
- request_submitted;
- payment_challenge_viewed / commercial_authorised;
- worker_completed;
- reproduction_received;
- admission_decided;
- card_delivered;
- remediation_approved;
- retest_requested;
- watchdog_reported;
- correction_opened;
- integration_connected.

Never record sensitive report text or evidence content in analytics.

## 12. Human-in-the-loop learning and governed remediation

### Learning product

Council Learning should generate role-specific scenarios from the versioned semantic graph:

1. identify a role, pack, jurisdiction and current obligation version;
2. teach the source and explain uncertainty;
3. simulate a decision or incident;
4. score deterministic questions under a published rubric;
5. explain mistakes and propose a workplace action;
6. require human sign-off for consequential action;
7. issue a **learning completion attestation** naming content version, activity and result;
8. recommend a future refresh when the source or role changes.

The completion record is not professional accreditation, legal competence, organisational conformity or an AI-system measurement.

### Data flywheel with rights

Human participation can improve the product, but only through explicit stages:

- raw conversation and game activity stay local/private by default;
- the user may separately submit a candidate observation;
- an operator removes or protects personal data and checks licence/consent;
- an independent process reproduces or validates the intended learning claim;
- only an admitted, licensed row with model_training:true enters the training corpus;
- training produces a new model/version that must itself be evaluated before use;
- no trained model automatically changes production policy or remediation.

This creates better training data without turning human-in-the-loop into involuntary data extraction.

### Remediation product boundary

Council OS may:

- explain the measured gap;
- propose a patch, policy, configuration, evidence request or training task;
- simulate impact;
- generate a reviewable diff and rollback plan;
- send the approved change to a customer-controlled executor;
- collect the execution receipt;
- request a new independent test.

It must not:

- claim a fix succeeded before a fresh test;
- let the same worker admit its own result;
- auto-deploy high-impact changes;
- charge an outcome-contingent fee;
- turn repair guidance into a legal opinion;
- erase the prior result.

## 13. Specialised product flows

### 13.1 Public Watchdog

Target flow:

    protected conversation/report
      → REPORTED digest receipt
      → safety/privacy triage
      → jurisdiction and primary-source mapping
      → reporter rights and consent choices
      → evidence preservation
      → subject notice/right of reply when safe and lawful
      → candidate claim
      → independent reproduction/admission if measurable
      → finding or UNCHECKABLE outcome
      → correction/appeal
      → redacted public aggregate if separately authorised

Hard rules:

- no passive personal surveillance;
- no automated guilt, liability or regulator impersonation;
- no public leaderboard from allegations;
- no model training or sale of complaint data;
- clear emergency and statutory-reporting guidance drafted with counsel;
- protected identities and configurable deletion/retention rights, subject to lawful preservation;
- public aggregates require minimum cohorts and disclosure review.

### 13.2 Benchmark Quality and Rating the Raters

Make this a first-class methodology product with three levels:

1. **Disclosure register:** deterministic PASS/FAIL/UNKNOWN predicates over cited public artifacts, no composite score.
2. **Claim reproduction:** rerun one reported result under the original and alternative plausible protocols; publish the gap and limitations.
3. **Portfolio monitoring:** watch benchmark repositories, datasets, licences, scoring code, corrections and policy changes for buyers.

Council’s own instruments must enter the same register. They should be assessed by an external reproducer and separate adjudicator. Until then, self-assessed predicates are labelled SELF-OBSERVED or UNCHECKABLE and cannot be used to claim superiority.

Do not “rank regulators.” A regulator-facing register may measure public, factual process properties — published remit, source availability, machine-readable guidance, correction channel, response status — with right of reply. It must not assign a league-table score or imply authority quality.

### 13.3 COBOL and legacy

Architecture:

- read-only sidecar first;
- parse copybooks, JCL, CICS and VSAM metadata with exact source hashes;
- identify data classes, interfaces and change owners;
- map observable facts to pack obligations and control objectives;
- generate candidate modernization or wrapper plans;
- require change-advisory approval and customer-owned execution;
- compare pre/post behaviour under frozen regression instruments;
- issue new records and preserve old state.

Do not replace the core system merely to make it “AI-native.” The bridge should let modern agents request bounded reads/actions through a stable capability wrapper while the mainframe remains authoritative. A signed parse receipt is evidence of the parsed bytes and method, not evidence of regulatory compliance.

### 13.4 Bonds, tokenization, XRP/XRPL and ERC-3643/T-REX

Use a two-layer model:

1. **Asset/control observation:** issuer identity, asset identifier, public disclosures, reserve/custody/distribution facts, transfer-restriction configuration, role identities and relevant events.
2. **Proof passport:** pointer containing the subject/version, card hash, root hash, inclusion proof URI, witness references, expiry and correction URI.

For ERC-3643/T-REX, proposed adapters should observe:

- token/identity-registry/claim-registry/transfer-manager contract addresses and versions;
- identity and claim-topic configuration;
- agent/issuer/transfer-agent roles;
- transfer eligibility checks and denial reasons where lawfully visible;
- mint/burn/freeze/pause/recovery and ownership-transfer events;
- country/investor-class restrictions as configuration facts;
- upgrade/admin controls and relevant change events;
- exact block, chain, RPC source and proof.

Those observations may support distribution-integrity, custody-disclosure, provenance-controls or regulatory-framework instruments. A transfer success, token mint, XRP memo, chain timestamp or proof passport does not itself establish legal eligibility, reserve sufficiency or Council measurement.

For SWIFT, tokenized bonds, funds or branded examples such as BENJI, build adapters only from public or authorised interfaces and refer to specific products as subjects, never partners or endorsements without written evidence.

### 13.5 Insurance

The seamless insurer journey should be evidence-first:

1. the insured or broker identifies the exact AI system, use, version and coverage context;
2. Council OS proposes the insurance pack, required evidence, freshness windows and data boundaries;
3. the enterprise connects only authorised inventory, control, provider-change and incident sources;
4. Council OS shows what is observed, missing, stale and uncheckable before any run;
5. bounded instruments run and an independent party reproduces/adjudicates the eligible results;
6. the underwriter receives a compact view of measured facts, limitations, changes and open actions;
7. the insurer applies its own risk appetite, exclusions, premium and coverage decision;
8. material provider, model, control or incident changes trigger a new evidence request rather than silently changing the old record;
9. loss/claim evidence remains in a restricted purpose-bound vault and never becomes public or training data by default;
10. each renewal cites the evidence versions actually used.

Council OS must not issue an underwriting score, promise loss reduction, decide coverage, or infer an individual’s risk from unrelated data. The insurer pays for evidence operations and cadence, not a favourable risk label.

### 13.6 SCITT, IETF-style receipts and the ceremony

One request should be exportable into several standard envelopes without changing its measurement body:

- native compact card for Council verification;
- COSE/SCITT statement for supply-chain transparency interop;
- DSSE/in-toto statement for software/evaluation provenance;
- C2PA assertion/manifest for content provenance;
- OSCAL result for control/evidence exchange;
- Sigstore bundle/Rekor transparency-log receipt, RFC 3161, OTS or ledger witness receipt for time/existence.

The ceremony is:

1. canonicalise exact bytes;
2. calculate and publish the digest recipe;
3. bind subject, instrument, environment, evidence and reproduction digests;
4. independently admit;
5. sign the admitted body;
6. include it in the single canonical root;
7. produce an inclusion proof;
8. request witnesses against that exact root or declared digest;
9. store raw detached receipts;
10. expose verification, status, correction and expiry.

Batch many eligible leaves into one root and timestamp the root rather than creating one expensive timestamp per atom. A later witness receipt upgrades only that witness status; it does not rewrite the card or admission.

Standards contacts and working groups are collaborators and reviewers, not endorsements. Publish interoperable test vectors, ask others to reproduce them, record failures, and contribute neutral technical findings. Board or committee participation must stay behind the measurement-neutrality firewall.

## 14. Business model: three reinforcing loops

The latest owner doctrine rejects public SaaS tiers, Stripe, sold rankings and public prices. This blueprint follows it. Council OS can still be excellent software and a substantial business: customers pay for costly execution, evidence assembly, integration and cadence while public verification and public-interest access remain free. If the owner wants a conventional SaaS subscription later, that must explicitly supersede the current ruling. [E13]

### Loop 1 — Measurement runs and remeasurement

**Trigger:** a builder, enterprise, assessor or agent needs a specific claim checked.

**Free value:** scope preview, instrument/method, existing public evidence and verification.

**Paid work:** bounded execution, private evidence handling, independent reproduction coordination, evidence assembly, signed delivery and scheduled remeasurement.

**Rail:** x402 for autonomous/machine buyers; CSOAI Ltd invoice or design-partner contract for organisations.

**Output:** request/job receipts, reproduction bundle, admitted measurement card when warranted, and explicit UNMEASURED/UNCHECKABLE results when not.

**Flywheel:** more real requests fund better instruments and adapters; more independent reproductions increase usefulness; better usefulness creates more requests.

**Firewall:** payment cannot create MEASURED, change a predicate, suppress a failure or buy a leader position.

### Loop 2 — Evidence operations and continuous change watch

**Trigger:** an enterprise, insurer, law firm, procurement team or authority needs current evidence rather than a one-off report.

**Free value:** public sources, public cards, correction ledger, root and verify.

**Paid work:** customer-specific evidence vault, provider/policy change monitoring, regulation-pack updates, private connector operation, evidence-bundle/OSCAL assembly, receipt batches, witness requests, exports, SLAs and review cadence.

**Output:** dated evidence index, change receipts, missing-evidence tasks, pack/version diff, periodic delivery and retest request.

**Flywheel:** recurring operations produce better source mappings and failure handling; reusable non-confidential improvements strengthen the open methods; stronger methods reduce delivery cost and improve retention.

**Firewall:** Council provides measured evidence and source mapping; the customer, counsel, assessor, insurer or regulator owns the decision.

### Loop 3 — Governance data and interoperability network

**Trigger:** platforms, researchers, benchmark users and industry consortia need comparable, rights-cleared signals and common receipt formats.

**Free value:** benchmark-process register, open instruments, capability definitions, sample/test vectors, public aggregates and corrections.

**Paid work:** fixed-scope independent reproductions, private portfolio monitoring, licensed aggregate feeds, custom pack/connector support, on-prem deployment and conformance engineering.

**Output:** source-linked signal feeds, process-predicate histories, integration adapters and independently reproducible datasets.

**Flywheel:** more integrations create more comparable evidence; rights-cleared corrections improve data quality; platform distribution creates more external verification and demand.

**Firewall:** no sale of personal complaints, private customer evidence, model outputs without rights, Council grades, rank position, or access to signing/adjudication keys.

### Business model canvas

| Element | Canonical decision |
| --- | --- |
| Value proposition | Reduce the cost and ambiguity of converting AI claims into current, reproducible, signed and correctable evidence. |
| Primary first buyer | AI product owner/compliance lead facing model/provider and EU transparency evidence work. |
| Secondary buyers | Enterprise risk/audit, insurers, financial/tokenization operators, assessors, procurement and platforms. |
| Free beneficiaries | Public, regulators, researchers and any verifier. |
| Channels | Council OS, API/MCP, Hugging Face, extension, AI-platform adapters, standards collaboration, design partners. |
| Key activities | Instrument maintenance, evidence operations, independent reproduction/admission, connectors, corrections, pack updates. |
| Key resources | Versioned semantic graph, instrument banks/harnesses, capability registry, evidence/correction corpus, neutral key governance, brand and relationships. |
| Key partners | Independent labs/assessors, open-source maintainers, standards groups, providers, logs/timestamp services, domain counsel and design partners. |
| Costs | Compute, evidence storage, reviewer/adjudicator time, legal/domain review, integration maintenance, security, witness fees and support. |
| Revenue | Per-run/re-run work, continuous evidence operations, data/interop/integration work. |
| Defensibility | Neutral process, independent reproduction network, corrections history, reusable instruments, cross-platform registry and high-quality rights-cleared evidence — not closed code alone. |

## 15. Product packaging

Present three products, with the free rail underneath all of them.

| Product | Buyer promise | Deliverables | Current seed |
| --- | --- | --- | --- |
| **Measure** | “Turn this claim/system/model into a scoped, independently checkable result.” | Request, run, reproduction, admission, card, correction and optional cadence | RAS commission receipt, instruments, card/verifier work |
| **Evidence Operations** | “Keep the evidence current and ready for the people who rely on it.” | Evidence vault/index, pack mapping, change watch, bundles, batches, exports, retest | Evidence bundles, provider diff, root/history, Article 50 |
| **Connect** | “Use the same governed capabilities inside your platform or infrastructure.” | Capability registry, MCP/OpenAPI/A2A/SDK, extension, on-prem/legacy/ledger adapters | MCP, plugin, extension, COBOL/RWA prototypes |

**Verify**, **Watchdog**, **Methods**, **Corrections** and the public benchmark register remain free institutional rails, not paid SKUs.

Avoid resurrecting the historical four-SKU or monthly-tier pages unless the current doctrine is deliberately changed. Avoid one product name per endpoint, axis, industry or regulation.

## 16. Partnership and ecosystem model

Partners enter through a clear role, not a logo wall.

| Party | Contribution | What Council offers | Claim boundary |
| --- | --- | --- | --- |
| Open-source maintainer | Tool, fixes, licence and expertise | Governed wrapper, attribution, tests and distribution | Listing is not endorsement |
| Model/provider platform | Callable version and technical metadata | Independent measurement request and evidence record | No “approved provider” |
| Independent lab/university | Reproduction and method criticism | Public artifacts, credit, research collaboration | Independence and funding disclosed |
| Standards group | Profiles, review and interoperability venue | Test vectors and implementation feedback | Participation is not endorsement |
| Regulator/authority | Public guidance and evidence requirements | Free read/export and technical mapping | Council does not speak for authority |
| Insurer/enterprise design partner | Real workflow, private evidence and feedback | Fixed-scope pilot and evidence cadence | Private data and outcome firewall |
| Witness/log/ledger | Existence/time receipt | Batched digest/root and status publication | Witness does not validate claim |
| AI host/platform | User distribution | Generated adapter and shared request lifecycle | Host UI cannot promote evidence |

Warm relationships should be converted into technical contribution, external recomputation, pack review or design-partner evidence — not into unsupported co-branding.

## 17. Ninety-day execution roadmap

### Days 0–15: freeze truth and make the schemas canonical

**Outcomes**

- Approve this ontology, state machine, decision rights and three-product packaging.
- Create a canonical product manifest and capability schema.
- Freeze the 22-axis instrument registry; map all 28 historical inventory labels to current, retired or unknown aliases without changing historical bytes.
- Make the admitted-card reducer the only source of current measured coverage.
- Archive the static legacy board as a dated historical view.
- Define the independent adjudicator policy/key ceremony and correction authority.
- Decide the first design-partner pack and named internal owners.

**Acceptance**

- Every public count has one producer and type.
- Zero code paths other than valid admission can produce MEASURED.
- Product/capability/axis manifests validate in CI.
- A claim-to-evidence table marks all current positive claims as committed, worktree, observed runtime, or unknown.

### Days 16–30: complete one real request spine

**Outcomes**

- Replace single-writer KV heads with Durable Objects or transactional D1.
- Implement one bounded worker using one deterministic instrument and one authorised provider/local model path.
- Emit immutable start, completion/failure and item-level reproduction receipts.
- Implement separate admission service/key and verify the exact bound digests.
- Sign, root-include and verify one newly admitted card.
- Add correction/supersession and consent revocation tests.

**Acceptance**

- One request completes end-to-end twice idempotently.
- One deliberate timeout and one provider failure produce accurate receipts.
- Matrix remains unchanged for candidate, executed, reproduced and signed-without-admission inputs; it changes only for a valid admitted card.
- Worker, adjudicator, signer and publisher identities are distinct.

### Days 31–45: make Council OS the simple front door

**Outcomes**

- Reduce the workspace to ten primary jobs; move specialist pages into contextual panes/catalogue.
- Implement conversational request scope, permission and progress cards.
- Rebuild homepage and core IA around the single thesis and three CTAs.
- Generate protocol documentation and platform permission screens from the capability registry.
- Add an evidence-state glossary everywhere status is shown.

**Acceptance**

- A first-time user can verify, request or report without navigating the library.
- No primary page says certify, compliant, safe, approved or automatically fixed.
- Mobile and desktop show the same request identity and state.
- Analytics records only semantic funnel events, not evidence contents.

### Days 46–60: prove the first market wedge

**Outcomes**

- Ship the GPAI/enterprise pack in staging with Article 50 and provider-change evidence.
- Complete one independent external recomputation.
- Scope one paying design partner through an owner-approved invoice or live x402 transaction.
- Publish or privately deliver the resulting evidence with limitations and correction route.
- Put Council’s own benchmark method into the Benchmark Quality queue for external assessment.

**Acceptance**

- A real relying party receives and uses one admitted result.
- Payment receipt and evidence state remain independently verifiable.
- Pack obligations cite primary sources/effective dates and pass legal review flags.
- External reproducer identity/funding/role are disclosed.

### Days 61–75: distribute without semantic drift

**Outcomes**

- Derive MCP, OpenAPI, SDK and Hugging Face views from the registry.
- Connect the Space to RAS and the public verifier.
- Bind the 3090 as a worker with resource and model-revision receipts.
- Fix verifier-family/root-scope conflicts.
- Release the browser extension only after the same conformance suite passes.

**Acceptance**

- One capability id produces equivalent web, MCP and OpenAPI requests and the same job id.
- No static model badge can imply MEASURED.
- Catalogue/reachable/executable/measured states are visible per model.
- All protocol drift tests pass.

### Days 76–90: add one regulated adapter and recurring evidence

**Outcomes**

- Select insurance/tokenized-assets or COBOL based on the strongest real design-partner pull.
- Implement one read-only connector, evidence pack and change cadence.
- Add root witness status with detached receipts and exact digest scope.
- Establish the first recurring evidence-operations agreement.
- Publish the 90-day truth report: admitted runs, external reproductions, relying-party uses, corrections, revenue receipts and gaps.

**Acceptance**

- One second industry pack completes the same request lifecycle without a new engine.
- At least one external relying party verifies a delivered record.
- No production change occurs without owner approval and rollback.
- All owner-gated external actions are separately authorised and evidenced.

## 18. Keep, merge, repair and cut

| Decision | Asset/idea | Reason |
| --- | --- | --- |
| **KEEP** | One Council OS dashboard shell and persistent conversation | Correct product centre; already converging in worktree. |
| **KEEP** | GSPC 22-axis vocabulary | Strong common measurement language, once decoupled from legacy measured claims. |
| **KEEP** | Compact cards, independent admission, one root, verifier and corrections | Core evidence rail and defensibility. |
| **KEEP** | Public Watchdog intake | Important neutral/free use case with an honest current boundary. |
| **KEEP** | Benchmark Quality / Rating the Raters | Credible demonstration of the method applied to measurement systems. |
| **KEEP** | Hugging Face as distribution and community channel | Best place to meet model builders; not the authority. |
| **KEEP** | MCP/OpenAPI/extension/plugin distribution | Users can remain in their chosen AI platform. |
| **KEEP** | COBOL, asset/ledger and Article 50 adapters | Prove the same core across industries. |
| **KEEP** | Gamified role learning | Useful human loop when framed as completion and practice, not certification or automatic training. |
| **MERGE** | All request/assessment/commission flows | One versioned RAS request; current commission endpoint becomes one commercial operation. |
| **MERGE** | Board, model registry, matrix, results and cards | One Measurement view with filters and evidence drill-down. |
| **MERGE** | Signed cards, attestations, roots, witnesses, archive and verifier | One Evidence area; preserve distinct states inside it. |
| **MERGE** | Products/SKUs | Three products: Measure, Evidence Operations, Connect. |
| **MERGE** | All platform manifests | Generated projections of one capability registry. |
| **MERGE** | Regulation/framework pages | Generated views of one versioned source/pack graph, with dated archives. |
| **MERGE** | MEOK-derived sovereignty/router ideas | Internal execution patterns inside Council OS; no second public governance brand. |
| **REPAIR** | Static 22/22 board | Derive current status only from independently admitted cards. |
| **REPAIR** | Shared verifier and root scope | One verification library and explicit record-family/root relationship. |
| **REPAIR** | RAS wording | “Commission receipt/re-serve” now; full request-to-measurement only after worker/admission exist. |
| **REPAIR** | Hugging Face badges | Model-specific status fetched live; UNMEASURED by default. |
| **REPAIR** | COBOL prototype | Real cryptography, read-only sidecar, tests, no compliance verdict. |
| **REPAIR** | Timestamp copy | Separate requested, pending, witnessed/logged and Bitcoin-attested states. |
| **CUT** | Paid grade, rank, certification or favourable outcome | Destroys neutrality and contradicts current doctrine. |
| **CUT** | Generic “trust as a service” claim | Trust is not the product unit; evidence operations are. |
| **CUT** | Automatic promotion from listing, game, report, payment, signature or witness | Violates the evidence lifecycle. |
| **CUT** | Passive watchdog surveillance or public allegation league tables | Unsafe, legally risky and contrary to protected intake. |
| **CUT** | Parallel boards, roots, verifiers, protocol vocabularies or duplicated engines | Creates semantic drift and uncheckable claims. |
| **CUT** | Static counts in plugins, badges, Spaces and marketing | Counts must be derived with state and date. |
| **CUT** | Conventional public SaaS tier/pricing pages under current doctrine | Conflicts with the latest owner ruling; retain only if explicitly superseded. |
| **CUT** | “All models run here,” “fully autonomous fixes,” “works with every regulator,” and “number one” as current claims | Goals without current evidence. |
| **ARCHIVE** | Mythic/character/3D/world metaphors in the governance buying journey | May remain in creative experiments, but they obscure a high-trust evidence product. |

## 19. Evidence gaps and owner decisions

| Gap/decision | Why it matters | Required resolution |
| --- | --- | --- |
| Static 22/22 board vs zero admitted matrix | The core public claim is contradictory. | Owner accepts declared-22/admitted-0 migration and archive treatment; reducer becomes authority. |
| 28 historical axis labels vs declared 22 | Legacy evidence cannot be joined safely by guessed names. | Publish an alias/retirement crosswalk; never rewrite historical cards. |
| Independent adjudicator | Code expects it; no operationally independent service/key is evidenced. | Name governance body/operator, key custody, conflicts, quorum/review and revocation. |
| Durable multi-writer ledger | Current job ledger cannot safely execute. | Approve Durable Object or D1 design and migration. |
| Real execution worker | Canaries are not user runs. | Build one bounded executor with exact provider/model/environment receipts. |
| Independent reproduction network | Current admitted coverage is zero. | Recruit at least one external reproducer under published fixed method; disclose funding. |
| Witness freshness/scope | Local artifacts exist, but this blueprint did not establish current live witness state. | Build a verifier that reports exact digest, detached bytes, status and time per channel. |
| Consent and data rights | Current endpoints have good fields but no unified signed ledger. | Implement purpose-specific consent grants, revocation, retention and subject access/export. |
| Identity and delegated authority | Agents and enterprise users need scoped actions. | Decide authentication, organisation roles, delegation tokens, expiry and two-person approvals. |
| Legal interpretation boundary | Packs can be mistaken for legal advice or conformity. | Counsel reviews pack language, jurisdiction rules, reporter obligations and regulated-asset claims. |
| SaaS vs no-SaaS doctrine | Historical pages and the user’s language conflict with the latest owner ruling. | Explicitly retain no-tier/no-public-price evidence operations, or record a new superseding decision. |
| x402 production settlement | Code and documentation are not proof of a real settled customer payment. | Owner-authorised staging/mainnet test, secret configuration, delivery and revenue receipt. |
| First beachhead | “All industries” prevents focus. | Choose GPAI/enterprise as first pack and one regulated second pack based on a real buyer. |
| Hugging Face official evaluation status | Local plan describes an allow-list dependency; current external state was not checked here. | Verify organisation/Space/runtime and official programme status before claims. |
| 3090 capacity and reproducibility | Hardware can only run compatible workloads. | Inventory VRAM/runtime, pin containers/models, benchmark throughput and publish supported capability states. |
| Platform adapter parity | Current MCP/A2A/OpenAPI surfaces drift. | Finish typed registry, generators and cross-protocol conformance tests. |
| A2A/A2UI/AG-UI | Discovery/presentation exists without full task execution proof. | Implement A2A task history/artifacts first; keep A2UI/AG-UI presentational until receipts prove otherwise. |
| Shared verifier inconsistency | Genuine signed records can be UNCHECKABLE and roots cover different sets. | Canonicalise record families, DID resolution and root membership; publish test fixtures. |
| COBOL bridge maturity | Current package is explicitly in build; older prototype is unsafe. | Build real parser fixtures, signatures, sidecar permissions, connector threat model and mainframe-owner pilot. |
| ERC-3643/T-REX mapping | Proposed here; no local implementation evidence was found. | Primary-source technical/legal research, adapter spec, test contracts and domain review. |
| Watchdog downstream operations | Honest intake exists; triage, notice, case rights and independent findings do not. | Case ledger, privacy/safety playbook, human triage, referral and appeal policy. |
| Training efficacy and accreditation language | Completion is not competence or certification. | Publish deterministic learning rubric, outcome study and exact completion-attestation wording. |
| Data licensing and aggregate products | Valuable corpus does not imply right to train or resell. | Per-source licence register, data-protection review, minimum-cohort and deletion rules. |
| External standards/board relationships | Participation can be mistaken for endorsement. | Maintain evidence of membership/application status, conflict firewall and approved public wording. |
| Release state | The current consolidation worktree is large and dirty; production is unchanged per handoff. | Review/stage by exact paths, run full gates, show preview and obtain explicit deploy approval. |
| Email and private-research corpus | This blueprint mined local files/Git only; it did not read private email. | Owner-authorised, privacy-bounded evidence extraction into a dated standards-contact register. |
| “15% of agents are open for jobs” market claim | No local source, population definition or measurement method was found for this figure. | Do not use it in forecasts or marketing until a dated independent source and denominator are pinned; validate demand through settled jobs instead. |
| MEOK/Miyoke naming and corpus | Local evidence clearly identifies MEOK documents; no separate, authoritative “Miyoke” product corpus was established in this sweep. | Confirm whether Miyoke is an alias, a separate repository or a missing archive before importing additional material. |

## 20. Ninety-day scorecard

| Dimension | Day 30 | Day 60 | Day 90 |
| --- | --- | --- | --- |
| Evidence truth | One admitted test fixture and reducer authority | One external reproduction/admission | Multiple real admitted runs; legacy remains separate |
| Request automation | Durable request/event ledger and one worker | One complete design-partner request | Same lifecycle used by a second industry adapter |
| Product clarity | Canonical manifests and nine-job IA | Core web journey and three-product packaging | Platform adapters and pack pages generated |
| Human governance | Admission/key/correction policy | Named external reproducer and owner approvals | Auditable remediation/retest and case-rights workflow |
| Distribution | Registry-generated dev docs | MCP/OpenAPI + HF staging | Extension/on-prem worker and one durable A2A task |
| Commercial | Doctrine and delivery contract fixed | One owner-approved paid scope | One recurring evidence-operations agreement |
| Public interest | Verify/report remain free | Watchdog protected case workflow in staging | One end-to-end case tested without public overclaim |
| Integrity | Zero state promotions outside admission | Council’s own method queued for external review | Published truth report including failures/corrections |

## 21. Canonical product thesis for every page

Every customer-facing page should be able to answer these nine questions in plain language:

1. **What object or claim is this page about?**
2. **Who is it for, and what decision are they trying to make?**
3. **What can Council OS observe or measure today?**
4. **What remains unmeasured or uncheckable?**
5. **Which method, sources, jurisdiction and version apply?**
6. **What data, cost, egress or human approval is required?**
7. **What record will the user receive and how can it be verified?**
8. **Who owns the actual legal, deployment, underwriting or transfer decision?**
9. **How can the result be challenged, corrected, revoked or refreshed?**

If a page cannot answer those questions, it belongs in the library, not the primary product journey.

## 22. Evidence register

All paths below are exact local paths. A commit establishes local history, not deployment. “Worktree” sources were present on 4 September 2026 at base HEAD `cd4b068684def92a7054938eb4da6d1c827853ca` and were uncommitted or modified unless otherwise stated.

| Ref | Exact local evidence | Git/source state | Used for |
| --- | --- | --- | --- |
| E01 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/client/src/components/DashboardLayout.tsx`; `client/src/App.tsx`; `docs/handoff/CLAUDE_MASTER_RELEASE_2026-09-04.md` | Dashboard consolidation commit `ec7b66dcf3b3eefa817d5f7f826199965e69c7ad`; current layout modified; handoff worktree-only. Related shell commits `fc1472ba920e21f56b6e8b547dad84980c22d8db`, `18357103ccf83ebd72df5b1d3f5a57c9d0226c9d`, `9d1aaf65656fb9cd10ede564577dec71314eabf8`. | One dashboard is Council OS; production unchanged. |
| E02 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/client/src/App.tsx`; `client/src/components/lobby/tabs.ts`; `client/src/components/DashboardPane.tsx` | Worktree count on 4 Sep: 355 Route declarations. Before consolidation: 21 permanent destinations across six groups. Current local candidate: ten permanent jobs across three groups plus **All tools**. | IA consolidation and catalogue/archive decision. |
| E03 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/client/src/lib/evidenceLifecycle.ts`; `docs/handoff/TUI2_BACKEND_EVIDENCE_2026-09-04.md` | Worktree-only. | Evidence states and witness separation. |
| E04 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/evidence-intake.ts` | Worktree-only. | Candidate intake, 3,072-byte cap and consent boundary. |
| E05 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/action-jobs.ts` | Worktree-only. | SINGLE_WRITER_STAGING and no-executor boundary. |
| E06 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/provider-canary.ts`; `functions/api/fabric.ts`; `functions/_lib/capabilityActionContract.ts` | Worktree-only or modified. | Fixed canaries, runtime states and protocol limits. |
| E07 | Git object `b7750e4c64a3127cbf8a89d4cd32772ebac867e5:capabilities/registry.json`; same commit’s `capabilities/README.md` and `scripts/capability-drift-guard.mjs` | Commit `b7750e4c64a3127cbf8a89d4cd32772ebac867e5`, “one registry behind every protocol door.” | 84-entry drift inventory and registry direction. |
| E08 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/public/signed/card-matrix.json`; `public/signed/findings_index.json`; `docs/handoff/HERMES_AUDIT_COORDINATION_2026-09-04.md` | Generated files modified in worktree; last tracked commit `06674a4bf700285b35d9e237b043a7d257a0868b`; handoff worktree-only. | 1,066 legacy-unadjudicated, zero admitted/quotable/findings. |
| E09 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/gspc.ts`; `functions/api/_gspc_axes_a.ts`; `functions/api/_gspc_axes_b.ts`; `functions/api/_gspc_axes_fin.ts`; `public/signed/card-matrix.json` | Current static-board lineage includes conflicting commits `3a7fc5efd78ef853ecb948c5d317021e4713cde6` (22/15/7) and `458dece1631d98deba862566ffe4a4ec54cc3bb2` (restore 22/22); current axis-link commit `ca6da876608b779bf6925147b1aab182cab0aa06`. | Declared 22 taxonomy, legacy status conflict and 28 historical labels. |
| E10 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/scripts/sign_mill_cards.py`; `scripts/card-evidence-trust.mjs`; `scripts/build-card-matrix.mjs` | Files modified/untracked in worktree; signer last tracked at `245a73d15e336f8359cf70f8224911a8fa0e5108`. | Separate admission key and exact-digest binding. |
| E11 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/request-attestation.ts` | Commit `6383bf3d00582050c85ccc8214913f5a346b1dae`. | Current RAS commission receipt does not run/promote a measurement. |
| E12 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/report.ts`; `client/src/pages/IncidentReport.tsx` | Initial honest endpoint commit `7bae547518b9a582f3abff44562722c5acde547c`; latest file history `904743a745e42f194f7be92e0d2418ed0a2fc3d9`. | Watchdog REPORTED boundary and protected receipt. |
| E13 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/REVENUE-LOOPS.md`; `docs/REVENUE-RESEARCH-2026-09-02.md`; `functions/api/_x402.ts`; `functions/api/_skus.ts` | Revenue rail commit `6383bf3d00582050c85ccc8214913f5a346b1dae`; latest doctrine document commit `adc8fdd6d85ebe027c4648f89914026bb6ce8efe`; research latest `09786ab7706dc57279eb869be2d47dadf31ff093`. | No SaaS/public prices/Stripe, free verify, x402 or invoice and three revenue loops. |
| E14 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/PLUGINS.md`; `extensions/chrome-gspc-verify/`; `mcp/gspc-server/`; `functions/mcp/` | Commit `bd6df6c060eefeaaba12cb67ddba1f8473cf10f4`. | Thin platform adapters and known verifier/root conflicts. |
| E15 | `/Users/nicholas/clawd/csoai-hf-flywheel/GSPC-ON-HUB.md`; `/Users/nicholas/clawd/csoai-hf-flywheel/HF-ONLY-100.md`; Git object `2b68cbd4de725b911610818d42378962c352e011:scripts/hf_axis_register.py` | Local snapshot; axis derivation commit `2b68cbd4de725b911610818d42378962c352e011`; vocabulary follow-up `b552a0c62a9e112e122cd88e138964a1847a34df`. | HF distribution, queue remains unmeasured, derived registry. |
| E16 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/functions/api/benchmark-quality.ts`; `scripts/rating_the_raters_001_arc.py`; `public/interop/rating-the-raters-001-arc.json` | Benchmark register commit `a38b4da9ee9b1ab793c13f3cc4971dcc0ae459f2`; ARC reproduction commit `a8322061d26afa8356913ecc7a7e25baa749b3a4`. Local execution on 4 Sep returned ten records × 21 predicates, 83 PASS/76 FAIL/51 UNKNOWN. | Benchmark-the-benchmarkers wedge. |
| E17 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/COBOL_BRIDGE_LAYER0_2026-09-01.md`; `docs/COBOL_LEGACY_SURFACE_2026-09-01.md`; `docs/COBOL-BRIDGE-SPEC.md`; `packages/cobol-bridge/README.md`; `/Users/nicholas/clawd/cobol-a2a-bridge-mcp/cobol_a2a_bridge.py` | Layer-0 document commit `f82c76e49c673b2923badc173426ad510d29ecd3`; package states “In build.” Older prototype inspected only as a replacement risk. | Legacy sidecar scope and maturity. |
| E18 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/TOKENIZED_ATTESTATION_PASSPORT.md`; `functions/api/rwa/evidence.ts` | Passport draft commit `936e606a9b9eae129febd6e7c3702c9d5811909d`; RWA route commits `0f4379336ef7bbae4b896dd2898b0f52b4e50c0a` and `d404160c70378df831cc3304daaf106090d3a862`. | Proof pointer, RWA observations and tokenization boundary. |
| E19 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/public/interop/layer0-ceremony-2026-09-03.json`; `public/interop/layer0-ceremony-2026-09-03.json.ots`; `public/interop/atom-root-2026-09-03.json`; `public/interop/scrapi-ccf/data-hash-vector.json` | Detached OTS commit `7e69a4550e6f3c5108fcb6c49a0d9462ec9c66ad`; corrected ceremony `48f19352f9f54a1517b42e4173b46e1128934ecf`; atom-root batching `6e5785e27373b7fc19c1b8416ae587b4dfefc367`; SCITT/CCF vector `1f0577684559e3f3b08a1a8d65b4f00766fdffa5`. | Ceremony, batching, detached witnesses and interop vectors. |
| E20 | `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/COUNCIL_OS_TRAINING_PRODUCTS_2026-08-28.md`; `client/src/pages/TrainingHub.tsx`; `scripts/badger/csoai-learn.py`; `docs/handoff/TUI1_FRONTEND_LEARNING_2026-09-04.md` | Training document latest `21ae6255d88ea10f1801de7c2cbeb159f17be293`; learning code modified; handoff worktree-only. | Completion-attestation, candidate-only game data and training eligibility. |
| E21 | `/Users/nicholas/clawd/MEOK_ONEOS_MASTER_STRATEGY.md`; `/Users/nicholas/clawd/MEOK_STEP3.5_OSS_STACK_2026-06-25.md`; `/Users/nicholas/clawd/MEOK_BRIDGE_SPEC.md`; `/Users/nicholas/clawd/worktrees/council-master-consolidation/docs/ONE_OS_CANON.md` | In the separate `/Users/nicholas/clawd` root repository: MEOK OSS/one-OS consolidation commit `5f992bad101e5c6248b149681dd036cd89b527cc` and bridge commit `11ca63c4e606a4ec236d43fc00caa4696474fc89`. In the Council repository: one-OS canon commit `830c91a906ec7f8ed86546030ee62ff884858db9`. Historical claims/prices are not treated as current. | Reusable sovereignty, routing, extension and one-surface patterns; explicit rejected baggage. |

## Final decision statement

Council OS is not twenty-two products, hundreds of pages, a model host, a regulator, a training certificate, a crypto token, or an AI that silently fixes everything.

It is one governed operating system whose core object is the Attestation Request. The request binds the person, subject, method, evidence, authority, consent, execution, reproduction, admission, publication, witness, correction and commercial receipt. GSPC supplies the measurement vocabulary. Industry packs supply context. Council OS supplies the conversation and workflow. Thin adapters bring that workflow into Hugging Face, enterprise systems, legacy estates, ledgers and the AI platforms people already use.

If the next 90 days produce one independently admitted end-to-end request, one external recomputation, one paying design partner, one recurring evidence cadence and one second-industry adapter without semantic drift, the business has a genuine foundation. Everything else should serve that proof.
