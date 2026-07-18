# 🐉 CSOAI.ORG V2 SPEC — POLISHED — 2026-06-21

**Built from:** competitive analysis + demographic analysis + vulnerability scan + absorption strategy + 47-agent town integration + Kimi research swarm + 198 free data sources.

**This is the spec to make csoai.org THE platform for AI governance in the EU AI Act era.**

---

## 1. POSITIONING

**One sentence:** *CSOAI.org is the sovereign, free, open-source Layer 0 for AI governance — where regulators, legislators, enterprises, SMEs, developers, DPAs, and citizens all meet in one clean interface.*

**Tagline options:**
- "The sovereign substrate for AI accountability"
- "One platform. Every framework. Every stakeholder."
- "Layer 0 for AI governance. Free. Open. Sovereign."

---

## 2. INFORMATION ARCHITECTURE

```
csoai.org/
├── /                          → Landing (3-second value prop + role selector)
├── /regulators/               → For EU AI Office, AISI, NIST, ENISA
├── /legislators/              → For parliamentarians
├── /enterprise/               → For Annex III high-risk industries
├── /sme/                      → For 3M+ SMEs (Article 4 widget)
├── /developer/                → SDK, CLI, MCP server
├── /dpa/                      → For Data Protection Authorities
├── /citizen/                  → MMO game, fair-check, complaint
├── /industries/               → 12 vertical landing pages
│   ├── /aviation/
│   ├── /maritime/
│   ├── /pharma/
│   ├── /energy/
│   ├── /banking/
│   ├── /insurance/
│   ├── /education/
│   ├── /healthcare/
│   ├── /cybersecurity/
│   ├── /telecoms/
│   ├── /mining/
│   └── /logistics/
├── /frameworks/               → 13-framework crosswalk
│   ├── /eu-ai-act/
│   ├── /nist-ai-rmf/
│   ├── /iso-42001/
│   ├── /iso-27001/
│   ├── /soc-2/
│   ├── /gdpr/
│   ├── /nis2/
│   ├── /dora/
│   ├── /cra/
│   ├── /mdr/
│   ├── /sr-11-7/
│   ├── /bcbs-239/
│   └── /oscf/
├── /transfer/                 → The "transfer from competitor" wizard
├── /hive/                     → 47-agent town view
├── /horus/                    → Oversight plane
├── /sigil/                    → Public SIGIL chain explorer
├── /pricing/                  → Transparent (no sales call)
├── /docs/                     → Developer docs
├── /about/                    → Mission, B Corp, open-source
└── /api/                      → Public API
```

**Total: 7 role-based homepages + 12 industry pages + 13 framework pages + 6 special pages = 38 entry points.**

---

## 3. THE LANDING PAGE (3-second value prop)

```
[Header: CSOAI logo + role selector dropdown + Sign in]

[HERO]
  "The sovereign substrate for AI accountability."
  
  [3 large buttons]
  [I'm a Regulator]  [I'm an Enterprise]  [I'm Building AI]
  
  [Subtext]
  EU AI Act + 12 frameworks. One platform. Free for citizens, SMEs, and public sector.

[TRUST STRIP]
  "Used by [logos]: EU AI Office · AISI · CNIL · [50 regulators] · [12 industries] · 0 data leaves your jurisdiction"

[3 COLUMN VALUE PROP]
  Sovereign     |     Open     |     Free
  Runs on YOUR  |     CC0 +    |     €0 base
  hardware      |     MIT +    |     tier for
  (M4/M2/       |     Apache   |     everyone.
  on-prem)      |     2.0      |     Pay only
                |              |     for attest.

[SOCIAL PROOF]
  "47 sovereign agents. 60+ BFT councils. 12 industries. €0 base price."
  [Live SIGIL chain ticker]

[BIG CTA]
  [Start free — no credit card]
  [Watch 90-second demo]

[FOOTER]
  47-agent town | B Corp | CC0 | Sovereign Substrate
```

---

## 4. THE TRANSFER WIZARD (kill competitor UX)

When a user clicks `/transfer/`, they see a **grid of every competitor's logo** + a 1-click "switch to CSOAI" button.

```
/transfer/
├── /from/credo-ai/         → "Connect your Credo AI account, export your policies, import to CSOAI. 3 min."
├── /from/holistic-ai/      → same flow
├── /from/vanta/            → same flow
├── /from/drata/            → same flow
├── /from/scrut/            → same flow
├── /from/microsoft-purview/→ "Export from Azure → Import to sovereign substrate. 5 min."
├── /from/ibm-watsonx/      → "Pull your watsonx.governance policies → CSOAI. 5 min."
├── /from/google-vertex/    → "Export GCP IAM → CSOAI. 3 min."
├── /from/one-trust/        → same
├── /from/collibra/         → same
├── /from/atlan/            → same
├── /from/monte-carlo/      → "Drift policies → CSOAI. 3 min."
└── /from/[ANY]/            → "Manual import wizard — paste YAML, get CSOAI. 5 min."

For each:
  ✅ What imports (frameworks, policies, evidence, risk register)
  ✅ What doesn't (vendor-locked data — we say so honestly)
  ✅ Time estimate
  ✅ "Need help?" → live chat (open source: Element/Matrix)
  ✅ "Test before you switch" → parallel-run mode for 30 days
```

