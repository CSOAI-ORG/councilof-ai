# 1. What Banks Require — The DORA Compliance Landscape

On 17 January 2025, the European Union's financial sector crossed a regulatory inflection point. Regulation (EU) 2022/2554 — the Digital Operational Resilience Act (DORA) — became fully applicable across all 27 Member States, transforming ICT risk from a technical sub-discipline into a board-level, systemic stability mandate enforceable by law [^851^][^852^][^855^]. Unlike a directive requiring national transposition, DORA is an EU Regulation: it applies with identical legal force in every Member State, creating a single operational resilience standard for more than 20,000 financial entities [^955^].

The scope is deliberately expansive. Article 2 captures 21 categories of financial entities — credit institutions, payment institutions, investment firms, crypto-asset service providers, central counterparties, insurance undertakings, asset managers, and the ICT third-party providers that serve them [^967^][^961^]. For banks, DORA demands a fundamental re-architecture of how institutions govern technology risk, report incidents, test their defences, manage vendor relationships, and share threat intelligence. The management body bears ultimate, non-delegable responsibility — a phrase that now appears in board packs across the continent with sobering regularity [^890^].

This chapter maps what DORA requires of banks in practice: the five pillars that define the compliance landscape, the 19 Critical ICT Third-Party Providers now under direct EU oversight, and the penalty regime that makes non-compliance a material financial and personal risk.

---

## 1.1 DORA Five Pillars

DORA organises its requirements into five interconnected pillars, each addressing a distinct dimension of digital operational resilience. Together, they form a closed loop: risk is identified and managed (Pillar 1); when incidents occur, they are classified, reported, and analysed (Pillar 2); defences are validated through structured testing (Pillar 3); the supply chain is governed contractually and operationally (Pillar 4); and intelligence is shared across the sector to raise collective resilience (Pillar 5) [^848^][^846^].

### 1.1.1 Pillar 1 — ICT Risk Management: Governance Framework, Risk Assessment, Asset Classification, Protection Measures, and Business Continuity

Pillar 1 (Articles 5–16) is the regulatory foundation. It requires financial entities to establish a comprehensive ICT risk management framework covering the full lifecycle: identification, protection and prevention, detection, response and recovery, learning and evolving, and communication [^848^][^895^].

The governance requirements under Article 5 are among the most consequential provisions in the regulation. The management body bears **ultimate, non-delegable responsibility** for ICT risk [^890^]. Article 5(2) enumerates eleven specific duties: defining and approving the ICT risk management framework; setting policies for data availability, authenticity, integrity, and confidentiality; approving the digital operational resilience strategy including risk tolerance levels; allocating budget for resilience needs; approving ICT third-party service policies; and ensuring board members maintain sufficient ICT risk knowledge through regular training [^890^]. ICT risk can no longer be delegated downward to the CIO or CISO and forgotten by the board.

The framework must be documented and reviewed at least annually (Article 6). An independent ICT risk control function is mandatory for all entities except micro-enterprises [^943^][^944^]. Under Article 8, institutions must maintain a complete inventory of all ICT assets and identify Critical or Important Functions (CIFs) — activities whose disruption would materially impair financial stability, customer protection, or the entity's safety. Articles 9–12 mandate protection strategies, continuous monitoring and anomaly detection, multi-layered security controls, and ICT business continuity policies with disaster recovery plans specifying Recovery Time Objectives (RTOs) and Recovery Point Objectives (RPOs). Article 13 requires post-incident root cause analysis; Article 14 mandates crisis communication procedures [^848^][^895^]. The proportionality principle in Article 4 permits smaller firms to use a simplified framework under Article 16, though even micro-enterprises must comply with core incident reporting and third-party risk obligations [^947^].

### 1.1.2 Pillar 2 — ICT-related Incident Management: Classification, Reporting to NCAs Within 4 Hours for Major Incidents, and Root Cause Analysis

Pillar 2 (Articles 17–23) establishes DORA's most operationally demanding requirement: a harmonised, multi-stage incident reporting framework with strict timelines [^875^][^878^][^879^].

