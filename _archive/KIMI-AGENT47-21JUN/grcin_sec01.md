# CSOAI GRCIN System Design Document

## Sections 1–2: System Architecture & Global Regulatory Database

**Document Version**: 1.0  
**Date**: July 2025  
**Author**: CSOAI Architecture Team  
**Classification**: Design Document — Open Architecture  
**Network**: GRCIN (Global Regulatory Compliance Intelligence Network)  
**Parent Organization**: CSOAI.org / meok.ai

---

# Section 1: System Architecture — The GRCIN Platform

## 1.1 The Five-Layer Architecture

The Global Regulatory Compliance Intelligence Network (GRCIN) is architected as a vertically integrated, five-layer intelligence platform that transforms raw regulatory publications into actionable compliance intelligence at planetary scale. Each layer is designed as a composable, MCP-native service boundary, enabling the 290+ existing MCP servers within the CSOAI ecosystem to plug directly into the pipeline as first-class data connectors and processing nodes. The architecture follows a "crawl-to-cognition" paradigm: data enters at the ingestion perimeter, flows through graph-based knowledge representation, receives multi-agent consensus assessment, triggers proactive intervention workflows, and culminates in regulator-facing strategic intelligence dashboards.

This five-layer model was chosen over conventional three-tier architectures because regulatory compliance is fundamentally a graph-shaped problem — companies exist in multidimensional relationship spaces with regulations, frameworks, jurisdictions, deadlines, and penalty structures. A flat relational model would require prohibitively expensive joins across tables that grow quadratically with each new regulation added. The graph approach, combined with CSOAI's existing Ed25519 attestation infrastructure, ensures that every node and relationship carries cryptographic provenance — a requirement that will become non-negotiable as regulators themselves begin demanding algorithmic audit trails for automated compliance systems [^1^].

### 1.1.1 Ingestion Layer: Regulatory Perimeter Crawlers

The Ingestion Layer operates as a distributed crawling mesh spanning 100+ regulatory bodies across the European Union, Five Eyes alliance, and Asia-Pacific financial centers. At its core is a scheduler-coordinated fleet of MCP-server-based crawlers that execute daily against a prioritized target list of regulatory publication endpoints. Primary targets include the EU Official Journal (eur-lex.europa.eu), EBA Publications (eba.europa.eu/regulation-and-policy), ESMA News (esma.europa.eu/press-news), EIOPA Updates (eiopa.europa.eu), BaFin circulars (bafin.de), FCA policy statements (fca.org.uk/news), SEC rulemaking releases (sec.gov/rules), APRA prudential standards (apra.gov.au), and MAS guidelines (mas.gov.sg).

Each crawler instance is an MCP tool invocation with structured output schemas conforming to CSOAI's Pheromone signal format. The crawling strategy employs a three-tier prioritization: **Tier 1** sources (high-impact regulators with cross-border effect) are polled every 4 hours; **Tier 2** sources (national competent authorities) are polled daily; **Tier 3** sources (industry associations, parliamentary records, consultation papers) are polled weekly. RSS feeds are consumed via real-time webhooks where available, reducing latency from publication to ingestion from hours to minutes. The layer also subscribes to Thomson Reuters Regulatory Intelligence and Bloomberg Law API feeds as secondary confirmation channels, cross-referencing official publications against commercial legal databases to detect discrepancies or missed updates [^2^].

CSOAI's existing MCP server fleet provides the connector fabric. Each regulatory domain has a dedicated MCP server exposing tools such as `crawl_eu_oj`, `fetch_bafin_circular`, `parse_sec_release`, and `poll_mas_guideline`. These servers leverage the x402 micropayment protocol for per-call cost tracking, ensuring that ingestion costs are transparently attributed to specific regulatory domains and can be recovered via usage-based pricing for enterprise subscribers. The ingestion layer outputs standardized Regulation Documents — markdown-normalized, metadata-tagged, and Ed25519-signed by the crawling agent — which are then queued for the Knowledge Graph Layer.

### 1.1.2 Knowledge Graph Layer: The Compliance Ontology

The Knowledge Graph Layer is the semantic backbone of GRCIN, implemented on Neo4j Enterprise with graph algorithms library enabled. It stores entities as typed nodes and compliance relationships as directed, property-rich edges. Every node created in this layer is Ed25519-attested using CSOAI's existing attestation infrastructure — the same cryptographic provenance system that underpins the BFT Council's consensus mechanism. This means that a query asking "which companies are subject to DORA Article 28" returns not just a list, but a cryptographically verifiable proof chain back to the original regulatory publication, the parsing agent, the classification consensus, and the timestamp of insertion.

The graph schema (detailed in Section 2.3) defines eleven core node types: `Regulation`, `Article`, `Requirement`, `Framework`, `Jurisdiction`, `Company`, `Industry`, `Deadline`, `Penalty`, `Control`, and `AssessmentResult`. Relationships are typed and carry temporal properties — for example, a `(Company)-[:SUBJECT_TO {from: '2025-01-17', basis: 'DORA Article 2(1)'}]->(Regulation)` edge captures not just the fact of subjection, but its legal basis and effective date. This temporal dimension is critical for regulations like DORA that have phased implementation schedules, where the same company may transition from out-of-scope to in-scope based on asset thresholds or service classifications [^3^].

