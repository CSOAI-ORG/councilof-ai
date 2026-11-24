# Council of AI / MEOK — Operating System, Market Landscape and 90-Day Execution Plan

**Date:** 24 November 2026 (UTC)  
**Status:** Internal strategy and implementation specification; not an audit certificate, external endorsement, revenue forecast or claim of production completion.  
**Evidence boundary:** Every number below carries a host, source and date. An existing GitHub workflow, a proposed PR, a model run, a distribution counter, a signed document and an independently accepted service are **different objects**.

## Executive decision

**Positioning:** CSOAI Ltd should sell *portable, independently checkable evidence of authorised AI-agent behaviour and its effects*. GSPC is the measurement subsystem; MEOK is the orchestrator; Layer-0/H.I.M. is the authorisation boundary; CouncilOS is the human-facing control and evidence product. Do not reimplement general-purpose observability, agent orchestration, or generic model eval harnesses where mature open-source tools can be adapted.

**Product wedge:** a buyer-controlled **Two-Release Agent Evidence Pilot**. For one agent workflow, capture the before/after version, authenticated human authorisation, scoped executor permissions, actual permitted effect, independent witness, recipient acknowledgement, signed bytes, reproducibility instruction, exception/negative controls and change comparison. If a link cannot be proved, report UNCHECKABLE. This is *not* a statutory compliance audit or certification.

**60-day survival criterion:** one case with proof of the complete authorisation → permitted execution → independent observation → receiving-party acceptance path; at least five genuine buyer discovery conversations; one buyer-approved pilot specification. Do not claim this has been achieved without each source record.

## 1. Evidence-grounded starting point

### Live public checks (observed 2026-11-24 ~00:20 UTC)

| Surface | Observation | What it does **not** establish |
|---|---|---|
| GET https://councilof.ai/api/gspc | HTTP 200; 34 axes / 34 recorded measurements; 14 model-comparison axes = 0 separated, 7 ties, 7 untested separations | Daily production remeasurement across all 34; a statistically separated best model |
| GET https://councilof.ai/root.json | HTTP 200; root as_of 2026-11-21T23:11:50Z; 452 declared leaves | This read alone did not independently verify Ed25519, Merkle inclusion or Bitcoin timestamp |
| GET https://councilof.ai/interop/distribution-latest.json | HTTP 200; as_of 2026-11-23T19:11:15Z, stale_after 2026-11-25T19:11:15Z | Unique humans, customers, product usage or installations |
| Distribution by entity | CSOAI: 953,413 gross all-time events, READ 218/218 counters; MEOK AI Labs: 2,859,565 gross all-time, PARTIAL 317/318; count separately | A single "3M CSOAI users" claim; even the MEOK number is a lower bound across responding counters |
| GET https://councilof.ai/api/revenue | HTTP 200; published settled_usdc.count = 60,000 atomic USDC units (0.06 USDC at 6 decimals), excludes self by producer statement | Four verified independent customers, fulfilled orders or repeat purchases |
| GitHub PR #4784 | Open, not merged at the time checked: white/green interactive GSPC workspace | Deployed/accepted site improvement |
| GitHub PR #4652 | Open draft: Living Signal Plane/WG ontology/recovery | Production governance enforcement |

The 34-axis board's measurement state and statistical-separation state must travel together. The *governance* axis explicitly warns that 225/237 labels can be predicted by a wording-only classifier; scores measure agreement with that bank's labels, **not** reliable application of the EU AI Act. Keep this negative finding prominent.

### Historical experiments requiring blinded rerun

