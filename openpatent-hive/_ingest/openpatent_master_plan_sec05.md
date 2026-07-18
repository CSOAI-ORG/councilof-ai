## 5. SaaS Architecture & PAYG Pricing Model

### 5.1 Architecture Overview

#### 5.1.1 Design Philosophy: Open Core, Hosted Convenience

The OpenPatent.ai architecture follows an explicit "open core, hosted convenience" model. Every component exists in two forms: a freely available MIT-licensed implementation for self-hosting, and a commercially hosted SaaS version charging per-use fees[^1^]. This dual-mode structure is a strategic moat — competitors including Bernstein.io and TimeProof offer only closed-source platforms, while OpenPatent.ai alone provides a local-first option ensuring user data never leaves the host machine unless the user explicitly chooses SaaS convenience[^2^].

The architecture decomposes into four functional layers: Frontend (user interaction), Backend (cryptographic processing and agent orchestration), Blockchain (immutable timestamping), and Storage (document persistence and search indexing). Each layer is independently replaceable, with interfaces defined by open protocols rather than proprietary APIs. A user running the self-hosted PatentMCP server can substitute the default OpenPatent frontend with any MCP-compatible client, or replace the Bitcoin anchoring layer with Ethereum alternatives without modifying core disclosure logic.

#### 5.1.2 The Four-Layer Technical Stack

| Layer | Component | Technology | Function | Self-Hosted Equivalent |
|-------|-----------|------------|----------|----------------------|
| **Frontend** | Drafting UI | Forked OpenPatent (TypeScript/Bun 1.3+) | Local-first AI patent drafting with 6 primary agents | `erdalbektas/OpenPatent` repo[^1^] |
| **Frontend** | Disclosure Dashboard | React 18 + Next.js 14 + shadcn/ui | Upload, verification status, prior art search | Same codebase, local `bun dev` |
| **Backend** | MCP Disclosure Server | PatentMCP Python (FastMCP) | 6-layer cryptographic proof generation | `patent-disclosure-mcp/server.py`[^3^] |
| **Backend** | Agent Orchestration | OpenCode framework | Multi-agent patent workflow coordination | `anomalyco/opencode` upstream[^1^] |
| **Backend** | Identity & Signing | Ed25519 + DID resolution | Inventor cryptographic identity and document signing | Local key generation via CLI |
| **Blockchain** | Primary Anchor | Bitcoin OpenTimestamps (OTS) | Permanent existence proof via Merkle tree aggregation | Free OTS calendar servers[^4^] |
| **Blockchain** | Secondary Anchor | Polygon PoS timestamps | ~2-second confirmation, low-cost redundancy | Polygon Mainnet RPC |
| **Storage** | Document Store | IPFS (content-addressed) | Tamper-evident storage with CID-based retrieval | Local IPFS node or Pinata |
| **Storage** | Metadata Database | PostgreSQL 16 | Disclosure records, user accounts, audit indices | Any Postgres-compatible DB |
| **Storage** | Search Index | Elasticsearch 8.x | Full-text prior art search across the registry | OpenSearch or Meilisearch |
| **Storage** | Audit Chain | Hash-chained sequential log | Tamper-evident sequential disclosure record | Flat file + IPFS pinning[^3^] |
| **Storage** | Public Attestation | verify.meok.ai renderer | Human-readable verification page per disclosure | Static HTML generator |

*Table 1: Complete architecture stack with twelve components across four functional layers. The Self-Hosted Equivalent column identifies the open-source implementation available for local deployment without SaaS fees.*

The twelve-component architecture reflects a deliberate tradeoff between cryptographic assurance and operational practicality. The dual-blockchain design — Bitcoin OTS for permanence plus Polygon for speed — addresses a critical limitation of single-chain timestamping. Bitcoin provides the highest computational security budget of any blockchain, with 15+ years of continuous operation and hashrate-backed immutability[^4^]. However, OTS confirmation typically requires 1–2 hours for block inclusion. Polygon's 2-second block time fills this gap with a preliminary timestamp later reinforced by the Bitcoin anchor. Bernstein.io employs a comparable triple-timestamp strategy (Bitcoin + EU Qualified + China) at enterprise pricing that places it out of reach for individual developers[^5^]. The OpenPatent.ai approach achieves similar redundancy at a fraction of the cost by leveraging free OTS calendar infrastructure and Polygon's sub-$0.01 transaction fees.

