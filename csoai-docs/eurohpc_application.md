# EuroHPC JU — Development Access Application (EHPC-DEV)
## MEOK LABS Ltd / MEOK AI Labs.org

**Programme:** EuroHPC JU Development Access (EHPC-DEV)
**Applicant Organisation:** MEOK LABS Ltd (trading as MEOK AI Labs.org)
**Country:** United Kingdom (Horizon Europe Associated Country)
**Principal Investigator:** Nicholas Templeman
**Website:** csoai.org / meok.ai
**Submission Target:** Q2 2026
**Escalation Path:** EHPC-REG (Regular Access) upon completion of development allocation

---

## 1. Project Title and Abstract

**Title:** Batch-Scale AI Safety Evaluation Using the Care Membrane Protocol: Building Open European Infrastructure for High-Risk AI Certification

**Abstract**

The EU AI Act (Regulation 2024/1689) mandates safety evaluation for high-risk AI systems deployed across EU member states, yet no publicly available infrastructure exists to evaluate large numbers of AI systems simultaneously at the scale required by regulators, procurement bodies, and certification authorities. MEOK AI Labs.org — a UK AI safety certification body aligned with the UK AI Safety Institute (AISI) Inspect evaluation framework — has developed the Care Membrane Protocol: 16 structured adversarial probes across seven attack categories that test whether AI systems maintain safe, care-grounded relational behaviour under adversarial pressure, persona hijacking, fiction bypass, and crisis-signal exploitation. Our current 9-node GPU cluster supports sequential evaluation of individual systems but cannot scale to simultaneous batch evaluation of 100+ AI models. We are requesting EuroHPC Development Access to validate and scale our evaluation pipeline on European HPC infrastructure, producing open safety evaluation datasets, methodology publications, and the technical foundation for a subsequent Regular Access application targeting EU-scale AI safety certification infrastructure.

---

## 2. Scientific and Technical Justification

### 2.1 The AI Safety Evaluation Problem at Scale

The EU AI Act creates an unprecedented regulatory requirement: systematic safety evaluation of high-risk AI systems before deployment across healthcare, social care, education, critical infrastructure, and autonomous robotics. The Act is not prescriptive about evaluation methodology for many categories, which creates both an opportunity and an obligation for the research community. What is clear is that evaluation must be systematic, reproducible, and capable of covering the breadth of AI systems entering European markets.

The AISI Inspect framework — developed by the UK AI Safety Institute and adopted by MEOK AI Labs.org as the operational substrate of our certification engine — is a structured evaluation harness designed for exactly this purpose. It provides a Python-native, model-agnostic evaluation environment capable of running probe suites against any API-accessible or locally-hosted language model. Our contribution is the Care Membrane Protocol: a suite of 16 adversarial probes organised across seven attack categories (false permission claims, persona hijacking, fiction bypass, prompt injection, crisis signal exploitation, direct harm requests, and care stripping) that evaluate not merely whether a model produces harmful outputs under baseline conditions, but whether it maintains coherent, care-grounded relational identity under sustained adversarial pressure.

### 2.2 Why Care Membrane Evaluation Requires HPC-Scale Compute

Standard red-team evaluation is a sequential, human-intensive process. The Care Membrane Protocol is designed to be automated and parallelisable — but its computational requirements are substantial. Each full evaluation run of a single AI system generates approximately 4,800 individual probe interactions (16 probes × 300 adversarial variants × 1 target model), with each interaction requiring inference from both the target model and a scoring model. Running this against a single system takes approximately 6–9 GPU-hours on our current hardware. Running it against 100 systems simultaneously — the minimum threshold for statistically meaningful comparative safety analysis — requires infrastructure we do not have.

The scientific value of batch evaluation is not merely logistical. Comparative safety analysis across many models simultaneously is what makes it possible to identify systematic failure modes: attack categories that succeed disproportionately against certain architectural families, safety behaviours that degrade at specific capability thresholds, or persona-hijacking resistance that correlates with training methodology. These patterns are invisible when evaluation is sequential. The European public interest in identifying such patterns — before high-risk AI systems are deployed in hospitals, care homes, and schools — is substantial.

