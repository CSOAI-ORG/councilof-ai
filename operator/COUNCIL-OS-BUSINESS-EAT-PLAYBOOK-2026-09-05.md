# Council OS business and EAT playbook — 2026-09-05

**Status:** evidence-led operating plan; not a production, compliance, revenue or market-leadership declaration  
**Release authority:** Codex/root is the sole coordinator for integration, merge, workflow dispatch and deployment  
**Product rule:** one operating surface, one evidence contract, one GSPC table, many governed adapters  
**Public boundary:** Council of AI measures and attests scoped evidence; it does not sell certification, regulatory approval or a grade

## 1. The business in one sentence

Council OS turns a person's or agent's scoped question into a governed evidence-and-repair case: identify the exact subject and authority, collect and explain evidence, propose a bounded fix, obtain the right approval, execute safely, retest, reproduce, admit, attest and monitor—then reopen the case when a dependency changes.

The business is not another menu of SaaS pages. It is a request, evidence and repair network with multiple front doors and portable receipts.

## 2. What “EAT” means operationally

“Eat” is a controlled loop, not indiscriminate scraping or feature accumulation:

```text
discover → rights-check → identify/version → inspect → test → retain failures
        → reproduce → admit → measure → sign → include → verify witnesses
        → distribute → monitor → supersede/reopen
```

At every arrow, the system records who acted, which bytes and versions were used, the applicable consent and licence, cost, failure state and next authority. Open availability never waives terms, privacy, attribution, rate limits or deletion duties.

## 3. Current truth and the gap to the product

This table inherits the dated local observations in `operator/MASTER-RELEASE-LEDGER-2026-09-05.md` and `operator/audits/COUNCIL-OS-RUNTIME-TRUTH-GATE-2026-09-05.md`. Re-probe before repeating any row publicly.

| Layer | Evidence-backed now | Needed before a product claim |
| --- | --- | --- |
| Council OS shell | local chat-first candidate, unified navigation and finite read-only GSPC chat snapshot | exact-SHA owner review and verified deployment |
| GSPC | schema declares 22 axes: 14 comparison and 8 deterministic-fact axes; public board read is observable; initial canonical consolidation has 35 focused tests | independent admission lineage and one shared current receipt path; requested top-nine-per-axis expansion remains under source audit |
| Central chat | navigation, grounded answers, four safe MCP reads, browser card verification and explicit board read | durable cases, authorization, consent and an approved action lifecycle |
| MCP | HTTP discovery/init/read runtime; canonical catalogue reports 11 tools | host support matrix and owner-supervised proof for paid/mutating paths |
| AG-UI | finite read-only board projection consumed in local chat | real provider-run lifecycle, consent checkpoints and disconnect recovery |
| A2A | public discovery card | authenticated task send/get/cancel and receipts |
| A2UI/MCP Apps | plans and install/discovery language | one allowlisted component, supported host, auth and action round trip |
| RAS/action ledger | request preview plus non-durable staging/review | transactional state, bounded executor, rollback, retest and receipt |
| RunPod | 70/70 local jobs for 5 models × 14 model axes, unsigned UNMEASURED candidates | content-addressed canary, independent replay and strict control-plane boundary |
| Hugging Face | narrow six-config/733-row example with known replay gaps | frozen licensed pilot, complete producer/manifest and drift monitor |
| Homepage/persona discovery | existing hero remains the baseline; full redesign/gradients were rejected; Home Coliseum replacement and lower-stage condensation are approved as bounded work but remain in progress | exact-candidate owner preview and responsive/accessibility/performance review; Industry Workflows/All-tools routing still has no specialist backend actions |
| Learning/games | Boss Chair exists locally at b255e440b with eight authored deterministic browser rounds and desktop/mobile coverage | release review and shared case-graph integration; it is authored practice, not a dataset, live-model battle, measurement or GSPC input |
| Witness/revenue | signed/root materials exist in separate scopes; no current settlement-receipt stream verified by the runtime audit | exact-byte witness verification and owner-supervised settle/delivery proof |
| Council independence | point experiment found `rho=1`, `n_eff=1` | independent failure domains and adversarial evidence; do not market BFT |

## 4. The system architecture

