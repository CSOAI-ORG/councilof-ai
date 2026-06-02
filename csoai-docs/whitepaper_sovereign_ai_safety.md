# Sovereign AI Safety Infrastructure: The Case for Physical Evaluation Facilities

**Author:** Nicholas Templeman, CSOAI LTD (trading as MEOK AI Labs)
**Date:** April 2026
**Classification:** Open Policy Document
**Audience:** UK Ministry of Defence (MoD), Defence Science and Technology Laboratory (Dstl), Department for Science, Innovation and Technology (DSIT)

---

## 1. Executive Summary

The United Kingdom has established global leadership in AI safety through the AI Safety Institute (AISI), the Bletchley Declaration, and the Seoul and Paris summits. Yet a structural gap persists in the evaluation architecture underpinning that leadership: the majority of frontier AI safety assessments are conducted over US-hosted cloud infrastructure, often using APIs operated by the same model providers under evaluation. For general-purpose language models this is a recognised limitation. For embodied AI systems — robotic, agricultural, and defence-adjacent — it is a fundamental category error. Physical AI cannot be meaningfully evaluated in the absence of physical infrastructure. This paper sets out the case for a UK programme of sovereign, physical AI evaluation facilities; describes one operational implementation at MEOK LABS / MEOK AI Labs.org; and offers concrete policy recommendations for DSIT and Dstl, centred on establishing a Physical AI Evaluation Centre (PAEC) programme aligned with the UK's existing AI governance commitments.

---

## 2. The Problem: Cloud-Dependent Safety Evaluation

### 2.1 The Structural Dependency

The standard workflow for advanced AI safety evaluation currently proceeds as follows: an evaluating body constructs a suite of adversarial probes, transmits those probes via API to a model hosted on infrastructure owned or leased by the model provider, and interprets the responses. The UK AI Safety Institute's Inspect framework — a significant technical achievement and the most credible open evaluation toolkit produced by any national government — operates within this paradigm. So do the majority of third-party evaluations commissioned under voluntary commitments made at Bletchley.

This architecture carries three compounding risks that have received insufficient policy attention.

### 2.2 Adversarial Probes Transiting Foreign Infrastructure

Evaluation probes, by their nature, encode the evaluating body's threat model. A probe designed to test whether a model can be induced to provide synthesis routes for chemical precursors, or to bypass a care membrane constraining autonomous action, necessarily reveals what the evaluator considers a live risk vector. When those probes transit US-hosted cloud infrastructure — subject to US jurisdiction, US intelligence collection authorities, and the operational monitoring of the cloud provider — the UK's threat model is, in effect, disclosed to foreign systems. This is not a hypothetical concern. It is the routine consequence of using commercial API endpoints for national security-adjacent evaluation work.

### 2.3 Evaluators Cannot Observe Their Own Evaluations

The second structural problem is epistemic. When a model provider hosts the evaluation endpoint, they retain visibility over the traffic. This creates an incentive compatibility failure: a provider aware that an evaluation is in progress can, in principle, modify model behaviour for the duration. The EU AI Act's Annex III, which defines high-risk AI system categories, implicitly acknowledges this by requiring that conformity assessments for high-risk systems involve independent third-party evaluation. The UK, post-Bletchley, has not yet established a corresponding statutory requirement. Voluntary commitments from frontier labs, made in good faith, are insufficient where the evaluation infrastructure itself is under provider control.

### 2.4 No Physical Layer

The third and most fundamental problem is that cloud-based evaluation has no physical layer. It can assess the linguistic behaviour of a language model. It cannot assess the behaviour of a system that actuates motors, navigates terrain, handles livestock, or operates in GPS-degraded environments. The AISI's evaluations of GPT-4o and Claude 3 Opus, conducted in the months following Bletchley, were exclusively text-and-multimodal evaluations. They provide no template — and no infrastructure — for evaluating the next wave of AI-adjacent systems that will carry the highest real-world risk.

---

## 3. The Physical Evaluation Imperative

### 3.1 Embodied AI Is a Different Evaluation Domain

