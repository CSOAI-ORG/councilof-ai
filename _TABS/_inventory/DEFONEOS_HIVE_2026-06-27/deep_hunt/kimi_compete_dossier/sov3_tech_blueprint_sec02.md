# SOV3 Technical Blueprint — Chapters 5-8: Competitive Intelligence, Architecture & Build Plan

**Classification:** Internal Technical Strategy — Engineering & Product Teams  
**Date:** July 2025  
**Source Material:** UI/UX competitive analysis (10 vendors), technical architecture reverse-engineering (15 platforms), full website reconnaissance (13 companies)

---

## 5. UI/UX Competitive Intelligence

### 5.1 UX Score Rankings

We analyzed 10 competitor platforms across five UX dimensions: information density, navigation complexity, onboarding friction, dashboard design quality, and verified user sentiment. Every score is grounded in G2/Capterra/TrustRadius reviews, live demo analysis, and onboarding flow tests.

| Company | UX Score | Information Density | Navigation | Onboarding | Key Pattern |
|---------|----------|-------------------|------------|------------|-------------|
| **Wiz** | 8/10 | Low-Medium | Simple | Agentless deploy | Security graph |
| **Vanta** | 7.5/10 | Low-Medium | Simple | Checklist + progress | Compliance bars |
| **Credo AI** | 7/10 | Medium | Moderate | Demo-only gate | Radar trust charts |
| **Drata** | 7/10 | Medium | Moderate | Guided setup | Trust Dashboard |
| **Cranium** | 6.5/10 | Low-Medium | Simple | Demo-only | Pipeline view |
| **Zenity** | 6/10 | Medium | Moderate | Video demos | Agent orbit viz |
| **WitnessAI** | 5.5/10 | Medium | Moderate | Demo + tour | 4-quadrant layout |
| **OneTrust** | 5/10 | Very High | Very Complex | 3-month impl | Modular cards |
| **ServiceNow** | 5/10 | High | Very Complex | Consultant req | Form-heavy UI |
| **CrowdStrike** | 4.5/10 | Very High | Very Complex | Week+ training | SIEM console |

**Key insight:** The market splits cleanly. Security-first platforms (CrowdStrike, OneTrust) score 4.5-5.5 — powerful but punishing. Modern disruptors (Wiz, Vanta, Drata) score 7-8 by prioritizing speed-to-value over feature count. SOV3 must build in the 7.5-8.5 range from day one.

### 5.2 Best UX to Copy: Wiz (8/10)

Wiz proves that security products do not need to look intimidating. Their homepage is a masterclass in **confident minimalism**: bold headline, one paragraph, email form, customer logos. No cookie popup. No clutter. No fear-mongering.

**What makes Wiz's UX exceptional:**
- **"Single pane of glass"** — one unified view of all cloud security, no module-hopping. Customer quote from a Blackstone CSO: "Wiz provides a single pane of glass to see what is going on in our cloud environments."
- **Agentless deployment** — zero friction to start collecting data. No endpoint agents, no browser extensions, no reboots.
- **Security graph concept** — transforms overwhelming cloud complexity into a navigable relationship graph that users intuitively understand.
- **Whitespace-heavy design** — proves security UI can breathe. The homepage has more empty space than most enterprise landing pages have total content.
- **792 G2 reviews** validate that the simplicity scales to enterprise needs.

**SOV3 copy list:**
1. Agent governance graph — a Wiz-style "single pane of glass" showing every AI agent, its connections, risk posture, and compliance status in one navigable view.
2. Agentless first deployment — connect via API keys, not endpoint agents. <5 minutes from signup to first agent visible.
3. Bold minimalism — dark mode, whitespace, no alert fatigue.
4. Customer logo wall — social proof above the fold.

### 5.3 Worst UX to Avoid: CrowdStrike (4.5/10)

CrowdStrike Falcon embodies everything wrong with legacy security UX. It is a SIEM-style console built for SOC analysts who have "a solid week or two" to learn the interface. That is not a UX compliment — it is an admission of failure.

**What makes CrowdStrike's UX toxic:**
- **Alert fatigue is the #1 user complaint.** "Early on, some teams report 'alert fatigue' when settings aren't tuned." Untuned settings producing fatigue is a design failure, not a user failure.
- **SIEM-style density** — dense data tables, real-time threat streams, process rollups. Every pixel is filled. Nothing is prioritized.
- **Requires dedicated security analysts** — the console is unusable by developers, compliance officers, or legal teams. This limits adoption to one persona.
- **Custom query language** for dashboards — users must learn a query syntax to build widgets.
- **July 2024 outage** — a faulty channel file update caused global Windows BSOD. Destroyed trust in the platform's reliability.
- **Trustpilot: 1-star reviews** from non-enterprise users caught in the outage.

**SOV3 anti-pattern list:**
1. No raw alert streams — actionable insights only, aggregated by agent and risk tier.
2. No query languages for dashboards — pre-built widgets, point-and-click customization.
3. No week-long learning curves — every feature discoverable in <30 seconds.
4. No endpoint-only perspective — serve governance, security, legal, and compliance personas from one UI.

### 5.4 Best Onboarding: Vanta (7.5/10)

Vanta's onboarding is the gold standard for compliance tooling. Their 4-step checklist — Connect tools → Remediate tests → Upload evidence → Find auditor — transforms an overwhelming compliance process into an achievable sequence.

**What makes Vanta's onboarding work:**
- **Checklist with progress bars** — visual completion tracking triggers dopamine. Users see 0% → 25% → 50% → done.
- **Welcome chatbot** — "How can we help you today?" reduces first-time anxiety without being intrusive.
- **Left sidebar icon navigation** — minimal, clean, no text overload. Home, Tasks, Frameworks, People, etc.
- **Code snippet cards** — AWS CLI commands with a copy button. Developers love this.
- **Remediation badges** — green "Remediation complete" status. Gamification without gamifying.
- **1,818 G2 reviews at 4.6/5** — market validation that the UX works at scale.

**SOV3 copy list:**
1. 5-step onboarding checklist: (1) Connect first AI agent, (2) Set first policy, (3) Review agent inventory, (4) Invite team, (5) Customize dashboard.
2. Progress bar to "first insight" — gamify the setup experience.
3. Welcome chatbot — natural language help, not a manual.
4. Pre-loaded sample data — dashboard populated on first login so users see value immediately.

### 5.5 Credo AI's Intelligence (7/10)

