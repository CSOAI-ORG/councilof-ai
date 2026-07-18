# Complete MCP Ecosystem Inventory

> **Research Date:** June 8, 2026
> **Researcher:** SOV3 Intelligence Unit
> **Scope:** Every MCP server, marketplace, tool, integration, and competitor offering
> **Sources:** MCP.so, Glama.ai, Smithery.ai, PulseMCP, Cursor Directory, GitHub, Security Advisories, Competitor Analysis

---

## Executive Summary

The Model Context Protocol (MCP) ecosystem has exploded from zero to an estimated **35,000+ unique MCP servers** across all marketplaces in under 18 months since Anthropic's November 2024 launch. The ecosystem spans **6 major marketplaces**, **2,000+ GitHub contributors**, and **50,000+ developers** actively using MCP integrations. However, the space is fraught with **critical security vulnerabilities** -- over **30 CVEs** have been assigned, including multiple RCE vulnerabilities affecting popular platforms. **No dedicated AI governance MCP server category exists** -- this is SOV3's primary opportunity.

---

## Part 1: MCP Marketplace Inventory

### Marketplace: MCP.so
**URL:** https://mcp.so
**Server Count:** 21,956 MCP Servers collected
**Clients Listed:** Multiple (HyperChat, Y-Gui, DeepChat, Cherry Studio, VS Code, Cline, Cursor, ChatWise, Windsurf, 5ire, Continue)
**Hosted MCP Servers:** Yes (featured section)

**Top Categories (by server count):**
| Category | Count |
|----------|-------|
| Developer Tools | 8,799 |
| Research And Data | 5,148 |
| Cloud Platforms | 636 |
| Communication | 119 |
| Finance | 74 |
| Browser Automation | 84 |
| Security | 84 |
| OS Automation | 61 |
| Databases | 54 |
| Monitoring | 54 |
| Cloud Storage | 57 |
| Entertainment And Media | 47 |
| Knowledge And Memory | 41 |
| File Systems | 34 |
| Location Services | 32 |
| Calendar Management | 23 |
| AI Chatbot | 5 |
| Virtualization | 5 |
| Customer Data Platforms | 6 |
| Database | 1 |
| Official Servers | 2 |

**Notable Featured Servers:**
- EdgeOne Pages MCP (Tencent)
- AlphaVantage (stock market data)
- Zhipu Web Search
- MCP Advisor
- MiniMax MCP (TTS, image/video gen)
- Playwright MCP (Microsoft)
- Baidu Map MCP
- Amap Maps MCP

**Key Features:** Submit portal, category browsing, client directory, hosted server discovery, official server badges, tags system

---

### Marketplace: Glama.ai
**URL:** https://glama.ai/mcp
**Server Count:** 32,490 MCP servers + 4,962 MCP connectors = 37,452 total endpoints
**Tools Indexed:** 228,120 MCP tools
**Developers:** 50,000+
**Monthly Tool Calls:** 1,000,000+
**Last Indexed:** June 8, 2026

**Key Differentiators:**
- Superset of the official MCP Registry (registry.modelcontextprotocol.io)
- Maintainer-verified servers
- Continuous rebuild and quality scoring
- Browser-based MCP Inspector (ephemeral sandbox testing)
- Two models: Open-source (free to browse, paid to host) + Hosted connectors (free to use)
- Quality and safety scoring for every server
- Gateway for auth, logs, and access control

**Notable Feature:** Glama MCP Inspector -- test any MCP server in browser without installation

---

### Marketplace: Smithery.ai
**URL:** https://smithery.ai
**Server Count:** 2,880+ MCP servers (indexed)
**Daily Tool Calls:** 18,000+
**Active Users:** 10,000+
**Founders:** Henry Mao & Arjun Kumar

**Key Differentiators:**
- **CLI Installer**: `@smithery/cli` -- `npx smithery mcp add <server>`
- Open-source CLI and TypeScript SDK
- OAuth credential handling via agent.pw
- Skill registry with upvote/downvote system
- Server publishing with `smithery.yaml` config
- GitHub integration, server ranking
- Cloud hosting option for MCP servers
- MCP Hackathon events (March 2025, SF)