**Competitor's customers come to CSOAI because the exit cost is zero. The switching cost is 3 minutes.**

---

## 5. THE 7 ROLE-BASED HOMEPAGES

### 5.1 /regulators/ (Safety Institutes)

```
[HEADER]
  Built for: EU AI Office, AISI (UK/US), NIST, ENISA, BSI, ANSSI, CNIL, Garante

[WHAT YOU GET]
  ✅ Real-time SIGIL chain explorer
  ✅ BFT council dashboard
  ✅ 13-framework crosswalk (single source of truth)
  ✅ OSCAL export (one-click to your audit system)
  ✅ Public-facing dashboard for citizens
  ✅ Free for government use (forever)

[LIVE METRICS]
  - 60+ BFT councils
  - 300+ voters
  - 5,500+ attestations
  - 12 industries covered

[CTA]
  [Request sovereign instance for your jurisdiction]
```

### 5.2 /legislators/

```
[HEADER]
  Built for: EU Parliament, US Congress, UK Parliament, 27 EU national parliaments

[WHAT YOU GET]
  ✅ "Explain Like I'm 5" — plain-English AI Act summaries
  ✅ Constituency compliance dashboard
  ✅ Voting-record / position tracker
  ✅ AI literacy widget (Article 4 compliance)
  ✅ 100% free, 100% ad-free, 100% non-lobbying

[CTA]
  [Embed the AI literacy widget on your site]
```

### 5.3 /enterprise/ (Annex III)

```
[HEADER]
  Built for: Banks, insurers, hospitals, employers, schools, critical infrastructure

[WHAT YOU GET]
  ✅ 13-framework crosswalk
  ✅ 12 industry-specific risk templates
  ✅ Vendor risk assessment (198 free data sources)
  ✅ One-click audit-ready evidence pack
  ✅ API to your existing GRC stack (Vanta/Drata/Scrut)
  ✅ Pricing: per-attestation, transparent

[PRICING CARD]
  Tier         | Cost     | Includes
  Free         | €0/mo    | Up to 5 attestations, 1 framework
  Pro          | €500/mo  | 100 attestations, all 13 frameworks
  Sovereign    | €5K/mo   | Unlimited, on-prem, dedicated council
  Public Sector| €0       | Unlimited, sovereign instance

[CTA]
  [Start free — no credit card]  [Talk to engineer (no sales)]
```

### 5.4 /sme/ (the volume play)

```
[HEADER]
  Article 4 AI literacy compliance in 5 minutes. Free.

[THE 5-MINUTE WIDGET]
  1. "Do you use AI in your business?" (yes/no)
  2. "What for?" (5 options: marketing, ops, finance, HR, other)
  3. "Do you train it on customer data?" (yes/no/sometimes)
  4. "Can you explain its decisions?" (yes/no)
  5. "Want a free AI literacy certificate for your team?" (yes/no)

  → Score: green/amber/red
  → Certificate: PDF + LinkedIn share button
  → Recommended next steps (links to /enterprise/ if high-risk)

[CTA]
  [Take the 5-minute check]
```

### 5.5 /developer/

```
[HEADER]
  Built for: AI engineers, OSS contributors, MCP builders

[WHAT YOU GET]
  ✅ pip install csoai-sdk
  ✅ brew install csoai
  ✅ Docker compose single-binary deploy
  ✅ MCP server: csoai-mcp-server
  ✅ Compliance-as-code: YAML/JSON policies
  ✅ Synthetic data generator
  ✅ Test fixtures for CI/CD

[QUICK START]
  $ pip install csoai-sdk
  $ csoai init
  $ csoai attest --framework eu-ai-act --article 14

[CTA]
  [Read the docs]  [GitHub]
```

### 5.6 /dpa/ (Data Protection Authorities)

```
[HEADER]
  Built for: ICO, CNIL, BfDI, AEPD, Garante, 27 EU DPAs

[WHAT YOU GET]
  ✅ AI-specific DPIA templates
  ✅ Cross-border evidence collection
  ✅ AI incident register (public)
  ✅ Training for DPA staff (free)
  ✅ Public-facing complaint portal

[CTA]
  [Request sovereign instance for your DPA]
```

### 5.7 /citizen/