- Twelve-specialist/one-referee evidence contained answer-bearing metadata: a prior 12/12 result collapsed to 0/12 under a blinded counterfactual. Signatures on its envelopes are evidence of bytes, not independent consensus, intelligence, correctness or Byzantine fault tolerance.
- Archive analysis previously found 1,823 repeated keys and 66 conflicting outcomes. Reconciliation and conflict-preserving identity keys are higher priority than adding more unreviewed cards.
- Three-arm study baseline 8/24, LoRA 7/24, retrieval 9/24 (and a non-comparable diagnostic 11/24): **no demonstrated improvement**. Publish paired held-out tests and uncertainty before claims of gain.
- Public human working-group opportunities and self-reported governance concepts do not prove staffed authorisation, independently appointed reviewers or binding quorum decisions.
- Prior completed technical steps include signed root/reader verification experiments and release gates, but none by themselves completes an externally accepted production effect chain.

## 2. Competitive intelligence — learn, adapt, do not blindly copy

| Peer / source | Reusable operating strength | Gap or commercial boundary | CSOAI action |
|---|---|---|---|
| UK AI Security Institute — Inspect, Inspect Evals | Versioned tasks, sandboxed evaluators, reproducible logs, growing evaluation register | Evaluates model/agent performance; downstream recipient acceptance is separate | Adapter to export GSPC instruments and sample-level evidence into Inspect results; upstream where useful |
| MLCommons — AILuminate, Candela | Consensus assessment standards, benchmark stewardship, double-blind testing, demand-side assessment | Independent governance and wide consortium create a formidable benchmark competitor | Align safety taxonomy and independent blinded reruns; **do not** claim compatibility without conformance tests |
| METR | Task-completion time horizons, expert-calibrated evaluation, uncertainty | Autonomy capability is not proof of a specific authorised effect | Use autonomy evals as optional measurement layer; never equate with human authority |
| Stanford CRFM — HELM | Transparent metrics, prompt-level reproducibility and comparability | HELM GitHub entered maintenance mode June 2026; not a turnkey live control plane | Adopt method/reporting conventions without depending on active feature development |
| EleutherAI lm-evaluation-harness | Extensible task registry, September 2026 plugin architecture, many model backends | Results and deployment evidence must still be joined externally | Publish a GSPC plugin instead of forking models/harness |
| NVIDIA garak / promptfoo | Probe–detector–evaluator decomposition, adversarial suites and CI integration | Scans estimate vulnerabilities; they do not attest permitted effects | Reuse safety probes, freeze attack seed, preserve negatives and release gates |
| Arize Phoenix | OpenTelemetry/OpenInference traces and evals, debugging, dataset feedback | Traces alone do not prove action acceptance or legal authority | Consume traces as attributed inputs, cryptographically bind to independent receipts |
| Langfuse | Open-source trace/eval/prompt/dataset infrastructure and self-hosted option | Observability category has existing established suppliers | Integrate OTel export; don't rebuild a competing generic observability dashboard |
| Holistic AI / Credo AI | Enterprise discovery, AI inventory, risk policy and continuous governance | Commercial differentiation and specific feature parity need buyer-side validation | Partner/interop path via OSCAL and policy evidence; buyer interviews before enterprise suite expansion |
| OTel GenAI semantic conventions | Shared fields for provider, agent calls, tools and MCP | Telemetry semantics are not signatures or observed real-world effects | Normalise spans and IDs with versioned schema; evidence refs on trace IDs |
| in-toto / SLSA / Sigstore | Standard attestation envelopes, supply-chain provenance and verification | Software build provenance is narrower than action/outcome provenance | Wrap Council signed evidence in standard attestations where their predicates fit; use distinct outcome predicate where needed |
| NIST AI RMF, ISO/IEC 42001 | Governance lifecycle and management controls | CSOAI cannot self-designate as accredited assessor | Provide evidence mappings as supporting data, not legal compliance determinations |

**Priority:** 1) interop adapters + evidence contract; 2) blinded evaluation; 3) runtime effects; 4) buyer acceptance. Generic eval dashboards, extra 34-axis branding variations and new foundation models are lower priority unless a buyer need emerges.

### Sources — inspect exact current versions before implementing