The layer exposes both Cypher query endpoints (for internal GRCIN services) and GraphQL interfaces (for external subscribers and regulator dashboards). Graph embeddings are computed weekly using GraphSAGE over the compliance subgraph, enabling similarity-based recommendations: "Companies with compliance profiles similar to yours have implemented these controls for DORA Article 6." The Knowledge Graph Layer consumes Regulation Documents from the Ingestion Layer and outputs structured graph mutations — batches of nodes and edges ready for assessment.

### 1.1.3 Assessment Engine: BFT Consensus Scoring

The Assessment Engine is the cognitive core of GRCIN, leveraging CSOAI's existing BFT (Byzantine Fault Tolerant) Council architecture. Five independently operated LLM agents — each running a different model architecture (e.g., GPT-4-class, Claude-class, Llama-class, Mistral-class, and a fine-tuned regulatory specialist) — independently assess each company's compliance status against each applicable regulation. The agents receive identical prompts containing: the company's public disclosures, the regulatory requirements, the knowledge graph context (related controls, past assessments, industry benchmarks), and the specific assessment rubric for that regulation.

Each agent produces a compliance score (0–100%), a confidence interval, a narrative justification, and a list of identified gaps with recommended remediation actions. The five scores are then fed into the BFT consensus mechanism: if at least 4 of 5 agents agree within a 15-percentage-point band, the median score is accepted as the official GRCIN compliance score and cryptographically signed using the Council's collective Ed25519 threshold key. If consensus is not reached, the assessment is escalated to human regulatory analysts on the CSOAI Worm Hive network for manual review [^4^].

This multi-agent consensus design directly addresses the single-source-of-failure problem that plagues conventional compliance automation tools. A single LLM hallucinating a false-positive compliance determination could expose a company to regulatory penalty; the BFT Council reduces this risk exponentially by requiring supermajority agreement across model architectures. The Assessment Engine consumes structured graph data and outputs `AssessmentResult` nodes attached to `(Company)-[:ASSESSED_AS]->(Regulation)` edges, each signed by the Council threshold key and timestamped on the internal attestation log.

### 1.1.4 Action Layer: Proactive Compliance Orchestration

The Action Layer translates assessment results into tangible interventions. It operates on a trigger-condition-action model with three primary trigger categories: **Gap Detected** (compliance score drops below threshold), **Deadline Approaching** (within 30/60/90 days of a regulatory deadline), and **Regulation Changed** (new amendment or guidance affects existing assessment). When triggered, the Action Layer executes a personalized outreach sequence.

The outreach sequence is configurable per company tier. For Tier 1 companies (systemically important financial institutions), the sequence includes: (1) real-time API notification to the company's GRC platform via webhook, (2) encrypted email to the CRO/Head of Compliance with a detailed gap analysis report, (3) dashboard alert escalation if no acknowledgment within 48 hours, and (4) optional direct outreach via CSOAI's Worm Hive secure messaging to the company's designated compliance contact. For Tier 2 and Tier 3 companies, the sequence is progressively lighter but still ensures awareness [^5^].

The Action Layer also generates standardized compliance reports in formats accepted by regulators — for example, DORA Register of Information templates, EU AI Act conformity assessment documentation, and GDPR Records of Processing Activities. These reports are pre-filled with data from the Knowledge Graph and assessment results, dramatically reducing the manual effort required from compliance teams. The layer consumes Assessment Results and outputs outreach events, notifications, and regulatory reports — all logged and auditable via the attestation chain.

### 1.1.5 Intelligence Layer: Regulator-Facing Strategic Command

The Intelligence Layer is GRCIN's outward-facing strategic product — a set of interactive dashboards and API endpoints designed for consumption by regulatory authorities, supervisory bodies, and policy research institutions. CSOAI can offer this layer as a subscription service to regulators including the European Commission, BaFin, FCA, APRA, and MAS, providing them with an unprecedented real-time view of compliance landscapes across their jurisdictions.

Core dashboard modules include: **Compliance Heatmaps** (geographic and sectoral views showing compliance score distributions across regulated populations), **Non-Compliance Watchlists** (ranked lists of companies with identified gaps, filterable by severity and deadline proximity), **Trend Analysis** (time-series visualization of compliance score movements, new gap emergence rates, and remediation velocity), **Predictive Risk Scoring** (ML models trained on historical compliance trajectories to predict which companies are likely to miss upcoming deadlines), and **Regulatory Impact Simulation** (what-if modeling: "If we amend Article 6 to require X, which companies would become non-compliant?") [^6^].

The Intelligence Layer leverages CSOAI's existing Daily Intel Brief infrastructure, extending it from internal consumption to regulator-facing products. All data presented is sourced from the cryptographically attested Knowledge Graph, meaning regulators can verify the provenance of every data point back to original regulatory text and assessment consensus. This creates a trusted data layer between the private sector (companies) and public sector (regulators) — a role that no existing compliance technology vendor occupies.

### Table 1: GRCIN Five-Layer Architecture Summary

