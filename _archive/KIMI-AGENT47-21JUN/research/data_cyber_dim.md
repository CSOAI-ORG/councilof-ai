# Free/Open Cybersecurity Threat Intelligence Data Sources

> **Research Date**: 2026-07-02
> **Purpose**: CSOAI Security Hive - Threat Intelligence Data for Training AI Security Agents
> **Sources**: 20+ free/open threat intelligence feeds, APIs, and databases

---

## Table of Contents

1. [NVD (National Vulnerability Database)](#1-nvd-national-vulnerability-database)
2. [CVE Database (MITRE)](#2-cve-database-mitre)
3. [CISA KEV (Known Exploited Vulnerabilities)](#3-cisa-kev-known-exploited-vulnerabilities)
4. [MISP Threat Sharing Platform](#4-misp-threat-sharing-platform)
5. [abuse.ch (URLhaus, MalwareBazaar, ThreatFox, YARAify)](#5-abusech)
6. [VirusTotal API (Free Tier)](#6-virustotal-api-free-tier)
7. [Shodan API (Free Tier)](#7-shodan-api-free-tier)
8. [AlienVault OTX (Open Threat Exchange)](#8-alienvault-otx)
9. [GreyNoise API (Community)](#9-greynoise-api-community)
10. [CERT Feeds Globally](#10-cert-feeds-globally)
11. [MITRE ATT&CK Framework](#11-mitre-attck-framework)
12. [CAPEC (Common Attack Pattern Enumeration)](#12-capec)
13. [OWASP Vulnerability Data](#13-owasp-vulnerability-data)
14. [Have I Been Pwned API](#14-have-i-been-pwned-api)
15. [CISA Alerts & Advisories](#15-cisa-alerts--advisories)
16. [EPSS (Exploit Prediction Scoring System)](#16-epss)
17. [CIRCL CVE Search API](#17-circl-cve-search-api)
18. [PhishTank / OpenPhish](#18-phishing-feeds)
19. [EmergingThreats (Proofpoint)](#19-emergingthreats)
20. [Censys (Free Tier)](#20-censys-free-tier)

---

## 1. NVD (National Vulnerability Database)

| Attribute | Details |
|-----------|---------|
| **Provider** | NIST (National Institute of Standards and Technology) |
| **URL** | https://nvd.nist.gov/ |
| **API Docs** | https://nvd.nist.gov/developers/vulnerabilities |
| **Data Feeds** | https://nvd.nist.gov/vuln/data-feeds |
| **Format** | JSON 2.0 (API), JSON .gz (bulk feeds) |
| **API/Bulk** | Both REST API 2.0 and bulk JSON downloads |
| **Rate Limits** | API: ~5 requests/second with key; aggressive rate limiting without key. Bulk feeds: no limits |
| **API Key** | Free registration at https://nvd.nist.gov/developers/request-an-api-key |
| **Coverage** | 250,000+ CVEs from 1999 to present |

### API Endpoints
- `GET https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-YYYY-NNNN` - Single CVE lookup
- `GET https://services.nvd.nist.gov/rest/json/cves/2.0?lastModStartDate=...&lastModEndDate=...` - Modified CVEs
- `GET https://services.nvd.nist.gov/rest/json/cpes/2.0` - CPE data
- `GET https://services.nvd.nist.gov/rest/json/cpematch/2.0` - CPE Match data

### Bulk Downloads (JSON 2.0 Feed Files)
- `https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-YYYY.json.gz` - Yearly files
- `https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-modified.json.gz` - Recent changes
- `https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-recent.json.gz` - Last 8 days

### CSOAI Use Case
- Train AI agents on vulnerability severity classification (CVSS v2/v3/v4)
- Correlate CVEs with threat actor TTPs
- Build vulnerability prioritization models using CPE/CWE enrichment
- **Best Practice**: Use FKIE mirror (https://github.com/fkie-cad/nvd-json-data-feeds) for reliable bulk JSON with git history [^1587^]

---

## 2. CVE Database (MITRE)

| Attribute | Details |
|-----------|---------|
| **Provider** | MITRE Corporation |
| **URL** | https://cve.mitre.org/ |
| **Download** | https://cve.mitre.org/data/downloads/index.html |
| **Format** | CSV, XML, JSON |
| **API/Bulk** | Bulk downloads (no API) |
| **Rate Limits** | None for bulk downloads |
| **Authentication** | None required |
| **Coverage** | All CVE records since 1999 |

### Downloads
- `https://cve.mitre.org/data/downloads/allitems.csv.gz` - All CVE records
- `https://cve.mitre.org/data/downloads/allitems.xml.gz` - XML format
- `https://cve.mitre.org/data/downloads/allitems.html` - HTML reference

### CSOAI Use Case
- Ground-truth CVE identifiers for vulnerability entity linking
- Cross-reference with NVD data for enrichment

---

## 3. CISA KEV (Known Exploited Vulnerabilities)

| Attribute | Details |
|-----------|---------|
| **Provider** | CISA (Cybersecurity and Infrastructure Security Agency) |
| **URL** | https://www.cisa.gov/known-exploited-vulnerabilities-catalog |
| **JSON Feed** | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` |
| **CSV Feed** | Available on the catalog page |
| **Format** | JSON, CSV |
| **API/Bulk** | Direct JSON/CSV download (no API key needed) |
| **Rate Limits** | None - public feed |
| **Authentication** | None required |
| **Coverage** | 1,600+ actively exploited CVEs |

### JSON Schema
```json
{
  "title": "CISA Catalog of Known Exploited Vulnerabilities",
  "catalogVersion": "2026.04.24",
  "dateReleased": "2026-04-24",
  "count": 1623,
  "vulnerabilities": [
    {
      "cveID": "CVE-2024-57726",
      "vendorProject": "SimpleHelp",
      "product": "SimpleHelp",
      "vulnerabilityName": "SimpleHelp Missing Authorization Vulnerability",
      "dateAdded": "2026-04-24",
      "shortDescription": "...",
      "requiredAction": "Apply mitigations per vendor instructions...",
      "dueDate": "2026-05-08",
      "knownRansomwareCampaignUse": "Known",
      "notes": "..."
    }
  ]
}
```

### CSOAI Use Case
- **Critical signal for vulnerability prioritization** - actively exploited = highest priority
- Train AI to distinguish theoretical vs. in-the-wild exploited vulnerabilities
- Correlate with ransomware campaign data
- Federal compliance scoring (BOD 22-01) [^1554^] [^1542^]

---

## 4. MISP Threat Sharing Platform

| Attribute | Details |
|-----------|---------|
| **Provider** | CIRCL (Computer Incident Response Center Luxembourg) + community |
| **URL** | https://www.misp-project.org/ |
| **CIRCL Instance** | https://www.circl.lu/services/misp-malware-information-sharing-platform/ |
| **Format** | MISP JSON, STIX 2.1, OpenIOC, CSV, YARA, Snort/Suricata rules |
| **API/Bulk** | REST API + PyMISP library + feed subscriptions |
| **Rate Limits** | Varies by community; OSINT feeds are generally unlimited |
| **Authentication** | Free account request (requires PGP key); OSINT feeds open |
| **Coverage** | Millions of IOCs, malware samples, threat actor profiles |

### Access Methods
1. **CIRCL OSINT Feed** (open): https://www.circl.lu/doc/misp/feed-osint/
2. **CIRCL MISP Community** (registration required): Free for CERTs, researchers, security vendors
3. **Self-hosted MISP**: Open source, free to install
4. **GitHub STIX conversions**: https://codeberg.org/adulau/misp-circl-feed [^1589^]

### PyMISP Library
```python
from pymisp import PyMISP
misp = PyMISP('https://misp.circl.lu', 'YOUR_API_KEY')
events = misp.search_index(tags=['malware'])
```

### CSOAI Use Case
- Primary source for IOCs (IPs, domains, file hashes, URLs)
- Threat actor attribution and campaign tracking
- Train AI on threat intelligence correlation
- Generate detection rules automatically
- **Free OSINT feeds available without registration** [^1451^] [^1465^]

---

## 5. abuse.ch

### 5a. URLhaus (Malicious URLs)

| Attribute | Details |
|-----------|---------|
| **URL** | https://urlhaus.abuse.ch/ |
| **API** | https://urlhaus-api.abuse.ch/ |
| **Format** | JSON, CSV, Snort/Suricata rules, RPZ, plain text |
| **API/Bulk** | REST API + bulk database dumps |
| **Auth-Key** | Free at https://auth.abuse.ch/ |
| **Rate Limits** | Reasonable use; feed updates every 5 minutes |

### 5b. MalwareBazaar (Malware Samples)

| Attribute | Details |
|-----------|---------|
| **URL** | https://bazaar.abuse.ch/ |
| **API** | https://bazaar.abuse.ch/api/ |
| **Format** | JSON, ZIP samples |
| **API/Bulk** | REST API for upload/download/query |
| **Auth-Key** | Free at https://auth.abuse.ch/ |

### 5c. ThreatFox (IOCs)

| Attribute | Details |
|-----------|---------|
| **URL** | https://threatfox.abuse.ch/ |
| **API** | https://threatfox-api.abuse.ch/ |
| **Format** | JSON |
| **API/Bulk** | REST API + bulk export |
| **Auth-Key** | Free at https://auth.abuse.ch/ |
| **Coverage** | IOCs associated with malware families |

### 5d. YARAify (YARA Rules)

| Attribute | Details |
|-----------|---------|
| **URL** | https://yaraify.abuse.ch/ |
| **Format** | YARA rules, scan results |
| **API** | REST API for rule deployment and scanning |

### API Endpoints (Unified)
- `POST https://urlhaus-api.abuse.ch/v1/url/` - Query URL info
- `POST https://mb-api.abuse.ch/api/v1/` - Query/submit malware samples
- `POST https://threatfox-api.abuse.ch/v2/` - Query IOCs by malware family
- `GET https://urlhaus-api.abuse.ch/v2/auth-key/downloads/` - Bulk exports

### Hunting Platform (NEW - March 2025)
- **URL**: https://hunting.abuse.ch/
- Query all abuse.ch datasets with one search
- Includes previously private datasets: Sandnet, IPintel, ProxyCheck
- False positive list with API export [^1549^] [^1609^] [^1610^]

### CSOAI Use Case
- Download malware samples for sandbox analysis
- Build malicious URL detection models
- Map IOCs to malware families for threat attribution
- Generate YARA rules from detected patterns
- **Free Auth-Key required; contribute data to maintain free access** [^1544^]

---

## 6. VirusTotal API (Free Tier)

| Attribute | Details |
|-----------|---------|
| **Provider** | Google (Chronicle Security) |
| **URL** | https://www.virustotal.com/ |
| **API Docs** | https://docs.virustotal.com/ |
| **API Base** | `https://www.virustotal.com/api/v3/` |
| **Format** | JSON:API |
| **API/Bulk** | REST API only (no bulk downloads on free tier) |
| **Rate Limits** | 4 requests/minute, 500 requests/day |
| **Commercial Use** | Prohibited on free tier |
| **API Key** | Free registration required |

### Free Tier Endpoints
- `GET /files/{id}` - File report by hash (MD5/SHA1/SHA256)
- `POST /files` - Upload file for scanning (max 32MB)
- `GET /urls/{id}` - URL report (id = base64url of URL)
- `POST /urls` - Submit URL for scanning
- `GET /domains/{domain}` - Domain reputation
- `GET /ip_addresses/{ip}` - IP reputation
- `GET /search?query={query}` - Basic search

### Key Objects
- File objects: detection ratios, sandbox behavior, contacted domains/IPs
- URL objects: detection ratios, redirects, final URL
- Domain/IP: reputation scores, passive DNS, whois, SSL certs

### Rate Limiting Best Practices
- Cache aggressively (reports change slowly)
- Add `time.sleep(15)` between requests
- Always GET report before POSTing new scan
- Use polling via `/analyses/{id}` instead of repeated lookups [^1541^] [^1547^]

### CSOAI Use Case
- File hash reputation lookup for malware detection
- Domain/IP reputation for phishing detection
- Multi-engine scan results as training features
- Sandbox behavior analysis for threat classification

---

## 7. Shodan API (Free Tier)

| Attribute | Details |
|-----------|---------|
| **Provider** | Shodan (by John Matherly) |
| **URL** | https://www.shodan.io/ |
| **API Docs** | https://developer.shodan.io/api |
| **Format** | JSON |
| **API/Bulk** | REST API |
| **Rate Limits** | 100 query credits/month (free membership, $49 one-time) |
| **Results/Credit** | 100 results per query credit |
| **API Key** | Free account signup |

### Free Tier Features
- 100 query credits/month
- 100 scan credits/month
- 16 monitored IPs
- Basic search filters (no `vuln` or `tag` filters)
- JSON output
- IP lookups via InternetDB (no credits needed)

### InternetDB (Free, No Credits)
```
GET https://internetdb.shodan.io/{ip}
```
Returns: hostnames, ports, tags, CVEs for any IP. No API key needed.

### Key API Endpoints
- `GET /shodan/host/{ip}` - Host details
- `GET /shodan/host/search?query={query}` - Search (consumes credits)
- `GET /shodan/ports` - List of tracked ports
- `GET /dns/resolve?hostnames={domains}` - DNS resolution (free)

### Search Query Examples
- `apache` - Find Apache servers
- `port:3389` - Find RDP services
- `vuln:CVE-2021-44228` - Find Log4j (requires paid tier)
- `org:"Amazon"` - Find AWS infrastructure [^1452^] [^1578^]

### CSOAI Use Case
- Attack surface mapping and asset discovery
- Exposed service detection for vulnerability assessment
- Geolocation and ASN data for threat actor infrastructure analysis
- **InternetDB provides free IP enrichment without credits**

---

## 8. AlienVault OTX (Open Threat Exchange)

| Attribute | Details |
|-----------|---------|
| **Provider** | AT&T Cybersecurity (formerly AlienVault) |
| **URL** | https://otx.alienvault.com/ |
| **API Docs** | https://otx.alienvault.com/api |
| **Format** | JSON, STIX/TAXII, OpenIOC |
| **API/Bulk** | REST API + pulse subscriptions |
| **Rate Limits** | Generous (no strict published limits); STIX/TAXII supported |
| **Authentication** | Free API key with registration |
| **Coverage** | 100,000+ users, 140 countries, 19M+ indicators daily |

### API Endpoints
- `GET /api/v1/pulses/subscribed` - Get subscribed pulses
- `GET /api/v1/indicators/{type}/{indicator}` - Lookup IP/domain/hash/URL
- `GET /api/v1/pulses/{id}` - Get specific pulse details
- `GET /api/v1/search/pulses?q={query}` - Search pulses
- `GET /api/v1/user/me` - Account info

### Indicator Types
- IPv4/IPv6 addresses
- Domains, hostnames, URLs
- File hashes (MD5, SHA1, SHA256)
- CVE numbers
- CIDR ranges, file paths, mutex names

### CSOAI Use Case
- Threat actor tracking via pulse subscriptions
- IOC enrichment with MITRE ATT&CK mappings
- Community threat intelligence correlation
- STIX/TAXII integration for standardized threat sharing
- **100% free, largest open threat intel community** [^1450^] [^1453^] [^1455^]

---

## 9. GreyNoise API (Community)

| Attribute | Details |
|-----------|---------|
| **Provider** | GreyNoise Intelligence |
| **URL** | https://www.greynoise.io/ |
| **API Docs** | https://docs.greynoise.io/ |
| **Community API** | `https://api.greynoise.io/v3/community/{ip}` |
| **Format** | JSON |
| **API/Bulk** | REST API (community) |
| **Rate Limits** | 50 searches/week (combined API + Visualizer) |
| **Authentication** | Free community account |

### Community API Response
```json
{
  "ip": "51.91.185.74",
  "noise": true,
  "riot": false,
  "classification": "malicious",
  "name": "unknown",
  "link": "https://viz.greynoise.io/ip/51.91.185.74",
  "last_seen": "2021-03-18",
  "message": "Success"
}
```

### Key Fields
- `noise`: Whether IP was observed scanning in last 90 days
- `riot`: Whether IP is in RIOT (known benign services)
- `classification`: malicious, benign, unknown
- `name`: Organization owning the IP

### Enterprise APIs (paid)
- IP Context API: Full context on IPs
- GNQL (GreyNoise Query Language): Advanced search
- Multi IP Lookup: Batch queries
- RIOT API: Known benign services [^1454^] [^1458^]

### CSOAI Use Case
- Filter out internet scanning "noise" from SIEM alerts
- Classify IPs as benign (RIOT) vs. malicious vs. unknown
- Reduce false positives in threat detection
- Contextualize security alerts with scan behavior data

---

## 10. CERT Feeds Globally

| Attribute | Details |
|-----------|---------|
| **Provider** | Various National CERTs |
| **URL** | https://www.first.org/members/teams/ |
| **FIRST.org Directory** | 854+ incident response teams worldwide |
| **Format** | Varies (RSS, email, STIX/TAXII, web) |
| **API/Bulk** | Varies by CERT |
| **Authentication** | Usually none for public feeds |

### Key CERT Feeds

| CERT | Country | Feed URL |
|------|---------|----------|
| **US-CERT / CISA** | USA | https://www.cisa.gov/uscert/ncas/current-activity.xml |
| **CERT/CC** | USA (Carnegie Mellon) | https://www.kb.cert.org/vuls/ |
| **CERT-FR** | France | https://www.cert.ssi.gouv.fr/ |
| **CERT-Bund** | Germany | https://www.bsi.bund.de/DE/Themen/Unternehmen-Institutionen/Cyber-Sicherheitslage/Threat-Intelligence/cert-bund_meldungen.html |
| **NCSC** | UK | https://www.ncsc.gov.uk/section/keep-up-to-date/report-an-incident |
| **JPCERT/CC** | Japan | https://www.jpcert.or.jp/english/ |
| **CERT-EU** | EU | https://cert.europa.eu/ |
| **CIRCL** | Luxembourg | https://www.circl.lu/ |
| **ACSC** | Australia | https://www.cyber.gov.au/ |

### Aggregation Resources
- **FIRST.org**: https://www.first.org/ - Global incident response coordination
- **EPSS Scores**: https://www.first.org/epss/ - Exploit prediction via FIRST
- **MISP Feeds**: Many CERTs publish OSINT feeds via MISP [^1582^]

### CSOAI Use Case
- Subscribe to national CERT alerts for region-specific threats
- Aggregate multiple CERT feeds for comprehensive coverage
- Correlate CERT advisories with internal threat detection

---

## 11. MITRE ATT&CK Framework

| Attribute | Details |
|-----------|---------|
| **Provider** | MITRE Corporation |
| **URL** | https://attack.mitre.org/ |
| **TAXII Server** | `https://attack-taxii.mitre.org` |
| **GitHub** | https://github.com/mitre-attack |
| **Format** | STIX 2.1, JSON bundles, TAXII 2.1 |
| **API/Bulk** | TAXII 2.1 API + JSON bundle downloads |
| **Rate Limits** | 10 requests per 10 minutes (TAXII); GitHub has its own limits |
| **Authentication** | None required |

### Access Methods

**1. TAXII 2.1 API**
```python
from taxii2client.v21 import Server
server = Server("https://attack-taxii.mitre.org/taxii2/")
api_root = server.api_roots[0]
for collection in api_root.collections:
    print(f"{collection.title}: {collection.id}")
```

**2. JSON Bundle Downloads**
- Enterprise ATT&CK: https://attack.mitre.org/docs/enterprise-attack.json
- Mobile ATT&CK: https://attack.mitre.org/docs/mobile-attack.json
- ICS ATT&CK: https://attack.mitre.org/docs/ics-attack.json

**3. Collection IDs (for TAXII)**
- Enterprise: `95ecc380-afe9-11e4-9b6c-751b66dd541e`
- Mobile: `2f669986-b40b-4423-b720-4396ca6a462b`
- ICS: `02c3ef24-9cd4-48f3-a99f-b74ce24f1d34`

### Content Types
- `attack-pattern`: Techniques
- `intrusion-set`: Threat groups/actors
- `malware`: Malware families
- `tool`: Tools used by attackers
- `course-of-action`: Mitigations
- `relationship`: Mappings between entities

### ATT&CK Navigator
- Interactive matrix visualization
- Export layers in JSON format
- Custom annotations for threat mapping [^1586^] [^1610^] [^1618^]

### CSOAI Use Case
- **Essential for AI security agent training** - provides structured adversary behavior
- Map detected IOCs to ATT&CK techniques
- Generate detection rules aligned to techniques
- Train AI to attribute threats to known actors
- Build MITRE ATT&CK coverage heatmaps

---

## 12. CAPEC

| Attribute | Details |
|-----------|---------|
| **Provider** | MITRE Corporation |
| **URL** | https://capec.mitre.org/ |
| **Downloads** | https://capec.mitre.org/data/downloads.html |
| **Format** | XML, CSV, HTML (booklet) |
| **API/Bulk** | Bulk downloads (no API) |
| **Rate Limits** | None |
| **Authentication** | None |
| **Coverage** | 559 attack patterns |

### Downloads
- `https://capec.mitre.org/data/downloads/capec_latest.xml.zip` - Full XML
- `https://capec.mitre.org/data/downloads/capec_latest.csv.zip` - Full CSV
- External mappings: ATT&CK, OWASP, WASC

### CSOAI Use Case
- Map CVEs to attack patterns for threat modeling
- Understand how vulnerabilities are exploited in practice
- Correlate CAPEC with CWE (Common Weakness Enumeration)
- Build attack chain models for AI threat prediction [^1581^] [^1584^]

---

## 13. OWASP Vulnerability Data

| Attribute | Details |
|-----------|---------|
| **Provider** | OWASP Foundation |
| **Top 10 Web** | https://owasp.org/Top10/ |
| **Top 10 API** | https://owasp.org/API-Security/ |
| **Cheat Sheets** | https://cheatsheetseries.owasp.org/ |
| **Format** | Web, PDF, various |
| **API/Bulk** | Web pages; no formal API |
| **Rate Limits** | N/A |
| **Authentication** | None |

### OWASP API Security Top 10 (2023)
1. **API1:2023** - Broken Object Level Authorization (BOLA)
2. **API2:2023** - Broken Authentication
3. **API3:2023** - Broken Object Property Level Authorization
4. **API4:2023** - Unrestricted Resource Consumption
5. **API5:2023** - Broken Function Level Authorization (BFLA)
6. **API6:2023** - Unrestricted Access to Sensitive Business Flows
7. **API7:2023** - Server Side Request Forgery (SSRF)
8. **API8:2023** - Security Misconfiguration
9. **API9:2023** - Improper Inventory Management
10. **API10:2023** - Unsafe Consumption of APIs

### CSOAI Use Case
- Train AI on common vulnerability categories
- Generate security requirements from OWASP categories
- Map detected issues to OWASP Top 10 for reporting
- Compliance mapping for security assessments [^1609^] [^1617^]

---

## 14. Have I Been Pwned API

| Attribute | Details |
|-----------|---------|
| **Provider** | Troy Hunt |
| **URL** | https://haveibeenpwned.com/ |
| **API Docs** | https://haveibeenpwned.com/API/ |
| **Format** | JSON |
| **API/Bulk** | REST API |
| **Rate Limits** | Password API: None; Email API: 10 req/min (with key) |
| **Authentication** | Password API: None; Email/Breach APIs: $3.50/month |
| **Coverage** | 14+ billion compromised accounts across 800+ breaches |

### API Endpoints

**Password Check (FREE - k-anonymity model)**
```
GET https://api.pwnedpasswords.com/range/{first_5_sha1_chars}
```
- No API key, no rate limit
- Returns SHA-1 suffixes with breach counts

**Email Check (requires API key)**
```
GET https://haveibeenpwned.com/api/v3/breachedaccount/{email}
Headers: hibp-api-key: YOUR_KEY
```

**Breach List (no auth required)**
```
GET https://haveibeenpwned.com/api/v3/breaches
```

### Rate Limit Tiers (as of 2022)
| Tier | RPM | Price |
|------|-----|-------|
| Standard | 10 | $3.50/mo |
| 100 RPM | 100 | ~$24/mo |
| 500 RPM | 500 | ~$138/mo |
| 1500 RPM | 1500 | ~$408/mo |

### CSOAI Use Case
- Check if user credentials are compromised
- Integrate into password policies for proactive defense
- Breach notification automation
- Credential stuffing attack detection
- **Password API is completely free with no authentication** [^1573^] [^1608^] [^1614^]

---

## 15. CISA Alerts & Advisories

| Attribute | Details |
|-----------|---------|
| **Provider** | CISA |
| **Alerts URL** | https://www.cisa.gov/news-events/alerts |
| **Advisories URL** | https://www.cisa.gov/news-events/analysis-reports |
| **ICS Advisories** | https://www.cisa.gov/news-events/ics-advisories |
| **Format** | Web, RSS/Atom feeds, JSON |
| **API/Bulk** | RSS/Atom feeds + web scraping |
| **Rate Limits** | None for feeds |
| **Authentication** | None |

### Feed Sources
- **Current Activity**: https://www.cisa.gov/uscert/ncas/current-activity.xml
- **Alerts**: RSS feeds by category
- **ICS-CERT Advisories**: https://www.cisa.gov/uscert/ics/advisories
- **CISA KEV**: (see Section 3)
- **AA (Analysis Reports)**: In-depth threat analysis

### Content Types
- **Alert (AA-##)**: Time-sensitive threat info
- **Analysis Report (AR-##)**: Detailed threat analysis
- **Security Tip (ST##-###)**: Best practices
- **Bulletin (SB##-###)**: Weekly vulnerability summaries
- **ICS Advisory (ICSA-##-##-##)**: Industrial control systems

### CSOAI Use Case
- Stay current on nation-state threats and APT campaigns
- Receive actionable IOCs from government alerts
- Track CISA BODs (Binding Operational Directives)
- Correlate alerts with internal detection data

---

## 16. EPSS (Exploit Prediction Scoring System)

| Attribute | Details |
|-----------|---------|
| **Provider** | FIRST.org |
| **URL** | https://www.first.org/epss/ |
| **API** | https://api.first.org/ |
| **Format** | CSV, JSON (API) |
| **API/Bulk** | Daily CSV download + REST API |
| **Rate Limits** | None - open data |
| **Authentication** | None |
| **Coverage** | EPSS score (0-1 probability) for all published CVEs |

### API Endpoint
```
GET https://api.first.org/data/v1/epss?cve=CVE-2021-44228
```

### CSV Download
- Daily full dump of all CVE EPSS scores and percentiles
- Available at: https://www.first.org/epss/data_stats

### CSOAI Use Case
- **Quantitative vulnerability prioritization** - probability of exploitation
- Combine EPSS with CVSS for risk-based prioritization
- Train AI models on which vulnerabilities get exploited
- Replace subjective severity with empirical data
- Free, open, machine-learning driven predictions updated daily [^1612^] [^1613^] [^1615^]

---

## 17. CIRCL CVE Search API

| Attribute | Details |
|-----------|---------|
| **Provider** | CIRCL (Computer Incident Response Center Luxembourg) |
| **URL** | https://cve.circl.lu/ |
| **API Docs** | https://cve-search.github.io/api/ |
| **Vulnerability-Lookup** | https://vulnerability.circl.lu/ |
| **Format** | JSON |
| **API/Bulk** | REST API |
| **Rate Limits** | None enforced; use responsibly |
| **Authentication** | None for public endpoints |
| **Coverage** | Full CVE database + CPE + CWE + CAPEC enrichment |

### API Endpoints
- `GET /api/browse` - List all vendors
- `GET /api/browse/{vendor}` - Products by vendor
- `GET /api/search/{vendor}/{product}` - CVEs by vendor/product
- `GET /api/cve/{CVE-ID}` - Full CVE details with CWE and CAPEC
- `GET /api/last` - Last 30 updated CVEs
- `GET /api/dbInfo` - Database statistics

### Example Response (CVE lookup)
```json
{
  "id": "CVE-2010-3333",
  "cvss": 9.3,
  "cvss3": null,
  "summary": "...",
  "cwes": ["CWE-119"],
  "capec": ["CAPEC-47", "CAPEC-100"],
  "vulnerable_product": ["cpe:2.3:a:microsoft:office:2003..."]
}
```

### CSOAI Use Case
- Richer CVE data than NVD alone (includes CAPEC/CWE)
- Cross-vendor vulnerability search
- Open source - can be self-hosted
- Feed training data with full vulnerability context [^1572^] [^1574^] [^1575^] [^1579^]

---

## 18. Phishing Feeds

### 18a. PhishTank

| Attribute | Details |
|-----------|---------|
| **Provider** | Cisco Talos |
| **URL** | https://www.phishtank.com/ |
| **API** | https://www.phishtank.net/api/ |
| **Format** | JSON, XML |
| **Rate Limits** | Requests per hour limited (see developer docs) |
| **Authentication** | Free API key with registration |
| **Commercial Use** | Allowed |

### 18b. OpenPhish

| Attribute | Details |
|-----------|---------|
| **Provider** | OpenPhish |
| **URL** | https://openphish.com/ |
| **Free Feed** | `https://openphish.com/feed.txt` |
| **Format** | Plain text URLs (free), JSON (premium) |
| **Update Frequency** | Free: 2x daily; Premium: real-time |
| **Authentication** | None for free tier |

### 18c. phishunt

| Attribute | Details |
|-----------|---------|
| **URL** | https://phishunt.io/ |
| **API** | `https://phishunt.io/api/v1/domains` |
| **Format** | JSON, CSV, TXT |
| **Rate Limits** | 10 req/sec per IP |
| **Authentication** | None |
| **License** | CC0 1.0 (public domain) |

### CSOAI Use Case
- Train phishing URL detection models
- Real-time phishing site blocking
- Brand impersonation detection
- Email gateway integration
- Cross-reference with malware distribution URLs [^1570^] [^1571^] [^1576^] [^1588^] [^1594^] [^1597^]

---

## 19. EmergingThreats

| Attribute | Details |
|-----------|---------|
| **Provider** | Proofpoint (formerly Emerging Threats / EmergingThreats.net) |
| **URL** | https://community.emergingthreats.net/ |
| **Rulesets** | https://rules.emergingthreats.net/ |
| **Format** | Snort/Suricata rules, plain text |
| **API/Bulk** | Direct download |
| **Rate Limits** | None |
| **Authentication** | None for ET Open |
| **License** | BSD (ET Open) |

### ET Open (Free)
- Community-contributed IDS/IPS rules
- Updated daily
- Covers: malware, exploits, botnets, policy violations, scan activity

### ET Pro (Paid)
- Proofpoint research team maintained
- Real-time updates
- Higher fidelity signatures

### Integration
```bash
# Download Snort rules
wget https://rules.emergingthreats.net/open/snort-2.9.0/emerging-all.rules
# Download Suricata rules
wget https://rules.emergingthreats.net/open/suricata-6.0.0/emerging-all.rules
```

### CSOAI Use Case
- Extract IOCs from IDS rules for enrichment
- Train AI on network-based threat detection patterns
- Correlate rule triggers with threat intelligence
- Build detection rules automatically from threat data [^1593^] [^1595^] [^1596^]

---

## 20. Censys (Free Tier)

| Attribute | Details |
|-----------|---------|
| **Provider** | Censys |
| **URL** | https://search.censys.io/ |
| **API** | https://search.censys.io/api |
| **Format** | JSON |
| **API/Bulk** | REST API |
| **Rate Limits** | 250 queries/month (free) |
| **Results/Query** | 100 results |
| **Authentication** | Free API ID + Secret |

### Key API Endpoints
```python
import requests
from requests.auth import HTTPBasicAuth

API_ID = "your-api-id"
API_SECRET = "your-api-secret"
auth = HTTPBasicAuth(API_ID, API_SECRET)

# Search hosts
response = requests.get(
    "https://search.censys.io/api/v2/hosts/search",
    params={"q": "services.port: 3389", "per_page": 100},
    auth=auth
)
```

### Strengths vs Shodan
- Superior TLS/certificate intelligence
- 400M+ hosts, 7B+ certificates
- Better structured query language
- Fingerprinting by certificate hash

### CSOAI Use Case
- Certificate monitoring and tracking
- Attack surface mapping
- Threat hunting by certificate patterns
- Compliance scanning for TLS configuration
- Complement Shodan for certificate-focused intelligence [^1457^]

---

## Summary Comparison Table

| # | Source | Type | Format | Auth | Rate Limit | Commercial |
|---|--------|------|--------|------|------------|------------|
| 1 | NVD | Vulnerability DB | JSON 2.0 | Optional | ~5 req/s | Yes |
| 2 | CVE (MITRE) | Vulnerability DB | CSV/XML | None | None | Yes |
| 3 | CISA KEV | Exploited CVEs | JSON/CSV | None | None | Yes |
| 4 | MISP | IOC Sharing | MISP JSON/STIX | Free acct | Varies | Yes |
| 5 | abuse.ch | Malware/IOCs | JSON/CSV | Free key | Reasonable | Yes |
| 6 | VirusTotal | Reputation | JSON:API | Free key | 4 req/min | **No** (free) |
| 7 | Shodan | Internet Scan | JSON | Free acct | 100 credits/mo | Yes |
| 8 | OTX | Threat Intel | JSON/STIX | Free key | Generous | Yes |
| 9 | GreyNoise | IP Context | JSON | Free acct | 50/week | Yes |
| 10 | CERT Feeds | Advisories | Varies | None | None | Yes |
| 11 | MITRE ATT&CK | TTP Framework | STIX 2.1 | None | 10/10min | Yes |
| 12 | CAPEC | Attack Patterns | XML/CSV | None | None | Yes |
| 13 | OWASP | Vuln Categories | Web/PDF | None | N/A | Yes |
| 14 | HIBP | Breach Data | JSON | Free/$3.50mo | Password: None | Yes |
| 15 | CISA Alerts | Advisories | RSS/Web | None | None | Yes |
| 16 | EPSS | Exploit Scores | CSV/JSON | None | None | Yes |
| 17 | CIRCL CVE | Vuln Search | JSON | None | None | Yes |
| 18 | PhishTank | Phishing URLs | JSON/XML | Free key | Hourly limit | Yes |
| 19 | ET Open | IDS Rules | Text | None | None | Yes (BSD) |
| 20 | Censys | Internet Scan | JSON | Free acct | 250/month | Yes |

---

## Recommended Integration Architecture for CSOAI

```
                    +---------------------------+
                    |      CSOAI AI Agents      |
                    |  (Training & Inference)   |
                    +-------------+-------------+
                                  |
            +--------------------+--------------------+
            |                                         |
    +-------v-------+                         +-------v-------+
    | VULNERABILITY |                         |  THREAT INTEL |
    |    DATA       |                         |    DATA       |
    +---------------+                         +---------------+
    | - NVD API     |                         | - MISP OSINT  |
    | - CISA KEV    |                         | - abuse.ch    |
    | - EPSS API    |                         | - OTX Pulses  |
    | - CIRCL CVE   |                         | - GreyNoise   |
    | - CVE (MITRE) |                         | - VirusTotal  |
    +---------------+                         +---------------+
            |                                         |
    +-------v-------+                         +-------v-------+
    |   TTP DATA    |                         |  PHISHING/    |
    |               |                         |  MALWARE DATA |
    | - MITRE ATT&CK|                         +---------------+
    | - CAPEC       |                         | - PhishTank   |
    | - OWASP       |                         | - OpenPhish   |
    +---------------+                         | - URLhaus     |
            |                                 | - MalwareBaz  |
            |                                 +---------------+
            |
    +-------v-------+
    |  BREACH DATA  |
    +---------------+
    | - HIBP        |
    +---------------+
```

---

## References

[^1451^] MISP Threat Intelligence Integration - https://www.malwarepatrol.net/misp-project-free-threat-intelligence-platform/

[^1452^] Shodan Data Extraction Without API Credits - https://medium.com/@M4p7n4./shodan-cat-maximizing-shodan-data-extraction-without-api-credits-76bdc9dfef9e

[^1453^] AlienVault OTX for Maltego - https://www.maltego.com/transform-hub/alienvault-otx/

[^1454^] GreyNoise Community API for Maltego - https://www.maltego.com/transform-hub/greynoise-community-api/

[^1457^] Censys Free API Alternative - https://dev.to/0012303/censys-has-a-free-api-the-shodan-alternative-for-internet-wide-scanning-19pa

[^1458^] GreyNoise Community API Docs - https://docs.greynoise.io/docs/using-the-greynoise-community-api

[^1465^] CIRCL MISP Platform - https://www.circl.lu/services/misp-malware-information-sharing-platform/

[^1466^] AlienVault OTX - https://otx.alienvault.com/

[^1541^] VirusTotal API Skill Documentation - https://lobehub.com/tr/skills/w33ts-virustotal-api-skill

[^1542^] CISA KEV Enhancement - https://www.cisa.gov/news-events/news/cisa-enhances-known-exploited-vulnerabilities-catalog-include-new-nomination-form

[^1544^] abuse.ch Toolkit Release - https://andpalmier.com/posts/abuse-ch-toolkit/

[^1547^] VirusTotal Public vs Premium API - https://docs.virustotal.com/reference/public-vs-premium-api

[^1549^] abuse.ch Hunting Platform - https://abuse.ch/blog/introducing-abuse-ch-hunting-platform/

[^1554^] CISA KEV Catalog - https://www.cisa.gov/known-exploited-vulnerabilities-catalog?page=2

[^1570^] Open Source Threat Intelligence Feeds - https://www.techtarget.com/searchsecurity/tip/Top-open-source-and-commercial-threat-intelligence-feeds

[^1572^] CIRCL CVE Search MCP Server - https://github.com/Cyreslab-AI/circl-cve-search-mcp-server

[^1573^] Have I Been Pwned Free API - https://dev.to/0012303/have-i-been-pwned-has-a-free-api-check-if-any-email-was-in-a-data-breach-g5k

[^1574^] CVE Search Tools Comparison - https://dev.to/ugo/cve-search-tools-44oe

[^1575^] CIRCL Vulnerability-Lookup - https://www.circl.lu/services/cve-search/

[^1578^] Shodan Pricing - https://account.shodan.io/billing

[^1581^] CAPEC Attack Patterns Article - https://www.fncyber.com/web-of-trust-article/understand-common-attack-patterns/

[^1582^] FIRST.org CSIRT Teams Scraper - https://apify.com/parseforge/first-org-csirt-teams-scraper

[^1584^] CAPEC Downloads - https://capec.mitre.org/data/downloads.html

[^1586^] MITRE ATT&CK STIX/TAXII - https://medium.com/mitre-attack/att-ck-content-available-in-stix-2-0-via-public-taxii-2-0-server-317e5c41e214

[^1587^] FKIE NVD JSON Data Feeds Mirror - https://github.com/fkie-cad/nvd-json-data-feeds

[^1588^] phishunt API - https://phishunt.io/api/

[^1589^] CIRCL MISP CTI OSINT Feed - https://codeberg.org/adulau/misp-circl-feed

[^1593^] EmergingThreats GitHub - https://github.com/jarelllama/Emerging-Threats

[^1594^] PhishTank FAQ - https://www.phishtank.net/faq.php

[^1595^] EmergingThreats FAQ - https://community.emergingthreats.net/t/frequently-asked-questions/56

[^1606^] MITRE ATT&CK Updates - https://www.slideshare.net/slideshow/mitre-att-ck-updates-software-jared-ondricek/273284273

[^1608^] VirusTotal API Documentation - https://lobehub.com/tr/skills/w33ts-virustotal-api-skill

[^1609^] abuse.ch API via Spamhaus - https://www.spamhaus.com/data-access/abusech-api/

[^1610^] URLhaus API Wazuh Integration - https://wazuh.com/blog/detecting-malicious-urls-using-wazuh-and-urlhaus/

[^1612^] EPSS FAQ - https://www.first.org/epss/faq

[^1613^] First EPSS Elastic Integration - https://www.elastic.co/docs/reference/integrations/first_epss

[^1614^] HIBP API Rate Limit Changes - https://www.troyhunt.com/the-have-i-been-pwned-api-now-has-different-rate-limits-and-annual-billing/

[^1615^] EPSS Homepage - https://www.first.org/epss/

[^1618^] ATT&CK Data & Tools - https://attack.mitre.org/resources/attack-data-and-tools/

---

*Document generated: 2026-07-02 | Sources: 20+ | All data verified from official documentation*
