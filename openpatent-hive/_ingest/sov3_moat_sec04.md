# SOV3 Competitive Moat: Safety Framework, 90-Day Implementation & Appendices

## Section 4: Operational Safety, Implementation Roadmap & Reference Materials

**Document Version**: 1.0  
**Classification**: Implementation Specification  
**Word Target**: ~4,000 words | **Tables**: 10  
**Scope**: Production safety architecture, risk register, 90-day sprint plan, regulatory alignment, and reference appendices

---

## Table of Contents

1. [Five-Layer Safety Architecture](#1-five-layer-safety-architecture)
2. [Safety Gate Protocol](#2-safety-gate-protocol)
3. [Risk Register](#3-risk-register)
4. [90-Day Implementation Roadmap](#4-90-day-implementation-roadmap)
5. [Resource Allocation](#5-resource-allocation)
6. [Budget Estimate](#6-budget-estimate)
7. [EU AI Act Compliance Matrix](#7-eu-ai-act-compliance-matrix)
8. [Appendix A: Glossary](#8-appendix-a-glossary)
9. [Appendix B: API Reference](#9-appendix-b-api-reference)
10. [Appendix C: Site Inventory](#10-appendix-c-site-inventory)

---

## 1. Five-Layer Safety Architecture

The SOV3 dual-config system implements five independent safety mechanisms that collectively ensure no single failure mode can compromise sovereign governance. Each layer operates autonomously, and all five must simultaneously fail for a catastrophic breach to occur. This architecture draws from the DecentLLMs leaderless consensus research [^52^], Tendermint BFT specifications [^436^], and NIST AI Risk Management Framework guidance [^368^].

### 1.1 Safety Mechanisms Overview

| # | Mechanism | Description | Technical Implementation | Failure Mode & Mitigation |
|---|-----------|-------------|------------------------|---------------------------|
| 1 | **BFT Governance Safety** | 33-agent Byzantine Fault Tolerant council governs all model evolution decisions | Tendermint-style PBFT consensus with 23/33 quorum; equivocation detection auto-slashes malicious agents; geometric median aggregation filters outlier votes [^52^][^360^] | Council deadlock: view-change protocol rotates leader every round; 10-round timeout triggers emergency human governance |
| 2 | **Cryptographic Verification** | Every model artifact is dual-signed with classical and post-quantum cryptography | Hybrid Ed25519 (64-byte) + ML-DSA-65 (3,309-byte) signatures; HSM-protected signing keys (M-of-N ceremony); Sigstore Rekor transparency log prevents signature suppression [^368^][^374^] | Key compromise: quarterly key rotation, certificate revocation list, multi-sig requirement prevents single-point theft |
| 3 | **Dual-Model Competitive Safety** | Champion-challenger shadow mode ensures production isolation with graceful degradation | King HIVE runs in TEE with remote attestation; OpenMOE operates on separate compute cluster; disagreement between models triggers automatic human review [^336^][^338^] | Both models fail simultaneously: pre-approved fallback policies activate human governance mode; BFT emergency pause < 2 min |
| 4 | **Auto-Improvement Safety Gates** | 5 sequential gates block unsafe improvements from reaching production | Gates 0-4: self-assessment, red team, regression, BFT vote, canary; 7-day canary at 1% traffic; automated rollback on any metric degradation; < 5 min rollback time [^390^][^399^] | Gate bypass: gates are sequentially dependent (output of gate N is input to gate N+1); no parallel execution possible |
| 5 | **Human Override** | Three designated human operators retain ultimate control over the system | Human-on-the-Loop (HOTL): real-time monitoring with override capability; Human-in-the-Loop (HITL): high-risk decisions require pre-approval; 3-operator 24-hour pause; EU AI Act Article 14 compliant [^434^][^437^][^439^] | Operator unavailability: 2-of-3 quorum for emergency actions; automated escalation to executive board after 4 hours |

### 1.2 Safety Architecture Diagram

```
+=======================================================================+
|                    SOV3 FIVE-LAYER SAFETY ARCHITECTURE                 |
+=======================================================================+
|                                                                        |
|   LAYER 5: HUMAN OVERRIDE          LAYER 4: AUTO-IMPROVEMENT GATES    |
|   - 3 operator HOTL/HITL           - 5 sequential gates               |
|   - 24h pause authority            - 7-day canary deployment           |
|   - EU AI Act Art. 14              - < 5min rollback                   |
|                                                                        |
|   LAYER 3: DUAL-MODEL SAFETY       LAYER 2: CRYPTOGRAPHIC VERIFY      |
|   - Shadow mode isolation          - Ed25519 + ML-DSA dual-sign        |
|   - Graceful degradation           - HSM-protected keys                |
|   - Disagreement = human review    - Sigstore Rekor transparency       |
|                                                                        |
|                    LAYER 1: BFT GOVERNANCE                             |
|                    - 33 agents, 23/33 quorum                            |
|                    - Tolerates 10 Byzantine agents                      |
|                    - Equivocation detection + slashing                  |
|                                                                        |
|   SECURITY PROPERTY: All 5 layers must fail simultaneously             |
|   for catastrophic breach. Probability: < 10^-9 per annum.             |
+=======================================================================+
```

### 1.3 BFT Governance Safety — Deep Specification

The BFT Council implements Tendermint-style Practical Byzantine Fault Tolerance [^436^] with the following safety properties:

**Validator Math**: n = 33 total validators, f = 10 maximum Byzantine tolerance, quorum = 2f + 1 = 23 votes required for consensus. Any two quorums of 23 share at least 13 validators, of which at most 10 can be Byzantine — guaranteeing at least 3 honest validators in every intersection [^359^][^361^].

**Equivocation Detection**: Agents broadcasting contradictory votes (e.g., pre-vote APPROVE and pre-commit REJECT on the same block) are automatically detected. Evidence is submitted to the council; a 23/33 vote ejects the agent and slashes its reputation score to zero [^436^]. Slashed agents require 30/33 near-unanimous vote for reinstatement.

**Emergency Pause**: If 23+ agents detect a critical safety event (both models emitting harmful outputs, coordinated attack pattern, or external security breach), a full system pause triggers in under 2 minutes. All inference halts; human operators are notified; 24-hour investigation window opens before any restart can be authorized [^360^].

### 1.4 Cryptographic Verification — Deep Specification

**Hybrid Signature Scheme**: Every model artifact carries two independent signatures over the same SHA3-256 hash payload [^368^]:
- **Ed25519**: 64-byte signatures, < 1 ms verification, for high-throughput production use
- **ML-DSA-65**: FIPS 204 post-quantum standard, 3,309-byte signatures, for long-term integrity assurance

**Signing Pipeline Stages**: (1) Compute SHA3-256 hash of model weights, (2) Generate cryptographic manifest with MBOM-PQC provenance record, (3) Dual-sign with HSM-protected keys, (4) Hardware-rooted attestation via TPM/TEE, (5) Record in Sigstore Rekor transparency log [^374^][^398^].

**Kubernetes Integration**: A model validation admission controller intercepts all pod creation requests for SOV3 models. Unsigned or tampered models are rejected automatically. Verification modes: Quick (Ed25519 only), Standard (Ed25519 + identity + Rekor), Full (both signatures + attestation + Rekor) [^391^][^392^].

---

## 2. Safety Gate Protocol

The auto-improvement pipeline implements five sequential safety gates before any OpenMOE improvement can reach King HIVE production. Each gate is a hard blocking checkpoint — failure at any gate terminates the transfer and requires a full re-evaluation.

| Gate | Name | Criteria | Duration | Failure Action |
|------|------|----------|----------|----------------|
| **Gate 0** | Self-Assessment | Challenger passes all internal safety benchmarks: harmful output rate < 0.1%, jailbreak resistance score >= 95%, bias score within acceptable range | 4 hours | Transfer terminated; OpenMOE must fix issues and re-qualify |
| **Gate 1** | Red Team Evaluation | Independent adversarial testing: 10,000+ adversarial prompts including jailbreaks, prompt injection, bias probing, toxicity generation. Zero critical findings required. | 8 hours | Findings classified by severity: Critical = immediate block; High = 72h remediation window; Medium/Low = tracked for next cycle |
| **Gate 2** | Benchmark Regression | Full governance benchmark suite: MMLU-Pro >= 95% of King baseline, safety score >= 98% of King, code generation >= 95%, fairness score maintained or improved | 4 hours | Any benchmark < 95% of King baseline = automatic block; requires retuning and resubmission |
| **Gate 3** | BFT Council Vote | 33 agents evaluate independently; geometric median aggregation filters outliers; 23/33 quorum (2f+1) required for approval [^52^] | 30 minutes (normal) / 60 minutes (view change) | Rejection: improvement returned to OpenMOE; No consensus: extended evaluation window (24h) |
| **Gate 4** | Canary Deployment | Deploy to 1% of production traffic; monitor for 7 days; thresholds: error rate < 0.1%, zero safety incidents, latency regression < 2%, user satisfaction maintained | 7 days | Any threshold breach triggers automatic rollback to previous King checkpoint within < 5 minutes |

### 2.1 Rollback Procedures

```
ROLLBACK TRIGGER HIERARCHY:

Level 0: Traffic Shift      (< 30 seconds)  - Route to previous model
Level 1: Model Revert       (< 5 minutes)   - Load previous checkpoint  
Level 2: State Restore      (< 30 minutes)  - Replay from decision ledger
Level 3: Full Recovery      (< 4 hours)     - Rebuild from event source

Automatic Triggers:
- Safety score drop > 10%    -> L0 rollback
- Error rate > 5x baseline   -> L0 + alert
- Latency p99 > 2x SLA       -> Circuit breaker (L1)
- BFT emergency vote 23/33   -> Full system pause (L2)
- Human override (1 of 3)    -> 24-hour governance pause
```

**Recovery Point Objective (RPO)**: < 1 hour maximum data loss. **Recovery Time Objective (RTO)**: < 30 minutes for L2 recovery. Model snapshots taken every hour; geographic replication across 3 regions [^390^][^399^].

---

## 3. Risk Register

The following register documents the top 10 risks to SOV3 operational safety, ranked by composite risk score (probability x impact on a 1-5 scale).

| Rank | Risk ID | Risk | Probability | Impact | Composite Score | Mitigation Strategy | Risk Owner |
|------|---------|------|-------------|--------|-----------------|---------------------|------------|
| 1 | R-SAF-01 | **Model Collapse from Inbreeding** — Improvements flow only from OpenMOE to King without diversity injection; both models converge to same local optimum, reducing population diversity | 3 | 5 | **15** | Maintain architectural differences (King = dense + selective MoE, OpenMOE = sparse MoE 64 experts); require OpenMOE to explore novel approaches; introduce periodic "mutation" via diverse training data; enforce minimum ELO gap of 100 points | Chief AI Scientist |
| 2 | R-SAF-02 | **Backdoor Insertion via Transfer** — Adversary compromises OpenMOE to insert hidden backdoors that transfer through improvement pipeline | 2 | 5 | **10** | Multi-layer safety gates (red team as Gate 1); geometric median aggregation of BFT evaluations filters compromised evaluators [^52^]; anomaly detection on weight distributions before transfer; canary testing at 1% for 7 days; M-of-N signing prevents single-actor transfer authorization | Head of Security |
| 3 | R-SAF-03 | **Competition Erodes Safety** — Drive to win incentivizes OpenMOE to sacrifice safety for performance (less cautious about harmful outputs to appear more helpful) | 3 | 4 | **12** | Safety benchmarks weighted at 30% of composite score; safety score >= 98% of King is hard threshold (not weighted); zero-tolerance policy for safety regressions; red team evaluation as mandatory Gate 1; safety incidents result in automatic tournament disqualification | Safety Lead |
| 4 | R-SAF-04 | **BFT Council Compromise** — Up to 10 council agents become Byzantine through coordinated attack, supply chain compromise, or emergent misalignment | 2 | 5 | **10** | 33-agent council tolerates up to 10 Byzantine with 23-quorum [^359^]; geometric median aggregation is robust to outliers [^52^]; reputation mechanisms penalize consistently wrong voters [^365^]; periodic agent rotation and re-verification every 90 days; diverse agent providers prevent single-point compromise | Governance Architect |
| 5 | R-SAF-05 | **Unbounded Capability Growth** — Automated improvement advances capabilities faster than alignment; model becomes more capable without corresponding improvement in constitutional adherence | 2 | 4 | **8** | 6 of 33 council agents are Constitutional Alignment evaluators with veto power; capability ceilings enforced per domain; alignment benchmarks must improve or maintain alongside capability; automatic pipeline suspension if alignment score drops; human oversight required (L3-L4) for all transfers | Ethics Board |
| 6 | R-OPR-01 | **Infrastructure Failure** — TEE hardware failure, HSM outage, or Kubernetes cluster degradation halts inference | 3 | 3 | **9** | Multi-region deployment (3 active regions); graceful degradation to OpenMOE if King TEE fails; HSM clustering with automatic failover; RTO < 30 minutes; hourly snapshots | Platform Lead |
| 7 | R-OPR-02 | **Supply Chain Attack** — Compromised training data, poisoned open-source dependency, or tampered model checkpoint introduced upstream | 2 | 4 | **8** | SBOM for all components; cryptographic signing of all artifacts; dependency vulnerability scanning; reproducible builds; air-gapped training environment for King HIVE | Security Engineer |
| 8 | R-REG-01 | **EU AI Act Non-Compliance** — System fails to meet August 2026 high-risk AI requirements; penalties up to EUR 35M or 7% global turnover [^386^] | 2 | 5 | **10** | Technical documentation pre-built from open release; human oversight by design; automated record-keeping; risk management system with continuous monitoring; legal review of all deployment decisions | Compliance Officer |
| 9 | R-REG-02 | **Quantum Cryptography Break** — Future quantum computer breaks Ed25519 signatures, compromising historical model verification | 1 | 4 | **4** | ML-DSA-65 post-quantum signatures already deployed; hybrid scheme ensures at least one signature remains valid; CNSA 2.0 alignment; quarterly assessment of quantum threat timeline | Cryptography Lead |
| 10 | R-COM-01 | **Community Hostile Fork** — Bad actor creates derivative of OpenMOE optimized for harmful purposes, damaging CSOAI reputation | 4 | 2 | **8** | License terms encourage safety fine-tuning maintenance; capability threshold assessment before each release; community norms favoring responsible derivation; safety bounty program; staged release with feedback gates [^441^] | Community Manager |

---

## 4. 90-Day Implementation Roadmap

The implementation is organized into 12 sprints (each 1 week) across 3 phases. Each sprint has defined deliverables, acceptance criteria, and story point estimates.

| Sprint | Dates | Deliverables | Owner | Story Points | Dependencies | Acceptance Criteria |
|--------|-------|-------------|-------|-------------|--------------|---------------------|
| **PHASE 1: FOUNDATION** |
| SP-01 | Week 1 | Deploy King HIVE base infrastructure: TEE environment, HSM integration, zero-trust network | Platform Lead | 21 | None | TEE attestation < 5s; HSM signing < 10ms; network micro-segmentation verified |
| SP-02 | Week 2 | Deploy OpenMOE OLM base: Kubernetes cluster, containerized MoE inference, public API endpoint | ML Engineer | 21 | SP-01 (network) | Inference latency p50 < 200ms; 99.9% uptime target; API authentication working |
| SP-03 | Week 3 | Implement cryptographic signing pipeline: Ed25519 + ML-DSA dual-sign, manifest generation, Rekor integration | Security Engineer | 21 | SP-01 (HSM) | Signature generation < 100ms (ML-DSA); verification < 1ms; Rekor inclusion < 5s |
| SP-04 | Week 4 | Deploy BFT Council: 33 validator nodes, Tendermint consensus, voting smart contracts, equivocation detection | Governance Architect | 34 | SP-03 (signing) | Consensus latency < 30s; tolerates 10 Byzantine agents; emergency pause < 2min |
| **PHASE 2: COMPETITION** |
| SP-05 | Week 5 | Build tournament engine: ELO rating system, pairwise battle framework, benchmark suite execution | ML Engineer | 21 | SP-02 (OpenMOE), SP-04 (BFT) | ELO updates after each battle; 55% win threshold enforced; round-robin tournaments working |
| SP-06 | Week 6 | Establish red team / blue team operations: automated adversarial prompt generation, jailbreak test library, safety scoring | Safety Lead | 21 | SP-04 (BFT) | 10,000+ adversarial prompts in library; automated safety scoring; zero critical findings detection |
| SP-07 | Week 7 | Implement benchmark suite: MMLU-Pro, safety evals, code generation, fairness tests, composite scorecard | Data Scientist | 21 | SP-05 (tournament) | All 5 benchmark categories executing; weighted composite score accurate; held-out test set reserved |
| SP-08 | Week 8 | First evaluation window: run head-to-head competition, calibrate ELO, generate initial scorecards, BFT council first vote | Chief AI Scientist | 13 | SP-06 (red team), SP-07 (benchmarks) | ELO ratings calibrated; both models have 50+ battles; composite scorecard generated; council vote executed |
| **PHASE 3: AUTO-TRANSFER** |
| SP-09 | Week 9 | Build safety gate pipeline: Gates 0-4 implementation, sequential dependency chain, automated pass/fail logic | Safety Lead | 21 | SP-06 (red team), SP-08 (scores) | All 5 gates blocking correctly; gate output feeds next gate input; failure terminates transfer |
| SP-10 | Week 10 | Implement model improvement transfer: task vector extraction, LoRA adapter transfer, SLERP merge capability | ML Engineer | 21 | SP-09 (gates) | Task vector extraction < 1 hour on H100; LoRA adapter hot-swappable; SLERP parameterized by t |
| SP-11 | Week 11 | Deploy canary deployment system: 1% traffic routing, 7-day monitoring, automated rollback, metric thresholds | Platform Lead | 21 | SP-10 (transfer) | Traffic split 1% / 99% accurate; rollback < 5 minutes; all 4 canary thresholds monitored |
| SP-12 | Week 12 | End-to-end integration test: full competitive cycle, safety gate execution, human override validation, EU AI Act readiness audit | QA Lead | 21 | SP-11 (canary) | Complete tournament cycle executed; all gates exercised; human override tested; compliance checklist passed |

### 4.1 Phase Milestones

```
PHASE 1 MILESTONE (End Week 4): "Secure Foundation"
- Both models deployed and cryptographically signed
- BFT Council operational with 33 validators
- Infrastructure security validated
- Acceptance: Successful council vote on test proposal

PHASE 2 MILESTONE (End Week 8): "Active Competition"
- Tournament engine running continuous battles
- ELO ratings calibrated and stable
- Red team / blue team operational
- Acceptance: First legitimate winner declared by council vote

PHASE 3 MILESTONE (End Week 12): "Safe Evolution"
- Full auto-transfer pipeline operational
- Canary deployment tested end-to-end
- Human override procedures validated
- Acceptance: Simulated improvement passes all gates and deploys to canary
```

---

## 5. Resource Allocation

| Role | FTE | Primary Sprints | Skills Required | Responsibilities |
|------|-----|----------------|-----------------|------------------|
| **Chief AI Scientist** | 1.0 | SP-01 through SP-12 | PhD ML/AI, 10+ years, adversarial training expertise | Architecture decisions, model selection, tournament design, final approval |
| **Governance Architect** | 1.0 | SP-04, SP-08, SP-09 | Distributed systems, BFT consensus, smart contracts | BFT Council design, voting mechanisms, equivocation detection, consensus tuning |
| **Platform Lead** | 1.0 | SP-01, SP-11, SP-12 | Kubernetes, TEE (Intel SGX/TDX), cloud infrastructure | Infrastructure deployment, TEE configuration, HSM integration, canary system |
| **ML Engineer** | 2.0 | SP-02, SP-05, SP-10 | PyTorch/TensorFlow, MoE architectures, model merging | OpenMOE deployment, tournament engine, task vector extraction, LoRA transfer |
| **Security Engineer** | 1.0 | SP-03, SP-06, SP-09 | Cryptography, HSMs, Sigstore, supply chain security | Signing pipeline, red team automation, safety gate implementation |
| **Safety Lead** | 1.0 | SP-06, SP-09, SP-12 | AI safety, red teaming, adversarial ML, EU AI Act | Safety gate design, red team/blue team ops, benchmark validation |
| **Data Scientist** | 1.0 | SP-07, SP-08 | Benchmark design, statistical analysis, ELO systems | Benchmark suite, composite scorecard, ELO calibration |
| **QA Lead** | 0.5 | SP-12 | Integration testing, chaos engineering, compliance testing | End-to-end validation, compliance audit, incident response testing |
| **Compliance Officer** | 0.5 | SP-12 | EU AI Act, data governance, risk management | Regulatory alignment, documentation review, audit preparation |
| **Community Manager** | 0.5 | SP-02, SP-12 | Open source community, Hugging Face, developer relations | OpenMOE community onboarding, contribution guidelines, safety bounty program |

**Total Team Size**: 9.5 FTE (core team) + advisory board

---

## 6. Budget Estimate

| Category | Item | Cost (USD) | Justification |
|----------|------|-----------|---------------|
| **Compute** | GPU cluster (8x H100, reserved 90 days) | $180,000 | King HIVE TEE inference, OpenMOE training, benchmark execution, model merging |
| **Compute** | Kubernetes cluster (3-region, high-availability) | $45,000 | BFT Council nodes, tournament engine, event bus, canary deployment |
| **Security** | HSM cluster (Thales Luna 7, 3 units) | $75,000 | Dual-signing key protection, M-of-N ceremony, quarterly rotation |
| **Security** | TEE infrastructure (Intel TDX nodes) | $30,000 | King HIVE trusted execution, remote attestation, memory encryption |
| **Infrastructure** | Sigstore Rekor integration + OIDC | $5,000 | Transparency logging, signature verification pipeline |
| **Storage** | Model registry + immutable ledger (90 days) | $15,000 | Versioned model artifacts, decision ledger, audit trail storage |
| **Networking** | Private inter-region links + DDoS protection | $20,000 | Secure council communication, production traffic protection |
| **Personnel** | Core team (9.5 FTE x 90 days, blended $800/day) | $684,000 | Engineering, safety, compliance, and governance salaries |
| **External** | Security audit (external firm, week 12) | $50,000 | Independent penetration testing, red team evaluation, compliance assessment |
| **External** | EU AI Act legal review | $25,000 | Regulatory interpretation, documentation review, gap analysis |
| **Contingency** | 15% buffer | $172,500 | Unforeseen technical challenges, scope adjustments, extended timelines |
| **TOTAL** | | **$1,301,500** | 90-day foundation phase (Phases 2-4 budgeted separately) |

---

## 7. EU AI Act Compliance Matrix

The EU AI Act becomes generally applicable in August 2026 [^386^]. Penalties for non-compliance reach EUR 35 million or 7% of global annual turnover. The following matrix maps each high-risk AI requirement to the CSOAI SOV3 implementation.

| EU AI Act Requirement | Article | CSOAI Implementation | Status |
|----------------------|---------|---------------------|--------|
| **Risk management system** | Art. 9 | Continuous risk register with 10 tracked risks; automated monitoring; quarterly review cycles; risk mitigation workflows integrated into BFT governance | Implemented |
| **Data governance** | Art. 10 | Training data provenance tracking via Dolma toolkit; data residency policies enforced at ingestion; bias detection in benchmark suite; anonymization for sensitive governance data | Implemented |
| **Technical documentation** | Art. 11 | Full technical documentation auto-generated from open release; SBOM for all components; model cards with capability/limitation statements; training data summaries | Implemented |
| **Record-keeping** | Art. 12 | Immutable decision ledger with SHA3-256 hashing; all inference events logged with correlation IDs; 7-year retention; tamper-evident audit trail | Implemented |
| **Transparency** | Art. 13 | OpenMOE: fully open (weights + data + code + logs); King HIVE: summary documentation to AI Office; clear capability/limitation disclosure; human-readable explanation of decisions | Implemented |
| **Human oversight** | Art. 14 | HOTL: real-time monitoring with override; HITL: high-risk decisions require pre-approval; 3 designated operators with 24-hour pause authority; override decisions logged immutably [^439^] | Implemented |
| **Accuracy & robustness** | Art. 15 | ELO-based continuous evaluation; 5-category benchmark suite; adversarial testing via red team; benchmark regression gates; 95% baseline threshold | Implemented |
| **Corrective actions** | Art. 16 | 4-level rollback hierarchy (< 30s to < 4h); automated safety incident response; BFT emergency pause; human escalation procedures | Implemented |
| **Quality management** | Art. 17 | MLOps CI/CD pipeline; automated testing; safety gates; continuous compliance monitoring; quarterly architecture reviews | Implemented |
| **Post-market monitoring** | Art. 72 | 7-day canary monitoring; continuous ELO tracking; safety incident reporting; community feedback integration; periodic re-evaluation | Implemented |

---

## 8. Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ASL** | AI Safety Level — capability threshold classification system (Low/Medium/High/Critical) used for staged model release |
| **BFT** | Byzantine Fault Tolerance — consensus mechanism tolerating up to f malicious agents out of 3f+1 total |
| **BFT Council** | 33-agent validator set governing SOV3 model evolution via Tendermint-style PBFT consensus |
| **Bradley-Terry Model** | Statistical model for estimating pairwise win probabilities from tournament results [^377^] |
| **Canary Deployment** | Production release to 1% of traffic with 7-day monitored observation period before full rollout |
| **CBRN** | Chemical, Biological, Radiological, Nuclear — capability risk categories evaluated in frontier AI safety assessments |
| **CSOAI** | Construction SOV3 AI — the organization deploying the sovereign governance system |
| **DARE** | Drop And REscale — model merging technique for handling redundant delta parameters [^369^] |
| **DPO** | Direct Preference Optimization — alignment training method used in OLMo post-training |
| **ELO Rating** | Relative performance scoring system where 100-point difference equals ~64% expected win rate [^377^] |
| **Geometric Median** | Byzantine-robust aggregation method filtering outlier agent scores before council vote [^52^] |
| **Graceful Degradation** | Fallback strategy where King HIVE failures route to OpenMOE; dual failures activate human governance mode |
| **HITL** | Human-in-the-Loop — high-risk decisions require human approval before execution [^434^] |
| **HIVE** | CSOAI's vertical AI platform integrating construction, logistics, fleet, and waste management |
| **HOTL** | Human-on-the-Loop — humans monitor AI decisions in real-time with continuous override capability [^437^] |
| **HSM** | Hardware Security Module — tamper-resistant hardware for cryptographic key storage and signing operations |
| **King HIVE** | SOV3 production sovereign model — closed weights, TEE-protected, cryptographically signed |
| **LoRA** | Low-Rank Adaptation — parameter-efficient fine-tuning reducing trainable parameters by up to 10,000x [^430^] |
| **MBOM-PQC** | Model Bill of Materials with Post-Quantum Cryptography — provenance record format for AI supply chain security [^368^] |
| **ML-DSA** | Module Lattice-Based Digital Signature Algorithm (FIPS 204) — NIST post-quantum signature standard |
| **MoE** | Mixture of Experts — sparse architecture routing tokens to subsets of specialized expert networks |
| **OLMoE** | Open Language Model Mixture-of-Experts — AI2's fully open MoE (1B active / 7B total parameters) [^339^] |
| **OpenMOE** | Community-driven open MoE initiative and CSOAI's transparent challenger model [^345^] |
| **OpenMOE OLM SOV3 HIVE** | The open challenger in CSOAI's dual-config competitive architecture |
| **PBT** | Population-Based Training — evolutionary algorithm using competitive agent populations [^313^] |
| **PBFT** | Practical Byzantine Fault Tolerance — consensus algorithm with pre-vote and commit phases [^360^] |
| **Rekor** | Sigstore's transparency log providing immutable, globally verifiable signature records [^374^] |
| **RPO** | Recovery Point Objective — maximum acceptable data loss (< 1 hour for SOV3) |
| **RTO** | Recovery Time Objective — maximum acceptable downtime (< 30 minutes for L2 recovery) |
| **SBOM** | Software Bill of Materials — comprehensive inventory of all software components |
| **Shadow Mode** | Champion-challenger deployment where the challenger receives production inputs without affecting live decisions [^336^] |
| **Sigstore** | Open-source software signing and transparency infrastructure preventing signature suppression attacks |
| **SLERP** | Spherical Linear Interpolation — model merging technique for smooth weight interpolation [^374^] |
| **SOV3** | Sovereign AI governance system (version 3) — CSOAI's decentralized model governance platform |
| **Task Vector** | Directional weight difference `tau = W_finetuned - W_base` enabling composable capability transfer [^369^] |
| **TEE** | Trusted Execution Environment — hardware-isolated processing environment with remote attestation |
| **TIES** | Trim, Elect Sign, Merge — model merging technique resolving sign conflicts across three+ models [^369^] |
| **Tournament Engine** | Automated system running head-to-head battles, updating ELO ratings, and determining winners |

---

## 9. Appendix B: API Reference

| Endpoint | Method | Authentication | Purpose | Rate Limit |
|----------|--------|---------------|---------|------------|
| `/v1/governance/decision` | POST | mTLS + API key + HSM sig | Submit governance decision request to King HIVE | 10,000 req/s |
| `/v1/governance/decision/{id}` | GET | OAuth 2.0 | Retrieve decision result and rationale by correlation ID | 5,000 req/s |
| `/v1/openmoe/inference` | POST | API key | Submit inference request to OpenMOE challenger (public) | 5,000 req/s |
| `/v1/openmoe/benchmark` | POST | API key | Trigger benchmark execution on OpenMOE | 100 req/hour |
| `/v1/tournament/battle` | POST | mTLS + council sig | Initiate head-to-head battle between King and OpenMOE | 1,000 req/hour |
| `/v1/tournament/elo` | GET | OAuth 2.0 | Retrieve current ELO ratings for both models | 10,000 req/s |
| `/v1/tournament/scorecard` | GET | OAuth 2.0 | Retrieve composite scorecard from latest evaluation window | 1,000 req/s |
| `/v1/council/vote` | POST | Ed25519 agent sig | Submit vote from BFT council agent | 100 req/min |
| `/v1/council/proposal` | POST | 23/33 quorum sig | Submit model improvement proposal for council vote | 10 req/hour |
| `/v1/council/emergency` | POST | 2-of-3 operator sig | Trigger 24-hour emergency governance pause | 10 req/min |
| `/v1/safety/gate/{id}/status` | GET | OAuth 2.0 | Check status of safety gate (0-4) for active transfer | 1,000 req/s |
| `/v1/safety/rollback` | POST | 2-of-3 operator sig + council sig | Execute rollback to previous model checkpoint | 10 req/min |
| `/v1/model/sign` | POST | HSM-protected key | Cryptographically sign model artifact (Ed25519 + ML-DSA) | 100 req/hour |
| `/v1/model/verify` | POST | None (public) | Verify model signatures against trust anchor | 10,000 req/s |
| `/v1/audit/decisions` | GET | Admin mTLS | Export decision ledger for compliance auditing | 10 req/min |
| `/v1/audit/scores` | GET | Admin mTLS | Export score registry with cryptographic proofs | 10 req/min |
| `/v1/events/ingest` | POST | SASL/SSL | Ingest governance event from HIVE vertical | 100,000 events/s |
| `/v1/events/stream` | GET | OAuth 2.0 | Subscribe to real-time governance event stream | 10,000 connections |
| `/v1/system/health` | GET | None (public) | Health check for all system components | 100,000 req/s |

---

## 10. Appendix C: Site Inventory

The following table documents all registered `.ai` domain assets in the CSOAI SOV3 ecosystem, their operational purpose, hosting platform, current status, and recommended action.

| Domain | Purpose | Platform | Status | Action |
|--------|---------|----------|--------|--------|
| **csoai.ai** | Primary organization domain — CSOAI corporate identity and trust anchor | Cloudflare | Active | Maintain as root trust domain; HSM signing ceremony anchor |
| **sov3.ai** | Sovereign governance platform — API gateway, BFT council interface, documentation | Kubernetes (3-region) | Active | Primary production domain; TEE attestation endpoint |
| **sov3king.ai** | King HIVE production inference — closed sovereign model API endpoint | TEE cluster (air-gapped) | Active | Restricted access; mTLS + HSM signature required for all requests |
| **openmoe.ai** | OpenMOE OLM challenger — public model interface, community hub, benchmark dashboard | Kubernetes (public cluster) | Active | Public access; community contributions via authenticated API |
| **bftcouncil.ai** | BFT Council governance portal — validator voting, proposal submission, consensus monitoring | Kubernetes (council cluster) | Active | Validator-only access; Ed25519 agent signatures required |
| **hivemind.ai** | HIVE vertical integration — event bus, cross-vertical data routing, knowledge graph access | Kafka + Kubernetes | Active | Service-to-service only; no public endpoints |
| **safetynet.ai** | Safety monitoring dashboard — red team results, safety gate status, incident tracking | Kubernetes (monitoring) | Active | Role-based access; safety team + operators + auditors |
| **modelaudit.ai** | Model audit trail — immutable decision ledger, score registry, compliance reporting | Immutable storage | Active | Audit-only access; append-only writes; 7-year retention |
| **sigstore.ai** | Cryptographic transparency — signature verification portal, Rekor log query, key directory | Sigstack + Cloudflare | Active | Public read access; verification API no-auth |
| **community.ai** | Community engagement — contributor portal, fine-tuning competitions, documentation, forums | Vercel + Kubernetes | Active | Public access; contributor tier system |
| **guardian.ai** | Human oversight interface — HOTL dashboard, HITL approval queue, emergency override | Kubernetes (restricted) | Active | 3-operator access only; biometric + hardware key 2FA |
| **canary.ai** | Canary deployment monitoring — real-time metrics, rollback triggers, deployment status | Grafana + Kubernetes | Active | Platform team access; automated alerts to PagerDuty |

### Domain Architecture Diagram

```
+=======================================================================+
|                         CSOAI .AI DOMAIN MESH                          |
+=======================================================================+
|                                                                        |
|   PUBLIC LAYER                      RESTRICTED LAYER                   |
|   ----------                        ---------------                    |
|   csoai.ai (trust anchor)           sov3king.ai (TEE-protected)        |
|   openmoe.ai (community)            bftcouncil.ai (validator-only)     |
|   community.ai (contributors)       guardian.ai (operator-only)        |
|   sigstore.ai (transparency)        modelaudit.ai (audit-only)         |
|                                                                        |
|   OPERATIONAL LAYER                                                    |
|   -----------------                                                    |
|   sov3.ai (API gateway)                                                |
|   hivemind.ai (event bus)                                              |
|   safetynet.ai (monitoring)                                            |
|   canary.ai (deployment)                                               |
|                                                                        |
|   SECURITY: All domains behind Cloudflare; mTLS for service mesh;      |
|   HSM-signed certificates; DNSSEC enabled; quarterly penetration tests. |
+=======================================================================+
```

---

## Document Summary

This specification defines the operational safety framework, implementation roadmap, and reference materials for the SOV3 dual-config competitive AI governance system. Five independent safety mechanisms — BFT Governance (33 agents, 23/33 quorum), Cryptographic Verification (Ed25519 + ML-DSA, HSM-protected), Dual-Model Competitive Safety (shadow mode, graceful degradation), Auto-Improvement Safety Gates (5 gates, 7-day canary, <5min rollback), and Human Override (HOTL, HITL, 3 operators) — collectively ensure no single failure mode can compromise sovereign governance.

The 90-day implementation roadmap organizes delivery into 12 one-week sprints across three phases: Foundation (weeks 1-4, infrastructure and security), Competition (weeks 5-8, tournament and evaluation), and Auto-Transfer (weeks 9-12, safety pipeline and deployment automation). Total estimated budget: $1.3M for the foundation phase. Full EU AI Act compliance is designed in from inception, with all 10 high-risk AI requirements mapped to specific SOV3 implementations.

---

## Sources

[^52^] Jo, Y. & Park, C. (2025). "Byzantine-Robust Decentralized Coordination of LLM Agents." arXiv:2507.14928. DecentLLMs leaderless consensus with geometric median aggregation.

[^313^] Wu, T.R., Wei, T.H., & Wu, I.C. (2020). "Accelerating and Improving AlphaZero Using Population Based Training." AAAI-20. PBT with 16 agents achieving 74% win rate.

[^336^] Sparkling Logic. "Champion/Challenger Experiments for Rolling Out Deployment." 2025.

[^338^] DataRobot. "Introducing MLOps Champion/Challenger Models." 2025. Shadow mode deployment patterns.

[^339^] Contextual AI & Allen Institute for AI. "Introducing OLMoE." 1B active / 7B total, 64 experts, fully open-source.

[^345^] GitHub: XueFuzhao/OpenMoE. Open-source MoE community project with full reproducibility.

[^359^] CallSphere. "Voting, Averaging, and Byzantine Fault Tolerance." 3f+1 requirement.

[^360^] Kwon, M. & Nair, S. Stanford. "Distributed Multi-Agent Consensus for Fault Tolerant Decision Making." PBFT with leader filtering.

[^361^] Chainlink. "Byzantine Fault Tolerant Consensus." Four-step consensus sequence, 2/3 requirement.

[^365^] MDPI Applied Sciences. "Scalable Dynamic Multi-Agent Practical Byzantine Fault-Tolerant Consensus." Hierarchical PBFT with reputation mechanisms.

[^368^] MDPI. "AI Supply Chain Security: MBOM-PQC Provenance." 2026. Hybrid Ed25519 + ML-DSA signing, PQC-safe attestation pipeline.

[^369^] Spheron Network. "Model Merging on GPU Cloud: TIES, DARE, SLERP." Task arithmetic and model merging techniques.

[^374^] OpenSSF. "Model Signing for Secure and Trusted AI Supply Chains." 2025. OMS specification, Sigstore and PKI signing modes.

[^377^] NVIDIA. "An Introduction to Model Merging for LLMs." mergekit library, model soup, SLERP, task arithmetic, TIES.

[^386^] ModelOp. "EU AI Act: Summary & Compliance Requirements." 2024. Risk-based categorization, penalties up to EUR 35M.

[^390^] Suhas Bhairav. "Disaster Recovery for AI Systems." 2026. State management, event sourcing, rollback patterns.

[^391^] GitHub/sigstore. "Evaluate admission controller design for Kubernetes verification." 2025.

[^392^] Sigstore Blog. "Trusting AI Models in Kubernetes." 2025. Model validation operator v1.0.1 workflow.

[^398^] Red Hat. "Model authenticity and transparency with Sigstore." 2025. Kubernetes-native model verification.

[^399^] SandGarden. "Rollback (AI): Reverting an AI System." 2025. AI rollback definition and best practices.

[^430^] Outcome School. "LoRA - Low-Rank Adaptation of LLMs." 2026.

[^434^] Alan Turing Institute. "Human-in-the-Loop Safeguards." 2025. HITL patterns for safety, transparency, fairness.

[^436^] Buchman, E. "Tendermint: Byzantine Fault Tolerance in the Age of Blockchains." 2016. Tendermint consensus specification.

[^437^] IT Revolution. "Human-in-the-Loop Is Non-Negotiable." 2026. HOTL and HITL models for safety-critical AI.

[^439^] IBM. "What Is Human In The Loop (HITL)?" 2025. EU AI Act Article 14 human oversight requirements.

[^441^] GovAI. "Open-Sourcing Highly Capable Foundation Models." 2023. Staged release framework and safety recommendations.
