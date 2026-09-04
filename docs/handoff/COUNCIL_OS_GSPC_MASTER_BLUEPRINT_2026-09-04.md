# Council OS + GSPC master blueprint

**Date:** 2026-09-04
**Candidate branch:** `codex/council-release-candidate`
**Status:** buildable release-candidate plan; not a production declaration
**Product rule:** one operating surface, one evidence contract, many adapters
**Public boundary:** measurement and attestation, never certification or legal approval

## 1. The product in one sentence

Council OS is a chat-first operating surface that turns a scoped question into
traceable evidence: understand the subject, select the applicable instruments,
collect observations, propose bounded fixes, require the right human approval,
retest, reproduce, admit, sign, include in a root, verify external witnesses and
monitor for change.

The user should feel that there is one assistant and one workspace. HTTP, MCP,
A2A, A2UI, AG-UI, SDKs, plugins and embedded applications are projections of
the same governed capability and evidence fabric, not separate products with
separate truth.

## 2. Non-negotiable truth boundaries

1. `MEASURED` means an admitted measurement exists for the named subject,
   version, instrument and scope. It does not mean safe, approved or compliant.
2. `SIGNED` proves who bound a specific body to a signature. It does not prove
   that the body is correct.
3. `ROOT_INCLUDED` proves inclusion in a named root. It does not prove an
   external timestamp.
4. `WITNESSED` applies only when a third-party receipt verifies against the
   exact current bytes. A path, configuration flag or transaction-shaped string
   is not a witness.
5. An OpenTimestamps proof is valid only when it parses and its committed digest
   matches the exact target bytes.
6. A ledger observation is a deterministic fact. It is not automatically a
   regulatory or legal conclusion.
7. A training or learning attestation proves the recorded activity and scope;
   it is not an accredited certificate.
8. A fix is performed by an approved tool in a bounded environment and verified
   by retest. Signing, anchoring and OTS preserve evidence after the work; they
   do not perform the fix.
9. Open availability is not permission to scrape, republish or train on data.
   Every source adapter must enforce its API terms, licence, rate limits,
   attribution, privacy and deletion requirements.
10. Council OS may help an accountable person assemble an answer to “am I
    compliant?” It must report scope, evidence, gaps and authority boundaries;
    it must not impersonate a regulator, lawyer or accredited assessor.

## 3. The one-shell experience

The canonical application door is `/dashboard`. Legacy Council OS, lobby,
console and overlay doors converge on it rather than opening a second shell.

The shell has four stable regions:

| Region | Purpose | Invariant |
| --- | --- | --- |
| Left rail | Ten primary jobs: Ask, Requests, Verify, Measurements, Evidence, Improve, Learning, Watchdog, Standards, Connections | Navigation changes the centre tool, not the whole product frame |
| Centre canvas | Conversation, selected tool, evidence, model comparison, game or simulation | One active job surface, no nested Council OS shell |
| Bottom composer | Persistent conversation and attachment/tool entry | Context survives tool changes; mutations still require review |
| Right rail | Workspaces, tasks and chats | History and job state, never a second tool catalogue |

“All tools” is the deduplicated secondary catalogue. Explanatory pages may be
opened inside the centre canvas when frame-safe; otherwise they open as a clear
top-level route. Account and settings use the same spacing, typography, brand
tokens and state language as every other pane.

The bottom-right launcher on public pages opens the canonical dashboard. It
must not reopen an older Council OS or create another navigation system.

## 4. Canonical Request Attestation Service lifecycle

The target lifecycle is an append-only request and evidence process. Transport
events may use different envelopes, but they must map to these semantic stages.

