## 11. 90-Day Execution Roadmap

The preceding chapter established seven strategic initiatives and a three-year revenue trajectory rising from $95K–$200K in Year 1 to $1.5M–$4.45M by Year 3. This chapter converts that blueprint into specific actions, milestones, and metrics for the first 90 days — the window during which market position is either captured or ceded. Every initiative here is assigned a timeline, a measurable output, and an owner. The roadmap is designed to generate cash flow by Day 60 while building the platform infrastructure that enables Year 2 scale. Speed of execution compounds: a verified registry launched 30 days ahead of a competitor becomes the default standard not because it is superior, but because it is first [^166^].

The plan is organized into three phases — Foundation, Revenue Activation, and Scale — with hard gate criteria at each transition. The following Gantt-style timeline maps all 18 workstreams.

![MEOK ONE: 90-Day Execution Roadmap](chart_sec11_90day_timeline.png)

The chart reveals the sequencing logic: Phase 1 builds assets required to sell; Phase 2 activates revenue against those assets; Phase 3 scales the ecosystem using revenue-funded engineering. Overlap between phases is intentional — the payment routing MVP begins before the meok.one hub is fully complete, ensuring zero idle time between foundation work and revenue capture.

### 11.1 Phase 1: Foundation (Days 1–30)

Phase 1 has a single objective: make MEOK ONE discoverable, credible, and ready to transact. Five parallel workstreams deliver the minimum viable infrastructure across all seven strategic initiatives. The phase succeeds when all four properties (mcps.dev, assitti.com, lib2bp specification, meok.one) are live, indexed, and capable of accepting registrations.

#### 11.1.1 Launch mcps.dev as MCP Server Directory with Verification and Security Scoring

The first deliverable is a public directory at mcps.dev listing discoverable MCP servers with a multi-factor trust score. The directory scrapes the official MCP registry (9,652 records), GitHub, and third-party sources to build the most comprehensive MCP server index outside Anthropic's own tooling [^166^]. Each server receives a composite score based on uptime verification, source code availability, publisher identity, update recency, and automated security scan results. The scoring model adapts npm's package health metrics and ENS's reputation systems — both proven at scale [^337^].

Day 1–5: Infrastructure setup. Day 6–12: Data ingestion pipeline for 500+ servers. Day 13–18: Verification engine v1 — automated conformance testing against MCP specifications. Day 19–25: Security scoring — exposed port detection, authentication verification, vulnerability flagging. Day 26–30: Public launch with API access and developer onboarding. With 1,467 exposed MCP servers identified as the primary attack vector [^168^], a directory that flags exposure status provides immediate value no competing registry offers.

#### 11.1.2 Publish lib2bp Specification Whitepaper — Define the Library-to-Business-Process Protocol

Days 10–24 deliver the lib2bp Protocol Specification v0.1 — a technical whitepaper defining the standard for converting software libraries into executable business processes. The specification positions lib2bp as complementary to MCP (tool connectivity) and A2A (agent coordination), filling the gap between code libraries and business workflows. Publication follows the Kubernetes playbook: open specification, permissive license, explicit invitation for community contribution, and a reference implementation timeline. Distribution targets Hacker News, relevant subreddits, the MCP community Discord, and direct outreach to 50 engineering leaders in agent infrastructure.

#### 11.1.3 Set up assitti.com as Agent Discovery Service — Index Agent Cards from Across the Web

assitti.com launches as the canonical directory for A2A Agent Cards — the discovery mechanism defined by Google's A2A protocol that currently lacks any centralized index [^2^]. The service crawls known A2A deployments, indexes Agent Card metadata (capabilities, pricing, reputation), and provides a searchable interface for developers seeking agents. Day 8–12: Crawler development. Day 13–18: Search and filter interface. Day 19–24: Verification layer — protocol handshake validation. Day 25–30: Public launch with API access. The initial target indexes 100+ agents from the 150+ A2A partner organizations, creating the largest verified agent directory at launch [^2^].

#### 11.1.4 Establish meok.one as Central Hub with ENS-Style Subname Architecture