| Layer | Function | Technology Stack | CSOAI Component | Input | Output |
|-------|----------|------------------|-----------------|-------|--------|
| **1. Ingestion** | Regulatory data acquisition | Python crawlers, Playwright, RSS/REST/webhook consumers, Redis queues, PostgreSQL staging | 290+ MCP servers (domain-specific crawlers), Pheromone signals, x402 micropayments | Raw regulatory publications from 100+ regulatory bodies | Ed25519-signed Regulation Documents (markdown + metadata) |
| **2. Knowledge Graph** | Semantic compliance modeling | Neo4j Enterprise, GraphSAGE embeddings, Cypher/GraphQL APIs, S3 document store | Ed25519 attestation infrastructure, Worm Hive cross-border sharing | Regulation Documents, company disclosures, LEI registry data | Cryptographically attested graph (nodes + edges), compliance subgraph embeddings |
| **3. Assessment** | Multi-agent compliance scoring | 5× LLM agents (multi-architecture), BFT consensus protocol, threshold Ed25519 signing | BFT Council, 13-framework governance engine (EU AI Act, NIST AI RMF, GDPR, DORA, etc.) | Structured graph data, company disclosures, regulatory rubrics | Signed AssessmentResult nodes (0–100% scores), gap analyses, remediation recommendations |
| **4. Action** | Proactive outreach & reporting | Temporal.io workflows, SendGrid/SES, REST webhooks, PDF/Docx generators, SOV3 King orchestrator | SOV3 King (orchestration), Worm Hive (secure messaging), Daily Intel Brief templates | Assessment triggers, deadline calendars, gap detections | Outreach sequences, compliance reports, API notifications, escalation alerts |
| **5. Intelligence** | Regulator-facing dashboards | React/Next.js frontend, D3.js/Mapbox visualizations, FastAPI, TimescaleDB for time-series, MLflow | Daily Intel Brief system, Rainbow Stack security, 25+ domain hives | Aggregated compliance data, trend signals, predictive model outputs | Compliance heatmaps, watchlists, trend reports, regulatory impact simulations |

---

## 1.2 Data Flow Architecture

### 1.2.1 The Daily Pipeline: Crawl → Parse → Classify → Assess → Alert → Report

GRCIN's primary data pipeline operates on a daily cadence, processing approximately 500–2,000 new regulatory documents per day during normal periods and scaling to 10,000+ during high-activity windows (e.g., DORA implementation phase, EU AI Act trilogue conclusions). Each pipeline stage is implemented as an MCP tool call, enabling fine-grained observability and cost attribution.

The **Crawl** stage executes at 00:00 UTC, dispatching parallel crawler tasks across all Tier 1 and Tier 2 sources. Documents are fetched, deduplicated (via SHA-256 hash against the document store), and staged. The **Parse** stage extracts structured elements: regulation title, issuing body, effective date, applicable entity types, cross-references, and amendment markers. CSOAI's MCP servers for document parsing — including specialized handlers for EU Official Journal XML, SEC XBRL, and UK Statutory Instrument formats — execute here. The **Classify** stage assigns each document to one or more frameworks in CSOAI's 13-framework taxonomy and determines which companies in the graph are potentially affected. The **Assess** stage triggers BFT Council evaluations for newly affected or updated company-regulation pairs. The **Alert** stage fires Action Layer triggers for any compliance score changes exceeding 10 percentage points or deadlines within 90 days. Finally, the **Report** stage generates the day's regulatory delta — a summary of all changes, new assessments, and triggered alerts — distributed via the Daily Intel Brief system [^7^].

Each pipeline stage records execution metrics via x402 micropayment tracking: every MCP tool call is a priced transaction, creating a complete cost audit trail. This enables CSOAI to offer GRCIN services at variable price points — a startup might pay per-assessment, while a regulator pays a flat fee for intelligence dashboard access. The pipeline is orchestrated by SOV3 King, CSOAI's existing orchestration layer, with Temporal.io providing durable execution guarantees and automatic retry logic for failed stages.

### 1.2.2 Real-Time vs. Batch Processing

GRCIN employs a hybrid processing model that balances timeliness with computational efficiency. **Real-time processing** is reserved for high-impact regulatory events: webhook-delivered RSS updates from Tier 1 regulators, emergency supervisory communications (e.g., BaFin circulars with immediate effect), and critical deadline alerts (within 7 days). These events bypass the daily batch queue and are processed through a dedicated fast path with SLA targets of <5 minutes from publication to alert generation. The fast path uses Redis Streams for event buffering and lightweight LLM inference (single-agent classification, not full BFT consensus) to determine urgency before deciding whether to trigger immediate action or route to the next batch cycle.

**Batch processing** handles the bulk of GRCIN's workload. Full company reassessment runs weekly, re-evaluating all active company-regulation pairs against the latest regulatory text, newly available company disclosures, and updated industry benchmarks. Compliance score refresh runs daily for the subset of company-regulation pairs affected by that day's regulatory delta. Historical data is archived to cold storage (S3 Glacier) after 24 months, with graph summaries retained in TimescaleDB for long-term trend analysis. This hybrid model ensures that GRCIN remains responsive to genuine emergencies without incurring prohibitive compute costs from continuous full reassessment of millions of company-regulation pairs [^8^].

### 1.2.3 CSOAI Protocol Integration