| Stage | Required record | May advance when | Must never imply |
| --- | --- | --- | --- |
| `REQUESTED` | requester, purpose, subject hint, consent choices | a valid bounded request is stored idempotently | execution or payment |
| `SCOPED` | exact subject, version, role, jurisdiction, industry pack, axes and exclusions | a human or policy authority confirms scope | a legal determination |
| `PLANNED` | capability versions, data-egress plan, cost ceiling, tests and approval gates | every action is allowlisted and reviewable | that a configured provider is live |
| `APPROVED` | approver identity, revision and decision | requester and approver separation rules pass | blanket approval for later revisions |
| `OBSERVED` | immutable inputs, environment, provider/model/harness identity, outputs and failures | capture is complete, including negative results | admission to GSPC |
| `CANDIDATE_FINDING` | claim, cited evidence, limitations and digest | a named predicate produced a reviewable result | truth, score or compliance |
| `REMEDIATION_PROPOSED` | diff or action plan, risk, rollback and retest plan | the proposal is bounded and attributable | that anything changed |
| `REMEDIATED` | execution receipt, exact actor/tool, before/after digests and side effects | approved execution completed | that the issue is fixed |
| `RETESTED` | frozen-instrument rerun and comparison | the same acceptance predicate ran | independent reproduction |
| `REPRODUCED` | independent executor result and matching/non-matching digest | an independent identity replays the frozen procedure | admission when results diverge |
| `ADMITTED` | adjudicator decision, method, evidence references and exclusions | the admission policy passes under a separate identity | signature or witness |
| `MEASURED` | admitted GSPC cell or deterministic fact run | the reducer accepts one unique subject lineage | certification, ranking or endorsement |
| `SIGNED` | exact canonical body, signature, DID/key version and verifier result | signature verifies over the exact bytes | external timestamp |
| `ROOT_INCLUDED` | leaf, inclusion proof, root digest and root signature | inclusion recomputes successfully | Rekor, OTS, EAS or chain witness |
| `WITNESSED` | verified third-party receipt for the exact root bytes | each named rail independently verifies | that another rail also verified |
| `MONITORED` | dependency graph, freshness policy and reopening rules | monitors are scheduled with evidence | perpetual validity |
| `REOPENED` | triggering change and superseded state | regulation, subject, model, harness, data or instrument changes | deletion of the earlier record |

Every command carries a schema version, request revision, idempotency key,
actor, role, timestamp, purpose and consent. Every event carries its prior and
new state, command digest and immutable event digest. A mutable “current” pointer
is convenience only; the append-only event stream is authoritative.

### Consent is not one checkbox

Record task use, evidence retention, external egress, model training,
publication and marketing separately. Model training is off unless explicitly
granted for the precise material. Withdrawing future use does not rewrite an
immutable public proof; the product must explain this before publication.

## 5. Control plane and untrusted compute

RunPod and any future GPU supplier are execution planes, not the source of
truth. A worker receives a bounded, content-addressed work package and returns
a content-addressed result bundle.

| Trusted control plane owns | Untrusted/bounded compute may do |
| --- | --- |
| identity, organisation, roles and consent | fetch approved model/dataset artefacts |
| request scope, policy selection and approvals | run pinned containers and benchmark banks |
| capability registry and cost/egress policy | perform inference, simulation and deterministic transforms |
| immutable command/event/evidence ledger | emit stdout, metrics, artefacts and a result manifest |
| independent reproduction and admission | report failures without retrying into a different method |
| GSPC reduction | never write a GSPC cell |
| signing keys and canonical card creation | never hold admission or signing keys |
| root construction and publication | never publish or deploy |
| Rekor/OTS/EAS/ledger witness verification | never label its own output witnessed |
| release, billing and production deployment authority | never spend beyond an approved work order |

The first RunPod production gate is therefore not “GPU reachable.” It is one
completed canary whose request digest, image digest, model/harness identity,
cost, output digest and failure policy all survive an independent replay.

## 6. The exact 22-axis canon

The current local GSPC API declares schema `csoai.gspc-axes/0.5` and 22 axes:
14 model-comparison axes and 8 deterministic-fact axes. The distinction is
structural. Fact axes have no model leader, accuracy or separation test.

### Model-comparison axes

1. `governance`
2. `safety`
3. `provenance`
4. `continuity`
5. `conformance`
6. `openness`
7. `machinery-conformity`
8. `care`
9. `cross-reality`
10. `detector-interop`
11. `art5-safeguard`
12. `swarm`
13. `affect`
14. `jail`

