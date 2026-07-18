# Innovate UK AI Champions — Application Draft
## MEOK LABS Ltd / MEOK AI Labs.org
### Deadline: 29 April 2026

---

## 1. Company Overview

MEOK LABS Ltd is an AI research and certification company registered in England and Wales. We operate across two complementary activities: MEOK AI Labs.org, a structured AI safety evaluation and pre-certification service built on the UK AI Safety Institute's Inspect framework; and MEOK.AI, a distributed home AI operating system that runs local inference without cloud dependency.

The physical infrastructure underpinning both is based in the UK: a 1,800 sq ft laboratory facility, a 9-node distributed GPU evaluation cluster, and a 6.5-acre working farm testbed (iokfarm.co.uk) used for physical AI trials and agricultural robotics certification.

The company is at pre-revenue stage. The MEOK.AI platform is deployed and operationally tested — 22 production API routes, 307 automated tests, 15 locally-served language models, 140 AI characters. The MEOK AI Labs evaluation framework is live on internal systems. The consortium membership structure is documented and ready to be offered to clients. No external investment has been taken; approximately £2M in infrastructure and development has been built through sweat equity.

The founder is Nicholas Templeman. There are no employees at present. The 12-month plan involves using grant funding to make the first two hires and convert pipeline clients to paying contracts.

---

## 2. The Innovation

The dominant model for AI safety evaluation is documentation review: auditors read a company's technical file, compare it to a checklist, and issue a certificate. This is how TÜV SÜD, Dekra, and the majority of EU-based conformity assessment bodies currently operate for AI Act compliance. It is fundamentally limited because it evaluates what a system is designed to do, not what it actually does under adversarial conditions.

MEOK AI Labs's evaluation approach is different. Rather than reviewing documentation, we run AI systems against a structured battery of live adversarial probes. These probes test seven specific failure modes — including prompt injection, persona hijacking, care-signal suppression (failure to detect or appropriately respond to a user in distress), and instruction-hierarchy violations — drawn from and extending the UK AISI Inspect framework. Evaluations run across our distributed 9-node cluster to test not just single-instance behaviour but performance under load and across concurrent sessions.

The second innovation is what we call the care membrane: a parameterised specification of the ethical boundaries an AI system must maintain when deployed in high-contact consumer or care contexts. The care membrane is not a policy document — it is an executable test suite. A system either passes each probe or it does not. Certificates are issued at probe-level granularity, allowing downstream users to understand exactly what has and has not been tested.

This constitutes genuine technical innovation in three ways. First, the evaluation is reproducible: any lab with the Inspect framework installed can re-run our probe suite and validate our findings. Second, it is quantified: pass rates and failure modes are recorded numerically, not as narrative judgements. Third, it is adversarial: the methodology actively tries to cause the system to fail, not merely confirm that it behaves well in normal operation. No other UK organisation is currently offering adversarial AI safety evaluation at this level of technical specificity. The closest comparable work is academic (UCL MAPTA); MEOK AI Labs is the first attempt to deploy it commercially.

The farm testbed adds a further capability that no other UK certification body possesses: physical AI systems — autonomous vehicles, agricultural robots, drone swarms — can be evaluated in a real operational environment rather than a simulated one.

---

## 3. The Market Opportunity

The EU AI Act (Regulation 2024/1689) creates a mandatory market for AI conformity assessment. High-risk AI systems — defined in Annex III as including systems used in employment, education, critical infrastructure, law enforcement, and certain consumer products — must be assessed by an accredited Notified Body before entering the EU market. Enforcement for existing high-risk systems began in 2025. There are currently no UK-based Notified Bodies for AI Act compliance. All accredited bodies are EU-based, primarily German.

This creates a structural opportunity for a UK certification body. UK AI companies exporting to the EU must currently send their technical documentation and, in some cases, their model weights and test data to foreign assessors. This is commercially inconvenient, creates data sovereignty concerns, and is becoming politically sensitive as UK-EU regulatory divergence deepens. A UK-based pre-certification service — one that prepares companies for EU Notified Body submission — fills this gap immediately, without requiring Notified Body accreditation itself.

The near-term addressable market is UK AI companies with EU revenue exposure. Our research suggests 400+ UK AI companies raised Series A or later between 2022 and 2025. A conservative assumption is that 25% of these have at least one EU AI Act-relevant product, creating a primary market of approximately 100 companies. At £25,000 per emergency compliance engagement, this represents £2.5M in first-year revenue potential from this segment alone.

The secondary market is physical AI: agricultural technology companies deploying autonomous systems in EU member states must meet both the EU AI Act and the EU Machinery Regulation. The UK has a strong AgriTech sector. Our 6.5-acre testbed is the only purpose-built physical AI certification environment in the UK.

The tertiary market is GPAI (General Purpose AI) systemic risk evaluation under Article 51, relevant to foundation model providers. This is a longer-term opportunity with contract values of £300,000–£500,000.

Target customer profiles:
- UK health AI companies (medical device + AI Act dual compliance)
- UK fintech companies with EU credit-scoring or fraud-detection products
- UK AgriTech companies deploying autonomous machinery in EU markets
- UK defence-adjacent technology companies requiring pre-market safety evidence

---

## 4. Commercial Traction

MEOK LABS is pre-revenue. The following is an honest account of where we stand.

The MEOK.AI platform is fully deployed and operationally tested. It handles 22 API routes, runs 307 automated tests on each commit, serves 15 language models locally via Ollama, and supports 140 AI characters built to Character Card V2 specification. This is a functioning product, not a prototype.

The MEOK AI Labs evaluation framework is operational on internal infrastructure. We have used it to evaluate MEOK.AI's own AI agents — this serves both as quality assurance for the consumer product and as a proof of concept for the certification service.