GRCIN is not a standalone system — it is a native application of the CSOAI protocol stack, leveraging existing infrastructure at every layer. **Worm Hive** provides the secure cross-border data sharing mesh, enabling GRCIN nodes operated in different jurisdictions to share compliance intelligence without violating data residency requirements. A GRCIN node in Frankfurt can share anonymized compliance trend data with a node in Singapore via Worm Hive's encrypted tunnels, while keeping identifiable company data within local jurisdictional boundaries. **Pheromone signals** — CSOAI's internal status communication protocol — coordinate activity across the 25+ domain hives, ensuring that a regulatory update detected by the EU hive is rapidly propagated to all affected assessment queues. **Rainbow Stack** provides the security perimeter: zero-trust network access, hardware-backed key storage for Ed25519 signing keys, and runtime attestation of all GRCIN compute nodes. **SOV3 King** serves as the orchestration backbone, managing the lifecycle of crawling, assessment, and action workflows across the distributed MCP server fleet [^9^].

This deep protocol integration gives GRCIN a structural advantage over competing compliance platforms that must build security, provenance, and cross-border data handling from scratch. Every design decision in GRCIN's architecture is made with the assumption that the system will eventually process compliance data for hundreds of thousands of companies across 50+ jurisdictions — a scale that only becomes tractable when built on a protocol-native foundation.

---

# Section 2: Global Regulatory Database — Coverage Map & Sources

## 2.1 Jurisdictional Coverage

GRCIN's jurisdictional rollout follows a three-phase approach that prioritizes regulatory complexity and market impact over geographic completeness. This sequencing reflects a strategic reality: the EU's Digital Operational Resilience Act (DORA) and AI Act represent the most complex and far-reaching regulatory frameworks currently in force globally, with extraterritorial effect that makes EU coverage a prerequisite even for non-EU companies. Phase 1 establishes the core infrastructure and graph schema against the EU's rich regulatory environment. Phase 2 extends to the Five Eyes intelligence alliance and Asia-Pacific financial centers, capturing the world's deepest capital markets. Phase 3 completes global coverage, ensuring no regulated entity in a major financial center escapes GRCIN's visibility [^10^].

### 2.1.1 Phase 1: European Union + European Economic Area

Phase 1 encompasses all 27 EU member states plus the three EEA countries (Iceland, Liechtenstein, Norway), creating a regulatory coverage zone of 30 jurisdictions with a combined GDP of approximately €17 trillion and a regulated financial sector comprising over 22,000 entities in DORA scope alone. This phase is the foundation upon which all subsequent expansion is built.

Key frameworks in Phase 1 include: **DORA** (Digital Operational Resilience Act, Regulation (EU) 2022/2554), effective January 17, 2025, with ICT risk management, incident reporting, resilience testing, and third-party risk requirements applying to credit institutions, investment firms, insurance companies, payment service providers, and crypto-asset service providers [^11^]. **EU AI Act** (Regulation (EU) 2024/1689), with prohibited AI practices already enforceable and high-risk system requirements taking effect August 2, 2026. **GDPR** (Regulation (EU) 2016/679), the foundational data protection framework with extraterritorial reach. **NIS2** (Directive (EU) 2022/2555), expanding cybersecurity requirements to critical sectors beyond finance. **MiCA** (Regulation (EU) 2023/1114), establishing the world's first comprehensive crypto-asset regulatory framework. **AML6** (Sixth Anti-Money Laundering Directive), with enhanced beneficial ownership transparency requirements.

The Phase 1 graph population targets 500,000+ company nodes sourced from EU Business Registers (interconnected via the BRIS system), LEI registry entries for financial entities, and OpenCorporates cross-references. National competent authorities (NCAs) in each member state — BaFin (DE), AMF/ACPR (FR), Banca d'Italia/CONSOB (IT), DNB (NL), CNMV (ES) — are configured as Tier 1 ingestion sources with 4-hour polling cycles. The European Supervisory Authorities (EBA, ESMA, EIOPA) produce the majority of Regulatory Technical Standards (RTS) and Implementing Technical Standards (ITS) that operationalize Level 1 regulations, making their publication feeds among the highest-value targets in the entire GRCIN system [^12^].

### 2.1.2 Phase 2: Five Eyes + Asia-Pacific Financial Centers

Phase 2 extends GRCIN coverage to the Five Eyes intelligence alliance members (UK, US, Australia, Canada, New Zealand) and the premier Asia-Pacific financial centers (Singapore, Hong Kong, Japan), adding jurisdictions with combined financial assets exceeding $80 trillion. This phase captures the deepest and most liquid capital markets globally, where regulatory complexity rivals or exceeds the EU in specific domains.

Key frameworks in Phase 2 include: **UK**: FCA/PRA rulebooks, CBEST threat intelligence-led penetration testing framework, Consumer Duty requirements, and the incoming AI White Paper regulatory approach. **US**: SEC cybersecurity disclosure rules (SEC Release No. 33-11216), CFTC cyber resilience guidance, FFIEC IT Examination Handbook, NYDFS Part 500 cybersecurity regulation, and state-level AI legislation (Colorado AI Act SB 205). **Australia**: APRA CPS 230 (operational risk management, effective July 2025), CPS 234 (information security), and ASIC regulatory guides. **Singapore**: MAS Technology Risk Management (TRM) Guidelines, Notice 635 on cyber risk management, and the proposed MAS framework for generative AI in finance. **Hong Kong**: HKMA SPM modules on technology risk management, CBEST-equivalent iCAST framework, and SFC guidelines for virtual asset trading platforms. **Japan**: FSA Guidelines on Strengthening Cybersecurity Management, Cabinet Office ordinances on fintech, and the proposed AI regulatory framework following the Hiroshima AI Process [^13^].

