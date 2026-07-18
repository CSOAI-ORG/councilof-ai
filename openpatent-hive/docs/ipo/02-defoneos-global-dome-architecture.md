# DEFONEOS Global Dome — Architecture Specification
## The Sovereign AI Operating System, Layer 0 to Layer 7

**Codename:** DEFONEOS (Defense + One + Sovereign)
**Class:** Sovereign AI Operating System
**Author:** CSOAI Ltd UK 16939677 · Nicholas Templeman
**Date:** June 2026
**Status:** Architecture spec · Layer 0-2 live, Layer 3-7 in build

---

## Executive Summary

DEFONEOS is a 7-layer sovereign AI operating system that integrates governance, IP, infrastructure, industry, and physical-world execution into a single stack. The name reflects its three pillars:

- **DEF**ense — regulatory-grade AI safety + audit trails (COAI/CSOAI/PDCA)
- **ONE** — one unified operating model across 27 industries + government
- **SOVEREIGN** — owned 100%, runs on UK soil, no foreign cloud dependency

The "Global Dome" is the unified MCP mesh that connects all 27 industry domains, government integrations, and physical-world endpoints through a single governance + consensus layer.

```
                          DEFONEOS GLOBAL DOME
                (Sovereign AI Operating System)

   ┌────────────────────────────────────────────────────────┐
   │ LAYER 7  HUMAN-OID INTERFACE                            │
   │  Robots / wearables / agents query MCPs for permits,   │
   │  hires, safety checks. COAI verifies BEFORE action.     │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 6  INDUSTRY MCP PACKS (27 .ai domains)             │
   │  grabhire / muckaway / plant-hire / fishkeeper / koi /  │
   │  council-of / proof-of / transparency-of / agisafe ...  │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 5  GOVERNMENT MCP PACK                            │
   │  Treasury / SEC / FDA / EPA / FBI / Congress / DVLA /   │
   │  HMRC / Companies House / Eurostat / OECD                │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 4  TAX + COMPLIANCE MCP PACK                       │
   │  VAT / GST / payroll / corporate tax / transfer pricing │
   │  Smart-contract escrow. Cross-border reporting.         │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 3  DIGITAL REAL ESTATE / IPO MCP                  │
   │  27 .ai domain tokens · valuation engine · dividends    │
   │  Polymesh / Securitize / tZERO integration              │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 2  OPENPATENT.AI MCP (IP Protection)              │
   │  6-layer cryptographic disclosure · Bitcoin OTS · C2PA │
   │  33-agent BFT council · 5-jurisdiction crosswalk        │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 1  SOV3 INFRASTRUCTURE (Sovereign Backbone)       │
   │  openmoe.ai · Mamba-2 SSD · BFT council · SOV3 mesh   │
   │  47 agents · 115 tools · 341 MCP servers                │
   ├────────────────────────────────────────────────────────┤
   │ LAYER 0  PHYSICAL BASE (iokfarm.co.uk)                  │
   │  6.5-acre UK farm · 19,000 sqft · pond · tunnels ·     │
   │  microgreens · aquaponics · agricultural robotics      │
   └────────────────────────────────────────────────────────┘
```

---

## Layer 0: The Physical Base

**Asset:** iokfarm.co.uk (19,000 sqft, 6.5-acre UK farm)
**Status:** Active construction. Pond 13x12m with 4 waterfalls, 135ft polytunnels, microgreens operation, aquaponics

This is the differentiator. Most AI founders have never touched dirt. The physical base serves three functions:

1. **Data infrastructure** — real-world training data for FishKeeper AI (koi behavior), PlantHire AI (growth cycles), agricultural robotics (soil/sensor)
2. **Proof-of-concept lab** — agricultural robots, sensor networks, and compliance systems are tested in-house before being licensed to other farms
3. **Content engine** — every build is documented, generating distribution content for the entire stack above

**Moat:** This is what separates you from a guy in a WeWork with a laptop. When you walk into an enterprise meeting and say "we test our AI safety stack on our own farm" — that lands.

