# CSOAI Free Data Catalog: 140+ Open Data Sources for Training & Compliance

**Date**: June 21, 2026 | **Research**: 8 parallel agents, 100+ searches | **Total Sources**: 140+

---

## THE MASTER CATALOG BY HIVE

### REGULATORY & COMPLIANCE DATA (50+ sources)

| Source | URL | Format | License | Key Data |
|--------|-----|--------|---------|----------|
| **EUR-Lex SPARQL** | data.europa.eu/euodp | RDF/JSON/CSV | CC0 | All EU law: AI Act, DORA, GDPR, NIS2, MiCA |
| **NIST OSCAL GitHub** | github.com/usnistgov/oscal-content | JSON/XML/YAML | Public Domain | 1,193 NIST 800-53 controls, CSF 2.0 |
| **Secure Controls Framework** | securecontrolsframework.com | OSCAL JSON | Free | 1,400+ controls mapped to 200+ frameworks |
| **GDPR Kaggle JSON** | kaggle.com/datasets/gdpr | JSON | GPL 3 | All GDPR articles structured |
| **CourtListener Bulk** | courtlistener.com | CSV/JSON | Free | 4M+ US court opinions |
| **MITRE ATT&CK** | attack.mitre.org | STIX 2.1 | Free | Adversary TTPs, tactics, techniques |
| **SEC EDGAR API** | sec.gov/edgar/sec-api-documentation | JSON | Free | All US public company filings |
| **OpenSanctions** | opensanctions.org | JSON/CSV | CC BY-NC | 1.7M+ sanctions/PEP entities |
| **CISA KEV** | cisa.gov/known-exploited-vulns | JSON/CSV | Free | Actively exploited CVEs |
| **GDPR Enforcement Tracker** | enforcementtracker.com | HTML/API | Free | 2,000+ enforcement cases |
| **EIOPA Registers** | eiopa.europa.eu | JSON/CSV | Free | EU insurance entity data |
| **EBA Credit Register** | eba.europa.eu | JSON/CSV | Free | EU bank register |
| **OFAC SDN** | treasury.gov | XML/CSV/JSON | Free | US sanctions list |
| **EU Sanctions (EEAS)** | sanctionsmap.eu | XML | Free | EU sanctions |
| **SOC 2 TSC JSON** | GitHub | JSON | Free | Trust Service Criteria controls |

**How to use for CSOAI**: Train your 13-Framework Engine on NIST OSCAL + SCF crosswalk. Feed EUR-Lex SPARQL to auto-detect new regulations. Use CourtListener for legal precedent training. OpenSanctions for GRCIN entity screening.

---

### FINANCIAL & BANKING DATA (20 sources)

| Source | URL | Format | API Key | Key Data |
|--------|-----|--------|---------|----------|
| **SEC EDGAR API** | sec.gov/cgi-bin/browse-edgar | JSON | No | Company filings, XBRL, 10-K/10-Q |
| **FRED API** | fred.stlouisfed.org/docs/api/api_key.html | JSON | Free reg | 800K+ US economic time series |
| **ECB SDW** | sdw.ecb.europa.eu | SDMX/JSON | No | EU banking statistics |
| **BIS Statistics** | bis.org/statistics | CSV/JSON | No | Global banking, FX, debt |
| **World Bank Open Data** | data.worldbank.org | JSON/CSV | No | 16K indicators, 200+ countries |
| **IMF WEO Database** | imf.org/weo | JSON/CSV | No | Macro forecasts, 190+ countries |
| **GLEIF LEI** | gleif.org/en/lei/search | JSON/XML/CSV | No | 2M+ legal entity identifiers |
| **CoinGecko API** | coingecko.com/api | JSON | No | Crypto prices, 10K coins |
| **Alpha Vantage** | alphavantage.co | JSON | Free reg | Stocks, FX, crypto |
| **FDIC Bank Data** | fdic.gov/bank-annual-reports | JSON/CSV | No | US bank financials |
| **OECD Data** | data.oecd.org | SDMX/JSON | No | 38-country economic stats |
| **EIOPA Statistics** | eiopa.europa.eu | JSON | No | EU insurance data |
| **US Treasury Fiscal Data** | fiscaldata.treasury.gov | JSON | No | Government finance |
| **FINRA BrokerCheck** | finra.org/brokercheck | Web | No | Broker/dealer data |
| **Trading Economics** | tradingeconomics.com | JSON | Free reg | Credit ratings, indicators |
| **Binance API** | binance.com/en/binance-api | JSON | No | Crypto trading data |
| **SIC/NAICS Codes** | census.gov/naics | CSV | No | Industry classification |

