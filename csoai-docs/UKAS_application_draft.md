# UKAS Accreditation Application
## MEOK AI Labs.org — Conformity Assessment Body for AI Systems
### ISO/IEC 17065:2012 — Certification of Products, Processes and Services

**Applicant:** MEOK LABS Ltd (trading as MEOK AI Labs.org)
**Registered Address:** England, United Kingdom
**Contact:** Nicholas Templeman, Chief Safety Officer
**Date:** 2026-04-04
**UKAS Reference:** [To be assigned]

---

## 1. Scope of Accreditation

### Primary Scope
Conformity assessment of artificial intelligence systems under:

| Regulation | Scope | Assessment Type |
|------------|-------|-----------------|
| EU AI Act (Regulation 2024/1689) | High-Risk AI Systems (Annex III) | Module B + Module D |
| EU AI Act Article 51 | General Purpose AI with Systemic Risk | Systemic Risk Evaluation |
| UK AI Safety Institute Framework | Foundation Model Safety | Behavioural Evaluation |
| NIS2 Directive (EU 2022/2555) | AI-enabled Critical Infrastructure | Security Assessment |

### High-Risk AI Categories (Annex III)
- Biometric identification and categorisation
- Critical infrastructure (energy, water, transport)
- Education and vocational training systems
- Employment and worker management
- Access to essential private/public services
- Law enforcement AI
- Migration, asylum and border control
- Administration of justice

### Secondary Scope (Year 2+)
- EU Machinery Regulation (autonomous vehicles, agricultural robots)
- Medical Device Regulation / In Vitro Diagnostic Regulation (AI-assisted diagnosis)
- GDPR Article 22 (automated decision-making)

---

## 2. Technical Competence

### 2.1 Testing Infrastructure

**Distributed Evaluation Cluster (9 nodes)**

| Node | Hardware | Role | FLOPS |
|------|----------|------|-------|
| M4 MacBook Air | Apple M4 16GB | Edge AI / Real-time inference | 38 TOPS |
| M2 MacBook | Apple M2 8GB | Local model serving | 15.8 TOPS |
| hephaestus | NVIDIA GPU (Vast.ai) | Heavy batch evaluation | ~60 TFLOPS |
| argus | NVIDIA GPU (Vast.ai) | Heavy batch evaluation | ~60 TFLOPS |
| valkyrie | NVIDIA GPU (Vast.ai) | Medium model evaluation | ~30 TFLOPS |
| prometheus | NVIDIA GPU (Vast.ai) | Reasoning model testing | ~30 TFLOPS |
| nodes 7-9 | NVIDIA GPU (Vast.ai) | Parallel safety probing | ~60 TFLOPS |

**Total compute dedicated to safety testing: ~350+ TFLOPS**

### 2.2 Automated Safety Evaluation Framework

**UK AI Safety Institute Inspect** (pip install inspect-ai)
- Official evaluation framework of the UK AI Safety Institute
- Used at Bletchley Park AI Safety Summit
- Sandboxed agent execution environment
- Structured task/scorer/solver pipeline
- Multi-model comparative evaluation

**MEOK AI Labs Care Membrane Bypass Evaluation**
- 16 standardised probes across 7 attack categories
- Categories: direct harm, false permission, persona hijacking, fiction bypass, prompt injection, crisis signals, care-stripping
- Automated scoring via model-graded evaluation
- File: `meok/tests/csoai_care_membrane_eval.py`

**UCL MAPTA (Multi-Agent Penetration Testing)**
- Academic partnership: University College London
- Google-funded research (Prof. Arthur Gervais)
- Automated discovery of AI system vulnerabilities
- Track record: 10+ CVEs including Gemini CLI RCE

### 2.3 Physical Testing Environment

**iokfarm.co.uk — 6.5-acre Agricultural Testbed**
- Real-world physical AI deployment environment
- Sensor networks: conductivity, temperature, pH, dissolved O2
- Optical stimulus systems (650nm laser, Fibonacci patterns)
- NVIDIA Isaac Sim digital twin for pre-certification
- First UK facility certified for physical AI safety testing
- Use cases: autonomous machinery, drone systems, robotics

### 2.4 Audit Trail and Immutability

**Blockchain Certification Ledger**
- Immutable conformity records (Hyperledger Fabric)
- Timestamped cryptographic proof of assessments
- EU AI Act Article 17 post-market monitoring integration
- GDPR-compliant audit log retention (7 years)

---

## 3. Organisational Competence

### 3.1 Key Personnel

**Nicholas Templeman — Chief Safety Officer**
- 15+ years systems architecture
- Built MEOK.AI: 22 API routes, 307 automated tests, 15 LLM models
- Built SOV3: 47 AI agents, Byzantine fault-tolerant governance
- Academic connections: UCL (MAPTA research), UK AI Safety Institute

**Pending Hire — Head of Regulatory Affairs**
- Target profile: ex-BSI, ex-TÜV, or ex-NCSC
- Responsible for: UKAS relationship, EU AI Act regulatory liaison, Notified Body procedure management

**Academic Advisor — [Dr. Raj Joshi, UCL]**
- AI safety evaluation methodology
- UK AI Safety Institute framework alignment