- Inspect: https://inspect.aisi.org.uk and https://github.com/UKGovernmentBEIS/inspect_ai
- Inspect Evals: https://github.com/UKGovernmentBEIS/inspect_evals
- MLCommons October 2026 release: https://mlcommons.org/2026/10/ailuminate-safety-1-2-1-and-jailbreak-1-1/
- METR: https://metr.org/time-horizons/
- HELM: https://github.com/stanford-crfm/helm
- EleutherAI plugins: https://github.com/EleutherAI/lm-evaluation-harness
- Garak: https://github.com/NVIDIA/garak
- Promptfoo: https://github.com/promptfoo/promptfoo
- Phoenix: https://github.com/Arize-ai/phoenix
- Langfuse: https://langfuse.com/resources/engineering/open-source-llm-observability
- Holistic AI: https://www.holisticai.com/
- OpenTelemetry: https://github.com/open-telemetry/semantic-conventions-genai
- in-toto: https://github.com/in-toto/attestation

### Second-pass adjacent infrastructure and protocol competition (24 November 2026)

**Microsoft Agent Governance Toolkit:** a substantial direct engineering competitor, not a peripheral security checklist. Its open-source policy engine describes portable policy manifests, fail-closed decision points, zero-trust identity, runtime enforcement, audit, MCP/A2A integrations and formal specifications. Review its MIT code and documented governance/CLA rules before integrating or contributing. **Response:** adapt/test an AGT policy-decision and receipt importer, preserving policy version, decision ID, executor and audit trace. CSOAI should not rebuild this general-purpose enforcement kernel or claim to be the only agent-governance framework.

**Google AP2 and x402:** AP2's human/agent authorization and payment mandates provide cryptographically linked payment authority and payment context. AP2 has example A2A–x402 integrations. **Response:** treat an AP2 mandate as *one possible authority input* to the Council evidence envelope, not as proof that a merchant settled, fulfilled an order or that a receiver accepted the product. Run deterministic no-payment fixtures first, with cross-rail issuer/expiry/revocation checks.

**Temporal durable execution:** event-sourced workflow histories, deterministic replay, bounded retry policies and signals/updates for approvals solve common orchestration problems. **Response:** prototype a MEOK-backed, human-approved case workflow using Temporal only if the existing fleet lacks equivalent durable semantics; keep non-idempotent external effects in activities with stable deduplication IDs and explicit recovery. Do not introduce another 24/7 process without service ownership and reliability data.

**OpenFGA and policy systems:** relationship-based authorisation can express human working-group membership, reviewer scopes and separation-of-duty constraints. But a tuple or role grant is not proof of an individual authenticated and current approval. **Response:** combine policy checks with short-lived human-signed approval events, revocation and a second-party receipt; never infer decision authority from a directory listing.

**AI Verify Foundation Moonshot:** modular benchmark and red-team tools, plus CI/CD compatibility and business-facing reports. **Response:** provide import/export of raw GSPC rows into Moonshot's test results where versioned licensing permits; do not copy benchmarks or score mappings without consent and a labelled conformance test.

**MCP 2026-07-28 and OWASP GenAI 2026:** the protocol adds stateless core, multiround requests, routing, caching, security and extension semantics; OWASP maintains an updated agent/LLM security threat baseline. **Response:** conformance-test Council's MCP endpoints and approval UX against current spec, and map risks to concrete negative controls, not badge claims.

Primary sources:
- Microsoft https://github.com/microsoft/agent-governance-toolkit and https://github.com/microsoft/agent-governance-toolkit/policy-engine
- Temporal https://github.com/temporalio/temporal/blob/main/docs/architecture/README.md and https://docs.temporal.io/develop/python/integrations/openai-agents
- AP2 https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/agent_authorization.md
- OpenFGA https://openfga.dev/
- Moonshot https://github.com/aiverify-foundation/moonshot-cicd
- MCP release https://blog.modelcontextprotocol.io/posts/2026-07-28/
- OWASP https://github.com/GenAI-Security-Project/GenAI-LLM-Top10