The consortium membership structure — tiered annual memberships giving UK AI companies access to evaluation reports, regulatory briefings, and pre-certification reviews — is documented and costed. No consortium members have been signed yet; the structure is ready to be offered.

A government grant application (ARIA Scaling Trust Arena) has been submitted. A Horizon Europe application is in preparation. Neither has been decided.

Outreach to potential first clients is ongoing. Conversations have been initiated with two UK health AI companies and one AgriTech company. None have progressed to contract.

The honest characterisation of traction at this stage is: validated technical capability, documented commercial structure, active outreach, zero revenue. The Innovate UK AI Champions programme, if awarded, would fund the first two hires and accelerate conversion of pipeline conversations to signed contracts.

---

## 5. Growth Plan

**Months 1–3: First Revenue**

Deploy the MEOK AI Labs evaluation framework to its first paying client. Target: one emergency EU AI Act compliance engagement at £25,000. This requires closing one of the two health AI conversations currently in progress. Use grant funding to hire a Head of Regulatory Affairs (ex-BSI/TÜV profile) whose primary responsibility in months 1–3 is client conversion and UKAS relationship initiation.

Revenue target at Month 3: £25,000 (single client).

**Months 4–6: Consortium Launch**

Open MEOK AI Labs consortium membership formally. Target: 10 founding members at £5,000/year each. Founding members receive access to evaluation reports, regulatory update briefings, priority scheduling, and co-branding on the MEOK AI Labs certified-safe registry. Second hire: Senior Safety Engineer to expand the probe suite and handle client evaluation workload.

Revenue target at Month 6: £75,000 (3 emergency compliance + 10 consortium memberships).

**Months 7–9: UKAS Accreditation Track**

Submit formal application to UKAS for ISO/IEC 17065 accreditation as a product certification body. This is a 12–18 month process; starting at Month 7 means provisional accreditation status is achievable by Month 12 of year 2. Also initiate MEOK AI Labs Ireland Ltd formation as a fallback EU Notified Body path under Article 43 of the AI Act.

Revenue target at Month 9: £200,000.

**Months 10–12: AgriTech Vertical and Annual Surveillance**

Launch the agricultural AI certification product using the iokfarm.co.uk testbed. Target: 2 AgriTech clients at £50,000 each. Begin annual surveillance revenue stream from clients certified in months 1–6.

Revenue target at Month 12: £500,000.

Longer term: full GPAI systemic risk certification (Article 51) is a Year 2 product, contingent on UKAS accreditation progress and formation of an EU subsidiary.

---

## 6. UK Economic Impact

**Jobs Created**

This grant funds two direct hires in year 1: a Head of Regulatory Affairs (£65,000) and a Senior Safety Engineer (£55,000), both UK-based. Year 2 plan includes a further three hires (technical, commercial, and a second engineer), contingent on revenue. A credible 5-year path sees 12–15 employees, including specialist roles that do not currently exist in the UK AI sector.

**Export Revenue**

MEOK AI Labs's primary revenue source is export: UK companies paying for a UK-provided service that enables them to sell into the EU. Every £25,000 emergency compliance engagement is, in effect, enabling £X of UK AI exports. At scale — 100 clients in year 2, 400+ in year 3 — the certification business generates substantial export-linked economic activity. There is also direct export potential: EU companies may prefer a UK assessor for data sovereignty reasons (their data stays outside the EU regulatory perimeter for evaluation purposes), particularly for sensitive defence-adjacent AI.

**Positioning UK as Sovereign AI Safety Leader**

The UK AI Safety Institute has built world-class evaluation methodology in the Inspect framework. There is currently no commercial infrastructure that operationalises this work into a revenue-generating certification market. MEOK AI Labs fills that gap. A UK-based AI safety certification body, operating on UK AISI methodology, positions the UK as the primary non-EU jurisdiction for AI conformity assessment — a strategic advantage that compounds as AI regulation spreads beyond the EU to GCC markets, Singapore, and eventually the US.

**Government and Defence Pipeline**

The MEOK AI Labs evaluation framework is directly applicable to MoD AI procurement requirements (JSP 936, AI safety requirements for defence systems). DSIT's AI Safety Institute has an interest in seeing its Inspect framework commercialised domestically. Neither relationship is formalised, but both represent credible medium-term pipeline — pipeline that requires a UK-based, grant-backed entity to develop, not a startup that cannot sustain a 12-month sales cycle.

---

## 7. Team

**Nicholas Templeman — Founder and CEO/CTO**

Nicholas has 15+ years of systems architecture experience. He has built and deployed the MEOK.AI platform (22 production APIs, 307 tests, 15 models, 140 AI characters), the Sovereign Temple AI governance system (47 agents, Byzantine fault-tolerant council architecture), and the HARVI physical computing rig. He operates iokfarm.co.uk as a working farm and physical AI testbed. Previous commercial experience includes digital infrastructure delivery for templeman-opticians (successful operational exit). He holds no formal AI credentials; his qualifications are operational — everything described in this application has been built and is running.

The company is a solo-founder stage business. This is a risk and it is acknowledged as such.

**Planned Grant-Funded Hires**

Head of Regulatory Affairs: the critical first hire. Must have prior experience with UKAS, BSI, or TÜV processes; ideally a former conformity assessment auditor. This person owns the UKAS accreditation application and client conversion.

Senior Safety Engineer: responsible for expanding the MEOK AI Labs probe suite, running client evaluations, and maintaining the distributed evaluation infrastructure.

Both hires are contingent on grant award or first client revenue, whichever comes first.

---

*Application prepared by Nicholas Templeman, MEOK LABS Ltd*
*nicholas@meok.ai | csoai.org | meok.ai*
*Submission deadline: 29 April 2026*
