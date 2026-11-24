# Council World / SovSpace — integrated product and operational design (24 November 2026)

**Status:** draft architecture and partially implemented reader UI in PR #4810. Source and local tests are not evidence of production deployment, active simulation compute, public Watchdog case acceptance, staffed WG, model-induced effects, a commercial settlement or any certificate. The canonical Council brand is white and green; DEFONEOS remains legally and visibly separate.

## Product thesis

An authorised visitor can ask an existing H.I.M./Council AI desk about a problem and receive the **right view and next permitted action**, not a long text dump or a fictional god's-eye feed. The rendering layer is shared across browser Council OS, embedded MCP app, A2UI component surfaces and future MEOK-owned clients. The same canonical event can appear as text, list, chart, graph, timeline, globe, classroom quest, simulation replay or an accessible data table — each view must link to the unchanged evidence. The source of truth is the original evidence/reviewer/transaction systems, not the viewer.

**Core rule:** visual representation cannot be promoted into REAL_OBSERVED, MEASURED, VERIFIED, human authorised, paid or delivered merely because a scene renders. Spatial coordinates require a grounded geographic source. Model/benchmarks/ontology nodes are non-geospatial by default.

## Real estate inventory and active boundaries

| Product component | Already exists in code | Honest current boundary | User-facing view |
|---|---|---|---|
| Council OS | /dashboard, native tabs with existing unique owners | Some tabs describe unqualified runtimes | Single workspace and preserved deep-link |
| Public H.I.M. staff | Six `/api/pals` desks; shared PalAskPanel; limited escalation to HITL | AI identities are not real enrolled human reviewers; model may be unavailable | Choice of desk + attributed answer + escalation status |
| RAS | /assess, deterministic screening, request/enquiry | Screening and lead are not accepted measurement or a paid x402 assessment | Step-through form and scoped proposal |
| GSPC | /api/gspc living axes and records, /board | Counts are not rankings; some leaders TIE/UNTESTED; measurement dates vary | Axis/subject matrix and dated method/evidence |
| Harness | replay, bank hashes and tests; /harness | No run until qualified execution, capacity, fixed methods and admission | Fixture, progress if genuinely running, result comparison |
| Human Council / WGs | /dashboard?tab=staff and draft WG charter | Draft names/tasks do not imply staffed quorum, signature or authority | Read-only reviewer state + pending challenge |
| Watchdog | corrections and source-linked public records; staff desk | Old public incident form redirects; private intake/human acceptance not established | Timeline, source cards, clear intake limitations |
| Academy and games | /academy, /dashboard?tab=play and local practice | Lesson activity is not credential, employment or GSPC admission | Scenario narrative, case choices, XP marked practice-only |
| SovSpace | local world-rehearsal v0.2 + dated /world/observatory/ | Synthetic replay, not a live agent society or future prediction | Timeline, synthetic globe only for source-grounded coords, report |
| Evidence and signatures | /root.json, public cards, verify, witnesses | Root metadata itself not signature verification; client must verify independently | Chain, signer, date, revocation/supersession status |
| SovX | /dashboard?tab=sovx and wrapper registers | Asset listing not rating or finance advice | Trace flow, wrapped assets and receipt linkage |
| x402 / SWIFT / XRPL | public challenge/settlement read surfaces | 402 does not imply payment; test/self-funded transfers not customers | Offer→challenge→signed payment→settlement→delivery→receiver |
| A2UI / AG-UI / MCP / A2A | /api/a2ui, /api/agui/run, /api/agui/gspc-state, plugin and tool catalogues | Protocol support != qualified model or action authority; currently some A2UI docs call 1.0 Candidate | Trusted UI schema + status stream + fixed action catalog |
| OpenGridWorks | /opengridworks | Geographic law map uses its own source snapshots, not enforcement outcomes | Zoomable atlas, jurisdiction drills and linked sources |
| DEFONEOS/MiroFish | Old DEFONEOS Cesium component, local package; external AGPL MiroFish | Never assume live defence sensors, military observations or unrestricted licence | Design/engine reference only, no public military import |