**Portability design:** Council should publish an adapter contract, not demand exclusive runtime use. Input: Inspect/EleutherAI/Moonshot evaluation result; Microsoft AGT/OPA/OpenFGA authorisation decision; Temporal/MEOK execution history; OTel trace; AP2/x402 payment event. Output: attributable, tamper-evident, *independently testable* signed evidence with an observed effect and an independently bound receiver response where available.

**New anti-claim gate:** Until at least one outside organisation supplies a receiver acknowledgement, the claim "first/only platform that verifies agent outcomes" is **unproven**. Market differentiation is a hypothesis for customer trials, not a settled fact.

## 3. Market thesis and regulatory openings

**Customer job-to-be-done:** "An autonomous AI workflow just changed. Before it acts on our customers, money, records or systems, show me exactly who approved what, which executor had authority, what it actually did, whether someone independent observed it, and whether the receiving system accepted it."

**Initial buyer profile:** regulated small/mid-sized operator or agentic automation vendor; measurable external side effects; one named human risk owner; willing to provide test environment and signed receiving-side acknowledgement. Start with enterprise B2B compliance engineering and security leads, not mass consumer downloads.

**UK opportunity:** The UK Trusted Third-Party AI Assurance Roadmap identifies a developing market, but CSOAI must not represent itself as formally accredited or regulator designated. Ofgem's November 2026 AI assurance consultation explicitly values evidence of operation, testing, monitoring, governance and independent assurance in energy infrastructure. Its 25 November agentic AI Reg Lab is for energy licensees (potentially with partners); the 21 October submission deadline has passed, while future submissions are described as rolling. Seek a lawful licensee partnership rather than claim direct eligibility.

**EU:** As of the European Commission's current FAQ, Article 50 transparency obligations apply from 2 August 2026, with a 2 December 2026 transition for specified existing synthetic-content providers. Some high-risk obligations apply on later 2027/2028 dates. Monitor official amendments. Produce evidence supporting *specific* Article 50 checks, not a wholesale "AI Act compliant" stamp.

**Industry standards:** ISO/IEC 42001 defines management-system requirements; ISO/IEC 42006 concerns certification bodies. Neither makes CSOAI accredited.

Sources:
- https://www.gov.uk/government/publications/trusted-third-party-ai-assurance-roadmap
- https://www.ofgem.gov.uk/sites/default/files/2026-11/ai-assurance-consultation.pdf
- https://www.ofgem.gov.uk/guidance/ofgem-ai-reg-lab-call-submissions
- https://ai-act-service-desk.ec.europa.eu/en/faq
- https://www.iso.org/standard/42001
- https://www.iso.org/standard/42006

### LIVE opportunity register — deadlines and go/no-go (verified 24 November 2026)

**BridgeAI Deployment Catalyst, AI for Assurance and Compliance (OPEN; closes 8 December 2026 at 11:00 UK time).** This is a **£5 million shared allocation across three strands**, not an unconditional £5 million pot for CSOAI, and not £5 million in direct grants to one applicant. The project grant request is **£100,000–£200,000**, with a project of three to five months starting by 1 April 2027. The lead must be a **UK registered AI SME with a TRL 5–6 functioning MVP**; must account for 40–70% of eligible project costs. Consortium must also include an eligible **UK medium/large deployer or UK public-sector organisation**, contributing 30–50% of eligible costs and operational access. Minimum two and maximum three consortium organisations. The deployer must operate in an eligible priority sector. Direct eligibility **not yet confirmed** for CSOAI; an eligible independent deployer **not secured**. Need technical maturity dossier, partner invitation, clear deployment case, finances, letters of support and scoped permissions. No application has been submitted by this plan. Source: https://find-lb.find-a-grant-support.service.cabinetoffice.gov.uk/grants/bridgeai-deployment-catalyst-ai-for-assurance-and-compliance-1