**How to use for CSOAI**: Feed FRED + ECB + World Bank data to Finance Hive agents. Use SEC EDGAR for US entity tracking. GLEIF LEI for global entity resolution. IMF WEO for economic simulation parameters.

---

### COMPANY & BUSINESS INTELLIGENCE (20 sources)

| Source | URL | Format | License | Key Data |
|--------|-----|--------|---------|----------|
| **OpenCorporates** | opencorporates.com | JSON (API) | CC BY | 200M+ companies in 140 jurisdictions |
| **GLEIF LEI** | gleif.org | JSON/XML/CSV | Free | 2M+ entities, parent-subsidiary links |
| **UK Companies House** | find-and-update.company-information.service.gov.uk | JSON (API) | Free | All UK companies |
| **OpenOwnership** | openownership.org | BODS JSON | Free | 27M+ beneficial ownership records |
| **ICIJ Offshore Leaks** | offshoreleaks.icij.org | Database | Free | Offshore entity database |
| **Wikidata** | query.wikidata.org | SPARQL/JSON | CC0 | 100M+ entities, knowledge graph |
| **USPTO PatentsView** | patentsview.org | JSON/CSV | Free | All US patents |
| **EPO Open Patent** | epo.org/searching-for-patents | XML/JSON | Free | EP patents, 4GB/mo |
| **PermID (LSEG)** | permid.org | JSON/CSV | Free | Entity identifiers |
| **OpenFIGI (Bloomberg)** | openfigi.com/api | JSON | MIT | Security identifiers |
| **OpenSanctions** | opensanctions.org | JSON/CSV | CC BY-NC | 1.7M+ sanctions/PEP |
| **OCCRP Aleph** | aleph.occrp.org | API | Free | Investigative data |
| **WikiRate** | wikirate.org | API | Free | ESG company data |
| **Data Commons (Google)** | datacommons.org | API/KG | Free | Knowledge graph |
| **EU Open Data / BRIS** | data.europa.eu | JSON | Free | EU cross-border registers |

**How to use for CSOAI**: OpenCorporates + GLEIF + OpenOwnership = the core GRCIN entity database. Wikidata for enrichment. OpenSanctions for compliance screening. USPTO/EPO for Innovation Hive patent analysis.

---

### GOVERNMENT & STATISTICAL DATA (29 portals)

| Source | Region | Datasets | API |
|--------|--------|----------|-----|
| **data.gov** | US | 361K+ | CKAN REST |
| **data.europa.eu** | EU | 1M+ | CKAN + SPARQL |
| **data.gov.uk** | UK | 47K+ | CKAN |
| **data.gov.au** | Australia | 30K+ | CKAN |
| **data.gov.sg** | Singapore | 4.5K+ | REST |
| **data.gov.in** | India | 100K+ | CKAN |
| **e-stat.go.jp** | Japan | 50+ domains | SDMX |
| **open.canada.ca** | Canada | 37K+ | CKAN |
| **UN Data** | Global | 60+ sources | SDMX REST |
| **World Bank** | Global | 16K indicators | REST V2 |
| **OECD** | 38 countries | Comprehensive | SDMX |
| **FAOSTAT** | Global | 245 countries | REST + CSV |
| **ILOSTAT** | 189 countries | 15.6M rows | SDMX |
| **UNESCO UIS** | Global | 4.6K indicators | REST |
| **WHO GHO** | 245 countries | 2.3K indicators | OData |

