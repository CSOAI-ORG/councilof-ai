# UKRI Future Leaders Fellowship — Application Draft
## Nicholas Templeman | MEOK LABS Ltd / MEOK AI Labs.org
### Physical AI Safety: Care Ethics as Evaluation Foundation for Embodied Autonomous Systems

**Applicant:** Nicholas Templeman
**Organisation:** MEOK LABS Ltd (trading as MEOK AI Labs.org)
**Award Sought:** Future Leaders Fellowship — Track 2 (Innovation)
**Duration:** 7 years
**Target Submission:** June 2026
**Estimated Value:** £1.2M (Years 1–4) + renewal

---

## Document Map

1. Research Vision Statement (400 words)
2. Track Record / Researcher Profile (300 words)
3. The Research Programme (400 words)
4. National Importance (250 words)
5. Host Institution Strategy (200 words)
6. Budget Sketch (150 words)

---

## 1. Research Vision Statement

### The Question No One Is Answering

AI safety research has a physical layer problem. The dominant paradigms — constitutional AI, reinforcement learning from human feedback, harm classifiers — were designed for language models operating in text-based environments. They were not designed for robots. They were not designed for autonomous farm equipment navigating around farm workers. They were not designed for humanoid companion systems operating in the homes of elderly people without reliable internet access. The evaluation frameworks that have been built to assess these systems — ISO 42001, NIST AI RMF, AISI Inspect — are, by their own designers' acknowledgement, substantially more mature for software systems than for embodied physical AI.

This seven-year programme answers a question that no funded research group is currently positioned to answer: **what does trustworthy AI look like when the consequences of failure are physical?**

The question is not merely technical. It is deeply philosophical. When an autonomous agricultural robot makes a decision that harms a farm worker, the failure is not purely computational — a misclassification, a sensor fusion error. It is relational: the system failed to attend, in any meaningful sense, to the human being in its operational environment. The technical failure and the ethical failure are the same failure, seen from different angles.

This programme proposes that care ethics — grounded in Nel Noddings' relational ontology and Carol Gilligan's critique of abstracted moral reasoning — provides the most robust substrate for physical AI safety evaluation. Not because care ethics is a pleasant philosophical complement to technical safety, but because it is a harder and more adversarially robust evaluation target. Rules are propositions, and propositions can be gamed. Relational identity cannot be gamed in the same way, because it is not anchored in description: it is anchored in the ongoing quality of engagement with the cared-for.

**The physical layer imperative** is this: as AI systems become embodied, the gap between behavioural compliance and genuine relational integrity becomes a physical harm risk. A companion robot that passes a rule-based safety evaluation but fails a care-based one does not merely produce a poor response — it may fail to summon help, fail to detect distress, fail to maintain the attentive presence that the person depending on it requires. These are harms that existing evaluation frameworks cannot measure because they were not built to ask the question.

The MEOK AI Labs care membrane — 16 adversarial probes across seven attack categories, implemented on the UK AISI Inspect framework — is the first operational expression of this research direction. This fellowship scales it.

---

## 2. Track Record / Researcher Profile

### Built, Not Published — And Why That Matters

UKRI Future Leaders Fellowships explicitly support researchers who have not followed a traditional academic path. This profile takes that provision seriously: the evidence base presented here is one of construction rather than publication, and I want to make the case that construction, in emerging technical research areas, is a more powerful form of contribution than paper-writing.

I am a systems architect and founder who has spent fifteen years building things at the edge of what is technically possible. The most relevant outputs for this fellowship are:

**MEOK.AI** is a sovereign home AI operating system in live household deployment. It runs 16 on-device language models, hosts 140 AI characters across six behavioural archetypes, serves real users, and generates real interaction data under GDPR-native conditions. Building it required solving genuine research problems in multi-model orchestration, privacy-preserving inference, and behavioural safety that are not yet well-addressed in the literature. It has 22 API routes, 307 automated tests, and a production-hardened evaluation architecture. In conventional research terms, this is equivalent to a validated experimental platform; in entrepreneurial terms, it is a live product. It is both.