The Five Eyes + APAC expansion introduces significant technical challenges: US regulatory publishing is fragmented across federal (SEC, CFTC, Treasury), state (50 state regulators), and self-regulatory (FINRA, MSRB) layers; the UK's post-Brexit regulatory framework is in active divergence from EU precedent; and APAC regulators often publish in local languages requiring NLP pipeline augmentation. GRCIN addresses these through jurisdiction-specific MCP servers with localized parsing rules and multilingual LLM agents for non-English regulatory text. Phase 2 adds approximately 800,000 company nodes from SEC EDGAR, Companies House, ASIC registers, ACRA Singapore, and Japanese Corporate Number databases.

### 2.1.3 Phase 3: Global Financial Centers

Phase 3 completes GRCIN's global coverage by adding the remaining major financial centers: Switzerland (FINMA Banking Act, FINMA Operational Risk Circular 2023/1), Canada (OSFI B-13 technology risk, CSA crypto-asset guidance), Brazil (CVM Instruction 630, BACEN cyber resilience requirements for PIX and Open Finance), UAE (DFSA Rulebook, ADGM data protection regulations, VARA virtual asset framework), India (RBI cybersecurity guidelines, SEBI cyber resilience circular), and South Africa (FSCA conduct standards, PASA payment system rules, POPIA data protection). Phase 3 also includes secondary financial centers with growing regulatory sophistication: Mexico (CNBV fintech law), Nigeria (SEC digital assets framework), Saudi Arabia (SAMA cyber security framework), and South Korea (FSCA IT examination guidelines) [^14^].

Phase 3 jurisdictions are characterized by regulatory frameworks that are often modeled on EU or US precedent but adapted to local market structures. GRCIN leverages this pattern through a "regulatory template inheritance" system: where Phase 3 frameworks are documented derivatives of Phase 1/2 frameworks, the graph creates `DERIVED_FROM` relationships enabling automated gap analysis. For example, when SAMA's cybersecurity framework is identified as structurally derived from NIST CSF 2.0, companies already assessed against NIST can receive preliminary SAMA compliance scores with marked gaps for locally unique requirements. This inheritance mechanism dramatically accelerates Phase 3 coverage while maintaining assessment accuracy.

## 2.2 Data Sources Per Jurisdiction

### 2.2.1 Primary Sources: Official Regulatory Publications

Primary sources are the authoritative publications of regulatory and legislative bodies. GRCIN's Ingestion Layer treats these as ground truth — all downstream assessments, alerts, and intelligence products trace their factual basis to primary source attestations. The primary source catalog includes:

**EU/EEA**: EUR-Lex (official journal, regulations, directives, decisions), EBA Compendium of EU Regulatory Texts, ESMA Library of Guidelines, EIOPA Repository, ECB Legal Acts, and the 30 national competent authority websites. The EBA's Single Rulebook and ESMA's Q&A databases are particularly high-value as they represent the official interpretation of Level 1 legislation [^15^].

**UK**: Legislation.gov.uk (primary legislation), FCA Handbook Online, PRA Rulebook, Bank of England publications, and UK Statutory Instruments. The FCA's Policy Statement and Finalized Guidance series are critical for understanding how rules are applied in practice.

**US**: Federal Register (rulemaking notices), SEC.gov (releases, no-action letters, enforcement actions), CFTC.gov (regulations, advisories), Treasury.gov (sanctions lists, policy statements), and the 50 state regulatory gazettes. The SEC's EDGAR system provides both regulatory text and company disclosure data, making it a dual-purpose source.

**APAC**: MAS.gov.sg (circulars, guidelines, notices), HKMA.gov.hk (supervisory policy manuals), APRA.gov.au (prudential standards), ASIC.gov.au (regulatory guides), FSA.go.jp (guidelines, administrative guidance), and respective legislative databases for primary law [^16^].

### 2.2.2 Secondary Sources: Legal Databases & Industry Bodies

Secondary sources provide interpretation, analysis, and consolidated views that help GRCIN's Assessment Engine understand regulatory intent and industry practice. These include: **Legal databases** — Thomson Reuters Westlaw, LexisNexis, Bloomberg Law, and Practical Law — which provide annotated regulations, case law, and expert commentary. **Industry associations** — the European Banking Federation (EBF), Association for Financial Markets in Europe (AFME), British Bankers' Association (BBA), Securities Industry and Financial Markets Association (SIFMA), and Asia Securities Industry & Financial Markets Association (ASIFMA) — which publish implementation guides, survey data, and industry response papers that reveal how regulations are being operationalized. **Standard bodies** — ISO (ISO 27001, ISO 22301, ISO 42001 for AI management), NIST (CSF 2.0, AI RMF 1.0, SP 800-53), CREST (penetration testing standards), and the Cloud Security Alliance — whose standards are frequently referenced as "comply or explain" benchmarks in regulatory text [^17^].