The AI safety community has, to date, focused disproportionately on frontier language models because that is where the most visible capabilities have emerged. This is understandable but increasingly incomplete. The UK Government's AI Action Plan (January 2025) explicitly identifies robotics and autonomous systems as strategic sectors. Defence procurement pipelines now routinely include AI-adjacent autonomous platforms. The agricultural sector — a critical national infrastructure domain under the UK's National Security and Investment Act — is integrating AI-driven systems for crop management, livestock monitoring, and autonomous vehicle operation. None of these systems can be evaluated meaningfully via API calls to a language model endpoint.

### 3.2 Simulation Is Necessary but Not Sufficient

The standard counter-argument is that physical evaluation can be approximated through simulation: digital twins, synthetic environments, and physics engines can replicate real-world conditions at lower cost and greater repeatability. Simulation is genuinely valuable and should be part of any evaluation stack. It is not sufficient, and the gap between simulation and reality is precisely where safety-critical failures concentrate. A robotic system that passes all simulation-based safety checks may fail in unstructured terrain, in adverse weather, in the presence of unfamiliar biological agents, or under electromagnetic interference that simulators do not model accurately. Agricultural environments are particularly adversarial in this sense: they combine unpredictable animal behaviour, variable terrain, equipment interaction, and public access in ways that defeat simulation at scale.

### 3.3 The Farm as an Adversarial Testbed

MEOK LABS operates a 6.5-acre farm testbed that functions as a structured adversarial environment for physical AI evaluation. The combination of unstructured terrain, live agricultural activity, seasonal variability, and deliberate fault injection creates evaluation conditions that no synthetic environment replicates. Critically, it does this on sovereign UK infrastructure, under UK legal jurisdiction, with no data leaving a UK-controlled network perimeter. This is the model the UK needs to scale: not single centrally-operated facilities, but a network of accredited physical testbeds with standardised evaluation protocols, capable of covering the full range of deployment environments relevant to national priority sectors.

### 3.4 Defence Considerations

For defence-adjacent AI evaluation, the physical imperative is even more acute. Systems intended for ISR, logistics autonomy, or human-machine teaming in degraded environments cannot be evaluated against paper threat models alone. Dstl has significant existing capability in this area, but no formal programme for certifying commercial AI systems against physical evaluation standards prior to procurement. The gap between commercial AI development and defence-grade safety certification is currently bridged by ad hoc processes that do not scale as the pace of AI capability development accelerates.

---

## 4. The MEOK AI Labs Model

### 4.1 Architecture

MEOK AI Labs.org (Centre for Sovereign and Open AI) represents the first UK implementation of a full-stack, sovereign physical AI evaluation infrastructure. Its technical architecture rests on three integrated components.

The first is the UK AI Safety Institute's Inspect framework, adopted as the primary evaluation engine. This ensures compatibility with national evaluation standards and provides a principled, open-source foundation that can be audited independently. MEOK AI Labs's implementation extends Inspect with custom evaluation harnesses designed for embodied and agentic systems, maintaining alignment with AISI's methodological approach while extending its scope beyond language model evaluation.

The second component is the care membrane framework: a structured approach to evaluating whether an AI system maintains appropriate constraint boundaries under adversarial pressure. MEOK AI Labs currently operates 16 adversarial probes across 7 attack categories, including prompt injection, goal hijacking, constraint escalation, and physical boundary bypass attempts. These probes are designed to test whether a system that has been given operational constraints — do not leave a defined geographic area; do not interact with unauthorised personnel; do not execute actions outside a defined task scope — maintains those constraints when subjected to structured adversarial inputs. The framework is applicable to both language model deployments and embodied systems with natural language interfaces.

The third component is the sovereign infrastructure layer: a 9-node GPU cluster and 1,800 square foot laboratory facility, operated entirely on UK soil under UK data governance frameworks. Evaluation traffic does not transit third-party cloud infrastructure. Model weights under evaluation are loaded locally. Results are stored on air-gapped systems where required by client classification requirements.

### 4.2 Alignment with Existing Frameworks

The MEOK AI Labs model is designed for alignment with the UK's existing regulatory architecture rather than to compete with it. The AISI Inspect framework is adopted, not replaced. Evaluation outputs are structured to support the conformity assessment requirements anticipated under the UK AI Liability Framework consultation. The care membrane evaluation categories map to the high-risk AI system categories defined in the EU AI Act's Annex III, supporting UK organisations that require dual-regime compliance. The Bletchley Declaration's commitment to "appropriate evaluation" of frontier AI capabilities is operationalised, in the MEOK AI Labs model, as a minimum requirement for sovereign infrastructure hosting of evaluation processes.