The storage layer follows a polyglot persistence pattern. IPFS handles document storage because its content-addressed architecture provides intrinsic integrity verification — change one byte and the CID changes, making tampering immediately detectable[^6^]. PostgreSQL manages structured metadata where relational constraints ensure registry consistency. Elasticsearch powers prior art search, where inverted indexing enables sub-second full-text queries across millions of documents. This three-store approach adds operational complexity, but the performance and integrity benefits are non-negotiable for a system whose core value proposition is cryptographic trust.

#### 5.1.3 Frontend and Backend Integration

The frontend combines two interfaces: a fork of `erdalbektas/OpenPatent` modified to add PatentMCP disclosure triggers at claim drafting completion and document export, and a new React 18 disclosure dashboard built with Next.js 14 and shadcn/ui for visual consistency with the prooof.ai v2 interface. The original OpenPatent UI requires Bun 1.3+, whose startup latency averages 3–5× lower than Node.js for CLI-driven applications[^7^]. The dashboard deploys to Vercel's edge network with Cloudflare R2 for asset storage — services already operational across the CSOAI property portfolio, minimizing incremental infrastructure overhead[^8^].

The backend centers on the PatentMCP Python server implementing the six-layer cryptographic pipeline: (1) SHA-3/512 document hashing, (2) HMAC-SHA256 witness signing, (3) Ed25519 inventor signature, (4) Bitcoin OTS blockchain anchoring, (5) C2PA Content Credential embedding, and (6) hash-chained audit log entry[^3^]. Each layer uses a distinct cryptographic primitive, ensuring that compromise of any single key or algorithm does not invalidate the entire proof. The server exposes tools through the Model Context Protocol (MCP), which has grown to over 10,000 active public servers with 97 million monthly SDK downloads across Python and TypeScript[^9^]. Anthropic's December 2025 donation of MCP to the Linux Foundation's Agentic AI Foundation, co-founded with Block, OpenAI, Google, Microsoft, and Cloudflare, cemented its status as the de facto standard for AI-tool integration[^10^]. Building PatentMCP as an MCP server provides immediate distribution across this ecosystem without protocol adaptation.

Agent orchestration is handled by the OpenCode framework, the same upstream platform powering OpenPatent. OpenCode coordinates multi-step patent workflows: document preparation (OpenPatent draft agent) → cryptographic processing (PatentMCP server) → verification page generation → registry publication → payment processing (x402 protocol). This orchestration is transparent to the user but essential for maintaining workflow consistency across independently developed components.

### 5.2 PAYG Pricing Tiers

#### 5.2.1 Tier Structure and Competitive Positioning

The Pay-As-You-Go model aligns revenue directly with value delivered: users pay only when creating a cryptographically verified disclosure, not for platform access. This contrasts with subscription-dominant IP software, where firms pay annual fees of $5,000–$50,000 regardless of usage[^11^]. The five-tier structure maps directly to the six-layer cryptographic pipeline, with each successive tier unlocking additional proof layers and services.

| Tier | Price | Cryptographic Coverage | Key Deliverables | Target User | Comparable Market Price |
|------|------:|----------------------|------------------|-------------|------------------------|
| **FREE** | $0 | Layers 1–2 (local) | Self-hosted PatentMCP + OpenPatent, SHA-3/512 + local HMAC, community support | Individual developers, open-source contributors | N/A — no comparable self-hosted option exists[^1^] |
| **DEFENSIVE** | $10 | All 6 layers | Bitcoin OTS anchoring, Polygon timestamp, public attestation page, 1-year verification, registry entry | Solo inventors, indie hackers, pre-revenue startups | Bernstein.io: €29–€99; TimeProof: €15–€45[^5^] |
| **FULL** | $50 | All 6 + C2PA credential | Everything in Defensive plus C2PA Content Credential, Ed25519 signing, hash-chain audit certificate, downloadable proof package, priority support | SMEs, patent-aware startups, research labs | IP.com: $295–$1,500 per publication[^12^] |
| **PREMIUM** | $100 | All 6 + C2PA + AI drafting | Everything in Full plus OpenPatent AI drafting integration, prior art landscape search, claim analysis, expedited Bitcoin confirmation (<30 min) | Series A–B startups, budget IP law firms, corporate IP | PatSnap equivalent: $15,000–$50,000/year[^11^] |
| **ENTERPRISE** | $500/mo | All 6 + API + white-label | Unlimited disclosures, REST API, white-label pages, team management (10 seats), custom integrations, 99.9% SLA | Mid-market tech, law firms, research institutions | Clarivate/Questel: $25,000–$100,000/year[^11^] |