Credo AI has the most visually sophisticated AI governance interface on the market. Their dark-mode default, animated governance flow diagram (Unmanaged → Governance → Trusted), and radar/spider charts for multi-dimensional trust scoring are best-in-class patterns.

**What Credo AI gets right:**
- **Dark mode default** — signals technical sophistication. Security and governance professionals prefer dark UIs.
- **Radar trust charts** — six-dimensional spider charts showing Bias, Compliance, Security, Privacy, Safety, Reliability at a glance. Instant visual comprehension of an AI system's trust posture.
- **Governance flow diagram** — the hero animation communicates the entire value proposition in 3 seconds.
- **12 Forrester Perfect Scores** — third-party validation of feature depth.
- **Stats callouts** — "10x Faster Compliance," "60% Faster Reviews." Concrete numbers, not fluff.

**What Credo AI gets wrong:**
- **Demo-only gate** — no self-service signup. Every prospect must book a demo. This kills developer adoption and mid-market velocity.
- **Cookie consent popup managed by Usercentrics** — ironic friction for an AI governance company.
- **No public user feedback** — Gartner Peer Insights shows zero reviews. The UX claims are unvalidated by real users.

### 5.6 The Demo Gate Problem

Eight of the ten competitors we analyzed require demo signup before product access: Credo AI, Cranium, WitnessAI, Zenity, OneTrust, Holistic AI, MetricStream, Optro. Only Wiz (agentless deployment) and Vanta (self-serve with free trial) offer genuine self-service paths.

**Why the demo gate is a strategic vulnerability:**
- **Developer adoption dies** — developers do not book demos. They sign up, try, and decide in 10 minutes. No self-serve = no developer mindshare.
- **Mid-market exclusion** — companies with <$50K procurement budgets cannot justify a sales call. The demo gate self-selects for enterprise, leaving 90% of the market unserved.
- **Competitive friction** — every hour between intent and first value is an hour the prospect can evaluate a competitor.
- **WitnessAI's product page 404** — the worst-case scenario. A prospect clicks "Product" and gets a dead page. Trust destroyed instantly.

**SOV3 rule:** Self-service signup, no credit card required, pre-loaded sample data, <5 minutes to first insight. Demo option available for enterprise prospects who want it — but never required.

### 5.7 SOV3 UX Target Design

The target is **"Wiz-Simplicity meets Credo AI Intelligence"** — a dark-mode, single-pane dashboard with radar trust charts, Vanta-style checklist onboarding, and agentless deployment. Every design decision must answer one question: can a developer with no compliance background get value in under 5 minutes?

**Design principles:**
1. **Dark mode default** — security/governance professionals expect it. Light mode optional.
2. **Single pane of glass** — one unified view. No module-hopping, no tab-switching, no "settings inside settings."
3. **Radar trust charts** — Credo-style multi-dimensional trust scoring. Bias, Compliance, Security, Privacy, Safety, Fairness.
4. **Checklist onboarding** — Vanta-style 5-step setup with progress bars.
5. **Agentless deployment** — API keys, not endpoint agents. Connect and see results in <5 minutes.
6. **Maximum 5 nav sections** — Dashboard, Agents, Policies, Reports, Settings. No more.
7. **Command bar navigation** — type `/` to search agents, policies, violations, docs. Everywhere.
8. **<2 clicks to any action** — flat navigation hierarchy. No buried features.
9. **Contextual help tooltips** — every UI element has a ? tooltip explaining what it does and why it matters.
10. **Transparent pricing** — no "contact sales" pricing gates. Plans visible on the website.

### 5.8 Recommended Dashboard Architecture

The SOV3 dashboard is a four-quadrant layout combining the best patterns from all competitors:

| Quadrant | Pattern Source | Content |
|----------|---------------|---------|
| **Top-Left: Agent Governance Graph** | Wiz-style | All AI agents as nodes in a force-directed graph. Size = risk score. Color = compliance status (green/yellow/red). Click any agent for detail panel. |
| **Top-Right: Compliance Checklist** | Vanta-style | Framework progress bars — EU AI Act, NIST RMF, ISO 42001, SOC 2. % complete with remediation task list. |
| **Bottom-Left: Trust Radar** | Credo-style | 6-dimensional radar chart — Bias, Compliance, Security, Privacy, Safety, Fairness — for the selected agent or aggregate fleet. |
| **Bottom-Right: Real-Time Alerts** | Intelligent filter | Actionable alerts only — policy violations, drift detection, threshold breaches. No raw logs. Grouped by severity. |

**Supporting components:**
- **Left sidebar** — icon + label navigation: Dashboard, Agents, Policies, Reports, Settings. Collapsible.
- **Top bar** — search/command bar, notification bell (red badge for critical), user avatar, org switcher.
- **Detail panels** — slide-out from right side on agent/policy click. No page navigation.
- **Onboarding overlay** — checklist overlay on first login, dismissible, resumable.
- **Welcome chatbot** — floating FAB bottom-right, "How can we help?"

---

## 6. Technical Architecture Reverse-Engineering

### 6.1 Architecture Patterns Found

Our analysis of 15+ platforms reveals three dominant architecture patterns, each with distinct tradeoffs:

| Pattern | Examples | Strengths | Weaknesses |
|---------|----------|-----------|------------|
| **Monolithic** | OneTrust, ServiceNow | Deep feature stacks, enterprise trust, massive integration ecosystems | 3-month implementations, bolt-on AI governance, complexity bloat, modular disconnects |
| **Modular** | Credo AI, Cranium | Purpose-built for AI governance, clean APIs, focused UX | Governance-only (no runtime), limited security enforcement, point-in-time compliance |
| **Cloud-Native** | CrowdStrike, Wiz, Palo Alto | Agentless/microservice deployment, real-time streaming, elastic scale | Security-only (no governance), SIEM complexity, requires dedicated analysts |

**Pattern analysis:**
- **Monolithic platforms** (OneTrust, ServiceNow) built their AI governance modules as extensions of existing GRC tools. OneTrust acquired DataGuidance, Integris Software, and Tugboat Logic — each adds capability but also integration debt. ServiceNow IRM is a generic risk platform with AI features bolted on via Now Assist. Neither is purpose-built.
- **Modular platforms** (Credo AI, Cranium) are purpose-built for AI governance but lack runtime enforcement. Credo's Governance Knowledge Graph connects regulations, risks, and controls brilliantly — but it "documents what agents do" without "determining what agents can do." No runtime authentication, no authorization infrastructure.
- **Cloud-native security** (CrowdStrike, Wiz, Palo Alto Prisma AIRS) delivers real-time runtime enforcement but zero governance layer. CrowdStrike's Threat Graph correlates 2+ trillion events weekly — impressive, but there is no concept of AI model registry, risk assessment workflows, or EU AI Act compliance documentation.