meok.one becomes the unified entry point for the ecosystem. Day 5–15: Hub infrastructure — landing page, navigation, unified branding. Day 10–20: Subname architecture following the ENS model, which generated $55 million in protocol revenue through registration fees ranging from $5 to $640 per year [^337^]. The architecture supports free basic subnames, premium verified subnames ($50–200/year), and enterprise branded subdomains ($500+/month). Day 20–30: Integration layer connecting meok.one identity to mcps.dev verification, assitti.com agent profiles, and security scoring. Uniswap's uni.eth program reached 2 million usernames in 18 months through free registration with verified identity [^dim12^] — a model replicated here to maximize adoption velocity.

### 11.2 Phase 2: Revenue Activation (Days 31–60)

Phase 2 converts Phase 1 assets into paying customers and recurring revenue. The gate criterion for entering Phase 2 is completion of all four foundational properties; the gate for exiting Phase 2 is at least $3,000 in MRR and one signed enterprise consulting engagement.

#### 11.2.1 Launch MCP Server Security Scanning Service — Target 1,467 Exposed Servers as Initial Market

The security scanning service monetizes data already collected by the mcps.dev verification engine. The addressable market is quantified: 1,467 exposed MCP servers represent organizations with inadequate security posture, each a potential monitoring customer [^168^]. The service offers a free tier (basic exposure scan published in directory), professional tier ($99/month — continuous monitoring, alerting, compliance reporting), and enterprise tier ($499/month — runtime protection, audit trails, SIEM integration). Pricing is calibrated against certificate authority models ($50–500/year for SSL verification) and the 88% security incident rate among organizations deploying agent infrastructure [^168^]. Day 31–40: Payment infrastructure, tiered access, automated report generation. Day 41–47: Outreach targeting the 1,467 exposed server operators with personalized vulnerability reports. Day 48–60: Conversion optimization and enterprise pipeline building.

#### 11.2.2 Deploy Payment Routing MVP Integrating x402 and AP2 — Capture Early Commerce Flow

The payment router MVP demonstrates protocol interoperability by routing transactions between Coinbase's x402 and Google's AP2 — two of the seven to eight competing commerce protocols [^86^]. The MVP proves: (1) technical feasibility of multi-protocol routing, (2) data generation for the observability layer, (3) relationships with protocol developers, and (4) demonstrable traction for investors. Day 35–45: x402 integration — payment intent parsing, settlement handling. Day 40–50: AP2 integration — Google Pay flow, agent authentication. Day 48–55: Routing logic — optimal path selection, fee estimation. Day 53–60: Demo environment with sample merchant integrations. The $3–5 trillion agentic commerce projection by McKinsey [^135^] provides macro justification; the MVP provides micro proof that MEOK ONE can capture value from that flow.

#### 11.2.3 Launch First Vertical Solution (Cybersecurity) at cyber.meok.one

Vertical-specific solutions outperform horizontal platforms: 35% faster growth (62.7% vs. 46.3% CAGR), higher willingness to pay, and shorter sales cycles [^583^]. Cybersecurity is the first vertical because it commands a $22.56 billion market [^619^], the security scanning service provides immediate product-market fit validation, and the 1,467 exposed MCP servers represent a qualified lead list [^168^]. cyber.meok.one offers pre-built MCP server packs for threat detection, A2A agent templates for security orchestration, and compliance reporting for SOC 2 and ISO 27001. Day 38–47: Branding, content, server pack curation. Day 44–53: Five cybersecurity A2A agent templates. Day 50–60: CISO outreach and first paying customer close.

#### 11.2.4 Begin EU AI Act Compliance Toolkit Development — 12-Month Arbitrage Window

The EU AI Act's August 2026 enforcement creates a compliance tooling market projected at $5–50 million annually for first movers [^536^]. The toolkit targets data governance, human oversight, and conformity assessment requirements for agent-based AI systems. Day 42–50: Regulatory mapping. Day 48–58: v0.1 toolkit — audit trail generation, risk classification templates, DPIA workflow. The toolkit uses a freemium model: basic templates free, automated compliance scanning at $299/month per deployment.

### 11.3 Phase 3: Scale and Ecosystem (Days 61–90)

Phase 3 transitions from individual product launches to ecosystem orchestration — the model CNCF and Protocol Labs have demonstrated at scale. CNCF platinum membership commands $500,000 per year [^663^]; Protocol Labs coordinates 600+ partners across IPFS, Filecoin, and libp2p [^dim12^]. The objective is to position meok.one as the equivalent coordination layer for agent protocols.