```text
Public/authoritative sources + licensed N-sites + customer systems
                              ↓
                 Request Attestation Service
  scope · identity · role · observation consent · cost ceiling
                              ↓
             evidence graph + bounded execution ledger
      observe · explain · propose · action approval · sandbox fix · retest
                              ↓
              independent reproduction and admission
                              ↓
                    one canonical GSPC table
       22 axes × packs × roles × subjects × instruments
                              ↓
       signatures · root inclusion · per-rail verified witnesses
                              ↓
Council OS · HTTP · MCP/MCP Apps · A2A · AG-UI · A2UI · SDK
         plugin · extension · installable web app · read-only embeds
                              ↓
           monitoring · learning · reopening · new requests
```

The GPU/worker plane may fetch allowlisted inputs, run pinned inference or simulations and return content-addressed results. It never admits a GSPC cell, holds signing/release keys, publishes, deploys or labels its own output witnessed.

## 5. The canonical evidence lifecycle

Use one work state machine, with no shortcuts:

`REQUESTED → SCOPED → OBSERVATION_AUTHORIZED → OBSERVED → CANDIDATE_FINDING → REMEDIATION_PROPOSED → ACTION_APPROVED → REMEDIATED → RETESTED → REPRODUCED → ADMITTED → MEASURED → MONITORED → REOPENED`

Read-only observation consent is separate from ACTION_APPROVED, which binds the exact proposal digest and expires on revision change. Signature, root-inclusion and witness status are not later work states: keep `signature_state`, `root_inclusion_state` and `witnesses[rail]` as an exact-byte evidence vector. There is no aggregate `WITNESSED` flag, and one verified rail cannot green another.

Four boundaries carry the company's credibility:

1. A fix is an approved tool action with before/after bytes, rollback and a passing retest. Signing and OTS do not perform it.
2. `MEASURED` identifies an admitted subject/version/instrument/run/scope. It does not mean compliant, safe, approved or certified.
3. A signature binds a named key to exact bytes. Root inclusion and each external witness are separate, independent facts recorded on that artifact.
4. “Am I compliant?” becomes a scoped evidence answer: applicable authority, facts, gaps, uncertainty, accountable human and next actions—not an automated legal verdict.

## 6. The product matrix: 22 axes, not 22 industries

The 22 axes are the measurement canon: 14 model-comparison axes and 8 deterministic-fact axes. Industries are versioned packs applied only where relevant.

```text
case = applicable_axes[]
     × industry_pack
     × jurisdiction_pack[]
     × accountable_role[]
     × subject_adapter
     × instrument_version
     × evidence_policy
```

An empty or inapplicable cell remains `UNMEASURED` or `NOT_APPLICABLE`; it is never filled with zero. A fact axis has no model leader. GSPC is one shared table with filters and views, not a copied dashboard for each vertical.

## 7. Guided products and accountable users

| User and job | Council OS journey | Deliverable | Accountable boundary |
| --- | --- | --- | --- |
| Public/affected person | describe issue → scope jurisdiction/role → cite facts → options/escalation | issue record, sources and next actions | user/adviser/authority decides action |
| AI/GPAI provider or deployer | inventory model/system/harness → obligations/evidence gaps → approved repair → retest/monitor | evidence gap map, change receipt and monitoring record | provider owns deployment and compliance |
| Model/harness builder | pin model, weights, harness, bank and environment → run/replay | benchmark pack and admitted measurement candidate | no grade or endorsement is sold |
| Enterprise/control owner | map system/data/vendor lineage → control evidence → approval and retest | case workspace, evidence pack and control deltas | enterprise owns risk acceptance/change |
| Regulator/policymaker | select authority/source pack → inspect cases → run counterfactual scenario | evidence explorer and policy simulation | authority interprets/enforces law |
| Assessor/auditor | verify card, lineage, replay and witness state | independently verifiable export | assessor makes determination |
| Insurer/procurer/investor | inspect freshness, provenance, uncertainty and change | passport/feed and current evidence delta | underwriter/procurer/investor decides price/award |
| COBOL/legacy operator | ingest copybook/job/message lineage → propose sandbox mapping/code diff → replay fixtures | before/after evidence and rollback receipt | change owner approves production migration |
| Bond/token/ledger/contract operator | bind instrument, issuer, contract/account, disclosure and witness facts | scoped asset/control evidence pack | legal/reserve/regulatory conclusions remain external |
| Developer/agent | discover tools → call read/action contract → receive state/receipt | API/MCP/A2A/SDK integration | caller authorizes side effects |
| Learner/employee | practice scenario → explanation → proposed fix → human review | scoped learning activity attestation | not accredited certification |
| Researcher/benchmark owner | disclose bank/method → deterministic quality checks → replay | benchmark-quality register | rubric and uncertainty remain visible |

## 8. Guided tool packs