## Candidate world record schema (v0, not an introduced release contract)

Use existing canonical evidence fabric event as the underlying authority; this is only a **materialised read projection**. A consumer should see:

- `event_id`: stable source-scoped identifier; NEVER a fake client-generated proof ID.
- `source.uri`, `source.sha256`, `source.schema`, `source.owner`, `source.visibility`, `source.license`, `source.fetched_at`, `source.revision`.
- `kind`: `MEASUREMENT` / `OBSERVATION` / `HUMAN_REVIEW` / `SIMULATION` / `TRAINING` / `PAYMENT` / `PUBLICATION` / `UNKNOWN`.
- `world_state`: `SOURCE_REPORTED` / `VERIFIED_RECEIPT` / `SYNTHETIC` / `REPLAY` / `UNKNOWN`. State is assigned by a qualified ingestion adapter, not accepted from arbitrary raw uploads.
- `times`: event_time, measured_at, observed_at, fetched_at, published_at, and reference clock with nulls when unknown. Never substitute browser-now for measurement time.
- `identity`: model/provider/worker/reviewer identifiers with independently verified vs claimed flags. No private human contact data in public events.
- `location`: GEO with provenance and precision, NON_GEOSPATIAL, or UNKNOWN; never pin unknown to 0,0, London, an owner's farm, or a domain headquarters as if measured there.
- `evidence`: instrument and immutable inputs, method source/hash, n and denominator, score and CI only if published, verifier result, signed/unsigned/unchecked, root proof, correction/revocation.
- `authority`: proposal ID, exact scope, human enrollment/approval, expiry, revocation, executor qualification, observed effect, receiver receipt; each separately true/false/unknown.
- `provenance`: OpenTelemetry trace/span IDs only if source emitted; no invented trace IDs.
- `privacy`: public/consented/private/restricted and permitted view set.

A scene uses the same record id as the accessible table; selecting a geographic item shows its source and timestamp, not just animated particles.

## Five core user journeys (hard acceptance)

### 1 — AI provider / regulated buyer

Visitor asks Measure/RAS: “Assess this recruiting agent for a scoped GSPC evaluation.” Open RAS and show draft input and the relevant Annex III jurisdiction source. After explicit consent, submission can create a request receipt ONLY where an actual server acknowledges it. Human operator scopes. Qualified harness freezes source/models/corpus and executes under quotas. Independently observed result undergoes admission. Only published signed evidence reaches GSPC/root. Delivery and commercial acceptance are independent. Browser must show unknown at every missing gate.

### 2 — Public Watchdog / journalist

Visitor asks Watchdog about a published failure. Display public corrections and original sources, changes, and right-of-reply links. A new allegation remains an attributed **allegation**, is not automatically published as a conclusion, and cannot access private cases. Staff can explain the reporting process; if no confirmed report-storage endpoint exists, the interface must say so. Consequential escalation is human-held.

### 3 — Researcher / model developer

Visitor opens living GSPC board in the system graph. Select subject and axis, see n, frozen bank revision, method version, independent interval, TIE/SEPARATED/UNTESTED, signed card and test date. Compare model revisions only on common tasks and comparable methods. Show run-to-run drift and negative controls only once those data exist. Challenge/source-download link stays visible. No “winner” based solely on a numerical difference.

### 4 — Human reviewer / working group

Visitor sees only tasks the server's authenticated role authorises. Challenge payload freezes action, arguments, dependencies and expiry; conflict and quorum policy are checked. A real enrolled human approves explicitly. Executor rechecks eligibility/expiry/revocation at effect time; independent observer and receiver return results. Public WG catalog remains an opportunity until accepted staffing is proven. A simulation council vote is not a human quorum.

### 5 — Learner / MEOK user

Visitor enters Academy or practice. Request such as “train me to detect prompt-injection failures” opens an illustrated scenario, asks for a response and reveals the method with sources. XP is local practice; a certificate is NEVER minted from XP. A separately controlled exam can issue only the specific documented completion/assessment record when staffing, enrollment, assessment and signatures qualify. Team/agent chat is disclosed as AI; conversations are private by default.