### Deterministic-fact axes

15. `provenance-controls`
16. `reserve-attestation`
17. `regulatory-framework`
18. `distribution-integrity`
19. `custody-disclosure`
20. `ai-adoption-components`
21. `labour-components`
22. `humanoid-labour-index`

The axis count must be derived from the canonical array. Empty future slots stay
`UNMEASURED`; they are never filled with zeros. Ties remain ties. A point leader
is shown as separated only under the published statistical rule.

## 7. Matrix architecture: axes × packs × roles × subjects

The scalable product is a queryable matrix, not hundreds of copied pages:

```text
case = axes[]
     × industry_pack
     × jurisdiction_pack[]
     × accountable_role[]
     × subject_adapter
     × instrument_version
```

Twenty-two is the axis canon, not a fabricated 22-industry canon. Industry
packs are separately versioned and may cover only the axes for which they have
validated obligations and instruments.

### Industry packs

Initial pack families should be registered, not hardcoded into the UI:

- financial services, banking, capital markets, tokenised assets and insurance;
- healthcare, life sciences and care delivery;
- government, public services, civic decision systems and procurement;
- energy, utilities and other critical infrastructure;
- manufacturing, machinery, mobility, logistics and robotics;
- employment, workplace, education and skills;
- media, advertising, creative content and provenance;
- general-purpose AI, model providers, deployers and agent platforms.

Each pack must name authoritative sources, jurisdiction, regulated roles,
obligations, applicability rules, effective dates, version, licence, review
owner, tests, known omissions and counsel/assessor boundaries. A broad catalogue
entry is `CATALOGUED`, not a working pack.

### Accountable roles

Use explicit role selectors: affected person, public user, model builder,
provider, deployer, operator, importer/distributor, enterprise owner, control
owner, procurer, assessor/auditor, regulator/enforcer, policymaker, insurer,
investor/risk analyst, researcher and standards contributor. “Government” is
not one role.

### Subject adapters

Adapters normalize identity and evidence for:

- model weights/revision and hosted model APIs;
- agent or orchestration harnesses, system prompts, tool policy and memory;
- datasets and training/evaluation corpora;
- deployed applications, APIs and workflows;
- generated content and provenance manifests;
- enterprise controls, policies and evidence stores;
- human learning or approval events;
- COBOL copybooks, batch jobs, messages and legacy transaction boundaries;
- smart contracts, tokenized instruments, issuer and custody accounts;
- benchmarks and benchmark providers themselves.

No adapter may silently turn metadata into runtime evidence.

## 8. Benchmark models and harnesses separately

A result belongs to a complete subject lineage:

```text
model artefact + revision
+ inference provider/runtime
+ harness and harness version
+ system/developer prompts
+ tool catalogue and permissions
+ memory/retrieval configuration
+ sampling parameters
+ instrument and bank version
+ container/image and hardware context
= measured subject lineage
```

The same model in two harnesses is two subjects. The same harness after a tool,
prompt or memory-policy change is a new revision. Council routing may use GSPC
evidence to select a model/harness pair, but it must record the selection rule
and cannot turn self-selection into an independent benchmark win.

“Benchmark the benchmarkers” means deterministic publication-quality checks:
bank availability, licence, contamination disclosure, split integrity,
independence, reproducibility, grader determinism, sample size, uncertainty,
failure retention, model/version identity and signed artefact linkage. It does
not mean declaring a benchmark good or bad without a published rubric.

## 9. Human-in-the-loop learning, games and simulation

The current learning contract is the right safety boundary:

1. Learn the instrument and cited source.
2. Play a bounded practice scenario.
3. Explain the answer, assumptions and uncertainty.
4. Propose a fix without applying it.
5. Obtain a human review decision.

Practice remains `PRACTICE_ONLY` and `UNMEASURED`. A consented result may become
a `CANDIDATE_FINDING`; it cannot admit itself, alter the board or become training
data automatically.