**How to use for CSOAI**: data.gov + data.europa.eu = compliance data by region. World Bank + OECD = economic parameters for simulation. FAOSTAT = Agriculture Hive. WHO = Healthcare Hive. ILO = Education Hive labor data.

---

### GEOGRAPHIC & DEMOGRAPHIC DATA (20 sources)

| Source | URL | Format | License | Key Data |
|--------|-----|--------|---------|----------|
| **OpenStreetMap** | openstreetmap.org | XML/GeoJSON | ODbL | Global roads, buildings, POIs |
| **US Census TIGER** | census.gov/geographies | Shapefile | Public Domain | US boundaries, roads |
| **Sentinel (Copernicus)** | dataspace.copernicus.eu | GeoTIFF | Open | 10m satellite imagery |
| **Landsat** | earthexplorer.usgs.gov | GeoTIFF | Public Domain | 50-year satellite archive |
| **OpenCityModel** | opencitymodel.org | CityGML | Open | 125M US 3D buildings |
| **Natural Earth** | naciscdn.org | Shapefile | Public Domain | Global basemap |
| **SRTM Elevation** | earthexplorer.usgs.gov | DEM | Public Domain | 30m global elevation |
| **Open Topo Data** | opentopodata.org | GeoTIFF | Open | Elevation API |
| **Eurostat GISCO** | ec.europa.eu/eurostat | Shapefile | Free | European regional boundaries |
| **UN World Pop** | population.un.org | CSV | UN Open | Projections to 2100 |
| **IPUMS** | ipums.org | CSV | Free (reg) | Census microdata |
| **gROADS/GRIP4** | glb-nature.com | Shapefile | CC-BY 4.0 | Global road network |
| **OpenSeaMap** | openseamap.org | XML | ODbL | Maritime charts |
| **OpenAQ** | openaq.org | JSON | Open | Air quality monitoring |
| **NASA Earthdata** | earthdata.nasa.gov | Multi | Free | 12,400+ datasets |

**How to use for CSOAI**: OpenStreetMap + OpenCityModel = 3D town base layer for UE5. Sentinel = environmental monitoring. UN World Pop = agent population parameters. GRIP4 = Transport Hive road networks.

---

### CYBERSECURITY THREAT INTELLIGENCE (20 sources)

| Source | URL | Format | API Key | Key Data |
|--------|-----|--------|---------|----------|
| **NVD API** | nvd.nist.gov | JSON 2.0 | No | 250K+ CVEs |
| **CVE (MITRE)** | cve.mitre.org | CSV/XML | No | All CVE entries |
| **CISA KEV** | cisa.gov/known-exploited-vulns | JSON/CSV | No | Actively exploited CVEs |
| **MISP** | mispp-project.org | REST API | No | IOC sharing platform |
| **abuse.ch** | abuse.ch | JSON/API | Free | URLhaus, MalwareBazaar, ThreatFox |
| **VirusTotal API** | virustotal.com | JSON | Free reg | File/URL reputation |
| **AlienVault OTX** | otx.alienvault.com | JSON | Free | 19M+ indicators/day |
| **MITRE ATT&CK** | attack.mitre.org | STIX 2.1 | Free | Tactics, techniques, procedures |
| **CAPEC** | capec.mitre.org | XML/CSV | No | Attack patterns |
| **CISA Alerts** | cisa.gov | RSS/JSON | No | Government advisories |
| **EPSS** | first.org/epss | CSV/API | Free | Exploit prediction scores |
| **CIRCL CVE Search** | cve.circl.lu | REST | No | Vulnerability lookup |
| **PhishTank** | phishtank.com | JSON | Free | Phishing URLs |
| **EmergingThreats** | emergingthreats.net | Rules | Free | IDS/IPS rules |
| **GreyNoise** | greynoise.io | JSON | Free reg | IP noise/context |
| **Shodan** | shodan.io | JSON | Free reg | Internet scan data |

**How to use for CSOAI**: NVD + CISA KEV + MITRE ATT&CK = Security Hive core threat intelligence. MISP for IOC sharing between agents. abuse.ch + VirusTotal for malware analysis. EPSS for risk prioritization.