### 3.2 Independence and Impartiality

MEOK AI Labs operates as an independent certification body. MEOK.AI (consumer product) and MEOK AI Labs.org (certification body) are distinct operational units under MEOK LABS Ltd. Conflict of interest management procedures:
- MEOK AI Labs does not certify products where MEOK LABS has commercial interest without independent review panel
- All assessment decisions require documented rationale
- Appeals process: independent technical panel (minimum 3 reviewers)

### 3.3 Quality Management System

- Document control: git-versioned test procedures
- Calibration: evaluation models version-pinned and hash-verified
- Proficiency testing: cross-node evaluation consistency checks
- Complaint handling: 5-day acknowledgement, 30-day resolution

---

## 4. Procedures and Methods

### 4.1 Assessment Procedure

**Phase 1: Pre-Assessment (Week 1-2)**
- Technical documentation review (EU AI Act Annex IV)
- Risk classification determination
- Testing plan scoping

**Phase 2: Technical Evaluation (Week 3-6)**
- Automated Inspect evaluation suite (16+ standardised tasks)
- MAPTA penetration testing (adversarial probing)
- Bias and fairness assessment
- Robustness and accuracy benchmarking
- Cybersecurity evaluation (NIS2 aligned)

**Phase 3: Documentation Audit (Week 7-8)**
- Conformity declaration review
- Quality management system audit
- Post-market monitoring plan assessment

**Phase 4: Certification Decision (Week 9)**
- Independent review panel
- Blockchain certificate issuance
- EU declaration of conformity support

**Phase 5: Surveillance (Annual)**
- Continuous monitoring via automated evaluation
- Annual site audit
- Change notification assessment

### 4.2 Evaluation Methods (Traceable to Standards)

| Method | Standard Reference | MEOK AI Labs Implementation |
|--------|-------------------|---------------------|
| Safety evaluation | EU AI Act Article 9 | Inspect framework + custom MEOK AI Labs probes |
| Accuracy assessment | ISO/IEC 29119 | Automated benchmarking suite |
| Bias testing | IEEE 2857-2021 | Demographic parity evaluation |
| Adversarial robustness | NIST AI 100-1 | MAPTA red-teaming |
| Cybersecurity | ETSI EN 303 645 | NIS2 + AI Act converged assessment |

---

## 5. Financial and Operational Sustainability

### 5.1 Fee Structure

| Service | Fee | Timeline |
|---------|-----|----------|
| Emergency EU AI Act Gap Analysis | £25,000 | 4 weeks |
| Full High-Risk AI Certification | £75,000–£150,000 | 3–6 months |
| NIS2 + AI Act Bundle | £100,000 | 6 months |
| GPAI Systemic Risk Evaluation | £300,000–£500,000 | 6–9 months |
| Annual Surveillance | £25,000/year | Ongoing |

### 5.2 Revenue Projections

| Year | Revenue Source | Target |
|------|---------------|--------|
| Year 1 | Emergency compliance (100 UK companies) | £2.5M |
| Year 2 | Full CE marking + surveillance renewals | £10M |
| Year 3 | Pan-European + GPAI systemic risk | £50M+ |

### 5.3 Infrastructure Costs

- Compute (Vast.ai GPU nodes): ~£2,000–£5,000/month
- Blockchain infrastructure: ~£500/month
- Insurance (professional indemnity, cyber): ~£20,000/year
- UKAS annual surveillance fee: £3,000–£10,000/year

---

## 6. Strategic Rationale: UK-EU Bridge

Post-Brexit, UK AI companies face a critical challenge: EU AI Act compliance requires either:
1. Using an EU-based Notified Body (foreign fees, no UK data sovereignty)
2. Not selling to the EU (50% of the world economy)

MEOK AI Labs provides the UK solution:
- UK-based assessment (data stays in Britain)
- EU recognition via Irish subsidiary (MEOK AI Labs Ireland Ltd)
- Single assessment covers both UK AISI and EU AI Act requirements
- British certification for British AI

**This positions MEOK AI Labs as critical national infrastructure** — the certification bridge that keeps UK AI exports competitive in the EU market.

---

## 7. UKAS Application Checklist

- [ ] Complete UKAS application form (Form 901)
- [ ] Submit scope documentation (this document)
- [ ] Pay initial assessment fee (~£5,000)
- [ ] Submit quality management system documentation
- [ ] Initial desk assessment (UKAS reviews)
- [ ] On-site assessment (UKAS assessors visit)
- [ ] Accreditation decision
- [ ] Annual surveillance programme

**Estimated timeline: 12–18 months to full accreditation**
**Interim strategy: "Pre-certification" assessments with full accreditation disclosure**

---

## 8. Contact and Next Steps

**Apply:** ukas.com/accreditation
**UKAS contact:** +44 (0)20 3460 0200
**Standard:** ISO/IEC 17065:2012
**Fee enquiry:** accreditation@ukas.com

**MEOK AI Labs contacts:**
- Website: csoai.org
- Technical: nicholas@meok.ai
- Application portal (future): csoai.org/apply