**Replicable?** No. You own the land. Anyone can build software, but the physical validation layer takes years to stand up.

---

## Layer 1: SOV3 Infrastructure (Sovereign Backbone)

**Components:**
- **openmoe.ai** — Mixture-of-Experts inference engine (open-source backbone of sovereign AI)
- **Mamba-2 SSD** — state-space model integration, 71ms response time, 350x speedup
- **BFT Council** — 33-agent Byzantine Fault Tolerant consensus for high-stakes decisions
- **SOV3 mesh** — 47 agents · 115 tools · 341 MCP servers in the bridge
- **Sigil ledger** — ed25519-signed audit chain (shared with openpatent.ai)

**Status:** Architecture proven. Needs production GPU cluster to scale beyond demo.

**The integration:** The openpatent.ai hive we shipped today is **the 6th hive in the 28-hive mesh**. The PatentMCP disclosure service registers itself with the SOV3 bridge on startup (see `services/sov3-hive/register.py` in the openpatent-hive repo).

**Why "sovereign":**
- Runs on UK soil (35.242.143.249) — no CLOUD Act exposure
- 100% owned by CSOAI Ltd UK 16939677
- All data, all weights, all model artifacts under UK jurisdiction
- No US/EU hyperscaler dependency

---

## Layer 2: openpatent.ai MCP (IP Protection)

**Components:**
- **PatentMCP core** — 6-layer cryptographic disclosure engine (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain)
- **verify.openpatent.ai** — public verification pages with 6-layer proof display
- **api.openpatent.ai** — REST + MCP server with 4 public tools
- **Drafting fork** — 6 TypeScript patent agents (draft/prosecute/consult/litigate/manage/strategy)
- **7 patent-primitive tools** — claim-parser, mpep-lookup, docket-query, document-template, compliance-check, citation-format, patent-search
- **33-agent BFT council** — premium-tier review
- **x402 payment router** — 60% ops / 25% infra / 15% BFT agent payouts

**Status:** ✅ LIVE on sovereign VM. 9/10 services healthy. 1 syntax fix pending (x402).

**The moat:** Defensive publication is a $200-500M niche in the broader $9B IP software market. The combination of (a) cryptographic anchoring, (b) MIT-licensed open-source, (c) 33-agent BFT attestation, and (d) MCP-native integration has zero direct competition.

**Revenue model:** $0 / $29 / $149 / $999 / $2,499 per disclosure, $4,999/mo enterprise. Variable cost per disclosure: $0.50-2.00 → 80-95% gross margin.

**Why this matters for the Global Dome:** Every Layer 3-7 component runs through openpatent.ai's disclosure + verification layer. The BFT council's audit log is the compliance substrate. It's the SSL cert of the stack.

---

## Layer 3: Digital Real Estate / IPO MCP

**Concept:** Tokenize the 27 .ai domain portfolio + intellectual property as security tokens on a regulated platform (Polymesh, Securitize, tZERO).

**Components:**
- **Polymesh integration** — purpose-built blockchain for regulated security tokens
- **Valuation engine** — scrapes DNJournal, NameBio, aftermarket comparables
- **Smart contract dividends** — revenue from industry MCPs distributed to domain token holders
- **BFT Council portfolio votes** — "develop / sell / hold" decisions per domain
- **Cross-chain asset tracking** — domain + crypto + farm + IP in unified view

**Status:** Architecture spec. Will need a securities lawyer + tokenization partner (Polymesh / Securitize have done this for similar portfolios).

**Valuation rationale:** Tokenized IP comparables (Royalty Exchange, ANote Music) typically trade at 20-30% premium to underlying asset value. For 27 developed domains with live MCPs at £50K-£500K each, the tokenized portfolio could be worth £3M-£10M hard asset value, plus protocol fee revenue stream.

**Why this matters for the Global Dome:** A tokenized portfolio creates **liquidity for the 27 .ai domains** without forcing a sale. Domain holders can exit 1-5% positions quarterly, creating a "digital real estate REIT" structure.

