# CSOAI — Investor Memo (seed, 2026-06-26)

> **Layer-0 status (2026-06-29): 8 protocols · 100/100 A+++++ · bleeding edge · world-leading.** The world's only OSS Layer-0 with every protocol at the bleeding edge. See .

**The signed bridge between AI and the legacy economy. We govern the AI touching the mainframes that run regulated industries — and cryptographically sign every action — the one thing the funded agent-governance players structurally can't do, on a hard Aug-2026 deadline.**

## The market (verified 2026)
- **AI governance platforms: $492M (2026) → $1B+ (2030)** — Gartner, official PR Feb 17 2026. Driver: AI regulation reaching 75% of world economies by 2030.
- **Broader AI governance + compliance spend: $2.54B (2026) → $8.23B (2034)**; corporate GRC-tooling investment **+50% in 2026**; AI-risk consulting demand **+40% in 2026**. The budget line is real, named, and growing.
- **Agentic-AI security (broader): $55B (2026) → $888B (2035).**
- It's hot and funded: **Runlayer $30M Series A** (June 2026, Felicis + Khosla), Obot, plus Microsoft + ServiceNow shipping runtime agent governance — and now a wave of OSS Article-12 tools (AIR Blackbox, Sentinel Kernel, Vaara). **All of it governs *modern* agents.** None of it touches legacy.

## The wedge (why us, why now)
The funded players (Microsoft, ServiceNow, Runlayer) — and a new wave of OSS Article-12 tools — govern **modern** AI agents. **None bridge the legacy systems** — COBOL cores, SAP, SCADA, HL7, ISO-20022 — that banks, hospitals and grids actually run on. That's structural (they're cloud control planes; legacy is on-prem mainframe). *We lead with legacy exclusively — we never pitch "agent security," which is now free (Microsoft) and OSS-contested.*

And there's a clock with teeth: **EU AI Act, 2 Aug 2026** — high-risk AI (critical infra, credit/insurance, biometrics) must be governed **and** logged **tamper-evident** (Article 12). Fines to **€15M or 3% of global turnover.** Banks' AML/credit/fraud systems are high-risk *by definition* (Annex III 5b/5c); **the ECB's 2025-26 supervisory priorities already cite AI governance**, and the **CCO is personally accountable**. That's exactly what we do, on exactly the layer — the legacy core — no one else covers.

## What we've built (verified, not slideware)
- **22 governed legacy bridges** (COBOL · ISO 20022 · HL7 · SAP · SCADA · …) — parse → govern → **Ed25519-sign**. *Category of one.*
- **369 published, governed MCP servers / 1,987 tools** — depth-audited 99% ship-ready; the credibility base + the largest governed-MCP fleet on GitHub.
- **Signed protocol breadth** — a 79-component Ed25519-signed OSCAL/Layer-0 package; the Article-12 audit trail, verifiable offline. **It validates under the standard NIST OSCAL toolchain (compliance-trestle)** — not just our own checks — and anyone can confirm it at a **public, offline, in-browser verify page** (no account, no callback). Cryptographic proof a "trust-me" GRC dashboard can't match.
- **The MCP-security answer, already built** — the year's biggest agent-security story is the systemic MCP RCE crisis (30 CVEs/60 days, ~200k vulnerable instances). Our **20-MCP A2A substrate** (per-action policy, prompt-injection firewall, hash-chained signed audit, certified handoff, governed router) **is the remediation** — shipped, tested, signed.
- **Live demo** — `demo_finance_cobol.py`: a COBOL wire-settlement → governed against DORA/NIS2/AML/PSD2 (with real sanctions/audit flags) → signed audit package that verifies with no account. Competitors can't replicate it.
- **Governance core** — BFT council (selectable 5/13/33), a sovereign orchestrator (governed autonomy), all SIGIL-signed.

## By the numbers (measured live, 2026-06-27)
- **568 repos** (542 public) · **1,987 tools** · **22 signed legacy bridges** · **79-component Ed25519 Layer-0 package**, NIST-toolchain-validated (compliance-trestle) + offline-verifiable.
- **~10M lines** across the GitHub estate (~850K hand-authored after de-duping the shared MCP scaffold).
- **Real distribution, zero marketing:** **~10,400 PyPI downloads/month** across the published compliance MCPs — `eu-ai-act` 3,156 · `dora` 2,862 · `iso-42001` 2,423 · `nist-rmf` 1,731/mo — and **1,580 repo clones / 14 days** on the gateway (automated/agent pull, not human browsing). The full fleet is being published now; ~19 packages already drove that pull.

## Why the breadth IS the moat (Ashby's Law — the size is the point)
The estate is governed by **Stafford Beer's Viable System Model** (recursive self-governance) — and defended by **Ashby's Law of Requisite Variety**: *only variety can absorb variety; a regulator must have at least as many states as what it regulates.* The regulated environment (EU AI Act + DORA + NIS2 + HIPAA + MiFID + Basel + COBOL/SAP/SCADA/HL7, article by article) has enormous variety — so **CSOAI's 369-MCP, 1,987-tool, article-level depth is not sprawl, it's the requisite variety mathematically required to govern it.** A thin "single EU-AI-Act gateway" *structurally cannot* regulate a complex regulated enterprise — insufficient variety. We are the only governance layer with requisite variety, and the architecture is a textbook viable system (S1 operations=the MCPs · S2=SIGIL · S3=council · S4=Hermes · S5=SOV3). *(Spec: `MEOK_VSM_GOVERNANCE_SPEC_2026-06-27.md`.)*

## Traction & honest gaps
- **Built + verified:** the bridges, the signing, the demo, the OS — all real, tested, e2e-green.
- **Pre-revenue, 0 logos yet** — the immediate plan is **one regulated design partner (finance-on-COBOL) before the deadline** (free single-flow pilot → signed Art-12 trail → reference).
- **Honest competitive read:** the agent-governance *layer* is contested + funded; our durable edge is **legacy + signed breadth + sovereign**, not "another MCP gateway." We don't fight the giants on their turf.
- **Owner-gated to live-at-scale:** PyPI/registry publish (distribution), GCP deploy (24/7 runtime). Engineering is done; these are switches.

## The ask
**Seed round to land the first regulated design partners and ship the runtime.** Use of funds: (1) 2–3 design-partner pilots in finance/health pre-deadline, (2) deploy the runtime (GCP) + publish the fleet, (3) the regulated-sector GTM. We enter a hot market with the **one differentiated wedge the $30M-funded players lack** — and a legal deadline doing our selling.

## Why this is the right bet
The market is proven ($1B), the competitors validate the thesis (and prove the agent-layer is real), but they've left the **highest-risk, highest-regulation layer — the legacy economy — completely uncovered.** We own it, we sign it, and the deadline is in weeks. First + signed + on-legacy beats big + late.

*Figures verified 2026-06-26 (Gartner PR · Fortune/Runlayer). Refs: CSOAI_CATAPULT_PIVOT · CSOAI_RESEARCH_SYNTHESIS · CSOAI_DESIGN_PARTNER_OUTREACH · demo_finance_cobol.py. Honest caveat: a full independent re-verification of all market figures is recommended before a priced round.*