An incident is classified as **major** based on seven criteria defined in RTS 2024/1772: clients affected, economic impact, duration, geographical spread, data losses, impact on CIFs, and transactions affected [^875^][^878^]. Classification must happen without undue delay and no later than 24 hours after detection.

The reporting timeline is unforgiving. The initial notification must reach the NCA **within 4 hours** of classification, containing entity identification, detection times, incident type, preliminary impact, systems affected, and initial response actions [^875^][^885^][^887^]. An intermediate report follows within 72 hours. The final report — with complete root cause analysis, total impact, lessons learned, and corrective actions — is due within one month [^875^][^880^]. Significant institutions must report regardless of weekends or holidays; others have until 12:00 pm the next working day if deadlines fall on non-working days [^875^][^887^]. Article 19(3) requires affected clients to be informed without undue delay. A major incident at a critical third-party provider affecting your CIFs must be reported even if learned about indirectly [^875^].

### 1.1.3 Pillar 3 — Digital Operational Resilience Testing: Threat-Led Penetration Testing Every 3 Years for Significant Entities

Pillar 3 (Articles 24–27) mandates regular risk-based testing, with advanced requirements for systemically important entities [^876^][^877^][^880^][^881^].

All entities must test at least annually, encompassing vulnerability assessments, network security assessments, scenario-based tests, and source code reviews [^848^][^895^]. The signature requirement is Threat-Led Penetration Testing (TLPT) under Article 26. Designated significant entities — including G-SIIs, O-SIIs, large payment institutions processing over EUR 150 billion annually, CCPs, and trading venues — must undergo TLPT at least every three years [^876^][^880^].

TLPT under DORA differs materially from voluntary TIBER-EU. External threat intelligence is always required. Internal testers are permitted with conditions — but if used for two consecutive TLPTs, the third must use an external Red Team. ECB-supervised credit institutions must always use external testers. Purple teaming is compulsory. The Red Team Lead requires minimum five years' experience; supporting members need two years each; and the team must have three prior threat intelligence assignments [^876^][^877^][^881^]. The February 2025 TIBER-EU update was explicitly aligned with DORA's RTS, making DORA TLPT the de facto European standard.

### 1.1.4 Pillar 4 — ICT Third-Party Risk Management: Register of Information, Contract Oversight, Exit Strategies, and Sub-Contracting Chains

Pillar 4 (Articles 28–44) is DORA's most structurally innovative provision, establishing direct EU oversight of critical ICT third-party providers for the first time [^893^][^850^].

At its operational heart lies the **Register of Information** (Article 28(3)), described as the single most data-intensive DORA deliverable [^878^]. Entities must maintain a comprehensive, machine-readable register of **all** ICT contractual arrangements in xBRL-CSV format, structured across nine relational tables with more than 60 mandatory data fields [^878^][^879^][^882^]. Submission is annual by 30 April, with ad hoc updates upon supervisory request. Scope encompasses entity information, contract references, provider details, service types and criticality, data processing locations, sub-outsourcing arrangements, and security audit information [^879^][^882^].

Article 30 mandates specific contractual clauses for critical/important functions: service descriptions with performance targets; data processing locations; availability targets with remedies; incident notification timelines; unrestricted audit rights; business continuity and TLPT requirements; exit strategies with transition periods; sub-outsourcing conditions; and data portability provisions [^954^][^956^][^957^][^965^]. Article 29 requires assessment of ICT concentration risk. Exit strategies must enable smooth transition, identify alternative providers, and be tested annually [^957^][^962^].

### 1.1.5 Pillar 5 — Information Sharing: Trusted Communities for Cyber Threat Intelligence Sharing

Pillar 5 (Article 45) encourages voluntary participation in structured cyber threat information sharing arrangements [^848^][^849^]. Shareable information includes indicators of compromise (IOCs), detection signatures, sector alerts, and defensive configurations. Arrangements must be governed by formal agreements clarifying handling, storage, and redistribution rules. The ESAs have indicated that participation will be considered a positive factor in supervisory assessments, creating practical pressure to engage even where the legal obligation is voluntary [^848^].

