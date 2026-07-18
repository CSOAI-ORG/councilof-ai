# OPERATION DEEP EXECUTE: Open Source Cyber Defense Arsenal for DEFONEOS

> **Classification:** DEFONEOS Internal | **Version:** 1.0 | **Date:** 2025
>
> **Mission:** Build a complete, zero-cost cyber defense capability using the world's best open-source security tools.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [SIEM (Security Information & Event Management)](#2-siem-security-information--event-management)
3. [Threat Intelligence](#3-threat-intelligence)
4. [Vulnerability Management](#4-vulnerability-management)
5. [Network Monitoring](#5-network-monitoring)
6. [Endpoint Detection & Response (EDR)](#6-endpoint-detection--response-edr)
7. [Penetration Testing / Red Team](#7-penetration-testing--red-team)
8. [Adversary Emulation](#8-adversary-emulation)
9. [AI-Powered Cyber Tools](#9-ai-powered-cyber-tools)
10. [DEFONEOS Cyber Defense Stack Architecture](#10-the-defoneos-cyber-defense-stack-architecture)
11. [MCP Server Designs](#11-mcp-server-designs-for-each-capability)
12. [Cost Comparison](#12-cost-comparison)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### The Mission

DEFONEOS requires a complete cyber defense capability that provides enterprise-grade security monitoring, threat detection, incident response, and adversary emulation -- at zero software licensing cost.

### The Solution

An integrated stack of 40+ open-source cybersecurity tools, orchestrated through Model Context Protocol (MCP) servers, forming a unified cyber defense module with:

| Capability | DEFONEOS Selection | Status |
|---|---|---|
| SIEM | **Wazuh** (primary) + Elastic Security (secondary) | Free/Open Source |
| Threat Intelligence | **MISP** + OpenCTI | Free/Open Source |
| Vulnerability Management | **Greenbone OpenVAS** + Nuclei + OWASP ZAP | Free/Open Source |
| Network Monitoring | **Suricata** + Zeek + Arkime | Free/Open Source |
| EDR | **Velociraptor** + Osquery + Sysmon | Free/Open Source |
| Penetration Testing | **Kali Linux** + Metasploit + Sliver | Free/Open Source |
| Adversary Emulation | **MITRE Caldera** + Atomic Red Team | Free/Open Source |
| AI Security | **PyRIT** + Garak + NeMo Guardrails + Tracecat | Free/Open Source |

### Bottom Line

- **Commercial equivalent cost:** $500,000 - $2,000,000/year
- **DEFONEOS open-source stack cost:** $0/month (software only)
- **Actual cost:** Infrastructure + Personnel + Support
- **Savings:** 85-95% compared to commercial alternatives

---

## 2. SIEM (Security Information & Event Management)

### 2.1 Tool Comparison Matrix

| Tool | License | Best For | Resource Usage | Performance | Community | Maturity |
|---|---|---|---|---|---|---|
| **Wazuh** | GPLv2 | Enterprise SIEM+XDR | Medium | High (with tuning) | Very Large (10M+ downloads) | Very Mature |
| **Elastic Security** | Elastic License (free tier) | Advanced analytics | High | Very High | Large | Mature |
| **Graylog** | SSPL | Log management focus | Medium-High | Good | Medium | Mature |
| **Prelude SIEM** | GPLv2 | Research/evaluation | Low | Moderate | Small | Niche |
| **Security Onion** | GPLv2 | All-in-one NSM | Very High | Very High | Large | Very Mature |
| **Apache Metron** | Apache 2.0 (archived) | Big data analytics | Very High | High | Minimal (archived) | Legacy |

### 2.2 WAZUH -- PRIMARY SIEM SELECTION

**Why Wazuh is DEFONEOS's primary SIEM:**

- **10M+ downloads**, 250K+ GitHub stars (combined ecosystem)
- Full SIEM + XDR + EDR in a single open-source platform
- Agent-based architecture supporting Windows, Linux, macOS, containers
- Agentless monitoring for firewalls, switches, routers, NIDS
- Built-in MITRE ATT&CK mapping for all alerts
- Compliance dashboards (GDPR, HIPAA, PCI DSS, NIST, CIS)
- Active response capabilities (automated threat response)
- File Integrity Monitoring (FIM) with real-time alerting
- Vulnerability detection using CVE database
- Full REST API for automation and integration

**Wazuh Architecture:**
```
Endpoints (Agents)
    |
    v
Wazuh Server (Analysis Engine + REST API + Cluster Daemon)
    |
    v
Wazuh Indexer (OpenSearch - Full-text search + storage)
    |
    v
Wazuh Dashboard (Visualization + Alerting)
```

**Key Components:**
| Component | Function | Scalability |
|---|---|---|
| Wazuh Agent | Endpoint data collection (logs, FIM, inventory) | 1,000s per server |
| Wazuh Server | Analysis engine, decoders, rules, threat intel | Horizontal cluster |
| Wazuh Indexer | OpenSearch-based alert storage and indexing | Multi-node cluster |
| Wazuh Dashboard | Kibana-based visualization and investigation | Shared with Indexer |

**Performance at Scale:**
- Single server: 500-1000 agents
- Cluster mode: 10,000+ agents
- Hybrid architecture (Kafka + ClickHouse): 80% storage reduction, sub-second queries across billions of records
- ML-enhanced detection: 45ms average inference latency

**Resource Requirements (Minimum):**
- Server: 8 vCPU, 8 GB RAM, 100 GB SSD
- Agent: <1% CPU, ~50 MB RAM

### 2.3 Elastic Security -- SECONDARY/ADVANCED ANALYTICS

**Capabilities (Free Tier):**
- Elasticsearch, Logstash, Kibana (ELK stack)
- Elastic Agent + Fleet Server for centralized agent management
- SIEM detection engine with prebuilt rules
- Case management and timeline investigation
- Machine Learning anomaly detection (requires Platinum license)

**Free Tier Limitations:**
- No alert connectors (email, webhook require paid license)
- No ML anomaly detection
- Workaround: Use Logstash to read alerts index and route externally

**Resource Requirements:**
- Minimum: 8 vCPU, 16 GB RAM, 200 GB SSD
- Recommended: 16 vCPU, 32 GB RAM, 500 GB SSD+

### 2.4 Graylog -- LOG MANAGEMENT SPECIALIST

**When to use:** If primary need is log aggregation and search rather than full SIEM
- GELF protocol support (native structured logging)
- Stream-based log routing
- Content packs for quick setup
- Lower resource footprint than full ELK

**Resource Requirements:**
- Minimum: 4 vCPU, 8 GB RAM, 100 GB storage

### 2.5 Security Onion -- ALL-IN-ONE NETWORK SECURITY MONITORING

**When to use:** If you need network-centric detection with host monitoring
- Actually includes Wazuh for host monitoring
- Adds Suricata + Zeek for network monitoring
- Full packet capture with Arkime
- Pre-configured dashboards and analyst tools
- Requires significant hardware: 16+ vCPU, 32+ GB RAM

### 2.6 DEFONEOS SIEM RECOMMENDATION

```
PRIMARY: Wazuh (full SIEM+XDR capability, active community, proven at scale)
SECONDARY: Elastic Security (free tier for advanced analytics where needed)
OPTIONAL: Security Onion (if heavy network monitoring is priority)
```

---

## 3. Threat Intelligence

### 3.1 Tool Comparison Matrix

| Tool | License | Best For | STIX/TAXII | Community | Maturity |
|---|---|---|---|---|---|
| **MISP** | AGPLv3 | IOC sharing, 10K+ orgs | Yes (import/export) | Massive (NATO-originated) | Very Mature |
| **OpenCTI** | Apache 2.0 | Knowledge graphs, analysis | Full STIX 2.1 native | Large, growing | Mature |
| **Yeti** | Apache 2.0 | DFIR + CTI combined | Yes | Medium | Mature |
| **ThreatBus** | Apache 2.0 | Intel distribution bus | Yes | Small | Emerging |
| **OpenTPX** | Open source | Threat profile exchange | Custom | Small | Niche |

### 3.2 MISP -- PRIMARY THREAT INTELLIGENCE PLATFORM

**Why MISP is DEFONEOS's primary TI platform:**

- Originally developed with NATO NCIRC and CIRCL contributions
- **10,000+ organizations** using globally
- Centralized IOC storage and correlation (IPs, domains, hashes, URLs)
- Built-in sharing communities with trust circles
- Flexible export: JSON, CSV, STIX 1.x/2.x, XML, YARA, OpenIOC, Sigma
- Full REST API for automation
- Event tagging, galaxy clusters, MITRE ATT&CK mapping
- MISP 2.5 (2025): Major UI/UX overhaul, performance improvements
- Active development: 12+ releases in 2025

**MISP Key Features:**
| Feature | Description |
|---|---|
| Event Management | Create, share, and correlate threat events |
| Attribute Types | 100+ types (IP, domain, hash, mutex, filename, etc.) |
| Galaxy Clusters | Pre-built knowledge base (MITRE ATT&CK, threat actors, tools) |
| Taxonomies | Standardized classification and tagging |
| Sharing Groups | Granular sharing with trusted partners |
| Feed System | Automated ingestion of 100+ threat feeds |
| API | Full REST API + PyMISP Python library |

### 3.3 OpenCTI -- SECONDARY/KNOWLEDGE GRAPH PLATFORM

**Capabilities:**
- Full STIX 2.1 knowledge graph implementation
- GraphQL API for data access
- Interactive dashboards and relationship visualization
- 300+ one-click integrations
- Automated enrichment (VirusTotal, Shodan, sandboxes)
- Case management for investigations
- Built by Filigran, originally sponsored by ANSSI (French cybersecurity agency)
- Community edition: Apache 2.0, fully free

**When to use:** For advanced threat analysis, relationship mapping, and producing finished intelligence reports

**Architecture:**
```
OpenCTI Platform
    |
    +-- Redis Cluster (sessions, coordination)
    +-- Elasticsearch/OpenSearch (threat graph storage)
    +-- RabbitMQ (async worker communication)
    +-- Connectors (300+ threat feed integrations)
```

### 3.4 Yeti -- DFIR-FOCUSED THREAT INTELLIGENCE

**Capabilities:**
- Observable and IOC management
- Forensic intelligence (Sigma rules, YARA rules, forensic objects)
- Bulk observable search
- Custom export formats
- API for integration with incident management and sandboxes
- Threat linking: connects threats to TTPs, malware, forensic artifacts

### 3.5 STIX/TAXII Infrastructure

**STIX 2.1 (Structured Threat Information Expression):**
- Standardized format for cyber threat intelligence
- Objects: SDOs (Indicator, Malware, Attack Pattern, etc.), SROs (Relationship, Sighting)
- Python library: `stix2` (MITRE)
- Libraries: `stix2-patterns`, `taxii2-client`

**TAXII 2.1 (Trusted Automated Exchange of Intelligence Information):**
- Protocol for exchanging STIX data
- Collections, Channels, Discovery endpoints
- Open-source server: `medallion` (MITRE)

### 3.6 DEFONEOS TI RECOMMENDATION

```
PRIMARY: MISP (IOC sharing, correlation, massive community)
SECONDARY: OpenCTI (knowledge graphs, analysis, enrichment)
DFIR BACKEND: Yeti (forensic intelligence, DFIR workflows)
TAXII SERVER: medallion (STIX/TAXII exchange)
```

---

## 4. Vulnerability Management

### 4.1 Tool Comparison Matrix

| Tool | License | Best For | Speed | Coverage | Maturity |
|---|---|---|---|---|---|
| **Greenbone OpenVAS** | AGPLv3 | Full vulnerability scanning | Moderate | 100K+ NVTs | Very Mature |
| **Nuclei** | MIT | Fast, targeted scanning | Very Fast | 8K+ templates | Mature |
| **OWASP ZAP** | Apache 2.0 | Web application security | Moderate | Web-focused | Very Mature |
| **Nessus Essentials** | Commercial (free) | Small networks | Fast | 170K+ plugins | Mature |
| **Nikto** | GPL | Web server scanning | Fast | Web-focused | Mature |
| **WPScan** | GPL | WordPress security | Fast | WordPress-specific | Mature |
| **Trivy** | Apache 2.0 | Container scanning | Fast | Container-focused | Mature |

### 4.2 Greenbone OpenVAS -- PRIMARY VULNERABILITY SCANNER

**Why OpenVAS is DEFONEOS's primary scanner:**

- Most widely-used open-source vulnerability scanner
- **100,000+ Network Vulnerability Tests (NVTs)**
- Authenticated and unauthenticated scanning
- CVE, CPE, and CVSS-based vulnerability reporting
- Full vulnerability management dashboard
- Scheduled scans and report generation
- Greenbone Enterprise Feed available (commercial)
- Community Feed: free, updated regularly

**2024 Benchmark Results:**
- Greenbone Community ranked 5th in detection availability among Qualys, Rapid7, Tenable, Nuclei, Nmap
- Greenbone Enterprise ranked **#1** when enterprise feed included
- Detection accuracy tied for 4th (Community) / #1 (Enterprise)

**Resource Requirements:**
- Minimum: 4 vCPU, 8 GB RAM, 50 GB storage
- Recommended: 8 vCPU, 16 GB RAM, 100 GB SSD

### 4.3 Nuclei -- FAST, TARGETED SCANNER

**Capabilities:**
- Written in Go: extremely fast concurrent execution
- YAML-based templates: easy to write custom checks
- 8,000+ community-contributed detection templates
- Active development by ProjectDiscovery
- Perfect for CI/CD integration
- Complements OpenVAS (doesn't replace it)

**Best Practice:** Use Nuclei for rapid targeted scanning and OpenVAS for comprehensive baseline assessments.

### 4.4 OWASP ZAP -- WEB APPLICATION SECURITY

**Capabilities:**
- World's most widely used web app scanner
- Passive scanning (spider + security checks)
- Active scanning (form submission, attack simulation)
- Automated and manual penetration testing
- CI/CD integration available
- API for automation

### 4.5 Nessus Essentials -- FREE COMMERCIAL OPTION

**Limitations:**
- Free for non-commercial use only
- Limited to 16 IPs
- No commercial features (reporting, multi-user, API)
- Still useful for very small environments

### 4.6 DEFONEOS VULNERABILITY MANAGEMENT RECOMMENDATION

```
PRIMARY SCANNER: Greenbone OpenVAS (comprehensive, 100K+ NVTs)
FAST SCANNER: Nuclei (targeted, fast, CI/CD integration)
WEB APPS: OWASP ZAP (deep web application scanning)
WORDPRESS: WPScan (specialized WordPress security)
CONTAINERS: Trivy (container image scanning)
```

---

## 5. Network Monitoring

### 5.1 Tool Comparison Matrix

| Tool | Type | Best For | Performance | Maturity |
|---|---|---|---|---|
| **Suricata** | IDS/IPS | High-performance threat detection | Multi-threaded, 10Gbps+ | Very Mature |
| **Zeek** | NSM | Protocol analysis, metadata extraction | Excellent | Very Mature |
| **Snort** | IDS/IPS | Signature-based detection | Good (single-threaded v2) | Legacy/Very Mature |
| **Arkime** | Full PCAP | Full packet capture and analysis | Excellent | Mature |
| **ntopng** | NTA | Network traffic analysis, flows | Good | Mature |
| **p0f** | Passive recon | OS fingerprinting | Very light | Mature |

### 5.2 Suricata -- PRIMARY IDS/IPS

**Why Suricata is DEFONEOS's primary IDS:**

- **Multi-threaded engine**: Scales to 10Gbps+ on modern hardware
- IDS and IPS modes (passive and inline)
- Automatic protocol detection (HTTP, DNS, TLS, SMB, SSH, SMTP, etc.)
- Native file extraction capabilities
- Lua scripting support for custom detection
- EVE JSON output format for SIEM integration
- Emerging Threats ruleset (free)
- Snort-compatible rules

**Performance Benchmarks:**
| Traffic | Suricata (multi-thread) | Snort 2.x | Snort 3 |
|---|---|---|---|
| 1 Gbps | Well within capacity | Single core | Achievable |
| 10 Gbps | 8+ cores | Multiple instances | Tuning required |
| 40 Gbps | DPDK + 16+ cores | Impractical | Limited |

**Resource Requirements:**
- Minimum (1Gbps): 4 vCPU, 8 GB RAM
- Recommended (10Gbps): 16 vCPU, 32 GB RAM
- With DPDK (40Gbps+): 32 vCPU, 64 GB RAM, dedicated NICs

### 5.3 Zeek -- NETWORK SECURITY MONITORING

**Capabilities:**
- Deep protocol analysis (not just signature matching)
- Extracts rich metadata from network traffic
- Scriptable in Zeek scripting language
- File extraction and analysis
- Connection logging, DNS, HTTP, TLS, SSH analysis
- Detection of anomalies, not just known threats
- Complements Suricata (Suricata = signatures, Zeek = behavioral analysis)

**Key Log Types:**
| Log | Information |
|---|---|
| conn.log | Connection records |
| dns.log | DNS queries/responses |
| http.log | HTTP requests/responses |
| ssl.log | TLS/SSL certificate details |
| files.log | File transfer metadata |
| notice.log | Zeek-generated alerts |

### 5.4 Arkime (formerly Moloch) -- FULL PACKET CAPTURE

**Capabilities:**
- Full packet capture and indexing
- Web-based interface for searching PCAPs
- SPI (Session Profile Interface) data extraction
- OpenSearch/Elasticsearch integration
- Tagging and annotation of sessions
- API for automation

### 5.5 Snort -- LEGACY IDS (STILL RELEVANT)

**Capabilities:**
- Original open-source IDS (1998)
- Vast rule database
- Snort 3 improves multi-threading but Suricata leads
- Still widely deployed, excellent documentation
- Good for environments with existing Snort expertise

### 5.6 DEFONEOS NETWORK MONITORING RECOMMENDATION

```
PRIMARY IDS: Suricata (multi-threaded, protocol-aware, high performance)
NSM/ANALYSIS: Zeek (behavioral analysis, protocol extraction, anomaly detection)
FULL PCAP: Arkime (full packet capture and indexing)
TRAFFIC ANALYSIS: ntopng (network flow analysis and visualization)
PASSIVE RECON: p0f (OS fingerprinting without probing)
```

---

## 6. Endpoint Detection & Response (EDR)

### 6.1 Tool Comparison Matrix

| Tool | Platform | Best For | Footprint | Response | Maturity |
|---|---|---|---|---|---|
| **Velociraptor** | Cross-platform | Full EDR + IR | Light | Active | Very Mature |
| **Osquery** | Cross-platform | Endpoint visibility | Very light | Query-only | Mature |
| **Sysmon** | Windows | Windows event monitoring | Light | Logging | Very Mature |
| **Auditd** | Linux | Linux audit framework | Minimal | Logging | Mature |
| **OSSEC** | Cross-platform | HIDS + active response | Light | Active | Very Mature |
| **Wazuh Agent** | Cross-platform | SIEM integration | Light | Active | Very Mature |

### 6.2 Velociraptor -- PRIMARY EDR PLATFORM

**Why Velociraptor is DEFONEOS's primary EDR:**

- Created by Mike Cohen (former GRR developer)
- **Hunt at enterprise scale**: query 100,000+ endpoints in seconds
- VQL (Velociraptor Query Language): powerful, flexible query language
- Real-time endpoint monitoring and forensics
- Artifact collection (files, registry, memory, logs)
- Remote response capabilities (kill processes, isolate endpoints)
- Multi-platform: Windows, Linux, macOS
- Server-client architecture with TLS encryption
- Built-in artifact library (500+ pre-built queries)
- Full audit logging of all analyst actions

**Key Capabilities:**
| Capability | Description |
|---|---|
| Hunts | Mass queries across all endpoints |
| Artifacts | Pre-built forensic collection templates |
| Monitoring | Real-time event-driven detection |
| Notebook | Interactive investigation workspace |
| Server Automation | Automated response to detections |
| ACL System | Role-based access for analysts |

**Resource Requirements:**
- Server: 4 vCPU, 8 GB RAM
- Client: <1% CPU, ~20 MB RAM

### 6.3 Osquery -- ENDPOINT VISIBILITY

**Capabilities:**
- Facebook-created (now Linux Foundation)
- SQL-based operating system instrumentation
- 200+ system tables (processes, network, users, etc.)
- Scheduled queries for continuous monitoring
- osqueryd daemon for background collection
- FleetDM for centralized management (open source)
- MITRE ATT&CK coverage mapping

**Best Practice:** Use Osquery for continuous baseline monitoring, Velociraptor for active hunting and response.

### 6.4 Sysmon -- WINDOWS MONITORING

**Capabilities:**
- Microsoft Sysinternals (free)
- Deep Windows event logging:
  - Process creation with command lines
  - Network connections
  - File creation (with hash)
  - Driver loading
  - Image loading (DLLs)
  - Registry modifications
  - Pipe creation/naming
- Integrates with Wazuh and Elastic Security
- Essential for Windows threat detection

### 6.5 Auditd -- LINUX AUDIT FRAMEWORK

**Capabilities:**
- Linux kernel audit subsystem
- System call monitoring
- File watch (access, modification, attribute changes)
- User login/logout tracking
- Custom audit rules
- Integrates with all major SIEMs

### 6.6 DEFONEOS EDR RECOMMENDATION

```
PRIMARY EDR: Velociraptor (hunting, forensics, response)
VISIBILITY: Osquery + FleetDM (continuous monitoring)
WINDOWS: Sysmon (deep Windows telemetry)
LINUX: Auditd (kernel-level auditing)
INTEGRATION: Wazuh Agent (unified SIEM/EDR)
```

---

## 7. Penetration Testing / Red Team

### 7.1 Tool Comparison Matrix

| Tool | Type | License | Best For | Maturity |
|---|---|---|---|---|
| **Kali Linux** | Distro | Various | Complete pentest environment | Very Mature |
| **Metasploit** | Framework | BSD/Commercial | Exploitation, post-exploitation | Very Mature |
| **Sliver** | C2 | GPLv3 | Open-source C2 framework | Mature |
| **Mythic** | C2 | BSD | Modular C2 with plugins | Mature |
| **Havoc** | C2 | GPL | Stealth-focused C2 | Emerging |
| **Cobalt Strike** | C2 | Commercial ($3,500+/yr) | Industry standard red team | Very Mature |
| **Brute Ratel** | C2 | Commercial | Evasion-focused C2 | Mature |

### 7.2 Kali Linux -- COMPLETE PENTEST ENVIRONMENT

**Capabilities:**
- 600+ pre-installed penetration testing tools
- Rolling release with latest tools
- Customizable ISO builds
- ARM support for mobile devices
- Full documentation and training materials
- Industry standard for security professionals

### 7.3 Metasploit Framework -- EXPLOITATION ENGINE

**Capabilities:**
- 5,000+ exploit modules
- 3,000+ auxiliary modules (scanners, fuzzers)
- Meterpreter payload for post-exploitation
- Database integration for host/vuln tracking
- Msfvenom for custom payload generation
- Console, RPC API, and web interface
- Integration with Nmap, Nessus, etc.

### 7.4 Sliver -- PRIMARY OPEN-SOURCE C2

**Why Sliver is DEFONEOS's primary C2:**

- Created by Bishop Fox (respected offensive security firm)
- Written in Go: single static binaries, no dependencies
- Cross-platform: Windows, Linux, macOS (x86 + ARM)
- Completely open source (full code audit possible)
- Multiple C2 channels: mTLS, HTTP(S), DNS, WireGuard, named pipes
- In-memory implants for evasion
- BOF (Beacon Object File) support
- Armory for extension management
- Armory extensions: Rubeus, Seatbelt, SharpUp, etc.

**Sliver Architecture:**
```
Sliver Server (teamserver)
    |
    +-- mTLS Listener (default, encrypted)
    +-- HTTP(S) Listener (web-based C2)
    +-- DNS Listener (DNS tunneling)
    +-- WireGuard Listener (VPN-based C2)
    +-- Named Pipe Listener (LAN-based)
    |
    v
Sliver Implant (multi-platform, multi-arch)
```

### 7.5 Mythic -- MODULAR C2 PLATFORM

**Capabilities:**
- Python-based agent architecture
- Highly modular: Apollo, Poseidon, Athena agents
- Large plugin and extension ecosystem
- Docker-based deployment
- Web interface for operation management

### 7.6 Havoc -- STEALTH-FOCUSED C2

**Capabilities:**
- C/C++ implementation
- Focus on stealth and evasion
- Clean modern interface
- HTTP(S) and SMB communication
- Demon agent (advanced post-exploitation)
- Sleep obfuscation and encryption

### 7.7 C2 Framework Comparison

| Feature | Sliver | Mythic | Havoc | Cobalt Strike |
|---|---|---|---|---|
| License | Open Source | Open Source | Open Source | Commercial |
| Language | Go | Python/Go | C/C++ | Java |
| Comms | mTLS, HTTP(S), DNS, WG | Multiple agents | HTTP(S), SMB | HTTP(S), DNS, SMB |
| Evasion | Good | Good | Excellent | Excellent |
| Multiplayer | Yes | Yes | Yes | Yes |
| BOF Support | Yes | Via Apollo | Yes | Yes |
| Ease of Setup | Easy | Moderate | Moderate | Easy |

### 7.8 DEFONEOS RED TEAM RECOMMENDATION

```
PLATFORM: Kali Linux (complete pentest environment)
EXPLOITATION: Metasploit Framework (primary exploitation toolkit)
PRIMARY C2: Sliver (open-source, professional, multi-protocol)
SECONDARY C2: Mythic (modular, Python agents) + Havoc (stealth)
NOTE: Cobalt Strike is industry standard but $3,500+/year
      Sliver provides 80%+ of Cobalt Strike capability for $0
```

---

## 8. Adversary Emulation

### 8.1 Tool Comparison Matrix

| Tool | Type | License | Best For | Maturity |
|---|---|---|---|---|
| **MITRE Caldera** | Full emulation | Apache 2.0 | Complete adversary emulation | Very Mature |
| **Atomic Red Team** | Test library | MIT | Testable detection rules | Very Mature |
| **PurpleSharp** | Emulation | MIT | Active Directory attacks | Mature |
| **Prelude Operator** | C2 + emulation | Commercial/Free | Continuous validation | Mature |
| **Vectr** | Assessment | Commercial/Free | Purple team assessment tracking | Mature |
| **ATT&CK Navigator** | Visualization | Apache 2.0 | ATT&CK matrix visualization | Very Mature |
| **ATT&CK Workbench** | Management | Apache 2.0 | Custom ATT&CK database | Mature |

### 8.2 MITRE Caldera -- PRIMARY ADVERSARY EMULATION

**Why Caldera is DEFONEOS's primary adversary emulation platform:**

- Developed by MITRE (creators of ATT&CK framework)
- **Full autonomous adversary emulation**
- Built on MITRE ATT&CK framework (native integration)
- Modular plugin architecture
- Asynchronous C2 server
- Multiple agents: Sandcat, Manx, Ragdoll
- Pre-built abilities mapped to ATT&CK techniques
- Custom adversary profiles
- Fact management for operation state
- Full logging and reporting
- **Caldera for OT**: Industrial control system emulation

**Key Components:**
| Component | Description |
|---|---|
| Abilities | Individual ATT&CK techniques (PowerShell, cmd, Python) |
| Adversaries | Collections of abilities representing threat actors |
| Operations | Executed emulation runs |
| Agents | Sandcat (default), Manx (RAT), Ragdoll (Python) |
| Plugins | Stockpile, Response, Fieldmanual, etc. |
| Facts | Variables collected during operations |

**Caldera for OT (Operational Technology):**
- BACnet, DNP3, Modbus, IEC 61850-MMS, Profinet/DCP protocols
- ATT&CK for ICS matrix mapping
- Released in partnership with CISA

### 8.3 Atomic Red Team -- TESTABLE DETECTION RULES

**Capabilities:**
- Library of 1,000+ atomic tests
- Each test maps to specific ATT&CK technique
- Simple to execute (PowerShell, bash, Python scripts)
- Designed for continuous validation
- Integrates with CI/CD pipelines
- Tests detections, not just prevention
- Community-maintained, regularly updated

**Execution Framework:**
```bash
# Install Atomic Red Team
Install-AtomicRedTeam

# Execute a specific test
Invoke-AtomicTest T1059.001  # PowerShell execution

# Run all tests for a technique
Invoke-AtomicTest T1059 -All
```

### 8.4 PurpleSharp -- ACTIVE DIRECTORY EMULATION

**Capabilities:**
- Written in C# (.NET)
- Simulates Active Directory attack techniques
- In-memory execution (no disk artifacts)
- MITRE ATT&CK mapping
- Configurable through JSON files
- No admin privileges required for many techniques

### 8.5 Vectr -- PURPLE TEAM ASSESSMENT TRACKING

**Capabilities:**
- Track red team activities and blue team detections
- ATT&CK technique mapping
- Assessment scoring
- Report generation
- Free tier available (limited assessments)

### 8.6 MITRE ATT&CK Navigator & Workbench

**ATT&CK Navigator:**
- Interactive ATT&CK matrix visualization
- Layer-based overlay (show detection coverage)
- JSON-based layer format
- Export to Excel, SVG, PDF

**ATT&CK Workbench:**
- Create and manage custom ATT&CK datasets
- Extend official ATT&CK with organizational-specific techniques
- Import/export STIX bundles

### 8.7 DEFONEOS ADVERSARY EMULATION RECOMMENDATION

```
PRIMARY: MITRE Caldera (full emulation platform, autonomous operations)
TEST LIBRARY: Atomic Red Team (1,000+ testable detection rules)
AD ATTACKS: PurpleSharp (Active Directory-specific emulation)
TRACKING: Vectr (purple team assessment tracking)
VISUALIZATION: ATT&CK Navigator (coverage mapping)
DATABASE: ATT&CK Workbench (custom ATT&CK extensions)
```

---

## 9. AI-Powered Cyber Tools

### 9.1 Tool Comparison Matrix

| Tool | Type | License | Best For | Maturity |
|---|---|---|---|---|
| **Tracecat** | SOAR | Apache 2.0 | AI-native SOAR | Emerging |
| **PyRIT** | AI Red Team | MIT | AI red teaming (Microsoft) | Mature |
| **Garak** | LLM Scanner | Apache 2.0 | LLM vulnerability scanning (NVIDIA) | Mature |
| **NeMo Guardrails** | Guardrails | Apache 2.0 | LLM safety toolkit (NVIDIA) | Mature |
| **LLM Guard** | Input/Output Filter | MIT | LLM input/output filtering | Mature |
| **Rebuff** | Injection Defense | Apache 2.0 | Prompt injection detection | Alpha |
| **SigmaGen** | Detection Rules | Open | AI-generated Sigma rules | Emerging |
| **Uncoder AI** | Rule Conversion | Commercial | Detection rule conversion | Mature |

### 9.2 Tracecat -- AI-NATIVE SOAR

**Capabilities:**
- Open-source, AI-native security automation platform
- Self-hosted alternative to Tines and Splunk SOAR
- Visual and programmatic workflows
- Case management and lookup tables
- Sandboxed execution (Temporal + nsjail)
- Automated alert triage and enrichment
- Threat intelligence lookups
- Incident investigation automation
- Custom agent-driven remediation

**Architecture:**
```
Tracecat Platform
    |
    +-- Temporal (workflow orchestration)
    +-- nsjail (sandboxed execution)
    +-- Integration Agents (SIEM, EDR, TI feeds)
    +-- AI Engine (LLM-powered analysis)
```

### 9.3 PyRIT -- AI RED TEAMING (Microsoft)

**Capabilities:**
- Developed by Microsoft AI Red Team
- Battle-tested on **100+ products** including Copilot
- Multi-turn attack strategies: Crescendo, TAP, Skeleton Key
- Multi-modal: text, audio, image, video, file conversions
- Scoring subsystems: true/false, Likert scale, classification
- Supports: OpenAI, Azure, Anthropic, Google, HuggingFace
- Python library with composable architecture
- CI/CD pipeline integration
- Maps findings to OWASP LLM Top 10

**Attack Orchestration:**
```python
from pyrit.orchestrator import PromptSendingOrchestrator
from pyrit.prompt_target import AzureOpenAITarget

# Define target
aoai_target = AzureOpenAITarget(
    deployment_name="gpt-4",
    endpoint="https://your-resource.openai.azure.com/",
    api_key="your-api-key"
)

# Run attacks
orchestrator = PromptSendingOrchestrator(prompt_target=aoai_target)
responses = await orchestrator.send_prompts_async(prompt_list=attacks)
```

### 9.4 Garak -- LLM VULNERABILITY SCANNER (NVIDIA)

**Capabilities:**
- "Nmap/Metasploit for LLMs"
- **150+ probe categories**, 3,000+ prompts/templates
- Detects: prompt injection, jailbreaks, data leakage, toxicity, hallucination, XSS
- Three-component architecture: Generators, Probes, Detectors
- Supports: OpenAI, HuggingFace, AWS Bedrock, local models
- OWASP LLM Top 10 mapping
- Used by Microsoft, Trend Micro, Cisco, NVIDIA

**Scan Example:**
```bash
# Install
garak --model_type openai --model_name gpt-4 --probes all

# Scan specific vulnerabilities
garak --model_type huggingface --model_name meta-llama/Llama-2-7b \
      --probes promptinject,dan,encoding,leakreplay
```

### 9.5 NeMo Guardrails -- LLM SAFETY TOOLKIT (NVIDIA)

**Capabilities:**
- Open-source toolkit for LLM guardrails
- 6.5K GitHub stars, Apache 2.0 license
- **Five rail types**: Input, Dialog, Retrieval, Execution, Output
- Colang language for defining conversation flows
- Provider support: OpenAI, Azure, Anthropic, HuggingFace, NVIDIA NIM
- Framework support: LangChain, LangGraph
- Jailbreak detection, prompt injection filtering, content moderation
- Dialog management across multiple conversation turns
- Deployment: Python API, FastAPI server, Docker, NeMo Microservice

### 9.6 LLM Guard -- INPUT/OUTPUT FILTERING

**Capabilities:**
- Open-source by Protect AI
- Input scanning: prompt injection, PII, toxicity
- Output scanning: sensitive data, harmful content
- Anonymization capabilities
- Integration with major LLM providers
- Custom scanner development

### 9.7 Rebuff -- PROMPT INJECTION DEFENSE

**Capabilities:**
- Multi-layer defense against prompt injection
- Heuristics filtering
- LLM-based detection
- VectorDB similarity matching (learns from attacks)
- Canary token detection
- Apache 2.0 license

**Status:** Alpha stage - suitable for research and development

### 9.8 DEFONEOS AI SECURITY RECOMMENDATION

```
SOAR: Tracecat (AI-native automation, self-hosted)
AI RED TEAM: PyRIT (Microsoft, 100+ products tested)
LLM SCANNER: Garak (NVIDIA, 150+ probe categories)
GUARDRAILS: NeMo Guardrails (NVIDIA, five rail types)
INPUT/OUTPUT FILTER: LLM Guard (Protect AI)
PROMPT DEFENSE: Rebuff (multi-layer, learning-based)
```

---

## 10. The DEFONEOS Cyber Defense Stack Architecture

### 10.1 High-Level Architecture

```
+-----------------------------------------------------------------------------+
|                           DEFONEOS CYBER DEFENSE MODULE                      |
+-----------------------------------------------------------------------------+
|                                                                              |
|  +------------------+     +------------------+     +------------------+      |
|  |   MCP ORCHESTRATOR   |     |   AI REASONING       |     |   PLAYBOOK ENGINE    |      |
|  |   (OpenFang Agent)   |     |   (LLM-powered)      |     |   (Tracecat SOAR)    |      |
|  +------------------+     +------------------+     +------------------+      |
|          |                         |                         |               |
+----------|-------------------------|-------------------------|---------------+
           |                         |                         |
+----------v-------------------------v-------------------------v---------------+
|                                                                              |
|  +------------------+  +------------------+  +------------------+           |
|  | SIEM / XDR       |  | THREAT INTEL     |  | VULN MANAGEMENT  |           |
|  | Wazuh            |  | MISP + OpenCTI   |  | Greenbone + Nuc..|           |
|  | Elastic Security |  | STIX/TAXII       |  | ZAP + WPScan     |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                              |
|  +------------------+  +------------------+  +------------------+           |
|  | NETWORK MONITOR  |  | EDR / ENDPOINT   |  | AI SECURITY      |           |
|  | Suricata + Zeek  |  | Velociraptor     |  | PyRIT + Garak    |           |
|  | Arkime + ntopng  |  | Osquery + Sysmon |  | NeMo Guardrails  |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                              |
|  +------------------+  +------------------+  +------------------+           |
|  | RED TEAM         |  | ADVERSARY EMUL.  |  | AUTOMATION       |           |
|  | Kali + Metasploit|  | MITRE Caldera    |  | Sigma Rules      |           |
|  | Sliver C2        |  | Atomic Red Team  |  | Shuffle/Tracecat |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                              |
+------------------------------------------------------------------------------+
|                                                                              |
|  +------------------+  +------------------+  +------------------+           |
|  | DATA LAYER       |  | MESSAGING        |  | STORAGE          |           |
|  | Kafka / RabbitMQ |  | Redis Streams    |  | OpenSearch/CH    |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 10.2 Data Flow Architecture

```
ALERT GENERATION                           ALERT PROCESSING                        RESPONSE
+-----------------------------------+     +-------------------------------+     +------------------+
| Endpoints (Wazuh Agents)          |     | Wazuh Server                  |     | Active Response  |
| - Log collection                  |---->| - Rule correlation            |---->| - Firewall block |
| - File integrity monitoring       |     | - Threat intelligence lookup  |     | - Process kill   |
| - Vulnerability detection         |     | - MITRE ATT&CK tagging        |     | - Account lock   |
| - Malware detection               |     | - Alert generation            |     | - Quarantine     |
+-----------------------------------+     +-------------------------------+     +------------------+
                                                     |
                              +----------------------+----------------------+
                              |                      |                      |
                              v                      v                      v
                       +-------------+       +-------------+       +-------------+
                       |   SIEM      |       |  THREAT     |       |   SOAR      |
                       |  (Wazuh)    |       |  INTEL      |       |  (Tracecat) |
                       +-------------+       +-------------+       +-------------+
                              |                      |                      |
                              +----------+-----------+----------+-----------+
                                         |                      |
                                         v                      v
                                  +-------------+       +-------------+
                                  |   CASE      |       |  INCIDENT   |
                                  |  MANAGEMENT |       |  RESPONSE   |
                                  +-------------+       +-------------+
```

### 10.3 Automated Incident Response Pipeline

```
+------------------+    +------------------+    +------------------+    +------------------+    +------------------+
|    DETECT        | -> |    TRIAGE        | -> |  INVESTIGATE     | -> |    RESPOND       | -> |     REPORT       |
+------------------+    +------------------+    +------------------+    +------------------+    +------------------+
|                  |    |                  |    |                  |    |                  |    |                  |
| Suricata IDS     |    | Wazuh Correlation|    | Velociraptor     |    | Active Response  |    | Case Ticket      |
| Wazuh Rules      |    | Enrichment       |    | Forensic Hunt    |    | Firewall Block   |    | Timeline         |
| Sigma Rules      |    | Priority Score   |    | Memory Analysis  |    | Process Kill     |    | MITRE Mapping    |
| Anomaly Detection|    | False Positive   |    | Network PCAP     |    | Account Disable  |    | IOC Extraction   |
| Threat Intel     |    | Check            |    | Log Correlation  |    | Host Isolation   |    | Lessons Learned  |
|                  |    |                  |    |                  |    |                  |    |                  |
| Output: Raw Alert|    | Output: Scored   |    | Output: Confirmed|    | Output: Contained|    | Output: Report   |
|                  |    |        Alert     |    |        Incident  |    |        Threat    |    |        Closed    |
+------------------+    +------------------+    +------------------+    +------------------+    +------------------+
      < 1 min                < 2 min                < 15 min               < 5 min                < 30 min
```

### 10.4 Integration Points

| Source Tool | Target Tool | Integration Method | Data Exchanged |
|---|---|---|---|
| Suricata IDS | Wazuh SIEM | EVE JSON + Filebeat | IDS alerts, protocol data |
| Zeek NSM | Wazuh SIEM | JSON logs + Filebeat | Network metadata, files |
| Arkime PCAP | Wazuh SIEM | SPI data export | Full packet captures |
| Velociraptor EDR | Wazuh SIEM | REST API + syslog | Endpoint telemetry, hunts |
| Osquery | Wazuh SIEM | osqueryd + log shipping | Scheduled query results |
| OpenVAS | Wazuh SIEM | XML report import | Vulnerability scan results |
| Nuclei | Wazuh SIEM | JSON output | Vulnerability findings |
| MISP | Wazuh SIEM | MISP API + custom rules | IOC threat intelligence |
| OpenCTI | Wazuh SIEM | STIX/TAXII feeds | Enriched threat context |
| MISP | OpenCTI | STIX 2.1 connector | Shared threat intelligence |
| Atomic Red Team | Wazuh SIEM | Execution logs + alerts | Detection validation |
| Caldera | Wazuh SIEM | Operation logs | Emulation results |
| PyRIT | Tracecat SOAR | API + webhook | AI security scan results |
| Garak | Tracecat SOAR | JSON report import | LLM vulnerability data |
| Sigma Rules | Wazuh SIEM | Sigma + conversion | Detection rules |
| STIX Feeds | MISP/OpenCTI | TAXII server | Threat intelligence |
| Wazuh Alerts | Tracecat SOAR | Webhook/API | Incident response triggers |
| Tracecat SOAR | Velociraptor | REST API | Automated response actions |

---

## 11. MCP Server Designs for Each Capability

### 11.1 MCP Server Overview

Each MCP server provides:
- **Tools**: Actionable functions (run scans, query data, block IPs)
- **Resources**: Structured data (alerts, IOCs, vulnerabilities)
- **Prompts**: Pre-built templates for common operations

### 11.2 SIEM MCP Server

```yaml
name: defoneos-siem-mcp
version: 1.0.0
capabilities:
  tools:
    - name: search_alerts
      description: Search Wazuh/Elastic alerts by time range, severity, rule
      parameters:
        - index: alert_index
        - time_range: "last_1h|last_24h|last_7d|custom"
        - severity: "low|medium|high|critical"
        - mitre_technique: "T1059|T1190|..."
    
    - name: get_alert_details
      description: Get full alert details including MITRE mapping
      parameters:
        - alert_id: string
    
    - name: create_detection_rule
      description: Create a new detection rule from Sigma or custom
      parameters:
        - rule_format: "sigma|wazuh|elastic"
        - rule_content: string
        - enabled: boolean
    
    - name: get_dashboard
      description: Get security dashboard metrics
      parameters:
        - dashboard_type: "overview|threats|compliance|endpoint"
  
  resources:
    - alerts://recent
    - alerts://critical
    - rules://active
    - mitre://coverage
    - compliance://status
  
  prompts:
    - threat_hunt: "Analyze recent alerts for signs of [technique]"
    - incident_response: "Guide me through responding to [alert_type]"
    - rule_optimization: "Review and suggest improvements for rule [rule_id]"
```

### 11.3 Threat Intelligence MCP Server

```yaml
name: defoneos-threatintel-mcp
version: 1.0.0
capabilities:
  tools:
    - name: search_iocs
      description: Search IOCs in MISP and OpenCTI
      parameters:
        - indicator: "ip|domain|hash|url"
        - source: "misp|opencti|all"
    
    - name: enrich_indicator
      description: Enrich an indicator with threat context
      parameters:
        - indicator_value: string
        - enrich_sources: ["virustotal","shodan","sandbox"]
    
    - name: add_ioc
      description: Add a new IOC to MISP
      parameters:
        - ioc_type: "ip-dst|domain|filename|md5|sha256"
        - ioc_value: string
        - threat_level: "1|2|3|4"
        - tags: ["apt","ransomware","c2"]
    
    - name: get_threat_report
      description: Generate threat report from OpenCTI
      parameters:
        - threat_actor: string
        - time_range: string
  
  resources:
    - iocs://recent
    - actors://known
    - campaigns://active
    - feeds://status
  
  prompts:
    - ioc_investigation: "Investigate indicator [value] for malicious activity"
    - threat_profile: "Build a threat profile for [actor_name]"
    - intel_report: "Generate a threat intelligence report for [topic]"
```

### 11.4 Vulnerability Management MCP Server

```yaml
name: defoneos-vulnmgmt-mcp
version: 1.0.0
capabilities:
  tools:
    - name: start_scan
      description: Start vulnerability scan with OpenVAS or Nuclei
      parameters:
        - scanner: "openvas|nuclei"
        - target: string
        - scan_profile: "full|fast|web|creds"
    
    - name: get_scan_results
      description: Get vulnerability scan results
      parameters:
        - scan_id: string
        - severity_filter: "critical|high|medium|low|all"
    
    - name: get_asset_vulns
      description: Get vulnerabilities for a specific asset
      parameters:
        - asset_ip: string
        - cve_filter: string
    
    - name: generate_remediation_report
      description: Generate prioritized remediation report
      parameters:
        - scan_id: string
        - priority: "critical_first|cvss|exploit_available"
  
  resources:
    - scans://recent
    - assets://inventory
    - vulns://critical
    - remediation://queue
  
  prompts:
    - vulnerability_assessment: "Assess vulnerabilities on [asset]"
    - remediation_plan: "Create remediation plan for [scan_id]"
    - exploit_check: "Check if [cve] has known exploits"
```

### 11.5 Network Monitoring MCP Server

```yaml
name: defoneos-network-mcp
version: 1.0.0
capabilities:
  tools:
    - name: get_ids_alerts
      description: Get Suricata/Snort IDS alerts
      parameters:
        - time_range: string
        - category: string
    
    - name: search_pcap
      description: Search Arkime packet captures
      parameters:
        - query: string
        - time_range: string
    
    - name: get_flow_data
      description: Get network flow statistics from Zeek/ntopng
      parameters:
        - src_ip: string
        - dst_ip: string
        - time_range: string
    
    - name: analyze_traffic
      description: Analyze network traffic for anomalies
      parameters:
        - target_subnet: string
        - analysis_type: "beaconing|exfiltration|c2|scan"
  
  resources:
    - alerts://ids
    - flows://active
    - pcap://sessions
    - stats://bandwidth
  
  prompts:
    - traffic_analysis: "Analyze traffic patterns for [subnet]"
    - hunt_c2: "Search for C2 beaconing in network data"
    - pcap_investigation: "Investigate PCAP session [session_id]"
```

### 11.6 EDR MCP Server

```yaml
name: defoneos-edr-mcp
version: 1.0.0
capabilities:
  tools:
    - name: hunt_endpoints
      description: Run Velociraptor hunt across endpoints
      parameters:
        - artifact: string
        - target_scope: "all|group|hostname"
        - parameters: object
    
    - name: get_endpoint_details
      description: Get detailed endpoint information
      parameters:
        - endpoint_id: string
    
    - name: isolate_endpoint
      description: Isolate endpoint from network
      parameters:
        - endpoint_id: string
        - reason: string
    
    - name: kill_process
      description: Kill a process on an endpoint
      parameters:
        - endpoint_id: string
        - pid: number
    
    - name: collect_forensics
      description: Collect forensic artifacts from endpoint
      parameters:
        - endpoint_id: string
        - artifacts: ["memory","disk","logs","registry"]
  
  resources:
    - endpoints://online
    - endpoints://alerts
    - hunts://active
    - artifacts://collected
  
  prompts:
    - endpoint_hunt: "Hunt for [artifact] on endpoints"
    - incident_response: "Respond to alert on [endpoint_id]"
    - forensic_collection: "Collect forensics from [endpoint]"
```

### 11.7 Red Team MCP Server

```yaml
name: defoneos-redteam-mcp
version: 1.0.0
capabilities:
  tools:
    - name: start_operation
      description: Start a red team operation with Sliver/Caldera
      parameters:
        - framework: "sliver|caldera|metasploit"
        - target: string
        - profile: string
    
    - name: generate_payload
      description: Generate a payload/implant
      parameters:
        - framework: string
        - format: "exe|dll|shellcode|ps1"
        - architecture: "x64|x86|arm64"
    
    - name: run_atomic_test
      description: Execute Atomic Red Team test
      parameters:
        - technique: string
        - test_number: number
        - cleanup: boolean
    
    - name: get_operation_status
      description: Get status of active operations
      parameters:
        - operation_id: string
  
  resources:
    - operations://active
    - implants://available
    - sessions://active
    - attck://coverage
  
  prompts:
    - adversary_emulation: "Emulate [apt_group] TTPs"
    - attack_planning: "Plan attack path to [objective]"
    - detection_validation: "Validate detections for [technique]"
```

### 11.8 AI Security MCP Server

```yaml
name: defoneos-aisecurity-mcp
version: 1.0.0
capabilities:
  tools:
    - name: scan_llm
      description: Scan LLM with Garak for vulnerabilities
      parameters:
        - target_endpoint: string
        - model_type: string
        - probe_categories: [string]
    
    - name: red_team_ai
      description: Run PyRIT AI red team assessment
      parameters:
        - target: string
        - attack_types: [string]
        - duration: number
    
    - name: apply_guardrails
      description: Apply NeMo Guardrails configuration
      parameters:
        - config_path: string
        - rail_types: [string]
    
    - name: check_prompt_safety
      description: Check prompt for injection attempts
      parameters:
        - prompt: string
        - model: string
  
  resources:
    - scans://llm
    - guardrails://active
    - attacks://patterns
    - models://inventory
  
  prompts:
    - llm_security_assessment: "Assess security of [llm_endpoint]"
    - guardrail_config: "Configure guardrails for [use_case]"
    - injection_test: "Test [prompt] for injection vulnerabilities"
```

---

## 12. Cost Comparison

### 12.1 Commercial Stack Pricing (2025)

| Tool Category | Commercial Tool | Annual Cost (1,000 endpoints) |
|---|---|---|
| SIEM | Splunk Enterprise Security | $400,000 - $800,000 |
| SIEM (alternative) | IBM QRadar | $150,000 - $400,000 |
| EDR/XDR | CrowdStrike Falcon Enterprise | $185,000 |
| EDR (alternative) | SentinelOne Complete | $180,000 |
| Threat Intel | Mandiant Threat Intel | $100,000 - $300,000 |
| Threat Intel (alt) | Recorded Future | $150,000 - $500,000 |
| Vulnerability Mgmt | Tenable Vulnerability Management | $35,000 (100 assets) |
| Vulnerability (alt) | Rapid7 InsightVM | $22,000 (1,000 assets) |
| Network Monitoring | Corelight (Zeek commercial) | $50,000 - $150,000 |
| SOAR | Palo Alto XSOAR | $100,000 - $300,000 |
| SOAR (alt) | Splunk SOAR | $50,000 - $150,000 |
| Red Team C2 | Cobalt Strike | $3,500 - $6,000 |
| AI Security | Protect AI (commercial) | $50,000 - $200,000 |
| **TOTAL** | | **$1.2M - $2.2M/year** |

### 12.2 DEFONEOS Open Source Stack Cost

| Component | Software Cost | Infrastructure (est.) |
|---|---|---|
| Wazuh SIEM/XDR | $0 | $500-2,000/mo |
| MISP Threat Intel | $0 | $200-500/mo |
| OpenCTI | $0 | $300-800/mo |
| Greenbone OpenVAS | $0 | $200-500/mo |
| Suricata IDS | $0 | $300-1,000/mo |
| Zeek NSM | $0 | $200-500/mo |
| Arkime PCAP | $0 | $500-2,000/mo |
| Velociraptor EDR | $0 | $200-500/mo |
| Osquery + FleetDM | $0 | $100-300/mo |
| MITRE Caldera | $0 | $100-200/mo |
| Sliver C2 | $0 | $100-200/mo |
| Tracecat SOAR | $0 | $200-500/mo |
| PyRIT + Garak | $0 | $100-300/mo (API costs) |
| NeMo Guardrails | $0 | $200-500/mo |
| **TOTAL** | **$0 SOFTWARE** | **$3,200 - $10,300/mo** |

### 12.3 Cost Comparison Summary

| Metric | Commercial Stack | DEFONEOS OSS Stack | Savings |
|---|---|---|---|
| **Software Licensing** | $1,200,000 - $2,200,000/yr | $0/yr | **100%** |
| **Infrastructure** | $200,000 - $500,000/yr | $38,400 - $123,600/yr | ~70% |
| **Personnel (required expertise)** | $800,000 - $2,000,000/yr | $400,000 - $1,200,000/yr | ~40% |
| **Support/Maintenance** | Included in license | $50,000 - $200,000/yr | Variable |
| **TOTAL COST OF OWNERSHIP** | **$2.2M - $4.7M/yr** | **$490K - $1.5M/yr** | **~70-80%** |

### 12.4 What's the Catch?

**Open source cybersecurity tools come with real trade-offs:**

| Challenge | Impact | Mitigation |
|---|---|---|
| **No vendor support** | Must self-troubleshoot | Build internal expertise; community forums; paid support contracts available |
| **Steeper learning curve** | Longer time to value | Invest in training; phased deployment; hire experienced staff |
| **Integration complexity** | Must build connections yourself | Use pre-built integrations; MCP servers; API-first design |
| **Maintenance burden** | Internal team must patch/update | Automated update pipelines; infrastructure as code |
| **Expertise required** | Need security engineers on staff | Training programs; certification; community engagement |
| **No guarantees** | No SLA or warranty | Build redundancy; test failover; document procedures |
| **Tool sprawl** | Multiple UIs and interfaces | Centralized dashboard; SOAR orchestration; unified alerting |

### 12.5 How to Address the Catch

1. **Invest in people**: Hire 2-3 experienced security engineers with open-source tool expertise
2. **Community engagement**: Active participation in tool-specific communities (Wazuh, MISP, Suricata)
3. **Phased deployment**: Start with core tools (Wazuh + Suricata), add capabilities incrementally
4. **Documentation**: Build internal runbooks and SOPs for every tool
5. **Automation**: Infrastructure as Code (Terraform/Ansible) for deployment and updates
6. **Training budget**: Allocate $20-50K/year for team training and certifications
7. **Backup support**: Purchase commercial support for critical components if needed (e.g., Elastic Support)

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4) -- Core Monitoring
- [ ] Deploy Wazuh SIEM (server + agents)
- [ ] Deploy Suricata IDS on network perimeter
- [ ] Deploy Sysmon (Windows) + Auditd (Linux)
- [ ] Basic alerting and email notifications
- **Outcome:** Core visibility into endpoints and network

### Phase 2: Intelligence (Weeks 5-8) -- Threat Context
- [ ] Deploy MISP threat intelligence platform
- [ ] Integrate MISP with Wazuh for IOC matching
- [ ] Deploy OpenCTI for knowledge management
- [ ] Configure threat intelligence feeds
- **Outcome:** Threat-informed detection

### Phase 3: Assessment (Weeks 9-12) -- Vulnerability Management
- [ ] Deploy Greenbone OpenVAS
- [ ] Schedule vulnerability scans
- [ ] Integrate Nuclei for targeted scanning
- [ ] Deploy OWASP ZAP for web apps
- **Outcome:** Continuous vulnerability assessment

### Phase 4: Response (Weeks 13-16) -- Active Defense
- [ ] Deploy Velociraptor EDR
- [ ] Deploy Osquery + FleetDM
- [ ] Configure Wazuh active response
- [ ] Build initial detection rules (Sigma)
- **Outcome:** Endpoint detection and response capability

### Phase 5: Validation (Weeks 17-20) -- Purple Team
- [ ] Deploy MITRE Caldera
- [ ] Execute Atomic Red Team tests
- [ ] Validate detection coverage
- [ ] Deploy Sliver C2 for authorized testing
- **Outcome:** Validated detection capability

### Phase 6: Orchestration (Weeks 21-24) -- Automation
- [ ] Deploy Tracecat SOAR
- [ ] Build playbooks for common incidents
- [ ] Integrate AI tools (PyRIT, Garak)
- [ ] Build MCP servers for each capability
- **Outcome:** Automated incident response

### Phase 7: AI Security (Weeks 25-28) -- AI Defense
- [ ] Deploy NeMo Guardrails
- [ ] Deploy LLM Guard
- [ ] Integrate PyRIT for AI red teaming
- [ ] Integrate Garak for LLM scanning
- **Outcome:** AI application security

---

## 14. Appendices

### Appendix A: Hardware Requirements Summary

| Component | Minimum | Recommended | Enterprise |
|---|---|---|---|
| Wazuh Server | 8 vCPU, 8 GB RAM | 16 vCPU, 32 GB RAM | 32+ vCPU, 64+ GB RAM |
| Wazuh Indexer | 8 vCPU, 16 GB RAM | 16 vCPU, 32 GB RAM | Multi-node cluster |
| MISP Server | 4 vCPU, 8 GB RAM | 8 vCPU, 16 GB RAM | 16 vCPU, 32 GB RAM |
| OpenCTI | 8 vCPU, 16 GB RAM | 16 vCPU, 32 GB RAM | 32 vCPU, 64 GB RAM |
| Greenbone OpenVAS | 4 vCPU, 8 GB RAM | 8 vCPU, 16 GB RAM | 16 vCPU, 32 GB RAM |
| Suricata Sensor | 4 vCPU, 8 GB RAM | 16 vCPU, 32 GB RAM | 32 vCPU, 64 GB RAM + DPDK |
| Velociraptor Server | 4 vCPU, 8 GB RAM | 8 vCPU, 16 GB RAM | 16 vCPU, 32 GB RAM |
| TOTAL (Single Node) | 32 vCPU, 64 GB RAM | 64 vCPU, 128 GB RAM | 128+ vCPU, 256+ GB RAM |

### Appendix B: Reference Architectures

**Small Deployment (< 500 endpoints):**
```
Single physical/virtual server:
- 32 vCPU, 64 GB RAM, 2 TB SSD
- All components containerized (Docker Compose)
- Wazuh + MISP + Suricata + OpenVAS + Velociraptor
```

**Medium Deployment (500-5,000 endpoints):**
```
Multiple servers:
- Server 1: Wazuh SIEM (16 vCPU, 32 GB)
- Server 2: OpenSearch Indexer (16 vCPU, 64 GB)
- Server 3: MISP + OpenCTI (16 vCPU, 32 GB)
- Server 4: Network Sensors (Suricata + Zeek) (16 vCPU, 32 GB)
- Server 5: VulnMgmt + EDR (16 vCPU, 32 GB)
```

**Large Deployment (5,000-50,000+ endpoints):**
```
Kubernetes cluster or dedicated servers:
- Wazuh cluster (3+ servers)
- OpenSearch cluster (3+ nodes)
- Multiple network sensors
- Dedicated MISP + OpenCTI servers
- Distributed Velociraptor deployment
```

### Appendix C: Key URLs and Resources

| Tool | URL | Documentation |
|---|---|---|
| Wazuh | https://wazuh.com | https://documentation.wazuh.com |
| MISP | https://www.misp-project.org | https://www.circl.lu/doc/misp/ |
| OpenCTI | https://filigran.io | https://docs.opencti.io |
| Suricata | https://suricata.io | https://docs.suricata.io |
| Zeek | https://zeek.org | https://docs.zeek.org |
| Velociraptor | https://docs.velociraptor.app | https://docs.velociraptor.app |
| Osquery | https://osquery.io | https://osquery.readthedocs.io |
| Greenbone | https://www.greenbone.net | https://greenbone.github.io/docs/ |
| Nuclei | https://projectdiscovery.io | https://docs.projectdiscovery.io |
| MITRE Caldera | https://caldera.mitre.org | https://caldera.readthedocs.io |
| Atomic Red Team | https://atomicredteam.io | https://github.com/redcanaryco |
| Sliver | https://sliver.sh | https://sliver.sh/docs/ |
| PyRIT | https://github.com/Azure/PyRIT | https://pyrit.readthedocs.io |
| Garak | https://garak.ai | https://docs.garak.ai |
| Tracecat | https://tracecat.com | https://docs.tracecat.com |
| NeMo Guardrails | https://github.com/NVIDIA/NeMo-Guardrails | https://docs.nvidia.com/nemo/ |
| Sigma | https://sigmahq.io | https://docs.sigmahq.io |
| STIX/TAXII | https://oasis-open.github.io/cti-documentation | MITRE/CTID |

### Appendix D: Detection Rule Sources

| Source | Type | URL |
|---|---|---|
| Sigma Rules | Generic detection rules | https://github.com/SigmaHQ/sigma |
| Atomic Red Team | Testable detection rules | https://github.com/redcanaryco/atomic-red-team |
| Splunk Threat Research | ES detection rules | https://research.splunk.com/detections |
| Elastic Detection Rules | Elastic rules | https://github.com/elastic/detection-rules |
| Wazuh Rules | Wazuh-specific rules | https://github.com/wazuh/wazuh-ruleset |
| Emerging Threats | IDS signatures | https://rules.emergingthreats.net |
| Abuse.ch Feeds | Threat intel feeds | https://abuse.ch |

### Appendix E: Training Resources

| Resource | Cost | URL |
|---|---|---|
| Wazuh Documentation | Free | https://documentation.wazuh.com |
| Security Onion Docs | Free | https://docs.securityonion.net |
| Suricata Training | Free/Paid | https://suricata.io/training |
| SANS Cyber Aces | Free | https://tutorials.cyberaces.org |
| LetsDefend Blue Team | Free/Paid | https://letsdefend.io |
| Blue Team Labs Online | Free/Paid | https://blueteamlabs.online |
| AttackIQ Academy | Free | https://academy.attackiq.com |
| MITRE ATT&CK Training | Free | https://attack.mitre.org/resources/training |

---

> **END OF DOCUMENT**
>
> This arsenal represents the state of open-source cyber defense as of 2025. All tools listed are actively maintained with strong community support. DEFONEOS should evaluate each tool against specific mission requirements and conduct proof-of-concept deployments before full-scale implementation.
>
> **Remember:** The tools are free. The expertise to run them effectively is not. Invest in your people.

---

*Built for DEFONEOS by the Open-Source Cyber Defense Research Initiative*
*Zero cost. Maximum capability. Open forever.*