**Ofgem — Approach to AI assurance in the energy sector (OPEN; responses by 15 January 2027).** Consultation published 18 November 2026, invites energy participants, developers, AI providers, assurance professionals, academic and other stakeholders; the contact route is provided on the official consultation page. It is **not** the same as the 25 November 2026 licensee-only AI Reg Lab whose direct application deadline has passed. Prepare a sourced, narrowly scoped response comparing consent/authority, versioned tests, observed effects, negative states, and independent verification; no claim of regulator endorsement. Source: https://www.ofgem.gov.uk/consultation/approach-ai-assurance-energy-sector

**Priority choice:** A real deployer and a representative operational demonstration would advance both BridgeAI readiness and the independent-acceptance product. However, don't divert all resources into a grant bid without a qualified deployer, cost-share and maturity evidence. Founder time and existing release-critical work remain budget constraints.

## 4. Product architecture — one evidence ID, many views

**Canonical event envelope (proposed v0.1, not currently universally deployed):**

- identity: subject, agent/model/runtime revision, executor service, stable case/event ID;
- policy and authority: versioned policy digest, human principal, authentication, approval scope and expiry, revocation;
- invocation: intent, tool call, inputs digest, trace/span ID, execution timestamp;
- effect: target resource, action/transaction ID, before/after read (where lawful), digest of observed bytes;
- independence: evidence originating outside the action-author's trust boundary; observer principal and observation method;
- receiver: signed/attributable acknowledgement, accepted/rejected status, artifact digest, timestamp;
- metrology: axis ID, bank version, sample IDs, held-out split, negative controls, scorer/harness version, CI and uncertainty;
- provenance: content hashes, Ed25519 key ID, independently resolved DID, Merkle path, root, external witness and verification state;
- correction/freshness: supersession link, stale-after, revoked authority, dispute and right to respond;
- delivery: paid request ID if applicable, customer acceptance receipt; never infer delivery from an x402 402 or settlement.

**Separation of duties:** MEOK may recommend and propose; H.I.M. / authorised operator approves; scoped executor acts; GSPC measures; a distinct observer witnesses; receiving party accepts. A 12-model council or deterministic referee is not a replacement for the approving human or independent observer. Permissions must be verifiable at decision time, not inferred from group membership.

**Controls:** content-addressable evidence, idempotent event IDs, conflicting-outcome quarantine, strict schemas, versioned policy/model/bank, append-only correction ledger, fail-closed unknown states, independent replay, sampling integrity. Keep raw private data encrypted and access-controlled; public artefacts may contain only safe redacted hashes/metadata.

## 5. Continuous measurement across 34 axes

There is already a six-hour GSPC frontier pulse at `.github/workflows/gspc-continuous.yml`, which currently targets the governance lane; a cron-watch at `.github/workflows/hygiene-cron-watch.yml` detects missed schedules. These are **not** proof that all 34 axes are continuously rerun.

Create an **axis registry** with owner, gold bank, dataset version and licence, sample size, model set, scorer, test cadence, trigger policy, max age, production vs historical designation, CI, separation significance, privacy and publish gate. Every observation is tagged one of HISTORICAL_RUN, FRESH_CONTROLLED_RUN, LIVE_ENDPOINT_PROBE or OUTCOME_WITNESSED; never let a historical rerun look like an on-policy live agent observation.

Schedule by risk and change, not by arbitrary millions of calls: daily low-cost source/freshness probes; on-change signed release and model/harness checks; weekly bounded small control runs; monthly independently reviewed held-out samples; quarterly methods challenge and external replication. Gradually cover all 34 without asserting full daily capability beforehand. Retain the seven ties and seven untested comparisons as first-class results.

**Research integrity:** Remove answer-bearing metadata before referee assessment; blind model IDs when possible, hold out new labels, avoid training/test leakage, report exact paired statistical tests, use negative controls, annotate scorer disagreement, and compare on matching prompts/conditions. An LLM majority is not a ground truth oracle.

## 6. Operational heartbeat — automated, audited, not fictitious