---

## 1.2 The 19 Designated Critical ICT Third-Party Providers (CTPPs)

### 1.2.1 Full CTPP List

On 18 November 2025, the European Supervisory Authorities published the first official list of 19 designated Critical ICT Third-Party Providers — technology vendors deemed so systemically important that they now fall under direct EU-level oversight [^856^][^877^][^882^][^883^][^884^]. Designation followed a three-step methodology: data collection from Registers of Information; criticality assessment across banking, insurance, and securities markets; and a formal right-to-be-heard process [^856^][^850^].

**Table 1: The 19 Designated Critical ICT Third-Party Providers (CTPPs) under DORA**

| # | Provider | Primary Service Category | Lead Overseer |
|---|----------|-------------------------|---------------|
| 1 | **Amazon Web Services (AWS)** EMEA Sarl | Cloud computing (IaaS/PaaS) | EBA |
| 2 | **Microsoft** Ireland Operations Limited | Cloud computing and software (IaaS/PaaS/SaaS) | EBA |
| 3 | **Google Cloud** EMEA Limited | Cloud computing (IaaS/PaaS) | EBA |
| 4 | **International Business Machines (IBM)** Corporation | IT infrastructure and services | EBA |
| 5 | **Oracle** Nederland B.V. | Cloud and database services | EBA |
| 6 | **SAP SE** | Enterprise software and cloud | EBA |
| 7 | **Accenture** plc | Managed IT services | EBA |
| 8 | **Capgemini** SE | IT consulting and managed services | EBA |
| 9 | **Kyndryl** Inc. | IT infrastructure services | EBA |
| 10 | **NTT DATA** Inc. | IT services | EBA |
| 11 | **Tata Consultancy Services (TCS)** Limited | IT services and consulting | EBA |
| 12 | **Fidelity National Information Services (FIS)** | Financial technology | EBA |
| 13 | **Bloomberg** L.P. | Financial data and analytics | EBA |
| 14 | **LSEG Data and Risk** Limited | Financial data and analytics | EBA |
| 15 | **Colt Technology Services** | Network and connectivity | EBA |
| 16 | **Deutsche Telekom** AG | Telecommunications | EBA |
| 17 | **Orange** SA | Telecommunications | EBA |
| 18 | **Equinix (EMEA)** B.V. | Data centres and colocation | EBA |
| 19 | **InterXion** HeadQuarters B.V. | Data centres and colocation | EBA |

[^856^][^882^][^883^][^884^]

The three hyperscale cloud providers — AWS, Microsoft Azure, and Google Cloud — collectively underpin the infrastructure of over 65% of EU financial institutions [^882^]. Bloomberg and LSEG Data and Risk supply pricing and reference data feeding directly into trading systems. IT services giants Accenture, Capgemini, Kyndryl, NTT DATA, and TCS manage core banking systems. Telecommunications providers Deutsche Telekom, Orange, and Colt carry financial transaction traffic. Equinix and InterXion operate the physical data centre footprint. All 19 CTPPs were assigned to the EBA as Lead Overseer; future waves may distribute CTPPs across ESMA and EIOPA [^883^].

### 1.2.2 What CTPP Designation Means: Direct Oversight by Lead Overseer, Mandatory Reporting, and Potential Penalties

Each designated CTPP must: designate an EU legal entity as ESA coordination point; pay annual oversight fees; cooperate with Joint Examination Teams (JETs); submit to information requests, investigations, and on-site inspections; and respond to binding recommendations from the Lead Overseer [^850^][^891^][^893^]. Non-EU CTPPs must establish EU presence within 12 months.

The ultimate sanction is commercially existential: if a CTPP persistently fails to comply, the Lead Overseer can recommend that NCAs require their supervised entities to **suspend or terminate** arrangements with the provider [^893^]. For a cloud provider serving hundreds of EU banks, this is a market exit order. Oversight activities commenced in 2026 with approximately 30 ESA supervisors. A voluntary opt-in framework for non-designated providers indicates the 19 CTPPs represent only the first wave [^883^].