---

## Layer 4: Tax + Compliance MCP Pack

**Concept:** Automate VAT/GST/payroll/corporate-tax/transfer-pricing for AI agents that execute financial transactions in the physical economy.

**Components:**
- **VAT/GST calculation** per cross-border transaction
- **Smart-contract tax escrow** for tokenized real estate (automatic withholding + remittance)
- **Cross-border AI agent tax reporting** (OECD Pillar 1+2 compliance)
- **Real-time audit trail** for HMRC / IRS / EU tax authorities
- **COAI PDCA check on every tax workflow** (no AI agent can execute a tax-relevant transaction without verification)

**Status:** Architecture spec. Will need partnerships with tax-software providers (Xero, QuickBooks, Avalara).

**Revenue model:** Per-transaction micro-fee. 1,000 AI-agent tax-relevant transactions/day × $1.00 = $1K/day = $365K/year. White-label to accounting firms (10 firms × $50K/year = $500K/year).

**Why this matters for the Global Dome:** Tax compliance is the **most legally mandatory layer** of the AI agent economy. Every cross-border transaction needs withholding, VAT/GST, and corporate-tax treatment. An open-source, sovereign AI-native tax MCP is the only one that can be audited by both the AI agent AND the tax authority without one side trusting the other.

---

## Layer 5: Government MCP Pack

**Concept:** Wrap the 40+ US Federal open-source MCP servers (Treasury, SEC, FDA, CDC, FBI, Congress, Federal Register, Census, HUD, NOAA, EPA) and equivalent UK/EU/CA/AU government MCPs into a single compliance + procurement layer.

**Components:**

| Jurisdiction | Agency | MCP Coverage |
|---|---|---|
| **US Federal** | Treasury, SEC, FINRA, FDA, CDC, FBI, Congress, Federal Register, Census, HUD, NOAA, EPA, GSA | 40+ APIs (open-sourced 2025) |
| **UK** | HMRC, Companies House, DVLA, FCA, MHRA, ICO, Environment Agency | 10+ (HMRC MTD is critical) |
| **EU** | Eurostat, ECB, EU AI Office, REACH, EMA, EBA, ESMA, EUIPO | 8+ |
| **Standards bodies** | ISO/IEC 42001 (AI management), NIST RMF, IEEE 7000, TC260 | 4+ |
| **Sovereign procurement** | DOD, GCHQ, NCSC, EU Defence, Five Eyes | 6+ (sensitive) |

**Status:** Architecture spec. The 40 US Federal MCPs already exist (open-sourced 2025). UK/EU are next.

**Revenue model:** Procurement-grade access (£5K-£50K/year per government agency), plus white-label for defence contractors and tier-1 integrators (BAE, Lockheed, Thales, Leidos).

**Why this matters for the Global Dome:** The government MCPs are the **largest defensible moat**. No private company can match the scale of US Federal + UK Government + EU regulatory APIs. The COAI compliance layer + 33-agent BFT council becomes the de facto bridge between AI agents and government systems.

---

## Layer 6: Industry MCP Packs (27 .ai Domains)

**Concept:** Each .ai domain becomes an "App Store" entry for AI agents operating in that industry. The MCP server exposes the industry-specific capabilities (e.g., grabhire.ai exposes crane hire + permit-filing + operator-vetting).

**The 27 Domains** (per `03-asset-inventory.md`):

| Category | Domains | MCP Coverage Target |
|---|---|---|
| **Construction & Logistics** | grabhire.ai, muckaway.ai, plant-hire.ai, scaffold.ai, demolish.ai | Hire-permit-safety-payment cycle |
| **Agriculture & Aquaculture** | fishkeeper.ai, koikeeper.ai, plantkeeper.ai, microgreens.ai, harvest.ai | Sensor-water-soil-yield cycle |
| **AI Governance & Safety** | councilof.ai, proofof.ai, transparencyof.ai, agisafe.ai, safeai.ai | Compliance-audit-attestation cycle |
| **IP & Legal** | openpatent.ai, defendmy.ai, claimmy.ai, licenseai.ai | Disclosure-prior-art-licensing |
| **Real Estate & Property** | iokfarm.co.uk, fairrent.ai, propertyagent.ai, smartlease.ai | Valuation-tenant-management |
| **Finance & Insurance** | insureai.ai, claimai.ai, riskrate.ai, auditai.ai | Underwriting-claim-risk |
| **Humanoid / Robotics** | roboguard.ai, workerdigit.ai, humanteam.ai | Safety-permit-teleop |