**The gap:** No vendor has successfully unified governance-layer capabilities (registry, compliance, risk workflows) with runtime-layer enforcement (security, monitoring, blocking). This is SOV3's architectural opportunity.

### 6.2 Tech Stacks Identified

| Vendor | Languages | Cloud | Database | Agent | Key Framework |
|--------|-----------|-------|----------|-------|---------------|
| **CrowdStrike** | C++ (agent), Python/Go (cloud) | Multi-cloud (AWS, Azure, GCP) | Proprietary Threat Graph | 25MB user-space sensor | Cloud-scale ML |
| **Credo AI** | Python, TypeScript | SaaS (cloud-agnostic) | Graph DB (Knowledge Graph) | SDK only (no runtime agent) | Pydantic, OpenAPI |
| **Palo Alto** | Python (SDK) | Multi-cloud | Proprietary | Lightweight agents / sidecars | Security-as-Code |
| **OneTrust** | Unknown (closed-source) | Multi-cloud | UK/EEE selectable | None (web-only) | REST API, Swagger |
| **Zenity** | Unknown | SaaS (Azure-heavy) | Unknown | Device agent for endpoints | Behavior engine |
| **Wiz** | Unknown | Multi-cloud | Graph DB (Security Graph) | Agentless | Graph analysis |
| **WitnessAI** | Unknown | Network-level SaaS | Unknown | None (network inspection) | Intent-based ML |
| **Cranium** | Unknown | Azure Marketplace | Unknown | Code scanner | Secure LLM arch |
| **ServiceNow** | JavaScript/TypeScript | ServiceNow cloud | CMDB | None (web platform) | Now Assist AI |

**Key observations:**
- **Python dominates AI governance** — every vendor with a public SDK uses Python. SOV3's SDK must be Python-first.
- **Graph databases are the secret weapon** — Wiz (Security Graph), Credo AI (Governance Knowledge Graph), CrowdStrike (Threat Graph) all use proprietary graph databases for relationship analysis. SOV3's agent governance graph needs a graph DB backend.
- **Agentless is winning** — Wiz and WitnessAI prove agentless deployment eliminates the #1 adoption barrier. SOV3 must default to agentless (API-based) with optional agent-based deployment for deep monitoring.
- **OpenAPI/Pydantic is the API standard** — Credo AI and Palo Alto both use Pydantic models with OpenAPI schemas. SOV3 should follow this pattern.

### 6.3 Deployment Models

| Vendor | SaaS | Hybrid | Air-Gapped | Agentless | Agent-Based |
|--------|------|--------|------------|-----------|-------------|
| **CrowdStrike** | Yes | Partial | No | No | Yes (25MB) |
| **Credo AI** | Yes | No | No | Yes (SDK) | No |
| **Palo Alto** | Yes | No | Private infra | Partial | Yes (sidecars) |
| **OneTrust** | Yes | No | No | Yes | No |
| **WitnessAI** | Yes | No | No | Yes (network) | No |
| **Zenity** | Yes | No | No | Partial | Yes (device) |
| **Wiz** | Yes | No | No | Yes | No |
| **Cranium** | Yes (Azure) | No | No | Yes | No |
| **ServiceNow** | Yes | No | No | Yes | No |
| **SOV3 (target)** | **Yes** | **Yes** | **Yes** | **Yes (default)** | **Yes (optional)** |

**Deployment model insights:**
- SaaS-only is table stakes. Hybrid (cloud + on-prem) and air-gapped (government/defense) are differentiators.
- Agentless deployment reduces time-to-value from weeks to minutes. Wiz's entire GTM motion is built on this single architectural decision.
- Agent-based deployment (CrowdStrike's 25MB sensor, Zenity's device agent) creates procurement friction — security teams must approve new endpoint software.
- **SOV3 must offer:** SaaS-first (fastest time to value), hybrid for regulated industries, air-gapped for government/defense. Agentless by default, optional agent for deep telemetry.

### 6.4 The Governance + Runtime Gap

Gartner's AI TRiSM Market Guide 2025 defines four layers of AI trust, risk, and security management:

1. **AI Governance** — visibility, traceability, accountability (AI catalogs, continuous assurances)
2. **AI Runtime Inspection & Enforcement** — real-time monitoring, anomaly detection, policy enforcement
3. **Information Governance** — data access controls, classification, permission management
4. **Infrastructure & Stack** — traditional security controls for AI workloads

**Gartner's critical finding:** No single vendor addresses all four layers. The market is fragmented between governance-focused vendors (Credo AI, Holistic AI, OneTrust) and runtime-focused vendors (Palo Alto Prisma AIRS, WitnessAI, CrowdStrike, Zenity).

**The governance side lacks runtime:**
- Credo AI has a Governance Knowledge Graph but no runtime enforcement. Its SDK does CRUD operations, not real-time policy blocking.
- OneTrust has policy-driven runtime controls on paper but no kernel-level or network-level enforcement.
- Holistic AI has Guardian Agents (Sentinel + Operative) but they are limited to its own framework.

**The runtime side lacks governance:**
- CrowdStrike secures AI where it executes but has no model registry, no compliance documentation, no EU AI Act policy packs.
- Palo Alto Prisma AIRS has AI Runtime Firewall, Model Security, and Red Teaming but zero governance workflows, risk assessments, or audit evidence generation.
- WitnessAI has network-level runtime defense but no structured compliance automation, no policy packs for frameworks.

**SOV3 unifies both.** Our 5-layer architecture (Public Transparency → PDCA → Watchdog → MCP Ecosystem → Red/Blue Team) covers Gartner's governance layer (layers 1+3) and runtime layer (layers 2+4) simultaneously. No competitor has this combination.

### 6.5 SOV3's 5-Layer Architecture Advantage