The companion implementation in `scripts/ops/evidence-heartbeat.py` is a **first bounded observer**. It checks actual /api/gspc counts, /root.json structural consistency, public distribution freshness (separate entities), and /api/revenue attribution. It outputs exact source URLs and SHA-256s into a dated JSON report. It explicitly leaves private MEOK, cryptographic replay, independent approval/effect/receiver and continual 34-axis production as NOT_EVALUATED. The cron workflow archives the report without signing or publishing a grade.

**Next stage (not in this first PR):** bridge the existing GSPC pulse, root verifier, GitHub Actions status, Hugging Face revisions, M4/M2 fleet, CouncilOS readback, customer case ledger, regulator watch, and the independent witness into a typed evidence bus. Produce a single machine-readable readiness report where each field is VALID / INVALID / UNCHECKABLE / UNMEASURED / STALE, backed by named evidence. No "all green" summary while any required stage remains unknown.

**Causality vs correlation:** The 34-axis dashboard is an inventory; the evidence graph records who caused what and which independent verification supports it. Separate commercial adoption, software distribution, theoretical experiments and actual effects.

## 7. SWOT — with prioritised response

| | Internal / market facts | Action |
|---|---|---|
| Strengths | Published 34-axis inventory; cryptographic artefacts, public API/MCP, open banks, reproducible readers; founder shipping velocity | Turn one workflow into externally repeatable, human-understandable service |
| Weaknesses | Too many surfaces/PRs, historical vs live ambiguity, unsigned/misaligned corpora, incomplete real-human authority and receiving-party evidence, uneven customer validation | One release train, one operating register, gate unsupported public claims |
| Opportunities | Agentic deployments need outcome provenance; Ofgem focus; OTel/Inspect adapters lower adoption friction; UK assurance market development | Sell two-release signed-evidence pilot to a named buyer |
| Threats | MLCommons/Inspect are superior benchmark communities; observability vendors own trace UX; enterprise governance vendors have sales reach; standards/accreditation confusion; founder fatigue and single-device disk pressure | Differentiate on independent effect + receipt; publish negative controls; protect owner downtime and backup/recovery |

## 8. Business model, customer proof and unit economics

**Free forever:** verification, methodology, public corrections, sample cards and defensible open standards.

**Paid subject to verified delivery:** enterprise evidence assembly, new commissioned measurement with blinded instruments, signed release-to-release evidence bundle, fresh authorised-action outcome trace, retained monitoring with explicit SLA. Money cannot buy a grade, a rank or special treatment for a subject being evaluated.

**Pilot offer hypothesis (not quoted as an existing price):** £3,000 for a bounded, two-release demonstration for one agent workflow, one observable action, and one receiving-party acknowledgement; scope, privacy and data transfer agreements before engagement. Supplier costs, legal review, human time and buyers' willingness-to-pay require testing. *Illustration only*: three accepted pilots × £3,000 = £9,000 gross booked revenue; gross is not profit or recurring revenue.

**Acquisition:** targeted outreach to five automation/security/energy/legal AI product teams → recorded discovery → test-case spec → small paid proof-of-value → buyer-signed acceptance → maintenance subscription, with attribution at every stage. Publish outcome case study only with customer permission.

**Commercial ledger:** keep seven noninterchangeable stages separate: registry listings, gross distribution, qualified distribution, observed execution, economic use, repeat payers, institutional use. Never divide separate populations or claim their ratio as conversion. A 402 challenge is not payment; payment is not delivery; delivery is not acceptance.

## 9. Organisation and accountability

**Proposed functions, not claims of staffed departments:** founder/strategy, engineering and infrastructure, measurement science, evidence/security, human governance and dispute, customer delivery, legal/regulatory tracking, finance. For each lane record an accountable human, a secondary reviewer when authority truly exists, risk budget, cadence, stop condition, and signed acceptance. Unstaffed roles are OPEN rather than represented by autonomous agents as people.