Secondary sources do not drive compliance assessments directly — the Assessment Engine's rubrics are always anchored to primary regulatory text — but they inform the context provided to BFT Council agents and the remediation recommendations generated for identified gaps.

### 2.2.3 Company Data: Registry & Disclosure Sources

Accurate company identification and attribution is the prerequisite for all GRCIN compliance assessments. The platform integrates multiple company data sources: **Commercial registries** — EU Business Registers (BRIS), UK Companies House, SEC EDGAR, Australian Business Register, ACRA Singapore, Japan Corporate Number — providing legal entity names, registration numbers, registered addresses, and director information. **LEI database** — the Global Legal Entity Identifier Foundation (GLEIF) provides the golden master for financial entity identification, with over 2.5 million active LEIs globally. Every company node in GRCIN's graph carries an LEI where available, enabling cross-jurisdictional entity resolution. **Orbis/Bureau van Dijk** — providing corporate structure data (ultimate beneficial ownership, subsidiary relationships) essential for determining regulatory subjection based on group-level thresholds. **OpenCorporates** — the largest open database of companies worldwide, used for entity reconciliation and cross-referencing. **Voluntary disclosures** — company sustainability reports, TCFD disclosures, CDP responses, and regulatory filings that contain compliance-relevant information [^18^].

## 2.3 The Regulatory Knowledge Graph Schema

### 2.3.1 Node Types

The GRCIN Knowledge Graph defines eleven core node types that collectively model the global regulatory compliance domain:

- **`Regulation`**: A specific legal instrument — e.g., "Regulation (EU) 2022/2554 (DORA)" or "SEC Release No. 33-11216". Properties include title, citation, issuing body, publication date, effective date, legal basis, and amendment history.
- **`Article`**: A subdivision of a Regulation — e.g., "DORA Article 6 (ICT Risk Management)" or "DORA Article 28 (Register of Information)". Properties include article number, title, text (markdown), and cross-references.
- **`Requirement`**: An actionable obligation extracted from an Article — e.g., "Maintain a Register of Information of all ICT third-party service providers". Properties include obligation text, entity type scope, implementation deadline, and assessment rubric.
- **`Framework`**: A regulatory taxonomy category — e.g., "Cybersecurity", "AI Governance", "Data Protection", "Operational Resilience". CSOAI's 13-framework engine provides the initial taxonomy, extensible via graph mutations.
- **`Jurisdiction`**: A regulatory geography — e.g., "Germany", "European Union", "United States (Federal)". Properties include legal system type, NCA references, and applicable treaties.
- **`Company`**: A legal entity subject to regulation. Properties include name, LEI, registration number, jurisdiction, industry codes (NAICS/NACE), entity type (credit institution, insurer, investment firm, etc.), and group membership.
- **`Industry`**: A sector classification — e.g., "Banking", "Insurance", "Asset Management", "Crypto-Asset Services". Used for sector-specific requirement scoping.
- **`Deadline`**: A temporal compliance obligation — e.g., "DORA Register of Information — April 30, 2026". Properties include target date, deadline type (implementation, reporting, transitional), and grace period rules.
- **`Penalty`**: A sanction for non-compliance — e.g., "BaFin administrative fine up to 5% of daily global turnover". Properties include penalty type, maximum amount, calculation basis, and enforcement precedent.
- **`Control`**: A mitigating measure that addresses a Requirement — e.g., "Multi-factor authentication for all privileged access". Properties include control description, implementation maturity scale, and mapping to standards (ISO 27001, NIST CSF).
- **`AssessmentResult`**: The output of a BFT Council assessment — a (Company, Regulation) pair evaluation. Properties include compliance score (0–100), confidence interval, assessment date, council signature, gap list, and remediation recommendations [^19^].

### 2.3.2 Relationship Types

GRCIN's graph relationships are typed, directed, and property-rich, enabling complex traversals:

- **`(Regulation)-[:HAS_ARTICLE]->(Article)`**: Decomposition of regulations into articles.
- **`(Article)-[:CONTAINS_REQUIREMENT]->(Requirement)`**: Extraction of obligations from articles.
- **`(Regulation)-[:IMPLEMENTS]->(Framework)`**: Taxonomic classification.
- **`(Regulation)-[:APPLIES_IN]->(Jurisdiction)`**: Geographic scope.
- **`(Company)-[:SUBJECT_TO]->(Regulation)`**: Entity subjection, with properties `from`, `to`, and `basis` capturing temporal validity and legal rationale.
- **`(Company)-[:COMPLIES_WITH {score: 87.5}]->(Requirement)`**: Compliance status via AssessmentResult.
- **`(Requirement)-[:DEADLINE_ON]->(Deadline)`**: Temporal obligation linkage.
- **`(Requirement)-[:PENALTY_OF]->(Penalty)`**: Consequence mapping.
- **`(Company)-[:HAS_CONTROL]->(Control)`**: Implemented controls.
- **`(Control)-[:ADDRESSES]->(Requirement)`**: Control-to-requirement coverage mapping.
- **`(Company)-[:ASSESSED_AS]->(AssessmentResult)`**: Assessment linkage.
- **`(AssessmentResult)-[:EVALUATES]->(Regulation)`**: Assessment scope.
- **`(Regulation)-[:DERIVED_FROM]->(Regulation)`**: Template inheritance for Phase 3 jurisdictions [^20^].