---

## 1.3 Penalties & Enforcement

DORA's penalty architecture operates on two tracks: one for financial entities, administered by NCAs under national transposition; and one for CTPPs, written directly into the regulation and enforced by the Lead Overseer.

### 1.3.1 Financial Entities: Up to 2% of Total Annual Worldwide Turnover

For financial entities, DORA requires Member States to ensure NCAs can impose "effective, proportionate, and dissuasive" penalties under Article 50 [^847^][^859^]. Authoritative sources consistently cite a maximum of **up to 2% of total annual worldwide turnover** or EUR 10 million, whichever is higher [^1021^][^1022^][^1025^][^1026^]. This aligns with EBA supervisory convergence guidance across major jurisdictions.

### 1.3.2 Board Members: Up to EUR 5 Million Personal Liability

Article 50 empowers NCAs to impose administrative penalties on management body members [^1023^]. In Germany, BaFin can fine individual board members up to **EUR 5 million** for breaches of Articles 19(4) and 26(1) — incident reporting and TLPT obligations [^1023^]. In Italy, individuals face penalties up to EUR 5 million with possible bans from management functions. In Ireland, the ceiling is EUR 1 million [^1023^]. Beyond monetary penalties, board members face temporary prohibition from management functions across the entire EU financial sector — a career-ending consequence [^923^]. Article 52 opens the possibility of criminal liability in extreme cases [^1025^].

### 1.3.3 CTPPs: Up to 1% of Average Daily Turnover

CTPPs face a penalty regime written directly into DORA. The Lead Overseer may impose **periodic penalty payments of up to 1% of average daily worldwide turnover**, for up to six consecutive months [^847^][^850^][^891^]. For a cloud provider generating EUR 30 billion annually, this equates to approximately EUR 800,000 per day [^847^]. CTPPs also face fines up to EUR 5 million, and individual employees can be fined up to EUR 500,000 [^1021^].

**Table 2: DORA Penalty Framework Summary**

| Category | Maximum Penalty | Basis | Key Additional Measures |
|----------|----------------|-------|------------------------|
| **Financial entities** | Up to 2% of total annual worldwide turnover or EUR 10 million, whichever is higher | National transposition of Article 50 | Public censure; temporary prohibition of management functions; authorisation withdrawal; remediation orders [^1021^][^1022^][^1025^] |
| **Individual board members** | Up to EUR 5 million (Germany, Italy); up to EUR 1 million (Ireland) | Article 50(3) national implementation | Temporary ban from management functions across EU; potential criminal liability under Article 52 [^1023^][^1025^] |
| **CTPPs — periodic penalties** | Up to 1% of average daily worldwide turnover, for up to 6 months | DORA Articles 50–52 (directly applicable) | Recommendation to suspend/terminate contracts; public naming; mandatory corrective measures [^847^][^850^][^891^] |
| **CTPPs — fixed fines** | Up to EUR 5 million per entity; up to EUR 500,000 per individual | DORA Articles 50–52 | EU establishment requirement; oversight fees [^1021^] |

The 2% worldwide turnover ceiling places DORA in the same enforcement tier as GDPR. The EUR 5 million personal liability transforms ICT risk from a technical concern into personal financial exposure. The 1% daily turnover penalty for CTPPs — compounded over six months — creates a credible threat for even the largest providers.

NCAs retain discretion within maximum thresholds, considering violation duration, cooperation levels, and enforcement history [^923^]. In practice, 2025 was a "transition year" with supervisors focused on operational continuity evidence rather than punitive action [^853^][^854^]. But as the ESAs move to active enforcement in 2026, institutions that treated DORA as a paper-compliance exercise will find supervisory patience exhausted. DORA compliance is not a project with a completion date — it is a continuous operational discipline at the intersection of regulatory survival and competitive advantage.