**CLI Commands:**
```
smithery mcp search [term]       # Search registry
smithery mcp add <url>            # Add MCP server
smithery mcp list                 # List connections
smithery mcp publish <url>        # Publish server
smithery tool list                # List tools
smithery tool call <conn> <tool>  # Call a tool
```

**Comparison with MCP.so:**
| Feature | Smithery.ai | MCP.so |
|---------|-------------|--------|
| MCP Servers | 2,880+ | 21,956 |
| Deployment | Full (CLI, Docker) | Coming soon |
| Hosting | Yes | Yes |
| Focus | Accelerated agentic AI | Discovery & categorization |
| CLI Installer | Yes | No |

---

### Marketplace: PulseMCP
**URL:** https://www.pulsemcp.com
**Server Count:** 16,822 servers (updated daily)
**Newsletter:** "The Agentic Loop"
**Classification:** Official vs Community servers

**Key Differentiators:**
- Daily updates to server directory
- Traffic/visitor estimates per server (e.g., Playwright: 4.7M/week)
- Classification system (official/community)
- Trending searches (Figma, Notion, GitHub, Supabase, Jira, Slack)
- MCP Apps directory separate from servers
- Blog/posts section with MCP guides

**Top Servers by Traffic:**
| Server | Provider | Est. Weekly Visitors |
|--------|----------|---------------------|
| Playwright Browser Automation | Microsoft | 4.7M |
| Chrome DevTools | Google | 2.9M |
| Storybook | Storybook | 1.0M |
| Context7 (Documentation DB) | Upstash | 882K |
| IDA Pro MCP Plugin | saileaxh | 609K |
| Searchcode | searchcode | 344K |

---

### Marketplace: Cursor Directory
**URL:** https://cursor.directory
**Type:** Cursor IDE plugins (including MCP servers)
**Developer Base:** 82.1k+ developers

**Trending MCP-Related Plugins:**
| Rank | Plugin | Downloads |
|------|--------|-----------|
| 6 | Excalidraw Architect MCP | 357 |
| 7 | Outlook Assistant (MCP) | 290 |
| 12 | MCP Mermaid | 107 |
| 13 | Academic Research MCP Server | 45 |
| 14 | Code Graph RAG MCP | 42 |
| 15 | Wireshark-MCP | 70 |

**Note:** Cursor Directory is primarily for Cursor IDE rules/plugins, not exclusively MCP servers. MCP servers are a growing subset.

---

### GitHub Curated Lists

#### punkpeye/awesome-mcp-servers
**URL:** https://github.com/punkpeye/awesome-mcp-servers
**Stars:** 88.7k
**Forks:** 11.2k
**Contributors:** 1,976
**Commits:** 7,655
**Pull Requests:** 1,200+
**Web Directory:** https://glama.ai/mcp/servers (Glama powers the web view)

**Internationalization:** 7 language variants (English, Chinese, Japanese, Korean, Portuguese-BR, Thai, Persian)

**Categories in README:**
- Browser Automation, Cloud Platforms, Communication, Databases, Data & Memory, Developer Tools, File Systems, Finance, Location Services, Monitoring, Search, Security, Travel, Version Control, and more

#### modelcontextprotocol/servers (Official)
**URL:** https://github.com/modelcontextprotocol/servers
**Maintainer:** Anthropic (MCP Steering Group)
**Type:** Reference implementations

**Reference Servers:**
- Everything (test server)
- Fetch (web content fetching)
- Filesystem (secure file ops)
- Git (repository tools)
- Memory (knowledge graph)
- Sequential Thinking
- Time (timezone conversion)

**Archived Servers:** Brave Search, EverArt, GitHub, GitLab, Google Drive, Google Maps, PostgreSQL, Puppeteer, Redis, Sentry, Slack, SQLite

**SDKs Available:** C#, Go, Java, Kotlin, PHP, Python, Ruby, Rust, Swift, TypeScript

---