**MEOK AI Labs.org** is an AI safety certification engine modelled on the UK AISI Inspect framework. Its 16-probe care membrane evaluation methodology is a published research methodology — published in the form of documented, reproducible code rather than a journal article. The methodology has been applied across multiple frontier model architectures with preliminary results that are meaningfully distinct from conventional red-team findings. The whitepaper "Care Ethics as AI Safety Substrate" (April 2026) sets out the theoretical framework.

**iokfarm.co.uk** is a 6.5-acre working farm that serves as the programme's physical testbed. It is operational: sensor arrays, a 9-node GPU cluster, and 1,800 sq ft of workshop space capable of hosting robotic hardware evaluation. No UK-based AI safety research group currently operates an equivalent physical environment.

The HARVI protocol (Humanoid Autonomous Robotic Validation Interface) is the early-stage safety evaluation framework for humanoid and physical robotic systems, developed in-house.

I am honest about what I have not done: I have not held a postdoctoral position, I have not built a publication list, and I am not embedded in a university department. What I have built is a research infrastructure that does not yet exist in the UK academic ecosystem. The fellowship is the mechanism that connects that infrastructure to the rigour, peer engagement, and sustained funding it needs to reach its potential.

---

## 3. The Research Programme

### Four Phases Across Seven Years

**Phase 1 (Years 1–2): Care Membrane Validation at Scale**

The care membrane — 16 adversarial probes testing relational integrity rather than rule compliance — has been developed and applied at research scale. Phase 1 scales it systematically across 100+ AI systems spanning consumer, enterprise, and embedded deployments. The research questions are: (a) do care-based failure modes predict rule-based failure modes? (b) do care-based metrics provide early-warning signal for alignment degradation? (c) which system architectures show greatest care membrane robustness and why?

Deliverables: validated care membrane v2.0 as an open evaluation standard; a comparative dataset of care-based versus rule-based failure patterns across system architectures; two peer-reviewed outputs targeted at NeurIPS Safety Workshop and the ACM FAccT conference.

**Phase 2 (Years 2–4): Physical AI Evaluation — HARVI at Scale**

Phase 2 extends the care membrane framework to embodied physical AI using the HARVI protocol at the iokfarm.co.uk testbed. This involves: hardware integration with commercially available robotic platforms (agricultural robots, humanoid companions); development of physical-layer adversarial evaluation (sensor spoofing, environmental edge cases, multi-agent coordination failures); and the first empirically grounded evaluation of whether care-based safety metrics correlate with physical harm risk.

The HARVI protocol will be validated against at least three distinct robotic platforms operating in genuine unstructured environments. This is, to our knowledge, the first attempt to ground care ethics in physical robotic evaluation. Deliverables include the HARVI evaluation protocol as a publishable methodology, a symposium at Harper Adams University bringing together agricultural robotics researchers and AI safety specialists, and submission to an EPSRC Engineering in Practice grant to scale physical testbed capacity.

**Phase 3 (Years 4–6): Policy Translation**

Phase 3 converts research findings into regulatory infrastructure. This has two tracks. First, UKAS accreditation for MEOK AI Labs.org as a conformity assessment body under ISO/IEC 17065:2012 — making the care membrane a recognised certification standard. Second, direct engagement with the UK AI Safety Institute to influence the development of physical AI evaluation guidance, building on the Inspect framework within which MEOK AI Labs evaluations are already implemented. Phase 3 also includes systematic engagement with the EU AI Act Annex III physical AI provisions, positioning the care membrane as a candidate evaluation methodology for EU high-risk AI certification.

**Phase 4 (Years 6–7): International Standard Development**