### 6 — Tool / plugin / x402 integration

Host advertises trusted A2UI components, supported AG-UI runtime events and MCP/A2A tool capabilities. An agent may suggest **open read-only GSPC**, **open verification**, **prepare scoped RAS draft** or **open challenge**. Tools that submit data, request paid execution or make external effects require a visible preview and explicit user/human permission. x402 challenges, wallet-paid confirmations, network settlements, receiving-party delivery and independently observed outcomes are separate event types. No auto-billing.

## UI composition

Build **four orthogonal perspectives** over one object model:
- **Earth:** only geographically grounded jurisdictions, provenance-verified sensors/observations and locations.
- **Systems:** model/axis/source/HIM/tool/ontology graph; non-geospatial entities cluster here.
- **Time:** source timestamps, operation state transitions, simulation replay and comparative runs.
- **Tasks:** interactive RAS/intake, tool calls, Academy lessons, game rounds, human-review decisions, x402 flows.

Default layout = white/green Council chrome, clear source status and time, one active scene, collapsible details, reader-selected mode. Never build separate “globe app,” “benchmark app,” “HIM app” with duplicate logic. Use the existing route and bridge endpoints.

“Power station” monitoring should be a real state machine:
`NOT_CONFIGURED` → `QUEUED` → `RUNNING` → `STAGED` → `REPRODUCED` → `HUMAN_APPROVED` → `ADMITTED` → `PUBLISHED` → `INDEPENDENTLY_VERIFIED`, with per-transition evidence, never inferred. `FAILED`, `STALE`, `REVOKED`, `REJECTED`, `WITHDRAWN`, `UNCHECKABLE` are first-class. For self-runs there is no leap from SOURCE_REPORTED to independently verified.

## Comparable implementations and lessons (read before choosing dependencies)

| Reference | Reusable lesson | Risk / limit |
|---|---|---|
| Palantir Ontology / Workshop, https://www.palantir.com/docs/foundry/ontology and https://www.palantir.com/docs/foundry/app-building/overview | Objects, links, governed actions and operational views share one semantic substrate | Proprietary; do not copy branded UI or imply partnership |
| GOD Govern Observe Direct, https://github.com/XiaoLuoLYG/GOD | Agent society with map studio, trace, operator action vs replay controls | Must independently validate licence/runtime/effect semantics |
| AgentSociety 2, https://github.com/tsinghua-fib-lab/AgentSociety | Researchers' hypotheses and agent participants have distinct roles, experiments logged/replayed | Apache-2.0 except designated commercial folder; real human prediction not established |
| OASIS, https://github.com/camel-ai/oasis | Configurable social-agent runtime, Apache-2.0; possible legal simulator backend | Costs and ecological validity require measurement; million-agent title is not an achieved CSOAI load test |
| MiroFish, https://github.com/666ghj/MiroFish | Seed sources→graph/personas→simulation→report/conversation | AGPL-3.0 network obligations; dependencies and provider data rights; forecasts are hypotheses |
| OpenFoundry, https://github.com/aisoftware/openfoundry | Potential self-hosted ontology/pipeline and UI precedent | Check licence, maintenance, exact feature depth before adoption |
| Inspect AI, https://inspect.aisi.org.uk/ | Frozen eval specs, logs, reusable runner and evidence | Integration does not qualify our own instrument or benchmark |
| OpenTelemetry/OpenInference, https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/ | Span IDs, trace tree, latency, model/provider metadata; privacy-preserving readback | Trace success != external effect |
| AG-UI, https://github.com/ag-ui-protocol/ag-ui | State/tool events and frontend interactions | Requires scoped consent and host security |
| A2UI 1.0, https://developers.googleblog.com/a2ui-10-build-delightful-fast-reliable-agentic-experiences/ | Declarative trusted components rendered across apps | Our existing server labels v1.0 Candidate; version/docs review required before status upgrade |

### SWOT against close players