## Part 2: Total MCP Server Count Analysis

### Cross-Marketplace Server Totals (June 2026)

| Marketplace | Server Count | Notes |
|-------------|-------------|-------|
| Glama.ai | 32,490 | Open-source servers only |
| Glama.ai Connectors | 4,962 | Hosted/remote endpoints |
| MCP.so | 21,956 | Community-collected index |
| PulseMCP | 16,822 | Daily-updated directory |
| Smithery.ai | 2,880 | Curated, CLI-installable |
| Cursor Directory | ~500+ | MCP-related plugins |
| **Unique Estimates** | **35,000-40,000** | After deduplication across markets |

**Key Insight:** Glama.ai is the largest single registry (32,490), but MCP.so has the broadest community collection (21,956). The actual number of unique, non-duplicate MCP servers is estimated at **35,000-40,000** globally.

---

## Part 3: MCP Category Matrix

### Category | Server Count | Top Tools | Security Status

| Category | Count | Top Servers | Security Risk |
|----------|-------|-------------|---------------|
| **Developer Tools** | 8,799 | Git, GitHub, VS Code extensions, code analysis | Medium -- code execution vectors |
| **Research & Data** | 5,148 | Brave Search, Jina AI, Perplexity, academic research | Low-Medium -- data exfiltration risk |
| **Cloud Platforms** | 636 | AWS KB, Hetzner Cloud, Cloudflare | High -- cloud credential exposure |
| **Communication** | 119 | Slack, Gmail, Outlook, Discord, Webex | High -- sensitive communications |
| **Finance** | 74 | AlphaVantage, crypto trading, stock data | High -- financial transaction risk |
| **Browser Automation** | 84 | Playwright, Puppeteer, Chrome DevTools | High -- browser session hijacking |
| **Security** | 84 | CrowdStrike, Panther, MCP-Scan, pentest tools | Critical -- both defensive AND offensive tools |
| **OS Automation** | 61 | Terminal control, file system, SSH | Critical -- system-level access |
| **Databases** | 54+ | PostgreSQL, Redis, SQLite, Supabase | High -- direct data access |
| **Monitoring** | 54 | Sentry, PagerDuty, Datadog integrations | Medium -- operational data |
| **Cloud Storage** | 57 | Google Drive, Dropbox | Medium -- file access |
| **File Systems** | 34 | Filesystem MCP (official) | High -- arbitrary file read/write |
| **Knowledge & Memory** | 41 | Memory graph, vector stores | Low -- local data only |
| **Calendar** | 23 | Google Calendar, TickTick | Low-Medium -- schedule data |

### Category Insights

**Most Populated:** Developer Tools (8,799) -- 40% of all MCP servers
**Least Populated:** AI Chatbot (5), Virtualization (5), Customer Data Platforms (6)
**Highest Security Risk:** OS Automation, File Systems, Cloud Platforms, Security (offensive tools)
**Fastest Growing:** Cloud Platforms, Security (both doubling monthly)

---

## Part 4: Competitor MCP Analysis

### [Zenity]: AI Agent Governance Platform
**MCP Status:** MCP-AWARE (monitors MCP interactions)
**Integration Depth:** Medium -- secures agent interactions across MCP framework
**Details:**
- Named "Company to Beat" in Gartner's April 2026 AI Agent Governance report
- Platform secures agent interactions across interoperability frameworks including MCP
- Full-lifecycle observability, shadow AI discovery, posture management
- Works with Microsoft 365 Copilot, Azure AI Foundry, Salesforce Agentforce
- Contributes to OWASP and MITRE ATLAS security research
- **Threat to SOV3:** Direct competitor in AI agent governance space
- **MCP Gap:** Monitors MCP but doesn't provide governance-specific MCP servers

---

### [CrowdStrike]: Falcon Platform
**MCP Status:** MCP SERVER AVAILABLE
**Integration Depth:** High -- official CrowdStrike Falcon MCP server exists
**Details:**
- Official `crowdstrike-falcon` MCP server on MCP.so
- "Connects AI agents with the CrowdStrike Falcon platform for intelligent security analysis"
- Provides programmatic access to: detections, incidents, behaviors, threat intelligence, hosts, vulnerabilities, identity protection
- **Threat to SOV3:** Has an active MCP server -- could expand into governance

