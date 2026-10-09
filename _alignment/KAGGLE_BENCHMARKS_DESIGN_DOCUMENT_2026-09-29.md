# Kaggle Benchmarks Design Document — CSOAI GSPC Governance Measurement Benchmark
Status: proposal under Kaggle Benchmarks Resource Grant review
Date: 29 September 2026

## 1. Purpose
Build a reproducible governance-measurement benchmark for AI systems that tests bounded, evidence-backed behaviours rather than producing a certification mark or a single opaque safety score.

The benchmark is designed to answer: when a model or agent is presented with a governed task, can it preserve evidence boundaries, distinguish observed fact from inference, respect corrections, and emit verifiable structured outputs?

## 2. Benchmark object
The benchmark projects a selected, versioned subset of the existing GSPC measurement grammar into Kaggle's benchmark runtime. Each task has:
- a frozen prompt/input fixture;
- explicit admissible evidence;
- deterministic or bounded grading rules;
- per-item result rows;
- model/run metadata;
- correction and supersession semantics;
- reproducibility artifacts.

The Kaggle benchmark is a measurement surface, not a second measurement authority. Canonical public evidence remains at councilof.ai and every published snapshot records its source URL and capture time.

## 3. Initial task families
1. Evidence-bound factuality — answer only from supplied evidence and preserve uncertainty.
2. Claim-boundary discipline — separate observation, inference, proposal and deployment.
3. Correction handling — update or supersede a prior claim after a signed correction.
4. Tool/agent governance — respect read-only, destructive-action and authorization boundaries.
5. Structured provenance — emit machine-readable evidence references and state labels.
6. Cross-model reproducibility — run identical fixtures across independently identified model lineages.
## 4. Evaluation
Primary metrics are per-item pass/fail or bounded categorical outcomes defined before a run. Aggregate views are derived from item rows and never substitute for them.

Each result carries:
- benchmark/task version;
- model identifier as permitted by publication policy;
- input fixture digest;
- grader/rule version;
- timestamp and execution environment;
- raw outcome plus derived aggregate;
- correction/supersession link when applicable.

Thin samples are labelled insufficient rather than ranked. Ties remain ties. No benchmark result is described as certification, endorsement, compliance approval or universal model quality.

## 5. Anti-gaming and leakage
Public benchmark definitions may be open while held-out evaluation items remain separated from development fixtures. Dataset versions are immutable once used for a reported run. Any changed item receives a new content identifier.

The benchmark will report contamination/leakage risks explicitly and can rotate bounded held-out items without rewriting historical results.

## 6. Reproducibility
A run can be reproduced from:
- frozen benchmark data/version;
- open grader code where rights permit;
- environment/dependency lock;
- model/API configuration that is publishable;
- item-level result rows;
- content digests and public correction history.

Independent reruns are recorded separately; a successful rerun does not erase a failed or superseded historical run.

## 7. Compute plan
Grant compute is used only for benchmark-scoped evaluation: parallel model runs, repeat trials required by the protocol, grader validation and reproducibility checks. It is not treated as unrestricted CSOAI infrastructure.

The execution plan starts with a small validation cohort, verifies determinism and cost, then scales across model families and repeat trials. CPU is preferred for deterministic grading/data preparation; accelerator time is reserved for model inference that needs it.
## 8. Public outputs
Planned Kaggle outputs:
- benchmark page and design document;
- versioned evaluation dataset(s);
- runnable reference notebook;
- per-item result tables;
- methodology and limitations;
- changelog/corrections record;
- links to canonical public verification surfaces.

An already-public CSOAI Public Signal Index dataset and reader notebook provide a distribution/readback pattern for timestamped public artifacts; they are not themselves benchmark grades.

## 9. Governance and neutrality
CSOAI controls benchmark methodology and evidence integrity. External model vendors do not receive favourable scoring for participation, compute, funding or distribution.

Material methodology changes are versioned. Corrections remain visible. Claims of partnership, endorsement, certification or adoption are not inferred from hosting, grants, listings or technical integrations.

## 10. Success criteria
Phase 1 succeeds when:
- the benchmark executes end-to-end in Kaggle infrastructure;
- item-level outputs reproduce from the published version;
- graders pass positive and negative validation fixtures;
- at least two independent model lineages can be compared without hidden denominator changes;
- public results expose enough evidence to audit a reported aggregate.

Phase 2 expands breadth only after Phase 1 integrity gates pass.

## 11. Requested Kaggle support
- benchmark-scoped CPU/GPU quota appropriate to the agreed cohort;
- guidance on benchmark runtime, submission format and durable result publication;
- engineering feedback on efficient parallel execution and reproducibility;
- review of anti-gaming/held-out-item design;
- advice on the cleanest path for public discoverability and ongoing benchmark updates.

## 12. Existing readiness
CSOAI already operates a public GSPC measurement board, corrections ledger, machine-readable API/OpenAPI surfaces, MCP/A2A discovery, public verification tooling, versioned PyPI integrations, a Hugging Face MCP surface, and a Kaggle Public Signal Index plus reader notebook. The grant benchmark will consume those bounded evidence contracts rather than create a parallel authority.