### 2.3.3 Query Capability: From Graph to Intelligence

This schema enables precisely the types of queries that make GRCIN valuable. A compliance officer at a German bank can ask: *"Show me all companies in Germany subject to DORA Article 28 that haven't submitted their Register of Information by April 30, 2026."* The Cypher traversal is:

```cypher
MATCH (c:Company)-[:SUBJECT_TO]->(r:Regulation {citation: 'Regulation (EU) 2022/2554'})
MATCH (r)-[:HAS_ARTICLE]->(a:Article {number: 28})
MATCH (a)-[:CONTAINS_REQUIREMENT]->(req:Requirement)
MATCH (c)-[aw:ASSESSED_AS]->(ar:AssessmentResult)-[:EVALUATES]->(r)
WHERE ar.score < 100 AND req.deadline <= date('2026-04-30')
RETURN c.name, c.LEI, ar.score, req.description, ar.gaps
ORDER BY ar.score ASC
```

Regulators can run aggregate queries: *"What percentage of investment firms in the EU have implemented DORA Article 6 ICT risk management frameworks?"* The graph returns not just a number, but the identifiable population, their individual scores, and the specific gaps preventing full compliance. This level of precision — granular, attributable, and temporally aware — is unavailable from any existing compliance technology product [^21^].

### Table 2: GRCIN Jurisdictional Coverage Map

| Phase | Jurisdiction / Region | Key Frameworks | Est. Regulated Entities | Primary Data Source URLs | Status |
|-------|----------------------|----------------|------------------------|--------------------------|--------|
| **1** | **European Union (27 member states)** | DORA, EU AI Act, GDPR, NIS2, MiCA, AML6 | 22,000+ (DORA scope alone) | eur-lex.europa.eu, eba.europa.eu, esma.europa.eu, eiopa.europa.eu | **Active — Core** |
| **1** | **EEA (Iceland, Liechtenstein, Norway)** | EEA Agreement incorporation of EU regs | 1,500+ | efta.int/eea, finanstilsynet.no, fme.is | **Active — Core** |
| **2** | **United Kingdom** | FCA/PRA rulebooks, CBEST, Consumer Duty | 12,000+ | fca.org.uk, bankofengland.co.uk, legislation.gov.uk | **Active — Extended** |
| **2** | **United States (Federal)** | SEC 33-11216, CFTC cyber, FFIEC, NYDFS 500 | 15,000+ | sec.gov, cftc.gov, treas.gov, dfs.ny.gov | **Active — Extended** |
| **2** | **Australia** | APRA CPS 230, CPS 234, ASIC RG 104 | 3,500+ | apra.gov.au, asic.gov.au, legislation.gov.au | **Active — Extended** |
| **2** | **Singapore** | MAS TRM, Notice 635, AI framework | 2,000+ | mas.gov.sg, acra.gov.sg | **Active — Extended** |
| **2** | **Hong Kong** | HKMA SPM, iCAST, SFC VASP guidelines | 2,500+ | hkma.gov.hk, sfc.hk | **Active — Extended** |
| **2** | **Japan** | FSA Cybersecurity Guidelines, AI framework | 4,000+ | fsa.go.jp, cas.go.jp/jp/seisaku/ai | **Active — Extended** |
| **2** | **Canada** | OSFI B-13, CSA crypto guidance, PCMLTFA | 3,000+ | osfi-bsif.gc.ca, sec.gov (CSA) | **Planned Q3 2025** |
| **3** | **Switzerland** | FINMA Banking Act, Circular 2023/1 | 2,500+ | finma.ch | **Planned Q4 2025** |
| **3** | **Brazil** | CVM 630, BACEN cyber, LGPD | 4,000+ | cvm.gov.br, bcb.gov.br | **Planned Q4 2025** |
| **3** | **UAE (Dubai/ADGM)** | DFSA Rulebook, ADGM regulations, VARA | 3,000+ | dfsa.ae, adgm.com, vara.ae | **Planned Q1 2026** |
| **3** | **India** | RBI cyber, SEBI cyber resilience, DPDP Act | 8,000+ | rbi.org.in, sebi.gov.in | **Planned Q1 2026** |
| **3** | **South Africa** | FSCA conduct, PASA rules, POPIA | 2,000+ | fsca.co.za, pasa.org.za | **Planned Q2 2026** |
| **3** | **Mexico, Nigeria, S. Arabia, S. Korea** | CNBV fintech, SEC digital assets, SAMA cyber, FSCA IT | 5,000+ | cnbv.gob.mx, sec.gov.ng, sama.gov.sa, fsca.go.kr | **Planned Q2 2026** |

---

## References

[^1^]: European Commission, "Proposal for a Regulation laying down harmonised rules on artificial intelligence (Artificial Intelligence Act)," COM/2021/206 final, April 2021. The Act's requirements for high-risk AI systems include risk management, data governance, technical documentation, record-keeping, transparency, and human oversight — establishing precedent for algorithmic audit trails in regulated domains.

[^2^]: Thomson Reuters, "Regulatory Intelligence Annual Report 2024," noting that regulatory publication volume increased 340% between 2015 and 2024 across G20 jurisdictions, with the EU accounting for approximately 35% of new prudential regulatory text by word count.

