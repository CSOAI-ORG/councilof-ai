# Free/Open Government Data Portals — Global Research Report

> **Prepared for**: CSOAI — Government Data for AI Training Across 12 Industry Hives
> **Coverage**: Global (US, EU, UK, Australia, Singapore, India, Japan, Canada + International Organizations)
> **Date**: July 2026

---

## Table of Contents

1. [United States — Data.gov](#1-united-states--datagov)
2. [European Union — Data.Europa.eu](#2-european-union--dataeuropaeu)
3. [United Kingdom — Data.gov.uk](#3-united-kingdom--datagovuk)
4. [Australia — Data.gov.au](#4-australia--datagovau)
5. [Singapore — Data.gov.sg](#5-singapore--datagovsg)
6. [India — Data.gov.in](#6-india--datagovin)
7. [Japan — Data.go.jp / e-Stat](#7-japan--datagojp--e-stat)
8. [Canada — Open.Canada.ca](#8-canada--opencanadaca)
9. [United Nations — UN Data Portal](#9-united-nations--un-data-portal)
10. [World Bank — Open Data](#10-world-bank--open-data)
11. [OECD — Data Explorer](#11-oecd--data-explorer)
12. [FAO — FAOSTAT](#12-fao--faostat)
13. [ILO — ILOSTAT](#13-ilo--ilostat)
14. [UNESCO — Institute for Statistics (UIS)](#14-unesco--institute-for-statistics-uis)
15. [WHO — Global Health Observatory](#15-who--global-health-observatory)
16. [Additional Notable Portals](#16-additional-notable-portals)
17. [Quick Comparison Matrix](#17-quick-comparison-matrix)

---

## 1. United States — Data.gov

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.gov/ |
| **Catalog URL** | https://catalog.data.gov/ |
| **API Docs** | https://open.gsa.gov/api/datadotgov/ |
| **Datasets** | 361,184+ datasets (as of July 2026) [^1579^] |
| **License** | U.S. Open Data License (varies by dataset; generally CC0/public domain) |
| **API Type** | CKAN API (RESTful), JSON output |
| **Auth Required** | Optional API key for production; DEMO_KEY available for testing [^1556^] |
| **Formats** | CSV, JSON, XML, GeoJSON, Shapefile, KML, NetCDF, XLS, PDF |

### Key Datasets for CSOAI
- **Economic**: Bureau of Economic Analysis (GDP, trade), Census Bureau (economic indicators)
- **Healthcare**: CDC datasets, FDA drug approvals, Medicare data
- **Environment**: EPA emissions, NOAA climate data, USGS geological data
- **Transportation**: DOT traffic data, FAA flight data, FMCSA safety data
- **Labor**: BLS employment statistics, wage data, occupational safety
- **Finance**: SEC financial data, Treasury data
- **Agriculture**: USDA crop data, farm statistics
- **Crime/Justice**: DOJ crime statistics, FBI Uniform Crime Reports

### API Access
- **Endpoint**: `https://api.gsa.gov/technology/datagov/v3/`
- **CKAN-compatible**: Supports `package_list`, `package_search`, `group_list`, `package_show`
- **Bulk Download**: Government-wide open data metadata bulk download available [^1569^]

---

## 2. European Union — Data.Europa.eu

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.europa.eu/en |
| **API Docs** | https://data.europa.eu/en/which-apis-are-available-and-where-can-i-find-information-about-them |
| **Datasets** | 1,000,000+ datasets from 36+ countries [^1475^] |
| **License** | Creative Commons (varies); most datasets under CC BY 4.0 |
| **API Type** | CKAN API, SPARQL Endpoint |
| **Auth Required** | No |
| **Formats** | CSV, JSON, XML, RDF, GeoJSON, Shapefile, Excel, NetCDF |

### Key Datasets for CSOAI
- **Cross-border Trade**: EU sanctions data, customs statistics
- **Agriculture**: Plant protection products, Maximum Residue Levels (MRLs)
- **Research**: Horizon Europe funded projects and results
- **Environment**: Copernicus satellite data, climate data, air quality
- **Transport**: Eurostat transport statistics, TEN-T network data
- **Health**: European Health Data & Evidence Network (EHDEN)
- **Energy**: ENTSO-E power data, Eurostat energy statistics
- **Economy**: Eurostat national accounts, GDP, inflation, labor market

### API Access
- **CKAN API**: `https://data.europa.eu/api/hub/search/`
- **SPARQL**: `https://data.europa.eu/sparql` (Virtuoso RDF triple store)
- **CKAN package_search**: `https://data.europa.eu/api/hub/search/dataset` [^1469^]

---

## 3. United Kingdom — Data.gov.uk

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://www.data.gov.uk/ |
| **API Docs** | https://guidance.data.gov.uk/get_data/api_documentation/ |
| **Datasets** | 47,000+ datasets (2023); growing [^1538^] |
| **License** | Open Government Licence (OGL) v3.0 — allows commercial use with attribution [^1523^] |
| **API Type** | CKAN API (RESTful) |
| **Auth Required** | No |
| **Formats** | CSV, JSON, XML, GeoJSON, KML, Shapefile, Excel, PDF |

### Key Datasets for CSOAI
- **Companies**: Companies House data (registrations, directors, financials)
- **Labor Market**: ONS census data, NOMIS labor market statistics
- **Crime**: Police open crime data (street-level crime, outcomes)
- **Education**: Explore Education Statistics, school census data
- **Environment**: DEFRA data services (flood, biodiversity, water quality)
- **Geospatial**: Ordnance Survey Open Data, planning data
- **Health**: NHS England statistics
- **Government**: Procurement data, legislation, parliamentary data (Hansard)
- **Transport**: Traffic data, public transport datasets

### API Access
- **ONS API**: `https://api.beta.ons.gov.uk/v1` — open, no API keys required [^1473^]
- **CKAN API**: Query catalog metadata programmatically
- **Developer Hub**: https://www.api.gov.uk/ — comprehensive UK government API catalog

---

## 4. Australia — Data.gov.au

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.gov.au/ |
| **Datasets** | 30,000+ (portal); 70,000+ including federated state datasets [^1529^] |
| **License** | Creative Commons Attribution 4.0 (most datasets) [^1528^] |
| **API Type** | CKAN API (RESTful) |
| **Auth Required** | No |
| **Formats** | CSV, JSON, XML, GeoJSON, XLSX, NetCDF, ZIP, KML |

### Key Datasets for CSOAI
- **Energy**: AEMO National Electricity Market dispatch data
- **Climate**: Bureau of Meteorology data, space weather API
- **Statistics**: ABS labor force data, census data
- **Environment**: EPA monitoring data, climate datasets
- **Transport**: GTFS public transport data, traffic volumes
- **Health**: Australian Institute of Health and Welfare (MyHospitals API)
- **Geoscience**: Geoscience Australia data, GIS datasets
- **Finance**: ASIC company data, financial services APIs
- **Government**: State-level open data portals (DataVic, Data.Qld, Data.NSW)

### API Access
- **MAGDA API**: `https://data.gov.au/api/` — CKAN-based
- **State APIs**: Victorian Government API Catalogue, NSW API portal
- **Bulk Download**: Full catalog export available [^1528^]

---

## 5. Singapore — Data.gov.sg

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.gov.sg/ |
| **Developer Guide** | https://guide.data.gov.sg/developer-guide/api-overview |
| **Datasets** | 4,500+ datasets from 70+ government agencies [^1525^] |
| **License** | Singapore Open Data Licence v1.0 — free for commercial/personal use with attribution [^1537^] |
| **API Type** | RESTful API (Collection API + Dataset API + Real-time APIs) |
| **Auth Required** | Optional (public access available; API key for higher rate limits) |
| **Formats** | CSV, JSON, GeoJSON, KML, XLSX |

### Key Datasets for CSOAI
- **Business**: ACRA corporate entity information, registered businesses
- **Construction**: BCA construction project data, HDB information
- **Environment**: PSI (air quality), rainfall, temperature, dengue clusters
- **Transport**: Traffic conditions, public transport data, parking availability
- **Real Estate**: Property transaction data, rental statistics
- **Demographics**: Population data, immigration statistics
- **Government**: Government procurement, budget data
- **Real-time APIs**: Weather, traffic conditions (1-minute intervals) [^1537^]

### API Access
- **Collections API**: `https://api-production.data.gov.sg/v2/public/api/collections`
- **Datasets API**: `https://api-production.data.gov.sg/v2/public/api/datasets`
- **Real-time APIs**: `https://api.data.gov.sg/v1/` (weather, traffic, etc.)
- **13 million API calls/month** usage [^1525^]

---

## 6. India — Data.gov.in

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.gov.in/ |
| **Datasets** | 100,000+ datasets from ministries and state departments [^1576^] |
| **License** | Government Open Data Licence — India (GODL) — free for reuse with attribution [^1571^] |
| **API Type** | RESTful APIs for datasets; CKAN-based catalog API |
| **Auth Required** | Optional registration |
| **Formats** | CSV, XLS, JSON, XML, RDF, PDF, GeoTIFF |

### Key Datasets for CSOAI
- **Demographics**: Census data (national, state, district-level), population statistics
- **Agriculture**: Crop production, agricultural census, irrigation data
- **Health**: Disease surveillance, hospital statistics, immunization data
- **Education**: School enrollment, literacy rates, higher education statistics
- **Economy**: GDP data, trade statistics, industrial production
- **Transport**: Road networks, railway data, vehicle registration
- **Environment**: Pollution data, forest cover, water resources
- **Government**: Budget data, procurement, election data

### API Access
- **CKAN API**: `https://data.gov.in/api/3/action/package_list`
- **Dataset-specific APIs**: Many datasets provide dedicated REST APIs
- **Visualization Engine**: `https://visualize.data.gov.in` — create maps and charts
- **State Portals**: Karnataka, Kerala, Odisha, Punjab, Sikkim, Tamil Nadu [^1571^]

---

## 7. Japan — Data.go.jp / e-Stat

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://www.e-stat.go.jp/ (Portal Site of Official Statistics of Japan) |
| **Datasets** | Comprehensive national statistics across 50+ domains |
| **License** | Statistics Act compliant; generally open for research/commercial use |
| **API Type** | e-Stat API (RESTful JSON), SDMX |
| **Auth Required** | App ID required for API access |
| **Formats** | CSV, Excel, JSON, SDMX-ML, PDF, StatAPI output |

### Key Datasets for CSOAI
- **Demographics**: Population census, vital statistics, migration data
- **Economy**: National accounts, GDP, industrial production, corporate statistics
- **Labor**: Labor force survey, employment statistics, wages
- **Agriculture**: Agricultural census, crop production, forestry/fisheries
- **Trade**: Customs statistics, export/import data
- **Transport**: Traffic volume, transport infrastructure
- **Energy**: Energy supply/demand, renewable energy statistics
- **Health**: Health and welfare statistics, medical facilities
- **Regional**: Municipality-level statistics (SSDS) [^1531^]

### API Access
- **e-Stat API**: `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData`
- **App ID Registration**: Required (free)
- **Regional Statistics**: System of Social and Demographic Statistics (SSDS) API

---

## 8. Canada — Open.Canada.ca

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://open.canada.ca/en |
| **Search Portal** | https://search.open.canada.ca/ |
| **API Docs** | https://open.canada.ca/en/access-our-application-programming-interface-api |
| **Datasets** | 37,650+ open datasets; 35,508 federal, 11,601 provincial/territorial [^1564^] |
| **License** | Open Government Licence — Canada |
| **API Type** | CKAN API (RESTful) |
| **Auth Required** | No |
| **Formats** | CSV, JSON, XML, GeoJSON, NetCDF, Shapefile, Excel, GeoTIFF |

### Key Datasets for CSOAI
- **Census**: Statistics Canada population census, demographic data
- **Economy**: Financial performance data by industry, business dynamics
- **Environment**: Climate data (Historical Climate Data), geospatial data (Open Maps)
- **Health**: FluWatch surveillance, health product databases
- **Science**: Federal science libraries data, space data (CSA)
- **Marine**: Fisheries and ocean data (BioChem, oceanographic databases)
- **Transport**: Transport Canada open data, aviation safety
- **Energy**: Natural Resources Canada energy data
- **Agriculture**: Agroclimate data, food inspection data

### API Access
- **CKAN API**: `https://open.canada.ca/data/en/api/3/`
- **Actions**: `package_list`, `package_search`, `recently_changed_packages_activity_list`
- **Space Agency API**: `https://donnees-data.asc-csa.gc.ca/api/3/` [^1562^]
- **Statistics Canada API**: `https://api.statcan.gc.ca/` (RESTful)

---

## 9. United Nations — UN Data Portal

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.un.org/ |
| **UNdata API** | https://unstats.un.org/unsd/api/ |
| **Population API** | https://population.un.org/dataportalapi/api/v1/ |
| **SDG API** | https://unstats.un.org/SDGAPI/v1/sdg/ |
| **Datasets** | 60+ data sources, 30+ statistical databases |
| **License** | UN Terms of Use — free for research/education |
| **API Type** | SDMX API (SOAP/REST), REST JSON API |
| **Auth Required** | No |
| **Formats** | JSON, XML, SDMX, CSV, Excel |

### Key Datasets for CSOAI
- **Population**: World Population Prospects (WPP), fertility, mortality, migration
- **Economy**: National accounts, trade statistics (COMTRADE), industrial data (UNIDO)
- **SDG Indicators**: All 17 Sustainable Development Goal indicators [^1463^]
- **Demographics**: Family planning, marital status, contraceptive prevalence
- **Trade**: UN COMTRADE — bilateral trade data by commodity and partner
- **Environment**: UN Environment statistics
- **Health**: WHO data (see Section 15)
- **Energy**: UN Energy Statistics Database
- **Crime**: UN Crime Trends Survey

### API Access
- **UNPD API**: `https://population.un.org/dataportalapi/api/v1/`
  - `/indicators` — list all indicators
  - `/data/indicators/{id}/locations/{id}/start/{year}/end/{year}` — query data
  - `/locations` — geographic areas with ISO codes [^1463^]
- **SDG API**: `https://unstats.un.org/SDGAPI/v1/sdg/` — Goal/List, Series/Data
- **COMTRADE API**: `https://comtrade.un.org/api/` — bulk and query APIs [^1466^]
- **UNIDO API**: `https://stat.unido.org/portal/swagger-ui/index.html` [^1471^]

---

## 10. World Bank — Open Data

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data.worldbank.org/ |
| **API Docs** | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation |
| **Datasets** | 45+ databases, 16,000+ time series indicators [^1464^] |
| **License** | CC BY 4.0 — Creative Commons Attribution |
| **API Type** | RESTful Indicators API (V2) |
| **Auth Required** | No |
| **Formats** | JSON, XML, JSON-stat, JSONP, CSV |

### Key Datasets for CSOAI
- **World Development Indicators (WDI)**: 1,400+ indicators across 217 economies
- **International Debt Statistics**: External debt of developing countries
- **Doing Business**: Business regulations indicators
- **Human Capital Index**: Education and health outcomes
- **Subnational Poverty**: Poverty data at subnational level
- **Global Economic Monitor**: Commodity prices, economic indicators
- **Climate Change**: CO2 emissions, energy use, renewable energy
- **Education**: EdStats — education statistics
- **Health**: Health, nutrition and population statistics
- **Poverty & Equity**: Income distribution, poverty headcount

### API Access
- **Base URL**: `https://api.worldbank.org/v2/`
- **Indicators**: `/indicator` — list all indicators
- **Country Data**: `/country/{code}/indicator/{indicator_code}`
- **Examples**: `/country/all/indicator/SP.POP.TOTL` — total population
- **Formats**: Add `?format=json` or `?format=xml` [^1464^] [^1468^]
- **Python Library**: `wbdata`, `wbgapi` packages available [^1465^]

---

## 11. OECD — Data Explorer

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://data-explorer.oecd.org/ |
| **API Docs** | https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html |
| **Datasets** | Comprehensive economic, social, and environmental indicators for 38 member countries |
| **License** | OECD Terms and Conditions — free for non-commercial research; attribution required |
| **API Type** | SDMX-REST API |
| **Auth Required** | No (rate-limited: 60 downloads/hour) [^1593^] |
| **Formats** | JSON, XML, CSV, SDMX-ML, SDMX-JSON |

### Key Datasets for CSOAI
- **Economy**: National accounts, GDP, economic outlook
- **Employment**: Labour market statistics, unemployment rates, wages
- **Education**: PISA results, education at a glance
- **Health**: Health expenditure, health outcomes
- **Environment**: Environmental indicators, climate data
- **Trade**: International trade statistics, agricultural trade
- **Social**: Income inequality, social expenditure, migration
- **Innovation**: Science and technology indicators
- **Agriculture**: Agricultural outlook, farm statistics
- **Taxation**: Tax revenue statistics

### API Access
- **Base URL**: `https://sdmx.oecd.org/public/rest/`
- **Dataflows**: `/dataflow/all` — list all datasets
- **Data Query**: `/data/{agency}/{dataset}/{dimensions}?startPeriod={year}`
- **Structure Query**: Provides dataset dimensions and metadata
- **Example**: Unemployment rate query for OECD countries [^1587^] [^1588^]
- **Developer API**: Click "Developer API" icon in Data Explorer for auto-generated queries

---

## 12. FAO — FAOSTAT

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://www.fao.org/faostat/ |
| **Data Catalog** | https://data.apps.fao.org/catalog |
| **API Docs** | https://fenixservices.fao.org/faostat/api/ |
| **Datasets** | World's largest food and agriculture database — 245+ countries, 1961–present [^1469^] |
| **License** | CC BY-NC-SA 3.0 IGO (generally free for research) |
| **API Type** | FAOSTAT API (RESTful), CKAN catalog API |
| **Auth Required** | No |
| **Formats** | JSON, CSV, Excel, bulk ZIP downloads |

### Key Datasets for CSOAI
- **Production**: Crops, livestock, agricultural production by country
- **Trade**: Bilateral trade in food and agricultural products
- **Food Security**: Food balance sheets, food supply, undernourishment
- **Prices**: Producer prices, consumer prices
- **Land Use**: Agricultural land, forest area, land use change
- **Fisheries**: Aquaculture, capture fisheries production
- **Forestry**: Forest products, deforestation data
- **Climate**: Agro-environmental indicators, emissions from agriculture
- **Nutrition**: Dietary energy supply, micronutrient availability
- **Investment**: Government expenditure on agriculture

### API Access
- **FAOSTAT API**: New developer portal with consistent interface
- **CKAN Catalog**: `https://data.apps.fao.org/catalog/api/3/action/package_search`
- **Bulk Downloads**: Available for all domains [^1561^]
- **Python/R Libraries**: `faostat` package for Python, `FAOSTAT` for R [^1563^]

---

## 13. ILO — ILOSTAT

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://ilostat.ilo.org/ |
| **API Docs** | https://ilostat.ilo.org/data/introduction-to-data-access/ |
| **Datasets** | 15.6+ million rows covering 189+ countries, 1969–present [^1560^] |
| **License** | CC BY 4.0 — Creative Commons Attribution |
| **API Type** | SDMX REST API, SDMX-JSON, SDMX-ML |
| **Auth Required** | No |
| **Formats** | JSON, XML, CSV, SDMX-ML, SDMX-JSON |

### Key Datasets for CSOAI
- **Employment**: Employment by sector, occupation, status
- **Unemployment**: Unemployment rates by age, sex, education
- **Earnings**: Wage data, minimum wages, earnings by occupation
- **Hours of Work**: Working hours, time use
- **Labor Force**: Labor force participation rates
- **Informal Economy**: Informal employment statistics
- **Child Labor**: Child labor estimates
- **Migration**: Migrant worker statistics
- **Social Protection**: Social security coverage
- **Skills**: Skills mismatch, training participation

### API Access
- **Base URL**: `https://www.ilo.org/sdmx/rest/`
- **SDMX API**: Full implementation of SDMX RESTful API
- **Python**: `pandasdmx` library supports ILOSTAT
- **Bulk Download**: Full database available as Parquet/CSV [^1559^] [^1560^]

---

## 14. UNESCO — Institute for Statistics (UIS)

| Attribute | Details |
|-----------|---------|
| **Portal URL** | http://data.uis.unesco.org/ |
| **API Docs** | https://apiportal.uis.unesco.org/ |
| **Datasets** | 4,636+ indicators across education, science, culture, communication |
| **License** | UNESCO Open Data terms — free for research with attribution |
| **API Type** | REST API (UIS Data API) |
| **Auth Required** | No |
| **Formats** | JSON, CSV, Excel, SDMX |

### Key Datasets for CSOAI
- **Education**: School enrollment, literacy, education attainment, teacher statistics
- **Science**: R&D expenditure, researchers, scientific publications
- **Culture**: Cultural employment, heritage sites
- **Communication**: Internet penetration, mobile subscriptions
- **Demographics**: Population by age, school-age population
- **SDG 4**: Education-related SDG indicators
- **ICT in Education**: Technology in education statistics
- **Financing**: Education expenditure, aid to education
- **Equity**: Gender parity indices, disadvantaged groups
- **Out-of-School Children**: OOSCI global dataset

### API Access
- **API Portal**: https://apiportal.uis.unesco.org/
- **Indicators List**: `uis_get_indicators()` — 4,636 indicators [^1565^]
- **Data Query**: Filter by indicator, country, year
- **SDG Gateway**: Direct access to SDG 4 data
- **Bulk Download**: Full datasets available for download

---

## 15. WHO — Global Health Observatory

| Attribute | Details |
|-----------|---------|
| **Portal URL** | https://www.who.int/data/gho |
| **API Docs** | https://www.who.int/data/gho/info/gho-odata-api |
| **Datasets** | 2,301+ health indicators for 245 countries/regions [^1498^] |
| **License** | WHO terms — free for research; attribution required |
| **API Type** | OData API (Open Data Protocol) |
| **Auth Required** | No (API key optional) |
| **Formats** | JSON, XML, CSV, Excel (SpreadsheetML), OData |

### Key Datasets for CSOAI
- **Mortality**: Life expectancy, causes of death, maternal mortality
- **Disease Burden**: NCDs, infectious diseases, mental health
- **Health Systems**: Health expenditure, hospital beds, workforce
- **Risk Factors**: Air pollution, tobacco use, alcohol consumption
- **Immunization**: Vaccination coverage by disease
- **Nutrition**: Stunting, wasting, obesity prevalence
- **Maternal Health**: Antenatal care, skilled birth attendance
- **Child Health**: Under-5 mortality, neonatal mortality
- **Environmental Health**: Water, sanitation, hygiene (WASH)
- **SDG 3**: Health-related Sustainable Development Goal indicators

### API Access
- **Base URL**: `https://ghoapi.azureedge.net/api/`
- **Dimensions**: `/api/Dimension` — list all dimensions
- **Indicators**: `/api/Indicator` — list all indicators with codes
- **Data Query**: `/api/{INDICATOR_CODE}` — retrieve specific indicator data
- **Filtering**: `$filter=Dim1 eq 'MLE'` for sex filtering [^1577^] [^1497^]
- **OData Support**: Direct connection from Tableau, PowerBI [^1498^]

---

## 16. Additional Notable Portals

### Regional/Other Important Portals

| Portal | URL | Region | Key Data |
|--------|-----|--------|----------|
| **data.gouv.fr** (France) | https://www.data.gouv.fr/ | France | National + local government data |
| **GovData.de** (Germany) | https://www.govdata.de/ | Germany | Federal, state, municipal data |
| **data.overheid.nl** (Netherlands) | https://data.overheid.nl/ | Netherlands | Dutch government open data |
| **StatBank Denmark** | https://www.statbank.dk/ | Denmark | Statistics Denmark data |
| **Statistics Sweden** | https://www.scb.se/ | Sweden | Swedish statistical data |
| **Eurostat** | https://ec.europa.eu/eurostat/ | EU | EU statistics, economy, population |
| **IMF Data** | https://data.imf.org/ | Global | Financial, economic, monetary data |
| **UN DESA** | https://unstats.un.org/unsd/ | Global | UN Statistics Division databases |
| **WTO Statistics** | https://stats.wto.org/ | Global | World trade statistics |
| **data.go.th** (Thailand) | https://data.go.th/ | Thailand | Thai government open data |
| **data.gov.my** (Malaysia) | https://data.gov.my/ | Malaysia | Malaysian open data |
| **data.gov.hr** (Croatia) | https://data.gov.hr/ | Croatia | Croatian open data |
| **Open Data for Africa** | https://opendataforafrica.org/ | Africa | AfDB continental data platform |
| **data.gov.ua** (Ukraine) | https://data.gov.ua/ | Ukraine | Ukrainian open data |

---

## 17. Quick Comparison Matrix

| Portal | Region | Datasets | API | Auth | Key Formats | License |
|--------|--------|----------|-----|------|-------------|---------|
| **data.gov** | US | 361K+ | CKAN REST | Optional | CSV, JSON, GeoJSON | CC0/Public |
| **data.europa.eu** | EU | 1M+ | CKAN + SPARQL | No | CSV, JSON, RDF | CC BY 4.0 |
| **data.gov.uk** | UK | 47K+ | CKAN | No | CSV, JSON, GeoJSON | OGL v3.0 |
| **data.gov.au** | Australia | 30K+ | CKAN | No | CSV, JSON, NetCDF | CC BY 4.0 |
| **data.gov.sg** | Singapore | 4.5K+ | REST | Optional | CSV, JSON, GeoJSON | SG Open Data |
| **data.gov.in** | India | 100K+ | CKAN + REST | Optional | CSV, JSON, XML | GODL |
| **e-stat.go.jp** | Japan | 50+ domains | SDMX REST | App ID | CSV, JSON, SDMX | Open |
| **open.canada.ca** | Canada | 37K+ | CKAN | No | CSV, JSON, GeoJSON | OGL-Canada |
| **UN Data** | Global | 60+ sources | SDMX REST | No | JSON, XML, CSV | UN Terms |
| **World Bank** | Global | 16K indicators | REST V2 | No | JSON, XML, CSV | CC BY 4.0 |
| **OECD** | 38 countries | Comprehensive | SDMX | No | JSON, XML, CSV | OECD Terms |
| **FAOSTAT** | Global | 245 countries | REST + CKAN | No | JSON, CSV, Excel | CC BY-NC-SA |
| **ILOSTAT** | 189+ countries | 15.6M rows | SDMX | No | JSON, XML, CSV | CC BY 4.0 |
| **UNESCO UIS** | Global | 4.6K indicators | REST | No | JSON, CSV, Excel | Open |
| **WHO GHO** | 245 countries | 2.3K indicators | OData | Optional | JSON, XML, CSV | WHO Terms |

---

## CSOAI Relevance Summary by Industry Hive

| Industry Hive | Top Data Portals | Key Datasets |
|---------------|-----------------|--------------|
| **Healthcare/Biotech** | WHO GHO, data.gov (CDC), data.gov.uk (NHS), open.canada.ca | Disease surveillance, health expenditure, clinical trials |
| **Finance/Fintech** | World Bank, OECD, data.gov (SEC/FDIC), IMF | Economic indicators, banking data, stock market data |
| **Agriculture/Food** | FAO FAOSTAT, data.gov (USDA), data.europa.eu | Crop production, trade, food security, climate |
| **Energy/Climate** | data.gov (EPA/NOAA), data.europa.eu (Copernicus), open.canada.ca | Emissions, renewable energy, weather, satellite |
| **Transport/Logistics** | data.gov (DOT), data.gov.sg, data.gov.uk | Traffic, public transit, shipping, aviation |
| **Education/EdTech** | UNESCO UIS, World Bank EdStats, data.gov.uk | Enrollment, literacy, PISA, learning outcomes |
| **Labor/HR Tech** | ILOSTAT, OECD, data.gov (BLS), national portals | Employment, wages, skills, labor force |
| **Real Estate/PropTech** | data.gov (HUD/Census), data.gov.sg, data.gov.in | Property prices, housing census, urban planning |
| **Legal/Compliance** | data.gov.uk (legislation), UN Data, national portals | Laws, regulations, court data, sanctions |
| **Environment/Sustainability** | EPA, FAO, UNEP, World Bank | Pollution, biodiversity, deforestation, water |
| **Manufacturing** | UNIDO, OECD, national statistics offices | Industrial production, capacity utilization |
| **Retail/E-commerce** | Census Bureau, OECD, national portals | Consumer spending, demographics, trade |

---

## License Summary for All Portals

All portals listed in this report provide **free, open access** to government data. Licensing generally falls into these categories:

1. **Public Domain / CC0**: US Federal data (data.gov) — no restrictions
2. **Creative Commons Attribution (CC BY 4.0)**: World Bank, EU, Australia, ILO — requires attribution
3. **Open Government Licence (OGL)**: UK, Canada — allows commercial use with attribution
4. **Organization-Specific Terms**: UN, WHO, OECD, UNESCO — generally free for research; check terms
5. **National Open Data Licenses**: Singapore, India — country-specific open licenses

> **Note**: Always verify the specific license for each dataset before use, especially for commercial AI training applications.

---

## Sources

- [^1475^] data.europa.eu — European Data Portal
- [^1462^] data.europa.eu/en/faq — FAQ page
- [^1469^] data.europa.eu/en/which-apis-are-available — API documentation
- [^1463^] population.un.org/dataportal/about/dataapi — UN Population Data API
- [^1464^] datahelpdesk.worldbank.org — World Bank API Documentation
- [^1465^] dlthub.com — World Bank Indicators API Python Docs
- [^1466^] unstats.un.org/unsd/api — UNSD API Catalogue
- [^1468^] datahelpdesk.worldbank.org — Indicator API Queries
- [^1470^] data.worldbank.org — World Bank Open Data
- [^1471^] stat.unido.org — UNIDO Statistics Portal API
- [^1472^] r-bloggers.com — Extracting Data from OECD Databases
- [^1473^] api.gov.uk/ons/statistics — UK ONS Statistics API
- [^1474^] oecd.org/en/data/api — OECD API documentation
- [^1497^] who.int/data/gho/info/athena-api — WHO Athena API
- [^1498^] medium.com — Connect to WHO GHO Data API
- [^1522^] atlas.co/data-portals/data-gov-sg — Data.gov.sg Overview
- [^1523^] atlas.co/data-portals/data-gov-uk — Data.gov.uk Overview
- [^1524^] developer.vic.gov.au/api-catalogue — Victoria API Catalogue
- [^1525^] tech.gov.sg/data-gov-sg — Data.gov.sg Government Page
- [^1526^] guide.data.gov.sg/developer-guide/api-overview — Data.gov.sg API Guide
- [^1527^] github.com/i-dot-ai/awesome-gov-datasets — UK Government Datasets
- [^1528^] apify.com/data-gov-au-scraper — Australia Open Data Scraper
- [^1529^] researchdata.edu.au/data-gov-au — Data.gov.au Info
- [^1531^] e-stat.go.jp — Portal Site of Official Statistics of Japan
- [^1535^] guidance.data.gov.uk — UK Data API Documentation
- [^1538^] en.wikipedia.org/wiki/Data.gov.uk — Data.gov.uk Wikipedia
- [^1555^] science.gc.ca — Canadian Government Datasets and Portals
- [^1556^] open.gsa.gov/api/datadotgov — Data.gov API Documentation
- [^1558^] data.apps.fao.org — FAO Data Catalogue
- [^1559^] webapps.ilo.org — ILOSTAT SDMX API Guide
- [^1560^] botmarket.oec.world — ILOSTAT Labour Statistics
- [^1561^] fao.org/statistics — FAOSTAT API Developer Portal
- [^1562^] asc-csa.gc.ca/API — Canadian Space Agency API
- [^1564^] search.open.canada.ca — Open Government Portal Canada
- [^1565^] tidy-intelligence.github.io/r-uisapi — UNESCO Institute for Statistics API
- [^1566^] open.canada.ca/en — Open Government Canada
- [^1567^] open.canada.ca/en/api — Canada CKAN API Access
- [^1571^] indiapost.gov.in/OGD.pdf — Open Government Data Platform India
- [^1574^] towardsdatascience.com — WHO GHO Data Analytics
- [^1576^] en.wikipedia.org/wiki/Data.gov.in — Data.gov.in Wikipedia
- [^1577^] who.int/data/gho/info/gho-odata-api — WHO GHO OData API
- [^1579^] data.gov — Data.gov Homepage
- [^1587^] r-bloggers.com — Extracting OECD Data
- [^1588^] oecd.org/api — OECD API Best Practices
- [^1593^] oecd.org/api-best-practices — OECD API Rate Limiting