| Layer | Name | Governance or Runtime | Competitor Equivalent | SOV3 Differentiator |
|-------|------|---------------------|----------------------|---------------------|
| **L1** | Public Transparency Portal | Governance | Credo AI Registry, OneTrust Inventory | Open-source trust dashboards, automatic report generation, public API for auditors |
| **L2** | PDCA Governance Engine | Governance | Credo AI Compliance, Holistic AI Workflows | Plan-Do-Check-Act continuous loop with automated evidence collection, not point-in-time |
| **L3** | Watchdog Runtime Monitor | Runtime | CrowdStrike Falcon, Palo Alto AIRS | Agentless + agent-based hybrid, behavioral intent analysis, inline policy enforcement |
| **L4** | MCP Ecosystem Hub | Both | Zenity (Microsoft-only), Credo AI (planned) | Platform-agnostic MCP server governance — LangChain, CrewAI, AutoGen, Azure AI Foundry |
| **L5** | Red/Blue Team | Both | Cranium Arena, WitnessAI Attack | Continuous automated red-teaming + blue-team hardening, not point-in-time |

**Why no competitor can replicate this:**
- Governance vendors lack the runtime engineering expertise (kernel-level monitoring, network inspection, inline blocking).
- Runtime vendors lack the governance domain expertise (regulatory frameworks, audit workflows, risk assessment methodologies).
- Building both requires dual expertise: compliance law + kernel engineering, EU AI Act + eBPF, NIST RMF + graph databases.
- SOV3's architecture is designed as **five interoperating layers from day one**, not two acquired products bolted together.

---

## 7. Competitor Software Deep Dives

### 7.1 OneTrust: The Monolithic Giant

**Scale:** 14,000+ customers, 300+ patents, 2,300 employees. The largest pure-play GRC vendor.

**Product lines (7):** Privacy & Data Governance, AI Governance, GRC & Security Assurance, Ethics & Compliance, ESG, Data Security, Third-Party Risk. AI Governance was added as a module to the existing platform, not built from scratch.

**AI Governance specific features:** AI use-case intake, unified asset inventory, AI Model/System Cards, AI Governance Program Center, AI Risk Assessments across OECD/ALTAI/UK ICO/NIST AI RMF, EU AI Act risk classification, MCP agent governance, AWS SageMaker/AzureML/Google Vertex integrations, DataGuidance Copilot for regulatory Q&A.

**Critical weaknesses:**
- 3-month implementation timeline (2.5-3.5 months typical). This is a UX failure in 2025.
- "Settings inside settings" — users report features buried under multiple navigation levels.
- "Irritating inconsistencies in the user interface between the various modules" — direct user quote.
- AI Governance feels like a privacy tool extended for AI, not purpose-built. Heavy privacy heritage shows in the workflow design.
- No monetary risk quantification — qualitative/scored risk only.
- Enterprise-only support — smaller customers "feel like an afterthought."
- Trustpilot: 1.5/5 (vs 4.3/5 on G2 — polarized experiences).

**SOV3 attack vector:** OneTrust requires dedicated GRC specialists. SOV3 should be usable by security-conscious developers WITHOUT a compliance background. Target the mid-market that OneTrust ignores.

### 7.2 CrowdStrike: The Security Fortress

**Scale:** 254 of Fortune 500, 526 of Global 2000. 7x Gartner Magic Quadrant Leader for Endpoint Protection.

**Product modules (30+):** Falcon Prevent (NGAV), Falcon Insight (EDR), Falcon Insight XDR, Falcon Cloud Security (CNAPP), Falcon Data Protection (DLP), Falcon Shield (SSPM), Falcon Next-Gen SIEM, Falcon LogScale, Charlotte AI (AI assistant), AI Detection & Response, Falcon Exposure Management, Falcon Foundry (no-code security checks), and 20+ additional modules.

**Technical architecture:** Cloud-native microservices with single 25MB lightweight agent. Proprietary Threat Graph (distributed graph database) correlating 2+ trillion events weekly. Charlotte AI AgentWorks ecosystem. Agent runs in user space, no kernel mode required. Zero endpoint impact claims.

**Critical weaknesses:**
- AI governance is bolt-on, not purpose-built. No model registry, no EU AI Act policy packs, no compliance documentation workflows.
- SIEM-style console — alert fatigue, dense data tables, custom query languages. Requires dedicated SOC analysts.
- "The console gets easier after a solid week or two" — admission of UX failure.
- July 2024 global outage — faulty channel file caused Windows BSOD worldwide. Trust cratered.
- No monetary risk quantification for AI systems.
- Limited cross-functional collaboration — serves security ops only.

**SOV3 attack vector:** CrowdStrike secures AI execution but cannot govern AI lifecycle. SOV3 integrates with CrowdStrike's API layer while providing the governance, compliance, and risk assessment layer it lacks. Sell to compliance teams who need CrowdStrike's data but cannot use its console.

### 7.3 Credo AI: The Governance Purist

**Scale:** $41.3M funded. Customers: Mastercard, Booz Allen Hamilton, Amazon, Autodesk, Northrop Grumman, Databricks. #6 in Applied AI on Fast Company's World's Most Innovative Companies 2026. Leader in Forrester Wave AI Governance Q3 2025 with 12 Perfect Scores.

**Platform architecture:** Three-layer stack. (1) Governance AI Agents — GAIA (Govern AI Assistant) for evidence retrieval, risk assessment, incident response, remediation. (2) Unified AI Governance Platform — AI Registry & Discovery, Risk Intelligence, Compliance & Policy Engine, Runtime Governance. (3) Governance Knowledge Graph — regulatory intelligence, business context, AI governance configuration.

**Key features:** 12 core features across AI Registry, Risk Intelligence, Compliance, and Runtime Governance. Pre-built policy packs for EU AI Act, NIST RMF, ISO 42001, SOC 2, HITRUST. Agentic AI governance at 4 levels: model, agent, application, network. Python/TypeScript SDK with sync/async clients. Pydantic models, OpenAPI schema, pagination support.

**Critical weaknesses:**
- Purely governance-layer — documents and tracks but does NOT enforce at runtime. No runtime authentication, no authorization infrastructure.
- SDK is basic CRUD — no real-time event streaming, no inline policy enforcement.
- Demo-only gate — no self-service signup kills developer adoption.
- No monetary risk quantification — risk tiers and scores, not financial exposure.
- US-centric regulatory coverage — less depth in EU-specific regimes.
- Limited shadow AI security monitoring — discovers but does not enforce.

**SOV3 attack vector:** Credo AI has the governance mindshare but lacks runtime teeth. SOV3 provides the Watchdog runtime enforcement layer that Credo AI cannot build. Target Credo AI prospects who ask "but how do you actually STOP a violating agent?"

### 7.4 WitnessAI: The Agent Watcher

