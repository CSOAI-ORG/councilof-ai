# Free/Open Data Sources for CSOAI Hives

> **Research Date**: 2025-06  
> **Purpose**: Catalog free/open APIs and bulk download sources for academic papers, patents, weather, health, environment, agriculture, energy, and knowledge graphs to fuel CSOAI Innovation, Healthcare, Agriculture, and Energy hives.  
> **Sources Cited**: Inline with `[^N^]` notation.

---

## Table of Contents

1. [Academic Papers](#1-academic-papers)
   - [arXiv API](#11-arxiv-api)
   - [Semantic Scholar API](#12-semantic-scholar-api)
   - [OpenAlex](#13-openalex)
   - [CrossRef API](#14-crossref-api)
2. [Patents](#2-patents)
   - [USPTO Open Data Portal](#21-uspto-open-data-portal)
   - [EPO Open Patent Services (OPS)](#22-epo-open-patent-services-ops)
3. [Weather & Climate](#3-weather--climate)
   - [OpenWeatherMap API](#31-openweathermap-api)
   - [NOAA NCEI Climate Data](#32-noaa-ncei-climate-data)
4. [Health](#4-health)
   - [WHO Global Health Observatory](#41-who-global-health-observatory)
   - [CDC Datasets](#42-cdc-datasets)
5. [Environment](#5-environment)
   - [EPA Datasets](#51-epa-datasets)
   - [Copernicus Climate Data Store](#52-copernicus-climate-data-store)
6. [Agriculture & Food](#6-agriculture--food)
   - [FAOSTAT](#61-faostat)
7. [Energy](#7-energy)
   - [IRENA Energy Statistics](#71-irena-energy-statistics)
8. [Science & Knowledge Graphs](#8-science--knowledge-graphs)
   - [RCSB Protein Data Bank (PDB)](#81-rcsb-protein-data-bank-pdb)
   - [DBpedia](#82-dbpedia)
   - [Wikidata](#83-wikidata)
9. [LLM Training Corpora](#9-llm-training-corpora)
   - [Common Crawl](#91-common-crawl)
   - [The Pile / Common Pile](#92-the-pile--common-pile)

---

## 1. Academic Papers

### 1.1 arXiv API

| Field | Detail |
|-------|--------|
| **Name** | arXiv API & Bulk Data Access |
| **URL** | https://arxiv.org/help/api + https://info.arxiv.org/help/bulk_data.html |
| **Format** | Atom XML (API), PDF, LaTeX source (bulk); Metadata in JSON via OAI-PMH |
| **License** | arXiv's default license (non-exclusive); mostly open-access preprints. Must link back to arXiv for full-text downloads [^1447^] |
| **API/Bulk** | REST API (free, no key), OAI-PMH for metadata harvesting, S3 bulk PDF downloads (requester-pays) [^1434^] |
| **Scale** | 2M+ preprints; covers physics, math, CS, quantitative biology, quantitative finance, statistics, EE, economics |
| **Rate Limits** | ~1 request per 3 seconds for API; fair use policy [^1540^] |
| **CSOAI Use Case** | Primary training corpus for Innovation Hive LLMs. Bulk PDFs available via GCS (`gs://arxiv-dataset`) or Amazon S3 requester-pays bucket. OAI-PMH provides daily metadata updates ideal for maintaining a current literature index [^1428^] [^1447^] |

**Key Endpoints:**
- API: `http://export.arxiv.org/api/query?search_query=all:QUERY`
- OAI-PMH: `http://export.arxiv.org/oai2`
- Bulk PDFs: `s3://arxiv/` (Amazon S3, requester-pays) or `gs://arxiv-dataset` (Google Cloud, free egress)

---

### 1.2 Semantic Scholar API

| Field | Detail |
|-------|--------|
| **Name** | Semantic Scholar Academic Graph (S2AG) API & Datasets |
| **URL** | https://www.semanticscholar.org/product/api + https://api.semanticscholar.org/corpus |
| **Format** | JSON (API); gzipped JSON files (bulk datasets) |
| **License** | CC0 for datasets; free API key required for high-volume access [^1544^] [^1546^] |
| **API/Bulk** | REST API + monthly bulk dataset snapshots via Datasets API [^1587^] |
| **Scale** | 225M+ papers, 105M+ authors, 2.8B+ citation edges [^1587^] |
| **Rate Limits** | 1 req/sec with API key; unauthenticated heavily rate-limited [^1549^] |
| **CSOAI Use Case** | Rich citation graph with SPECTER2 embeddings, TLDR summaries, and citation intent classification. Ideal for training citation-aware LLMs and scientific NLP models. S2ORC subset provides full-text parsed from 60M+ open-access PDFs [^1587^] [^1593^] |

**Available Datasets:** papers, abstracts, authors, citations (with context & intent), embeddings (SPECTER), TLDRs, publication venues, S2ORC (full text) [^1588^]

**Key Endpoints:**
- Graph API: `https://api.semanticscholar.org/graph/v1`
- Datasets API: `https://api.semanticscholar.org/datasets/v1`
- Bulk download: `https://api.semanticscholar.org/corpus` (requires free API key)

---

### 1.3 OpenAlex

| Field | Detail |
|-------|--------|
| **Name** | OpenAlex Open Academic Graph |
| **URL** | https://developers.openalex.org/ + https://openalex.org/ |
| **Format** | JSON (API); full database snapshot (Parquet/JSON) |
| **License** | CC0 — data is free to download, share, remix, and build on [^1430^] |
| **API/Bulk** | REST API (free key, $1/day free credit) + quarterly snapshots downloadable for free [^1432^] |
| **Scale** | 480M+ works, 90M+ authors, 100K+ institutions, 2.5B+ citation links [^1431^] |
| **Rate Limits** | Unlimited single work lookups; 10,000 list/filter calls/day; 1,000 search calls/day; 100 PDF downloads/day on free tier [^1430^] |
| **CSOAI Use Case** | Largest free scholarly database — successor to Microsoft Academic Graph. Ideal for bibliometric analysis, institutional research tracking, and building academic knowledge graphs. Full snapshots enable offline large-scale analysis. Supports semantic search (beta) [^1430^] [^1431^] |

**Key Endpoints:**
- API: `https://api.openalex.org/works`, `/authors`, `/institutions`, `/sources`, `/topics`
- Snapshot: `https://docs.openalex.org/download-all-data/snapshot` (AWS Open Data, ~300GB compressed)
- CLI tool: `openalex download` for parallelized bulk PDF retrieval

---

### 1.4 CrossRef API

| Field | Detail |
|-------|--------|
| **Name** | CrossRef REST API & Bulk Metadata |
| **URL** | https://www.crossref.org/documentation/retrieve-metadata/ |
| **Format** | JSON (REST API), XML (OAI-PMH); bulk JSON files |
| **License** | CC0 metadata (mostly); some abstracts may be publisher-copyrighted [^1429^] |
| **API/Bulk** | REST API (free, no registration) + annual public data file + monthly snapshots (Metadata Plus) [^1429^] |
| **Scale** | 180M+ DOIs across all disciplines; 20,000+ publisher members [^1435^] |
| **Rate Limits** | "Polite pool" with email parameter recommended; ~1B requests/month capacity [^1540^] |
| **CSOAI Use Case** | Gold standard for DOI metadata, funding data, license info, ORCID/ROR IDs, and open citation links. Essential for normalizing publication metadata across other sources. Annual public data file enables full offline analysis [^1429^] [^1435^] |

**Key Endpoints:**
- REST API: `https://api.crossref.org/works`, `/journals`, `/funders`, `/members`
- OAI-PMH: `https://oai.crossref.org/oai`
- Annual dump: `https://www.crossref.org/learning-center/metadata-plus/metadata-plus-content-file/` (free)

---

## 2. Patents

### 2.1 USPTO Open Data Portal

| Field | Detail |
|-------|--------|
| **Name** | USPTO Open Data Portal (ODP) & PatentsView |
| **URL** | https://data.uspto.gov/ + https://patentsview.org/ |
| **Format** | JSON, XML, CSV, Stata (.dta), TIFF images |
| **License** | Public domain (US government data) |
| **API/Bulk** | Bulk Datasets API + PatentsView API + bulk download pages [^1437^] [^1438^] |
| **Scale** | 8.9M+ patents issued through 2014; 12.5M+ patent applications; weekly updates |
| **CSOAI Use Case** | Patent analytics for Innovation Hive. Key datasets: NBER technology sub-categories (HISTMST/HISTEXC), examination research data (ECOPAIR), patent application single-page images (APPSP2). PatentsView provides relational data tables for easy joining [^1438^] [^1445^] |

**Key Resources:**
- ODP API: `https://data.uspto.gov/apis/bulk-data/search`
- PatentsView API: `https://api.patentsview.org/`
- Bulk datasets: Historical masterfile, NBER categories, examination datasets

---

### 2.2 EPO Open Patent Services (OPS)

| Field | Detail |
|-------|--------|
| **Name** | EPO Open Patent Services (OPS) & Bulk Data Download Service (BDDS) |
| **URL** | https://developers.epo.org/ + https://www.epo.org/en/searching-for-patents/data/web-services/ops |
| **Format** | XML (OPS API), various (bulk downloads) |
| **License** | Free for non-paying users (up to 4GB/week); bulk datasets now FREE as of Jan 2025 [^1562^] |
| **API/Bulk** | REST API with OAuth2 + BDDS bulk download (public area, no auth required for free datasets) [^1564^] |
| **Scale** | 130M+ patent documents via Espacenet; worldwide coverage |
| **CSOAI Use Case** | European and worldwide patent analytics. As of Jan 2025, key datasets are FREE: EPO Bibliographic Data (EBD), EP Full-Text, EPO Worldwide Bibliographic Data (DOCDB), INPADOC legal event data, sequence listings, boards of appeal decisions [^1562^] [^1569^] |

**Key Resources:**
- OPS API: `https://ops.epo.org/3.2/` (REST + OAuth2)
- BDDS Public Area: free bulk datasets (since Jan 2025)
- Free tier: 4 GB/week; bulk datasets require no subscription

---

## 3. Weather & Climate

### 3.1 OpenWeatherMap API

| Field | Detail |
|-------|--------|
| **Name** | OpenWeatherMap API |
| **URL** | https://openweathermap.org/api |
| **Format** | JSON, XML, CSV (bulk) |
| **License** | Free tier available; subscription tiers for higher limits |
| **API/Bulk** | REST API (free tier) + bulk download service (paid) [^1502^] |
| **Scale** | Global coverage; 47+ years historical data; 2M+ cities |
| **Rate Limits** | Free tier: 60 calls/minute, 1,000 calls/day for One Call API 3.0 [^1501^] |
| **CSOAI Use Case** | Real-time and historical weather for Agriculture and Energy hives. Free tier supports current weather, 5-day/3-hour forecast, air pollution data. Bulk snapshots available for 22,635+ major cities in JSON/CSV [^1494^] |

**Key Endpoints:**
- Current weather: `api.openweathermap.org/data/2.5/weather`
- 5-day forecast: `api.openweathermap.org/data/2.5/forecast`
- Air pollution: `api.openweathermap.org/data/2.5/air_pollution`
- Bulk: `https://bulk.openweathermap.org/snapshot/{BULK_FILE_NAME}?appid={API key}`

---

### 3.2 NOAA NCEI Climate Data

| Field | Detail |
|-------|--------|
| **Name** | NOAA National Centers for Environmental Information (NCEI) |
| **URL** | https://www.ncei.noaa.gov/access + https://www.ncdc.noaa.gov/cdo-web/ |
| **Format** | CSV, JSON, NetCDF, PDF, shapefile; API returns JSON |
| **License** | Public domain (US government data) |
| **API/Bulk** | Climate Data Online (CDO) Web Services API + direct bulk download [^1491^] |
| **Scale** | 104,000+ collections, 3M+ metadata granules; data from 1901+ [^1491^] |
| **Rate Limits** | API token required; 5 requests/sec, 10,000 requests/day [^1495^] |
| **CSOAI Use Case** | Critical for Agriculture and Energy hives. Key datasets: Global Historical Climatology Network Daily (GHCN-Daily), Global Summary of Month/Year (GSOM/GSOY), Integrated Surface Dataset. Free API token for programmatic access to temperature, precipitation, wind, humidity data from 1901-present [^1491^] [^1495^] |

**Key Resources:**
- Data Access: `https://www.ncei.noaa.gov/access/search/index`
- CDO API: `https://www.ncdc.noaa.gov/cdo-web/webservices/v2` (free token)
- Featured: GHCN-Daily, GSOM, GSOY, Integrated Surface Dataset

---

## 4. Health

### 4.1 WHO Global Health Observatory

| Field | Detail |
|-------|--------|
| **Name** | WHO Global Health Observatory (GHO) / data.who.int |
| **URL** | https://data.who.int/ + https://www.who.int/data/gho/info/athena-api |
| **Format** | JSON, CSV (API returns JSON; web downloads CSV) |
| **License** | CC BY 4.0 with WHO-specific arbitration terms [^1596^] |
| **API/Bulk** | Athena API (OData/REST) + web CSV download + bulk data portal [^1497^] |
| **Scale** | 2,300+ indicators, 245 countries/regions, data spanning decades [^1498^] |
| **CSOAI Use Case** | Primary health data for Healthcare Hive. Covers mortality, disease burden, MDGs (child health, maternal health, HIV/AIDS, TB, malaria), non-communicable diseases, health systems, environmental health. API supports filtering by indicator, country, year [^1497^] [^1498^] |

**Key Endpoints:**
- Athena API: `https://ghoapi.azureedge.net/api/`
- Data portal: `https://data.who.int/` (interactive + bulk download)
- Example: `https://ghoapi.azureedge.net/api/INDICATOR_CODE` for specific indicators

---

### 4.2 CDC Datasets

| Field | Detail |
|-------|--------|
| **Name** | CDC Open Data & APIs |
| **URL** | https://data.cdc.gov/ + https://www.cdc.gov/datastatistics/ |
| **Format** | JSON, CSV, Socrata-native formats |
| **License** | Public domain (US government data); some datasets have specific terms |
| **API/Bulk** | Socrata Open Data API + direct download [^1492^] |
| **Scale** | Hundreds of datasets covering disease surveillance, vaccination, mortality, chronic disease |
| **CSOAI Use Case** | US-focused health data for Healthcare Hive. Covers: disease surveillance, vaccination rates (NIS), mortality (NVSS), chronic disease (Chronic Disease Indicators), behavioral risk factors (BRFSS), infectious disease data. Envirofacts Data Service API provides environmental health data (air, water, toxics, radiation) [^1601^] |

**Key Resources:**
- CDC Open Data: `https://data.cdc.gov/` (Socrata platform)
- Envirofacts API: `https://www.epa.gov/enviro/envirofacts-data-service-api` (multi-database search)
- WONDER: `https://wonder.cdc.gov/` (query system for health stats)

---

## 5. Environment

### 5.1 EPA Datasets

| Field | Detail |
|-------|--------|
| **Name** | US EPA Environmental Dataset Gateway (EDG) & Envirofacts |
| **URL** | https://edg.epa.gov/ + https://edg-epa.hub.arcgis.com/ |
| **Format** | Shapefile, GeoJSON, KML, CSV, XML metadata, file geodatabase |
| **License** | Public domain (US government data) |
| **API/Bulk** | ArcGIS REST Services + Envirofacts Data Service API + direct bulk download [^1596^] [^1601^] |
| **Scale** | Thousands of datasets on air quality, water, land, toxics, climate change, environmental justice |
| **CSOAI Use Case** | Environmental monitoring for Energy and Healthcare hives. Key databases: Air Quality System (AQS), Toxics Release Inventory (TRI), Safe Drinking Water Information System (SDWIS), Superfund (SEMS), Resource Conservation and Recovery Act (RCRAInfo). Envirofacts API enables cross-database queries by geography [^1589^] [^1601^] |

**Key Resources:**
- EDG: `https://edg.epa.gov/metadata/catalog/main/home.page`
- Clip & Ship: `https://edg-epa.hub.arcgis.com/`
- Envirofacts API: `https://www.epa.gov/enviro/envirofacts-data-service-api`
- Data.gov EPA: `https://catalog.data.gov/organization/epa-gov`

---

### 5.2 Copernicus Climate Data Store

| Field | Detail |
|-------|--------|
| **Name** | Copernicus Climate Data Store (CDS) |
| **URL** | https://cds.climate.copernicus.eu/ |
| **Format** | NetCDF, GRIB, CSV, zip; Python API client |
| **License** | Free with registration; Copernicus License for most datasets |
| **API/Bulk** | Python CDS API (`cdsapi`) + web download form + API [^1528^] |
| **Scale** | Hundreds of climate datasets including ERA5 (hourly reanalysis from 1940), seasonal forecasts, climate projections |
| **CSOAI Use Case** | Essential for Energy and Agriculture hives. ERA5 provides hourly global climate reanalysis (temperature, wind, precipitation, radiation) from 1940 to present at 0.25-degree resolution. API client enables programmatic subsetting by variable, time, and geography [^1528^] [^1535^] |

**Key Resources:**
- CDS Portal: `https://cds.climate.copernicus.eu/`
- Python API: `pip install cdsapi` (free personal access token required)
- Key datasets: ERA5 (reanalysis), ERA5-Land, seasonal forecasts, climate projections
- Token: Get from `https://cds.climate.copernicus.eu/profile`

---

## 6. Agriculture & Food

### 6.1 FAOSTAT

| Field | Detail |
|-------|--------|
| **Name** | FAOSTAT (Food and Agriculture Organization Statistics) |
| **URL** | https://www.fao.org/faostat/ + https://fenixservices.fao.org/faostat/api/ |
| **Format** | JSON, CSV (API); CSV, Excel (bulk download) |
| **License** | Free; open data. CC BY-NC-SA for some datasets |
| **API/Bulk** | REST API (new developer portal) + bulk download files (no login required) [^1522^] [^1524^] |
| **Scale** | 245+ countries/territories, data from 1961+, world's largest food/agriculture statistical database |
| **CSOAI Use Case** | Core agriculture data for Agriculture Hive. Covers: production, trade, consumption, prices, resources, forestry, fisheries, food security. New API developer portal launched for programmatic access. R package available (`FAOSTAT`) for bulk downloads [^1522^] [^1524^] |

**Key Resources:**
- Web: `https://www.fao.org/faostat/en/#data`
- API Portal: `https://www.fao.org/faostat/api/` (new developer portal)
- R package: `FAOSTAT` on CRAN for bulk downloads
- Domains: QCL (crops/livestock), TA (trade), FS (food security), etc.

---

## 7. Energy

### 7.1 IRENA Energy Statistics

| Field | Detail |
|-------|--------|
| **Name** | IRENA Renewable Energy Statistics |
| **URL** | https://www.irena.org/Data + https://www.irena.org/statistics |
| **Format** | Excel, CSV, PDF; interactive dashboard |
| **License** | Free; openly usable with attribution (copyright IRENA) |
| **API/Bulk** | Direct download from website + interactive dashboard [^1525^] [^1526^] |
| **Scale** | 150+ countries; renewable power capacity from 2013+, generation from 2013+, energy balances from 2020+ |
| **CSOAI Use Case** | Core energy data for Energy Hive. Covers: renewable power capacity (MW), generation (GWh), renewable energy balances, public investment flows (USD million). Data obtained from official national statistics, industry associations, and IRENA questionnaires [^1525^] [^1526^] |

**Key Resources:**
- Data portal: `https://www.irena.org/Data`
- Statistics: `https://www.irena.org/statistics`
- Dashboard: Interactive renewable energy data explorer
- Reports: Annual "Renewable Energy Statistics" yearbook (PDF + data tables)

---

## 8. Science & Knowledge Graphs

### 8.1 RCSB Protein Data Bank (PDB)

| Field | Detail |
|-------|--------|
| **Name** | RCSB Protein Data Bank |
| **URL** | https://www.rcsb.org/ + https://www.rcsb.org/docs/programmatic-access |
| **Format** | PDBx/mmCIF, XML, BinaryCIF, legacy PDB; JSON (API) |
| **License** | Public domain (deposited structures); free for all uses |
| **API/Bulk** | Data API (REST) + Search API + batch download scripts + FTP [^1533^] [^1537^] |
| **Scale** | 200,000+ 3D macromolecular structures; weekly updates |
| **CSOAI Use Case** | Biomolecular structure data for Healthcare Hive. Enables drug discovery research, protein structure prediction training data (AlphaFold training), molecular dynamics simulation inputs. APIs provide sequence clusters, holdings data, and full programmatic access to all structures [^1533^] [^1537^] |

**Key Resources:**
- Data API: `https://data.rcsb.org/`
- Search API: `https://search.rcsb.org/`
- File downloads: `https://files.rcsb.org/download/` (PDBx/mmCIF, XML, BCIF)
- Batch scripts: `https://www.rcsb.org/scripts/batch_download.sh`
- Python SDK: `rcsb-api` package on PyPI

---

### 8.2 DBpedia

| Field | Detail |
|-------|--------|
| **Name** | DBpedia Knowledge Graph |
| **URL** | https://www.dbpedia.org/ + https://databus.dbpedia.org/ |
| **Format** | RDF (Turtle, N-Triples), SPARQL endpoint; JSON via API |
| **License** | CC BY-SA (derived from Wikipedia); individual datasets may vary |
| **API/Bulk** | Databus SPARQL API for bulk downloads + SPARQL endpoint + live extraction [^1595^] [^1576^] |
| **Scale** | Extracted from all Wikipedia languages + Wikidata + Commons; 600K+ annual downloads |
| **CSOAI Use Case** | Structured knowledge graph for Innovation Hive. Extracts entities, categories, abstracts, geo-coordinates, links, and ontology mappings from Wikipedia. Enables entity linking, knowledge-based QA, and structured data enrichment for LLMs. Databus provides versioned, queryable bulk downloads [^1595^] [^1605^] |

**Key Resources:**
- SPARQL endpoint: `https://dbpedia.org/sparql`
- Databus: `https://databus.dbpedia.org/` (query for download links)
- Live extraction: On-demand KG generation from Wikipedia pages
- Docker setup available for local SPARQL endpoint

---

### 8.3 Wikidata

| Field | Detail |
|-------|--------|
| **Name** | Wikidata |
| **URL** | https://www.wikidata.org/ + https://query.wikidata.org/ |
| **Format** | RDF (JSON, XML, CSV via SPARQL); JSON dumps |
| **License** | CC0 (public domain dedication) for structured data; CC BY-SA for text [^1598^] [^1602^] |
| **API/Bulk** | SPARQL query service + REST API (Wikibase) + periodic JSON/RDF dumps [^1599^] |
| **Scale** | 100M+ items (Q-entities), 10,000+ properties; structured data from Wikipedia and beyond |
| **CSOAI Use Case** | Massive structured knowledge base for Innovation Hive. CC0 license means unrestricted commercial use. Contains cross-lingual entity data, relationships, and factual knowledge. SPARQL endpoint enables complex queries; periodic dumps enable full offline loading. Federation with 50+ other knowledge graphs [^1574^] |

**Key Resources:**
- SPARQL endpoint: `https://query.wikidata.org/sparql`
- REST API: `https://www.wikidata.org/w/rest.php`
- Dumps: `https://dumps.wikimedia.org/wikidatawiki/` (JSON, RDF)
- License: CC0 for structured data; free for any purpose

---

## 9. LLM Training Corpora

### 9.1 Common Crawl

| Field | Detail |
|-------|--------|
| **Name** | Common Crawl |
| **URL** | https://commoncrawl.org/ |
| **Format** | WARC (web archive), WAT (metadata), WET (plain text); ~10 PiB total |
| **License** | Content license varies by page; Common Crawl provides access only |
| **API/Bulk** | AWS Open Data (S3) + HTTP direct download; free [^1550^] |
| **Scale** | 10+ PiB total archive; ~2B+ pages per monthly crawl; 300B+ pages since 2008; 3-5B new pages/month [^1550^] |
| **CSOAI Use Case** | Foundational web corpus for training CSOAI LLMs. 64% of LLMs trained on Common Crawl data [^1550^]. WET files provide cleaned plaintext. Hosts monthly snapshots on AWS S3 (`s3://commoncrawl/`) with free cloud processing. Cited in 12,000+ research papers [^1550^] |

**Key Resources:**
- AWS S3: `s3://commoncrawl/` (US-East-1, free via AWS Open Data)
- HTTP: `https://data.commoncrawl.org/`
- Formats: WARC (raw), WAT (metadata JSON), WET (extracted text)
- Index: `https://index.commoncrawl.org/` for URL-based lookups

---

### 9.2 The Pile / Common Pile

| Field | Detail |
|-------|--------|
| **Name** | The Pile (v1) + Common Pile v0.1 |
| **URL** | https://pile.eleuther.ai/ + https://github.com/orgs/EleutherAI |
| **Format** | JSONL (JSON Lines); gzip compressed |
| **License** | The Pile: various (mixed sources, some copyrighted — legal disputes ongoing); Common Pile v0.1: curated licensed/public domain content [^1547^] [^1553^] |
| **API/Bulk** | Direct HTTP download from the-eye.eu + Hugging Face [^1547^] |
| **Scale** | The Pile: 825 GiB, 22 component datasets; Common Pile v0.1: 8 TB, 2 years of curation [^1547^] [^1545^] |
| **CSOAI Use Case** | Purpose-built LLM training corpus. The Pile contains diverse high-quality subsets: books, web text, academic papers (PubMed, arXiv), code (GitHub), dialogue, and more. Models trained on The Pile show significant cross-domain improvements. Common Pile v0.1 (2025) provides a copyright-clean alternative with 300K+ public domain books, transcribed audio, and licensed content [^1547^] [^1554^] |

**Key Resources:**
- The Pile: `https://pile.eleuther.ai/` (download via `the-eye.eu`)
- Common Pile v0.1: Available on Hugging Face and GitHub
- Paper: `https://pile.eleuther.ai/paper.pdf`
- Components: arXiv, PubMed Central, Books3, OpenWebText2, GitHub, StackExchange, etc.

---

## Summary Comparison Table

| # | Source | Category | Format | License | API/Bulk | Scale |
|---|--------|----------|--------|---------|----------|-------|
| 1 | arXiv API | Academic | XML/JSON/PDF | Open (link-back) | API + Bulk (S3/GCS) | 2M+ papers |
| 2 | Semantic Scholar | Academic | JSON | CC0 | API + Monthly Snapshots | 225M papers, 2.8B citations |
| 3 | OpenAlex | Academic | JSON | CC0 | API + Quarterly Snapshots | 480M works |
| 4 | CrossRef | Academic | JSON/XML | CC0 metadata | API + Annual Dumps | 180M DOIs |
| 5 | USPTO ODP | Patents | JSON/CSV/XML | Public domain | API + Bulk Download | 8.9M+ patents |
| 6 | EPO OPS | Patents | XML | Free (4GB/wk) | API + BDDS Bulk | 130M+ docs |
| 7 | OpenWeatherMap | Weather | JSON/XML/CSV | Free tier | API + Bulk (paid) | Global, 2M+ cities |
| 8 | NOAA NCEI | Climate | CSV/JSON/NetCDF | Public domain | API + Direct Download | 104K+ collections |
| 9 | WHO GHO | Health | JSON/CSV | CC BY 4.0 | API + Web Download | 2,300+ indicators |
| 10 | CDC | Health | JSON/CSV | Public domain | API + Socrata | 100s of datasets |
| 11 | EPA | Environment | GeoJSON/CSV/XML | Public domain | API + Bulk | 1,000s of datasets |
| 12 | Copernicus CDS | Climate | NetCDF/GRIB | Free (register) | Python API + Web | 100s of datasets |
| 13 | FAOSTAT | Agriculture | JSON/CSV | Free | API + Bulk | 245+ countries, 1961+ |
| 14 | IRENA | Energy | Excel/CSV | Free (attribute) | Direct Download | 150+ countries |
| 15 | RCSB PDB | Science | mmCIF/XML/BCIF | Public domain | API + FTP + Batch | 200K+ structures |
| 16 | DBpedia | Knowledge | RDF/SPARQL | CC BY-SA | SPARQL + Databus | All of Wikipedia |
| 17 | Wikidata | Knowledge | RDF/JSON | CC0 | SPARQL + REST + Dumps | 100M+ items |
| 18 | Common Crawl | Web Corpus | WARC/WET/WAT | Per-page | S3 + HTTP | 10+ PiB, 300B+ pages |
| 19 | The Pile | LLM Corpus | JSONL | Mixed | Direct Download | 825 GiB - 8 TB |

---

## CSOAI Hive Data Mapping

| CSOAI Hive | Primary Data Sources | Secondary Sources |
|------------|---------------------|-------------------|
| **Innovation Hive** | arXiv, Semantic Scholar, OpenAlex, CrossRef, USPTO, EPO, DBpedia, Wikidata, The Pile, Common Crawl | RCSB PDB |
| **Healthcare Hive** | WHO GHO, CDC, RCSB PDB, PubMed (via Semantic Scholar) | arXiv (quant-bio), EPA |
| **Agriculture Hive** | FAOSTAT, NOAA NCEI, OpenWeatherMap, Copernicus CDS | EPA, Wikidata |
| **Energy Hive** | IRENA, Copernicus CDS, NOAA NCEI, EPA | OpenWeatherMap, FAOSTAT |

---

## Key Integration Patterns

1. **Academic paper ingestion pipeline**: arXiv (full-text PDFs) + Semantic Scholar (citations + embeddings) + OpenAlex (comprehensive metadata) + CrossRef (DOI normalization)
2. **Climate/weather feature engineering**: NOAA NCEI (historical station data) + Copernicus CDS (global gridded reanalysis) + OpenWeatherMap (real-time forecasts)
3. **Knowledge graph construction**: Wikidata (CC0 entities) + DBpedia (Wikipedia-enriched) + CrossRef/Semantic Scholar (academic graph)
4. **LLM training data**: The Pile/Common Pile (curated academic text) + Common Crawl (web-scale) + arXiv/S2ORC (scientific full-text)
5. **Patent analytics**: USPTO PatentsView (structured tables) + EPO OPS (European/international coverage) + BDDS free bulk datasets

---

*Document compiled from 10+ web searches across academic, patent, weather, health, environmental, agricultural, energy, and knowledge graph data sources. All sources offer free access tiers suitable for research and development.*