#### 11.3.1 Onboard 50+ Verified MCP Servers, 20+ Verified A2A Agents to Directory

Days 61–79 focus on supply-side growth. The mcps.dev directory targets 50 verified MCP servers by Day 90 — a 10× increase from the initial 5–10 at Day 30. assitti.com targets 20 verified A2A agents. Growth combines direct outreach to developers, CI/CD pipeline integration for automatic verification, a "Verified" badge program, and developer referral incentives. Each verified listing strengthens the network effect: more servers attract more users; more users attract more developers seeking visibility.

#### 11.3.2 Launch meok.one Membership Program — Platinum/Gold/Silver Tiers

The membership program follows the CNCF tiered model. Silver ($5,000/year) provides priority directory listing and community access. Gold ($25,000/year) adds speaking slots, co-marketing, and early protocol access. Platinum ($100,000/year) includes advisory board participation and custom integration support. Day 65–72: Tier definition, benefits packaging, application portal. Day 70–79: Outreach to 150+ A2A partner organizations [^2^] and top 100 MCP server publishers. Day 77–90: Close founding members and announce inaugural cohort.

#### 11.3.3 Host First Virtual Agent Protocol Summit — Establish Thought Leadership

Days 72–84 culminate in a virtual summit convening protocol developers, enterprise adopters, and investors. Format: keynotes from protocol creators (MCP, A2A, ACP), security and compliance panels, product demos from verified members, and investor office hours. Target: 500+ registered participants. The summit drives thought leadership, lead generation, content creation, and investor relationship building — all at a cost below $5,000 through the virtual format.

#### 11.3.4 Prepare Series A Pitch — $5–15M Target Based on Traction and Domain Portfolio

Days 75–90 produce a Series A pitch deck targeting $5–15 million. The pitch grounds itself in 90-day traction metrics (verified servers, MRR, memberships, summit attendance) combined with the irreplaceable domain portfolio. Comparables include Protocol Labs ($204M raised) [^dim12^], Nevermined ($7 million for agent payment rails) [^408^], and HashiCorp ($6.4 billion enterprise value on open-source infrastructure monetization) [^232^]. The deck positions MEOK ONE as the only entity spanning namespace trust, security, payment routing, agent discovery, and vertical applications — with domain assets (mcps, a2a, acp, lib2bp, assitti, meok.one) that no competitor can replicate regardless of capital.

The table below consolidates all Phase 1–3 deliverables, their owners, and gate criteria:

| Phase | Deliverable | Owner | Start | Duration | Success Gate |
|:---|:---|:---|---:|---:|:---|
| 1 | mcps.dev directory (500+ servers indexed) | Engineering Lead | Day 1 | 18 days | Directory live, API accessible |
| 1 | lib2bp whitepaper v0.1 published | Protocol Architect | Day 10 | 14 days | 100+ downloads, 5+ comments |
| 1 | assitti.com agent directory (100+ agents) | Engineering Lead | Day 8 | 16 days | Crawler operational, search functional |
| 1 | meok.one hub + subname system | Product Lead | Day 5 | 20 days | Registration flow complete |
| 1 | MVP security scanner | Security Engineer | Day 15 | 12 days | Exposed server detection validated |
| 2 | Paid security scanning service | Product Lead | Day 31 | 16 days | First paying customer |
| 2 | Payment routing MVP (x402 + AP2) | Engineering Lead | Day 35 | 18 days | Demo transaction successful |
| 2 | cyber.meok.one vertical launch | Vertical Lead | Day 38 | 15 days | Site live, 3+ server packs |
| 2 | EU AI Act toolkit v0.1 | Compliance Lead | Day 42 | 16 days | Templates published, first user |
| 2 | First enterprise consulting engagement | CEO | Day 50 | 8 days | Signed SOW, $10K+ value |
| 3 | 50+ verified MCP, 20+ A2A agents | Growth Lead | Day 61 | 18 days | Verification count targets met |
| 3 | Membership program launch | BD Lead | Day 65 | 14 days | 3+ founding members committed |
| 3 | Virtual Agent Protocol Summit | Events Lead | Day 72 | 12 days | 500+ registrations |
| 3 | Series A pitch deck | CEO + CFO | Day 75 | 14 days | Deck complete, 5+ investor meetings |