---

### [Holistics]: BI Platform
**MCP Status:** MCP SERVER AVAILABLE
**Integration Depth:** High -- full MCP server with Streamable HTTP
**Details:**
- Official MCP server at `mcp-apac.holistics.io`
- Supports OAuth and API key authentication
- Multi-region (APAC, US, EU)
- Query datasets, list dashboards, export data
- **MCP Gap:** No governance/compliance focus

---

### [OneTrust]: Privacy/Governance Platform
**MCP Status:** NO DIRECT MCP SERVER FOUND
**Integration Depth:** Low -- AI governance platform but no MCP integration
**Details:**
- March 2026: Announced "AI-Ready Governance" brand positioning
- Privacy Breach Response Agent built with Microsoft Security Copilot
- Integrated with Azure OpenAI for compliance transparency
- DataGuidance regulatory research platform with AI features
- **MCP Gap:** No MCP server or integration -- SOV3 opportunity

---

### [Credo AI]: AI Governance
**MCP Status:** NO DIRECT MCP SERVER FOUND
**Integration Depth:** None found
**Details:**
- AI governance and risk management platform
- No MCP server or integration identified in research
- **MCP Gap:** Complete absence from MCP ecosystem -- SOV3 opportunity

---

### [Cranium]: AI Security
**MCP Status:** NO DIRECT MCP SERVER FOUND
**Integration Depth:** None found
**Details:**
- AI security and governance platform
- No MCP integration identified
- **MCP Gap:** Not present in MCP ecosystem

---

### [WitnessAI]: Agent Security
**MCP Status:** NO DIRECT MCP SERVER FOUND
**Integration Depth:** None found
**Details:**
- AI agent security platform
- No MCP integration identified
- **MCP Gap:** Not present in MCP ecosystem

---

### [Sycamore Labs]: AI Infrastructure
**MCP Status:** NO DIRECT MCP SERVER FOUND
**Integration Depth:** None found
**Details:**
- AI infrastructure company
- No MCP offerings identified
- **MCP Gap:** Not present in MCP ecosystem

---

### Competitor Summary Table

| Company | MCP Server | MCP Integration | Threat Level |
|---------|-----------|-----------------|--------------|
| Zenity | No | Monitors MCP | HIGH |
| CrowdStrike | Yes (Falcon) | Deep | MEDIUM |
| Holistics | Yes | Deep | LOW |
| OneTrust | No | None | LOW (for now) |
| Credo AI | No | None | LOW (for now) |
| Cranium | No | None | NEGLIGIBLE |
| WitnessAI | No | None | NEGLIGIBLE |
| Sycamore Labs | No | None | NEGLIGIBLE |

---

## Part 5: MCP Security Vulnerability Database

### Critical Finding: MCP Ecosystem Has Systemic Security Issues

The MCP ecosystem has been hit by multiple critical vulnerabilities. OX Security's May 2026 advisory identified **4 families of exploits** affecting **10,000+ MCP servers**.

### CVE Database (Confirmed MCP-Related Vulnerabilities)