*Table 2: Five-tier PAYG pricing with cryptographic coverage, deliverables, target users, and competitive benchmarks. Prices in USD. Enterprise is monthly; others are per-disclosure.*

The pricing architecture reveals deliberate undercutting of incumbent defensive publication venues. IP.com's publishing vouchers start at approximately $295 for documents up to 25 pages, scaling to $1,500+ for larger submissions[^12^]. Bernstein.io charges €29–€99 per disclosure; TimeProof offers Polygon-only timestamps at €15–€45 but lacks multi-layer cryptographic depth[^5^][^13^]. The DEFENSIVE tier at $10 undercuts the lowest-cost competitor (TimeProof) by approximately 33% while providing six independent cryptographic layers versus one or two. This positioning is sustainable because the marginal cost of blockchain anchoring is near-zero: OTS calendar submission is free, and Polygon transaction fees average $0.001–$0.01 per anchor[^14^].

The FULL tier at $50 represents the primary revenue driver. The addition of C2PA Content Credentials provides machine-verifiable proofs compatible with automated patent office examination tools and enterprise compliance scanners. The C2PA specification v2.4 defines a COSE-based signing format using Ed25519 as the allowed EdDSA instance, with SHA-256 content binding producing tamper-evident manifests[^15^]. Production C2PA certificates from DigiCert or GlobalSign cost $50–$500 annually, but PatentMCP uses self-signed Ed25519 credentials within the C2PA manifest structure, eliminating this recurring cost while maintaining cryptographic validity[^16^].

The PREMIUM tier integrates OpenPatent AI drafting, transforming the platform from a pure disclosure tool into a full patent lifecycle solution targeting the gap between DIY defensive publication and full-service attorney engagement ($15,000–$50,000 per application)[^11^]. The ENTERPRISE tier at $500/month introduces recurring revenue through unlimited disclosures, API access for CI/CD integration, white-label verification pages, and team management — directly aligned with the Industry Power Packs strategy positioning bundled MCP services at $50–$500 per month[^17^].

#### 5.2.2 Payment Processing and Unit Economics

All paid tiers use the x402 micropayment protocol, enabling sub-dollar transactions without the 2.9% + $0.30 credit card minimum that makes sub-$10 transactions uneconomical[^3^]. For a $10 DEFENSIVE disclosure, credit card processing would consume $0.59 (5.9%) in fees; x402 reduces this to approximately $0.01–$0.05 (0.1–0.5%). The protocol also enables machine-to-machine payments, a critical capability for the MCP ecosystem where AI agents may autonomously file disclosures.

Variable cost per disclosure is approximately $0.50–$2.00: OTS submission ($0), Polygon transaction ($0.001–$0.01), IPFS pinning ($0.05–$0.50), database operations ($0.01–$0.05), Elasticsearch indexing ($0.01–$0.05), and compute/egress ($0.42–$1.39)[^8^][^14^]. At the $10 DEFENSIVE price point, gross margin is 80–95%. Enterprise economics are stronger still: $500/month implies breakeven at approximately 250–1,000 disclosures per month, with margins exceeding 95% for typical usage of 50–200 monthly disclosures across a 10-seat team.

#### 5.2.3 The Self-Hosted Escape Valve