- **Strengths:** existing evidence fabric, guarded GSPC, existing HIM staff and signed-root/verification distinction, browser + plugin distribution, scoped x402, real local world-rehearsal.
- **Weaknesses:** fragmented UI and legacy redirects, dated observatory, unqualified MEOK simulation worker, no proved live Watchdog intake nor staffed human group, incomplete protected release flow, latency/observability gaps.
- **Opportunities:** a truly open portable ontology/event view with visible uncertainty, learning-to-evaluation handoff, neutral multi-model benchmark visualisation, independently auditable action effects.
- **Threats:** MiroFish/GOD/Palantir outshine presentation, generative-world visual hallucination, overclaim of human authority, private-data leaks, AGPL/copyleft obligations, commercial misuse of real-world “digital twin,” CI/protection overload.

## Priority-ranked build train

| Gate | Work item | Acceptance; fail condition |
|---|---|---|
| P0 | Exact-head PR #4810 source tests, security check and actual browser UI | Existing Arena tests pass, same-origin messages, working canvas and iframe, no fake uptime; protected strict checks and reviewed deployment |
| P0 | One canonical world-domain registry (routes, data source, owner, source-date, permissions) | Every visible object has an exact source; unknowns stay UNCHECKABLE |
| P0 | Read-only event adapters for public GSPC, corrections, root, Watchdog, public HIM state | Shape/version checks + privacy boundaries + negative tests, not an “all data” blind sync |
| P1 | Council OS native A2UI/AG-UI response mapping to trusted screens | RAS/GSPC/verify/human/academy/prompt all open correct pane; no arbitrary URL or tool execution |
| P1 | Qualify local world-rehearsal in a hardened sandbox through one same-origin broker | Repeatable exact seed, source archive and result; no unknown code uploaded or public unmetered model execution |
| P1 | MEOK authenticated capability handshake and bounded observation adapter | Actual provider/model/run IDs; no self-reported “MEOK connected” or automatic authority |
| P1 | Human review approval-to-effect sandbox | Newly authenticated approval, qualified executor, external observer and receiver confirm, changed args/expiry refuse |
| P2 | Experience/gamification and exams with withheld grading controls | Separate practice, course, credential, reviewer eligibility and benchmark roles; zero fake qualifications |
| P2 | Independent benchmark replay and “power-station” status screen | All state transitions backed by canonical records, denominator/freshness, stalled queue and failure visible |
| P2 | Third-party simulation engine import | Formal licence and dataset-privacy acceptance, counterfactual reference baselines, costs and held-out validation |
| P2 | Commercial cross-platform SDK/plugin delivery | A2UI schema + MCP app host + x402/settlement/delivery receipts checked in browser and independent host |

Owners must be assigned by existing Council governance; this document cannot appoint humans or infer review availability. Prioritise source reliability and end-user task completion above speculative worlds, GPUs or more marketing pages.

## Operational success measures

- User can locate the correct outcome view within two interactions from a natural-language query.
- 100% of displayed external metrics link to the exact original source, date and a declared verification state.
- All potentially consequential commands stop at explicit human approval; known unauthorized attempts have 0 effects.
- No reclassification of simulated or archived results as live observed and no private exposure.
- Every released GSPC chart displays eligible denominator, method/bank revision and TIE/UNTESTED.
- Test cases include offline/timeout/malformed payload, no WebGL, mobile 390px, keyboard-only, deep-link refresh, cross-origin postMessage, root mismatch and failed/partial payment.
- Commercial goal measured by acknowledged legitimate buyer requests, independently accepted delivery receipts and non-self wallet payment—not tool download counts or synthetic transfers.

## Historical Light Society and DEFONEOS boundary

Own upstream manifest at packages/world-rehearsal/UPSTREAMS.json says **original Light Society code/CC0 grant was never verified**, hence not vendored. It uses a separately attributed MIT event-queue reimplementation and licensed SwarmChat modules. Keep this distinction. DEFONEOS landing's Cesium viewer is a design/code reference: inspect provenance before port; do not mix defence sensor or private MEOK telemetry onto a civil public globe. The verified PyPI defoneos-cesium-mcp v1.0.0 package has five tool functions and MIT metadata, but a tool that emits CZML is not a live sensor or receiving-party integration.
