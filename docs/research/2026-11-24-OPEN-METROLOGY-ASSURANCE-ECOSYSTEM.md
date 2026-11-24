# Council of AI — Open science, industrial assurance and integration strategy
**24 November 2026. Public research proposal; NOT an accepted industry standard, a legal opinion, vendor endorsement, independent scientific validation or permission for an external effect.**

## Executive research thesis

Build one seamless CouncilOS interface for multiple external frameworks, rather than recreating every vendor's observability, evaluation, identity, industrial telemetry, ontology and SIEM software. The differentiator is the **measurement-to-authority-to-effect evidence boundary**:

source and check standard → reproducible grader and uncertainty → agent trace → independently enforceable permission and scope → authentic human decision when required → bounded executor → recipient-controlled before/after readback → challenge and independently verifiable signed evidence → commercial settlement (separate from proof of correctness).

An approved model, passing safety score, policy declaration, trace, human vote, signed digest or paid transaction is not interchangeable with the other elements. The platform must preserve UNKNOWN and NOT OBSERVED rather than manufacture a green status.

### Implemented new pilot

[One real archived GSPC check-standard](../../measurement/experiments/gspc-grader-checkstandard/README.md) checks 26 distinct historical safety-response strings from nine model identifiers against a source-derived literal oracle, with 11 separate synthetic mutations. The unchanged master grader failed four malformed reasoning-tag checks; the corrected grader candidate from PR #4800 failed none. Both matched the 26 narrow real literal-reference patterns. This is **instrument testing**, not independent model safety calibration.

## Best ecosystem partners to integrate (no assumed partnership or free tenant access)