The FREE tier functions as a "self-hosted escape valve" eliminating vendor lock-in. Users can export disclosure data and run the full stack locally without losing cryptographic functionality. Only blockchain anchoring (still free via OTS calendars) and the public attestation page (self-hostable at the user's domain) degrade. This portability is contractually guaranteed by the MIT license on both PatentMCP and OpenPatent — no future licensing change can revoke self-hosting rights. Bernstein.io, TimeProof, and IP.com provide no self-hosted equivalent; user data and proofs are inseparable from their platforms[^5^][^12^][^13^].

### 5.3 Revenue Projections

#### 5.3.1 Conversion Rate Assumptions

ChartMogul's 2026 analysis of 200 products found freemium models average 5.6% free-to-paid conversion, with the 75th percentile at 8–12%[^18^]. Open-source self-hostable products typically convert at 3–5% because the self-hosted option permanently satisfies users who would otherwise pay[^19^]. The following projections assume 4% conversion and assume higher visitor-to-signup rates (9% versus the 4.5% SaaS average) because the "free and open source forever" positioning eliminates trust barriers[^18^].

#### 5.3.2 Three-Scenario Revenue Model

| Scenario | Timeline | Paying Users | MRR | ARR | Key Assumptions |
|----------|----------|-------------:|-----:|-----:|-----------------|
| **Conservative** | Month 6 | 100 | $3,500–$5,000 | $42K–$60K | Organic growth via Hacker News, Reddit, GitHub; 4% conversion; no paid acquisition[^20^] |
| **Conservative** | Month 12 | 400 | $14K–$20K | $168K–$240K | Word-of-mouth acceleration; first enterprise trial ($500/mo) |
| **Target** | Month 6 | 500 | $17,500–$25,000 | $210K–$300K | Product Hunt launch; LinkedIn campaigns to founders; MCP integration drives adoption[^21^] |
| **Target** | Month 12 | 1,500 | $75K–$100K | $900K–$1.2M | Patent attorney partnerships; Hermes integration; Industry Power Pack bundling |
| **Optimistic** | Month 6 | 800 | $28K–$40K | $336K–$480K | Viral GitHub growth (>500 stars); tech media coverage; YC network adoption |
| **Optimistic** | Month 12 | 3,000 | $150K–$200K | $1.8M–$2.4M | 10+ enterprise contracts; white-label API embedded in legal tech platforms |
| **Optimistic** | Month 18 | 5,000+ | $300K–$500K | $3.6M–$6M | Enterprise >50% of revenue; API exceeds SaaS usage; international expansion[^22^] |

*Table 3: Three-scenario revenue projections over 18 months. MRR and ARR in USD. Conservative and Target show Month 6 and 12; Optimistic adds Month 18.*

The revenue model illustrates the asymmetric economics of open-source SaaS. In the Conservative scenario, the platform reaches approximately $200K ARR by Month 12 — a modest but bootstrapped-profitable outcome given low marginal costs per disclosure ($0.50–$2.00). The Target scenario approaches $1.2M ARR by Month 12, assuming successful Product Hunt exposure, attorney partnership referrals, and MCP ecosystem compounding effects. The critical inflection point occurs between Month 6 and 9, when enterprise discussions initiated in Month 3–4 convert to signed agreements.

The Optimistic scenario's $3.6–$6M ARR by Month 18 depends on two catalysts: (1) recognition of the prior art registry by patent examination offices as a database of record, driving mandatory enterprise adoption; and (2) white-label API integration by legal technology platforms embedding PatentMCP into existing workflows. Both are plausible but not guaranteed — patent office partnerships typically require 12–24 month evaluation cycles, and platform integrations depend on demonstrated user demand.

#### 5.3.3 Risk Factors

Three risks could materially reduce projections. First, the fully functional free tier caps conversion at 4–6% versus 8–12% for SaaS without viable self-hosted alternatives[^18^]. Users installing PatentMCP locally and connecting to free OTS calendars achieve roughly 80% of the SaaS platform's cryptographic capability at zero cost. The platform must compete on convenience rather than functionality.

Second, the defensive publication market is education-intensive. Most inventors, including many patent attorneys, are unfamiliar with defensive publication as an alternative to traditional patent filing[^23^]. Enterprise sales cycles may extend to 3–6 months as decision-makers evaluate defensive publication against provisional patents ($1,500–$15,000) and trade secret protection, increasing customer acquisition cost and extending payback periods.

Third, Bitcoin network fee volatility introduces unpredictable costs for the DEFENSIVE tier. While OTS aggregation keeps per-disclosure costs near zero during normal conditions, fee spikes during congestion (historically $5–$50 per transaction in 2024–2025) could compress margins or force temporary price increases[^24^]. The Polygon secondary anchor mitigates this risk by providing a low-cost fallback, but users paying for Bitcoin anchoring specifically expect Bitcoin confirmation regardless of market conditions.

These risks are manageable but require proactive mitigation. The education gap can be addressed through content marketing targeting patent attorney communities and open-source developer forums, where the "patent troll defense" narrative resonates strongly with independent developers who have direct experience with predatory patent assertions. The Bitcoin fee risk can be hedged through a dynamic pricing buffer — adding $1–$2 to the DEFENSIVE tier during high-congestion periods, with transparent fee explanation on the payment page. The self-hosted competition is arguably a feature rather than a bug: users who self-host and later require the convenience of SaaS represent a pre-qualified conversion pipeline with zero acquisition cost.