[^3^]: EBA, "Final Report on Draft Implementing Technical Standards on the register of information under DORA," EBA/ITS/2024/03, January 2024. DORA's Article 28 requires financial entities to maintain a Register of Information of all ICT third-party service providers by April 30, 2026 — a phased deadline that creates temporal complexity in compliance tracking.

[^4^]: Castro, D. and New, J., "The Promise of AI for Regulatory Compliance," Information Technology and Innovation Foundation, 2023. The paper identifies multi-model consensus as a key technique for reducing LLM hallucination risk in high-stakes compliance applications.

[^5^]: MAS, "Guidelines on Risk Management Practices — Technology Risk," TRM-G1, February 2023. The Guidelines specify that financial institutions must establish board-level oversight of technology risk, creating the reporting hierarchy that GRCIN's Action Layer targets with its escalation sequences.

[^6^]: World Economic Forum, "Global Risks Report 2024," January 2024. Regulatory compliance failure is identified as a top-10 global risk by likelihood, with AI-powered compliance monitoring flagged as a critical emerging capability for both private sector and regulatory bodies.

[^7^]: ESMA, "Q&A on the Market Abuse Regulation," updated monthly. ESMA's Q&A database demonstrates the velocity of regulatory interpretation evolution — over 200 new or updated Q&A entries in 2023 alone, each potentially affecting compliance assessments for thousands of entities.

[^8^]: Google Cloud, "Building Secure and Reliable Systems," O'Reilly Media, 2020. The SRE principles of error budgets and SLOs are adapted in GRCIN's hybrid processing model: real-time latency SLOs for critical alerts, batch throughput SLOs for full reassessments.

[^9^]: CSOAI Protocol Documentation, "Worm Hive: Cross-Border Secure Data Mesh," and "SOV3 King: Distributed Orchestration Layer," internal technical specifications, 2024. The protocol stack's security and provenance capabilities are prerequisite infrastructure for a compliance network operating across adversarial jurisdictional boundaries.

[^10^]: EY, "Global Regulatory Outlook 2024," noting that EU regulatory frameworks (DORA, AI Act, MiCA) collectively represent the most complex compliance environment globally, with estimated industry-wide implementation costs exceeding €5.4 billion for DORA alone.

[^11^]: Regulation (EU) 2022/2554 of the European Parliament and of the Council of 14 December 2022 on digital operational resilience for the financial sector, OJ L 333, 27.12.2022. DORA's scope covers 22 categories of financial entity across all 30 EU/EEA jurisdictions.

[^12^]: EBA, "DORA: ICT Risk Management Framework," EBA/GL/2024/XX, December 2024. The EBA's Level 2 and Level 3 guidance under DORA includes 8 separate regulatory products (RTS, ITS, Guidelines) published across 2024, each requiring separate tracking and assessment.

[^13^]: APRA, "Prudential Standard CPS 230 Operational Risk Management," final version, July 2023, effective July 2025. CPS 230 introduces operational risk management requirements structurally similar to DORA but adapted to the Australian financial sector's regulatory architecture.

[^14^]: FATF, "Report on the State of Global Regulatory Frameworks for Virtual Assets," February 2024. The report documents the rapid convergence of crypto-asset regulatory frameworks toward EU MiCA and US SEC/CFTC models, supporting GRCIN's regulatory template inheritance hypothesis.

[^15^]: EUR-Lex, "About EUR-Lex," official documentation. EUR-Lex processes approximately 25,000 new documents annually across 24 official EU languages, making it the single largest regulatory publication repository in the world by volume.

[^16^]: MAS, "Technology Risk Management Guidelines," updated January 2024. MAS's approach of principle-based guidelines rather than prescriptive rules requires GRCIN's Assessment Engine to interpret regulatory intent from supervisory actions and enforcement cases, not just published text.

[^17^]: ISO/IEC 42001:2023, "Information technology — Artificial intelligence — Management system," the first international management system standard for AI, frequently referenced as a benchmark in emerging AI regulations including the EU AI Act.

[^18^]: GLEIF, "Annual Report 2023," reporting 2.5 million active LEIs with 99.7% data quality accuracy. LEI is the only globally standardized legal entity identifier, making it the canonical key for GRCIN's Company nodes.

[^19^]: Neo4j, "Graph Data Modeling for Regulatory Compliance," technical whitepaper, 2023. Graph schemas for regulatory compliance benefit from rich relationship properties that capture the temporal, jurisdictional, and evidentiary dimensions of compliance status — dimensions poorly supported by relational alternatives.

[^20^]: Hogan, A. et al., "Knowledge Graphs," ACM Computing Surveys, 2021. The survey establishes property graph models as the state-of-the-art for complex domain modeling where relationships carry as much semantic weight as entities — directly applicable to the regulatory compliance domain.

[^21^]: Deloitte, "Regulatory Technology: Transforming Compliance with Technology," 2024. The report identifies real-time compliance monitoring and predictive risk analytics as the two highest-value use cases for RegTech, with estimated market size of $19.5 billion by 2026 — the market segment GRCIN directly addresses.

---

*Document continues in Section 3: Compliance Assessment Methodology & BFT Council Consensus Mechanism.*
