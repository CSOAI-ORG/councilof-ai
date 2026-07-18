# Expression of Interest — Dstl AI and Autonomous Systems Challenge
## MEOK LABS Ltd / MEOK AI Labs.org
### Physical AI Evaluation Facility — UK Sovereign Compute — UK AISI-Aligned Safety Assessment

**Organisation:** MEOK LABS Ltd (trading as MEOK AI Labs.org)
**Registered in:** England and Wales
**Principal Contact:** Nicholas Templeman, CEO/CTO
**Website:** meok.ai | csoai.org
**Date:** 2026-04-04

---

## 1. Executive Summary

MEOK LABS operates the United Kingdom's only purpose-built physical AI evaluation facility combining an uncontrolled outdoor testbed, sovereign compute infrastructure, and a UK AISI-aligned safety certification framework. This capability is directly relevant to Dstl's requirement for independent evaluation of autonomous systems intended for defence and national security applications.

The facility comprises a 6.5-acre agricultural testbed at iokfarm.co.uk, a 9-node GPU cluster housed in a 1,800 sq ft dedicated laboratory, and the HARVI protocol — Humanoid Autonomous Robotic Validation Interface — a structured evaluation methodology for physical AI systems operating in uncontrolled environments. Safety certification is delivered through MEOK AI Labs.org, which applies the UK AI Safety Institute's Inspect evaluation framework with a 16-probe adversarial testing suite (the care membrane).

For the Ministry of Defence, the critical value proposition is threefold: outdoor physical environment testing that simulation cannot replicate; UK sovereign compute with no dependency on US cloud infrastructure; and a safety certification pipeline aligned to JSP 936 and UK AISI standards. Evaluation conducted at MEOK LABS generates evidence that is fully UK-sovereign, audit-trailable, and ITAR-compatible in pathway.

MEOK LABS is seeking a Dstl engagement to formalise facility access, establish evaluation contracts for autonomous systems, and explore joint research into physical AI safety standards for defence applications.

---

## 2. The Capability Gap We Fill

The evaluation pipeline for autonomous systems in UK defence currently has a structural gap between simulation-based testing and real-world operational deployment. Dstl and UK defence primes have access to controlled laboratory environments and high-fidelity simulation platforms. What does not exist in the UK defence ecosystem is an independent, sovereign, outdoor physical evaluation facility operating under an accredited safety framework.

This gap has direct operational consequences. Autonomous ground vehicles, drone coordination systems, agricultural and logistics autonomy, and multi-agent robotic platforms all exhibit failure modes that do not surface in simulation. Terrain variation, weather, sensor degradation, unexpected biological and mechanical obstacles, and edge-case adversarial conditions — these are the environments in which defence autonomous systems must perform reliably. A system that passes simulation acceptance is not a system that has been evaluated. It is a system that has been modelled.

The second gap is sovereign evaluation capacity. Current autonomous systems evaluation for defence — where it involves physical environments — is conducted either by defence primes on their own sites (creating conflicts of interest and limiting independence), by academic institutions with restricted compute and no safety certification infrastructure, or by US-based facilities subject to CLOUD Act jurisdiction. There is no independent UK body that combines outdoor physical testing, sovereign compute, and a formalised AI safety certification framework.

The third gap is evaluation methodology for physical AI specifically. Existing AI safety frameworks — including the UK AISI Inspect suite — were designed for language model and software-layer AI. They do not address the distinct failure modes of AI systems that actuate in physical space: collision risk, sensor spoofing, environmental context loss, multi-agent conflict, and degraded-mode autonomy. HARVI was developed to fill this gap.

MEOK LABS offers all three capabilities from a single UK-sovereign facility. No equivalent combination exists elsewhere in the UK defence evaluation ecosystem.

---

## 3. Technical Capability Description

### 3.1 Physical Testbed — iokfarm.co.uk

The 6.5-acre agricultural site provides an uncontrolled outdoor evaluation environment with the following characteristics:

- Variable terrain: grassland, rough ground, water features, slopes, obstacle courses
- Environmental variability: exposed to full UK weather conditions, seasonal change, low-visibility scenarios
- Sensor infrastructure: conductivity, temperature, pH, dissolved oxygen, and optical networks deployed across the site
- Digital twin: NVIDIA Isaac Sim representation of the physical site for pre-evaluation simulation runs and ground-truth comparison
- Operational area for autonomous ground vehicles, drone systems, and multi-agent robotic platforms
- 1,800 sq ft adjacent laboratory for pre-deployment integration, data processing, and post-evaluation analysis

The site is not a controlled test track. It is an operating farm with the full complexity that implies. This is a deliberate design choice: evaluation environments that are too controlled produce results that do not transfer to operational conditions.

### 3.2 Compute Infrastructure

The 9-node GPU cluster provides:

- Total evaluation compute: approximately 350+ TFLOPS across heterogeneous nodes (Apple Silicon edge inference nodes plus NVIDIA GPU evaluation nodes)
- Local inference: models up to 70B parameters served entirely on-site with no cloud dependency
- Distributed evaluation harness: parallel safety probe execution across nodes
- Data residency: all evaluation data processed and stored in the UK; no data egress to foreign infrastructure

### 3.3 HARVI Protocol — Humanoid Autonomous Robotic Validation Interface

HARVI is a structured evaluation protocol for physical AI systems operating in uncontrolled environments. It addresses the failure modes specific to embodied AI that software-layer frameworks do not cover:

- **Environmental context evaluation:** how the system responds to conditions outside its training distribution
- **Degraded sensor testing:** evaluation under spoofed, occluded, and failed sensor conditions
- **Multi-agent interaction:** behaviour assessment when operating alongside other autonomous systems, human operators, and animals
- **Emergency stop and override reliability:** verification of human control reassertion under adversarial conditions
- **Failure mode characterisation:** structured documentation of observed edge cases for safety case development

HARVI generates structured evaluation reports suitable for inclusion in safety cases under JSP 936.

### 3.4 Care Membrane — Adversarial AI Safety Evaluation

For AI systems with language model or decision-layer components, MEOK AI Labs.org applies the care membrane evaluation framework: 16 standardised adversarial probes across 7 attack categories, implemented on the UK AISI Inspect framework. This provides quantified, reproducible evidence of safety boundary robustness. Evaluation results are recorded to an immutable audit trail.

---

## 4. Sovereign Infrastructure Argument

All evaluation conducted at MEOK LABS is processed and stored on UK-sovereign infrastructure. This is not a policy position — it is an architectural fact of how the facility is built.

The compute cluster operates entirely on hardware physically located in the United Kingdom. Local model inference uses on-site nodes; no evaluation data transits foreign networks. There is no dependency on AWS, Azure, Google Cloud, or any other US hyperscaler. CLOUD Act jurisdiction does not apply to any component of the evaluation pipeline.

This matters for defence engagements in three specific ways. First, ITAR-adjacent evaluations — where the AI system under test, its training data, or its intended application touches export-controlled material — require that evaluation infrastructure not be subject to foreign jurisdiction. MEOK LABS provides a credible UK-sovereign pathway for such evaluations pending formal ITAR classification review. Second, evaluation of AI systems for sensitive national security applications cannot be conducted on infrastructure where foreign intelligence services may exercise lawful access. The MEOK LABS architecture removes this risk. Third, post-Brexit procurement policy increasingly requires UK sovereign alternatives for critical national capability. An independent UK physical AI evaluation facility reduces dependence on US defence industry evaluation infrastructure.

MEOK LABS is pursuing alignment with JSP 936 (the MoD AI framework) and is registered in England and Wales with all data processed under UK GDPR. The facility is operated by British nationals on UK soil.

---

## 5. Proposed Engagement

MEOK LABS proposes three tiers of engagement with Dstl, scalable by requirement and budget:

### Tier 1 — Facility Access Agreement

A structured access arrangement permitting Dstl and designated defence primes to conduct autonomous systems evaluations at the iokfarm.co.uk testbed. This would include site surveys, digital twin access, evaluation scheduling, and data handling agreements. Suitable for programmes requiring outdoor physical evaluation of autonomous ground or aerial vehicles. Estimated basis: day-rate facility access plus data processing fees.

### Tier 2 — Evaluation Contract

A formal evaluation contract under which MEOK LABS conducts HARVI protocol evaluations of Dstl-nominated autonomous systems and delivers structured safety evaluation reports. Reports would be formatted for inclusion in JSP 936-aligned safety cases. MEOK AI Labs.org issues an evaluation certificate with blockchain-recorded audit trail. Suitable for programmes at TRL 4–7 requiring independent physical evaluation evidence. Estimated basis: per-system evaluation contract, £25,000–£75,000 depending on scope and duration.

### Tier 3 — Joint Research Programme

A collaborative research programme with Dstl to develop evaluation methodology for physical AI in defence-relevant environments. Research objectives would include: formalisation of HARVI as a published evaluation standard; development of outdoor adversarial scenario libraries; integration of HARVI with existing MoD autonomous systems test and evaluation frameworks; and investigation of multi-domain evaluation (ground/air/maritime interface scenarios). Suitable for longer-horizon engagement seeking to build UK sovereign capability in physical AI safety evaluation. Estimated basis: DASA or Dstl-contracted research programme, £500,000–£2M over 24 months.

All engagement tiers can proceed under standard Dstl framework terms. MEOK LABS is prepared to receive Dstl site visits, provide facility demonstrations, and support due diligence under appropriate NDAs.

---

## 6. Team

**Nicholas Templeman — CEO/CTO, Chief Safety Officer**
Systems architect with 15+ years infrastructure and AI development experience. Built and operates MEOK.AI (22 production APIs, 307 automated tests, 15 LLM models), the HARVI protocol, and the MEOK AI Labs evaluation framework. Operates iokfarm.co.uk as a physical AI testbed. Primary responsible person for all facility operations and evaluation delivery.

**Academic Advisor — [Dr. Raj Joshi, UCL]**
AI safety evaluation methodology. University College London connection to the UK AISI Inspect framework research programme.

**Planned Hires — defence engagement dependent**
Head of Regulatory Affairs (target: ex-NCSC, ex-Dstl, or ex-defence prime safety assurance). Senior Physical AI Evaluation Engineer.

---

## Appendix: Alignment Reference

| MoD/Dstl Requirement | MEOK LABS Capability |
|---|---|
| Independent physical AI evaluation | HARVI protocol, iokfarm.co.uk testbed |
| UK sovereign compute | 9-node on-site cluster, no foreign cloud |
| JSP 936 alignment | MEOK AI Labs evaluation reports formatted for safety cases |
| UK AISI framework | Care membrane on Inspect; 16-probe adversarial suite |
| Outdoor uncontrolled environment | 6.5-acre agricultural testbed, full weather exposure |
| ITAR-compatible pathway | UK-sovereign data residency, British nationals, UK jurisdiction |
| Audit trail | Immutable blockchain certificate ledger |

---

**Contact:** nicholas@meok.ai
**Facility:** iokfarm.co.uk / MEOK LABS Ltd, England
**Certification body:** csoai.org
