# MCP Ecosystem Deep Research Report
## For MEOK Sovereign AI OS — MCP Router with BFT Governance

**Research Date**: June 2026
**Searches Conducted**: 12 independent search queries across web search
**Sources**: 50+ primary sources with inline citations

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [MCP Protocol Specification & Architecture](#2-mcp-protocol-specification--architecture)
3. [Official MCP Registry & Growth Metrics](#3-official-mcp-registry--growth-metrics)
4. [Open-Source MCP Server Ecosystem](#4-open-source-mcp-server-ecosystem)
5. [MCP Routing & Gateway Solutions](#5-mcp-routing--gateway-solutions)
6. [MCP Security Models & Vulnerabilities](#6-mcp-security-models--vulnerabilities)
7. [Linux Foundation Governance (Post-December 2025)](#7-linux-foundation-governance-post-december-2025)
8. [Streamable HTTP Transport](#8-streamable-http-transport)
9. [OAuth 2.1 + Resource Indicators for MCP Security](#9-oauth-21--resource-indicators-for-mcp-security)
10. [MCP vs Function Calling vs Plugin Architecture](#10-mcp-vs-function-calling-vs-plugin-architecture)
11. [MCP SDK Ecosystem & Downloads](#11-mcp-sdk-ecosystem--downloads)
12. [Community MCP Projects & Tools](#12-community-mcp-projects--tools)
13. [Implications for MEOK Sovereign MCP Router](#13-implications-for-meok-sovereign-mcp-router)

---

## 1. Executive Summary

The Model Context Protocol (MCP) ecosystem has experienced explosive growth since Anthropic open-sourced it in November 2024, becoming the de facto standard for AI agent-to-tool communication. As of mid-2026, the ecosystem encompasses **22,775+ MCP servers** indexed on Glama [^119^], **97+ million monthly SDK downloads** [^171^], and first-class support across all major AI platforms (Claude, ChatGPT, Cursor, Gemini, Copilot). Anthropic donated MCP to the Linux Foundation's Agentic AI Foundation (AAIF) in December 2025 [^53^], with 8 Platinum founding members (AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI).

However, the ecosystem faces a **severe security crisis**: OX Security's April 2026 disclosure revealed a systemic STDIO RCE vulnerability affecting an estimated **200,000 vulnerable instances** across **150+ million package downloads** [^52^][^180^], with at least **7 confirmed CVEs** spanning MCP Inspector, LiteLLM, Cursor IDE, LibreChat, and Windsurf [^52^]. Tool poisoning attacks have been demonstrated with attack success rates exceeding **72%** against prominent LLM agents [^62^].

For MEOK's sovereign MCP router with BFT governance, this landscape presents both an opportunity and a critical mandate: the protocol is rapidly becoming critical infrastructure, but its centralized governance model, severe security gaps, and lack of Byzantine fault tolerance create an opening for a fundamentally different approach.

---

## 2. MCP Protocol Specification & Architecture

### 2.1 Core Protocol Design

MCP is an open protocol that enables seamless integration between LLM applications and external data sources/tools [^55^]. It uses **JSON-RPC 2.0** messages for communication between three primary components:

| Component | Role | Example |
|-----------|------|---------|
| **Host** | LLM application that initiates connections | Claude Desktop, Cursor, ChatGPT |
| **Client** | Connector within the host application | MCP layer inside Claude Desktop |
| **Server** | Service providing context and capabilities | GitHub MCP Server, Postgres MCP Server |

The protocol takes inspiration from the Language Server Protocol (LSP) and standardizes how AI applications integrate additional context and tools [^55^].

### 2.2 Core Capabilities (Server-Provided)

Servers offer the following features to clients [^55^]:

- **Resources**: Context and data for the user or AI model to use (read-only data pulled as context)
- **Prompts**: Templated messages and workflows for users
- **Tools**: Functions for the AI model to execute (executable functions like `create_issue`, `query_database`)

Clients may offer:
- **Sampling**: Server-initiated agentic behaviors and recursive LLM interactions (enables server-side agent loops)

### 2.3 Additional Utilities

- Configuration management
- Progress tracking
- Cancellation support
- Error reporting
- Logging
- Elicitation (server can request clarification from user)
- Server-side agent loops (added November 2025)

### 2.4 Transport Mechanisms

| Transport | Use Case | Status |
|-----------|----------|--------|
| **STDIO** | Local process communication (host spawns server as child process) | Active |
| **Streamable HTTP** | Remote server communication, single POST endpoint | Active (since March 2025) |
| **HTTP+SSE** | Older HTTP-based transport with dual endpoints | Deprecated (replaced by Streamable HTTP) |

### 2.5 Specification Evolution

| Version | Date | Key Changes |
|---------|------|-------------|
| 2024-11-05 | Nov 2024 | Initial release with HTTP+SSE transport |
| 2025-03-26 | Mar 2025 | Streamable HTTP introduced; OAuth 2.1 added |
| 2025-06-18 | Jun 2025 | MCP servers classified as OAuth Resource Servers; Resource Indicators (RFC 8707) mandated |
| 2025-11-25 | Nov 2025 | Async tasks, enhanced sampling, elicitation, server-side agent loops, Client ID Metadata Documents, extensions system |
| 2026-07-28 | Jul 2026 | Removal of GET stream endpoint; removal of protocol-level sessions |

### 2.6 Key Architectural Limitations for MEOK

- **No native multi-tenancy**: SaaS providers must invent their own tenant isolation models [^122^]
- **No standardized audit trail**: Teams build their own logging/tracing infrastructure [^122^]
- **No rate limiting or cost attribution**: Agents can invoke tools autonomously without caps [^122^]
- **No configuration portability**: Setting up a server in one client means starting from scratch in another [^122^]
- **No gateway behavior specification**: Enterprises running MCP behind proxies face undefined behavior [^122^]
- **No BFT consensus**: The protocol assumes trusted servers; no Byzantine fault tolerance at the protocol level

---

## 3. Official MCP Registry & Growth Metrics

### 3.1 Registry Sources

| Registry | Server Count | URL |
|----------|-------------|-----|
| **Glama Directory** | 22,775 (as of May 2026) | glama.ai |
| **MCP.Directory** | 1,864+ (as of Feb 2026) | mcp.directory |
| **Official MCP Registry** | ~2,000 (launched Sep 2025) | registry.modelcontextprotocol.io |
| **PulseMCP** | Community-filtered directory | pulsemcp.com |
| **Smithery** | MCP marketplace | smithery.ai |
| **GitHub MCP Organization** | Official/community servers | github.com/mcp |

### 3.2 Growth Timeline

| Date | Milestone |
|------|-----------|
| **Nov 2024** | Anthropic open-sources MCP |
| **Mar 2025** | OpenAI announces full MCP support (inflection point); Streamable HTTP + OAuth 2.1 shipped |
| **Apr 2025** | Google DeepMind confirms MCP support for Gemini |
| **Jun 2025** | Spec formalizes MCP servers as OAuth Resource Servers; Resource Indicators mandated |
| **Sep 2025** | Official MCP Registry launches; grows to nearly 2,000 entries within months |
| **Nov 2025** | Largest spec update since launch: async tasks, sampling, elicitation, extensions |
| **Dec 2025** | Anthropic donates MCP to Linux Foundation AAIF |
| **Jan 2026** | MCP Apps launches as first official extension |
| **Mar 2026** | 2026 roadmap published making enterprise readiness top priority |

### 3.3 SDK Download Metrics

| SDK | Downloads | Notes |
|-----|-----------|-------|
| **TypeScript SDK (@modelcontextprotocol/sdk)** | 66M+ npm downloads, 27,000+ dependent packages [^172^]; 39M weekly downloads [^174^] | Tier 1 official SDK |
| **Python SDK (mcp)** | 97M+ monthly SDK downloads (combined) [^171^] | v2 in alpha as of June 2026 |
| **Total ecosystem** | 150M+ package downloads (affected by STDIO vulnerability) [^180^] | Across all language SDKs |

### 3.4 Client Adoption

| Client | Support Level | MCP Integration |
|--------|--------------|----------------|
| **Claude Desktop** | Full native (MCP was created by Anthropic for this) | Complete |
| **Claude Code** | Full native via `claude mcp` CLI | Complete |
| **ChatGPT** | Developer Mode (Sep 2025) | Read + write operations |
| **Cursor** | Full native | IDE integration |
| **Gemini** | Full support (since Apr 2025) | Google's AI platform |
| **VS Code** | Full support | IDE extension |
| **Perplexity** | Local MCP on macOS | Planned for paid subscribers |

### 3.5 Security Context: Registry Vulnerabilities

A critical finding for any MCP router: **BlueRock Security analysis of ~7,000 public MCP servers** found [^119^]:
- **36.7% carry SSRF vulnerabilities**
- **41% have no authentication at all**
- **53% of authenticated servers rely on static API keys**
- **Only 8.5% use OAuth**
- **30+ CVEs filed against MCP servers in a 60-day window** (early 2026)
- **492 MCP servers publicly exposed with zero authentication** (Trend Micro finding)

---

## 4. Open-Source MCP Server Ecosystem

### 4.1 Server Categories & Notable Examples

Based on the comprehensive best-of-mcp-servers repository and other sources [^35^], the ecosystem spans 20+ categories:

#### Art & Culture
- `blender-mcp` (23K stars) — MCP server for Blender [^35^]
- `davinci-resolve-mcp` (1.2K stars) — DaVinci Resolve video editing [^35^]
- `aseprite-mcp` (190 stars) — Pixel art creation [^35^]

#### Browser Automation
- `executeautomation/mcp-playwright` (5.6K stars) — Browser automation [^35^]
- `browser-use-mcp-server` (820 stars) — browser-use packaged as MCP [^35^]
- `refreshdotdev/web-eval-agent` (1.2K stars) — Autonomous web debugging [^35^]

#### Cloud Platforms
- `TencentCloudBase/CloudBase-AI-ToolKit` (1K stars) — Serverless MCP tools [^35^]
- `hashicorp/terraform-mcp-server` (1.4K stars) — Terraform ecosystem [^35^]
- `weibaohui/k8m` (830 stars) — Multi-cluster Kubernetes management [^35^]
- `rohitg00/kubectl-mcp-server` (910 stars) — Kubernetes operations [^35^]
- `portainer/portainer-mcp` (170 stars) — Docker container management [^35^]

#### Databases (Most-installed category)
- Postgres MCP server — Direct SQL access, schema inspection
- SQLite MCP server — File-based, local prototyping
- MongoDB MCP server — Document queries, aggregation
- Redis MCP server — Cache inspection, pub/sub
- MySQL MCP server — MySQL ecosystem [^178^]

#### Developer Tools
- `idosal/git-mcp` (8.2K stars) — Generic remote MCP server for ANY GitHub repo [^35^]
- `haris-musa/excel-mcp-server` (3.9K stars) — Excel manipulation [^35^]
- `21st-dev/magic-mcp` (5.1K stars) — UI component creation [^35^]
- `JetBrains/mcp-jetbrains` (960 stars) — JetBrains IDE integration [^35^]

#### Finance & Fintech
- `ferdousbhai/investor-agent` (330 stars) — Yahoo Finance [^35^]
- `mcpdotdirect/evm-mcp-server` (380 stars) — 30+ EVM blockchain networks [^35^]
- `XeroAPI/xero-mcp-server` (300 stars) — Xero accounting [^35^]

#### Knowledge & Memory
- `mem0ai/mem0-mcp` (660 stars) — Coding preferences memory [^35^]
- `bitbonsai/mcpvault` (1.4K stars) — Obsidian vault bridge [^35^]
- `graphlit/graphlit-mcp-server` (380 stars) — Multi-source ingestion [^35^]

### 4.2 Server Count by Quality

| Category | Count |
|----------|-------|
| Total indexed servers (Glama) | 22,775 [^119^] |
| Production-quality servers (MCPBundles) | 700+ providers [^119^] |
| Top open-source local servers (cumulative installs) | Filesystem: 335,723 [^119^] |
| npm-published MCP servers | ~1,200 (Q2 2026) [^173^] |
| Security-vetted (SkillsLLM daily audit) | PASS/WARNING/FAIL graded [^178^] |

### 4.3 Key Security Observations

The OX Security "Malicious Trial Balloon" incident of early 2026 proved that **9 out of 11 major MCP directories accepted a typosquatting payload without any security review** [^177^]. The cloned package `mcp-server-postgress` (double 's') was accepted and published, containing a silent SSH key exfiltration payload.

---

## 5. MCP Routing & Gateway Solutions

### 5.1 Existing Gateway/Router Projects

| Project | Stars | Description | License |
|---------|-------|-------------|---------|
| **MetaMCP** | 2.4K | Unified middleware MCP server managing connections with GUI | MIT [^35^] |
| **Lunar (MCPX)** | 450 | Production-ready open-source gateway for MCP at scale | MIT [^35^] |
| **Microsoft mcp-gateway** | 690 | Reverse proxy + management layer with session-aware routing | MIT [^35^] |
| **mcp-access-point** | 180 | Turn web service into MCP server without code changes | MIT [^35^] |
| **boltmcp** | 350 | Enterprise-grade MCP orchestration platform (on-premises) | Unlicensed [^35^] |
| **magg** | 130 | Meta-MCP server: universal hub for autonomous discovery/install | AGPL-3.0 [^35^] |
| **pluggedin-mcp-proxy** | 130 | Proxy combining multiple MCP servers into single interface | Apache-2.0 [^35^] |
| **mcgravity** | 98 | Proxy for composing multiple MCP servers into one endpoint | Unlicensed [^35^] |
| **mcp-server-multiverse** | 77 | Middleware enabling multiple isolated instances of same server | MIT [^35^] |
| **Kong AI Gateway** | — | AI Gateway with MCP Server integrations via Amazon Bedrock | — [^166^] |
| **Obot MCP Gateway** | — | Open-source MCP gateway with multi-tenant support | — [^167^] |

### 5.2 Gateway Capabilities Analysis

Current MCP gateways provide [^167^]:

| Capability | Status |
|------------|--------|
| **Request routing** | Common — reverse proxy pattern |
| **Authentication/OAuth** | Partial — OAuth propagation undefined |
| **Load balancing** | Some — distribute traffic across backends |
| **Caching** | Some — speed up repeated responses |
| **Multi-tenancy** | Emerging — SaaS isolation not standardized |
| **Rate limiting** | Rare — not addressed at protocol level |
| **Audit trails/SIEM** | Missing — no standardized observability |
| **Schema validation** | Missing — no tool description verification |
| **BFT consensus** | **Nonexistent** — no Byzantine fault tolerance |
| **Tool poisoning detection** | **Nonexistent** — no runtime tool description scanning |

### 5.3 Enterprise Gateway Gaps (2026 Roadmap)

The March 2026 MCP roadmap explicitly identifies gateway as a priority area [^184^]:
- Gateway and proxy patterns including **authorization propagation** and **session affinity**
- Running Streamable HTTP **statelessly across multiple server instances**
- Standardizing **MCP Server Cards** for metadata discovery
- Enterprise-managed auth with **SSO-integrated flows**
- **Structured audit trails** plugging into SIEM and APM infrastructure

> "There is no dedicated enterprise working group within the MCP project... the maintainers are encouraging contributors with experience in enterprise infrastructure to help shape these efforts." [^190^]

---

## 6. MCP Security Models & Vulnerabilities

### 6.1 The STDIO RCE Design Flaw (Critical)

OX Security's April 2026 disclosure, "The Mother of All AI Supply Chains," documents a **systemic RCE vulnerability** present across all officially supported language SDKs (Python, TypeScript, Java, Rust) [^180^]:

**The vulnerability**: The MCP STDIO transport executes operating system commands without sanitization or validation. The SDK accepts a `command` field and runs it unconditionally — it does not verify the command is an MCP-compatible server, does not sanitize syntax, and does not abort if the subprocess fails to initialize [^180^].

**Attack pattern**: 
1. Attacker influences the `command` field (via prompt injection, config tampering, or malicious marketplace distribution)
2. Arbitrary OS commands execute on the host system
3. Execution occurs **before** SDK detects whether the subprocess is a valid MCP server
4. Short commands that exit immediately return an error to the client while the payload completes in the background [^180^]

**Anthropic's response**: Confirmed the behavior as **intentional** during coordinated disclosure in January 2026. Anthropic's position: STDIO execution is a secure default when developers appropriately restrict commands, and input sanitization is the developer's responsibility [^180^].

**Impact scale** [^180^][^52^]:
- 150 million+ package downloads affected
- 7,000+ publicly accessible servers
- Up to 200,000 vulnerable instances
- Attackable via marketplace poisoning (9/11 registries accepted malicious packages)

### 6.2 Confirmed CVEs (Partial List)

| CVE | Product | Severity | Description |
|-----|---------|----------|-------------|
| **CVE-2025-49596** | MCP Inspector | Critical (CVSS 9.4) | RCE via CSRF, browser-based exploitation [^185^] |
| **CVE-2025-54136** | Cursor IDE | — | MCPoison — rug pull via config change [^52^] |
| **CVE-2025-59536** | Claude Code | — | RCE and API token exfiltration via project files |
| **CVE-2025-54994** | create-mcp-server-stdio | — | Untrusted STDIO input |
| **CVE-2026-21852** | Claude Code | — | Secondary vector for project file exploitation |
| **CVE-2026-30623** | LiteLLM | — | Command injection via MCP stdio transport [^189^] |
| **CVE-2026-30625** | Upsonic | High | RCE via allowed command argument injection [^179^] |
| **CVE-2026-40933** | Flowise | High | RCE via MCP configuration UI [^179^] |
| **CVE-2026-26015** | DocsGPT | Critical | Command injection via transport type switch [^179^] |
| **CVE-2026-23744** | MCPJam Inspector | Critical | RCE via crafted HTTP request [^182^] |

### 6.3 Tool Poisoning Attacks (TPA)

Tool poisoning, first identified by **Invariant Labs** in April 2025 [^165^], is the most significant ongoing threat:

**Mechanism**: Malicious instructions are embedded within a tool's description or metadata. The LLM processes these instructions during the MCP registration phase but they are typically invisible to users in the UI [^52^][^170^].

**MCPTox Benchmark Results** (AAAI-26 published research) [^62^]:
- Even **Claude-3.7-Sonnet refuses fewer than 3%** of tool poisoning attacks
- Highest attack success rate: **over 72%**
- Prominent agents (o1-mini, DeepSeek-R1) show attack success rates **exceeding 60%**
- Content-based safety alignment is **ineffective** against TPA

**Real-world incident**: An unofficial Postmark MCP server with **1,500+ weekly downloads** was modified to silently BCC all outgoing emails to an attacker-controlled address (Sep 2025) [^164^].

### 6.4 Additional Attack Taxonomy

| Attack Class | Description | Source |
|-------------|-------------|--------|
| **Tool poisoning** | Hidden instructions in tool descriptions | Invariant Labs 2025 [^165^] |
| **Rug pull** | Benign server silently modifies tools post-approval | Bhatt et al. 2025 [^164^] |
| **Confused deputy** | Server executes with own elevated privileges | Palo Alto Networks 2026 [^54^] |
| **Overprivileged tokens** | Plaintext credential storage in config files | Multiple sources |
| **SSRF** | 36.7% of public servers vulnerable | BlueRock Security 2026 [^119^] |
| **ANSI escape code injection** | Hidden instructions rendered invisible | Trail of Bits 2025 [^61^] |
| **Cross-server tool shadowing** | Malicious server intercepts calls to trusted server | Multiple sources [^61^] |
| **Terminal injection** | Trigger phrases that exfiltrate conversation history | Trail of Bits 2025 [^61^] |
| **MCP Preference Manipulation (MPMA)** | Subtly alters tool ranking/selection preferences | Wang et al. 2026 [^60^] |
| **Parasitic toolchain attacks** | Chained infected tools propagating malicious commands | Multiple sources [^60^] |

### 6.5 Current Authorization Model (OAuth 2.1)

The MCP authorization specification [^121^]:
- Based on **OAuth 2.1 IETF DRAFT** (draft-ietf-oauth-v2-1-13)
- Requires **OAuth 2.0 Protected Resource Metadata** (RFC 9728)
- Requires **Resource Indicators** (RFC 8707) for audience-bound tokens
- Supports **Dynamic Client Registration** (RFC 7591)
- Requires **PKCE** on every authorization code flow
- **Authorization is OPTIONAL** — MCP servers can operate without authentication

**Critical gap**: A July 2025 internet scan identified at least **1,862 publicly accessible MCP instances responding to unauthenticated requests** [^52^].

---

## 7. Linux Foundation Governance (Post-December 2025)

### 7.1 The Donation

On **December 9, 2025**, Anthropic donated the Model Context Protocol to the Linux Foundation [^53^]:

- MCP becomes a founding project of the **Agentic AI Foundation (AAIF)**, a directed fund hosted by LF
- Co-announced by Anthropic, Block, OpenAI, and the Linux Foundation
- Block contributed `goose`; OpenAI contributed `AGENTS.md`

### 7.2 Platinum Founding Members

| Member | Role |
|--------|------|
| **AWS** | Cloud infrastructure |
| **Anthropic** | Protocol creator |
| **Block** | Contributed goose project |
| **Bloomberg** | Financial data |
| **Cloudflare** | Edge infrastructure |
| **Google** | AI platform (Gemini) |
| **Microsoft** | Developer tools (Copilot, VS Code) |
| **OpenAI** | Contributed AGENTS.md; ChatGPT support |

### 7.3 Governance Structure

**Two-tier governance model** [^53^]:

| Layer | Body | Function |
|-------|------|----------|
| **Strategic** | AAIF Governing Board | Allocates resources (events, infrastructure) across MCP, goose, AGENTS.md |
| **Technical** | MCP Steering Group | Decides what goes into the spec via SEP process |

**Technical governance hierarchy** (BDFL model) [^53^]:

| Role | Scope | Held By |
|------|-------|---------|
| **Lead Maintainers (BDFL)** | Final decision authority | David Soria Parra; Den Delimarsky |
| **Core Maintainers** | Overall project direction; can veto Maintainers | 8 individuals including Peter Alexander, Caitie McCaffrey, Kurtis Van Gent, Clare Liguori, Paul Carleton, Nick Cooper, Nick Aldridge, Che Liu |
| **Maintainers** | Working Groups, SDKs, components | Per MAINTAINERS.md |
| **Contributors** | Issues, PRs, discussions | Anyone |
| **Lead Maintainer Emeritus** | Co-inventor; honorary | Justin Spahr-Summers |

**Key governance facts** [^53^]:
- **Membership is individual, not corporate** — no seats reserved for specific companies
- Maintainers must use the same contribution process as external contributors
- All contributions licensed under **Apache 2.0**; documentation under **CC BY 4.0**
- Trademark and brand surface now under LF Projects, LLC

### 7.4 April 2026 Maintainer Expansion

Den Delimarsky promoted from Core to Lead Maintainer (MCP now has two Lead Maintainers), and Clare Liguori added to Core Maintainer group [^53^]. David Soria Parra: "the goal was to make sure the protocol could keep growing without any one person becoming a bottleneck."

### 7.5 Governance Limitations for MEOK

The current governance model has several structural limitations:

1. **BDFL bottleneck**: Two Lead Maintainers have final veto authority — no distributed consensus
2. **No formal contributor ladder** (as of March 2026) — every SEP requires full core-maintainer review [^184^]
3. **No enterprise working group** — enterprise readiness lacks dedicated focus [^190^]
4. **Security treated as "horizon" item** — not a core-funded priority despite 200K vulnerable instances [^53^]
5. **Platinum members as "corporate cartel"**: Critics frame the $875K/year Platinum tier as capture-by-incumbents [^53^]

### 7.6 Comparable LF Projects

| Project | Year | Shape | Outcome |
|---------|------|-------|---------|
| **OpenAPI Initiative** | 2015 | Spec-only | Universal API spec; every codegen implements it |
| **CNCF** | 2015 | Top-level foundation | 150+ projects; model for cloud infra governance |
| **AAIF (MCP)** | 2025 | Directed fund, 3 projects | TBD — closer to OpenAPI than CNCF [^53^] |

---

## 8. Streamable HTTP Transport

### 8.1 What Changed

Streamable HTTP was introduced in protocol version **2025-03-26** as a replacement for HTTP+SSE [^129^]:

| Aspect | Old (HTTP+SSE) | New (Streamable HTTP) |
|--------|---------------|----------------------|
| Endpoints | Two: `/sse` + `/sse/messages` | Single: POST endpoint |
| Connection | Persistent SSE connection | Per-request POST |
| Server response | SSE stream scoped to connection | SSE stream scoped to request |
| Scalability | Limited (long-lived connections) | Stateless, horizontally scalable |
| Server-to-client | Direct SSE push | Embedded via MRTR (SEP-2322) |

### 8.2 How Streamable HTTP Works

1. Server exposes a single HTTP endpoint (the **MCP endpoint**) accepting POST [^129^]
2. Client sends every JSON-RPC request/notification as its own HTTP POST
3. Server answers with either a single JSON object or SSE stream scoped to that request
4. Server-to-client interactions (sampling, elicitation, roots) embedded via **Multi Round-Trip Requests (MRTR)**
5. Long-lived change notifications delivered on response stream of `subscriptions/listen`

### 8.3 Security Requirements

Servers **MUST** [^129^]:
1. Validate the `Origin` header to prevent DNS rebinding attacks (respond 403 if invalid)
2. Bind only to localhost (127.0.0.1) when running locally, not 0.0.0.0
3. Implement proper authentication for all connections

### 8.4 2026 Evolution

The Transports Working Group focuses on [^184^]:
- Evolving Streamable HTTP to work **statelessly across multiple server instances**
- Defining how sessions are created, resumed, and migrated during scale-out
- Standardizing **MCP Server Cards** for metadata discovery

### 8.5 SDK Support

- TypeScript SDK v1.10.0 (April 17, 2025) was first to support Streamable HTTP [^132^]
- Python SDK supports stdio, SSE, and Streamable HTTP [^173^]
- Current TypeScript SDK version: **1.29.0** (June 2026) [^171^]
- Python SDK v2 in alpha, targeting stable release July 27, 2026 [^169^]

---

## 9. OAuth 2.1 + Resource Indicators for MCP Security

### 9.1 Authorization Architecture

MCP's authorization mechanism is based on a selected subset of OAuth standards [^121^]:

| Standard | RFC | Purpose |
|----------|-----|---------|
| **OAuth 2.1** | IETF DRAFT | Core authorization framework |
| **Bearer Token Usage** | RFC 6750 | Token transmission |
| **Authorization Server Metadata** | RFC 8414 | Discovery of auth server endpoints |
| **Dynamic Client Registration** | RFC 7591 | Self-registration of MCP clients |
| **Resource Indicators** | RFC 8707 | Audience-bound tokens |
| **Protected Resource Metadata** | RFC 9728 | MCP server advertising its auth server |
| **Authorization Server Issuer ID** | RFC 9207 | Issuer verification |

### 9.2 Resource Indicators (RFC 8707) — Critical for Security

**Purpose**: Prevent token misuse across MCP servers [^128^]:

- MCP clients **MUST** include the `resource` parameter in authorization and token requests
- The parameter **MUST** identify the MCP server the client intends to use the token with
- Uses the **canonical URI** of the MCP server (e.g., `https://mcp.example.com/mcp`)
- Authorization Server issues tightly scoped tokens only valid for that specific server
- Prevents malicious/compromised servers from using tokens at different resources [^128^]

**Example**: `&resource=https%3A%2F%2Fmcp.example.com`

### 9.3 Protected Resource Metadata (RFC 9728)

- MCP servers **MUST** implement OAuth 2.0 Protected Resource Metadata
- MCP clients **MUST** use this metadata for authorization server discovery
- The `.well-known/oauth-protected-resource` document points to the authorization server
- Enables automatic discovery without manual configuration [^121^][^127^]

### 9.4 Implementation Status

| Authorization Server | RFC 8707 Support | Notes |
|---------------------|-----------------|-------|
| **Keycloak 26.4** | Not yet (milestone 26.5) | Issue #14355 [^123^] |
| **cidaas** | Full | Commercial MCP authorization service [^118^] |
| **Auth0** | Partial | Blog coverage of MCP spec updates [^128^] |
| **Custom (Go)** | Implementable | Step-by-step guide available [^127^] |

### 9.5 Gaps in Current Security Model

1. **Authorization is OPTIONAL** — servers can operate without any authentication [^52^]
2. **DPoP (Demonstrating Proof-of-Possession)** — supported via SEP-1932 but not mandatory
3. **Workload Identity Federation** — SEP-1933, in progress
4. **No per-tool consent** at the protocol level — only at OAuth grant step
5. **No human-in-the-loop** for sensitive operations (CIBA not required)

---

## 10. MCP vs Function Calling vs Plugin Architecture

### 10.1 Architectural Comparison

| Dimension | Native Function Calling | MCP |
|-----------|------------------------|-----|
| **Integration** | Within LLM's process | Distinct layered architecture with separate servers |
| **Vendor lock-in** | Vendor-specific (OpenAI vs Google vs Anthropic formats differ) | Universal — works across all models |
| **Tool addition** | Requires code changes for new tools | Add tools without agent code changes |
| **Scalability** | Harder — integrated architecture | Highly scalable — one-to-many integration |
| **Reusability** | None — app-specific | High — one server works across all MCP clients |
| **Security** | Ad hoc per integration | Standardized OAuth 2.1, audience-bound tokens |
| **Complexity** | Simpler for basic use | Higher — requires server infrastructure |
| **Latency** | Lower (in-process) | Higher (network/protocol overhead) |

### 10.2 Complementary Relationship

MCP and function calling are **complementary, not competing** [^58^][^59^]:

**Best practice**: Use function calling for the **generation phase** (interpreting user prompts, generating structured instructions), and MCP for the **execution phase** (discovering tools, invoking them, managing responses) [^59^].

**Migration path**: Start with your most-shared tool — consolidate copy-pasted implementations into a FastMCP server. Function calling versions keep working during migration [^58^].

### 10.3 MCP vs A2A (Agent-to-Agent Protocol)

| Protocol | Scope | Layer |
|----------|-------|-------|
| **MCP** | Agent-to-tool and agent-to-data-source | Tool access layer |
| **A2A** (Google) | Agent-to-agent communication | Orchestration layer |

These are complementary: use MCP for each agent's tool access, and A2A for orchestrating work across agents [^187^]. Google, AWS, and other MCP contributors have adopted both.

### 10.4 Comparison with Other Integration Methods

| Method | Setup | Reusability | Maintenance | Security |
|--------|-------|-------------|-------------|----------|
| Custom API integration | High — code per tool | None | High | Ad hoc |
| OpenAI function calling | Medium | None — vendor-specific | Medium | Varies |
| **MCP servers** | Low — standardized | High — all MCP clients | Low | OAuth 2.1, standardized |
| LangChain/custom agents | High | Low | High | Ad hoc |

---

## 11. MCP SDK Ecosystem & Downloads

### 11.1 Official SDKs

| SDK | Language | Downloads | Status |
|-----|----------|-----------|--------|
| **TypeScript SDK** | TypeScript/Node.js | 66M+ npm, 39M weekly [^174^], 27K+ dependent packages [^172^] | Tier 1 — most feature-complete |
| **Python SDK** | Python | Part of 97M+ combined [^171^] | v1.x stable; v2 alpha (beta Jun 30, stable Jul 27) |
| **Java SDK** | Java/Kotlin | — | Community-maintained |

### 11.2 SDK Version Status (June 2026)

- **TypeScript SDK**: v1.29.0 (stable) [^171^]
- **Python SDK**: v1.x stable, v2.0.0aN in alpha [^169^]
- **Python SDK v2 target**: Beta June 30, 2026; stable July 27, 2026

### 11.3 Client Support Matrix

| Client | Local (STDIO) | Remote (HTTP) | Discovery | Extensions |
|--------|--------------|---------------|-----------|------------|
| **Claude Desktop** | Yes | Yes (Connectors) | Built-in | Yes (MCP Apps) |
| **Claude Code** | Yes | Yes | CLI (`claude mcp`) | Project scopes |
| **ChatGPT Desktop** | Limited | Yes (Developer Mode) | Manual | Apps SDK |
| **Cursor** | Yes | Yes | Config file | IDE-native |
| **VS Code** | Yes | Yes | Extension marketplace | Extensions |
| **Gemini** | Yes | Yes | Auto-discovery | Limited |

---

## 12. Community MCP Projects & Tools

### 12.1 Discovery & Distribution Platforms

| Platform | Type | Features |
|----------|------|----------|
| **Smithery** | MCP marketplace | Server distribution, observability [^184^] |
| **MCPBundles** | Hosted hub | 700+ providers, single endpoint, encrypted credentials [^119^] |
| **MCP.Directory** | Curated directory | 1,864+ servers with analytics [^120^] |
| **Glama** | Comprehensive index | 22,775 servers, install counts [^119^] |
| **SkillsLLM** | Security-vetted directory | Daily Semgrep + dependency audit, PASS/WARNING/FAIL [^178^] |
| **PulseMCP** | Community directory | Official/Community/Anthropic classification |
| **best-of-mcp-servers** | GitHub awesome-list | Categorized with quality rankings [^35^] |

### 12.2 Development Tools

| Tool | Purpose |
|------|---------|
| **MCP Inspector** | Debug utility for MCP servers (CVE-2025-49596 patched in v0.14.1) |
| **MCPJam Inspector** | Local-first development platform (CVE-2026-23744 in v1.4.2) |
| **FastMCP** | High-level Python framework for building MCP servers quickly |
| **mcp-proxy** | Connect Claude Desktop (stdio-only) to HTTP MCP servers [^171^] |
| **mcp-scan** | Security scanner for MCP connections (by Invariant Labs) |

### 12.3 MCP Apps (Launched Jan 2026)

MCP Apps allow MCP servers to render **interactive UIs** (dashboards, project boards) directly within the chat interface [^177^]. This represents a significant expansion of MCP from tool access to full application rendering.

### 12.4 Enterprise Integration Platforms

| Platform | Description |
|----------|-------------|
| **Kong AI Gateway** | AI Gateway with MCP + A2A integration on AWS [^166^] |
| **Obot** | Open-source MCP gateway with multi-tenant support [^167^] |
| **Knit** | 100+ enterprise API integrations (Workday, Salesforce, etc.) |
| **MCPBundles** | 10,000+ tools across 700+ providers with OAuth-first auth [^119^] |

---

## 13. Implications for MEOK Sovereign MCP Router

### 13.1 Strategic Opportunity Assessment

The MCP ecosystem analysis reveals a **critical gap** that aligns precisely with MEOK's vision:

| Gap | Current State | MEOK Opportunity |
|-----|--------------|------------------|
| **Centralized governance** | BDFL model with 2 Lead Maintainers | BFT consensus for protocol decisions |
| **No security at protocol level** | 200K vulnerable instances; 72% TPA success rate | Built-in tool description verification, sandboxing |
| **No multi-tenancy** | SaaS providers invent their own | Native tenant isolation with cryptographic boundaries |
| **No audit trails** | Teams build their own SIEM integration | Immutable audit logs on-chain |
| **No rate limiting** | Agents can invoke without caps | Token-bounded execution with cost attribution |
| **No configuration portability** | Start from scratch per client | Portable configs with cryptographic identity |
| **Registry is centralized** | 9/11 registries accepted malicious packages | Decentralized, reputation-weighted registry |
| **No BFT consensus** | Single points of failure everywhere | Byzantine fault tolerant router mesh |

### 13.2 Technical Architecture Recommendations

Based on this research, MEOK's MCP router should:

1. **Implement the full MCP specification** (latest draft) as a foundational layer
2. **Add a BFT consensus layer** above the protocol for server registry, tool description verification, and policy decisions
3. **Deploy runtime tool poisoning detection** — scan tool descriptions for embedded instructions using both static and dynamic analysis
4. **Mandate OAuth 2.1 + Resource Indicators** — make authorization non-optional for the sovereign router
5. **Implement per-tool consent** with human-in-the-loop for sensitive operations
6. **Build a sandboxed execution environment** for STDIO servers to contain the RCE risk
7. **Create an immutable audit trail** of all tool invocations, consent grants, and schema changes
8. **Design a decentralized registry** with cryptographic signatures, reputation staking, and slashing for malicious servers

### 13.3 Governance Model Recommendations

| Aspect | MCP Current | MEOK Proposal |
|--------|-------------|---------------|
| Decision making | BDFL (2 Lead Maintainers) | BFT validator set (e.g., 21 nodes, tolerate 7 Byzantine) |
| Membership | Individual merit-based | Stake-weighted + reputation |
| SEP process | Core maintainer review | On-chain proposal + voting |
| Security funding | Horizon item | First-class protocol feature |
| Enterprise readiness | No working group | Core protocol layer |

### 13.4 Key Risks to Monitor

1. **Protocol evolution speed**: MCP ships major primitives every ~6 weeks. The BFT layer must be upgradable.
2. **Enterprise adoption path**: Enterprise WG may standardize gateway patterns that conflict with sovereign design.
3. **Security arms race**: Tool poisoning defenses must evolve faster than attack techniques (currently 60-72% success rate).
4. **Regulatory landscape**: EU AI Act, NIS2, DORA compliance requirements emerging for agentic AI.
5. **Competing standards**: A2A (Google), potential AWS/Azure proprietary extensions.

---

## Sources & References

[^35^] tolkonepiu/best-of-mcp-servers — Comprehensive curated list of MCP servers (2026)
[^52^] CSA Research Note — MCP Security Crisis: Systemic Design Flaws (May 2026)
[^53^] MCP.Directory — MCP Foundation 2026: Linux Foundation/AAIF Explained (May 2026)
[^54^] CyberDesserts — AI Agent Security Risks 2026: MCP, OpenClaw & Supply Chain
[^55^] modelcontextprotocol.io — Official MCP Specification (2025-03-26)
[^56^] modelcontextprotocol.io — MCP Draft Specification
[^57^] AI Tinkerers — @modelcontextprotocol/sdk Technology Page
[^58^] Prefect.io — MCP vs Function Calling: When to Use Which (Apr 2026)
[^59^] Obot.ai — MCP vs Function Calling: 7 Key Differences (Feb 2026)
[^60^] Practical DevSecOps — MCP Security Vulnerabilities (Jan 2026)
[^61^] vulnerablemcp.info — The Vulnerable MCP Project Database (Feb 2026)
[^62^] AAAI-26 — MCPTox: A Benchmark for Tool Poisoning Attack on Real-World MCP Servers
[^118^] cidaas.com — Secure MCP Authorization for AI Agents (May 2026)
[^119^] MCPBundles.com — Best MCP Servers in 2026: The Definitive List (Mar 2026)
[^120^] MCP.Directory — Top 10 Most Popular MCP Servers (Feb 2026)
[^121^] modelcontextprotocol.io — Authorization Specification (Draft)
[^122^] WorkOS — Everything Your Team Needs to Know About MCP in 2026 (Mar 2026)
[^123^] Medium — Protecting MCP Server with OAuth 2.1: Go + Keycloak Guide
[^125^] David Okeyode — AI Hands-On Lab: Exploring MCP Servers Public Registries (Feb 2026)
[^127^] Christian Posta — Understanding MCP Authorization, Step by Step (Jun 2025)
[^128^] Auth0 Blog — MCP Spec Updates from June 2025
[^129^] MCP Specification — Streamable HTTP Transport Documentation
[^132^] fka.dev — Why MCP Deprecated SSE and Went with Streamable HTTP (Jun 2025)
[^133^] modelcontextprotocol.info — Exploring the Future of MCP Transports (Dec 2025)
[^35^] tolkonepiu/best-of-mcp-servers — Aggregated GitHub repository data
[^164^] MDPI Electronics — Beyond Tool Poisoning: Attack Surfaces of Malicious Remote MCP Servers (May 2026)
[^165^] MCPManager.ai — MCP Tool Poisoning: How It Works & How To Fight It (Jun 2026)
[^166^] Kong/guidance-for-kong-genai-mcp-and-a2a-gateways-on-aws (Apr 2026)
[^167^] Obot.ai — MCP Gateway: How It Works, Capabilities and Use Cases (Mar 2026)
[^168^] CyberArk — Poison Everywhere: No Output from Your MCP Server Is Safe (May 2026)
[^169^] GitHub — modelcontextprotocol/python-sdk (May 2026)
[^170^] arXiv — MCPTox: A Benchmark for Tool Poisoning (Jul 2025)
[^171^] Effloow.com — Build an AI Agent with MCP and TypeScript in 2026 (May 2026)
[^172^] Medium — The MCP TypeScript SDK: A Complete Guide (Apr 2026)
[^173^] Digital Applied — Build an MCP Server in TypeScript: From Scratch 2026 (May 2026)
[^174^] npmjs.com — @modelcontextprotocol/sdk package page
[^175^] DeepSense.ai — Understanding the Model Context Protocol (Nov 2025)
[^176^] Verdent.ai — Model Context Protocol: Server Guide (Mar 2026)
[^177^] Medium — 6 Critical Challenges Facing the MCP in 2026 (Apr 2026)
[^178^] SkillsLLM.com — Best MCP Servers in 2026: Complete Directory (Apr 2026)
[^179^] OX Security — MCP Supply Chain Advisory: RCE Vulnerabilities (Apr 2026)
[^180^] CSA Research Note — MCP by Design: RCE Across the AI Agent Ecosystem (Apr 2026)
[^182^] NVD — CVE-2026-23744 Detail: MCPJam Inspector RCE
[^184^] WorkOS Blog — MCP 2026 Roadmap (Mar 2026)
[^185^] Oligo Security — Critical RCE in Anthropic MCP Inspector CVE-2025-49596
[^187^] GetKnit.dev — Is MCP the Future of AI Integration? Roadmap 2026 (Apr 2026)
[^189^] LiteLLM Docs — Security Update: CVE-2026-30623 (Apr 2026)
[^190^] The New Stack — MCP's Biggest Growing Pains for Production Use (Mar 2026)

---

*Report generated for MEOK — Sovereign AI OS. Research conducted June 2026 across 12 independent search queries and 50+ primary sources.*
