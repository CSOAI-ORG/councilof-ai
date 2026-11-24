# Competing architecture and research-loop transfer audit — 24 November 2026

**Status:** sourced engineering research, not a deployment, licence clearance, competitor certification or proof that another vendor lacks a feature. Official project architecture docs reviewed 24 November 2026; retain exact URL and review date for later requalification. Do not copy private competitor code, data, models or trademarks. No new production process, server, scheduler, credentials, ingestion, deployment or host was created.

## 1. Compare how platforms actually organise state

| Product | As-described source architecture | The operational loop worth borrowing | CSOAI choice now |
| --- | --- | --- | --- |
| [Langfuse](https://langfuse.com/handbook/product-engineering/architecture) | Postgres transaction state, Redis/Valkey queue/cache, object storage for ingest and payloads, ClickHouse for analytical queries; separated web/worker. [Their engineering deep dive](https://langfuse.com/resources/engineering/clickhouse-at-agent-scale) says raw event bytes land in object storage first, queue holds a reference, workers ingest asynchronously. | Ingest durably **before** heavy processing, process asynchronously and replay preserved raw events; inspect queue depth, failure/retry custody, retention and cost | Adopt the **design principle** only: canonical artifact bytes + digest then bounded derived projection; do not install ClickHouse/Redis on constrained Macs or invent a second store |
| [Comet Opik](https://www.comet.com/docs/opik/self-host/architecture) | Backend serving REST with ClickHouse analytics, MySQL transactional metadata, Redis cache/streams, MinIO files; UI and server separately deployable; [developer design article](https://www.comet.com/site/blog/llm-observability-architecture-engineering/). | Separate transactional control-plane from bulk trace analytics, make dataset/experiment version a first-class identity | Use existing Layer-0 and source-pinned GSPC index; no new DB/fleet unless actual volume justifies a benchmarked capacity case |
| [Arize Phoenix](https://arize.com/docs/phoenix/self-hosting/deploying-phoenix) | OpenInference/OTel instrumented SDK/client and a self-hostable server, SQLite default or PostgreSQL for production; [architecture](https://github.com/Arize-ai/phoenix/blob/main/docs/phoenix/self-hosting/architecture.mdx). | Simple trace collection + experiments, portable export, low-infrastructure entry before scale complexity | A compact read-only OTel/OpenLineage→canonical evidence-reference adapter is a higher-leverage first build than reconstructing the whole data plane |
| [LangSmith](https://www.langchain.com/langsmith/evaluation) | Observed traces, sampled failures into versioned datasets, evaluation runs plus human annotation queue. | Failed real run → human-labeled example → regression suite → CI gate → observe again | Implement an owner-mediated, rights-cleared failure→regression promotion with unchanged source time and separate human acceptance; no anonymous self-approval |
| [Inspect AI](https://inspect.aisi.org.uk/) | Reproducible task, dataset, solver, scorer, sandbox and evaluation-log separation. | Treat grader, task and model execution as independently pinned artifacts, not one black-box LLM-judge output | Use qualified Inspect-format imports and an external scorer against source-bounded GSPC where permitted |
| [MLflow](https://mlflow.org/docs/latest/genai/tracing) | OpenTelemetry-compatible distributed tracing and self-host / experiment tracking. | Keep standard OpenTelemetry context, export and redaction as explicit first-class steps | Map traces as observational metadata only; actual action effect and human authority require separate receiver/issuer proofs |
| [AWS AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness.html) | Managed agent execution harness with separate policy/identity/observability/evaluation services. | Runtime identity and tool permissions must be independent of model generated text; monitoring does not grant execution rights | Offer a portable proof consumer/provider around approved AWS trace and action receipts; do not compete on general hosting |
| [Google Gemini Enterprise Agent Platform](https://cloud.google.com/blog/products/data-analytics/enterprise-ai-agent-observability-with-bigquery-and-looker) | Cloud managed runtime/evaluation; BigQuery and Looker can expose first-party/third-party agent event observability. | Analytics consumer joins heterogeneous agent metadata with platform-specific identity and cost | Publish a **mapping** from source event→method→claimed actor→receiver (with unknown fields), not a false universal common trust score |
| [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-overview) | Dataset-driven evaluations, agent traces and integrated safety testing. | A fixed, repeatable source version for release qualification | Provide independent source/receiver reconstruction, not duplicate Azure's evaluator |
| [Patronus AI](https://docs.patronus.ai/docs) | Earlier evaluator services marked retired in current documentation; later world-model/simulation emphasis [world models](https://www.patronus.ai/resources/world-model-benchmarks). | Forecast before outcome and score simulation fidelity against later independently observed state | The SovSpace twin must make *prediction-time commitments*; simulated harm prevented is not actual harm prevented |

**Interpretation:** three common architectural ideas recur: (1) durable input bytes before derived data; (2) separate control-plane from high-volume telemetry; (3) an evaluation feedback loop bound to an actual incident, reviewer and method revision. Council should add the *fourth stage* of independent effect/recipient validation and trustworthy correction. This is a proposed position, not proof of a unique feature or competitive superiority.

## 2. First implementation boundary, tailored to the existing CSOAI estate

Use the **existing** file/artifact custody and GitHub Actions rather than moving all raw data to an experimental M2/M4 host:

- **Capture plane:** source-owning existing producer stores an authorized bounded original artifact plus source identity, observed/measurement timestamps, rights state and exact digest. No untrusted private content on public endpoints.
- **Index plane:** existing #4693/GSPC feed candidates join exact source and method revisions and preserve repeated/correlated observations. Never promote a computed summary to a signed card.
- **Experiment plane:** merged #4730 factorial/referee and #4763 metrology controls run approved, pinned, ideally offline trials; draft #4764 read-only view compares reported stages. No independent new simulator or scheduler.
- **Review plane:** versioned H.I.M./CouncilOS practice and unsent review draft only. Actual authenticated and scoped acceptance must use approved HITL issuer and revocation checks.
- **Effect plane:** separately qualified executor produces an actual response and the affected receiver checks the side effect; no self-attested success.
- **Distribution plane:** existing free verifier, MCP, native panel and public website can consume scoped qualified packets after protected release and privacy review.
- **Commercial plane:** an outside recipient obtains a defined reusable artifact, verifies it, accepts delivery and later returns; x402/payment is not an evidence measure.

### What not to migrate

No automatic object-store/ClickHouse/Redis/Kubernetes provisioning, private-host cleanup, config changes, Mac production deploy, Cloudflare or RunPod credential use, host scheduler, hidden logs or synthetic sim-to-real importer. The historic M2 low disk and release-owner gates still hold. Only a later qualified business/tech owner may authorize infrastructure expansion after **measured** volume, performance, retention and direct-cost evidence.

## 3. Operational SLO candidates — controls, not claims

Proposed indicators: source-capture success with explicit denominator; artifact retrieval by exact digest; provenance check success/UNCHECKABLE/FAIL; percent of qualified experiment runs whose complete inputs a separate reviewer can reproduce; human request acknowledgement *only after accepted coverage roster*; latency from accepted correction to protected public release; outside receiver-accepted delivery rate and attributable repeat use. A stale last-good snapshot is not “healthy now”; a fetch 403 does not prove a whole-site outage; a self-generated green build is not external use.

**Implement no SLO dashboards until the measured denominator and recording actor are both defined.** The existing business-operations collector has historical 15-minute instructions, but current uptime and deployment status are unverified.

## 4. Rights and security transfer

- Langfuse official architecture describes components, not permission to redistribute their enterprise-only code. Inspect the exact branch/project licence and dependency SBOM before imports.
- Phoenix's main source is under Elastic License 2.0 in recent reviewed records; **source-available != OSI-approved open source**; check selected client packages separately.
- Inspect is MIT; Opik's main code is Apache-2.0; **their sample datasets, hosted API terms, third-party weights and customer traces do not inherit those code licences**.
- Interop source formats (OpenTelemetry semantic conventions, W3C PROV-O, OpenLineage) are candidate references; no formal conformance without exact schema tests.
- An LLM assistant seeing private data is not a reviewer; a digest without independent signer trust is not independently authenticated; an OTel span does not prove its claimed physical-world effect.

## 5. Test the operating model before expanding infrastructure

**T1 — Artifact durability:** replay original authorized bytes from one existing source, prove that altering just one byte changes digest and untrusted self-consistent rehash cannot impersonate issuer; retain independent source.

**T2 — Trace equivalence:** import the *same* synthetic, rights-free agent trace via two permitted representations, preserve event identity/time and report field mapping loss rather than fill missing fields with false.

**T3 — Failure → regression:** register exactly one source-pinned historical defect, demonstrate blinded negative control and correct fix under release owners, and produce a reviewer-signed method acceptance if actually authorized.

**T4 — With/without human:** compare the same tasks across no human, irrelevant human, task-relevant information and actual human approval as **separate conditions**; score unknown outcomes and false blocks, not a single "human advantage" constant.

**T5 — True receiver proof:** obtain an actual authorized harmless action and the affected recipient's independent observation of the resulting change; keep payment and repeat use separate. This is the highest value unfinished acceptance gate.

### Review and owner handoff

The research/measurement owner can propose T1–T4 with source rights and controls; release/signing owners retain their protected path; authorized HITL actor and executor owner are mandatory for T5; customer/finance owners qualify buyer acceptance and actual economic margin. Without those owner receipts the workflow stays UNQUALIFIED, not “ready,” “approved,” “unblocked,” “revenue” or “live”.

This audit is a **source/research artifact**, not a claim that all competitor systems were installed or experimentally tested.