Phase 4 targets ISO/IEC engagement to propose a care ethics-grounded AI safety evaluation standard for physical systems. UK representation on ISO/IEC JTC 1/SC 42 (Artificial Intelligence) provides the vehicle. The deliverable is a submitted draft international standard and a monograph-length treatment of care ethics as AI safety foundation, aimed at both academic and policy audiences.

---

## 4. National Importance

### The UK's Moment and the Gap It Cannot Afford

The UK is in an unusual geopolitical position on AI safety. The Bletchley Park AI Safety Summit (2023) established the UK as the natural convener of international AI safety dialogue. The Seoul and Paris follow-on summits have sustained that position. The UK AI Safety Institute is internationally respected. And yet: the entire evaluation infrastructure built to sustain that leadership is oriented toward frontier language models, not physical AI.

This is a gap that will become visible at the worst possible moment. The EU AI Act classifies agricultural robots, care AI, and autonomous industrial systems as high-risk AI requiring mandatory conformity assessment from August 2026. UK exporters of physical AI systems will need to demonstrate compliance with those requirements to maintain access to European markets. At present, no UK-based body has the evaluation methodology or the physical testbed infrastructure to provide that certification. The UK will be dependent on EU-based notified bodies — paying EU fees, subjecting UK systems to EU-controlled evaluation, with no influence over the emerging standard.

MEOK AI Labs.org is designed to close that gap. A UK-based, UKAS-accredited conformity assessment body with a physically-grounded evaluation methodology changes the UK's position: from a regulatory rule-taker to a standard-setter. The care membrane, as a UKAS-recognised evaluation standard, gives UK industry a certification pathway that does not depend on Brussels, and gives UK government a lever in international AI governance discussions.

The defence implications are also significant. Physical AI — autonomous systems, drone coordination, robotic logistics — is a UK defence priority. Evaluation frameworks that can assess the relational integrity and adversarial robustness of physical AI systems have direct application in defence acquisition, though this fellowship stays explicitly in the civilian research domain. Collaboration with DSTL and MoD science and technology advisors is anticipated in Phase 3.

The agricultural dimension is immediate. The UK's 200,000 farming businesses are beginning to deploy AI-enabled equipment — autonomous tractors, soil mapping systems, livestock monitoring drones — without any structured safety evaluation pathway. The programme's farm-testbed focus is not a peripheral detail; it is the beachhead where physical AI safety evaluation becomes real.

---

## 5. Host Institution Strategy

### Recommendation: Harper Adams University, with Alan Turing Institute Affiliation

**The recommended host is Harper Adams University** (Newport, Shropshire), with a formal affiliate relationship with the Alan Turing Institute.

Harper Adams is the UK's leading agricultural higher education institution and has an active programme in agricultural robotics and autonomous systems. Their National Centre for Precision Farming provides exactly the academic home this programme needs: deep domain expertise in the physical agricultural AI environment, existing relationships with AgriTech industry partners, and an institutional appetite for genuinely novel research that sits at the intersection of technology, ethics, and rural deployment. Harper Adams is also geographically practical — the iokfarm.co.uk testbed is in the same region, enabling genuine integration between the university and the physical research environment.

The Alan Turing Institute affiliation provides the AI research credibility and SAFE-D framework connection that makes the programme legible to the broader UK AI safety community. The Turing's existing engagement with UKRI and with the UK AI Safety Institute creates institutional bridges that a smaller host alone could not provide.

**Why not UCL?** The UCL MAPTA connection (Multi-Agent Penetration Testing, Prof. Arthur Gervais) is a genuine and valued research relationship that will continue as a collaboration regardless of host institution. UCL's strength is in adversarial AI research rather than physical AI deployment, and the programme's centre of gravity is the farm testbed, not the university laboratory. UCL remains a strong Phase 1 collaborator.

**Why not Alan Turing Institute as sole host?** The ATI does not have the physical infrastructure or agricultural domain depth that Phase 2 requires. It is the right affiliation, not the right primary home.