**Scale:** $85.5M funded (led by Sound Ventures, GV, Ballistic Ventures, Samsung NEXT). Founded 2023 by Rick Caccia (ex-Palo Alto Networks, Google) and Gil Spencer (ex-IronKey). 500%+ ARR growth, 5x headcount.

**Platform modules (4 pillars):** Observe (shadow AI discovery, AI application catalog, agent monitoring, interaction classification), Protect (AI Firewall, content guardrails, DLP, runtime defense, automated red-teaming), Control (prompt routing, context-aware policies, audit trails, data redaction), Attack (threat simulation, vulnerability testing).

**Technical architecture:** Network-level — no endpoint clients or browser extensions. Single-tenant for data sovereignty. Intent-based ML engines (behavioral analysis, not keyword rules). Unified governance for human employees AND autonomous AI agents.

**Critical weaknesses:**
- NO PUBLIC API. This is a major strategic vulnerability — every modern security platform needs API access.
- Limited governance workflow depth — strong on security, lighter on governance processes.
- No policy packs for regulations — less structured compliance automation.
- No monetary risk quantification.
- No evidence generation for audit readiness.
- Product page returns 404 — broken user journey.

**SOV3 attack vector:** WitnessAI has no public API, no governance workflows, and broken product pages. SOV3's API-first architecture and self-serve onboarding directly counter every WitnessAI weakness. Target developers who need programmatic access.

### 7.5 Zenity: The Agent Security Play

**Scale:** $59.5M raised (Series B). Named by Gartner as "the company to beat in AI Agent Governance." Gartner AI TRiSM Market Guide representative vendor.

**Platform capabilities:** AI Agent Discovery & Inventory, Pre-Deployment Governance (secure-by-design policies, permission governance, memory governance), Runtime Protection (step-level execution monitoring, behavior correlation, inline controls).

**Technical architecture:** End-to-end SaaS, agentless for some features, device agent for endpoint visibility. Behavior-based threat detection engine. Deep Microsoft integration (M365 Copilot, Azure AI Foundry, ChatGPT Enterprise).

**Critical weaknesses:**
- Microsoft-centric — deep coverage of Microsoft platforms but limited elsewhere. No coverage of LangChain, CrewAI, Databricks, or custom frameworks natively.
- Requires device agent for endpoint visibility — deployment friction.
- Narrow focus — primarily agent security, not comprehensive AI governance.
- No model registry — focuses on agents, not ML models.
- No regulatory compliance depth — no policy packs, limited framework support.
- No monetary risk quantification.
- NO PUBLIC API.

**SOV3 attack vector:** Zenity's Microsoft lock-in creates a platform-agnostic opening. SOV3 covers all AI frameworks (LangChain, CrewAI, AutoGen, Azure AI Foundry) with a unified abstraction layer. Sell to multi-cloud enterprises Zenity cannot serve.

### 7.6 Cranium: The AI-BOM Pioneer

**Scale:** Partners with Weights & Biases and ISTARI. Acquired Aiceberg. Available on Microsoft Azure Marketplace.

**Platform capabilities:** AI Bill of Materials (AI-BOM) — comprehensive inventory of AI components. Three products: Detect AI (discovery), Arena (red teaming), AI Card (compliance documentation). OODA loop methodology: Observe → Orient → Decide → Act. Secure LLM architecture. ML-specific code analysis beyond standard SBOM tools.

**Technical architecture:** AI-augmented workflow with secure LLM architecture. State-of-the-art AI for code analysis. Proprietary threat intelligence database. Scans enterprise-scale codebases. Framework support: NIST AI RMF, EU AI Act, ISO 42001.

**Critical weaknesses:**
- Discovery and documentation only — no runtime enforcement.
- Red teaming (Arena) is valuable but not continuous monitoring.
- NO PUBLIC API.
- Limited feature depth compared to dedicated governance platforms.
- Limited policy engine — more focused on security than governance workflows.
- No monetary risk quantification.

**SOV3 attack vector:** Cranium's AI-BOM is a strong pattern to emulate but its lack of continuous monitoring and runtime enforcement leaves a gap. SOV3 provides continuous runtime governance that complements Cranium's discovery — target Cranium customers who need ongoing enforcement after initial discovery.

### 7.7 Sycamore Labs: The Ghost

**Status:** Website (sycamorelabs.com) non-operational. $65M in funding reported by industry sources but no active product, no meaningful public information.

**Assessment:** Either pre-launch stealth mode or ceased operations. Cannot be evaluated as a competitive threat at this time. Re-evaluate quarterly.

**SOV3 implication:** $65M in capital with no visible product output suggests either massive stealth R&D or misallocation. Either way, SOV3 should not factor Sycamore Labs into competitive positioning until a product ships.

---

## 8. The SOV3 Build Plan: Exact Features to Build

### 8.1 MVP Feature Set (Launch Day — July 4)

These features must be production-ready on day one. No exceptions.

**Dashboard & Visualization:**
1. `AgentGovernanceGraph` — Force-directed D3.js graph showing all registered AI agents. Node size = risk score, color = compliance status (green/yellow/red/gray). Click-to-expand detail panel. Auto-zoom to fit. Real-time WebSocket updates when agent status changes.
2. `TrustRadarChart` — Recharts radar/spider chart with 6 axes: Bias, Compliance, Security, Privacy, Safety, Fairness. Supports aggregate (fleet-wide) and per-agent views. Animated transitions on data change.
3. `ComplianceChecklist` — Vanta-style vertical checklist with progress bars for EU AI Act, NIST RMF, and ISO 42001. Each item: checkbox + label + % complete + "N of M tasks done" subtext. Click expands task list.
4. `RealTimeAlertPanel` — Scrollable alert feed, newest first. Severity badges (Critical/High/Medium/Low). Filter by agent, framework, severity, time range. Group related alerts into threads.

**Agent Management:**
5. `AgentRegistrationAPI` — `POST /api/v1/agents/register` with payload: `{name, type, framework, endpoint_url, owner_email, policies[]}`. Returns `agent_id` and `api_key`.
6. `AgentInventoryGrid` — Card-based grid view of all agents. Each card: agent name, framework icon, trust score badge, last seen timestamp, compliance status dot. Sort by name, risk, last activity. Search by name or owner.
7. `AgentDetailPanel` — Slide-out panel (no page navigation) showing: agent metadata, connected tools, policy assignments, trust radar, recent violations, audit log. Export as PDF.

