# Free/Open Company & Business Data Sources — CSOAI GRCIN Research

> **Research Date**: 2026-07  
> **Purpose**: Identify ALL free/open data sources for global company/business entity tracking, beneficial ownership, corporate structures, and compliance for CSOAI's GRCIN system.  
> **Sources Consulted**: 20+ primary sources via web research (10+ search queries)  

---

## Table of Contents

1. [Company Registry & Entity Data](#1-company-registry--entity-data)
   - 1.1 [OpenCorporates](#11-opencorporates)
   - 1.2 [GLEIF (Global LEI Foundation)](#12-gleif)
   - 1.3 [UK Companies House API](#13-uk-companies-house-api)
   - 1.4 [EU Open Data Portal / BRIS](#14-eu-open-data-portal--bris)
   - 1.5 [SEC EDGAR (Direct)](#15-sec-edgar-direct)
   - 1.6 [Wikidata](#16-wikidata)
2. [Beneficial Ownership & UBO Data](#2-beneficial-ownership--ubo-data)
   - 2.1 [OpenOwnership](#21-openownership)
   - 2.2 [FinCEN BOI Registry (US)](#22-fincen-boi-registry-us)
   - 2.3 [ICIJ Offshore Leaks Database](#23-icij-offshore-leaks-database)
3. [Sanctions, PEP & Risk Screening](#3-sanctions-pep--risk-screening)
   - 3.1 [OpenSanctions](#31-opensanctions)
   - 3.2 [OCCRP Aleph](#32-occrp-aleph)
4. [Patent & IP Data](#4-patent--ip-data)
   - 4.1 [USPTO PEDS API & Bulk Data](#41-uspto-peds-api--bulk-data)
   - 4.2 [EPO Open Patent Services (OPS)](#42-epo-open-patent-services-ops)
5. [Corporate Sustainability & ESG](#5-corporate-sustainability--esg)
   - 5.1 [UN Global Compact](#51-un-global-compact)
   - 5.2 [WikiRate](#52-wikirate)
6. [Company Identifiers & Mapping](#6-company-identifiers--mapping)
   - 6.1 [PermID (LSEG/Refinitiv)](#61-permid-lsegreginitiv)
   - 6.2 [OpenFIGI (Bloomberg)](#62-openfigi-bloomberg)
   - 6.3 [Data Commons (Google)](#63-data-commons-google)
7. [Commercial Platforms with Free Tiers](#7-commercial-platforms-with-free-tiers)
   - 7.1 [Crunchbase](#71-crunchbase)
   - 7.2 [LinkedIn API](#72-linkedin-api)
   - 7.3 [Sayari Graph](#73-sayari-graph)
8. [Summary Comparison Table](#8-summary-comparison-table)
9. [CSOAI GRCIN Integration Recommendations](#9-csoai-grcin-integration-recommendations)

---

## 1. Company Registry & Entity Data

---

### 1.1 OpenCorporates

| Attribute | Details |
|-----------|---------|
| **Name** | OpenCorporates |
| **URL** | https://opencorporates.com |
| **API Docs** | https://api.opencorporates.com |
| **What** | World's largest open database of company information — 220M+ company profiles across 140+ jurisdictions |
| **Format** | JSON, XML (API); CSV, bulk SFTP |
| **License** | Open Database License (ODbL); free for public-benefit use; commercial requires subscription |
| **API Access** | REST API with apiKey auth. Free tier: 50 calls/day (200/mo). Paid: from GBP 2,250/yr (500 calls/mo) to GBP 12,000/yr (5,000 calls/mo) |
| **Bulk Access** | Yes — bulk data delivery via SFTP, select jurisdictions, set delivery frequency (Enterprise tier) |
| **Coverage** | 140+ jurisdictions; company names, registration numbers, addresses, officers, status, filing history |
| **Limitations** | ~50% of registry sources no longer actively updated; no UBO data; no standardized financials; no data enrichment (website, description, tech stack) [^1463^] |
| **Free for** | Journalists, NGOs, academics, personal use. Corporations/financial institutions need subscription [^1479^] |
| **CSOAI Use Case** | **Primary** — global company entity resolution, cross-jurisdictional matching, basic KYB verification. Best as a foundational layer for company existence validation. |

**Key Endpoints**:
- `GET /companies/search` — search companies by name, jurisdiction
- `GET /companies/:jurisdiction/:company_number` — retrieve company profile
- `GET /officers/search` — search company officers
- `GET /filings` — access filing history

---

### 1.2 GLEIF (Global LEI Foundation)

| Attribute | Details |
|-----------|---------|
| **Name** | Global Legal Entity Identifier Foundation (GLEIF) |
| **URL** | https://www.gleif.org |
| **API/Search** | https://search.gleif.org (web); REST API available |
| **What** | The global LEI (Legal Entity Identifier) database — ISO 17442 standard identifiers for legal entities participating in financial transactions |
| **Format** | XML (Golden Copy), JSON (API), CSV |
| **License** | Open data — free to access, use, and redistribute |
| **API Access** | Free REST API for LEI search and retrieval. Rate limits apply but generous for most use cases. |
| **Bulk Access** | **Yes — completely free daily bulk downloads**: |
| | - Level 1 LEI-CDF Golden Copy (who is who) — daily |
| | - Level 2 RR-CDF Golden Copy (who owns whom — direct/ultimate parents) — daily |
| | - Level 2 Reporting Exceptions Golden Copy — daily |
| | - Delta files (8hr, 24hr, 7-day, 31-day intervals) — daily |
| **Download URLs** | `https://leidata-preview.gleif.org/api/v2/golden-copies/publishes/lei2/latest.xml` [^1472^] |
| **Coverage** | 2M+ LEIs covering legal entities in 200+ countries; includes legal name, address, registration authority, entity status, direct/ultimate parent LEIs |
| **CSOAI Use Case** | **Critical** — global legal entity identification backbone. LEI is the ISO standard for financial counterparty identification. Use Level 2 data for parent-subsidiary mapping. Bridge to other datasets via LEI crosswalks. |

**Key Features**:
- Challenge facility: submit corrections to LEI records
- LEI-to-OpenCorporates mapping files available [^1428^]
- LEI-to-OpenOwnership BODS mapping available [^1488^]
- GLEIF Golden Copy Files ensure no technical duplicates; all LEIs ever published included [^1473^]

---

### 1.3 UK Companies House API

| Attribute | Details |
|-----------|---------|
| **Name** | UK Companies House API |
| **URL** | https://developer.company-information.service.gov.uk |
| **What** | Official REST API for UK company registry data — free, comprehensive access |
| **Format** | JSON |
| **License** | Open Government Licence v3.0 — free for any purpose including commercial |
| **API Access** | **Completely free** REST API. HTTP Basic auth (API key as username, blank password). Rate limit: ~600 requests/5min per application [^1468^] |
| **Bulk Access** | Bulk data products available via data.gov.uk |
| **Coverage** | All 5M+ UK-registered companies: profile, filing history, officers, Persons with Significant Control (PSC/UBO), charges/mortgages, insolvency data, disqualifications |
| **CSOAI Use Case** | **Primary** — model API for how company registries should expose data. PSC data provides beneficial ownership. Filing history tracks corporate changes over time. Use as benchmark for other jurisdiction integrations. |

**Key Endpoints**:
- `GET /company/{company_number}` — company profile
- `GET /company/{company_number}/filing-history` — filings
- `GET /company/{company_number}/officers` — directors/officers
- `GET /company/{company_number}/persons-with-significant-control` — **UBO data**
- `GET /company/{company_number}/charges` — outstanding/satisfied charges
- `GET /search/companies` — company search
- `GET /search/officers` — officer search [^1461^] [^1475^]

---

### 1.4 EU Open Data Portal / BRIS

| Attribute | Details |
|-----------|---------|
| **Name** | EU Open Data Portal + BRIS (Business Registers Interconnection System) |
| **URLs** | https://data.europa.eu; https://e-justice.europa.eu/content_business_registers-106-en.do |
| **What** | EU-wide platform for cross-border company register searches; aggregated national open data |
| **Format** | Varies by member state (JSON, XML, CSV, RDF) |
| **License** | Open Data — varies by country; EU-wide commitment to open company data under High-Value Dataset (HVD) regulation |
| **API Access** | No unified EU-wide API yet. Each national register provides its own API. BRIS web interface for cross-border lookups. |
| **Bulk Access** | Via national open data portals (e.g., data.gov.ie, data.gouv.fr, govdata.de) |
| **Coverage** | 27 EU member states + Iceland, Liechtenstein, Norway. Basic data: company name, legal form, registered office, registration number, status (active/liquidated). Some countries provide full open data (Ireland leads); others limited [^1545^] |
| **CSOAI Use Case** | **Secondary** — EU entity coverage. Use BRIS for cross-border branch/merger lookups. Harvest individual national APIs where available (Ireland, Denmark, Netherlands particularly open). |

**Key National Open Registries**:
| Country | Portal | Open Data Level |
|---------|--------|----------------|
| Ireland | opendata.cro.ie | Full — JSON, CSV, API [^1478^] |
| Denmark | cvr.dk | Full — via OpenOwnership BODS tools |
| Slovakia | rpvs.gov.sk | Full — via OpenOwnership BODS tools |
| UK | Companies House API | Full — REST API |
| Netherlands | kvk.nl | Partial |
| France | data.gouv.fr | Partial |
| Germany | handelsregister.de | Limited |

---

### 1.5 SEC EDGAR (Direct)

| Attribute | Details |
|-----------|---------|
| **Name** | SEC EDGAR (Electronic Data Gathering, Analysis, and Retrieval) |
| **URL** | https://www.sec.gov/edgar |
| **API Docs** | https://www.sec.gov/edgar/sec-api-documentation |
| **What** | US SEC's official public database of all company and individual filings — the single most authoritative source of verified US business registration and corporate disclosure data |
| **Format** | JSON (API), XML, XBRL, HTML, TXT |
| **License** | Public domain — US government data |
| **API Access** | **Completely free** — no API key required for most endpoints. Rate limits: 10 requests/second. Full-text search API, filing search API, company search API [^1539^] |
| **Bulk Access** | Daily bulk index files (master.idx), FTP archive (historical), JSON feed APIs |
| **Coverage** | 20M+ filings since 1993; 800,000+ filing entities. All SEC-regulated entities: public companies, funds, advisors, insiders. Includes: CIK, EIN, SIC codes, addresses, fiscal year end, state of incorporation, financial statements (10-K, 10-Q), insider trading (Forms 3/4/5), institutional holdings (13F), subsidiaries, auditor info [^1483^] |
| **CSOAI Use Case** | **Primary** — US public company entity master, financial statements, insider trading, institutional ownership. Use XBRL data for structured financials. Track corporate changes via filing history. |

**Key Free API Endpoints**:
- `https://www.sec.gov/Archives/edgar/daily-index/` — daily filing indices
- `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` — XBRL company facts
- `https://data.sec.gov/submissions/CIK##########.json` — company submissions
- `https://efts.sec.gov/LATEST/search-index` — full-text search [^1541^]

**Third-Party Enhancement**: `sec-api.io` — commercial wrapper with free tier, Python SDK, structured JSON for all filings, bulk datasets [^1544^]

---

### 1.6 Wikidata

| Attribute | Details |
|-----------|---------|
| **Name** | Wikidata |
| **URL** | https://www.wikidata.org |
| **API Docs** | https://www.wikidata.org/w/api.php |
| **What** | Structured knowledge graph from Wikipedia — contains millions of company/business entities with properties |
| **Format** | JSON (API), RDF (dumps), SPARQL query results |
| **License** | **CC0 (Public Domain)** — most permissive license, no attribution required |
| **API Access** | Free MediaWiki Action API (`wbsearchentities`, up to 50 entities/request). SPARQL endpoint (`query.wikidata.org`) for complex queries. Free, no API key required for most uses. Enterprise API available with SLA. [^1440^] |
| **Bulk Access** | Full RDF dumps available for download (~100GB+ compressed) |
| **Coverage** | Millions of entities: companies (Q4830453), organizations, people. Properties include: ISNI, GRID, LEI, official name, short name, country, revenue, founded date, employees, headquarters, parent organization, subsidiaries, industry |
| **CSOAI Use Case** | **Secondary** — enrichment layer for notable companies. Cross-reference company IDs (ISNI, GRID, LEI). Use SPARQL for complex queries (e.g., "all energy companies in Africa with revenue > $100M") [^1453^] |

**Key SPARQL Query Pattern**:
```sparql
SELECT ?business ?businessLabel ?countryLabel ?revenue_usd
WHERE {
  ?business wdt:P31/wdt:P279* wd:Q4830453 .
  ?business wdt:P17 ?country .
  ?business p:P2139 ?statement .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
```

**Enterprise API**: Wikimedia Enterprise offers on-demand item lookup, property lookup, labels list, and real-time streaming updates [^1446^]

---

## 2. Beneficial Ownership & UBO Data

---

### 2.1 OpenOwnership

| Attribute | Details |
|-----------|---------|
| **Name** | OpenOwnership |
| **URL** | https://www.openownership.org |
| **Register** | https://register.openownership.org |
| **What** | Global beneficial ownership transparency organization — aggregates BO data from national registers, promotes BODS standard, provides searchable register |
| **Format** | BODS (Beneficial Ownership Data Standard) JSON, CSV, SQLite, PostgreSQL, Parquet |
| **License** | Open licence — all datasets free to reuse |
| **API Access** | Register website for search; BODS data analysis tools with SQL query support; datasets downloadable in multiple formats. Connected to BigQuery and Datasette for analysis. [^1490^] |
| **Bulk Access** | Full register data downloadable as combined BODS JSON file. National datasets: Denmark CVR, Slovakia RPVS, UK PSC, Latvia Register of Enterprises, GLEIF mapped data. [^1486^] |
| **Coverage** | 27M+ beneficial ownership records for 9.6M companies globally; data from national registers in 140 jurisdictions (actively republishing from Denmark, Slovakia, UK, Armenia). Each country page shows BO register availability and access rules. [^1428^] |
| **CSOAI Use Case** | **Critical** — primary source for structured beneficial ownership data. BODS is the emerging global standard. Use for UBO discovery, ownership chain visualization, cross-jurisdictional BO analysis. |

**Key Tools**:
- **Open Ownership Register**: Search by entity or beneficial owner; download BODS JSON; view as graph [^1486^]
- **BODS Data Analysis Tools**: Download/analyze BO data in CSV, SQLite, PostgreSQL, Parquet, JSON [^1490^]
- **BODS Data Review Tool**: Validate BO datasets against standard
- **BODS Data Visualiser**: Generate ownership structure diagrams
- **Data Generator**: Create BODS-compliant data

**GLEIF Integration**: 145,000+ entities with LEIs mapped in BODS datasets — enables linking BO data to global LEI network [^1488^]

---

### 2.2 FinCEN BOI Registry (US)

| Attribute | Details |
|-----------|---------|
| **Name** | FinCEN Beneficial Ownership Information (BOI) Registry |
| **URL** | https://boiefiling.fincen.gov |
| **What** | US Corporate Transparency Act registry of beneficial ownership information for reporting companies |
| **Format** | Not publicly accessible as open data (restricted access) |
| **License** | Restricted — access limited to authorized entities |
| **API Access** | No public API. Access restricted to: federal/state/local/tribal officials for national security/intelligence/law enforcement; certain foreign officials; financial institutions (with reporting company consent) [^1543^] |
| **Bulk Access** | Not available as open data |
| **Coverage** | All "reporting companies" in the US (corporations, LLCs, similar entities). As of 2025 interim rule, primarily foreign reporting companies registered to do business in the US must file. |
| **CSOAI Use Case** | **Note: Not open data** — but important to track. If CSOAI has authorized entity status, could request access. Otherwise, use UK PSC register, OpenOwnership, and state-level UBO data as alternatives. Monitor for future open data policy changes. |

---

### 2.3 ICIJ Offshore Leaks Database

| Attribute | Details |
|-----------|---------|
| **Name** | ICIJ Offshore Leaks Database |
| **URL** | https://offshoreleaks.icij.org |
| **What** | Database of 810,000+ offshore entities from Pandora Papers, Paradise Papers, Bahamas Leaks, Panama Papers, and Offshore Leaks investigations |
| **Format** | Open Database License (ODbL) for database; CC-BY-SA for contents |
| **License** | Open Database License — cite ICIJ when using data. Free to download and explore. |
| **API Access** | Web search interface. Raw database available for download as SQLite file. |
| **Bulk Access** | **Yes — full raw database downloadable** from https://offshoreleaks.icij.org/pages/database [^1464^] |
| **Coverage** | 810,000+ offshore entities; 200+ countries/territories; records spanning 80+ years up to 2020. Links people and companies across jurisdictions. Includes: entity names, incorporation dates, jurisdictions, officers, addresses, intermediaries |
| **CSOAI Use Case** | **Critical** — offshore/shell company detection, identifying hidden ownership structures, cross-referencing with sanctions lists and customer data. Use OpenScreening (Linkurious) for combined ICIJ + OpenSanctions + OpenOwnership screening. [^1465^] |

---

## 3. Sanctions, PEP & Risk Screening

---

### 3.1 OpenSanctions

| Attribute | Details |
|-----------|---------|
| **Name** | OpenSanctions |
| **URL** | https://www.opensanctions.org |
| **API** | https://www.opensanctions.org/api/ |
| **What** | Freely accessible, open-source international database of persons and companies of political, criminal, or economic interest — sanctions lists, PEPs, watchlists, crime/wanted, debarment |
| **Format** | JSON (API), JSONL, CSV, XML, Senzing format, FollowTheMoney (FtM) |
| **License** | Open data licence — free for non-commercial use; commercial requires data license or pay-as-you-go API |
| **API Access** | Free for non-commercial (journalists, NGOs, academics). Pay-as-you-go for commercial: EUR 0.10/call. Business email signup gets 30-day free trial. Free API keys available for journalists and non-profits. On-premises option available. [^1445^] |
| **Bulk Access** | **Yes — completely free bulk download** without login or API key. JSON and CSV formats. Delta updates available. Historical data from July 2021. Latest at: `https://data.opensanctions.org/datasets/latest/default/entities.ftm.json` [^1481^] |
| **Coverage** | 320+ dataset collections from 250+ official watchlists: OFAC SDN, EU FSF, UK HMT, UN Security Council, Australia DFAT, Canada SEMA + dozens of national lists. 280,000+ entities consolidated. 681,011 PEP entries (28 countries + EU + global). Includes companies, persons, vessels, aircraft, crypto wallets. Updated several times daily. [^1441^] |
| **CSOAI Use Case** | **Critical** — sanctions screening, PEP detection, supplier risk, customer due diligence. Bulk downloads enable self-hosted screening. API for real-time integration. Cross-reference with company registries for comprehensive risk profiles. |

**Key Features**:
- Entity deduplication across 250+ sources
- Fuzzy name matching across alphabets (Cyrillic, Latin, Arabic)
- Relationship mapping (family, associates, company ownership)
- Strong identifiers: passport, INN, OGRN, LEI, IMO, registration numbers
- Microsoft Power Automate/Power Apps connector available [^1450^]
- Open-source code on GitHub

---

### 3.2 OCCRP Aleph

| Attribute | Details |
|-----------|---------|
| **Name** | OCCRP Aleph (now Aleph Pro) |
| **URL** | https://aleph.occrp.org |
| **GitHub** | https://github.com/alephdata |
| **What** | Investigative data platform for "following the money" — consolidates corporate registries, financial records, leaks, legal filings into searchable, cross-referable database |
| **Format** | Web UI, API (JSON), entity exports |
| **License** | Free for public interest use. New Aleph Pro will remain free for nonprofit journalists forever; at/below cost for other public interest groups. Not open-source (moving to open license). OpenAleph fork remains open-source. [^1474^] |
| **API Access** | Aleph API client for Python (`alephclient`) supports bulk entity and document upload. Extended access requires application approval (typically within 72 hours). |
| **Bulk Access** | 400M+ documents/entities from 200+ datasets. Users can upload own documents for cross-referencing. |
| **Coverage** | 180+ countries; focus on Central/Eastern Europe, Sub-Saharan Africa, South America, offshore jurisdictions. Includes: company registries, government filings, property records, procurement data, leaked archives. Multilingual: English, Spanish, Russian, German, Arabic, French. OCR for scanned documents. [^1466^] |
| **CSOAI Use Case** | **Secondary** — investigative research, cross-referencing company networks, "following the money" for complex ownership structures. Use for deep-dive investigations on high-risk entities. Apply for extended access to protected datasets. |

**Key Capabilities**:
- Entity extraction from unstructured documents
- Cross-referencing: bulk compare persons/companies against all datasets
- Network visualization
- Alerts for new data matching interests
- Integration with FollowTheMoney data model

---

## 4. Patent & IP Data

---

### 4.1 USPTO PEDS API & Bulk Data

| Attribute | Details |
|-----------|---------|
| **Name** | USPTO Patent Examination Data System (PEDS) |
| **URL** | https://ped.uspto.gov |
| **What** | USPTO's official API for patent bibliographic data, patent term data, examiner info, attorney/representative info, applicant info |
| **Format** | JSON, XML |
| **License** | Public domain — US government data |
| **API Access** | **Completely free** REST API (v1.6.0). No registration required. Serves 9M+ patent records. Supports delta dataset requests by date range. Filterable by attorney docket number. Daily updates. [^1483^] |
| **Bulk Access** | USPTO Bulk Data Storage System (BDSS): bulk XML downloads of all patents, applications, assignments, publications, classification data |
| **Coverage** | All US patents and published patent applications since 1790; 9M+ records in PEDS |
| **CSOAI Use Case** | **Secondary** — IP portfolio analysis, technology sector mapping, competitor R&D tracking. Use for understanding company innovation profiles. |

---

### 4.2 EPO Open Patent Services (OPS)

| Attribute | Details |
|-----------|---------|
| **Name** | European Patent Office Open Patent Services |
| **URL** | https://developers.epo.org |
| **What** | EPO's official API for patent data — bibliographic data, claims, description, abstract, full text, legal status, INPADOC families, CPC classification |
| **Format** | XML, JSON |
| **License** | Free for non-commercial use up to 4GB/month |
| **API Access** | **Free registration** required. OAuth2 Consumer Key + Consumer Secret. Non-paying access: up to 4GB data/month (usually sufficient). [^1480^] [^1439^] |
| **Bulk Access** | Via OPS API with fair use policy. Bulk XML downloads also available from EPO Open Patent Data portal. |
| **Coverage** | 140M+ patent documents from 100+ countries; INPADOC global patent family data; legal status events; EPO Register data |
| **CSOAI Use Case** | **Secondary** — global patent coverage (broader than USPTO). INPADOC families link related patents across jurisdictions. Use for global IP portfolio tracking. |

---

## 5. Corporate Sustainability & ESG

---

### 5.1 UN Global Compact

| Attribute | Details |
|-----------|---------|
| **Name** | UN Global Compact — Communication on Progress (CoP) Data |
| **URL** | https://unglobalcompact.org |
| **Data Viz** | https://unglobalcompact.org/participation/report/cop-data |
| **What** | World's largest corporate sustainability initiative — 20,000+ participants in 160+ countries report on human rights, labor, environment, anti-corruption |
| **Format** | Web visualization; downloadable reports; benchmarking data |
| **License** | Free for non-commercial use; cite UN Global Compact as source |
| **API Access** | No public API. Data accessible via web visualization tools for 2023, 2024, 2025 CoP questionnaires. |
| **Bulk Access** | No bulk download API. Public data visualization tools available. Participant list searchable on website. |
| **Coverage** | 20,000+ business participants across 160+ countries; data on SDG alignment, Ten Principles implementation, sustainability practices |
| **CSOAI Use Case** | **Tertiary** — ESG risk assessment, supply chain sustainability screening. Check if business partners are UNGC participants and their CoP status. |

---

### 5.2 WikiRate

| Attribute | Details |
|-----------|---------|
| **Name** | WikiRate |
| **URL** | https://wikirate.org |
| **API Docs** | https://wikirate.org/use_the_API |
| **What** | Open ESG data platform — wiki-style collaborative platform collecting corporate sustainability data |
| **Format** | JSON (REST API) |
| **License** | Open data — wiki-style contributions, open licence |
| **API Access** | Free REST API. Sign up for API key. Query parameter or X-API-Key header auth. [^1487^] |
| **Bulk Access** | Via API; datasets downloadable |
| **Coverage** | Millions of ESG data points on corporate sustainability performance: companies, metrics, answers, projects, datasets, topics |
| **CSOAI Use Case** | **Tertiary** — ESG data enrichment, sustainability metrics for company profiles. Community-driven ESG ratings as alternative/complement to commercial ESG providers. |

---

## 6. Company Identifiers & Mapping

---

### 6.1 PermID (LSEG/Refinitiv)

| Attribute | Details |
|-----------|---------|
| **Name** | PermID (Permanent Identifier) |
| **URL** | https://permid.org |
| **What** | Open, permanent, universal identifiers for organizations, persons, instruments, quotes — offered by LSEG (London Stock Exchange Group) |
| **Format** | JSON, RDF |
| **License** | **Free and open license** — no restrictions on use or redistribution |
| **API Access** | Free API key registration. Entity search API, record matching API, intelligent tagging API. PermID lookup (no token required). [^1546^] |
| **Bulk Access** | Bulk download of entity master files available |
| **Coverage** | Primarily publicly listed companies and financial instruments. PermID is a reference data spine for creating unique organizational identifiers. [^1540^] |
| **CSOAI Use Case** | **Secondary** — identifier crosswalk layer. Map internal company IDs to PermID, then link to other LSEG/Refinitiv datasets. Use record matching API to disambiguate company names. |

---

### 6.2 OpenFIGI (Bloomberg)

| Attribute | Details |
|-----------|---------|
| **Name** | OpenFIGI |
| **URL** | https://openfigi.com |
| **API Docs** | https://www.openfigi.com/api/documentation |
| **What** | Free, open data standard for identifying financial instruments globally across all asset classes — FIGI (Financial Instrument Global Identifier) |
| **Format** | JSON (REST API) |
| **License** | **MIT Open Source License** — free to use, free to issue, free to redistribute. No restrictions. |
| **API Access** | **Completely free** — no daily/weekly/monthly limitations. Higher rate limits with free API key. Unauthenticated: lower rate limit. |
| | - Mapping API: map third-party identifiers to FIGIs |
| | - Search/Filter API: keyword search for instruments |
| | - Rate limit: up to 25,000 instruments/minute with API key |
| **Bulk Access** | Bulk mapping services for registered users |
| **Coverage** | All global asset classes: equities, bonds, options, futures, derivatives, loans, crypto, government securities, municipals. 100M+ instruments. [^1549^] [^1553^] |
| **CSOAI Use Case** | **Secondary** — securities identification layer. Map company securities to FIGI for standardized instrument tracking. Cross-reference with sanctions screening (OpenSanctions includes FIGI-mapped sanctioned securities). [^1558^] |

---

### 6.3 Data Commons (Google)

| Attribute | Details |
|-----------|---------|
| **Name** | Google Data Commons |
| **URL** | https://datacommons.org |
| **API Docs** | https://docs.datacommons.org/api |
| **What** | Open-source knowledge graph unifying public data from diverse sources (census, World Bank, UN, CDC, BLS, etc.) — includes company/organization data |
| **Format** | JSON (REST API), Python client, Google Sheets add-on |
| **License** | Free for educational, academic, journalistic research. Enterprise via BigQuery Analytics Hub. |
| **API Access** | Free API key registration. REST API v2, Python client library (`datacommons-client`), R client. [^1547^] [^1560^] |
| **Bulk Access** | BigQuery integration for large-scale analysis; full knowledge graph dumps |
| **Coverage** | 3B+ time series across 100,000+ variables about 2.9M places. Company data includes S&P 500, economic indicators tied to organizations. Uses schema.org for standardization. |
| **CSOAI Use Case** | **Tertiary** — macro-economic context for company risk assessment. Link company headquarters locations to regional economic/social indicators. |

---

## 7. Commercial Platforms with Free Tiers

---

### 7.1 Crunchbase

| Attribute | Details |
|-----------|---------|
| **Name** | Crunchbase |
| **URL** | https://www.crunchbase.com |
| **API Docs** | https://data.crunchbase.com/docs |
| **What** | Startup/company database with funding, investors, acquisitions, leadership data |
| **Format** | JSON (REST API) |
| **License** | Proprietary; attribution required ("Powered by Crunchbase") |
| **API Access** | **Free Basic API no longer offered to new users** (as of 2026). Existing keys may still work. Paid: $49/mo (Basic, limited), $99/mo (Pro), Enterprise (custom). Rate limit: 200 calls/min on all plans. [^1435^] |
| **Bulk Access** | Pro plan: full search but no export. Business: 5K rows export/month. |
| **Coverage** | Primarily startups and tech companies; funding rounds, investors, IPOs, acquisitions, key people. Limited coverage of non-tech/sMEs. |
| **CSOAI Use Case** | **Tertiary** — startup/private company funding intelligence. Limited value for compliance/GRC due to narrow coverage and proprietary restrictions. Consider OpenCorporates + national registries as free alternatives. |

---

### 7.2 LinkedIn API

| Attribute | Details |
|-----------|---------|
| **Name** | LinkedIn API |
| **URL** | https://developer.linkedin.com |
| **What** | Professional network data — company profiles, people profiles, jobs, content |
| **Format** | JSON (REST API) |
| **License** | Proprietary; strict Partner Program requirements |
| **API Access** | **Extremely limited free tier**. Free: "Sign In with LinkedIn" + basic profile only (100 calls/day). Company/People Profile APIs require Partner Program approval (3-6 months, $7,200-$50,000+/yr). Marketing Developer Platform, Recruiter API, Sales Navigator API all require expensive partnerships. [^1432^] [^1437^] |
| **Bulk Access** | Not available via official API |
| **Coverage** | 1B+ members; company pages with employee counts, industry, locations, posts |
| **CSOAI Use Case** | **Tertiary / Limited** — official API nearly useless for data enrichment. Third-party alternatives exist but terms of service considerations apply. Not recommended for compliance use cases. |

---

### 7.3 Sayari Graph

| Attribute | Details |
|-----------|---------|
| **Name** | Sayari Graph |
| **URL** | https://sayari.com |
| **API Docs** | https://docs.sayari.com |
| **What** | Commercial investigative data platform — corporate ownership, supply chain risk, trade data, global company graph |
| **Format** | JSON (REST API), CSV, XLS, PDF, Parquet exports |
| **License** | Commercial subscription; annual model |
| **API Access** | RESTful API with credit-based pricing. Searches free; charged for viewing full entity profiles/documents. 10 API endpoints. |
| **Bulk Access** | Export in CSV, XLS, PDF, JSON, Parquet |
| **Coverage** | Global — 180+ countries. Corporate registries, property records, trade data, sanctions, UBO data. Strong coverage of offshore centers (BVI, Bermuda, Luxembourg, UAE). Graph-format database with entity resolution. [^1551^] |
| **Free Tier** | Free trial: 1-2 months with unlimited search and global data access, onboarding/training included |
| **Price** | ~$19,000/yr per license (UK gov pricing) [^1552^] |
| **CSOAI Use Case** | **Potential paid tier** — if budget allows, best-in-class for global corporate network analysis, trade data integration, and entity resolution. Evaluate against free alternatives (OpenCorporates + OpenOwnership + OpenSanctions + Aleph). |

---

## 8. Summary Comparison Table

| # | Source | Type | Free? | API? | Bulk? | Global? | UBO? | Sanctions? | CSOAI Priority |
|---|--------|------|-------|------|-------|---------|------|------------|----------------|
| 1 | **OpenCorporates** | Company Registry | Partial (search free) | Yes (paid) | Yes (paid) | 140+ jurisdictions | No | No | **P1 — Primary** |
| 2 | **GLEIF** | LEI Database | **Yes** | **Yes** | **Yes (daily)** | 200+ countries | Partial (parents) | No | **P1 — Critical** |
| 3 | **UK Companies House** | National Registry | **Yes** | **Yes** | **Yes** | UK only | **Yes (PSC)** | No | **P1 — Primary** |
| 4 | **EU Open Data / BRIS** | Multi-National | **Yes** | Varies | Varies | EU + EEA | Varies | No | **P2 — Secondary** |
| 5 | **SEC EDGAR** | Regulator Filings | **Yes** | **Yes** | **Yes** | US only | Partial | Partial | **P1 — Primary** |
| 6 | **Wikidata** | Knowledge Graph | **Yes** | **Yes** | **Yes (dumps)** | Global | Partial | Partial | **P2 — Enrichment** |
| 7 | **OpenOwnership** | UBO Registry | **Yes** | Tools available | **Yes (BODS)** | 140 jurisdictions | **Yes** | No | **P1 — Critical** |
| 8 | **FinCEN BOI** | US UBO Registry | Restricted | No | No | US only | **Yes** | No | **P3 — Monitor** |
| 9 | **ICIJ Offshore Leaks** | Investigative DB | **Yes** | Web search | **Yes (SQLite)** | 200+ countries | Partial | No | **P1 — Critical** |
| 10 | **OpenSanctions** | Sanctions/PEP | **Yes (non-comm)** | **Yes** | **Yes** | Global (250+ lists) | Partial | **Yes** | **P1 — Critical** |
| 11 | **OCCRP Aleph** | Investigative | **Yes (public interest)** | **Yes** | Via upload | 180+ countries | Partial | Partial | **P2 — Secondary** |
| 12 | **USPTO PEDS** | Patent Data | **Yes** | **Yes** | **Yes** | US only | No | No | **P3 — IP Tracking** |
| 13 | **EPO OPS** | Patent Data | **Yes (4GB/mo)** | **Yes** | **Yes** | 100+ countries | No | No | **P3 — IP Tracking** |
| 14 | **UN Global Compact** | ESG Registry | **Yes** | No | No | 160+ countries | No | No | **P3 — ESG** |
| 15 | **WikiRate** | ESG Data | **Yes** | **Yes** | Via API | Global | No | No | **P3 — ESG** |
| 16 | **PermID** | Identifiers | **Yes** | **Yes** | **Yes** | Listed companies | No | No | **P2 — ID Mapping** |
| 17 | **OpenFIGI** | Security IDs | **Yes** | **Yes (unlimited)** | **Yes** | Global instruments | No | No | **P2 — ID Mapping** |
| 18 | **Data Commons** | Knowledge Graph | **Yes** | **Yes** | Via BigQuery | Global | No | No | **P3 — Context** |
| 19 | Crunchbase | Startup Data | No (paid) | Paid only | Limited | Global (tech bias) | No | No | P4 — Limited |
| 20 | LinkedIn API | Professional | Barely free | Very restricted | No | Global | No | No | P4 — Limited |

---

## 9. CSOAI GRCIN Integration Recommendations

### Tier 1: Core Free Data Stack (Implement Immediately)

| Priority | Source | Role in GRCIN | Integration Approach |
|----------|--------|---------------|---------------------|
| **Critical** | **GLEIF** | Global legal entity ID backbone | Daily Golden Copy + Delta ingestion. LEI as primary entity key. Level 2 RR-CDF for parent-child relationships. |
| **Critical** | **OpenSanctions** | Sanctions/PEP/watachlist screening | Daily bulk JSON download (`data.opensanctions.org/datasets/latest/`). Delta updates every 30 min. Match against customer/supplier entities. |
| **Critical** | **OpenOwnership** | Beneficial ownership data | BODS JSON bulk download. Cross-reference with LEI via GLEIF-OO mapping. Ownership chain visualization. |
| **Critical** | **ICIJ Offshore Leaks** | Offshore/shell company detection | Download full SQLite database. Cross-match customer entities against offshore entity list. |
| **Primary** | **OpenCorporates** | Global company registry aggregation | API for real-time lookups (500 calls/mo on Essentials). Bulk data for major jurisdictions. Bridge to national registries. |
| **Primary** | **UK Companies House** | Model national registry integration | Free REST API for UK entity enrichment. PSC data for UK UBO. Pattern for integrating other national APIs. |
| **Primary** | **SEC EDGAR** | US public company data | Direct API + XBRL parsing for financials. CIK-EIN-SIC crosswalk. Insider trading monitoring via Forms 3/4/5. |

### Tier 2: Enrichment & Crosswalk Layer

| Priority | Source | Role in GRCIN | Integration Approach |
|----------|--------|---------------|---------------------|
| **Secondary** | **Wikidata** | Entity enrichment, cross-IDs | SPARQL queries for ISNI, GRID, revenue, employee counts. CC0 license = zero legal friction. |
| **Secondary** | **PermID** | Listed company identifier mapping | Free API for record matching. Map internal entities to PermID for financial instrument linkage. |
| **Secondary** | **OpenFIGI** | Security identifier standardization | Free mapping API for CUSIP/ISIN/ticker to FIGI. MIT license. |
| **Secondary** | **OCCRP Aleph** | Deep investigative research | Apply for extended access. Use for complex ownership investigations and cross-border corruption tracing. |
| **Secondary** | **EU National APIs** | EU entity coverage | Harvest Ireland (full), Denmark, Slovakia via OpenOwnership BODS tools. Integrate additional national APIs progressively. |

### Tier 3: Specialized & Monitoring

| Priority | Source | Role in GRCIN | Integration Approach |
|----------|--------|---------------|---------------------|
| **Tertiary** | **USPTO PEDS + EPO OPS** | IP portfolio tracking | Patent API integration for innovation-based risk assessment. |
| **Tertiary** | **UN Global Compact + WikiRate** | ESG screening | Participant list checks, ESG metrics for supplier evaluation. |
| **Tertiary** | **Data Commons** | Regional economic context | Link company HQ locations to regional indicators for geographic risk. |
| **Monitor** | **FinCEN BOI** | US beneficial ownership | Track for future open data policy. Apply for authorized access if eligible. |

### Recommended Architecture

```
                    ┌─────────────────────────────────────┐
                    │         CSOAI GRCIN System          │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
    ┌─────▼─────┐            ┌────────▼────────┐        ┌────────▼────────┐
    │  ENTITY   │◄──────────►│  RISK/SCREENING │        │  OWNERSHIP/UBO  │
    │  MASTER   │            │                 │        │                 │
    └─────┬─────┘            └────────┬────────┘        └────────┬────────┘
          │                           │                           │
    ┌─────┴───────────────────────────┴───────────────────────────┴─────┐
    │                      DATA INTEGRATION LAYER                       │
    ├─────────────┬─────────────┬─────────────┬─────────────┬───────────┤
    │   GLEIF     │ OpenSanctions│OpenOwnership│ OpenCorporates│  ICIJ    │
    │   (LEI)     │ (Sanctions)  │    (UBO)    │  (Registry)  │ (Offshore)│
    ├─────────────┼─────────────┼─────────────┼─────────────┼───────────┤
    │ UK Co House │  SEC EDGAR   │  Wikidata   │   PermID    │ OpenFIGI  │
    │   (Model)   │  (US Public) │ (Enrichment)│  (Listed)   │(Securities)│
    └─────────────┴─────────────┴─────────────┴─────────────┴───────────┘
    ┌───────────────────────────────────────────────────────────────────┐
    │                    CROSSWALK & RESOLUTION                         │
    │         LEI ↔ OpenCorporates ID ↔ PermID ↔ Wikidata QID         │
    │            GLEIF-OO mapping │ OpenFIGI securities mapping         │
    └───────────────────────────────────────────────────────────────────┘
```

### Cost Summary

| Tier | Sources | Annual Cost |
|------|---------|-------------|
| **Core Free Stack** | GLEIF, OpenSanctions, OpenOwnership, ICIJ, SEC EDGAR (direct), UK Companies House, Wikidata | **$0** |
| **Recommended Paid** | OpenCorporates Essentials API, OpenSanctions commercial API (if needed) | ~$3,000-5,000 |
| **Optional Premium** | Sayari Graph, sec-api.io (SEC wrapper), additional OC jurisdictions | ~$20,000-50,000 |

---

## Source Citations

[^1428^] GLEIF and Open Ownership Register ID-to-LEI relationship — https://www.gleif.org/en/lei-data/lei-mapping/download-oc-to-lei-relationship-files/open-ownership-register-id-to-lei-relationship

[^1429^] Open Ownership — Bellingcat Toolkit — https://bellingcat.gitbook.io/toolkit/more/all-tools/open-ownership

[^1432^] LinkedIn API Free Tier — https://www.unipile.com/is-the-linkedin-api-free/

[^1435^] Crunchbase API 2026 — https://dev.to/agenthustler/crunchbase-api-in-2026-free-tier-gone

[^1437^] LinkedIn Official API vs Unofficial — https://linkdapi.com/blog/linkedin-api-vs-unofficial-apis

[^1439^] EPO OPS API Registration — https://patent-client.readthedocs.io/en/latest/getting_started.html

[^1440^] Wikidata Data Access — https://www.wikidata.org/wiki/Wikidata:Data_access

[^1441^] OpenSanctions Entities Scraper — https://apify.com/parseforge/opensanctions-entities-scraper

[^1443^] OpenSanctions — Bellingcat Toolkit — https://bellingcat.gitbook.io/toolkit/more/all-tools/opensanctions

[^1445^] OpenSanctions API Pricing — https://www.opensanctions.org/api/

[^1446^] Wikidata API — Wikimedia Enterprise — https://enterprise.wikimedia.com/project-data/wikidata-api/

[^1450^] OpenSanctions Microsoft Connector — https://learn.microsoft.com/en-us/connectors/opensanctions/

[^1453^] Company Data Using Wikidata — https://dev.to/minchulkim87/company-data-using-wikidata-n19

[^1461^] UK Companies House API — Parse.bot — https://parse.bot/marketplace/companieshouse-gov-uk-api

[^1463^] OpenCorporates Alternatives — https://zephira.ai/8-opencorporates-alternatives-for-kyb-company-registry-lookup/

[^1464^] ICIJ Offshore Leaks Database — https://offshoreleaks.icij.org/

[^1465^] ICIJ Offshore Leaks How to Use — https://offshoreleaks.icij.org/pages/howtouse

[^1466^] OCCRP Aleph Guide — https://gijn.org/resource/using-aleph/

[^1468^] Companies House API Developer Guide — https://www.thecompanywarehouse.co.uk/blog/companies-house-api

[^1470^] OpenCorporates API Guide — Bellingcat — https://www.bellingcat.com/resources/2023/08/24/following-the-money-a-beginners-guide-to-using-the-opencorporates-api/

[^1472^] GLEIF Download URLs (GitHub) — https://gist.github.com/m8d3/6a188311e5f0c667854d2e64dd567046

[^1473^] GLEIF Golden Copy Download — https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy

[^1474^] OCCRP Aleph Pro Announcement — https://www.occrp.org/en/announcement/occrp-announces-a-new-chapter-for-its-investigative-data-platform-aleph-pro

[^1475^] Companies House Python API — https://dlthub.com/context/source/companies-house

[^1476^] OpenCorporates Pricing — https://opencorporates.com/pricing/

[^1478^] Ireland EU Open Data — https://derilinx.com/news-ireland-leads-the-the-eu-in-sharing-national-companies-registration-data-as-open-data/

[^1479^] OpenCorporates — Bellingcat Toolkit — https://bellingcat.gitbook.io/toolkit/more/all-tools/opencorporates

[^1480^] EPO OPS Go Client — https://github.com/patent-dev/epo-ops

[^1481^] OpenSanctions Bulk Download — https://www.opensanctions.org/faq/150/downloading/

[^1483^] USPTO PEDS API — https://www.bhfs.com/insight/patent-system-stakeholders-underutilizing-open-data-resources-at-the-uspto/

[^1486^] Open Ownership Tools Guide — https://oo.hacdn.io/media/documents/oo-guidance-how-to-use-open-ownerships-tools-2023-07.pdf

[^1487^] WikiRate API — https://wikirate.org/use_the_API

[^1488^] Open Ownership Register ID-to-LEI — https://www.gleif.org/en/lei-data/lei-mapping/download-oc-to-lei-relationship-files/open-ownership-register-id-to-lei-relationship

[^1490^] Open Ownership BODS Analysis Tools — https://www.openownership.org/en/publications/beneficial-ownership-data-analysis-tools/user-guidance/

[^1539^] SEC EDGAR Company Data Scraper — https://apify.com/scrapyspider/sec-gov-compony-data-scp

[^1540^] PermID Open Data — OpenSanctions — https://www.opensanctions.org/datasets/permid/

[^1543^] FinCEN BOI Reporting — Moody's — https://www.moodys.com/web/en/us/kyc/resources/insights/7-things-to-know-about-us-beneficial-ownership-information-boi-reporting.html

[^1544^] SEC EDGAR Filings API (sec-api.io) — https://sec-api.io/

[^1545^] BRIS Business Register Interconnection System — https://www.forumaic.org/wp-content/uploads/2017/11/SCIPIONI.pdf

[^1546^] PermID FAQ — https://permid-qa.refinitiv.com/faq

[^1547^] Data Commons Python API — https://www.kdnuggets.com/accessing-data-commons-with-the-new-python-api-client

[^1549^] OpenFIGI API Documentation — Bloomberg — https://assets.bwbx.io/documents/users/iqjWHBFdfxIU/rean5_8ShYZw/v0

[^1551^] Sayari Graph User Guide — https://d3bql97l1ytoxn.cloudfront.net/app_resources/298174/documentation/878305_en.pdf

[^1553^] OpenFIGI API Docs — https://www.openfigi.com/api/documentation

[^1558^] OpenFIGI Securities in OpenSanctions — https://www.opensanctions.org/datasets/openfigi/

[^1560^] Data Commons Python Client — Google Developers — https://developers.googleblog.com/en/pythondatacommons/

---

*Document generated: 2026-07 | CSOAI Business Intelligence Research*