| CVE | Product | Severity | Description |
|-----|---------|----------|-------------|
| CVE-2025-65720 | GPT Researcher | Critical | RCE via malicious MCP config |
| CVE-2025-68143 | mcp-server-git (official) | Moderate | Unrestricted git_init arbitrary fs locations |
| CVE-2025-68144 | mcp-server-git (official) | Moderate | Argument injection in git_diff/git_checkout |
| CVE-2025-68145 | mcp-server-git (official) | Moderate | Path validation bypass |
| CVE-2025-49596 | MCP Inspector | Critical | RCE via malicious server install |
| CVE-2026-30615 | Windsurf | Critical | Prompt injection to local RCE via MCP config |
| CVE-2026-30616 | Fay Digital Human | Critical | Unauthenticated RCE via MCP adapter |
| CVE-2026-30617 | LangChain-ChatChat | Critical | Unauthenticated RCE via MCP STDIO config |
| CVE-2026-30618 | Jaaz | Critical | Network-accessible RCE via MCP |
| CVE-2026-30623 | LiteLLM | Critical | Authenticated RCE via MCP server creation |
| CVE-2026-30624 | Agent Zero | Critical | RCE via External MCP Servers config |
| CVE-2026-30625 | Upsonic | High | RCE via allowlist bypass (npm/npx) |
| CVE-2026-33224 | Bisheng | Critical | Authenticated RCE via MCP tool config |
| CVE-2026-26015 | DocsGPT (ex-MemGPT) | Critical | Command injection via transport type switch |
| CVE-2026-25536 | MCP TypeScript SDK | High | Cross-client data leakage |
| CVE-2026-33252 | MCP Go SDK | High | Cross-site tool execution (missing Origin) |
| CVE-2026-35568 | MCP Java SDK | High | DNS rebinding attack |
| CVE-2026-40933 | Flowise | High | RCE via allowlist bypass |
| CVE-2026-22688 | WeKnora | Critical | MCP-related RCE |
| CVE-2026-22252 | LibreChat | Critical | MCP-related RCE |
| CVE-2025-54994 | @akoskm/create-mcp-server-stdio | Critical | MCP STDIO RCE |
| CVE-2025-54136 | Cursor | Critical | MCP-related RCE |
| CVE-2025-59536 | Claude Code | High | Pre-trust command execution |
| CVE-2026-21852 | Claude Code | High | Data exfiltration via MCP config |

### The Four Exploit Families (OX Security Advisory)

1. **Family #1: STDIO Command Injection** -- Unauthenticated/authenticated RCE via malicious MCP STDIO configuration (affects: LangFlow, GPT Researcher, LiteLLM, Agent Zero, LangBot, Bisheng, Jaaz, Fay, LangChain-ChatChat)
2. **Family #2: Hardening Bypass** -- Bypass allowlists using indirect command injection via npm/npx arguments (affects: Upsonic, Flowise)
3. **Family #3: Prompt Injection to Config Edit** -- Attacker-controlled content modifies local MCP config (affects: Windsurf CVE-2026-30615, also found in Cursor, Claude Code, Gemini-CLI, GitHub Copilot)
4. **Family #4: Hidden STDIO via Network Request** -- Backend still processes STDIO even when hidden from UI (affects: DocsGPT, LettaAI)

### Tool Poisoning Attacks (Invariant Labs Research)

- **Attack Vector:** Hidden malicious instructions in tool descriptions
- **Impact:** Data exfiltration, unauthorized actions, complete agent compromise
- **Rug Pull:** Servers change descriptions after approval
- **Tool Shadowing:** Malicious server overrides trusted server behavior
- **Real-World Demo:** WhatsApp MCP chat history exfiltration

### Security Scanning Tools Available

| Tool | Developer | Purpose |
|------|-----------|---------|
| MCP-Scan | Invariant Labs (acquired by Snyk) | Scan installed MCP servers for vulnerabilities |
| McpSafetyScanner | Halloran & Radosevich | Agentic MCP vulnerability probing |
| MCP-Guard | Academic (MCP-Guard paper) | Defense framework for MCP integrity |
| MCP Guardian | Academic | Security-first layer for MCP |
| MCP Watch | Community | Security scanner for MCP servers |
| MCP Security Scans | ModelContextProtocol-Security | Audit and vulnerability database |
| mcpserver-audit | Cloud Security Alliance project | Code audit for MCP servers |
| AI-Infra-Guard | Tencent Zhuque Lab | AI red teaming platform |
| Agentic Radar | Community | Security scanner for LLM agent workflows |
| MCP Shield | Community | Security scanner for MCP servers |

### "Won't Be Patched" Vulnerabilities (OX Security)

The following vendors/maintainers **rejected** MCP security disclosures as "expected behavior":

