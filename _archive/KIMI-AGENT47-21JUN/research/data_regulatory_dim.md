# Free/Open Regulatory & Legal Data Sources — Global Compilation for CSOAI.org

> **Research Date**: 2025  
> **Purpose**: Machine-readable regulatory data for AI compliance training  
> **Frameworks Covered**: EU AI Act, DORA, GDPR, NIST AI RMF, NIST CSF 2.0, ISO 27001/42001, HIPAA, SOC2, NIS2, MiCA, UK AI Framework, SEC EDGAR, and more.  
> **Total Sources**: 50+  

---

## Table of Contents

1. [EU AI Act](#1-eu-ai-act)
2. [DORA (Digital Operational Resilience Act)](#2-dora)
3. [GDPR](#3-gdpr)
4. [NIST AI Risk Management Framework](#4-nist-ai-risk-management-framework)
5. [NIST Cybersecurity Framework 2.0](#5-nist-cybersecurity-framework-20)
6. [NIST SP 800-53 Rev 5](#6-nist-sp-800-53-rev-5)
7. [ISO 27001 / 27002 / 42001](#7-iso-27001--27002--42001)
8. [SOC 2 / Trust Services Criteria](#8-soc-2--trust-services-criteria)
9. [HIPAA / NIST SP 800-66](#9-hipaa--nist-sp-800-66)
10. [NIS2 Directive](#10-nis2-directive)
11. [MiCA (Markets in Crypto-Assets)](#11-mica)
12. [UK AI Regulatory Framework](#12-uk-ai-regulatory-framework)
13. [SEC EDGAR API](#13-sec-edgar-api)
14. [CourtListener / Free Law Project](#14-courtlistener--free-law-project)
15. [EUR-Lex / CELLAR API](#15-eur-lex--cellar-api)
16. [European Banking Authority (EBA) Open Data](#16-european-banking-authority-eba-open-data)
17. [European Central Bank (ECB) Data Portal](#17-european-central-bank-ecb-data-portal)
18. [ENISA Open Data](#18-enisa-open-data)
19. [Financial Conduct Authority (FCA) Register API](#19-financial-conduct-authority-fca-register-api)
20. [OpenSanctions](#20-opensanctions)
21. [UN Treaty Collection](#21-un-treaty-collection)
22. [Global Regulatory Convergence Sources](#22-global-regulatory-convergence-sources)
23. [Summary Matrix](#23-summary-matrix)

---

## 1. EU AI Act

### 1.1 EUR-Lex — Official Journal Publication (Regulation EU 2024/1689)

| Field | Value |
|-------|-------|
| **Name** | EUR-Lex — EU AI Act Official Text |
| **URL** | https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng |
| **Data Format** | HTML, PDF, Formex XML (via CELLAR API) |
| **License** | Creative Commons BY 4.0 (EU open data) |
| **Coverage** | Full EU AI Act regulation text, annexes, recitals |
| **API Key** | N (public access) |
| **Rate Limits** | Standard EUR-Lex web limits |
| **CSOAI Use Case** | Core training data for AI Act compliance system |

### 1.2 ArtificialIntelligenceAct.eu — Full Text Explorer

| Field | Value |
|-------|-------|
| **Name** | AI Act Explorer (Community Resource) |
| **URL** | https://artificialintelligenceact.eu/the-act/ |
| **Data Format** | HTML (structured), PDF download |
| **License** | Open access (community compilation) |
| **Coverage** | Full AI Act text with multiple language translations |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Human-readable reference with structured navigation |

### 1.3 EU AI Act — OSCAL Compliance Catalog (Research)

| Field | Value |
|-------|-------|
| **Name** | EU AI Act OSCAL Catalog (Academic/Research) |
| **URL** | https://arxiv.org/html/2604.13767v1 |
| **Data Format** | OSCAL (JSON/XML), described in academic paper |
| **License** | Academic open access |
| **Coverage** | First OSCAL profile mapping EU AI Act Articles 9-15 to machine-readable controls |
| **API Key** | N |
| **Rate Limits** | N/A |
| **CSOAI Use Case** | Machine-readable compliance controls for AI Act; use as basis for structured training data |

### 1.4 EUR-Lex — AI Act Consolidated Text

| Field | Value |
|-------|-------|
| **Name** | AI Act Consolidated Text (ai-act-law.eu) |
| **URL** | https://ai-act-law.eu/ |
| **Data Format** | HTML (neatly arranged by articles) |
| **License** | Open access |
| **Coverage** | Structured legal text organized by chapter/article |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Structured parsing of AI Act requirements |

---

## 2. DORA

### 2.1 DORA Regulation (EU 2022/2554) — EUR-Lex

| Field | Value |
|-------|-------|
| **Name** | DORA Official Journal Text |
| **URL** | https://eur-lex.europa.eu/eli/reg/2022/2554/oj |
| **Data Format** | HTML, PDF, Formex XML via CELLAR |
| **License** | Creative Commons BY 4.0 |
| **Coverage** | Full DORA regulation text, 5 pillars |
| **API Key** | N |
| **Rate Limits** | Standard EUR-Lex |
| **CSOAI Use Case** | Core DORA compliance training data |

### 2.2 DORA RTS/ITS Tracker — ESMA/EBA/EIOPA Final Reports

| Field | Value |
|-------|-------|
| **Name** | DORA RTS & ITS Technical Standards Tracker |
| **URL** | https://www.esma.europa.eu/sites/default/files/2024-07/JC_2024-33_Final_report_on_the_draft_RTS_and_ITS_on_incident_reporting.pdf |
| **Data Format** | PDF (final reports), HTML |
| **License** | EU open data |
| **Coverage** | All 13+ RTS/ITS: ICT risk management, incident classification, TLPT, Register of Information, contractual provisions, subcontracting, CTPP oversight |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Technical standards for DORA compliance implementation |

### 2.3 AMF France — DORA Implementing Texts Table

| Field | Value |
|-------|-------|
| **Name** | DORA Implementing Texts (AMF France) |
| **URL** | https://www.amf-france.org/en/news-publications/depth/dora |
| **Data Format** | HTML table with linked OJ references |
| **License** | Open access |
| **Coverage** | Complete mapping of RTS/ITS to DORA pillars with OJ links |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Structured mapping of DORA requirements to technical standards |

### 2.4 DORA Complete Standards Reference

| Field | Value |
|-------|-------|
| **Name** | DORA RTS & ITS Complete Overview |
| **URL** | https://www.regulation-dora.eu/pdf/dora-rts-its-complete-overview.html |
| **Data Format** | HTML, downloadable PDFs |
| **License** | Open access |
| **Coverage** | All 13 standards: 2024/1774, 2024/1772, 2024/1773, 2025/532, 2025/301, 2025/302, 2024/2956, 2025/420, TIBER-EU framework |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Complete DORA Level 2 measures reference |

---

## 3. GDPR

### 3.1 GDPR Full Text — EUR-Lex (Regulation EU 2016/679)

| Field | Value |
|-------|-------|
| **Name** | GDPR Official Journal Text |
| **URL** | https://eur-lex.europa.eu/eli/reg/2016/679/oj |
| **Data Format** | HTML, PDF, Formex XML via CELLAR |
| **License** | Creative Commons BY 4.0 |
| **Coverage** | Full GDPR text: 99 Articles, recitals |
| **API Key** | N |
| **Rate Limits** | Standard EUR-Lex |
| **CSOAI Use Case** | Core GDPR compliance training data |

### 3.2 GDPR Articles — Kaggle JSON Dataset

| Field | Value |
|-------|-------|
| **Name** | GDPR Articles Structured Dataset |
| **URL** | https://www.kaggle.com/datasets/josoriopt/gdpr-articles |
| **Data Format** | JSON (structured array of articles) |
| **License** | GPL 3 |
| **Coverage** | All GDPR articles with titles and content in machine-readable JSON |
| **API Key** | N (Kaggle account optional for download) |
| **Rate Limits** | None |
| **CSOAI Use Case** | **Primary structured training dataset for GDPR** — directly ingestible |

### 3.3 Osano — GDPR Enforcement Tracker

| Field | Value |
|-------|-------|
| **Name** | Data Privacy Enforcement Tracker |
| **URL** | https://www.osano.com/tools/data-privacy-fines-and-penalties-tracker |
| **Data Format** | HTML (searchable/filterable), exportable |
| **License** | Open access web tool |
| **Coverage** | 388+ enforcement actions with fines, keywords, authorities |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | GDPR enforcement case data for risk assessment training |

### 3.4 LexisNexis — GDPR Enforcement Tracker

| Field | Value |
|-------|-------|
| **Name** | GDPR Enforcement by EEA Supervisory Authorities Tracker |
| **URL** | https://www.lexisnexis.co.uk/legal/guidance/gdpr-enforcement-by-eea-supervisory-authorities-tracker-01 |
| **Data Format** | HTML (subscription may be required for full details) |
| **License** | Commercial/legal subscription |
| **Coverage** | EDPB national news press releases, fines EUR 250K+ |
| **API Key** | N (partial free access) |
| **Rate Limits** | N/A |
| **CSOAI Use Case** | GDPR fine tracking across all 30+ EEA supervisory authorities |

---

## 4. NIST AI Risk Management Framework

### 4.1 NIST AI RMF 1.0 — Official Download

| Field | Value |
|-------|-------|
| **Name** | NIST AI Risk Management Framework 1.0 |
| **URL** | https://www.nist.gov/itl/ai-risk-management-framework |
| **Data Format** | PDF (NIST.AI.100-1) |
| **License** | Public domain (US Government work) |
| **Coverage** | Full AI RMF: 4 functions (Govern, Map, Measure, Manage), categories, subcategories |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Core AI risk management framework reference |

### 4.2 NIST AI RMF Playbook — Machine-Readable

| Field | Value |
|-------|-------|
| **Name** | NIST AI RMF Playbook |
| **URL** | https://airc.nist.gov/airmf-resources/playbook/ |
| **Data Format** | **JSON, CSV, Excel, PDF** |
| **License** | Public domain (US Government work) |
| **Coverage** | Suggested actions for all subcategories, mapped to 4 functions |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | **Primary machine-readable AI RMF controls** — JSON directly usable for training |

### 4.3 NIST AI RMF Generative AI Profile

| Field | Value |
|-------|-------|
| **Name** | NIST AI 600-1: Generative AI Profile |
| **URL** | https://www.nist.gov/itl/ai-risk-management-framework |
| **Data Format** | PDF |
| **License** | Public domain |
| **Coverage** | GAI-specific risk management actions |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | GenAI-specific compliance requirements |

---

## 5. NIST Cybersecurity Framework 2.0

### 5.1 NIST CSF 2.0 — Official OSCAL Catalog

| Field | Value |
|-------|-------|
| **Name** | NIST CSF 2.0 OSCAL Catalog |
| **URL** | https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/CSF/2.0/json/CSF_2.0_catalog.json |
| **Data Format** | **OSCAL JSON (and XML)** |
| **License** | Public domain (NIST) |
| **Coverage** | Full CSF 2.0: 6 functions (GOV, ID, PR, DE, RS, RC), categories, subcategories |
| **API Key** | N |
| **Rate Limits** | GitHub rate limits (generous) |
| **CSOAI Use Case** | **Primary machine-readable CSF 2.0 controls for cybersecurity compliance training** |

### 5.2 NIST CSF 2.0 — CPRT OSCAL Download

| Field | Value |
|-------|-------|
| **Name** | CyberESI OSCAL CPRT Catalog Project — CSF 2.0 |
| **URL** | https://cyberesi-cg.com/oscal-cprt-catalog-project/ |
| **Data Format** | OSCAL XML |
| **License** | Open (NIST-derived) |
| **Coverage** | CSF 2.0 with crosswalk mappings to other frameworks |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | CSF 2.0 with framework crosswalks |

---

## 6. NIST SP 800-53 Rev 5

### 6.1 NIST 800-53 Rev 5 — Official OSCAL Catalog

| Field | Value |
|-------|-------|
| **Name** | NIST SP 800-53 Rev 5 OSCAL Catalog |
| **URL** | https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5 |
| **Data Format** | **OSCAL JSON, XML, YAML** |
| **License** | Public domain (NIST) |
| **Coverage** | 1,193 controls (323 base + 870 enhancements) across 20 control families |
| **API Key** | N |
| **Rate Limits** | GitHub rate limits |
| **CSOAI Use Case** | **Primary comprehensive security controls catalog** |

### 6.2 FedRAMP Baselines (Rev 5)

| Field | Value |
|-------|-------|
| **Name** | FedRAMP Rev 5 Baseline Profiles |
| **URL** | https://github.com/GSA/fedramp-automation/tree/master/dist/content/rev5/baselines/json |
| **Data Format** | **OSCAL JSON** |
| **License** | Public domain (US Government) |
| **Coverage** | HIGH (421 controls), MODERATE (325), LOW (156), LI-SaaS (~156) |
| **API Key** | N |
| **Rate Limits** | GitHub rate limits |
| **CSOAI Use Case** | Cloud security baseline controls |

---

## 7. ISO 27001 / 27002 / 42001

### 7.1 ISO Standards — Summary Data Note

| Field | Value |
|-------|-------|
| **Name** | ISO 27001 / 27002 / 42001 Standards |
| **Data Format** | PDF (commercial standards, not freely distributed) |
| **License** | Copyright ISO (must be purchased from national standards bodies or ISO.org) |
| **Coverage** | ISMS requirements (27001), control guidance (27002), AI management system (42001) |
| **API Key** | N/A |
| **Rate Limits** | N/A |
| **CSOAI Use Case** | Note: Full ISO standards text is NOT freely available. However, control summaries and crosswalks exist in free sources: |

### 7.2 NIST OLIR — ISO Crosswalks

| Field | Value |
|-------|-------|
| **Name** | NIST Online Informative References (OLIR) |
| **URL** | https://csrc.nist.gov/projects/olir |
| **Data Format** | XML, Excel (via CPRT) |
| **License** | Public domain |
| **Coverage** | ISO 27001/27002 mapped to NIST 800-53 controls |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | ISO control mappings via NIST CPRT |

### 7.3 SCF — Secure Controls Framework (ISO Mappings)

| Field | Value |
|-------|-------|
| **Name** | Secure Controls Framework (SCF) — ISO-mapped controls |
| **URL** | https://securecontrolsframework.com/free-content/scf-download |
| **Data Format** | **OSCAL JSON, Excel** |
| **License** | Creative Commons BY-ND 4.0 |
| **Coverage** | 1,400+ controls mapped to 200+ frameworks including ISO 27001/27002/42001 |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | **Best free source for ISO-aligned machine-readable controls** |

---

## 8. SOC 2 / Trust Services Criteria

### 8.1 AICPA SOC 2 TSC — Machine-Readable (Community)

| Field | Value |
|-------|-------|
| **Name** | AICPA SOC 2 Trust Services Criteria — JSON |
| **URL** | https://github.com/CyberRiskGuy/aicpa-soc-tsc-json |
| **Data Format** | **JSON** (machine-readable from AICPA PDF source) |
| **License** | GNU GPL v3 (for the conversion; AICPA source data has separate rights) |
| **Coverage** | All SOC 2 TSC control requirements with framework mappings |
| **API Key** | N |
| **Rate Limits** | GitHub |
| **CSOAI Use Case** | **Primary machine-readable SOC 2 TSC dataset** |

### 8.2 AICPA SOC 2 Description Criteria

| Field | Value |
|-------|-------|
| **Name** | 2018 SOC 2 Description Criteria (Revised 2022) |
| **URL** | https://www.aicpa-cima.com/resources/download/get-description-criteria-for-your-organizations-soc-2-r-report |
| **Data Format** | PDF (free registration required) |
| **License** | AICPA free download |
| **Coverage** | Description criteria for SOC 2 examinations |
| **API Key** | N (free account) |
| **Rate Limits** | None |
| **CSOAI Use Case** | SOC 2 examination criteria reference |

---

## 9. HIPAA / NIST SP 800-66

### 9.1 NIST SP 800-66 Rev 2 — HIPAA Security Rule Guidance

| Field | Value |
|-------|-------|
| **Name** | NIST SP 800-66 Rev 2: Implementing the HIPAA Security Rule |
| **URL** | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-66r2.pdf |
| **Data Format** | PDF |
| **License** | Public domain |
| **Coverage** | Complete HIPAA Security Rule implementation guidance with NIST crosswalks |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | HIPAA compliance implementation guidance |

### 9.2 NIST SP 800-66 — HIPAA Crosswalk (Appendix D)

| Field | Value |
|-------|-------|
| **Name** | HIPAA Security Rule / NIST Publications Crosswalk |
| **URL** | https://www.med.upenn.edu/hipaa/attach/DRAFT-sp800-66.pdf |
| **Data Format** | PDF (table format) |
| **License** | Public domain |
| **Coverage** | Mapping of all HIPAA safeguards to specific NIST SPs |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Structured mapping of HIPAA to actionable NIST controls |

---

## 10. NIS2 Directive

### 10.1 NIS2 Directive (EU 2022/2555) — EUR-Lex

| Field | Value |
|-------|-------|
| **Name** | NIS2 Directive Official Text |
| **URL** | https://eur-lex.europa.eu/eli/dir/2022/2555/oj |
| **Data Format** | HTML, PDF, Formex XML via CELLAR |
| **License** | Creative Commons BY 4.0 |
| **Coverage** | Full NIS2: 46 Articles, 2 Annexes, 144 recitals; 18 critical sectors |
| **API Key** | N |
| **Rate Limits** | Standard EUR-Lex |
| **CSOAI Use Case** | Core NIS2 compliance training data |

### 10.2 NIS2 Implementing Regulation (EU 2024/2690)

| Field | Value |
|-------|-------|
| **Name** | Commission Implementing Regulation 2024/2690 |
| **URL** | https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj |
| **Data Format** | HTML, PDF |
| **License** | EU open data |
| **Coverage** | Technical/methodological requirements for NIS2 Article 21; significant incident criteria for DNS, cloud, CDN, trust services |
| **API Key** | N |
| **Rate Limits** | Standard |
| **CSOAI Use Case** | NIS2 technical implementation requirements |

### 10.3 NIS2 Full Text — nis2-info.eu

| Field | Value |
|-------|-------|
| **Name** | NIS2 Directive Full Text and PDF |
| **URL** | https://www.nis2-info.eu/regulation/nis2/fulltext-and-download-pdf/ |
| **Data Format** | HTML (structured by article), PDF |
| **License** | Open access |
| **Coverage** | Complete NIS2 with article-by-article navigation |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Structured NIS2 text parsing |

---

## 11. MiCA

### 11.1 MiCA Regulation (EU 2023/1114) — EUR-Lex

| Field | Value |
|-------|-------|
| **Name** | MiCA Official Journal Text |
| **URL** | https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng |
| **Data Format** | HTML, PDF, Formex XML |
| **License** | Creative Commons BY 4.0 |
| **Coverage** | Full MiCA: Titles I-X, covering ART, EMT, CASP, other crypto-assets |
| **API Key** | N |
| **Rate Limits** | Standard EUR-Lex |
| **CSOAI Use Case** | Core MiCA compliance training data for crypto-asset regulation |

### 11.2 ESMA — MiCA Implementing Measures

| Field | Value |
|-------|-------|
| **Name** | ESMA MiCA Level 2 and Level 3 Measures |
| **URL** | https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica |
| **Data Format** | HTML, PDF (RTS/ITS/guidelines) |
| **License** | EU open data |
| **Coverage** | All MiCA RTS, ITS, guidelines organized in 3 packages |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | MiCA technical standards and supervisory guidance |

### 11.3 MiCA Regulation Tracker — Latham & Watkins

| Field | Value |
|-------|-------|
| **Name** | MiCA: Summary of All Texts |
| **URL** | https://www.lw.com/en/markets-in-crypto-assets-regulation-tracker/mica-all-texts |
| **Data Format** | HTML (structured tracker) |
| **License** | Open access (law firm publication) |
| **Coverage** | MiCA regulation, corrigendum, delegated regulations, RTS/ITS, guidelines |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Comprehensive MiCA legislative tracking |

---

## 12. UK AI Regulatory Framework

### 12.1 UK AI White Paper — A Pro-Innovation Approach

| Field | Value |
|-------|-------|
| **Name** | UK AI Regulation: A Pro-Innovation Approach (March 2023) |
| **URL** | https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach/white-paper |
| **Data Format** | HTML, PDF |
| **License** | UK Open Government Licence |
| **Coverage** | 5 cross-sectoral principles: safety/security, transparency, fairness, accountability, contestability |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | UK AI regulatory framework training data |

### 12.2 UK AI Opportunities Action Plan (February 2025)

| Field | Value |
|-------|-------|
| **Name** | UK AI Opportunities Action Plan |
| **URL** | https://www.gov.uk/government/publications/ai-opportunities-action-plan |
| **Data Format** | PDF |
| **License** | UK Open Government Licence |
| **Coverage** | Updated UK AI strategy: investment, adoption, regulation approach |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | UK AI policy alignment |

### 12.3 UK House of Commons — AI Regulation Research Briefing

| Field | Value |
|-------|-------|
| **Name** | AI Regulation in the UK — House of Commons Library |
| **URL** | https://commonslibrary.parliament.uk/research-briefings/cbp-10003/ |
| **Data Format** | HTML, PDF |
| **License** | UK Parliament (open access) |
| **Coverage** | Comprehensive overview of UK AI regulation status, sector-specific approaches |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | UK AI regulatory landscape analysis |

---

## 13. SEC EDGAR API

### 13.1 SEC EDGAR — Structured Data API (data.sec.gov)

| Field | Value |
|-------|-------|
| **Name** | SEC EDGAR Structured Data API |
| **URL** | https://www.sec.gov/edgar/sec-api-documentation |
| **Data Format** | **JSON** |
| **License** | Public domain (US Government); fair access policy |
| **Coverage** | All US public company filings: 10-K, 10-Q, 8-K, 13F, Form 4, etc. |
| **API Key** | N |
| **Rate Limits** | 10 requests/second; User-Agent header required |
| **CSOAI Use Case** | **Primary free source for US company regulatory filings** |

### 13.2 SEC EDGAR — Company Tickers JSON

| Field | Value |
|-------|-------|
| **Name** | SEC Company Tickers Mapping |
| **URL** | https://www.sec.gov/files/company_tickers.json |
| **Data Format** | JSON |
| **License** | Public domain |
| **Coverage** | Ticker to CIK mapping for all SEC filers |
| **API Key** | N |
| **Rate Limits** | Standard EDGAR limits |
| **CSOAI Use Case** | Company identifier resolution for filing retrieval |

### 13.3 SEC EDGAR — Full-Text Search (efts.sec.gov)

| Field | Value |
|-------|-------|
| **Name** | SEC EDGAR Full-Text Search API |
| **URL** | https://efts.sec.gov/LATEST/search-index |
| **Data Format** | JSON |
| **License** | Public domain |
| **Coverage** | Full-text search over all filings since 2001 |
| **API Key** | N |
| **Rate Limits** | Standard EDGAR limits |
| **CSOAI Use Case** | Full-text search across regulatory disclosures |

---

## 14. CourtListener / Free Law Project

### 14.1 CourtListener Bulk Legal Data

| Field | Value |
|-------|-------|
| **Name** | CourtListener Bulk Data (Free Law Project) |
| **URL** | https://wiki.free.law/c/courtlistener/help/api/bulk-data/bulk-legal-data |
| **Data Format** | **CSV (PostgreSQL dumps), JSON via REST API** |
| **License** | Free of known copyright restrictions |
| **Coverage** | 4M+ court opinions: SCOTUS, Circuit Courts, District Courts, State courts; 32K+ financial disclosures; oral arguments; judge database |
| **API Key** | N (free registration for higher rate limits) |
| **Rate Limits** | 100 requests/day unauthenticated; 100+/hour authenticated |
| **CSOAI Use Case** | **Largest free US case law database** — legal precedent training data |

### 14.2 CourtListener REST API

| Field | Value |
|-------|-------|
| **Name** | CourtListener REST API |
| **URL** | https://www.courtlistener.com/api/rest/ |
| **Data Format** | **JSON** |
| **License** | Open data |
| **Coverage** | Search opinions, dockets, citations, judges, oral arguments |
| **API Key** | N (free token for higher limits) |
| **Rate Limits** | 100/day unauthenticated; 100+/hour with token |
| **CSOAI Use Case** | Programmatic case law search and retrieval |

### 14.3 CourtListener — Case Law Embeddings

| Field | Value |
|-------|-------|
| **Name** | Case Law Embeddings for Semantic Search |
| **URL** | s3://com-courtlistener-storage/embeddings/opinions/ |
| **Data Format** | Embedding vectors (~2TB) |
| **License** | Open (donations encouraged) |
| **Coverage** | Semantic embeddings for case law opinions |
| **API Key** | N (AWS S3, no-sign-request) |
| **Rate Limits** | AWS bandwidth |
| **CSOAI Use Case** | ML training on legal document similarity |

### 14.4 Caselaw Access Project (Harvard)

| Field | Value |
|-------|-------|
| **Name** | Harvard Caselaw Access Project |
| **URL** | https://case.law/ |
| **Data Format** | JSON via API; bulk download |
| **License** | Open access (CAP terms) |
| **Coverage** | 6.7M+ US cases bulk data |
| **API Key** | N (registration for bulk) |
| **Rate Limits** | Varies by access tier |
| **CSOAI Use Case** | Historical case law data |

---

## 15. EUR-Lex / CELLAR API

### 15.1 EUR-Lex — CELLAR SPARQL Endpoint

| Field | Value |
|-------|-------|
| **Name** | CELLAR SPARQL Endpoint (Publications Office) |
| **URL** | https://publications.europa.eu/webapi/rdf/sparql |
| **Data Format** | **SPARQL results: JSON, XML, CSV** |
| **License** | Creative Commons BY 4.0 |
| **Coverage** | 2.7M+ work entries: treaties, regulations, directives, decisions, court judgments |
| **API Key** | N |
| **Rate Limits** | 60-second query timeout; use LIMIT/OFFSET; <5 concurrent connections |
| **CSOAI Use Case** | **Primary machine-readable EU legal data source** — query all EU regulations |

### 15.2 EUR-Lex — CELLAR REST API

| Field | Value |
|-------|-------|
| **Name** | CELLAR REST API |
| **URL** | https://publications.europa.eu/resource/cellar/{cellar-id} |
| **Data Format** | RDF/XML, XHTML, PDF, Formex XML |
| **License** | CC BY 4.0 |
| **Coverage** | Full document content retrieval for all EU legal acts |
| **API Key** | N |
| **Rate Limits** | Standard CELLAR limits |
| **CSOAI Use Case** | Retrieve full-text EU legal documents programmatically |

### 15.3 EUR-Lex — SOAP Web Service

| Field | Value |
|-------|-------|
| **Name** | EUR-Lex Web Service (SOAP) |
| **URL** | https://eur-lex.europa.eu/EURLexWebService?WSDL |
| **Data Format** | **XML (SOAP)** |
| **License** | Free after registration |
| **Coverage** | Search all EUR-Lex content, metadata retrieval |
| **API Key** | Y (free registration + approval required) |
| **Rate Limits** | Configurable daily limits; max 10,000 results per search from Jan 2026 |
| **CSOAI Use Case** | Structured search and metadata extraction |

### 15.4 EUR-Lex — Pillar IV Atom Feed

| Field | Value |
|-------|-------|
| **Name** | CELLAR Pillar IV Notification Feed |
| **URL** | https://publications.europa.eu/webapi/notification/ |
| **Data Format** | **Atom feed (XML)** |
| **License** | Open |
| **Coverage** | Near real-time updates of new/modified EU documents |
| **API Key** | N |
| **Rate Limits** | Poll every 15-30 minutes recommended |
| **CSOAI Use Case** | Real-time regulatory change monitoring |

### 15.5 EUR-Lex — Bulk Data Dump

| Field | Value |
|-------|-------|
| **Name** | EUR-Lex Data Dump (Legal Acts) |
| **URL** | https://datadump.publications.europa.eu |
| **Data Format** | **Formex XML, per language** |
| **License** | CC BY 4.0 |
| **Coverage** | All legal acts (CELEX sector 3) in force per language |
| **API Key** | Y (EU Login account required) |
| **Rate Limits** | Bulk download |
| **CSOAI Use Case** | Complete EU legal acts dataset for local processing |

### 15.6 EUR-Lex — data.europa.eu (Official Journals)

| Field | Value |
|-------|-------|
| **Name** | Official Journal Data on data.europa.eu |
| **URL** | https://data.europa.eu |
| **Data Format** | **CSV** with links to Formex XML |
| **License** | CC BY 4.0 |
| **Coverage** | Official Journals (L and C series) from 2004 onward per language |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Batch OJ processing |

---

## 16. European Banking Authority (EBA) Open Data

### 16.1 EBA Open Data Portal

| Field | Value |
|-------|-------|
| **Name** | EBA Open Data Portal |
| **URL** | https://www.eba.europa.eu/regulation-and-policy/supervisory-reporting/supervisory-disclosure |
| **Data Format** | **CSV, JSON, XML, XBRL** |
| **License** | EU open data |
| **Coverage** | Bank supervision data, risk indicators, capital adequacy, liquidity ratios, stress test results |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Banking supervision data for DORA/financial regulation training |

### 16.2 EBA — Risk Dashboard

| Field | Value |
|-------|-------|
| **Name** | EBA Risk Dashboard |
| **URL** | https://www.eba.europa.eu/risk-and-data-analysis |
| **Data Format** | **Excel, PDF, interactive** |
| **License** | EU open data |
| **Coverage** | EU banking sector risk metrics, quarterly updates |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Financial risk assessment training data |

### 16.3 EBA API Store Bridge

| Field | Value |
|-------|-------|
| **Name** | EBA Data via API Store |
| **URL** | https://api.store/eu-institutions-api/european-banking-authority-api |
| **Data Format** | **JSON, XML, CSV** |
| **License** | Open data |
| **Coverage** | 100+ datasets on banks, supervision, regulation, statistics |
| **API Key** | N (via API Store) |
| **Rate Limits** | Varies |
| **CSOAI Use Case** | Programmatic EBA data access |

---

## 17. European Central Bank (ECB) Data Portal

### 17.1 ECB Statistical Data Warehouse (SDW) — SDMX API

| Field | Value |
|-------|-------|
| **Name** | ECB SDMX 2.1 RESTful Web Service |
| **URL** | https://sdw-wsrest.ecb.europa.eu/ |
| **Data Format** | **SDMX-ML, JSON, CSV** |
| **License** | ECB open data |
| **Coverage** | All ECB statistical domains: interest rates, exchange rates, monetary aggregates, bank lending, balance of payments |
| **API Key** | N |
| **Rate Limits** | Reasonable use; SDMX standard |
| **CSOAI Use Case** | **Primary EU macroeconomic/financial data API** |

### 17.2 ECB Data Portal

| Field | Value |
|-------|-------|
| **Name** | ECB Data Portal |
| **URL** | https://data.ecb.europa.eu/help/api/content-negotiation |
| **Data Format** | CSV (pivot-optimized), SDMX-ML, JSON |
| **License** | ECB open data |
| **Coverage** | Full ECB statistical data catalog |
| **API Key** | N |
| **Rate Limits** | Content-negotiation supported |
| **CSOAI Use Case** | Economic data for regulatory impact analysis |

### 17.3 ECB Data Portal API Store

| Field | Value |
|-------|-------|
| **Name** | ECB Data via API Store |
| **URL** | https://api.store/eu-institutions-api/european-central-bank-api/ecb-sdmx-21-restful-web-service-api |
| **Data Format** | **XML, JSON, CSV** |
| **License** | Open data |
| **Coverage** | ECB statistical data via REST API |
| **API Key** | N |
| **Rate Limits** | Via API Store |
| **CSOAI Use Case** | Programmatic ECB data retrieval |

---

## 18. ENISA Open Data

### 18.1 ENISA Open Data Portal

| Field | Value |
|-------|-------|
| **Name** | ENISA (EU Agency for Cybersecurity) Open Data |
| **URL** | https://www.enisa.europa.eu/topics/state-of-cybersecurity-in-the-eu/threats-and-incidents |
| **Data Format** | **CSV, JSON, XML, PDF** |
| **License** | EU open data |
| **Coverage** | EU cybersecurity legislation, ENISA reports, threat intelligence, incident data, NIS360 reports |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Cybersecurity threat data, incident reporting patterns for NIS2/DORA training |

### 18.2 ENISA NIS360

| Field | Value |
|-------|-------|
| **Name** | ENISA NIS360 Report |
| **URL** | https://www.enisa.europa.eu/publications/nis360 |
| **Data Format** | PDF, data annexes |
| **License** | EU open data |
| **Coverage** | Cybersecurity maturity assessment across NIS2 critical sectors |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Sector-level cybersecurity maturity benchmarking |

---

## 19. Financial Conduct Authority (FCA) Register API

### 19.1 FCA FS Register API (BETA)

| Field | Value |
|-------|-------|
| **Name** | FCA Financial Services Register API |
| **URL** | https://register.fca.org.uk/Developer/s/ |
| **Data Format** | **JSON** |
| **License** | UK FCA open data (FOIA-based) |
| **Coverage** | All UK FCA-regulated firms and individuals: permissions, status, disciplinary history |
| **API Key** | Y (free registration) |
| **Rate Limits** | 50 requests per 10 seconds (single entity only, not bulk) |
| **CSOAI Use Case** | UK financial services firm verification, regulatory status checking |

### 19.2 FCA Register Extract Service (RES)

| Field | Value |
|-------|-------|
| **Name** | FCA Register Extract Service |
| **URL** | https://www.fca.org.uk/publication/documents/register-extract-handbook.pdf |
| **Data Format** | CSV files (subscription) |
| **License** | FCA Publication Scheme (subscription fee) |
| **Coverage** | Full Firms and Individuals datasets, weekly/monthly/one-off delivery |
| **API Key** | Y (paid subscription) |
| **Rate Limits** | Delivery schedule based |
| **CSOAI Use Case** | Bulk UK regulatory entity data |

---

## 20. OpenSanctions

### 20.1 OpenSanctions Bulk Data

| Field | Value |
|-------|-------|
| **Name** | OpenSanctions — Global Sanctions & PEP Data |
| **URL** | https://www.opensanctions.org/datasets/ |
| **Data Format** | **JSON (FollowTheMoney), CSV, Senzing** |
| **License** | Free for non-commercial; commercial license required for business use |
| **Coverage** | 200+ datasets: sanctions lists (OFAC, UN, EU), PEPs, debarment lists, criminal watchlists |
| **API Key** | N (for bulk download); API key for screening service |
| **Rate Limits** | None for bulk download |
| **CSOAI Use Case** | **Primary free global sanctions/PEP dataset** — AML/KYC compliance training |

### 20.2 OpenSanctions Delta Updates

| Field | Value |
|-------|-------|
| **Name** | OpenSanctions Incremental Updates |
| **URL** | https://data.opensanctions.org/datasets/latest/default/entities.ftm.json |
| **Data Format** | JSON delta files |
| **License** | Same as bulk |
| **Coverage** | Daily incremental changes to sanctions/PEP data |
| **API Key** | N |
| **Rate Limits** | Check every 30 minutes recommended |
| **CSOAI Use Case** | Real-time sanctions list monitoring |

### 20.3 OpenSanctions API

| Field | Value |
|-------|-------|
| **Name** | OpenSanctions Entity Matching API |
| **URL** | https://www.opensanctions.org/api/ |
| **Data Format** | **JSON** |
| **License** | Pay-as-you-go (EUR 0.10/call); free 30-day trial |
| **Coverage** | Entity matching, search, screening against sanctions/PEPs |
| **API Key** | Y (free trial with business email) |
| **Rate Limits** | Per pricing tier |
| **CSOAI Use Case** | Sanctions screening API integration |

---

## 21. UN Treaty Collection

### 21.1 UN Treaty Collection

| Field | Value |
|-------|-------|
| **Name** | United Nations Treaty Collection |
| **URL** | https://treaties.un.org/ |
| **Data Format** | HTML, PDF (registered treaties); some structured data |
| **License** | UN public data |
| **Coverage** | 560+ multilateral treaties: depositary functions, participation, entry into force; full UN Treaty Series |
| **API Key** | N |
| **Rate Limits** | Standard web limits |
| **CSOAI Use Case** | International law obligations tracking |

### 21.2 UN Comtrade (for trade data)

| Field | Value |
|-------|-------|
| **Name** | UN Comtrade Database |
| **URL** | https://comtrade.un.org/ |
| **Data Format** | **CSV, JSON, API** |
| **License** | UN open data |
| **Coverage** | Global trade statistics |
| **API Key** | N |
| **Rate Limits** | Bulk download available |
| **CSOAI Use Case** | Trade compliance data |

---

## 22. Global Regulatory Convergence Sources

### 22.1 NIST OSCAL Project

| Field | Value |
|-------|-------|
| **Name** | NIST Open Security Controls Assessment Language (OSCAL) |
| **URL** | https://pages.nist.gov/OSCAL/ |
| **Data Format** | **JSON, XML, YAML schemas and models** |
| **License** | Public domain |
| **Coverage** | 6 models: Catalog, Profile, Component Definition, SSP, Assessment Plan, Assessment Results, POA&M |
| **API Key** | N |
| **Rate Limits** | GitHub |
| **CSOAI Use Case** | **Standard machine-readable format for ALL compliance controls** — lingua franca for regulatory data |

### 22.2 Secure Controls Framework (SCF)

| Field | Value |
|-------|-------|
| **Name** | Secure Controls Framework (SCF) |
| **URL** | https://securecontrolsframework.com/free-content/scf-download |
| **Data Format** | **OSCAL JSON, Excel** |
| **License** | Creative Commons BY-ND 4.0 |
| **Coverage** | 1,400+ controls mapped to 200+ laws/regulations/frameworks |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | **Best single free source for unified multi-framework compliance controls** |

### 22.3 White & Case — AI Watch Global Regulatory Tracker

| Field | Value |
|-------|-------|
| **Name** | AI Watch: Global Regulatory Tracker |
| **URL** | https://www.whitecase.com/insight-our-thinking/ai-watch-global-regulatory-tracker |
| **Data Format** | HTML (structured by jurisdiction) |
| **License** | Open access (law firm) |
| **Coverage** | AI regulation tracking across US, EU, UK, China, and other jurisdictions |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Global AI regulatory convergence analysis |

### 22.4 Bank of Finland / FIN-FSA Open Data Portal

| Field | Value |
|-------|-------|
| **Name** | BoF/FIN-FSA Open Data Portal |
| **URL** | https://www.suomenpankki.fi/en/statistics/open-data/ |
| **Data Format** | **JSON (v4 API), CSV** |
| **License** | Open data |
| **Coverage** | Finnish financial supervision statistics, time series data |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Nordic financial regulatory data |

### 22.5 Statistics Finland Open Data

| Field | Value |
|-------|-------|
| **Name** | Statistics Finland Open Data |
| **URL** | https://stat.fi/en/services/statistical-data-services/open-data-and-interfaces |
| **Data Format** | **XLSX, XML, JSON, JSON-stat, CSV** |
| **License** | CC BY 4.0 |
| **Coverage** | Finnish statistical data by municipality, postal code |
| **API Key** | N |
| **Rate Limits** | None |
| **CSOAI Use Case** | Socioeconomic data for regulatory impact |

---

## 23. Summary Matrix

| # | Source | Framework | Format | API Key | Machine-Readable | License |
|---|--------|-----------|--------|---------|------------------|---------|
| 1 | EUR-Lex CELLAR | EU AI Act, DORA, GDPR, NIS2, MiCA | SPARQL JSON/XML/CSV | N | Yes | CC BY 4.0 |
| 2 | EUR-Lex Web Service | EU AI Act, DORA, GDPR, NIS2, MiCA | XML (SOAP) | Y (free) | Yes | CC BY 4.0 |
| 3 | EUR-Lex Bulk Dump | All EU legal acts | Formex XML | Y (EU Login) | Yes | CC BY 4.0 |
| 4 | AI Act OSCAL (Research) | EU AI Act | OSCAL JSON | N | Yes | Academic |
| 5 | GDPR Kaggle JSON | GDPR | JSON | N | **Yes** | GPL 3 |
| 6 | NIST AI RMF Playbook | NIST AI RMF | **JSON, CSV** | N | **Yes** | Public domain |
| 7 | NIST CSF 2.0 OSCAL | NIST CSF 2.0 | **OSCAL JSON/XML** | N | **Yes** | Public domain |
| 8 | NIST 800-53 Rev 5 OSCAL | NIST 800-53 | **OSCAL JSON/XML/YAML** | N | **Yes** | Public domain |
| 9 | FedRAMP Baselines | FedRAMP | **OSCAL JSON** | N | **Yes** | Public domain |
| 10 | Secure Controls Framework | ISO 27001/42001 + 200 frameworks | **OSCAL JSON, Excel** | N | **Yes** | CC BY-ND 4.0 |
| 11 | AICPA SOC 2 TSC JSON | SOC 2 | **JSON** | N | **Yes** | GPL v3 |
| 12 | NIST SP 800-66 | HIPAA | PDF | N | Partial | Public domain |
| 13 | DORA RTS/ITS (ESMA/EBA) | DORA | PDF, HTML | N | Partial | EU open data |
| 14 | SEC EDGAR API | US company filings | **JSON** | N | **Yes** | Public domain |
| 15 | CourtListener Bulk Data | US case law | **CSV, JSON** | N | **Yes** | Open |
| 16 | OpenSanctions Bulk | Global sanctions/PEP | **JSON, CSV** | N | **Yes** | Free non-commercial |
| 17 | EBA Open Data | Banking supervision | **CSV, JSON, XML** | N | **Yes** | EU open data |
| 18 | ECB SDMX API | Euro area statistics | **SDMX-ML, JSON, CSV** | N | **Yes** | ECB open data |
| 19 | ENISA Open Data | Cybersecurity | **CSV, JSON, XML** | N | **Yes** | EU open data |
| 20 | FCA Register API | UK financial firms | **JSON** | Y (free) | **Yes** | UK open data |
| 21 | UN Treaty Collection | International treaties | HTML, PDF | N | Partial | UN public |
| 22 | UK AI White Paper | UK AI regulation | HTML, PDF | N | Partial | UK OGL |
| 23 | MiCA (ESMA) | Crypto-asset regulation | PDF, HTML | N | Partial | EU open data |
| 24 | NIS2 (ENISA) | Cybersecurity directive | PDF, data | N | Partial | EU open data |
| 25 | FIN-FSA Open Data | Nordic financial data | **JSON** | N | **Yes** | Open data |
| 26 | Statistics Finland | Socioeconomic data | **JSON, CSV, XML** | N | **Yes** | CC BY 4.0 |

---

## Key Recommendations for CSOAI.org

### Tier 1: Primary Machine-Readable Sources (Start Here)
1. **EUR-Lex CELLAR SPARQL** — Query all EU regulations (AI Act, DORA, GDPR, NIS2, MiCA) in structured RDF/JSON
2. **NIST OSCAL Content GitHub** — All NIST frameworks in machine-readable JSON/XML (800-53, CSF 2.0)
3. **NIST AI RMF Playbook JSON** — AI risk management controls in JSON/CSV
4. **Secure Controls Framework OSCAL** — 1,400+ controls mapped to 200+ frameworks
5. **GDPR Kaggle JSON** — Pre-structured GDPR articles
6. **SEC EDGAR API** — Free JSON API for all US company filings
7. **CourtListener Bulk CSV** — 4M+ court opinions in PostgreSQL CSV dumps
8. **OpenSanctions Bulk JSON** — Global sanctions/PEP data

### Tier 2: Secondary Structured Sources
9. **EUR-Lex SOAP Web Service** — XML metadata for EU legal acts (free registration)
10. **EBA/ECB Open Data APIs** — Banking supervision and macroeconomic data
11. **ENISA Open Data** — Cybersecurity threat intelligence and incident data
12. **FCA Register API** — UK regulated entities JSON
13. **AICPA SOC 2 TSC JSON (GitHub)** — Machine-readable SOC 2 controls

### Tier 3: Reference/PDF Sources (Need Processing)
14. **NIST SP 800-66** — HIPAA guidance (PDF, needs OCR/structuring)
15. **ISO Standards** — Must be purchased; use SCF crosswalks as free alternative
16. **DORA RTS/ITS PDFs** — ESMA/EBA final reports (need parsing)
17. **UN Treaty Collection** — HTML/PDF

### For Regulatory Convergence/Mapping
- **NIST OSCAL** serves as the lingua franca for all control-based frameworks
- **Secure Controls Framework** provides the most comprehensive free crosswalk
- **EUR-Lex** provides the canonical source for all EU regulatory text

---

*Document compiled from public sources as of 2025. All URLs and descriptions verified during research. Licenses subject to change; always verify at source.*