Coliseum, city, world and simulation views are renderers over the same case and
evidence graph. They can show human-versus-model, team-versus-agent and
model-versus-model scenarios, regulatory change, control failures and proposed
interventions. They must not maintain a separate truth store.

There are three modes with distinct labels:

- **Practice:** educational, reversible, no board effect.
- **Measurement:** frozen bank and method, reproducible, eligible for admission.
- **Policy simulation:** counterfactual assumptions, sensitivity ranges and no
  claim that the future outcome will occur.

A live two-model prompt battle is **not implemented** in this candidate. The
current arena displays recorded measured comparisons and must continue to mark
live battle as `UNCHECKABLE` until a real endpoint, subject identity, capture,
consent and reproducibility contract exist.

## 10. Regulation packs and continuous reopening

A regulation pack is a versioned evidence input, not legal advice. It contains:

- authoritative source and retrieval timestamp;
- jurisdiction, instrument, articles/clauses and effective dates;
- verbatim-source digest and permitted quotation/redistribution scope;
- applicability predicates and regulated roles;
- mapping to axes, instruments, evidence requirements and human authority;
- parser/crosswalk version, reviewer and unresolved interpretation notes;
- supersession, appeal, revocation and reopening rules.

When a source, subject, model, harness, dependency or instrument changes, the
dependency graph emits a change candidate. It does not email “you are no longer
compliant.” It reopens affected scoped requests, explains the change, offers a
new learning scenario and proposes a bounded retest or remediation for approval.

## 11. Protocol fabric

One versioned capability action contract drives every surface:

| Surface | Responsibility | Truth boundary |
| --- | --- | --- |
| HTTP API | canonical commands, queries and receipts | server schema is authoritative |
| MCP | tool discovery and calls for supported AI clients | public read tools do not become write tools |
| A2A | agent identity, task exchange and status | remote agent claims remain untrusted inputs |
| AG-UI | streamed job, tool, approval and evidence events | presentation events do not advance evidence state |
| A2UI | declarative, capability-scoped centre-canvas components | UI cannot invent backend capability |
| SDKs | typed client, verifier and retry/idempotency helpers | SDK success is transport success, not measurement |
| Plugins/extensions | client-native entry points into the same API | only supported host capabilities are promised |
| Embeds | read-only badges, cards and public evidence | no secret, mutation or hidden board write |

The currently published MCP manifest describes seven read tools. Mutating tools,
payments, signing, provider calls, training and deployment remain separately
authenticated and fail closed. “Works in every AI platform” is a roadmap goal,
not a current claim; each host needs a tested adapter and a published support
matrix.

## 12. Hugging Face first, then licensed N-sites

Hugging Face is the first distribution and discovery adapter, not Council of
AI’s identity or source of truth. The repeatable N-site contract is:

1. discover via a documented public API;
2. capture immutable site ID, revision and metadata provenance;
3. resolve licence and access terms before download or reuse;
4. classify the subject as metadata-only, static-testable or runnable;
5. select applicable axes and instruments without claiming total coverage;
6. execute only with permitted compute/data and a recorded cost ceiling;
7. publish measurement references and honest unknowns, not unsolicited badges
   that imply endorsement;
8. monitor revision drift and supersede rather than overwrite;
9. expose the same record through Council OS, API and supported protocol doors.

The Hugging Face public space should be a thin demo/read surface over the same
Council APIs. Heavy runs may use approved GPU capacity; admission, signing,
rooting and witness verification stay on the control plane.

Only after the Hugging Face adapter passes coverage, licence, replay, cost and
drift tests should the contract be reused for Kaggle, GitHub/model registries,
public benchmark hubs or other sites. Each site remains a named adapter with
its own terms and evidence state. “Open” never means unrestricted harvesting.

## 13. Legacy, finance and standards adapters

These are adapters into the same lifecycle, not separate operating systems.

### COBOL and legacy estates