Each pack reuses the RAS schema and only changes its source, instrument and action adapters.

### AI/GPAI and enterprise

- model/system/harness/data inventory with immutable identity;
- jurisdiction and role scoping;
- obligation-to-evidence crosswalk;
- control-gap explanation and bounded configuration/code proposal;
- approval, sandbox execution, frozen retest and dependency monitoring.

### COBOL and legacy

- copybook, field, batch/job, message and control lineage;
- PII classification before egress;
- deterministic input/output fixtures;
- proposed mapping/program diff, rollback and reconciliation;
- attestation of the exact change and test—never of the whole mainframe.

### Bonds, tokenization, ledgers and contracts

Keep four ledgers of fact separate:

1. underlying legal instrument and governing documents;
2. issuer/counterparty identity and authoritative registers;
3. code, contract or account controls at a pinned chain/version/state;
4. evidence/witness transactions and their exact meaning.

ERC-3643/T-REX, XRPL, EVM and other adapters can measure public controls and disclosure gaps. They cannot infer reserve sufficiency, legal ownership, permission or regulatory compliance from token presence.

### Insurance and procurement

- evidence freshness and provenance feed;
- control, incident and supplier deltas;
- uncertainty and missing-evidence register;
- human-owned coverage, pricing and award decision;
- monitored reopening when a source, system or control changes.

### Regulators and public sector

- versioned authoritative sources, effective dates, jurisdictions and roles;
- evidence/case explorer with citations and appeals;
- counterfactual simulations with assumptions and sensitivity;
- change-triggered training/practice scenarios;
- no enforcement message, summons or public accusation without accountable human review.

## 9. One protocol fabric

| Surface | Job | Boundary |
| --- | --- | --- |
| HTTP | canonical commands, queries and receipts | server schema is authoritative |
| MCP | give a host tools/resources | public reads never silently become writes |
| MCP Apps | interactive host-native tool view | supported hosts only; OAuth/consent enforced by tool |
| A2A | exchange agent identity, tasks, status and artifacts | discovery card alone is not execution |
| AG-UI | stream messages, activities, tools and state to the frontend | presentation events cannot advance evidence state |
| A2UI | declarative allowlisted centre-canvas components | renderer/schema pinned; UI cannot invent capability |
| SDK/plugin/extension/app | native entry into the same contracts | publish a tested host/capability matrix |
| Embeds | read-only board/card/evidence views | no secret, mutation or hidden board write |

The central experience stays simple: conversation and selected tool in the centre, persistent composer below, case/workspace history on the right. Coliseum, learning, city/world and policy simulation are views over the same case and evidence graph.

## 10. GSPC and the AI-economy index posture

The index product is a dated, queryable evidence catalogue with transparent sub-indices, denominators, methods, uncertainty and correction history. It may compare models, harnesses, benchmarks, providers or public market infrastructure only where the named instrument applies. It is not a Moody's-style credit rating, legal/compliance score, investment recommendation or tradeable/cash-settled index. Revenue may come from delivered data feeds, commissioned analysis and integrations—never from paying for placement, a better grade or an undisclosed methodology.

## 11. Hugging Face first, then N-sites

The goal is not to “take over” a platform. The defensible goal is to become the most reproducible independent governance-evidence layer, earned through transparent coverage and third-party replay.

Start with a frozen Hugging Face pilot:

1. Record exact query, timestamp, denominator, IDs, revisions and exclusions.
2. Rights-check each item before download, execution, redistribution or training.
3. Classify metadata-only, static-testable and runnable items.
4. Apply only relevant axes/instruments.
5. Retain every failure and unknown.
6. Reproduce and admit outside the discovery/GPU worker.
7. Distribute a thin read-only Space/card linking canonical Council evidence.
8. Monitor revisions and supersede rather than overwrite.

Only after licence, replay, cost, drift and removal gates pass should the adapter be reused for Kaggle, OpenML, GitHub/model registries or another N-site. Each site keeps a named terms/rate-limit adapter and its own frozen denominator.

## 12. The data and learning flywheel

```text
free verifier/board/KB evidence
            ↓
discoverable scoped request
            ↓
observation and retained failure
            ↓
approved repair + retest
            ↓
separately operated replay → firewalled admission
            ↓
better GSPC coverage and routing
            ↓
change detection and case reopening
            ↓
guided human learning and new evidence
```

This is not automatic training permission. Record task use, retention, external egress, model training, publication and marketing consent separately. Private cases and practice answers stay private by default. Only specifically licensed and consented material may become shared training data or public KB atoms. Immutable publication implications must be explained before publication.