**Rhythm (designed around the founder's sustainable routine):**
- **Monday:** founder personal/rest day, no required approvals or reactive work; urgent incidents route to documented break-glass rules, not assumed founder availability.
- **Tuesday:** 30-minute exceptions board, deploy/CI gate, one buyer priority.
- **Wednesday–Thursday:** bounded experiment and customer work, human approval of sensitive actions.
- **Friday:** publish one evidence-backed scorecard: independent value, engineering reliability, buyer/revenue evidence, sustainable human workload.
- **Daily unattended:** public signal collection, hashes, signed-source freshness, failure alerting, typed open-gate queue; no unsupervised irreversible external actions.
- **Monthly:** blinded research review, regulator evidence crosswalk, corrections, budget and recovery exercise.

## 10. Execution plan and acceptance gates

| Window | Deliverable | Prove it by | If not proved |
|---|---|---|---|
| Days 0–7 | Merge/test read-only heartbeat; stop source/claim drift; M4 free-space triage; map current PR owners | Workflow run ID, JSON artifact, 7 offline negative controls, disk snapshot | Remain draft, no production claim |
| Days 7–14 | One canonical two-release evidence schema and GSPC→MEOK adapter; owner-signed human authority process | Reproducible synthetic and one *genuinely authorised* real case | Label SIMULATION / NOT_AUTHORISED |
| Days 14–30 | Paired blinded study; root/signature/inclusion replay; independent witness and recipient acceptance pilot | Independent receiver-signature/digest verifies outside CSOAI | OPEN GATE; publish failure |
| Days 30–60 | Five discovery conversations, scoped pilot, independent replay pack, customer feedback | Named consents and signed acceptance (or explicitly no buyer) | Do not claim adoption |
| Days 60–90 | Repeatable product/SDK, versioned SLA and billing, release train | Two separately accepted runs and repeat use plus reconciled costs | No revenue forecast promoted to actual |

**Definition of done:** code committed + protected checks pass + merged + deployed + production endpoint independently read back + test data replayed + documented human and buyer acceptance *where required*. A PR or static page is not live completion.

## 11. Risk register — address in this order

1. **High:** private human authorisation→qualified executor→independent effect→recipient acceptance is not proven; cannot sell as a complete chain.
2. **High:** governance label leakage and blinded referee collapse invalidate expansive model-superiority/BFT interpretations.
3. **High:** M4 main Data volume observed ~99% used / 2 GiB available at 2026-11-24T00:20Z. Preserve source, check backups and only reclaim verified disposable caches after explicit source/destination hashes. M2 had ~21 GiB available.
4. **High:** many concurrent open release PRs and GitHub schedule drops; avoid conflicting merges and silent stale outputs.
5. **Medium:** mixed root/index corpora and mirrored proof state; cryptographic identity/inclusion must be independently checked.
6. **Medium:** downloaded package count cannot be attributed to adoption and may be distorted by registry counter disagreements.
7. **Medium:** market category and legal posture; do not misrepresent regulator approval, standards body participation or certification status.
8. **Medium:** workload, high caffeine and prolonged isolated screen sessions previously impaired sustainability; protect predictable rest and external human feedback.

## 12. Immediate owner decisions and exclusions

**Recommended NOW:** protect the current staged GSPC UI PR; ship only the evidence heartbeat through a separately reviewed PR; carry on the live-site / MEOK / WG maturity audit; conduct five buyer interviews; select one existing workflow for a real cross-party proof; establish an independent approver and receiver. Prioritise the M4 storage/recovery issue without moving or deleting unverified material.

**Explicitly defer:** building another foundation model, implying agent consciousness, treating a council vote as a scientific proof, issuing compliance certifications, creating dozens of new leaderboards, inflating combined downloads, mixing company populations, and presenting simulation as a live accepted effect.

**Success is a trustworthy system that operates when the founder steps away**, not evidence volume that depends on the founder working every waking hour.