The execution matrix reveals deliberate resource sequencing: a single engineering lead carries technical work in Phase 1, while Phase 2 introduces specialized roles (vertical lead, compliance lead, BD lead) funded by early revenue. This staffing model — one technical generalist plus founder oversight in Month 1, expanding to five specialized roles by Month 3 — aligns headcount growth with revenue validation.

### 11.4 Key Metrics and Success Criteria

The 90-day plan succeeds or fails against quantified monthly targets. The following table defines KPIs, targets, and measurement methodology.

| Metric Category | KPI | Month 1 Target | Month 2 Target | Month 3 Target | Measurement Source |
|:---|:---|---:|---:|---:|:---|
| **Traffic** | Unique visitors (all properties) | 1,000 | 5,000 | 15,000 | Plausible Analytics |
| **Directory** | Verified MCP servers | 50 | 200 | 500 | mcps.dev database |
| **Directory** | Indexed A2A agents | 20 | 50 | 100 | assitti.com database |
| **Revenue** | MRR from security scanning | $0 | $3,000 | $15,000 | Stripe dashboard |
| **Revenue** | Enterprise consulting bookings | $0 | $10,000 | $25,000 | Signed contracts |
| **Revenue** | Payment router transaction volume | $0 | $500 | $5,000 | Router transaction log |
| **Product** | Security scans completed | 10 (beta) | 100 | 500 | Scanner execution log |
| **Product** | lib2bp specification downloads | 100 | 500 | 2,000 | CDN download counter |
| **Community** | Summit registrations | — | — | 500 | Event platform |
| **Community** | Membership signups | — | 5 (waitlist) | 15 (paid) | Member portal |
| **Ecosystem** | Vertical solutions live | 0 | 1 (cyber) | 3 (+finance, legal) | Subdomain status |
| **Funding** | Investor meetings held | 0 | 3 | 12 | CRM pipeline |

The Month 1 target of 1,000 unique visitors and 50 verified servers establishes baseline credibility — enough traffic to demonstrate interest, enough listings to prove the verification model. The Month 2 inflection to $10,000 in consulting bookings and $3,000 MRR validates that the security scanning service commands willingness to pay. The 88% security incident rate [^168^] provides demand-side justification; the 1,467 exposed servers provide the lead list. By Month 3, the combined $25,000 MRR target across security scanning and consulting, plus 500 verified servers and 3 live vertical solutions, provides sufficient traction for a credible Series A conversation.

The critical dependency across all metrics is the security scanning service. If it fails to convert exposed server operators into paying customers, the revenue plan collapses and Phase 3 scaling investments cannot be funded. The mitigating factor is consulting revenue: the 46% PoC failure rate in enterprise AI deployments [^41^] creates a large addressable market for 90-day production framework engagements at $10,000–$50,000 each. Consulting serves as a revenue floor — it funds continued platform development even if SaaS adoption lags.

The 90-day window closes with a board review against all targets. Success is defined as: MRR ≥ $10,000 (conservative) or ≥ $25,000 (optimistic), 500+ verified MCP servers, 100+ indexed A2A agents, 3 vertical solutions live, 15+ membership commitments, and 12+ investor meetings. Achievement of conservative targets positions MEOK ONE for a $2–5 million seed round; achievement of optimistic targets supports the full $5–15 million Series A pitch. Failure to hit conservative Month 1 traffic and directory targets (1,000 visitors, 50 verified servers) triggers a pivot review — reassessing whether the namespace-first strategy requires additional technical differentiation or a revised go-to-market motion.

The EU AI Act timeline provides an external forcing function. With full enforcement projected for August 2026 — approximately 12 months from roadmap initiation — the 90-day execution establishes the compliance toolkit as the first-mover solution in a market where European enterprises must comply but lack established vendor relationships. Every month of delay is a month in which Datadog, LangSmith, or emerging competitors capture the security budgets that the compliance deadline will unlock [^536^]. The 90-day roadmap is not merely a plan — it is the minimum viable pace to capture a market position that becomes structurally more difficult to claim with each passing quarter.