Normalize copybooks, file layouts, batch/job identities, message schemas,
controls and before/after test fixtures. Proposed code or mapping changes run in
a sandbox with rollback and a human change-approval gate. The attestation binds
the exact program/input/output lineage; it does not certify the mainframe.

### Tokenization, Ethereum and XRPL

Separate four facts: underlying instrument, legal/issuer identity, on-chain
contract or account controls, and evidence/witness transactions. A public-ledger
flag may be measured deterministically. It cannot establish reserve quality,
legal permission or regulatory compliance by itself. ERC-3643/T-REX, XRPL
issuer controls and other rails need dedicated versioned adapters and replayable
fixtures.

### Insurance and procurement

Produce scoped evidence packs, control deltas, freshness and provenance feeds.
Insurers set coverage and pricing; procurers make award decisions. Council OS
does not automate those accountable decisions, but it can reduce their evidence
collection and monitoring cost.

### SCITT, COSE, Sigstore/Rekor, IETF and OTS

Treat each as an independently verified transport or witness layer. A real
SCITT statement requires a standards-conformant COSE envelope and a verifiable
receipt from a named transparency service. The current repository discovery
profile correctly remains `PLANNED`; no SCITT receipt is established. Rekor and
OTS state must bind the exact current root, not a prior root or placeholder.

## 14. Stakeholders, products and revenue

| User/job | Product surface | Deliverable | Honest revenue mechanism |
| --- | --- | --- | --- |
| public/affected person | Watchdog + chat | scoped issue record, sources, next actions | free public utility; paid help only by explicit request |
| model or harness builder | Arena + measurement | reproducible benchmark pack and fix/retest receipt | commissioned run; never pay for a grade |
| AI provider/deployer | RAS + monitoring | evidence gap map, approved remediation and change alerts | scoped work and monitoring contract |
| enterprise/control owner | workspace + evidence pack | system lineage, control evidence, approvals and retests | organisation plan/integration |
| regulator/policymaker | policy lab + evidence explorer | transparent facts, cases and counterfactual simulations | public-interest work or contracted research, no bought verdict |
| assessor/auditor | verifier + export | independently verifiable evidence bundle | tooling/integration; their determination remains theirs |
| procurer/insurer/investor | passport + data feed | current scoped facts, provenance and uncertainty | licensed feed/API, subject to source rights |
| developer/agent | MCP/A2A/SDK/plugin | typed tools and receipts | free reads plus metered bounded actions |
| learner/employee | learning arena | practice record and scoped learning attestation | programme fee; never mislabel as accredited certification |
| researcher/benchmark owner | benchmark-quality register | deterministic method disclosure and replay results | research partnership/data service |

The defensible business is not a larger SaaS menu. It is a request, evidence and
repair network with multiple front doors and portable receipts.

### Honest flywheels

1. Free board, verifier, cards, KB atoms and embeds create discoverability.
2. Discoverability creates scoped requests, not automatic sales claims.
3. Requests produce observations, failures and remediation opportunities.
4. Approved fixes produce retest evidence.
5. Reproduced and admitted evidence may strengthen GSPC coverage.
6. Better coverage improves routing, learning scenarios and change detection.
7. Change detection reopens relevant customer cases and monitoring work.
8. Portable receipts make API, plugin, procurement and partner distribution
   more useful.

Data accumulation is governed, not automatic. Private user content, practice
answers and customer evidence do not enter shared training or public KB atoms
without specific rights and consent.

## 15. Verified candidate state at this checkpoint

Observed locally on 2026-09-04; this table is not production proof.