| Tool / supplier | Open entry point | Council integration and dependency |
| --- | --- | --- |
| NVIDIA OpenShell | [Apache-2.0 agent sandbox](https://github.com/NVIDIA/OpenShell) | Independently test runtime file/network permission enforcement in an approved sandbox, capture redacted tool outcomes, do not allow live effects by default |
| NVIDIA NeMo Relay | [Apache-2.0 agent middleware](https://github.com/NVIDIA/NeMo-Relay) | Agent and tool lifecycle, OTel spans, scope-aware refusal and event correlation; prefer over [deprecated NeMo Agent Toolkit](https://docs.nvidia.com/nemo/agent-toolkit/latest/) |
| NVIDIA NeMo Guardrails | [Open guardrails library](https://github.com/NVIDIA-NeMo/Guardrails) | Version-pin enforcement results and overlap/error correlation with a separate evaluator |
| Red Hat / IBM TrustyAI | [Open responsible-AI toolchain](https://trustyai.org/) | Import calibrated eval evidence and metadata; OpenShift entitlement/cost remains separate |
| UK AISI Inspect AI | [MIT-licensed evaluation framework](https://github.com/UKGovernmentBEIS/inspect_ai) | Frozen tasks, per-sample results, scorer identity and negative controls |
| Microsoft PyRIT | [MIT-licensed red teaming](https://github.com/microsoft/PyRIT) | Approved adversarial runs with explicit provider terms and bounded resource cost |
| Langfuse | [MIT core, separate enterprise folders](https://github.com/langfuse/langfuse) | Trace/experiment references, source hashes, storage and token-cost accounting |
| Arize Phoenix | [Elastic License 2.0](https://github.com/Arize-ai/phoenix) | Adopt trace interoperation first; ELv2 is NOT unrestricted MIT/Apache reuse |
| Palantir Foundry OSDK | [Public OSDK documentation](https://www.palantir.com/docs/foundry/ontology-sdk) | Customer-authorised ontology reads and actions; requires actual Foundry customer enrolment and scoped permissions, not public documentation alone |
| Cisco AI Defense | [Validation API](https://developer.cisco.com/docs/ai-defense-management/api-changelog/) and [SDK org](https://github.com/cisco-ai-defense) | Ingest permitted validation outcomes only; SDK availability does not grant a paid platform |
| CrowdStrike Falcon | [FalconPy](https://github.com/CrowdStrike/falconpy) and [NG-SIEM ingestion](https://developer.crowdstrike.com/ngsiem/data-ingestion/) | One-way bounded alert metadata export with tenant credentials/consent, redaction and cost limits |
| OpenTelemetry | [GenAI conventions](https://github.com/open-telemetry/semantic-conventions-genai), [event specification](https://opentelemetry.io/docs/specs/semconv/general/events/) | Neutral runtime event envelope for CouncilOS, GSPC and MEOK |
| OPA | [Open Policy Agent](https://www.openpolicyagent.org/docs) | Independent policy-decision sidecar; prove separate actual executor enforcement |
| Sigstore, DSSE and in-toto | [in-toto](https://in-toto.io/) and [Sigstore](https://www.sigstore.dev/) | Exact-byte evidence and signing root consistency, without re-signing or backdating held invalid roots |
| MergeKit | [Open model-merging tools](https://github.com/arcee-ai/mergekit) | New model candidate only; run held-out GSPC tests and shared-error/dependence checks before any deployment |

The vendor integration strategy is **one consented read-only adapter at a time, with measurable acceptance, uptime, cost, licensing and failure modes**. No automatic tool registration should expose private prompts, credential material or customer data to the public GSPC.

## Old disciplines that strengthen new AI metrology

- **Nuclear and power station reliability:** [IAEA equipment reliability](https://doi.org/10.61092/iaea.aig0-aa1s) and [NERC event analysis](https://www.nerc.com/our-work/reports) contribute check standards, fault trees, alarm quality, common causes, time-to-detection, maintenance records and pre/post-incident sequence analysis. They do not authorise Council to operate an industrial control system.
- **Aerospace prognostics:** [NASA PCoE data](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/) provides degradation and simulator-study concepts. **NASA's C-MAPSS portal currently warns some simulator data downloads are unavailable**; do not silently use random third-party mirrors as authenticated NASA raw data.
- **Near-miss investigation:** [NASA ASRS](https://asrs.arc.nasa.gov/search/database.html) is a rich human-factor taxonomy, but its reports are voluntary and **not independently validated by NASA**. A source report is a candidate event, not verified truth.
- **Open accident records:** [NTSB downloadable aviation incident/accident data](https://www.ntsb.gov/safety/data/pages/Data_Stats.aspx) may support external cause-and-consequence schema validation after usage, sensitivity and licensing review. Accident records do not make analogous AI system failures probable.
- **AI watchdog sources:** [OECD AIM](https://oecd.ai/en/incidents-methodology) distinguishes incident from potential hazard; the [AI Incident Index](https://www.aiincidentindex.org/terms) publishes CC BY 4.0 terms for its own v2026.09 data. Underlying linked news/media may have different rights.
- **Adversarial taxonomy:** [MITRE ATLAS](https://github.com/mitre-atlas/atlas-data) supplies threat hypotheses. Pin the release and review its licence before copying data; do not reinterpret taxonomy membership as a verified real customer attack.
- **Open measurement science:** [NIST Metrology Center](https://airc.nist.gov/metrology/) and [metric-submission instructions](https://airc.nist.gov/metrology/how-to-submit/) offer a public path for methods. Catalog inclusion is not NIST approval, nor should Council submit an unvalidated metric as independently calibrated.

Mathematical next steps: stratified check standards, robust false-alarm and detection-delay estimates, Wilson intervals with stated denominators, measurement reference-uncertainty budgets, source censorship and missing-data accounting, clock-gap and common-cause dependence tests, sequential change-point tests, and explicit effective sample size under correlated model/reviewer outputs. A greater number of axes does not imply a greater number of independent instruments.

## Watchdog → SovSpace → optional human decision and real effect

Existing source registry and Watchdog [rights controls](../../docs/watchdog/incident-signal-layer.md) remain authoritative. No second event ontology or human authority store is justified.

**Stage A, observed:** a source page or API responds, its bytes are pinned, observation time and declared rights are recorded. Reachability alone does not identify or confirm an incident.

**Stage B, reported:** after source-specific terms, provenance, privacy, deduplication and scope approval, a public report can become a reported incident candidate. Keep reported, corroborated, disputed and uncheckable states separate. Council's existing AIAAIC rights review is not a licence to ingest for commercial risk scoring.

**Stage C, simulated:** a source-qualified hypothesis maps to the existing synthetic authority-effect fault twin. In SovSpace, draw alternative future paths: no action, mitigation, ineffective mitigation, common-mode controls failing, broken replay controls, stale measurement, missing receiving-party evidence. Show initiating assumptions and sensitivity. These are **hypothetical paths**; Newton's action-reaction analogy is not an engineering law for human, social or AI outcomes.

**Stage D, human:** a named, competent, consented and actually delegated human may review/refuse. No accepted human member means NOT_STAFFED, never implicit authorisation.

**Stage E, real:** only a qualified runtime may enforce scope, revocation and idempotency on a customer-approved bounded tool operation. Independent receiver readback is required. Signing integrity and x402 settlement are separate later steps.

To present this as one seamless product, make CouncilOS the user-facing control room and standardize a small adapter contract around immutable evidence refs, OpenTelemetry events and the **existing** Council authority profile. NeMo Relay/OpenShell, Palantir, Red Hat, CrowdStrike and Cisco are optional edge connectors, not assumptions that they are installed or partnered.

## Near-term operating decisions

**Daily now:** GitHub watchdog intake succeeded Nov 23, pulse HF mirror succeeded Nov 24, daily canary capture succeeded Nov 23. The signed daily report failed Nov 22/23 and has a separate active repair PR. The silent-change paid watch remains OFF pending provider permission/calibration, and the CUSUM project was an on-demand synthetic CI experiment. The new real-source check-standard is in a public PR with a proposed daily scheduled GitHub Actions job; it becomes operational only after merge and post-merge scheduled artifact verification.

**Article 50:** On 24 Nov 2026, Article 50 generally applied from 2 Aug 2026. The upcoming **2 Dec 2026** transitional deadline applies to Article 50(2) marking/detection for some pre-existing generators; do not market it as a universal new law. See [official FAQ](https://ai-act-service-desk.ec.europa.eu/en/faq) and [consolidated legislation](https://eur-lex.europa.eu/eli/reg/2024/1689). Commercial product: evidence-readiness check with case-specific human legal-review gate, not a compliance certificate.

**Costs and monetisation:** Keep one source-pinned dataset and a 10–15 minute bounded CI limit; do not buy enterprise vendors for an unaccepted adapter. Log exact artifact size, compute minutes, storage and one partner integration's readback. Offer first a scoped measured-agent audit and later a consented executor-to-receiver negative-control pilot. Existing micropayment wallets and settlement records are commercial signals, **not identifiable paying customers or proof of service quality**.

**Release gates:** Actual production acceptance requires independently judged reference labels, realistic false-alarm costs, privacy review, provider terms, a verified customer sandbox, authenticated accepted human authority, enforced executor policy, receiving-party before/after readback and signed final evidence. Missing remains missing; no synthetic experiment can close these gates.

## Research reaction-chain rule

For every candidate source event or changed model output ask: What was observed? What is only claimed? What other explanation might generate the same signal? Which source/reviewer/checks share a common failure? Which negative control would falsify the hypothesis? How do the **no-action, action and failed-action** consequences differ? Where does consent become necessary? What readback would prove the final effect? Which uncertainty remains?

Prioritise by harm, evidence availability, ability to falsify, privacy/rights, operational cost and business value. Do not claim the infinite space of possible chain reactions can be exhausted.