- **Root/Transport:** Anthropic MCP, LangChain MCP adapters, FastMCP, browser-use, AWS Lambda MCP, NVIDIA NeMo
- **IDEs/Agents:** Gemini-CLI, Claude Code, GitHub Copilot, Cursor
- **Applications:** OpenHands, PromptFoo, Firebase Studio

---

## Part 6: AI Governance MCP Gap Analysis

### What Exists in AI Governance MCP Space

| Server/Tool | Category | Maturity |
|-------------|----------|----------|
| ISO 27001 MCP Server | Compliance | Community -- turns Claude into ISO 27001 assistant |
| Global Compliance Audit MCP Server | Compliance | Production-grade -- covers GDPR, HIPAA, PCI-DSS, SOX, CCPA, ISO27001, SOC2, NIST-CSF, FedRAMP, GLBA, FERPA, COPPA, LGPD, PIPEDA |
| MCP Cloud Compliance | Cloud Security | Community -- AWS security posture queries |
| MCP Security (evaluation framework) | Security Assessment | Community -- vulnerability scanner + assessment templates |
| mcpserver-audit (CSA project) | Audit | Active development -- part of Cloud Security Alliance |
| CrowdStrike Falcon MCP | Security Operations | Official -- threat intel, detections, incidents |
| Panther MCP Server | SIEM | Community -- security monitoring |
| Pangea MCP Proxy | Data Protection | Commercial -- PII protection, malicious entity blocking |
| Arcjet MCP Server | Application Security | Commercial -- bot detection, rate limiting, attack protection |
| HashiCorp Vault MCP | Secrets Management | Community -- secret management |
| Authn8 MCP | Authentication | Commercial -- 2FA/TOTP for AI agents |

### What's Missing (THE SOV3 OPPORTUNITY)

| Gap | Description | SOV3 Opportunity |
|-----|-------------|-----------------|
| **No unified AI governance MCP** | No single MCP server that combines compliance, audit, risk, and policy | SOV3 can build the FIRST comprehensive AI governance MCP |
| **No NIST AI RMF MCP** | No MCP server for NIST AI Risk Management Framework | Build NIST AI RMF compliance server |
| **No EU AI Act MCP** | No MCP server for EU AI Act compliance checking | Build EU AI Act compliance server |
| **No model card governance MCP** | No MCP server for model card validation/audit | Build model card governance tools |
| **No bias detection MCP** | No MCP server for AI bias scanning | Build bias/fairness audit tools |
| **No drift detection MCP** | No MCP server for model drift monitoring | Build MLOps governance tools |
| **No explainability MCP** | No MCP server for AI explainability/interpretability | Build XAI governance tools |
| **No multi-framework compliance** | Existing tools cover 1-2 frameworks each | Build unified multi-framework compliance |
| **No governance scoring** | No standard AI governance score/rating | Create governance scoring standard |
| **No supply chain governance** | No MCP server for AI supply chain risk | Build AI supply chain governance |

### Market Size Context

- **72%** of MCP adopters expect usage to increase in next 12 months
- **54%** are confident in MCP's long-term viability
- **40%** expect 26-50% of AI tool usage to involve MCP
- **Enterprise governance** is the #1 concern for MCP adoption at scale
- **Microsoft** has published comprehensive MCP security governance guidelines
- **FINOS** (Linux Foundation) has published MCP Server Security Governance standards

---

## Part 7: SOV3 MCP Strategy

### Industry Packs to Build First (Priority Order)

#### Phase 1: Foundation (Weeks 1-4)
1. **SOV3 AI Governance MCP Server** -- The first comprehensive AI governance MCP
   - EU AI Act compliance checking
   - NIST AI RMF assessment
   - ISO 42001 (AI Management System) audit
   - Model card validation
   - Risk register management
   - Policy enforcement hooks

2. **SOV3 Compliance Audit MCP**
   - Multi-framework: SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS
   - Automated evidence collection
   - Control mapping across frameworks
   - Audit trail generation
   - Gap analysis