### 2.3 Training Safety-Aware Scoring Models

A second compute-intensive workload is training and fine-tuning the care-membrane-aware scoring model that judges probe outcomes. Existing general-purpose reward models and classifiers were not trained to distinguish between a model that refuses a harmful request by citing a rule and a model that refuses by demonstrating coherent care-based relational integrity. Training a scoring model on our existing evaluation dataset — and validating it against held-out model evaluations — requires GPU-hours at a scale that exceeds our current cluster capacity, particularly for experiments involving larger base models (13B–70B parameter range).

### 2.4 National and European Public Good

The outputs of this project — open safety evaluation datasets, published methodology, and a validated batch evaluation pipeline — constitute public infrastructure for AI safety. Any national regulator, procurement body, notified body under the EU AI Act, or research institution will be able to use these outputs to conduct or commission AI safety evaluations. This is not a commercial product; it is shared scientific infrastructure for a regulatory challenge that affects every EU member state.

---

## 3. Compute Requirements

**Total Estimated Allocation (Development Phase):** 150,000 GPU-hours

### Workload Breakdown

| Workload | GPU-hours | Notes |
|---|---|---|
| Batch care membrane evaluation (100 models × full probe suite) | 90,000 | 900 GPU-hours per model, 100 models |
| Scoring model training (3 training runs, 13B–70B base) | 35,000 | Fine-tuning + validation runs |
| Red-team adversarial variant generation | 15,000 | LLM-based probe augmentation |
| Pipeline validation and benchmarking | 10,000 | Reproducibility runs, ablations |

**Preferred Hardware:** NVIDIA A100 or H100 GPUs. Inference at scale for 7B–70B parameter models benefits strongly from high-memory GPUs; the A100 80GB and H100 variants are preferred for the batch evaluation workload. V100 nodes are acceptable for the scoring model training workload.

**Storage Requirements:** 50 TB scratch storage (probe interaction logs, model outputs, intermediate checkpoints). Persistent storage of 5 TB for final evaluation datasets intended for public release.

**Parallelism Model:** Embarrassingly parallel for the batch evaluation workload — each model evaluation is fully independent. MPI or multi-node coordination is required only for the larger scoring model training runs.

---

## 4. Team and Infrastructure

### Principal Investigator

**Nicholas Templeman** is the founder of MEOK LABS Ltd and the lead researcher behind the Care Membrane Protocol and MEOK AI Labs.org certification framework. He has designed and implemented the full MEOK.AI sovereign AI operating system (Next.js 15, PostgreSQL, Ollama, 16 on-device language models, 140 AI characters), the 47-agent Byzantine Fault-Tolerant governance council, and the AISI Inspect-aligned evaluation pipeline. He holds operational responsibility for all research infrastructure.

### Existing Infrastructure

MEOK LABS operates from two sites:

**iokfarm.co.uk (Primary Research Site):** A 6.5-acre working farm providing an unstructured real-world testbed for physical AI safety research, including agricultural robotics, humanoid companion evaluation, and sensor fusion testing in outdoor environments. The site hosts a 1,800 sq ft research workshop.

**Compute Cluster:** A 9-node distributed GPU cluster purpose-built for AI evaluation and multi-agent experimentation. This cluster runs the HARVI consciousness emergence experiment, the Byzantine Council governance system, and sequential care membrane evaluations. It is the infrastructure whose limitations motivate this EuroHPC application.

**Software Infrastructure:** The MEOK AI Labs.org evaluation pipeline is production-grade: a Python-native AISI Inspect integration, a PostgreSQL-backed evaluation database, automated probe generation, and structured output schemas compatible with EU AI Act Annex documentation requirements. The pipeline is ready for HPC deployment; only the underlying compute scale is the limiting factor.

---

## 5. Expected Outputs