## 13. Revenue architecture

### Free trust layer

- verification, board reads, public cards/roots, KB atoms and read-only embeds;
- open schemas, verifier and reproducibility instructions;
- narrow public watchdog and discovery functions.

### Paid units of completed work

| Unit | Billable completion event | What is never sold |
| --- | --- | --- |
| commissioned measurement | frozen run plus disclosed result bundle | desired score/rank |
| separate replay and adjudication service | replay result and adjudication record | guaranteed agreement or paid admission |
| bounded remediation and retest | approved execution receipt plus named retest | legal compliance |
| monitoring/reopening | observed dependency checks and scoped reopened case | perpetual validity |
| enterprise evidence pack/feed | delivered provenance/freshness/control-delta bundle | regulator determination |
| insurer/procurement data integration | delivered scoped feed/API integration | coverage, premium or award decision |
| legacy/ledger adapter engagement | working adapter, fixtures and lineage evidence | certification of the estate/asset |
| metered MCP/API action | exact artefact/action delivered after verified settlement | payment for a grade |
| learning programme | delivered practice and scoped activity attestation | accredited certificate |
| benchmark-quality/data service | rubric, deterministic checks and replay export | opaque rating |

Commissioned work never earns board inclusion. Admission is organizationally firewalled from the payer and delivery team, uses the same published criteria for paid and unpaid candidates, and is not a billable completion event. Call a replay independent only when a genuinely separate entity or failure domain performed it; otherwise call it separately operated.

Use fiat invoice or a proven x402 rail according to buyer needs; the receipt contract stays the same. No public price list is required. No token, internal credit, pay-to-improve score or cash-settled “AI economy index.” Grants and research partnerships may fund public-interest instruments, but they are funding channels rather than evidence that product revenue exists.

## 14. Growth loops and metrics

### Distribution loop

`licensed source coverage → useful public evidence → verifier/API/plugin use → scoped requests`

Measure frozen resources, rights-known percentage, replays, independent verifiers, referral source and scoped-request conversion. Downloads, page views and badges are reach—not adoption or revenue.

### Repair loop

`request → accepted scope → proposal → approval/rejection → retest → delivered receipt → monitoring`

Measure time to scope, evidence completeness, approval/rejection, safe retest completion, reopen latency, delivery cost and gross margin. Never call the result a compliance conversion.

### Evidence-network loop

`external replay/challenge → correction or confirmation → stronger method → broader reuse`

Measure third-party recomputations, disagreements retained, corrections issued, method versions, reproducibility and witness verification.

### Product-quality loop

Measure task success, unavailable-capability clicks, failure recovery, accessibility, responsive overflow, Core Web Vitals, JS/media budget, route/tool parity and support-matrix coverage.

## 15. Budget and operating controls

- Default weekend external spend: **£0**. Local tests, docs and fixtures proceed without repeated approval.
- Every compute job states subject/revision, image/harness digests, expected GPU/CPU minutes, currency ceiling, timeout, egress class and cancellation/shutdown rule.
- Discovery is CPU/network work; do not burn GPU on crawling. RunPod handles only allowlisted inference/simulation it fits.
- No external email, post, submission, package/dataset/marketplace publication, account/OAuth change, key use, payment, partnership commitment, merge, workflow dispatch or deployment outside the named owner gate.
- Never use a private key found in transcripts or repo material. Treat exposed secrets as compromised and rotate/scrub through the owner process.
- Never weaken a truth/release guard to make a build green.

## 16. Bounded delivery phases

### Phase 0 — one truthful release candidate

One shell, one GSPC component, truthful capability/support matrix, existing hero baseline, separately reviewed Home Coliseum/lower-stage changes, complete route/install/a11y/performance gates and exact-SHA owner preview. No rejected gradients or wholesale redesign. Keep top-nine-per-axis rows behind source audit.

**Exit:** Codex/root reviews frozen manifests; owner approves; deployment uses the authorised repository workflow; served commit and bytes are rechecked.

### Phase 1 — durable RAS vertical slice

Transactional case ledger; card diagnose under observation consent → explain → propose → approve the exact action → sandbox repair → retest → candidate receipt; consent, rollback and failure paths.

**Exit:** concurrent/retry/recovery tests pass and no executor can sign, admit, publish, pay or deploy.

### Phase 2 — independent evidence chain

Separately operated reproducer/adjudicator; firewalled admission; admitted measurement; verified signature, inclusion and per-rail witness state. Reserve “independent” for a genuinely separate entity or failure domain.