#### Phase 2: Security (Weeks 5-8)
3. **SOV3 MCP Security Scanner**
   - Scan any MCP server for vulnerabilities
   - Tool poisoning detection
   - STDIO command injection testing
   - Permission analysis
   - Supply chain risk scoring

4. **SOV3 AI Agent Guardrail MCP**
   - Runtime policy enforcement
   - Agent behavior monitoring
   - Prompt injection detection
   - Data exfiltration prevention
   - Cross-server contamination detection

#### Phase 3: Enterprise (Weeks 9-12)
5. **SOV3 Enterprise AI Governance Pack**
   - Multi-tenant governance dashboard
   - AI asset inventory
   - Shadow AI detection
   - Vendor risk assessment
   - Automated compliance reporting

6. **SOV3 Industry-Specific Packs**
   - **Financial Services:** FINRA, Basel, SOX, GLBA
   - **Healthcare:** HIPAA, FDA AI guidance, HITRUST
   - **Government:** FedRAMP, NIST 800-53, StateRAMP
   - **Critical Infrastructure:** NIS2, DORA

### Security Standards to Set

1. **SOV3 MCP Security Certification** -- "Certified Secure MCP" badge
2. **Governance Maturity Model** -- 5-level AI governance maturity assessment
3. **MCP Server Audit Standard** -- Open standard for auditing MCP servers
4. **AI Agent Risk Scoring** -- Standardized risk scoring for AI agents
5. **Cross-Framework Control Mapping** -- Unified mapping between NIST, ISO, EU AI Act

### Developer Acquisition Plan

#### Step 1: Be First (Month 1)
- Launch the first AI governance MCP server before any competitor
- Publish to all 6 marketplaces (MCP.so, Glama, Smithery, PulseMCP, Cursor Dir, GitHub)
- Create installation guides for Claude, Cursor, VS Code, ChatGPT

#### Step 2: Community Building (Months 2-3)
- Open-source core governance tools
- Publish security research on MCP vulnerabilities
- Partner with Cloud Security Alliance (CSA) MCP Security initiative
- Submit talks to MCP Dev Summit (Linux Foundation/AAIF)
- Engage with Invariant Labs (now Snyk) ecosystem

#### Step 3: Enterprise Adoption (Months 4-6)
- Enterprise MCP gateway with governance enforcement
- SOC 2 / ISO 27001 certified infrastructure
- Partnerships with Microsoft, AWS, GCP marketplaces
- Vertical industry packs (finance, healthcare, government)

#### Step 4: Ecosystem Lock-in (Months 7-12)
- Become the default governance layer for MCP deployments
- Integrate with Zenity, CrowdStrike, and other security platforms
- Publish annual "State of MCP Security" report
- Found an MCP Governance Working Group under Linux Foundation

### Competitive Moat Strategy

| Moat | Description |
|------|-------------|
| **First Mover** | First dedicated AI governance MCP server |
| **Data Network** | Every audit improves governance intelligence |
| **Standards Body** | Found/publish open governance standards |
| **Security Research** | Continuous MCP vulnerability research |
| **Certification** | "SOV3 Certified" becomes trust signal |
| **Integration Depth** | Deepest compliance framework coverage |

---

## Appendix A: Complete Security MCP Server List (MCP.so Security Category)