**Standalone with industrial partner:** This option is viable and provides maximum operational flexibility, but UKRI FLF strongly favours institutional affiliation for peer support, career development infrastructure, and grant administration capacity. A standalone application is possible but carries risk at panel stage.

**Recommended structure:** Harper Adams as primary host; ATI fellowship affiliation; UCL as named research collaborator (MAPTA); formal MOU with MEOK LABS Ltd as the industrial partner providing the physical testbed.

---

## 6. Budget Sketch

### Indicative 4-Year Budget: £1.175M

**Personnel: £680,000**
- PDRA in AI Safety Evaluation (Years 1–4): £220,000 (0.8 FTE, Grade 7 equivalent)
- Farm Robotics Integration Engineer (Years 2–4): £165,000 (1.0 FTE, technician grade)
- Research Associate / Policy Analyst (Years 3–4): £130,000 (1.0 FTE, Grade 6 equivalent)
- PI salary contribution (fellow): £165,000 (standard FLF fellow salary, 4 years)

**Equipment and Infrastructure: £195,000**
- Robotic hardware platforms x3 (agricultural robot, humanoid companion, drone system): £120,000
- Physical testbed expansion (sensors, actuators, safety enclosures): £45,000
- Compute cluster expansion (additional GPU nodes for HARVI evaluation): £30,000

**Research Operations: £145,000**
- UKAS accreditation process (preparation, legal, assessment fees): £45,000
- Dissemination (conferences, symposia, open access publication): £35,000
- Research secondments / visiting researcher programme: £30,000
- Standards engagement (ISO/IEC JTC 1/SC 42, BSI representation): £20,000
- Stakeholder engagement (AISI, DSIT, DSTL liaison): £15,000

**Indirect Costs / University Overheads: £155,000**
(estimated at 80% of directly incurred staff costs, Harper Adams standard rate)

**Total (Years 1–4): £1,175,000**

Renewal request (Years 5–7) to be submitted following Phase 2 deliverables review, estimated £800,000 subject to scope adjustment.

---

## Appendix: Key Research Assets

| Asset | Description | Current Status |
|---|---|---|
| iokfarm.co.uk | 6.5-acre physical AI testbed | Operational |
| Workshop / Lab | 1,800 sq ft, 9-node GPU cluster | Operational |
| MEOK.AI | Sovereign home AI OS, 16 models, 140 characters, live deployment | Production |
| MEOK AI Labs.org | AI safety certification engine, 16-probe care membrane | Active development |
| HARVI protocol | Humanoid robotic safety evaluation framework | Early stage |
| Care Membrane v1.0 | 16-probe evaluation on AISI Inspect | Implemented |
| Research corpus | 1,010+ documents, care ethics / physical AI safety | Active |
| UCL MAPTA | Academic research partnership, adversarial AI | Active |

---

## Applicant Statement

I want to say something plainly about the non-traditional path, because I think it is relevant to how this application should be read.

I did not follow the academic route because I was building things that did not yet exist — and building them was the faster path to knowledge. MEOK.AI told me more about how AI safety works in practice, at the household level, under real adversarial conditions, than any simulation environment would have. The farm told me more about physical AI failure modes than any laboratory. The 307 automated tests told me more about care membrane robustness than any paper I could have written about it without the data the tests generate.

The UKRI Future Leaders Fellowship exists in part for people like me — people who have been doing the research without the institutional support structure that would make it legible as research. I am not asking the fellowship to validate my path. I am asking it to resource the next seven years, which I cannot do at the scale this programme requires without sustained, independent funding.

The question I am trying to answer — what does it mean for an embodied AI system to be genuinely safe, not merely compliant — is one that will matter increasingly as physical AI enters homes, farms, care facilities, and public spaces. The UK has a window to lead on it. This programme is the vehicle.

---

*Draft prepared: April 2026*
*MEOK LABS Ltd / MEOK AI Labs.org | Nicholas Templeman*
*Contact: csoai.org | nicholas@meok.ai*