---

## 5. Policy Recommendations

### 5.1 Require Sovereign Infrastructure for High-Risk AI Certifications

DSIT should introduce, as part of any forthcoming AI regulation framework, a requirement that conformity assessments for AI systems classified as high-risk — using either the EU AI Act Annex III categories or a UK-equivalent classification — must be conducted on infrastructure that is not under the operational control of the model provider under assessment. For systems with national security implications, a further requirement should specify UK-sovereign infrastructure. This mirrors the approach already taken in defence procurement for sensitive software assurance, and is consistent with the UK's existing data sovereignty frameworks under GDPR UK and the National Security and Investment Act.

### 5.2 Establish a Physical AI Evaluation Centre (PAEC) Programme

Dstl and DSIT should jointly establish a Physical AI Evaluation Centre programme: a network of accredited physical testbed facilities capable of evaluating embodied AI systems against standardised safety protocols. The PAEC programme should not require the construction of new government facilities from scratch. Instead, it should develop an accreditation framework that allows existing capable facilities — including private research institutes and university testbeds — to be accredited as PAEC-certified evaluators. This approach reduces capital costs, accelerates time-to-operational capability, and leverages existing infrastructure investment. MEOK LABS and MEOK AI Labs.org are prepared to support the development of PAEC accreditation criteria and to operate as an early pilot accredited facility.

### 5.3 Fund the Physical Evaluation Gap

The UK Government has committed significant funding to AI safety through the AISI and the AI Opportunities Action Plan. A proportion of this funding — we recommend a minimum of 15% of the AI Safety budget — should be ring-fenced for physical evaluation infrastructure. This includes facility accreditation grants for capable private operators, standardised evaluation protocol development, and the creation of a shared adversarial probe library (classified at an appropriate level) for use by accredited evaluators. ARIA, the Advanced Research and Invention Agency, is a natural funding vehicle for the higher-risk, longer-horizon elements of this programme.

### 5.4 Extend the AISI Inspect Framework

AISI should be resourced to extend the Inspect framework explicitly to embodied and agentic AI systems. The current framework is an excellent foundation for language model evaluation. A funded extension programme, developed in collaboration with accredited physical evaluation facilities, would position the UK as the global leader in embodied AI safety evaluation methodology — a leadership position that is currently unclaimed by any national government.

### 5.5 Align with International Partners

The Bletchley Declaration's network of AI Safety Institutes — now including the US, EU, Japan, Canada, and others — provides a natural forum for harmonising physical evaluation standards. The UK should lead the development of a joint protocol for physical AI evaluation that can be adopted across the network, establishing mutual recognition of PAEC-certified evaluation outcomes. This reduces duplicative evaluation costs for developers seeking multi-market deployment while maintaining the sovereignty and independence of each national evaluation process.

---

## 6. Conclusion

The United Kingdom's AI safety infrastructure is, in many respects, the most developed of any national government. The AISI, the Inspect framework, and the Bletchley process represent genuine policy achievements that have shaped the global conversation. The gap in that infrastructure is not at the level of frameworks or intent — it is at the level of physical capability. Evaluating embodied AI systems via cloud APIs is not a shortcut to safety assurance; it is an absence of it.

The technology and the operational experience to close this gap exist in the UK today, in facilities like MEOK LABS and in the expertise developed through the MEOK AI Labs evaluation programme. What is required is a policy framework that recognises physical evaluation as a first-class requirement, funds it accordingly, and establishes the accreditation architecture to scale it. The cost of not acting is not hypothetical: it is the routine procurement of AI systems into defence and critical national infrastructure whose safety properties have not been evaluated in conditions that resemble their operational environment. The UK can lead on this. The infrastructure to begin doing so is already operational.

---

*CSOAI LTD (trading as MEOK AI Labs) is a UK-registered AI research institute operating a physical laboratory and agricultural testbed in England. MEOK AI Labs.org is its AI safety certification programme, built on the UK AI Safety Institute's Inspect framework. For policy enquiries: policy@csoai.org*

*This document is released under Creative Commons Attribution 4.0. Citation: Templeman, N. (2026). Sovereign AI Safety Infrastructure: The Case for Physical Evaluation Facilities. CSOAI LTD (trading as MEOK AI Labs).*