**Policy Engine:**
8. `PolicyTemplateLibrary` — Pre-built policy templates: EU AI Act High-Risk System, NIST RMF GOVERN-1, ISO 42001 Clause 6. Each template: name, description, rule count, framework badge. One-click deploy.
9. `PolicyRuleBuilder` — Visual rule builder: IF condition (agent.type == 'customer-facing' AND risk.score > 7) THEN action (block AND notify). Conditions: agent metadata, trust score thresholds, framework requirements, data classification. Actions: block, warn, notify, log, escalate.
10. `PolicyEnforcementEngine` — Runtime policy evaluator. Evaluates every agent action against active policies. Latency target: <50ms per evaluation. Logs every decision with rationale.

**Compliance:**
11. `EUAIActRiskClassifier` — Interactive wizard classifies AI systems by EU AI Act risk level: prohibited, high-risk, limited risk, minimal risk. Asks 10-15 questions, produces classification report with reasoning. Exportable as PDF for auditors.
12. `NISTRMFMapper` — Maps registered agents to NIST AI RMF functions (GOVERN, MAP, MEASURE, MANAGE). Shows coverage gaps. Links to relevant controls.

**Onboarding:**
13. `SelfServiceSignup` — Email + password + org name. No credit card. Auto-creates tenant with pre-loaded sample data (5 demo agents, 3 policies, sample violations). <2 minutes from landing page to dashboard.
14. `OnboardingChecklist` — 5-step overlay: (1) Connect first agent via API call, (2) Set first policy, (3) Review agent inventory, (4) Invite team member, (5) Customize dashboard. Progress bar at top. Confetti on completion.
15. `SampleDataLoader` — Pre-loads 5 realistic demo agents (chatbot, recommendation engine, code assistant, document classifier, fraud detector) with realistic trust scores, violations, and compliance statuses. Users see value before connecting their own systems.

**API & Integration:**
16. `REST API v1` — Full CRUD for agents, policies, violations, compliance reports. OpenAPI 3.0 spec. Pydantic validation. Rate limiting: 1000 req/min free tier, 10,000 req/min paid.
17. `WebhookDispatcher` — `POST /api/v1/webhooks` to subscribe to events: `agent.violation`, `policy.triggered`, `compliance.status_changed`, `trust.score_drift`. HMAC-SHA256 signature verification. Retry with exponential backoff.

**Authentication:**
18. `AuthSystem` — JWT-based auth with refresh tokens. Role-based access: Admin, Governance Manager, Auditor, Viewer. SSO via OAuth2 (Google, GitHub) on day one. SAML (Okta, Azure AD) in Phase 2.

### 8.2 Phase 2 Features (Months 2-3)

Features that must ship within 90 days of launch. These close competitive gaps and enable paid conversion.

**Advanced Governance:**
- `PDCALoopEngine` — Plan-Do-Check-Act continuous governance loop. Automated: plan compliance goals, execute policy changes, check via continuous monitoring, act on findings. Visual PDCA cycle diagram on dashboard.
- `EvidenceCollectionAutomation` — Auto-collects evidence from connected agents: decision logs, model versions, training data summaries, test results. Stores in tamper-evident format. 10-year retention per EU AI Act Article 12.
- `AuditTrailExport` — One-click export of complete audit trail: agent history, policy changes, violation records, evidence logs. Formats: PDF (human-readable), JSON (machine-readable), CSV (spreadsheet-friendly).

**Runtime Monitoring:**
- `BehavioralDriftDetector` — Statistical drift detection on agent outputs. Compares current behavior against baselines. Alerts on distribution shifts, output quality degradation, unexpected patterns. Uses KS-test + Wasserstein distance.
- `BiasMonitor` — Continuous bias detection across protected attributes: gender, age, race, disability. Integrates with bias metrics libraries (AIF360, Fairlearn). Dashboard widget showing bias scores over time.
- `ShadowAIDiscovery` — Network scanning + API log analysis to find unauthorized AI agents. Scans cloud accounts (AWS, Azure, GCP) for AI/ML services. Cross-references against registered agent inventory. Flags unregistered agents as "shadow AI."

**Collaboration:**
- `TeamWorkspace` — Multi-user workspace with role-based access. Shared dashboards, shared policies, team-wide alerts. Activity feed showing who did what when.
- `ApprovalWorkflows` — Multi-step approval for high-impact policy changes: submit → review → approve → deploy. Configurable approver chains. Email + Slack notifications.
- `ComplianceComments` — Inline commenting on compliance checklist items. @mentions. Threaded discussions. Resolves when task complete.

**MCP Ecosystem:**
- `MCPServerRegistry` — Catalog of MCP servers with trust scores. Auto-discovers MCP tools connected to registered agents. Shows: server name, capabilities, permission scope, risk rating.
- `MCPToolGovernance` — Policy rules for MCP tool access: which agents can call which tools, rate limits, data classification restrictions.

**Integrations:**
- `SlackConnector` — Real-time alerts to Slack channels. `/sov3 status` command. Interactive buttons: Acknowledge, Escalate, View Details. OAuth2 install.
- `GitHubConnector` — Scan repos for AI model files, config files, dependency files. Auto-detect agents from code. PR checks for policy compliance. GitHub Actions integration.

### 8.3 Phase 3 Features (Months 4-6)

Scale and ecosystem features. These differentiate SOV3 from every competitor.

- `PublicTransparencyPortal` — Open-source trust dashboard that any organization can publish. Shows: AI systems in use, compliance status, trust scores, audit history. Embeddable iframe. Public API for third-party verification. First of its kind in the market.
- `RedTeamAutomation` — Continuous automated adversarial testing. Prompt injection, jailbreak attempts, data extraction attacks, model inversion. Runs daily against registered agents. Results feed into trust radar.
- `BlueTeamHardening` — Auto-generated hardening recommendations based on red team findings + known vulnerability databases. Priority-ranked by exploitability and impact.
- `MonetaryRiskQuantifier` — Fermi estimation of financial exposure from AI risk. Inputs: fine amounts (EU AI Act max EUR 35M), revenue at risk, reputational damage estimates. Outputs: expected loss in EUR/GBP/USD. **No competitor has this.**
- `CrossFrameworkDeduplication` — Map one control to multiple frameworks simultaneously. Example: one "bias testing" control satisfies EU AI Act Article 10 + NIST RMF MEASURE-2 + ISO 42001 Clause 6.4. Shows "do once, comply many" savings.
- `AgentDependencyGraph` — Multi-agent network visualization. Shows agents calling agents, cascade risk analysis, inter-agent policy enforcement. Critical for multi-agent orchestration platforms.
- `CustomFrameworkBuilder` — Visual builder for proprietary governance frameworks. Drag-and-drop controls, requirements, evidence types. Export as policy template.