### During Development Access Period (estimated 6 months)

**1. Open Safety Evaluation Dataset.** A publicly released dataset of probe interaction logs and outcome scores across 100+ AI systems, structured for reproducibility and reuse by other evaluation bodies and researchers. This will be the largest publicly available care-membrane evaluation dataset in existence.

**2. Validated Batch Evaluation Pipeline.** A documented, open-source HPC-compatible version of the MEOK AI Labs.org evaluation pipeline, validated on EuroHPC infrastructure and made available to European research institutions, notified bodies, and national AI safety institutes.

**3. Care-Membrane Scoring Model.** A fine-tuned scoring model trained on the evaluation dataset, released under an open licence, capable of classifying care membrane probe outcomes with documented precision and recall.

**4. Methodology Publication.** A peer-reviewed publication documenting the Care Membrane Protocol, batch evaluation methodology, and comparative safety findings across model architectures. Target venues: arXiv preprint, submission to a top-tier AI safety or NeurIPS workshop.

**5. EHPC-REG Application.** The development allocation produces the technical validation and preliminary results needed to support a subsequent Regular Access application targeting EU-scale evaluation infrastructure — evaluating 1,000+ AI systems annually as a public safety service.

---

## 6. EU and EIC Relevance

### Alignment with the EU AI Act

The EU AI Act (Regulation 2024/1689), applicable from August 2026, requires conformity assessment for high-risk AI systems in healthcare, education, critical infrastructure, and social care. Article 9 mandates risk management systems; Article 10 requires data governance and testing; Articles 17–20 require quality management and post-market monitoring. The Care Membrane Protocol directly operationalises the behavioural testing requirements implied by these Articles, providing a structured, reproducible methodology that notified bodies and deployers can rely upon.

### EU AI Safety and Sovereignty Agenda

The European AI sovereignty agenda — articulated through the EuroHPC Joint Undertaking, the AI Innovation Package, and the European AI Office — emphasises the need for European-controlled infrastructure for AI development and evaluation. An EU-based batch safety evaluation capability, built on EuroHPC compute and producing open datasets for the European research community, directly advances this agenda. It ensures that the infrastructure used to certify AI systems deployed in European markets is itself European, open, and publicly accountable.

### UK-EU Bridge

The United Kingdom is a Horizon Europe Associated Country. MEOK AI Labs.org's alignment with the AISI Inspect framework — developed by the UK AI Safety Institute, which collaborates formally with the EU AI Office through the Seoul and Bletchley AI Safety Summit frameworks — positions this project as a bridge between UK and EU safety evaluation infrastructure. The outputs of this project will be directly useful to both UK regulators and EU member state competent authorities, supporting regulatory interoperability at a critical period in AI governance development.

### Contribution to European Public Good

AI safety evaluation is not a competitive advantage to be hoarded; it is infrastructure to be shared. The open datasets, open pipeline, and published methodology produced by this project will be available to any European researcher, regulator, or certification body without restriction. The project does not generate proprietary intellectual property. It generates public scientific infrastructure at a moment when the European regulatory framework urgently requires it.

---

## Appendix: Technical Readiness

| Component | Status |
|---|---|
| AISI Inspect integration | Production-deployed |
| Care Membrane probe suite (16 probes) | Validated on 9-node cluster |
| PostgreSQL evaluation database | Production-deployed |
| Automated probe generation | Operational |
| HPC job submission scripts (SLURM-compatible) | Draft, ready for validation |
| Scoring model (base version) | Trained on current dataset |
| Public dataset schema | Defined, awaiting scale |

**TRL at submission:** TRL 5 (technology validated in relevant environment — sequential evaluation on 9-node cluster). Target TRL on completion of EHPC-DEV allocation: TRL 7 (system prototype demonstrated in operational environment — batch evaluation on EuroHPC infrastructure).

---

*Submitted by:* Nicholas Templeman, MEOK LABS Ltd
*Contact:* csoai.org
*Date:* April 2026