1. Authn8 -- 2FA/TOTP for AI agents
2. CrowdStrike Falcon -- threat intel & detections
3. 缔零科技 Mcp -- content security via Agentic AI
4. SchemaPin -- cryptographic signing of AI tool schemas
5. Anywhere MCP Server -- AlienVault/USM Anywhere threat intel
6. MCP Defender -- desktop app blocking malicious MCP traffic
7. MCP Cloud Compliance -- AWS security compliance auditing
8. MCP Password Generator -- secure password generation
9. grype mcp server -- vulnerability scanning via grype
10. RAD Security MCP Server -- container security
11. MCP Watch -- security scanner for MCP servers
12. Panther MCP Server -- SIEM integration
13. MCP Security Scans -- research vulnerability scanner
14. GHOSTCREW -- offensive security toolbox (Nmap, Metasploit, FFUF, SQLMap)
15. CyberShield MCP -- Windows cyber defense
16. Pangea MCP Proxy -- PII protection & malicious entity blocking
17. PentestAgentMCP -- automatic pentesting agent
18. Hostile-Command-Suite -- automated pentesting & OSINT
19. MCP Server Pentest -- penetration testing tools
20. Mcp Security -- security evaluation framework
21. vulnerable mcp fs-server -- intentionally vulnerable (educational)
22. Awesome-Security-MCP-Servers -- curated security MCP list
23. checkpoint-security-mcp-servers -- Check Point firewall integration
24. A.I.G (AI-Infra-Guard) -- AI infrastructure vulnerability assessment
25. MCP 安全扫描工具 -- Chinese security scanner
26. Model Context Protocol (MCP) Security -- vulnerability research
27. Authenticator App MCP Server -- secure authenticator integration
28. Damn Vulnerable MCP Server -- educational vulnerable server
29. MCP Vulnerability Scanner -- IP vulnerability scanning
30. MCP Nuclei Server -- Nuclei vulnerability scanning
31. MCP Shield -- security scanner for MCP servers
32. SSH Key Exfiltration Demo -- tool poisoning demonstration
33. ClamAV MCP -- antivirus file scanning
34. w3security-mcp -- web3 security
35. Agentic Radar -- LLM agent workflow scanner
36. sec-mcp -- security checking toolkit
37. myssl-mcp-server -- SSL certificate analysis
38. 漏洞扫描 MCP 服务器 -- vulnerability scanning
39. MCP Server For Garak -- LLM vulnerability scanner
40. MCP-Shield -- security scanner
41. Vulnerable MCP Server -- educational vulnerable server
42. WinsecMCP -- Windows hardening
43. SecureSshMcp -- secure SSH operations
44. HashiCorp Vault MCP Server -- secret management
45. Arcjet MCP Server -- bot detection, rate limiting
46. MCP-Scan -- MCP security scanner (Invariant Labs/Snyk)

---

## Appendix B: Key URLs Reference

| Resource | URL |
|----------|-----|
| MCP.so | https://mcp.so |
| Glama.ai | https://glama.ai/mcp |
| Smithery.ai | https://smithery.ai |
| PulseMCP | https://www.pulsemcp.com |
| Cursor Directory | https://cursor.directory |
| Official MCP Registry | https://registry.modelcontextprotocol.io |
| Anthropic MCP Announcement | https://www.anthropic.com/news/model-context-protocol |
| Official MCP Docs | https://modelcontextprotocol.io |
| Official MCP GitHub | https://github.com/modelcontextprotocol |
| awesome-mcp-servers | https://github.com/punkpeye/awesome-mcp-servers |
| OX Security MCP Advisory | https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem |
| Invariant Labs MCP-Scan | https://github.com/invariantlabs-ai/mcp-scan |
| Vulnerable MCP Project | https://vulnerablemcp.info |
| MCP Security Scans (CSA) | https://github.com/ModelContextProtocol-Security |
| MCP Governance Guide (Akto) | https://www.akto.io/blog/mcp-governance-guide |
| Microsoft MCP Governance | https://www.microsoft.com/insidetrack/blog/protecting-ai-conversations-at-microsoft-with-model-context-protocol-security-and-governance |
| FINOS MCP Security Governance | https://air-governance-framework.finos.org/mitigations/mi-20_mcp-server-security-governance.html |
| State of MCP 2025 (Zuplo) | https://zuplo.com/mcp-report |

---

## Appendix C: Methodology Notes

- All marketplace data captured live on June 8, 2026
- Security vulnerability data sourced from OX Security, Invariant Labs, GitHub Security Advisories, NVD
- Competitor analysis used direct web search and site visits
- Server counts may include duplicates across marketplaces
- Unique server count estimated via cross-referencing multiple sources
- Category counts from MCP.so categorization system

---

*This report compiled by SOV3 Intelligence Unit for strategic ecosystem planning. All data verified through primary source visits and searches.*