| Capability | Evidence-backed state |
| --- | --- |
| Canonical dashboard | unified chat-first candidate present at `/dashboard`; the frozen-candidate desktop/mobile shell E2E reports 27 passed, 1 intentionally skipped |
| Navigation | ten primary jobs plus deduplicated all-tools catalogue; legacy doors converge on the dashboard candidate |
| GSPC API | local response schema `csoai.gspc-axes/0.5`; 22 measured axes: 14 model-comparison plus 8 deterministic-fact runs |
| Learning | one path per canonical axis; practice-only progression and explicit human review; no automatic board or training effect |
| Arena | recorded measured comparison is present; live prompt battle remains `UNCHECKABLE`/not implemented |
| Capability fabric | read-only normalized rails; action contract is fail-closed and execution-disabled |
| Action job API | single-writer KV staging ledger; records intent/state only, with no provider, worker, board, training or egress effect |
| Phase-1 executor | deterministic in-memory test fixture only; public, staging and production execution disabled |
| RAS | request pane and `commission_card` contract exist; payment never creates a measured cell |
| Public MCP | manifest declares seven read tools; no general mutating executor |
| Learn loop and paid witness | legacy placeholder issuance and witness sales are quarantined pre-release and return fail-closed unavailable responses; no payment is accepted |
| Current root | `public/root.json` has 141 leaves, Merkle root `2cd9db20…`; signature and Merkle recomputation were reported valid |
| Production | not established by this branch, local build or preview; no deployment is authorized by this blueprint |

## 16. Release blockers and missing product capability

### Evidence integrity blockers

- The current root declares kind `csoai.public-root/v1` against a schema whose
  const still expects v0.
- The current witness sidecar and pointer bind an older 50-leaf root, not the
  current 141-leaf root.
- The current root has no verified current Rekor snapshot or matching OTS proof.
- Public OTS inventory includes invalid plaintext/`BadMagic` files, orphaned
  references and two adjacent proofs whose digests do not match their JSON.
- Two published atom roots each include 20 quarantined XRPL/COSE leaves.
- The immutable quarantine inventory covers 22 incident files; those files must
  remain audit history but move outside the deployable truth path.
- SCITT remains planned; legacy hand-built COSE/SCITT placeholder output cannot
  be promoted to conformance evidence.

The release guards are expected to stay red until clean roots are generated,
independently verified and genuinely witnessed. Do not weaken a guard to make
the candidate green.

### Product capability still missing

- no authenticated, transactional, multi-writer durable action executor;
- no arbitrary automatic repair executor or general provider execution path;
- no production RunPod canary bound end-to-end to request and evidence records;
- no live two-model arena battle endpoint;
- no independently admitted fixture proving the complete request-to-GSPC chain;
- no complete host support matrix for AI-platform plugins;
- no licensed, replayable Hugging Face full-census adapter with drift monitor;
- no production-grade harness identity and comparison registry;
- no complete regulation-pack registry with supersession and appeals;
- no production proof for this candidate until an approved workflow deploy is
  served and rechecked.

## 17. Phased delivery plan

### Phase 0 — release truth and one shell

**Deliver:** keep one dashboard, retire duplicate doors, quarantine contaminated
evidence, repair the root schema, produce a clean root, verify its signature and
Merkle inclusion, obtain real current witness receipts, run the full gate chain,
show the owner the production-shaped preview.

**Exit criteria:** no exposed credentials; no public placeholder proof; evidence
and witness guards green; desktop/mobile shell E2E green; owner explicitly
approves deployment; deployment occurs only through the repository workflow;
served commit and artefact digests match after the anti-clobber interval.

### Phase 1 — durable RAS spine

**Deliver:** transactional action ledger, organisation/role model, explicit
consent, idempotent commands, reviewed allowlist, bounded local actions,
deterministic retest and immutable receipts.

**Exit criteria:** concurrent requests cannot corrupt state; stale revisions and
duplicate idempotency keys fail or replay deterministically; requester/approver
separation is enforced; one negative and one successful job are fully replayed;
no worker can admit, sign, publish, pay or deploy.

### Phase 2 — independent evidence admission

**Deliver:** reproduction worker, adjudicator boundary, reducer contract, signed
card, root inclusion and per-rail witness verification.

**Exit criteria:** a matrix cell changes only after matching reproduction and
admission; a mismatch remains candidate evidence; card and inclusion proof
verify from downloaded bytes; each witness can independently be `WITNESSED`,
`PENDING`, `INVALID` or `UNCHECKABLE`.