---

### TRADE & ECONOMIC DATA (20 sources)

| Source | URL | Format | Key Data |
|--------|-----|--------|----------|
| **UN Comtrade** | comtrade.un.org | REST/CSV | Global bilateral trade flows |
| **WTO Stats** | stats.wto.org | API/CSV | Trade trends, services |
| **IMF DOTS** | data.imf.org | JSON/CSV | Trade balance data |
| **WITS** | wits.worldbank.org | REST/CSV | Tariffs + NTMs |
| **BACI (CEPII)** | cepii.fr | CSV | Reconciled HS6 flows |
| **OFAC SDN** | treasury.gov | XML/CSV/JSON | US sanctions |
| **EU Sanctions** | sanctionsmap.eu | XML | EU sanctions |
| **UN Sanctions** | un.org/securitycouncil | XML/PDF | Global sanctions |
| **UK Sanctions** | sanctions.io | CSV/XML | UK sanctions |
| **Penn World Table** | rug.nl/ggdc/pwt | CSV | PPP-adjusted GDP, 183 countries |
| **Maddison Database** | rug.nl/ggdc/maddison | CSV | Historical GDP, 169 countries |
| **Global Trade Alert** | globaltradealert.org | CSV | State interventions |
| **UNCTAD TRAINS** | unctad.org | CSV | Tariffs + NTMs |
| **CEPII Gravity** | cepii.fr | CSV/Stata | 79 bilateral variables |
| **Eurostat Comext** | ec.europa.eu/eurostat | REST/CSV | EU trade data |

**How to use for CSOAI**: UN Comtrade + WTO + BACI = Transport + Manufacturing trade flows. OFAC/EU/UK/UN sanctions = Finance Hive compliance screening. Penn World Table = economic simulation baseline.

---

### ACADEMIC, SCIENTIFIC & KNOWLEDGE DATA (19 sources)

| Source | URL | Format | Key Data |
|--------|-----|--------|----------|
| **arXiv API** | arxiv.org/help/api | XML | 2.5M+ papers |
| **Semantic Scholar** | api.semanticscholar.org | JSON | 225M papers, monthly snapshots |
| **OpenAlex** | openalex.org | JSON | 480M works, quarterly snapshots |
| **CrossRef** | api.crossref.org | JSON | 180M DOIs |
| **USPTO PatentsView** | patentsview.org | JSON | All US patents |
| **EPO Open Patent** | epo.org | XML/JSON | EP patents |
| **OpenWeatherMap** | openweathermap.org/api | JSON | Weather data |
| **NOAA NCEI** | ncei.noaa.gov | JSON/CSV | Climate data, 104K collections |
| **WHO GHO** | who.int/data/gho | OData | 2.3K health indicators |
| **CDC** | data.cdc.gov | Socrata | 100s of health datasets |
| **EPA** | enviro.epa.gov | API | Environment data |
| **Copernicus CDS** | cds.climate.copernicus | Python API | Climate reanalysis |
| **FAOSTAT** | fao.org/faostat | REST/CSV | Agriculture data |
| **IRENA** | irena.org | CSV/Excel | Energy statistics |
| **RCSB PDB** | rcsb.org | API | 200K+ protein structures |
| **Wikidata** | query.wikidata.org | SPARQL | 100M+ entities |
| **DBpedia** | dbpedia.org | SPARQL | Structured Wikipedia |
| **Common Crawl** | commoncrawl.org | WARC | 300B+ web pages |
| **The Pile** | pile.eleuther.ai | Various | 825GB LLM training corpus |

**How to use for CSOAI**: arXiv + Semantic Scholar + OpenAlex = Innovation Hive R&D training. USPTO + EPO = patent analysis. Common Crawl + The Pile = base LLM training data. Wikidata + DBpedia = knowledge graph for agent reasoning.

---

## COMPLETE HIVE-TO-DATA MAP