**Integrations:**
- `AWSConnector` — Auto-detect AI/ML services: SageMaker, Bedrock, Comprehend, Lex. Read-only CloudTrail log analysis. IAM policy scanning.
- `AzureConnector` — Auto-detect: Azure OpenAI, Azure ML, Cognitive Services. Azure Monitor integration. Microsoft Entra ID sync.
- `GCPConnector` — Auto-detect: Vertex AI, Dialogflow, AutoML. Cloud Audit Logs analysis.
- `JiraConnector` — Violations auto-create Jira tickets. Bidirectional sync: Jira status changes update SOV3. Sprint planning integration.

### 8.4 Phase 4 Features (Months 7-12)

Enterprise-grade features for large deployments and regulated industries.

- `AirGappedDeployment` — Full on-premise deployment option. Kubernetes Helm chart. No external dependencies. For government, defense, critical infrastructure.
- `FederatedLearningGovernance` — Governance for federated AI training across multiple organizations. Differential privacy validation. Secure aggregation verification.
- `ModelCardGenerator` — Auto-generates model cards from registered agents: training data summary, performance metrics, known limitations, intended use cases. Exportable per Google's Model Cards for Model Reporting.
- `DORANIS2Compliance` — Policy packs for EU Digital Operational Resilience Act (DORA) and Network and Information Security Directive (NIS2). ICT risk management, incident reporting, resilience testing.
- `HIPAABiasGuard` — Healthcare-specific bias detection. Tests for disparities across patient demographics. Integrates with clinical AI validation workflows.
- `ServiceNowIntegration` — Bidirectional sync with ServiceNow IRM. SOV3 violations become ServiceNow incidents. ServiceNow risk assessments sync to SOV3. Native ServiceNow app in their store.
- `OktaIntegration` — SSO via SAML 2.0 + SCIM user provisioning. Group-based policy assignment. "Governance Manager" Okta group auto-maps to SOV3 role.
- `SOC2EvidenceAutoCollector` — Continuous SOC 2 evidence collection: access logs, change management records, monitoring screenshots. Auto-generates SOC 2 Type II auditor report package.
- `AnomalyDetectionEngine` — Unsupervised ML for anomaly detection in agent behavior. Auto-baselines. Flags outliers for human review. Uses isolation forest + autoencoder ensemble.

### 8.5 The MCP Server Build List

SOV3 will ship with six first-party MCP servers that extend governance into external tools. Each server is a deployable Python package with a stdio transport.

| MCP Server | Description | Tools Provided |
|------------|-------------|----------------|
| `sov3-mcp-eu-ai-act` | EU AI Act compliance scanner | `classify_risk_level`, `check_technical_doc_requirements`, `verify_human_oversight_measures`, `check_data_governance_compliance`, `generate_conformity_assessment` |
| `sov3-mcp-nist-rmf` | NIST AI RMF mapper | `map_to_govern_function`, `map_to_map_function`, `map_to_measure_function`, `map_to_manage_function`, `generate_rmf_profile`, `track_risk_metrics` |
| `sov3-mcp-bias-detector` | Bias detection across protected attributes | `detect_demographic_bias`, `calculate_disparate_impact`, `measure_equalized_odds`, `generate_fairness_report`, `recommend_mitigation` |
| `sov3-mcp-drift-monitor` | Statistical drift detection | `calculate_distribution_drift`, `detect_concept_drift`, `monitor_data_quality`, `alert_on_threshold_breach`, `generate_drift_report` |
| `sov3-mcp-compliance-reporter` | Audit-ready compliance reporting | `generate_framework_report`, `export_evidence_package`, `create_audit_trail`, `schedule_recurring_report`, `compare_framework_coverage` |
| `sov3-mcp-policy-enforcer` | Runtime policy enforcement | `evaluate_policy_compliance`, `block_noncompliant_action`, `log_enforcement_decision`, `escalate_violation`, `update_policy_rules` |

**Each MCP server implements:**
- stdio transport (MCP protocol compliant)
- Pydantic input/output validation
- Structured error handling with `McpError` types
- Health check endpoint (`health_check` tool)
- Configuration via environment variables
- Docker container packaging
- Published to PyPI (`pip install sov3-mcp-{name}`)

**MCP server architecture pattern:**
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   SOV3 Core     │◄───►│  MCP Server Hub  │◄───►│ External Tools  │
│  (FastAPI)      │     │  (Gateway)       │     │ (GitHub, AWS,   │
│                 │     │                  │     │  Jira, etc.)    │
│  Policy Engine  │     │  Server Registry │     │                 │
│  Violation Log  │     │  Tool Routing    │     │  EU AI Act DB   │
│  Audit Trail    │     │  Auth/Rate Limit │     │  NIST RMF Refs  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 8.6 API Endpoint Design

**REST API v1 — Core Endpoints:**

```
POST   /api/v1/agents                    # Register new AI agent
GET    /api/v1/agents                    # List all agents (paginated)
GET    /api/v1/agents/{id}               # Get agent details
PUT    /api/v1/agents/{id}               # Update agent
DELETE /api/v1/agents/{id}               # Deregister agent
GET    /api/v1/agents/{id}/trust-score   # Get trust radar data
GET    /api/v1/agents/{id}/violations    # Get agent violations

POST   /api/v1/policies                  # Create policy
GET    /api/v1/policies                  # List policies
GET    /api/v1/policies/{id}             # Get policy details
PUT    /api/v1/policies/{id}             # Update policy
DELETE /api/v1/policies/{id}             # Delete policy
POST   /api/v1/policies/{id}/evaluate    # Evaluate policy against agent

GET    /api/v1/violations                # List violations (filtered)
GET    /api/v1/violations/{id}           # Get violation details
POST   /api/v1/violations/{id}/resolve   # Mark violation resolved

GET    /api/v1/compliance/frameworks     # List supported frameworks
GET    /api/v1/compliance/frameworks/{id}/status  # Get compliance status
POST   /api/v1/compliance/assess         # Run compliance assessment
GET    /api/v1/compliance/reports        # List compliance reports
GET    /api/v1/compliance/reports/{id}   # Download report (PDF/JSON)

POST   /api/v1/webhooks                  # Register webhook
GET    /api/v1/webhooks                  # List webhooks
DELETE /api/v1/webhooks/{id}             # Remove webhook

GET    /api/v1/dashboard/summary         # Dashboard KPI summary
GET    /api/v1/dashboard/agents-graph    # Agent governance graph data
GET    /api/v1/dashboard/trust-radar     # Trust radar data
GET    /api/v1/dashboard/alerts          # Real-time alerts feed
```

