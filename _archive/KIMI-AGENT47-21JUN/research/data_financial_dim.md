# Free/Open Financial & Banking Data Sources

> **Research for CSOAI.org Finance Hive** - Free financial data for training AI systems on banking, markets, economics. DORA compliance requires financial entity data.
>
> **Last Updated**: 2025-07-03 | **Sources**: 30+ data providers | **Geographic Coverage**: Global

---

## Table of Contents

1. [SEC EDGAR API](#1-sec-edgar-api)
2. [FRED (Federal Reserve Economic Data)](#2-fred-federal-reserve-economic-data)
3. [ECB Statistical Data Warehouse](#3-ecb-statistical-data-warehouse)
4. [Bank for International Settlements (BIS)](#4-bank-for-international-settlements-bis)
5. [Open Banking APIs (UK, EU)](#5-open-banking-apis-uk-eu)
6. [Yahoo Finance API (yfinance)](#6-yahoo-finance-api-yfinance)
7. [Alpha Vantage API](#7-alpha-vantage-api)
8. [World Bank Financial Indicators](#8-world-bank-financial-indicators)
9. [IMF WEO Database](#9-imf-world-economic-outlook-database)
10. [EIOPA Insurance Statistics](#10-eiopa-insurance-statistics)
11. [FINRA BrokerCheck](#11-finra-brokercheck)
12. [SIC/NAICS Industry Classification](#12-sicnaics-industry-classification)
13. [Global LEI (Legal Entity Identifier)](#13-global-legal-entity-identifier-lei)
14. [Crypto Data APIs](#14-crypto-data-apis)
15. [Credit Rating Data](#15-credit-rating-data)
16. [US FDIC Bank Data](#16-us-fdic-bank-data)
17. [US Treasury Fiscal Data](#17-us-treasury-fiscal-data)
18. [European Banking Authority (EBA)](#18-european-banking-authority-eba)
19. [OECD Financial Statistics](#19-oecd-financial-statistics)
20. [Trading Economics](#20-trading-economics)

---

## 1. SEC EDGAR API

**Official US Securities and Exchange Commission EDGAR Filing System**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.sec.gov/edgar (bulk) / https://data.sec.gov (API) |
| **Format** | JSON, XBRL, XML, HTML, ZIP bulk |
| **License** | Public domain (US government data) |
| **API Key** | Not required |
| **Rate Limits** | 10 requests/second; User-Agent header required [^1^] |
| **CSOAI Use Case** | DORA compliance - financial entity identification, company fundamentals, XBRL financial statement extraction for ML training |

### Endpoints

- `https://data.sec.gov/submissions/CIK##########.json` - Filing history by CIK
- `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` - All XBRL company data
- `https://data.sec.gov/api/xbrl/companyconcept/CIK##########/{taxonomy}/{tag}.json` - Specific concept
- `https://data.sec.gov/api/xbrl/frames/{concept}/{unit}/{period}.json` - Aggregated frame data
- `https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip` - Bulk XBRL data
- `https://www.sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip` - Bulk submissions

### Coverage
- 20+ million filings since 1993
- 1.1M+ SEC-regulated entities
- 500+ EDGAR form types (10-K, 10-Q, 8-K, 13F, 3/4/5, etc.)
- CIK to ticker mapping: `https://www.sec.gov/files/company_tickers.json`

---

## 2. FRED (Federal Reserve Economic Data)

**Federal Reserve Bank of St. Louis - Economic Time Series Database**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://fred.stlouisfed.org |
| **API Docs** | https://fred.stlouisfed.org/docs/api/fred/ |
| **Format** | JSON, XML, CSV |
| **License** | Public domain (US Federal Reserve data) |
| **API Key** | Free registration required at https://fredaccount.stlouisfed.org/apikeys |
| **Rate Limits** | No strict published limits; excessive requests may be throttled [^2^] |
| **CSOAI Use Case** | Macroeconomic indicator training data (GDP, inflation, unemployment, interest rates) |

### Key Series
- `SP500` - S&P 500 Index
- `GDP` - Gross Domestic Product
- `CPIAUCSL` - Consumer Price Index
- `UNRATE` - Unemployment Rate
- `DFF` - Federal Funds Effective Rate
- `T10Y2Y` - Treasury Yield Spread

### API Features
- 800,000+ economic time series
- Categories, releases, sources, tags
- Real-time and vintage data via ALFRED
- Search functionality
- Python: `fredapi` library (`pip install fredapi`)

---

## 3. ECB Statistical Data Warehouse

**European Central Bank Data Portal (successor to SDW)**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://data.ecb.europa.eu (new) / http://sdw.ecb.europa.eu (legacy) |
| **API Docs** | https://sdw-wsrest.ecb.europa.eu/ |
| **Format** | SDMX-ML, JSON, CSV |
| **License** | Open data (ECB policy) |
| **API Key** | Not required |
| **Rate Limits** | Fair use; no explicit limits documented |
| **CSOAI Use Case** | EU banking supervision data, euro area monetary statistics, interest rates, HICP inflation |

### Coverage
- Euro area monetary aggregates (M1, M2, M3)
- Harmonized Index of Consumer Prices (HICP)
- ECB interest rates (deposit, marginal lending, main refinancing)
- Bank lending statistics
- Balance of payments
- Exchange rates (EUR reference rates)

### Python Access
```python
from ecbdata import ecbdata
df = ecbdata.get_series('ICP.M.U2.N.000000.4.ANR', start='2010-01')
```

---

## 4. Bank for International Settlements (BIS)

**International banking and financial statistics from the "central bank of central banks"**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://data.bis.org |
| **API Docs** | https://stats.bis.org/api-doc/v1/ |
| **Format** | SDMX, JSON, CSV (zipped) |
| **License** | Open data with attribution |
| **API Key** | Not required |
| **Rate Limits** | No strict published limits |
| **CSOAI Use Case** | Cross-border banking exposure data, global liquidity analysis, credit aggregates, DORA entity risk |

### Key Datasets
- **Locational Banking Statistics** - International banking positions by residence (since 1977)
- **Consolidated Banking Statistics** - Worldwide consolidated bank claims (since 1983/2005)
- **Debt Securities Statistics** - International debt securities issuance
- **Credit to Non-Financial Sector** - Private and public credit aggregates
- **Property Prices** - Residential property price indices
- **Effective Exchange Rates** - Real effective exchange rates
- **Global Liquidity Indicators**

---

## 5. Open Banking APIs (UK, EU)

**PSD2-mandated account data access frameworks**

| Attribute | Detail |
|-----------|--------|
| **UK Portal** | https://www.openbanking.org.uk |
| **EU Portal** | https://berlingroup-next-generation.github.io/psd2-api/ |
| **Format** | JSON, OAuth 2.0 / OpenID Connect |
| **License** | Regulatory mandate (free access) |
| **API Key** | TPP license required (AISP/PISP registration) |
| **Rate Limits** | Bank-specific; varies by ASPSP |
| **CSOAI Use Case** | Account aggregation, payment initiation, transaction categorization for AI financial assistants |

### UK Open Banking (OBIE)
- CMA-mandated since January 2018
- 9 largest UK banks (CMA9) required to provide APIs
- Account Information Service (AIS) - read account data
- Payment Initiation Service (PIS) - initiate payments
- Product data APIs (ATM/Branch locations, PCA, BCA, SME loans)
- GitHub specs: https://github.com/OpenBankingUK

### EU PSD2 (Berlin Group)
- XS2A (Access to Account) framework
- SCA (Strong Customer Authentication) required
- AISP/PISP licensing via National Competent Authorities
- RTS on SCA and CSC (Regulatory Technical Standards)

### Australia
- Consumer Data Right (CDR) - Open Banking since July 2020
- ACCC-regulated

---

## 6. Yahoo Finance API (yfinance)

**Unofficial Python library for Yahoo Finance market data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://github.com/ranaroussi/yfinance |
| **Format** | Pandas DataFrames (Python library) |
| **License** | Apache 2.0 (open source library); data terms subject to Yahoo |
| **API Key** | Not required |
| **Rate Limits** | Unofficial; IP blocking possible for excessive requests (100K+ calls) |
| **CSOAI Use Case** | Free stock price data for backtesting, portfolio analysis, ML model training |

### Data Available
- Historical prices (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
- Fundamental data (balance sheet, income statement, cash flow)
- Options chains
- Dividends and splits
- News and analyst recommendations
- Multiple asset classes: stocks, ETFs, forex, crypto, futures

### Limitations
- Yahoo Finance official API was discontinued in 2017; this is a scraping library
- 1-minute data limited to 7 days; intraday limited to 60 days
- No dedicated support
- Not suitable for production trading systems

### Usage
```python
import yfinance as yf
ticker = yf.Ticker("AAPL")
data = ticker.history(period="1y", interval="1d")
info = ticker.info  # Company metadata
```

---

## 7. Alpha Vantage API

**NASDAQ-licensed financial data API**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.alphavantage.co |
| **Format** | JSON, CSV |
| **License** | Free tier non-commercial; paid plans for commercial use |
| **API Key** | Free registration required |
| **Rate Limits** | 25 requests/day free tier; 5 requests/minute |
| **CSOAI Use Case** | Stock quotes, technical indicators, fundamental data for AI training |

### Free Tier Features
- 25 API calls per day
- Delayed data (15 min delay for US markets)
- 100 data points per request (compact mode)
- 50+ technical indicators
- 20+ years historical data (premium only for full history)
- Coverage: 200,000+ tickers across 20+ global exchanges
- Forex, crypto, commodities data

### Paid Plans
- Premium: $49.99-$249.99/month
- Real-time and 15-minute delayed data
- Output size=full for complete historical data
- Higher rate limits (75-1,200 req/min)
- MCP server available for AI/LLM integration

---

## 8. World Bank Financial Indicators

**Global development data including financial sector indicators**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://data.worldbank.org |
| **API Docs** | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 |
| **Format** | JSON, XML, JSONP, JSON-stat |
| **License** | Creative Commons CC-BY 4.0 (open data) |
| **API Key** | Not required |
| **Rate Limits** | No strict published limits |
| **CSOAI Use Case** | Cross-country banking statistics, financial sector development indicators |

### Key Financial Indicators (World Development Indicators)
- `NY.GDP.MKTP.CD` - GDP (current US$)
- `GFDD.DI.14` - Bank capital to assets ratio (%)
- `GFDD.DI.06` - Bank nonperforming loans to total gross loans (%)
- `GFDD.DM.01` - Stock market capitalization (% of GDP)
- `GFDD.DM.02` - Stocks traded, total value (% of GDP)
- `FB.BNK.CAPA.ZS` - Bank capital to assets ratio
- `FD.AST.PRVT.GD.ZS` - Domestic credit to private sector (% of GDP)
- `GFDD.EI.02` - Lending interest rate (%)

### Coverage
- 16,000+ time series indicators
- 200+ countries
- 50+ years of historical data
- 45+ databases (WDI, International Debt Statistics, Doing Business, etc.)

---

## 9. IMF World Economic Outlook Database

**Macroeconomic forecasts and historical data from the International Monetary Fund**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.imf.org/en/Publications/WEO |
| **API/Tool** | https://pypi.org/project/weo/ (Python client) |
| **Format** | CSV, JSON (via Python client) |
| **License** | Open data (IMF policy) |
| **API Key** | Not required |
| **Rate Limits** | N/A (bulk download) |
| **CSOAI Use Case** | Global macroeconomic forecasting training data, cross-country economic comparison |

### Coverage
- GDP, GDP per capita, PPP valuations
- Inflation (CPI, GDP deflator)
- Unemployment rates
- Government debt and fiscal balances
- Current account balances
- Trade volumes
- 190+ countries, data from 1980 onwards
- 3-year ahead forecasts (updated April and October)
- Dataset releases (vintages) back to 2007

### Python Access
```python
from weo import download, WEO
path, url = download(2024, 1)  # April 2024 release
df_cpi = WEO(path).inflation()
```

---

## 10. EIOPA Insurance Statistics

**European Insurance and Occupational Pensions Authority Statistics**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.eiopa.europa.eu/tools-and-data/insurance-statistics_en |
| **Format** | XLSX, CSV |
| **License** | Open data (EU public data) |
| **API Key** | Not required |
| **Rate Limits** | N/A (direct download) |
| **CSOAI Use Case** | EU insurance sector analysis, Solvency II compliance data, asset exposure tracking |

### Coverage
- **Own Funds** - Quarterly and annual (solo/group) - Solvency II template S.23.01
- **Premiums, Claims and Expenses** - Quarterly and annual - template S.05.01
- **Asset Exposures** - By country, quarterly
- **Transitional and LTG Measures** - By country, annual
- **Cross-border Premiums** - By country, annual
- **Risk Dashboard** indicators
- Data from 2016 Q3 onwards (Solvency II era)
- EU + EEA coverage

---

## 11. FINRA BrokerCheck

**US broker-dealer and individual broker registration/complaint data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://brokercheck.finra.org |
| **API** | https://api.fdic.gov/banks/docs (unofficial wrappers available) |
| **Format** | JSON (via scraping/API wrappers), HTML |
| **License** | US public regulatory data |
| **API Key** | Not required (public data) |
| **Rate Limits** | Not documented |
| **CSOAI Use Case** | Financial advisor due diligence, compliance screening, DORA entity verification |

### Coverage
- 600,000+ currently registered brokers
- 3,500+ registered firms
- CRD (Central Registration Depository) numbers
- Registration history and licenses (Series 7, 66, etc.)
- Employment history
- Disclosure events (customer complaints, regulatory actions, bankruptcies)
- Exam history
- Firm branch locations

### Access Methods
- Web search: https://brokercheck.finra.org
- Disciplinary actions: https://www.finra.org/investors/have-problem/disciplinary-actions
- API wrappers available on Apify and Parse.bot

---

## 12. SIC/NAICS Industry Classification

**Standard Industrial Classification and North American Industry Classification System**

| Attribute | Detail |
|-----------|--------|
| **SIC URL** | https://www.sec.gov/search-filings/standard-industrial-classification-sic-code-list |
| **NAICS URL** | https://www.naics.com/search/ |
| **Format** | HTML tables, downloadable CSV/Excel concordance |
| **License** | US public data |
| **API Key** | Not required |
| **Rate Limits** | N/A |
| **CSOAI Use Case** | Industry classification for financial entity grouping, sector analysis, DORA classification |

### Details
- **SIC**: 4-digit codes established in 1937; still used in SEC EDGAR filings
- **NAICS**: 6-digit codes; replaced SIC in 1997; updated every 5 years (current: 2022)
- US Census Bureau maintains official NAICS
- Crosswalk/concordance files available (NAICS to SIC mapping)
- GICS (Global Industry Classification Standard) also available via some providers

### Free APIs
- Context.dev offers free NAICS lookup API: https://context.dev/data/naics-industry-classification-api
- SEC EDGAR includes SIC codes in company filings (CIK lookup)
- US Census: https://www.census.gov/naics/

---

## 13. Global Legal Entity Identifier (LEI)

**GLEIF - Global LEI Database for financial entity identification**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.gleif.org |
| **API Docs** | https://www.gleif.org/en/lei-data/gleif-api |
| **Search** | https://search.gleif.org |
| **Format** | JSON, JSON:API, CSV |
| **License** | CC0 (public domain) - LEI data is openly available |
| **API Key** | Not required |
| **Rate Limits** | No rate limits documented; public API freely accessible |
| **CSOAI Use Case** | DORA compliance - legal entity identification, counterparty mapping, corporate hierarchy analysis |

### API Features
- Search LEIs by entity name, LEI code, BIC/SWIFT, ISIN
- Full-text and single-field search
- Fuzzy matching for names and addresses
- Corporate parent/child relationship data (direct parent, ultimate parent)
- BIC/SWIFT code extraction
- Legal and headquarters addresses
- Entity status and registration status
- Conformity flags (FULLY_CORROBORATED, PARTIALLY_CORROBORATED)
- Daily updates from Local Operating Units (LOUs)
- 2.5+ million entities across 200+ jurisdictions

### Endpoints
- `https://api.gleif.org/api/v1/lei-records` - Search LEI records
- Relationship data for corporate hierarchy
- Code lists (entity legal forms, registration authorities)

---

## 14. Crypto Data APIs

### 14a. CoinGecko API

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.coingecko.com/en/api |
| **Format** | JSON |
| **License** | Free tier requires attribution; paid for commercial |
| **API Key** | Not required for Demo plan; API key for paid |
| **Rate Limits** | Demo: 100 calls/min, 10,000 calls/month; paid: 300-2,500 calls/min |
| **CSOAI Use Case** | Crypto market data for DeFi analysis, portfolio tracking, on-chain DEX data |

- 17,000+ coins, 38M+ tokens, 1,700+ exchanges, 260+ networks
- 1 year historical data on free tier (daily, hourly, 5-min intervals)
- OHLCV data, market cap, trading volume
- Keyless access available
- Paid plans from $35/month

### 14b. CoinMarketCap API

| Attribute | Detail |
|-----------|--------|
| **URL** | https://coinmarketcap.com/api |
| **Format** | JSON |
| **License** | Personal use free tier; commercial use requires paid |
| **API Key** | Free registration; keyless trial available |
| **Rate Limits** | Basic: 50 RPM, 15,000 credits/month; Hobbyist: 300 RPM, 150,000 credits |
| **CSOAI Use Case** | Market rankings, price snapshots, DEX token data |

- 10,000+ coins, 2.4M+ tokens, 935+ exchanges
- Keyless trial API (no signup): `pro-api.coinmarketcap.com/trial-pro-api`
- Fear and Greed Index, Altcoin Season Index
- No historical data on free tier
- Paid from $29/month

### 14c. Binance API

| Attribute | Detail |
|-----------|--------|
| **URL** | https://api.binance.com |
| **Docs** | https://binance-docs.github.io/apidocs/ |
| **Format** | JSON |
| **License** | Free for data; trading requires account |
| **API Key** | Not required for public market data |
| **Rate Limits** | 1,200 weight units/minute (IP-based) |
| **CSOAI Use Case** | Real-time crypto trading data, order book analysis, WebSocket streaming |

- 600+ trading pairs
- Real-time and historical data (K-line/candlestick)
- Order book depth
- Recent trades, aggregated trades
- WebSocket streaming for live data
- Most generous free tier among exchanges

---

## 15. Credit Rating Data

### 15a. Trading Economics (Free Tier)

| Attribute | Detail |
|-----------|--------|
| **URL** | https://tradingeconomics.com |
| **API Docs** | https://docs.tradingeconomics.com/indicators/credit-rating/ |
| **Format** | JSON, CSV |
| **License** | Free tier with API key; paid plans available |
| **API Key** | Free registration required |
| **Rate Limits** | Free tier limits apply |
| **CSOAI Use Case** | Sovereign credit rating history for country risk assessment |

- Sovereign credit ratings from Moody's, S&P, Fitch, DBRS
- Historical rating changes with dates
- Outlook data (Positive, Stable, Negative)
- By country API endpoint
- Coverage: 100+ countries

### 15b. Cbonds Rating Aggregator

| Attribute | Detail |
|-----------|--------|
| **URL** | https://cbonds.com/ratings/ |
| **Format** | HTML (web search) |
| **License** | Free for viewing; data export may require subscription |
| **API Key** | Not required for web browsing |
| **Rate Limits** | N/A |
| **CSOAI Use Case** | Corporate and sovereign credit rating lookup |

- Aggregates ratings from major agencies
- Corporate issuer ratings
- Historical rating changes

### 15c. Open Source Credit Rating Alternatives

**Note**: Full historical credit rating datasets (especially corporate) are generally NOT freely available. Moody's, S&P, and Fitch require subscriptions ($10,000+/year). Free alternatives:

- **SEC EDGAR** - NRSRO (Nationally Recognized Statistical Rating Organization) disclosures
- **FINRA TRACE** - Corporate bond trade data (includes implicit pricing)
- **FRED** - Moody's seasoned corporate bond yields (BAA, AAA spreads)
- **Bank for International Settlements** - Credit to non-financial sector data

---

## 16. US FDIC Bank Data

**Federal Deposit Insurance Corporation - US bank regulatory data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://banks.data.fdic.gov/bankfind-suite |
| **API Docs** | https://banks.data.fdic.gov/docs/ |
| **Format** | JSON, CSV, YAML |
| **License** | US public government data |
| **API Key** | Not required |
| **Rate Limits** | Generous; public government API |
| **CSOAI Use Case** | US banking sector analysis, DORA entity data, bank failure prediction models |

### API Sources (6 endpoints)
1. **Institutions** - Bank demographics, HQ locations
2. **Locations** - Branch/office data with geocoding
3. **History** - Structural change events (mergers, name changes)
4. **Financials** - Quarterly Call Report data (1,100+ variables)
5. **Summary** - Aggregate financial data by state/year
6. **Failures** - Bank failure records since 1934

### Key Data Fields
- Assets, deposits, net income, ROA, ROE
- Capital ratios, NPL ratios
- Branch counts, employee counts
- Bank failures with resolution type and cost
- Acquisitions and mergers

### Bulk Files
- Full listings in CSV format available for download
- YAML API definition files
- Updated quarterly

---

## 17. US Treasury Fiscal Data

**US Department of the Treasury - Federal financial data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://fiscaldata.treasury.gov |
| **API Docs** | https://fiscaldata.treasury.gov/api-documentation/ |
| **Format** | JSON, XML, CSV |
| **License** | Public domain; free for commercial and non-commercial use |
| **API Key** | Not required (optional for higher rate limits) |
| **Rate Limits** | No strict documented limits |
| **CSOAI Use Case** | Government debt analysis, fiscal policy research, interest rate modeling |

### Key Datasets
- **Debt to the Penny** - Daily US national debt
- **Monthly Treasury Statement** - Federal revenue and spending
- **Monthly Statement of Public Debt** - Treasury securities breakdown
- **Average Interest Rates** - On Treasury securities
- **Treasury Exchange Rates** - Official government exchange rates
- **Daily Treasury Statement** - Deposits and withdrawals
- API version: v1.0.0 / v2.0.0

---

## 18. European Banking Authority (EBA)

**EU banking supervision and regulatory data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.eba.europa.eu/risk-and-data-analysis/data |
| **Open Data** | https://www.eba.europa.eu/regulation-and-policy/credit-institutions-and-approval/credit-institution-register |
| **Format** | CSV, JSON, XML, XLSX |
| **License** | EU open data |
| **API Key** | Not required for register search |
| **Rate Limits** | Not documented |
| **CSOAI Use Case** | EU credit institution verification, DORA compliance, banking sector risk analysis |

### Key Data
- **Credit Institutions Register (CIR)** - All EU/EEA licensed credit institutions
- **Payment Institutions Register (PIR)** - Licensed payment institutions
- **EU-wide Transparency Exercise** - Annual bank-level data (capital, RWA, NPE, leverage)
- **Risk Dashboard** - Quarterly risk indicators for EU banking
- **Aggregate Statistical Data** - Supervisory disclosure data
- **EUCLID** - Centralized data infrastructure for supervisory reporting

### Coverage
- 10,000+ credit institutions in EU/EEA
- LEI, BIC, authorization status, competent authority
- Bank-level capital positions, asset quality, profitability data
- Historical data from 2013 onwards

---

## 19. OECD Financial Statistics

**Organisation for Economic Co-operation and Development data**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://data-explorer.oecd.org |
| **API Docs** | https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html |
| **Format** | SDMX, JSON, XML, CSV |
| **License** | CC-BY 4.0 (open access since July 2024) |
| **API Key** | Not required |
| **Rate Limits** | 60 data downloads per hour; VPN traffic blocked |
| **CSOAI Use Case** | Cross-country economic comparison, financial sector indicators, pension data |

### SDMX API Endpoint
`https://sdmx.oecd.org/public/rest/data/{agency},{dataset}/{key}?format=csvfilewithlabels`

### Key Datasets
- **National Accounts** - GDP, investment, government accounts
- **Financial Accounts** - Flow of funds, financial balance sheets
- **Pension Markets in Focus** - Pension fund assets and indicators
- **International Investment** - FDI statistics
- **Banking Statistics** - Bank profitability, structure
- **House Prices** - Real house price indices
- **Unemployment and Labour Force** - Labour market indicators

### Access Methods
- OECD Data Explorer (web UI with API link generation)
- SDMX REST API (direct programmatic access)
- Python: `pandasdmx`, `sdmx1` libraries
- R: `rsdmx`, `oecd` packages

---

## 20. Trading Economics

**Global economic indicators and financial market data aggregator**

| Attribute | Detail |
|-----------|--------|
| **URL** | https://tradingeconomics.com |
| **API Docs** | https://docs.tradingeconomics.com |
| **Format** | JSON, CSV |
| **License** | Free tier with API key; paid plans for higher limits |
| **API Key** | Free registration required |
| **Rate Limits** | Free tier: limited requests/day |
| **CSOAI Use Case** | Sovereign credit ratings, economic calendar, cross-country indicator comparison |

### Free Data Available
- **Credit Ratings** - Sovereign ratings from Moody's, S&P, Fitch, DBRS with history
- **Economic Calendar** - Scheduled data releases
- **Economic Indicators** - GDP, inflation, unemployment, interest rates
- **Currency exchange rates**
- **Stock market indices**
- **Commodity prices**

---

## Summary Comparison Table

| # | Source | Data Type | Format | API Key | Rate Limit | License |
|---|--------|-----------|--------|---------|------------|---------|
| 1 | SEC EDGAR | Company filings | JSON/XBRL | No | 10 req/s | Public domain |
| 2 | FRED | Economic time series | JSON/CSV | Free reg. | Throttled | Public domain |
| 3 | ECB SDW | EU banking stats | SDMX/CSV | No | Fair use | Open data |
| 4 | BIS | Global banking | SDMX/CSV | No | Fair use | Open data |
| 5 | Open Banking | Account data | JSON | TPP license | Bank-specific | Regulatory |
| 6 | yfinance | Stock prices | Pandas | No | Unofficial | Apache 2.0 |
| 7 | Alpha Vantage | Stocks/FX/crypto | JSON/CSV | Free reg. | 25/day free | Non-comm free |
| 8 | World Bank | Development indicators | JSON/XML | No | No limit | CC-BY 4.0 |
| 9 | IMF WEO | Macro forecasts | CSV (client) | No | N/A | Open data |
| 10 | EIOPA | Insurance stats | XLSX/CSV | No | N/A | EU open data |
| 11 | FINRA | Broker data | JSON/HTML | No | N/A | Public data |
| 12 | SIC/NAICS | Industry codes | HTML/CSV | No | N/A | Public data |
| 13 | GLEIF LEI | Entity identifiers | JSON | No | No limit | CC0 |
| 14 | CoinGecko | Crypto market data | JSON | No (free) | 100/min | Attribution |
| 15 | Trading Economics | Credit ratings | JSON/CSV | Free reg. | Limited free | API terms |
| 16 | FDIC | US bank data | JSON/CSV | No | Generous | Public domain |
| 17 | US Treasury | Fiscal data | JSON/CSV | No | No limit | Public domain |
| 18 | EBA | EU banking register | CSV/JSON | No | N/A | EU open data |
| 19 | OECD | Economic statistics | SDMX/CSV | No | 60/hr | CC-BY 4.0 |
| 20 | Binance | Crypto trading | JSON | No | 1200 wt/min | Exchange terms |

---

## CSOAI DORA Compliance Relevance

| DORA Requirement | Relevant Data Sources |
|-----------------|----------------------|
| **ICT risk management** | EBA risk dashboard, EIOPA statistics |
| **Digital operational resilience testing** | FDIC bank failures, SEC enforcement actions |
| **ICT-related incident reporting** | FINRA BrokerCheck disclosures |
| **Third-party risk management** | GLEIF LEI (entity hierarchy), EBA Credit Institutions Register |
| **Information sharing** | Open Banking APIs, BIS global banking stats |
| **Financial entity identification** | GLEIF LEI, SEC EDGAR CIK, EBA CIR |

---

## References

[^1^]: SEC EDGAR API Documentation, https://www.sec.gov/search-filings/edgar-application-programming-interfaces
[^2^]: FRED API Documentation, https://fred.stlouisfed.org/docs/api/fred/
[^3^]: ECB Data Portal, https://data.ecb.europa.eu
[^4^]: BIS Data Portal, https://data.bis.org
[^5^]: Open Banking UK, https://www.openbanking.org.uk
[^6^]: yfinance GitHub, https://github.com/ranaroussi/yfinance
[^7^]: Alpha Vantage, https://www.alphavantage.co
[^8^]: World Bank API, https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
[^9^]: IMF WEO, https://www.imf.org/en/Publications/WEO
[^10^]: EIOPA Statistics, https://www.eiopa.europa.eu/tools-and-data/insurance-statistics_en
[^11^]: FINRA BrokerCheck, https://brokercheck.finra.org
[^12^]: NAICS Search, https://www.naics.com/search/
[^13^]: GLEIF API, https://www.gleif.org/en/lei-data/gleif-api
[^14^]: CoinGecko API, https://www.coingecko.com/en/api
[^15^]: Trading Economics API, https://docs.tradingeconomics.com
[^16^]: FDIC BankFind Suite, https://banks.data.fdic.gov/bankfind-suite
[^17^]: US Treasury Fiscal Data, https://fiscaldata.treasury.gov
[^18^]: EBA Open Data, https://www.eba.europa.eu/risk-and-data-analysis/data
[^19^]: OECD API, https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html
[^20^]: CoinMarketCap API, https://coinmarketcap.com/api
[^21^]: Binance API, https://binance-docs.github.io/apidocs/
[^22^]: SEC EDGAR Fair Access, https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data
[^23^]: OECD Open Access July 2024, https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html
[^24^]: FRED API Key Registration, https://fredaccount.stlouisfed.org/apikeys
[^25^]: GLEIF API Documentation, https://www.gleif.org/en/lei-data/gleif-api