```
[HEADER]
  Is this AI fair? Filing a complaint? Understanding AI decisions?

[THE 3 CITIZEN TOOLS]
  1. "Is this AI fair?" — 1-question check
  2. Complaint filing — routes to correct DPA
  3. MMO AI literacy game — earn XP, learn AI

[CTA]
  [Check the AI]  [Play the game]
```

---

## 6. THE 12 INDUSTRY PAGES (vertical landing)

Each one:
- Sector-specific risk register
- Sector-specific compliance checklist
- 5 free data sources (from the 198 catalog)
- 3 customer stories (B2B SaaS, B2B enterprise, public sector)
- Pricing
- CTA

Example: `/industries/banking/`
```
[HERO]
  EU AI Act + DORA + SR 11-7 + BCBS 239. For banks.

[WHAT YOU GET]
  ✅ Pre-built risk register (50+ controls)
  ✅ Automated evidence collection (FRED, ECB, World Bank, GLEIF, IMF)
  ✅ One-click DORA ICT-risk report
  ✅ Integration with your GRC (Vanta/Drata/Scrut)
  ✅ BFT council for model-risk decisions

[CTA]
  [Start free]
```

---

## 7. THE TRANSFER BUTTON (competitor absorption)

See Section 4. The `/transfer/` page is the **kill shot** for competitors. 3-minute migration from any vendor. Their customers come to us because leaving them is now free.

---

## 8. THE 47-AGENT TOWN (/hive/)

Live view of all 47 agents. Each agent has:
- Name, hive, role
- Live status (working / resting / voting)
- Sigil history
- Pheromone emissions (visual + audio)

**The world is the product demo.**

---

## 9. THE HORUS OVERSIGHT (/horus/)

Daily intel brief:
- New CVEs matching our stack
- New EU AI Act implementing acts
- BFT council decisions
- Anomalies in agent behavior
- New compliance frameworks added

---

## 10. THE PUBLIC SIGIL EXPLORER (/sigil/)

A blockchain-explorer-style page where anyone can:
- Search any agent's attestations
- Verify any Ed25519 signature
- See real-time BFT council decisions
- Download audit packs

---

## 11. THE OPEN SOURCE STORY

CSOAI = **CC0 core + MIT SDK + Apache 2.0 BFT**. No vendor lock-in. The sovereign substrate is yours. Fork it. Audit it. Run it on your M4.

---

## 12. PRICING (transparent)

| Tier | Cost | Includes |
|---|---|---|
| Free | €0/mo | 5 attestations, 1 framework, 1 user |
| Pro | €500/mo | 100 attestations, 13 frameworks, 5 users |
| Sovereign | €5K/mo | Unlimited, on-prem, dedicated BFT council |
| Public sector | €0 | Unlimited, sovereign instance, B Corp pricing |
| Open source | €0 | Self-hosted, community support |

**No "Contact sales" button anywhere. Transparent. Per-attestation.**

---

## 13. THE OPENGRIDWORKS-STYLE UI

The site uses **OpenGridWorks** UI principles:
- **Open:** every page accessible without login
- **Grid:** consistent 12-col grid, role-based landing pages
- **Works:** every page is functional, not marketing fluff
- **Style:** dark mode default, monospace for sigils, clean sans for prose
- **UI:** shadcn/ui + Tailwind, Framer Motion for hive page

---

## 14. THE METRICS (live, public)

- 47 sovereign agents
- 60+ BFT councils
- 300+ voters
- 5,500+ attestations minted
- 12 industries covered
- 13 frameworks mapped
- 198 free data sources wired
- 0 single-vendor lock-in

---

## 15. THE TECH STACK (verified open)

- **Backend:** SOV3 (Python + FastAPI + gunicorn)
- **DB:** PostgreSQL + Qdrant + Redis
- **Auth:** Clerk (or self-hosted)
- **MCP:** csoai-mcp-server (live)
- **Frontend:** Next.js 14 + React 18 + Tailwind + shadcn
- **Sigils:** Ed25519 + Solana SBT (or any EVM)
- **Hosting:** Vercel + GCP VM mirror + M4 Mac
- **Cost:** ~$0 base (Vercel free + GCP micro + M4)
- **License:** CC0 (data) + MIT (code) + Apache 2.0 (BFT)

---

## 16. THE GO-TO-MARKET

1. **Press** — "CSOAI: First sovereign AI governance platform" (TechCrunch, Wired EU)
2. **Regulators** — direct outreach to EU AI Office + AISI + ENISA
3. **Legislators** — "embed our AI literacy widget" (free)
4. **SMEs** — viral widget (3-min check)
5. **Developers** — SDK + MCP marketplace
6. **Conference** — EU AI Act summit presence

**Target: 1,000 regulators onboarded by Dec 2, 2026 (Annex III deadline).**

---

*JEEVES 2026-06-21 08:00 BST*
*This is the spec. Ship it.*