**GraphQL Schema (overview):**

```graphql
type Agent {
  id: ID!
  name: String!
  type: AgentType!
  framework: String!
  trustScore: TrustScore!
  complianceStatus: ComplianceStatus!
  policies: [Policy!]!
  violations: [Violation!]!
  createdAt: DateTime!
  lastSeenAt: DateTime
}

type TrustScore {
  overall: Float!
  bias: Float!
  compliance: Float!
  security: Float!
  privacy: Float!
  safety: Float!
  fairness: Float!
}

type Policy {
  id: ID!
  name: String!
  description: String
  framework: Framework
  rules: [PolicyRule!]!
  isActive: Boolean!
  violationCount: Int!
}

type Violation {
  id: ID!
  agent: Agent!
  policy: Policy!
  severity: Severity!
  description: String!
  detectedAt: DateTime!
  resolvedAt: DateTime
  evidence: JSON
}

type Query {
  agents(filter: AgentFilter, limit: Int, offset: Int): [Agent!]!
  agent(id: ID!): Agent
  policies(framework: Framework): [Policy!]!
  violations(filter: ViolationFilter): [Violation!]!
  complianceStatus(framework: Framework!): ComplianceReport!
  dashboardSummary: DashboardSummary!
}

type Mutation {
  registerAgent(input: RegisterAgentInput!): Agent!
  updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
  createPolicy(input: CreatePolicyInput!): Policy!
  evaluatePolicy(policyId: ID!, agentId: ID!): EvaluationResult!
  resolveViolation(id: ID!, resolution: String!): Violation!
}

type Subscription {
  agentStatusChanged: Agent!
  violationDetected: Violation!
  trustScoreUpdated: TrustScore!
  complianceStatusChanged: ComplianceReport!
}
```

**WebSocket Event Streams:**

```
WS /ws/v1/agents           # Real-time agent status changes
WS /ws/v1/violations       # Real-time violation alerts
WS /ws/v1/trust-scores     # Trust score updates (throttled: 1/min)
WS /ws/v1/alerts           # General alert stream (filtered by user permissions)
```

Event format:
```json
{
  "event": "violation.detected",
  "timestamp": "2025-07-04T12:00:00Z",
  "data": {
    "violation_id": "vio_abc123",
    "agent_id": "agent_xyz789",
    "agent_name": "Customer Support Bot",
    "policy_id": "pol_def456",
    "policy_name": "EU AI Act High-Risk System",
    "severity": "critical",
    "description": "Agent exceeded bias threshold for gender classification",
    "trust_score_impact": -0.15
  }
}
```

### 8.7 Integration Roadmap

| Quarter | Integration | Type | Priority | Use Case |
|---------|-------------|------|----------|----------|
| **Q3 2025** | Slack | Notification | P0 | Real-time alerts, `/sov3` commands, interactive buttons |
| **Q3 2025** | GitHub | DevOps | P0 | Repo scanning, PR policy checks, Actions integration |
| **Q3 2025** | AWS | Cloud | P0 | Auto-detect SageMaker/Bedrock, CloudTrail analysis, IAM scanning |
| **Q4 2025** | Azure | Cloud | P1 | Azure OpenAI, Azure ML, Entra ID sync, Monitor integration |
| **Q4 2025** | GCP | Cloud | P1 | Vertex AI, Dialogflow, Cloud Audit Logs analysis |
| **Q4 2025** | Jira | Project Mgmt | P1 | Auto-create tickets from violations, bidirectional sync |
| **Q1 2026** | ServiceNow | ITSM | P2 | Bidirectional IRM sync, native ServiceNow app |
| **Q1 2026** | Okta | Identity | P2 | SAML SSO, SCIM provisioning, group-based policy assignment |
| **Q2 2026** | Datadog | Observability | P2 | Metrics export, anomaly correlation, dashboard embedding |
| **Q2 2026** | PagerDuty | Incident Mgmt | P2 | Critical violation paging, on-call routing, incident timeline |
| **Q2 2026** | Salesforce | CRM | P3 | Customer-facing AI governance, lead scoring transparency |
| **Q3 2026** | Databricks | ML Platform | P3 | Model registry sync, experiment tracking, feature store governance |

**Integration architecture pattern:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SOV3 Integration Layer                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Connectors │ │ Webhooks  │ │ MCP Svrs  │ │  SDKs    │      │
│  │ (pull)    │ │ (push)   │ │ (bidir)  │ │ (embed)  │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
   ┌────┴────┐  ┌───┴────┐  ┌───┴────┐  ┌───┴────┐
   │External │  │External│  │External│  │ Customer│
   │ APIs    │  │ Events │  │ Tools  │  │  Code   │
   │(Slack,  │  │(GitHub  │  │(MCP     │  │(Python, │
   │ AWS,    │  │ webhooks│  │ servers)│  │ TypeScript│
   │ Jira)   │  │)       │  │         │  │  )      │
   └─────────┘  └────────┘  └────────┘  └─────────┘
```

**Connector SDK design (Python example):**

```python
from sov3 import Client

client = Client(api_key="sov3_live_...")

# Register an agent
agent = client.agents.register(
    name="Customer Support Bot",
    type="customer-facing",
    framework="langchain",
    endpoint_url="https://api.example.com/bot",
    owner_email="team@example.com"
)

# Attach a policy
client.policies.attach(
    agent_id=agent.id,
    policy_id="pol_eu_ai_act_high_risk"
)

# Check trust score
score = client.agents.get_trust_score(agent.id)
print(f"Overall trust: {score.overall}")  # 0.0 - 1.0
print(f"Bias: {score.bias}, Compliance: {score.compliance}")

# Subscribe to violations via webhook
client.webhooks.create(
    url="https://example.com/webhooks/sov3",
    events=["violation.detected", "trust.score_drift"],
    secret="whsec_..."
)
```

---

*Chapters 5-8 compiled from competitive intelligence across 15+ vendor platforms, 50+ user reviews, and 40+ technical documents. All architecture decisions are buildable, prioritized, and sequenced for July 4 launch.*
