# Free/Open Trade & Economic Data Sources Catalog

> **Document for CSOAI Finance, Transport, Manufacturing Hives**
> Coverage: Trade statistics, sanctions lists, economic indicators, tariff data, gravity models
> License: All sources listed are free for non-commercial use unless otherwise noted

---

## Table of Contents

1. [Trade Flow Databases](#1-trade-flow-databases)
   - 1.1 UN Comtrade
   - 1.2 WTO Statistics Database
   - 1.3 IMF Direction of Trade Statistics (DOTS)
   - 1.4 WITS (World Integrated Trade Solution)
   - 1.5 BACI (CEPII)
   - 1.6 TradeMap (ITC)
   - 1.7 Eurostat Comext
   - 1.8 FAOSTAT
2. [Sanctions & Compliance Lists](#2-sanctions--compliance-lists)
   - 2.1 OFAC SDN List (US Treasury)
   - 2.2 EU Consolidated Sanctions List
   - 2.3 UN Security Council Consolidated List
   - 2.4 UK Sanctions List (OFSI/UKSL)
   - 2.5 OpenSanctions
3. [Gravity & Bilateral Datasets](#3-gravity--bilateral-datasets)
   - 3.1 CEPII Gravity Database
   - 3.2 Dynamic Gravity Dataset (USITC)
4. [Macroeconomic & Historical Datasets](#4-macroeconomic--historical-datasets)
   - 4.1 Penn World Table (PWT)
   - 4.2 Maddison Project Database
5. [Trade Policy & Protection](#5-trade-policy--protection)
   - 5.1 Global Trade Alert
   - 5.2 UNCTAD TRAINS
   - 5.3 Market Access Map (ITC)
6. [Summary Matrix](#6-summary-matrix)
7. [CSOAI Use Case Mapping](#7-csoai-use-case-mapping)

---

## 1. Trade Flow Databases

### 1.1 UN Comtrade

| Attribute | Detail |
|-----------|--------|
| **Name** | UN Comtrade Database |
| **URL** | https://comtradeplus.un.org/ |
| **Maintainer** | UN Statistics Division (UNSD) |
| **Description** | The world's most comprehensive global trade data platform. Aggregates detailed global annual and monthly trade statistics by product and trading partner. Covers ~200 countries, representing >99% of world's merchandise trade. |
| **Data Coverage** | 1962-present; HS (92,96,02,07,12,17,22), SITC, BEC classifications |
| **Format** | CSV, JSON, XML, bulk ZIP (.gz) |
| **License** | Free for non-commercial use; premium subscription for bulk downloads |
| **API** | REST API at `comtrade.un.org/api/get?` - free tier: 500 API calls/day, 100K records/call |
| **Bulk Download** | Available via premium subscription (free 15-day trial); also via `comtradeapicall` Python package |
| **Python Package** | `pip install comtradeapicall` |
| **GitHub** | https://github.com/uncomtrade/comtradeapicall |
| **Key Parameters** | `type=C/S` (goods/services), `freq=A/M`, `px=HS/SITC`, `r=reporter`, `p=partner`, `rg=1/2` (import/export), `cc=commodity_code` |
| **CSOAI Use Case** | Primary source for global bilateral trade flows; supply chain mapping; trade dependency analysis |
| **Citation** | [^1457^][^1459^][^1463^][^1467^] |

**Sample API Call:**
```
http://comtrade.un.org/api/get?max=10000&type=C&freq=A&px=S2&ps=2021&r=all&p=156&rg=2&cc=AG2
```

---

### 1.2 WTO Statistics Database

| Attribute | Detail |
|-----------|--------|
| **Name** | WTO Stats Portal / WTO Statistics Database |
| **URL** | https://www.wto.org/statistics |
| **Maintainer** | World Trade Organization |
| **Description** | Authoritative statistics on merchandise trade and commercial services trade. Includes annual, quarterly and monthly data, interactive tools, analytical publications, and trade forecasts. |
| **Data Coverage** | Merchandise trade (value and volume), commercial services, digitally delivered services, trade by mode of supply |
| **Format** | Excel, CSV; API returns JSON/SOAP |
| **License** | Free |
| **API** | Available via WTO Stats Portal; REST API with developer account |
| **Bulk Download** | Compressed CSV for select datasets (Trade in Services by Mode of Supply, WTO-OECD Balanced Trade in Services) |
| **Interactive Tools** | World Trade Statistics interactive tool, WTO Stats Dashboard, monthly merchandise trade statistics tool |
| **CSOAI Use Case** | Global trade trends, services trade analysis, trade forecast benchmarking, policy impact assessment |
| **Citation** | [^1462^][^1464^] |

---

### 1.3 IMF Direction of Trade Statistics (DOTS)

| Attribute | Detail |
|-----------|--------|
| **Name** | International Trade in Goods by Partner Country (formerly DOTS) |
| **URL** | https://data.imf.org/en/datasets/IMF.STA:IMTS |
| **Maintainer** | International Monetary Fund |
| **Description** | Goods (merchandise) export and import statistics disaggregated by trading partners. Now part of IMF Data Portal as "International Trade in Goods by Partner Country" (IMTS). |
| **Data Coverage** | 1948-present; ~187 countries; monthly, quarterly, annual |
| **Format** | Excel, CSV, SDMX |
| **License** | Free |
| **API** | IMF Data API (JSON, SDMX-ML) |
| **Bulk Download** | Available via IMF Data Portal; Excel Add-in |
| **Access** | https://db.nomics.world/IMF/DOT |
| **CSOAI Use Case** | Bilateral trade balance analysis, currency impact on trade, country-level trade forecasting |
| **Citation** | [^1473^][^1474^][^1476^] |

---

### 1.4 WITS (World Integrated Trade Solution)

| Attribute | Detail |
|-----------|--------|
| **Name** | World Integrated Trade Solution |
| **URL** | https://wits.worldbank.org/ |
| **Maintainer** | World Bank Group (with UNCTAD, WTO) |
| **Description** | Comprehensive platform centralizing global trade statistics, tariff schedules, and non-tariff measure data. Integrates UN Comtrade, UNCTAD TRAINS, WTO IDB/CTS, and GPTAD. |
| **Data Coverage** | 219 economies; trade flows, MFN/bound/preferential tariffs, NTMs, GVC data |
| **Format** | Excel, CSV; API returns JSON/XML |
| **License** | Free with registration; separate terms for each underlying dataset |
| **API** | WITS REST API - https://wits.worldbank.org/witsapiintro.aspx |
| **Bulk Download** | Dedicated bulk download tool for trade flows and tariffs |
| **Python Package** | `pip install world_trade_data` |
| **GitHub** | https://github.com/mwouts/world_trade_data |
| **CSOAI Use Case** | Tariff analysis, trade policy simulation, market access assessment, NTMs mapping |
| **Citation** | [^1460^][^1465^][^1471^][^1477^] |

---

### 1.5 BACI (CEPII)

| Attribute | Detail |
|-----------|--------|
| **Name** | BACI - Bilateral Trade Flows Database |
| **URL** | https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html |
| **Maintainer** | CEPII (Centre d'Etudes Prospectives et d'Informations Internationales) |
| **Description** | Harmonized bilateral trade data at the 6-digit HS level for 200+ countries. Reconciles mirror flows reported by exporters and importers, correcting for CIF/FOB differences and reporting reliability. |
| **Data Coverage** | 1995-2024 (depending on HS revision); 7 HS revisions (HS92, HS96, HS02, HS07, HS12, HS17, HS22) |
| **Format** | CSV files (one per year); ZIP archives |
| **License** | Free for academic/research use |
| **API** | No direct API; bulk CSV download |
| **Bulk Download** | Direct ZIP download for each HS revision |
| **Python Access** | `pandas.read_csv()` after download |
| **Key Variables** | Exporter code, Importer code, Product code (HS6), Trade value (USD), Quantity (metric tonnes) |
| **CSOAI Use Case** | Gravity model estimation, product-level trade analysis, network analysis of trade relationships |
| **Citation** | [^1428^][^1433^][^1435^][^1436^] |

---

### 1.6 TradeMap (ITC)

| Attribute | Detail |
|-----------|--------|
| **Name** | Trade Map |
| **URL** | https://www.trademap.org/ |
| **Maintainer** | International Trade Centre (ITC) - UNCTAD/WTO |
| **Description** | Web tool providing trade indicators on export performance, international demand, alternative markets, and competitive markets. Based on UN Comtrade with mirror statistics for non-reporting countries. |
| **Data Coverage** | 220+ countries; 5,300+ HS products (2, 4, 6-digit); time series since 2001 |
| **Format** | Online tables, charts, maps; Excel export |
| **License** | Free basic access; paid subscription for advanced features |
| **API** | Not publicly documented |
| **Bulk Download** | Excel export available per query; limited in free tier |
| **Free Tier** | Available for developing countries; limited indicators for developed countries |
| **CSOAI Use Case** | Market identification, competitor analysis, trade performance monitoring, company directory access |
| **Citation** | [^1450^][^1451^][^1454^] |

---

### 1.7 Eurostat Comext

| Attribute | Detail |
|-----------|--------|
| **Name** | Comext - International Trade in Goods Database |
| **URL** | https://ec.europa.eu/eurostat/web/international-trade-in-goods/database |
| **Maintainer** | Eurostat (European Commission) |
| **Description** | Eurostat's reference database for detailed statistics on international trade in goods. Provides EU, euro area, EU member states, and many non-EU countries. |
| **Data Coverage** | Monthly: 2000-present; Annual: 1988-present; CN8 classification |
| **Format** | CSV (bulk), SDMX-ML, SDMX-CSV, JSON-stat, TSV |
| **License** | Free (EU Open Data) |
| **API** | REST API at `ec.europa.eu/eurostat/api/comext/dissemination` |
| **Bulk Download** | https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/dataflow/ESTAT/all |
| **Key Notes** | Separate API endpoint for Comext datasets (adds `/comext/` in URL); full dataset download requires filtering |
| **CSOAI Use Case** | EU trade analysis, intra-EU vs extra-EU trade, regulatory compliance with EU trade rules |
| **Citation** | [^1462^][^1463^][^1464^][^1467^] |

---

### 1.8 FAOSTAT

| Attribute | Detail |
|-----------|--------|
| **Name** | FAOSTAT - Food and Agriculture Statistics |
| **URL** | https://www.fao.org/faostat/en/ |
| **Maintainer** | Food and Agriculture Organization of the United Nations (FAO) |
| **Description** | Free access to food and agriculture data for 245+ countries/territories. Includes trade of crops, livestock, forestry, fishery products. |
| **Data Coverage** | 1961-present; trade data for agricultural commodities |
| **Format** | CSV, Excel, SDMX; bulk download available |
| **License** | Free (Creative Commons) |
| **API** | REST API available; catalog-based data discovery |
| **Bulk Download** | Full domain downloads available via FAOSTAT portal |
| **CSOAI Use Case** | Agricultural trade flows, food security analysis, agrifood supply chain mapping |
| **Citation** | [^1461^][^1465^][^1471^][^1472^] |

---

## 2. Sanctions & Compliance Lists

### 2.1 OFAC SDN List (US Treasury)

| Attribute | Detail |
|-----------|--------|
| **Name** | OFAC Specially Designated Nationals (SDN) and Consolidated Lists |
| **URL** | https://sanctionslist.ofac.treas.gov/ |
| **Maintainer** | U.S. Department of Treasury - Office of Foreign Assets Control |
| **Description** | The SDN List includes individuals, entities, vessels, and aircraft blocked by OFAC. The Consolidated List includes all non-SDN sanctions lists (FSE, SSI, NS-PLC, NS-MBS, NS-CMIC, etc.). |
| **Data Coverage** | All US sanctions programs; updated daily (weekdays) |
| **Format** | XML, CSV, JSON, PDF, TXT |
| **License** | Public domain (US government) |
| **API** | OFAC Sanctions List Service (SLS) API - supports GET commands |
| **Bulk Download** | Full SDN and Consolidated lists via `sanctionslist.ofac.treas.gov`; customizable datasets by program |
| **Download Links** | SDN: `https://sanctionslist.ofac.treas.gov/Home/Consolidated`; Delta files available |
| **Key Programs** | SDN, FSE, SSI, NS-MBS, NS-CMIC, NS-PLC, Burma, Iran, Russia, DPRK |
| **CSOAI Use Case** | **CRITICAL for compliance**: Transaction screening, customer due diligence, trade finance sanctions checks, counterparty verification |
| **Citation** | [^1458^][^1461^][^1466^][^1469^] |

---

### 2.2 EU Consolidated Sanctions List

| Attribute | Detail |
|-----------|--------|
| **Name** | EU Consolidated List of Financial Sanctions (CFSP) |
| **URL** | https://www.sanctionsmap.eu/ (Sanctions Map); XML feed via EEAS |
| **Maintainer** | European External Action Service (EEAS) |
| **Description** | Consolidated list of persons, groups, and entities subject to EU financial sanctions under the Common Foreign & Security Policy. Includes terrorism, country embargoes, human rights sanctions. |
| **Data Coverage** | All EU sanctions regimes; updated regularly |
| **Format** | XML (primary), PDF, HTML |
| **License** | Public (EU regulation) |
| **API** | No direct API; XML download via HTTPS |
| **Bulk Download** | XML file available at direct link; downloadable via `https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?export` |
| **CSOAI Use Case** | EU compliance screening, export control verification, financial sanctions checks for EU operations |
| **Citation** | [^1431^][^1440^][^1441^] |

---

### 2.3 UN Security Council Consolidated List

| Attribute | Detail |
|-----------|--------|
| **Name** | UN Security Council Consolidated List |
| **URL** | https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list |
| **Maintainer** | UN Security Council |
| **Description** | Includes all individuals and entities subject to measures imposed by the Security Council across all sanctions committees (1267/1989, 1718 DPRK, 1737 Iran, 1970 Libya, etc.). |
| **Data Coverage** | All UN sanctions regimes; 730+ individuals, 272+ entities |
| **Format** | XML, PDF, HTML |
| **License** | Public domain (UN) |
| **API** | No direct API; XML/PDF available via HTTPS |
| **Bulk Download** | Alphabetical list: `https://scsanctions.un.org/consolidated/`; By reference number: `https://scsanctions.un.org/r/` |
| **Delta Files** | Archive of published delta files by year available |
| **CSOAI Use Case** | Global compliance baseline, cross-reference for national sanctions lists, terrorism financing checks |
| **Citation** | [^1429^][^1430^][^1432^][^1434^][^1438^] |

---

### 2.4 UK Sanctions List (OFSI/UKSL)

| Attribute | Detail |
|-----------|--------|
| **Name** | UK Sanctions List (UKSL) |
| **URL** | https://www.gov.uk/government/collections/uk-sanctions-list |
| **Maintainer** | Office of Financial Sanctions Implementation (OFSI) / FCDO |
| **Description** | The single authoritative source for all UK sanctions designations under SAMLA. Replaced the OFSI Consolidated List as of January 28, 2026. Includes financial, immigration, trade, and transport sanctions. |
| **Data Coverage** | All UK sanctions regimes; ~12,600+ entities |
| **Format** | CSV, XML, HTML, PDF, TXT, ODS, ODT (7 formats) |
| **License** | Open Government Licence (OGL) |
| **API** | No direct API; static file URLs available |
| **Bulk Download** | Static links: `https://ofsistorage.blob.core.windows.net/publishlive/ConList.csv`; UKSL main file at GOV.UK |
| **Key Changes (2026)** | OFSI Consolidated List deprecated; UKSL is now sole authoritative source; fuzzy search added |
| **CSOAI Use Case** | UK compliance screening, post-Brexit sanctions verification, financial institution onboarding |
| **Citation** | [^1477^][^1480^][^1482^][^1484^][^1485^] |

**Direct Download URLs (OFSI - transitioning to UKSL):**
- CSV: `https://ofsistorage.blob.core.windows.net/publishlive/ConList.csv`
- XML: `https://ofsistorage.blob.core.windows.net/publishlive/ConList.xml`
- XLSX: `https://ofsistorage.blob.core.windows.net/publishlive/ConList.xlsx`

---

### 2.5 OpenSanctions

| Attribute | Detail |
|-----------|--------|
| **Name** | OpenSanctions |
| **URL** | https://www.opensanctions.org/ |
| **Maintainer** | OpenSanctions Datenbanken GmbH |
| **Description** | Comprehensive open-source database of sanctions targets, politically exposed persons (PEPs), and entities of interest. Aggregates 320+ sources from governments worldwide. 1.7M+ entities. |
| **Data Coverage** | OFAC, EU, UN, UK, and 300+ additional sanctions lists; PEPs data from Wikidata |
| **Format** | JSON (FollowTheMoney), CSV, Senzing JSON, XML |
| **License** | Free for non-commercial use; commercial license required for businesses |
| **API** | REST API at `api.opensanctions.org`; pay-as-you-go (EUR 0.10/call); free trial for business emails |
| **Bulk Download** | Free bulk downloads at `data.opensanctions.org/datasets/latest/` |
| **Download URL** | `https://data.opensanctions.org/datasets/latest/default/entities.ftm.json` |
| **Delta Updates** | Incremental update files available |
| **Historical Data** | Past versions available via date-stamped URLs (`YYYYYMMDD`) |
| **CSOAI Use Case** | Unified sanctions screening across all jurisdictions, PEP checks, investigative research, automated compliance pipelines |
| **Citation** | [^1468^][^1475^][^1478^][^1479^][^1481^][^1483^] |

---

## 3. Gravity & Bilateral Datasets

### 3.1 CEPII Gravity Database

| Attribute | Detail |
|-----------|--------|
| **Name** | CEPII Gravity Database |
| **URL** | https://www.cepii.fr/cepii/en/bdd_modele/bdd_modele.asp |
| **Maintainer** | CEPII (Centre d'Etudes Prospectives et d'Informations Internationales) |
| **Description** | Square gravity dataset for all world country pairs. Includes bilateral trade flows, GDP, population, geographic distances, cultural proximity indicators, trade agreements, colonial history, and more. |
| **Data Coverage** | 1948-2020; all existing countries; 79+ variables |
| **Format** | Stata (.dta), CSV |
| **License** | Free for academic use |
| **API** | None; direct download |
| **Bulk Download** | Full dataset download from CEPII website |
| **Key Variables** | GDP, population, distance, contiguity, common language, colonial history, RTAs, GATT/WTO membership, currency union, conflict, legal system, religion, etc. |
| **CSOAI Use Case** | Gravity model estimation, trade cost analysis, trade potential modeling, FTA impact assessment |
| **Citation** | Conte, M., Cotterlaz, P., & Mayer, T. (2022). "The CEPII Gravity Database", CEPII Working Paper 2022-05 |
| **Reference** | [^1437^][^1492^][^1493^][^1494^][^1496^][^1501^] |

---

### 3.2 Dynamic Gravity Dataset (USITC)

| Attribute | Detail |
|-----------|--------|
| **Name** | Dynamic Gravity Dataset |
| **URL** | https://www.usitc.gov/publications/332/working_papers/201802a_dynamic_gravity_dataset.html |
| **Maintainer** | U.S. International Trade Commission (USITC) |
| **Description** | Extended gravity dataset updating CEPII variables for 2007-2015. Addresses limitations in static country sets and time-invariant variables. |
| **Data Coverage** | 1948-2016; 224 countries |
| **Format** | Stata (.dta) |
| **License** | Free (US government) |
| **API** | None; direct download |
| **Bulk Download** | Available from USITC website |
| **CSOAI Use Case** | Gravity model estimation with updated time-varying variables, US trade policy analysis |
| **Citation** | Gurevich, T., Herman, P., Shikher, S., & Ubee, R. (2018). "The Dynamic Gravity Dataset: 1948-2016", USITC Working Paper 2018-02-A |
| **Reference** | [^1492^][^1493^] |

---

## 4. Macroeconomic & Historical Datasets

### 4.1 Penn World Table (PWT)

| Attribute | Detail |
|-----------|--------|
| **Name** | Penn World Table (PWT 11.0) |
| **URL** | https://www.rug.nl/ggdc/productivity/pwt/?lang=en |
| **Maintainer** | Groningen Growth and Development Centre (GGDC), University of Groningen |
| **Description** | Database with relative levels of income, output, input, and productivity for international comparisons. Purchasing power parity and national income accounts converted to international prices. |
| **Data Coverage** | 1950-2019 (PWT 10.01); 183 countries; 41 variables |
| **Format** | Stata (.dta), Excel, CSV |
| **License** | Creative Commons Attribution 4.0 International |
| **API** | None; DataverseNL access |
| **Bulk Download** | Full dataset via Dataverse: DOI `10.34894/FABVLR`; online query tool for custom selections |
| **Attribution** | Feenstra, R.C., Inklaar, R., & Timmer, M.P. (2015). "The Next Generation of the Penn World Table", American Economic Review, 105(10), 3150-3182 |
| **CSOAI Use Case** | GDP comparison across countries, productivity analysis, real exchange rate assessment, macroeconomic modeling inputs |
| **Citation** | [^1447^][^1448^][^1449^][^1452^][^1455^][^1456^] |

---

### 4.2 Maddison Project Database

| Attribute | Detail |
|-----------|--------|
| **Name** | Maddison Project Database (MPD 2023) |
| **URL** | https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023?lang=en |
| **Maintainer** | Groningen Growth and Development Centre (GGDC) |
| **Description** | Historical economic statistics providing comparative economic growth and income levels over the very long run. Continues Angus Maddison's work. |
| **Data Coverage** | Up to 2022; 169 countries; historical GDP estimates |
| **Format** | Excel, CSV |
| **License** | Free (academic citation required) |
| **API** | None; Dataverse access |
| **Bulk Download** | DOI: `10.34894/INZBF2` via DataverseNL |
| **Attribution** | Bolt, J., & van Zanden, J.L. (2024). "Maddison style estimates of the evolution of the world economy: A new 2023 update", Journal of Economic Surveys, 1-41 |
| **CSOAI Use Case** | Long-run economic history analysis, pre-1950 GDP data, historical trade capacity assessment |
| **Citation** | [^1488^][^1489^][^1490^] |

---

## 5. Trade Policy & Protection

### 5.1 Global Trade Alert

| Attribute | Detail |
|-----------|--------|
| **Name** | Global Trade Alert (GTA) |
| **URL** | https://www.globaltradealert.org/ |
| **Maintainer** | GTA Initiative (Swiss-based, with St. Gallen University) |
| **Description** | Database documenting state interventions affecting trade since November 2008. Covers tariffs, subsidies, quotas, export incentives, NTMs, FDI restrictions, and more. Each entry verified via two-stage review. |
| **Data Coverage** | 2008-present; 100+ economies; 50+ policy instruments |
| **Format** | Online database, CSV export, Excel |
| **License** | Free for non-commercial use |
| **API** | Limited; primarily web interface with export |
| **Bulk Download** | Available via registration; researcher access |
| **Key Categories** | Export/import bans, subsidies, FDI rules, procurement, competition policy, capital controls, trade finance |
| **CSOAI Use Case** | Trade policy monitoring, protectionism tracking, subsidy analysis, trade war impact assessment |
| **Citation** | [^1486^] |

---

### 5.2 UNCTAD TRAINS

| Attribute | Detail |
|-----------|--------|
| **Name** | TRAINS - Trade Analysis and Information System |
| **URL** | https://trainsonline.unctad.org/ |
| **Maintainer** | UNCTAD |
| **Description** | Comprehensive trade and market access information combining tariff data, non-tariff measures (NTMs), and trade statistics. Covers MFN, preferential, and applied tariffs. |
| **Data Coverage** | 170+ countries; HS-based tariff data; NTMs for 100+ economies |
| **Format** | Web interface; STATA/CSV researcher files |
| **License** | Free for researchers |
| **API** | Via WITS API for tariff data |
| **Bulk Download** | Researcher files (STATA/CSV) available at `trainsonline.unctad.org/bulkDataDownload` |
| **CSOAI Use Case** | Tariff analysis, NTM impact assessment, market access evaluation, trade negotiation preparation |
| **Citation** | [^1490^][^1491^][^1495^][^1497^][^1499^][^1502^] |

---

### 5.3 Market Access Map (ITC)

| Attribute | Detail |
|-----------|--------|
| **Name** | Market Access Map (MacMap) |
| **URL** | https://www.macmap.org/ |
| **Maintainer** | International Trade Centre (ITC) |
| **Description** | Free analytical portal for customs tariffs, tariff-rate quotas, trade remedies, regulatory requirements, and preferential regimes. Covers 400+ trade agreements. |
| **Data Coverage** | 200+ countries/regions; HS6-level tariffs; preferential regimes; MFN rates |
| **Format** | Web interface; Excel charts and tables |
| **License** | Free |
| **API** | Bulk download available for researchers |
| **CSOAI Use Case** | Tariff comparison across markets, trade agreement analysis, export competitiveness assessment |
| **Citation** | [^1453^] |

---

## 6. Summary Matrix

| # | Source | Type | Free? | API? | Bulk DL? | Format | Last Verified |
|---|--------|------|-------|------|----------|--------|---------------|
| 1 | UN Comtrade | Trade Flows | Yes (tiered) | Yes | Yes (premium) | CSV,JSON,XML | 2026 |
| 2 | WTO Statistics | Trade Stats | Yes | Yes | Yes (select) | CSV,Excel | 2026 |
| 3 | IMF DOTS | Trade Stats | Yes | Yes | Yes | CSV,SDMX | 2026 |
| 4 | WITS | Trade+Tariffs | Yes (reg) | Yes | Yes | CSV,JSON | 2026 |
| 5 | BACI (CEPII) | Bilateral Trade | Yes | No | Yes (CSV) | CSV | 2026 |
| 6 | TradeMap | Trade Indicators | Partial | No | Partial | Excel | 2026 |
| 7 | Eurostat Comext | EU Trade | Yes | Yes | Yes | CSV,SDMX | 2026 |
| 8 | FAOSTAT | Agri Trade | Yes | Yes | Yes | CSV,Excel | 2026 |
| 9 | OFAC SDN | Sanctions | Yes | Yes | Yes | XML,CSV,JSON | 2026 |
| 10 | EU Sanctions | Sanctions | Yes | No | Yes | XML | 2026 |
| 11 | UN SC List | Sanctions | Yes | No | Yes | XML,PDF | 2026 |
| 12 | UK Sanctions | Sanctions | Yes | No | Yes | CSV,XML | 2026 |
| 13 | OpenSanctions | Sanctions+PEPs | Partial | Yes | Yes | JSON,CSV | 2026 |
| 14 | CEPII Gravity | Gravity Model | Yes | No | Yes | Stata,CSV | 2026 |
| 15 | USITC DGD | Gravity Model | Yes | No | Yes | Stata | 2026 |
| 16 | Penn World Table | Macro | Yes | No | Yes | Stata,CSV | 2026 |
| 17 | Maddison Project | Historical GDP | Yes | No | Yes | Excel,CSV | 2026 |
| 18 | Global Trade Alert | Trade Policy | Yes | Limited | Yes | CSV,Excel | 2026 |
| 19 | UNCTAD TRAINS | Tariffs+NTMs | Yes | Via WITS | Yes | Stata,CSV | 2026 |
| 20 | Market Access Map | Tariffs | Yes | Limited | Yes | Excel | 2026 |

---

## 7. CSOAI Use Case Mapping

### Finance Hive
| Data Need | Primary Sources |
|-----------|----------------|
| Sanctions screening / compliance | OFAC SDN, EU Sanctions, UN SC List, UK Sanctions, OpenSanctions |
| Trade finance risk | IMF DOTS, UN Comtrade, WITS |
| Counterparty verification | OpenSanctions (PEPs + sanctions) |
| Currency/trade balance analysis | IMF DOTS, Penn World Table |

### Transport Hive
| Data Need | Primary Sources |
|-----------|----------------|
| Vessel sanctions (OFAC) | OFAC SDN List, OpenSanctions |
| Port-level trade flows | UN Comtrade, BACI, Eurostat Comext |
| Supply chain mapping | BACI, UN Comtrade, WITS |
| Trade route analysis | UN Comtrade, IMF DOTS |

### Manufacturing Hive
| Data Need | Primary Sources |
|-----------|----------------|
| Input material sourcing | BACI, UNCTAD TRAINS, WITS |
| Tariff analysis | WITS, UNCTAD TRAINS, Market Access Map |
| NTM impact assessment | UNCTAD TRAINS, Global Trade Alert |
| Trade policy monitoring | Global Trade Alert, WTO Statistics |
| Export market identification | TradeMap, WITS, BACI |
| Gravity model for FDI | CEPII Gravity, USITC DGD |

---

## Quick Reference: Essential API Endpoints

```
# UN Comtrade
GET https://comtrade.un.org/api/get?max=10000&type=C&freq=A&px=HS&ps=YYYY&r=ALL&p=0&rg=all&cc=TOTAL

# WITS Tariff (UNCTAD TRAINS)
GET https://wits.worldbank.org/witsapiintro.aspx

# IMF DOTS
GET https://data.imf.org/en/datasets/IMF.STA:IMTS

# Eurostat Comext
GET https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/dataflow/ESTAT/all

# OpenSanctions
GET https://data.opensanctions.org/datasets/latest/default/entities.ftm.json

# OFAC SDN
GET https://sanctionslist.ofac.treas.gov/Home/Consolidated

# EU Sanctions (XML)
GET https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?export

# UN SC Consolidated
GET https://scsanctions.un.org/consolidated/

# UK Sanctions (CSV)
GET https://ofsistorage.blob.core.windows.net/publishlive/ConList.csv
```

---

## Data Update Frequencies

| Source | Update Frequency |
|--------|-----------------|
| UN Comtrade | Monthly (lag ~2-3 months) |
| WTO Statistics | Monthly (merchandise), Quarterly (services) |
| IMF DOTS | Monthly |
| WITS | Quarterly |
| BACI | Annually (January) |
| OFAC SDN | Daily (weekdays) |
| EU Sanctions | As needed |
| UN SC List | As needed (with press releases) |
| UK Sanctions | Daily |
| OpenSanctions | Multiple times daily |
| CEPII Gravity | Annually |
| Penn World Table | Major releases (irregular) |
| Maddison Project | Annual (September) |
| Global Trade Alert | Continuous |
| UNCTAD TRAINS | Periodic |

---

*Document compiled: 2026-01. Sources verified via web search. All URLs tested for accessibility.*
*For questions or updates, contact the CSOAI Data Infrastructure team.*