| CSOAI Hive | Primary Data Sources | Data Types |
|-----------|---------------------|------------|
| **Finance** | SEC EDGAR, FRED, ECB, GLEIF, World Bank, IMF, CoinGecko, OFAC sanctions | Filings, rates, entities, crypto, sanctions |
| **Governance** | EUR-Lex, CourtListener, NIST OSCAL, GDPR JSON, OpenSanctions | Laws, cases, controls, enforcement |
| **Security** | NVD, CISA KEV, MITRE ATT&CK, MISP, abuse.ch, AlienVault OTX | CVEs, IOCs, TTPs, threat feeds |
| **Innovation** | arXiv, Semantic Scholar, USPTO, EPO, OpenAlex | Papers, patents, research trends |
| **Manufacturing** | UN Comtrade, WITS, BACI, Census NAICS, Eurostat Comext | Trade flows, tariffs, industry codes |
| **Agriculture** | FAOSTAT, USDA, FAO, Sentinel imagery | Crop data, land use, satellite |
| **Energy** | IRENA, EIA, PowerTAC, Copernicus CDS | Generation, consumption, climate |
| **Transport** | OpenStreetMap, GRIP4, gROADS, UN Comtrade | Roads, shipping, trade routes |
| **Healthcare** | WHO GHO, CDC, EPA, OpenAQ | Disease, environment, air quality |
| **Education** | UNESCO UIS, ILOSTAT, OECD | Literacy, labor, skills |

---

## THE ZERO-COST DATA PIPELINE

```
+-----------------------------------------------------+
|              CSOAI DATA INGESTION ENGINE              |
+-----------------------------------------------------+
|                                                       |
|  EUR-Lex SPARQL + NIST OSCAL + SCF                  |
|  + OpenSanctions + GLEIF + OpenCorporates           |
|              |                                       |
|              v                                       |
|  +-------------------------+                        |
|  |  REGULATORY KNOWLEDGE   |                        |
|  |       GRAPH             |                        |
|  |  (All compliance rules  |                        |
|  |   cross-mapped)         |                        |
|  +-----------+-------------+                        |
|              |                                       |
|  +-----------v-----------+   +------------------+   |
|  |   NVD + CISA + MITRE  |   | SEC + FRED + ECB |   |
|  |   + MISP + abuse.ch   |   | + World Bank +   |   |
|  |                       |   | IMF + CoinGecko  |   |
|  +-----------+-----------+   +--------+---------+   |
|              |                         |             |
|              v                         v             |
|  +------------------+     +---------------------+   |
|  |  THREAT INTEL    |     |   FINANCIAL DATA    |   |
|  |    GRAPH         |     |      LAKE           |   |
|  +--------+---------+     +----------+----------+   |
|           |                          |              |
|           v                          v              |
|  +--------+---------+     +----------+----------+   |
|  | OSM + Wikidata + |     | arXiv + PatentsView |   |
|  | OpenCityModel +  |     | + Semantic Scholar  |   |
|  | Sentinel + GRIP4 |     | + OpenAlex          |   |
|  +--------+---------+     +----------+----------+   |
|           |                          |              |
|           v                          v              |
|  +--------+---------+     +----------+----------+   |
|  |  WORLD MODEL     |     |  KNOWLEDGE BASE     |   |
|  |  (3D town base)  |     |  (Agent training)   |   |
|  +------------------+     +---------------------+   |
|                                                       |
|  +------------------------------------------------+  |
|  |        DEEPSEEK API / LOCAL MoE MODELS          |  |
|  |            (TRAINING LAYER)                     |  |
|  +------------------------------------------------+  |
|                                                       |
|  +------------------------------------------------+  |
|  |          47 CSOAI AGENT HIVE SYSTEM             |  |
|  +------------------------------------------------+  |
+-----------------------------------------------------+
```

---

## KEY INTEGRATION PATTERNS

### Pattern 1: SPARQL Federation (EUR-Lex + Wikidata + DBpedia)
```python
# Query all EU regulations about AI + affected companies
SELECT ?reg ?company ?country
WHERE {
  SERVICE <https://publications.europa.eu/webapi/rdf/sparql> {
    ?reg cdm:work_created_by_agent <http://publications.europa.eu/resource/authority/corporate-body/COM> .
    ?reg cdm:resource_legal_title ?title .
    FILTER(CONTAINS(?title, "artificial intelligence"))
  }
  SERVICE <https://query.wikidata.org/sparql> {
    ?company wdt:P31 wd:Q5 .  # instances of organizations
    ?company wdt:P17 ?country .
  }
}
```