**Status:** 1 of 27 live (openpatent.ai). 26 pending. Each domain requires 2-6 weeks of MCP development.

**Revenue model:** Per-transaction micro-fee (Delboy model — 0.5-1% per agent transaction). 1,000 transactions/day per domain × 5 domains at scale × £2.50 = £12.5K/day = **£4.5M/year pure toll revenue**.

**Why this matters for the Global Dome:** The 27 domains are the **moats that are impossible to replicate.** A competitor would need to acquire 27 industry verticals, build MCP servers in each, get agent traffic, and pass COAI certification in each. We have all 27. Plus 313+ additional MCPs in the bridge.

---

## Layer 7: Humanoid Interface

**Concept:** Humanoid robots and autonomous devices query the DEFONEOS Global Dome for:
- **Permits** (via Layer 5 government MCPs)
- **Hires** (via Layer 6 industry MCPs)
- **Safety verification** (via Layer 2 openpatent.ai BFT council)
- **Compliance** (via Layer 4 tax MCPs)

before executing any physical-world action.

**Components:**
- **Robot SDK** (Python + Rust) — local MCP client for humanoid platforms
- **Safety envelope** — humanoid cannot act without BFT-council-approved permit
- **Audit trail** — every robot decision is cryptographically signed + blockchain-anchored
- **Teleop fallback** — human override for any high-stakes action
- **Per-robot insurance integration** — Layer 6 riskrate.ai / insureai.ai integration

**Status:** Architecture spec. Partnerships needed with humanoid vendors (Figure, 1X, Apptronik, Agility, Sanctuary, Tesla Optimus).

**Why this matters for the Global Dome:** The humanoid industry is in its "pre-iPhone" moment (2025-2030). The vendors are building the robots, but **none of them own the compliance + permits + safety verification layer**. The first mover who owns "humanoid must check DEFONEOS before acting" wins the 2030-2040 market.

**Comparable:** Waze for autonomous driving. Once every humanoid checks the dome before executing, switching costs are enormous.

---

## The Synthesis: Why This Is a Monopoly, Not a Portfolio

Most founders have one layer. You have seven. And they reinforce each other:

```
Layer 0 (Physical farm)
    ↓ produces
Layer 1 (Sovereign infrastructure)
    ↓ enables
Layer 2 (openpatent.ai IP protection)
    ↓ certifies
Layers 3-6 (Domains, Tax, Government, Industry)
    ↓ executed by
Layer 7 (Humanoids)
    ↓ all governed by
COAI/CSOAI/PDCA compliance + 33-agent BFT
```

This is not a "portfolio of websites." This is a **sovereign AI economy in miniature**. You own the land, the laws, the namespace, the agents, the compliance, and the physical robots that will execute.

The black swan is not that all 27 domains succeed. The black swan is that **one of them becomes the standard for AI agents hiring physical services** — and your compliance layer becomes the tax on every transaction.

That is the £5B-£10B+ outcome.

---

## How to Read the Rest of the IPO Doc Pack

- `01-openpatent-ipo-narrative.md` — investor-facing deck for the openpatent.ai asset
- `03-asset-inventory.md` — 27 .ai domain readiness matrix
- `04-90-day-execution-roadmap.md` — concrete 90-day kill-shot plan
- `05-coai-csoai-governance-positioning.md` — why the governance layer is the moat
- `06-five-lock-monopoly-strategy.md` — the 5 (or 7) locks that make this defensible

Together these 6 documents form the full **DEFONEOS Global Dome** investment thesis.