### Phase 3 — model, harness and RunPod measurement

**Deliver:** pinned worker image, model/harness subject identity, cost/egress
policy, canary, benchmark queue and result bundle.

**Exit criteria:** one model and two harness revisions produce distinguishable
lineages; one failed run remains visible; independent replay matches; GPU worker
has no control-plane keys; cost ceiling and shutdown are tested.

### Phase 4 — learning, repair and simulation

**Deliver:** approved remediation adapters, human review, fix/retest UI, learning
attestations, Coliseum measurement mode and policy-simulation mode.

**Exit criteria:** practice cannot mutate a system or board; a proposed fix has
diff, rollback and approval; a successful fix is retested; a rejected fix stays
auditable; simulations state assumptions; consented candidates remain separate
from training data.

### Phase 5 — Hugging Face N-site adapter

**Deliver:** licensed census, revision monitor, runnable/static classification,
measurement eligibility, public space and distribution references.

**Exit criteria:** every discovered item has source, revision, licence state and
coverage status; unknown/unlicensed items are not downloaded; one runnable item
completes the full evidence chain; drift supersedes rather than overwrites; the
space reads the canonical API and cannot publish measurements independently.

### Phase 6 — industry and interoperability packs

**Deliver:** versioned finance/tokenization/insurance, public-sector and one
additional industry pack; COBOL, XRPL/Ethereum and standards adapters; supported
MCP/A2A/AG-UI/A2UI/SDK/plugin projections.

**Exit criteria:** each pack has authoritative sources, roles, axes, omissions,
tests and human authority; each adapter reports capability state honestly; the
same request has equivalent IDs and receipts across two protocol surfaces; no
host/platform is claimed supported without an integration test.

### Phase 7 — monitoring and commercial scale

**Deliver:** dependency-driven reopening, organisation controls, metering,
quotas, customer exports, procurement/insurance feeds and service operations.

**Exit criteria:** a real source change reopens only affected cases; customers
can inspect provenance and revoke future use; metering matches delivered work;
no paid route sells a score, grade, certification or regulator conclusion;
availability, incident, backup and recovery objectives are tested.

## 18. Release acceptance checklist

- [ ] One canonical dashboard; no nested or legacy Council OS opens from a public launcher.
- [ ] 22-axis board derives its counts and preserves 14 comparison / 8 fact semantics.
- [ ] Model and harness identity are both present on benchmark receipts.
- [ ] Practice, simulation, candidate, measurement and witnessed states are visually distinct.
- [ ] Every mutation requires authenticated scope, revision, purpose, consent and approval.
- [ ] Durable executor has transactional single-writer semantics before provider execution is enabled.
- [ ] RunPod worker has only the minimum work package and no admission/signing/release authority.
- [ ] Independent reproduction and admission precede a board write.
- [ ] Current root schema, signature, Merkle proof, pointer and every advertised witness agree.
- [ ] Invalid historical evidence is preserved as quarantine outside deployable truth.
- [ ] SCITT/COSE is labelled planned until a conformant statement and receipt verify.
- [ ] Hugging Face and every N-site adapter passes terms, licence, attribution and drift tests.
- [ ] Learning/training use requires separate explicit consent.
- [ ] “Measured/attested” is never rewritten as “compliant/certified.”
- [ ] Live arena battle remains disabled until capture, identity and replay are implemented.
- [ ] Arbitrary repair remains disabled until bounded execution, rollback and retest are production-ready.
- [ ] Desktop/mobile accessibility, focus, shell and key end-to-end journeys pass.
- [ ] Owner sees the final local preview and explicitly approves the production deployment.

## 19. The operating decision

Do not restart the product and do not keep adding parallel dashboards. Preserve
the unified shell and make the lifecycle real underneath it. The next unit of
progress is not another endpoint count, page count or dataset count. It is one
complete, independently verifiable journey through request, approved action,
retest, reproduction, admission, signature, root, current witness and monitored
reopening—then repeat that contract across subjects, industries and protocols.