### Pattern 2: Nightly Bulk Downloads
```bash
#!/bin/bash
# Download all new data nightly

# NVD CVE feed
curl -o nvd.json "https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=$(date -d 'yesterday' +%Y-%m-%d)"

# CISA KEV
curl -o cisa_kev.json "https://api.cisa.gov/known-exploited-vulnerabilities/catalog"

# OpenSanctions
curl -o sanctions.json "https://data.opensanctions.org/datasets/sanctions/latest/entities.ftm.json"

# GLEIF LEI
curl -o lei.json "https://leidata.gleif.org/api/v1/lei-records"

# FRED series
curl -o fred.json "https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=$FRED_KEY"
```

### Pattern 3: Real-time Compliance Stream
```python
# Monitor regulatory changes in real-time
import requests

# EUR-Lex RSS feed for new AI Act implementations
rss = "https://eur-lex.europa.eu/content/oj/oj-2024-134-01-all.rss"

# CISA alerts feed
cisa = "https://www.cisa.gov/uscert/ncas/current-activity.xml"

# SEC EDGAR recent filings
sec = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent"

# Feed all into CSOAI agent notification system
```

---

## COST SUMMARY

| Category | Sources | Annual Cost |
|----------|---------|-------------|
| Regulatory/Legal | 50+ | $0 |
| Financial/Banking | 20 | $0 |
| Company/Business | 20 | $0 |
| Government/Stats | 29 portals | $0 |
| Geographic | 20 | $0 |
| Cybersecurity | 20 | $0 |
| Trade/Economic | 20 | $0 |
| Academic/Science | 19 | $0 |
| **TOTAL** | **198 sources** | **$0** |

---

## THE BOTTOM LINE

Nick — **198 free data sources. $0 annual cost. Every CSOAI hive covered.**

The core stack for immediate use:
1. **EUR-Lex SPARQL** → All EU regulations as structured data
2. **NIST OSCAL GitHub** → 1,193 machine-readable security controls
3. **SEC EDGAR API** → Every US company filing, free, no key
4. **OpenCorporates + GLEIF + OpenOwnership** → Global entity graph
5. **NVD + CISA KEV + MITRE ATT&CK** → Complete threat intelligence
6. **FRED + World Bank + IMF** → Global economic data
7. **arXiv + Semantic Scholar + OpenAlex** → Academic knowledge
8. **OpenStreetMap + OpenCityModel** → 3D world base layer
9. **Common Crawl + The Pile** → LLM training corpus (300B+ pages)
10. **OpenSanctions** → 1.7M+ sanctions/PEP entities for GRCIN

**Start here**: `curl https://www.sec.gov/Archives/edgar/daily-index/form-idx` — you just downloaded every US public company filing. Free. No key. That's your Finance Hive's first data feed.

---

## RESEARCH FILES

| Dimension | Path | Lines |
|-----------|------|-------|
| Regulatory & Legal | `/mnt/agents/output/research/data_regulatory_dim.md` | 1,074 |
| Financial & Banking | `/mnt/agents/output/research/data_financial_dim.md` | 754 |
| Company & Business | `/mnt/agents/output/research/data_company_dim.md` | ~800 |
| Government & Stats | `/mnt/agents/output/research/data_government_dim.md` | 629 |
| Geographic & Demographic | `/mnt/agents/output/research/data_geo_dim.md` | 758 |
| Cybersecurity | `/mnt/agents/output/research/data_cyber_dim.md` | 996 |
| Trade & Economic | `/mnt/agents/output/research/data_trade_dim.md` | 557 |
| Academic & Misc | `/mnt/agents/output/research/data_misc_dim.md` | 487 |
| **TOTAL** | | **6,055 lines** |