**Exit:** downloaded bytes reproduce the card and inclusion; mismatches remain candidates; each witness has an independent state.

### Phase 3 — frozen Hugging Face and RunPod pilot

Rights-aware manifest, immutable revisions, one pinned worker canary, failure retention, independent replay, thin read-only Space design and drift monitor.

**Exit:** every pilot item has a source/revision/rights/state; one applicable runnable subject completes the chain; no claim of full-HF coverage.

### Phase 4 — five guided packs

AI/GPAI, finance/tokenization, insurance/procurement, regulator/public sector and COBOL/legacy journeys over the same RAS/GSPC fabric.

**Exit:** sources, roles, axes, exclusions, instruments, fixtures, human authority and reopening rules are explicit.

### Phase 5 — protocol and host distribution

Equivalent IDs/states/receipts across HTTP, MCP, one MCP App host and A2A; one pinned A2UI renderer; SDK/plugin/extension/app support matrix.

**Exit:** no host is called supported without an integration test; protected actions prove auth, consent and failure recovery.

### Phase 6 — monitored design partners and lawful scale

One AI/provider or enterprise case, one assessor/regulator-facing evidence review and one insurer/procurement or legacy/ledger case, each narrowly scoped. Expand N-sites and packs only from observed demand and lawful access.

**Exit:** delivered-work metering matches receipts and costs; real source change reopens only affected cases; customer data rights and incident/recovery objectives pass.

## 17. Three-lane weekend operating model

| Lane | Owns | Must not do | Handoff to Codex/root |
| --- | --- | --- | --- |
| TUI 1 | RAS state, durable ledger, bounded repair/retest, evidence/witness truth, commercial-unit ledger | UI/N-sites/release | tested backend manifest and blockers |
| TUI 2 | HF/N-site adapter, rights/provenance, frozen pilot, industry/source packs, distribution metrics | RAS/UI/release/external publication | tested adapter/data manifest and blockers |
| Claude Master | one shell/GSPC, personas, protocol projections, homepage/install UX, release preparation | backend/N-site internals/integration authority | exact-SHA preview, gate logs and path classification |
| Codex/root | cross-lane review, conflict resolution, release ledger, final integration and approved deployment | inventing green states or bypassing owner gates | served-byte verification and release report |

Dependencies are deliberate: TUI 1 defines the evidence/action contract; TUI 2 supplies rights-cleared candidates; Claude Master projects only capabilities those contracts prove; Codex/root alone integrates.

## 18. Decisions still requiring evidence or owner action

1. Durable Objects versus D1 for the first transactional action ledger, based on concurrency and query needs.
2. Exact frozen HF pilot query and N after a dry inventory.
3. First design-partner journey and accountable approver.
4. First supported MCP Apps host and pinned A2UI schema/renderer.
5. Owner-supervised low-value x402 settle/delivery test, if the rail remains strategically useful.
6. Estate-key re-signing, publication, marketplace/store release and production deployment.

## 19. Current primary references checked on 2026-09-05

- [Hugging Face Hub rate limits](https://huggingface.co/docs/hub/main/en/rate-limits): separate API/resolver/page buckets, five-minute windows, RateLimit headers and bounded retry behaviour.
- [Hugging Face Terms of Service](https://huggingface.co/terms-of-service), [repository licences](https://huggingface.co/docs/hub/repositories-licenses) and [gated datasets](https://huggingface.co/docs/hub/en/datasets-gated): service, licence and access decisions remain resource-specific; gated access can be withdrawn.
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview) and [MCP Apps authorization](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html): host support varies; interactive views and tool calls retain sandbox/auth boundaries.
- [AG-UI events](https://docs.ag-ui.com/concepts/events): event streams use message/activity snapshots and ordered deltas; resynchronisation is a presentation concern.
- [A2UI protocol](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md): streaming declarative surfaces use a renderer/data-model contract; pin the candidate version used.
- [A2A protocol](https://a2a-protocol.org/latest/): agent task/message/artifact exchange complements rather than replaces MCP's tool boundary.

## 20. Definition of “real”

A capability is real when a fresh user can discover it, understand its limits, execute the documented journey on a supported surface, recover from failure, inspect the exact evidence and reproduce the result without relying on an internal claim. Until then it is `LOCAL_CANDIDATE`, `OWNER_GATED`, `UNAVAILABLE` or `PLANNED`—never silently presented as live.

The next compounding unit is one complete journey, not another page, endpoint, badge or dataset count.
