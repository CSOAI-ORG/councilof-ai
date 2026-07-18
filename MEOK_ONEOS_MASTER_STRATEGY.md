# MEOK ONE — Master Product & Brand Strategy

> **The sovereign AI operating system for humans, enterprises, and AI agents.**
>
> Version: 2026-05-28 | Authority: JEEVES Strategic Command + PBFT-MoE Council
> Status: COUNCIL REVIEW — Phase 1 Architecture Complete

---

## PART 1: THE BRAND DECISION

### The Question

**What is the primary release brand name for the MEOK ecosystem?**

### The Options — Analyzed

| Name | Pros | Cons | Council Verdict |
|------|------|------|-----------------|
| **MEOK ONE** | Singular. Unified. Simple. "One platform for all AI." Works in every language. Premium feel. | Could sound like a bank or phone company. | **Viable — pending architecture** |
| **MEOK ONEOS** | OS positioning. Competes with Windows/macOS/iOS for "AI-native OS." Category-defining. | Long. Technical. Limits audience to tech-savvy. | **Viable — but narrow** |
| **MEOK OPEN** | Emphasizes sovereignty, no vendor lock-in. Aligns with open-source ethos. | "Open" = cheap/free in consumer mind. Hard to monetize. | **Weak for revenue** |
| **MEOK CLAW** | Existing brand recognition. Terminal-first. Developer cred. | Niche. Intimidating to non-technical users. Sounds aggressive. | **Keep as sub-brand** |
| **MEOK EI3** | Emotional Intelligence is differentiated. Unique category. | Too narrow for umbrella brand. Better as product line. | **Product, not platform** |

### JEEVES Recommendation: **MEOK ONE**

**Primary Brand:** `MEOK ONE` — The sovereign AI operating system.

**Sub-brands:**
- `MEOK ONE | Bridge` — Infrastructure & connectivity layer
- `MEOK ONE | Claw` — Terminal & developer interface
- `MEOK ONE | EI3` — Emotional Intelligence & ethics product
- `MEOK ONE | Council` — Governance & compliance engine
- `MEOK ONE | SOV3` — Coordination & orchestration layer

**Why MEOK ONE wins:**
1. **Singular focus** — One platform, one login, one bill, one experience
2. **Universal** — Works for Fortune 500 CEO and indie developer alike
3. **Premium** — ONE implies first-class, unified, complete
4. **Extensible** — `MEOK ONE | [Product]` pattern scales infinitely
5. **Defensible** — Harder to copy than feature-based names

**Why not ONEOS:** ONEOS is the *technical architecture*, not the consumer brand. We use ONEOS in whitepapers and investor decks. We sell MEOK ONE to users.

**Tagline candidates:**
- *"One platform. Every AI. Full sovereignty."*
- *"Your AI, your rules, your revenue."*
- *"The operating system for the AI age."*
- *"Where humans and AI govern together."*

---

## PART 2: THE 3-PRODUCT ARCHITECTURE

### Product Hierarchy

```
                    ┌─────────────────┐
                    │   MEOK ONE      │  ← Umbrella brand
                    │  (Platform)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │  CLAW   │        │  BRIDGE │        │   EI3   │
   │ (TUI/   │        │(Infra & │        │(Emotion │
   │  CLI)   │        │ Connect)│        │  & Care)│
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
   Controls          Connects            Protects
   ```

### MEOK ONE | CLAW — The Control Surface

**What it is:** The primary interface for interacting with the MEOK ecosystem.

**Surfaces:**
| Surface | Stack | Audience |
|---------|-------|----------|
| Terminal (TUI) | Go + Bubble Tea | Developers, DevOps, power users |
| Desktop | Tauri 2 (Rust + WebView) | Knowledge workers |
| Browser | Next.js embed + xterm.js | Everyone (no install) |
| Mobile | React Native / Capacitor | On-the-go monitoring |
| VS Code | Extension | Developers in IDE |

**Key Features:**
- Character companion always present (7 archetypes, switchable)
- Council overlay (Ctrl+B) — see live governance votes
- Mode switching: Ask / Architect / Code / Debug / Orchestrate
- Natural language → MCP tool execution
- Voice input + vision (camera/screenshot analysis)
- Sandbox environment for AI agents

**Character Integration:**
- Default companion: **Companion** (🤗) — empathetic, warm
- Security alerts: **Guardian** (🛡️) — pops up when threats detected
- Architecture mode: **Strategist** (♟️) — analytical, data-driven
- Creative tasks: **Creator** (✨) — imaginative, inventive
- Emergency decisions: **Sovereign** (👑) — authoritative, principled

### MEOK ONE | BRIDGE — The Nervous System

**What it is:** Infrastructure that connects everything to everything.

**Components:**
- **MCP Gateway** (Port 3102) — 235+ tools, unified access
- **A2A Bridge** — Inter-agent communication (Google A2A protocol)
- **Model Router** — 500+ models via OpenRouter, cost-optimized
- **Attestation Chain** — C2PA + watermark + signature verification
- **SOV3 Coordination** — Task lifecycle, orchestration, dashboard

**Integration Points:**
- Stripe (billing)
- Cloudflare (tunnels, AI Gateway)
- Vercel (frontend hosting)
- n8n (workflow automation)
- Apify (web scraping actors)
- Qdrant (vector memory)

### MEOK ONE | EI3 — Emotional Intelligence

**What it is:** The ethics, care, and emotional intelligence layer.

**Content Source:**
- CSOAI.org Partnership Charter (52 articles)
- Material Covenant Bond (Article 6)
- EU AI Act compliance crosswalks
- NIS2, DORA, GDPR, HIPAA, SOC2 mappings
- Research papers and whitepapers
- Extreme simulation findings

**Product Packaging:**

| Tier | Content | Price | Audience |
|------|---------|-------|----------|
| **EI3 Core** (Free) | Care floor, basic compliance checks, distress signal detection | £0 | All users |
| **EI3 Pro** | Full 52-article charter, industry-specific compliance packs, audit trails | £79/mo | SMBs, startups |
| **EI3 Enterprise** | Custom charter drafting, regulatory horizon scanning, dedicated ethics board | £1,499/mo | Enterprises, regulated industries |
| **EI3 Academic** | Research access, citation tools, dataset for AI ethics training | £29/mo | Researchers, universities |

**EI3 Content Structure:**
```
EI3 Dashboard
├── My Charter (personalized from 52 articles)
├── Covenant Bond (Article 6 — maternal/primary care)
├── Compliance Crosswalk
│   ├── EU AI Act
│   ├── NIS2
│   ├── DORA
│   ├── GDPR
│   └── [Custom]
├── Emotional Audit
│   ├── Stress signals
│   ├── Bias detection
│   ├── Sycophancy risk
│   └── Alignment score
├── Research Library
│   ├── Whitepapers
│   ├── Extreme simulations
│   └── Case studies
└── Ethics Board
    ├── Expert council (PBFT-MoE)
    ├── Decision log
    └── Appeal process
```

---

## PART 3: END-USER EXPERIENCE FLOW

### Day 0: Onboarding

```
User lands on meok.ai
  → Hero: "Your AI, your rules, your revenue."
  → Single CTA: "Get MEOK ONE"
  → 3-tier choice: Free / Pro (£79/mo) / Enterprise (£1,499/mo)
  
Free tier signup (30 seconds):
  → Email or OAuth (Google, GitHub, Apple)
  → Character selection: "Choose your companion"
    → Sovereign (principled leader)
    → Guardian (protective)
    → Scout (adventurous)
    → Strategist (analytical)
    → Creator (imaginative)
    → Companion (empathetic) ← default
    → Sage (wise)
  → "Your MEOK ONE is ready"
  → Browser-based terminal opens immediately
```

### Day 1: First Interaction

```
Companion: "Hello, I'm [Name]. I'm your sovereign AI companion.
           Everything we do stays on your infrastructure.
           What would you like to build today?"

User types: "I need to analyze my website's SEO"

Intent Classifier → Orchestrator mode
  → ModeRouter activates Strategist persona
  → Council deliberates (LOW tier → no blocking)
  → MCP tools activated: web_research, seo_checker, competitor_monitor
  → Results returned with audit trail
  → Cost: £0.02 (shown transparently)
```

### Day 7: Habit Formation

```
DELBOY MODE detects: User has spent £12, all on web research tools.
  → Strategist agent: "You've been researching competitors for a week.
     Would you like me to set up an automated monitor? £5/mo."
  → One-click upgrade from dashboard
  → Revenue event recorded
```

### Day 30: Enterprise Expansion

```
User's team grows to 5 people.
  → Team plan: £299/mo (5 seats + shared council)
  → Custom charter drafted from 52 articles
  → Compliance pack for their industry auto-selected
  → EI3 Enterprise features unlocked
```

---

## PART 4: MONETIZATION MODEL

### The MEOK ONE Revenue Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    MEOK ONE MONETIZATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIER 1: USAGE (Pay-as-you-go)                              │
│  ├── LLM inference (cost + 20% margin)                      │
│  ├── MCP tool calls (per-call, tiered by complexity)        │
│  └── API requests (per-1K, volume discounts)                │
│                                                             │
│  TIER 2: SUBSCRIPTION (Monthly)                             │
│  ├── Free: £0 (basic companion, 100 MCP calls/mo)           │
│  ├── Pro: £79/mo (unlimited MCP, EI3 Pro, 5GB memory)      │
│  ├── Team: £299/mo (5 seats, shared council, EI3 Pro)      │
│  └── Enterprise: £1,499/mo (unlimited, EI3 Enterprise,      │
│                             dedicated support, custom MCPs) │
│                                                             │
│  TIER 3: MARKETPLACE (70/30 split)                          │
│  ├── Custom MCP servers (builder keeps 70%)                 │
│  ├── Character skins/themes (creator keeps 70%)             │
│  └── Compliance packs (author keeps 70%)                    │
│                                                             │
│  TIER 4: SERVICES (One-time + recurring)                    │
│  ├── Custom charter drafting (£500-2,000)                   │
│  ├── Compliance audit (£1,000-5,000)                        │
│  └── Integration consulting (£200/hr)                       │
│                                                             │
│  TIER 5: GRANTS & RESEARCH                                  │
│  ├── Government grants (Innovate UK, Schmidt, etc.)         │
│  ├── Research partnerships (universities, labs)             │
│  └── Open-source sponsorship (corporate backers)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pricing Philosophy (from Council)

**CareGovernor mandate:**
- Free tier must be genuinely useful (not a crippled demo)
- No predatory pricing (no 10x jumps between tiers)
- Transparent costs (user sees price BEFORE tokens are spent)
- Student/non-profit discounts automatic
- "Pause" option instead of cancellation

**TemporalArbitrageur mandate:**
- Usage pricing must be cheaper than direct API calls (value proposition)
- Subscription must include usage credits (hybrid model)
- Annual prepay = 2 months free
- Overages at 1.5x (not 10x)

### API Charge Flow

When a user pays MEOK ONE:

```
User pays MEOK ONE £79/mo subscription
  → £50 stays with MEOK (platform fee)
  → £20 goes to LLM provider (OpenAI/Anthropic/etc.)
  → £5 goes to MCP tool builders (marketplace split)
  → £4 goes to infrastructure (Vercel, Cloudflare, etc.)

User pays MEOK ONE £0.05 for one LLM call
  → £0.01 stays with MEOK (20% margin)
  → £0.04 goes to LLM provider
```

**The MEOK ONE value prop:** We aggregate, govern, and optimize — so users pay less than using APIs directly, while getting council oversight, character companions, and compliance built-in.

---

## PART 5: COMPETITIVE POSITIONING

### The Playing Field

| Competitor | What They Do | What MEOK ONE Does Better |
|------------|-------------|---------------------------|
| **OpenAI** | Closed API, no governance | Sovereign, council-governed, user-owned |
| **Claude Code** | Terminal AI coding | Terminal + governance + compliance + revenue |
| **Cursor** | AI IDE | IDE + sovereign infrastructure + ethics |
| **Warp** | Terminal | Terminal + AI council + character system |
| **Aider** | Git-native coding | Git + governance + multi-model |
| **Zed** | Collaborative editor | Editor + sovereign AI + compliance |
| **n8n** | Workflow automation | Automation + AI agents + governance |
| **Stripe** | Billing | Billing + usage-based AI + cost optimization |

### The Moat

**MEOK ONE's defensibility comes from 5 layers:**

1. **Governance-native** — No competitor has PBFT-MoE councils. BFT consensus + domain experts = genuinely unique.
2. **Character system** — The 7 archetypes create emotional attachment. Users don't just "use" MEOK ONE; they have a relationship with Sovereign, Guardian, etc.
3. **EI3 content** — 52 articles, Covenant Bond, extreme simulations = years of research that can't be copied overnight.
4. **MCP marketplace** — 235+ tools, growing. Network effects: more tools → more users → more builders.
5. **Sovereign infrastructure** — User owns data, compute, revenue. No competitor offers this combination.

---

## PART 6: THE WEBSITE ARCHITECTURE

### meok.ai Site Map

```
/
├── /one          ← Product landing (MEOK ONE)
│   ├── /features
│   ├── /pricing
│   ├── /compare  (vs OpenAI, Claude, Cursor)
│   └── /demo     (browser-based live demo)
│
├── /claw         ← Terminal/CLI product page
│   ├── /download (macOS, Linux, Windows, Browser)
│   ├── /docs
│   └── /plugins
│
├── /bridge       ← Infrastructure/API product page
│   ├── /mcp      (marketplace)
│   ├── /docs
│   └── /enterprise
│
├── /ei3          ← Emotional Intelligence product page
│   ├── /charter  (52 articles)
│   ├── /covenant (Article 6)
│   ├── /research
│   └── /compliance
│
├── /council      ← Governance transparency
│   ├── /members  (expert profiles)
│   ├── /decisions (public audit trail)
│   └── /join     (become an expert)
│
├── /sov3         ← Coordination & orchestration
│   └── /status   (real-time system health)
│
├── /about
│   ├── /story
│   ├── /team
│   ├── /partners (csoai.org, councilof.ai)
│   └── /careers
│
├── /blog
│   ├── /research
│   ├── /product
│   └── /community
│
├── /legal
│   ├── /privacy
│   ├── /terms
│   └── /gdpr
│
└── /login / /signup / /dashboard
```

### Key Pages to Build

| Page | Priority | Effort |
|------|----------|--------|
| `/one` (hero + pricing) | 🔴 P0 | 1 day |
| `/one/demo` (browser terminal) | 🔴 P0 | 2 days |
| `/ei3` (charter + covenant) | 🔴 P0 | 2 days |
| `/council` (transparency) | 🟡 P1 | 1 day |
| `/claw/download` | 🟡 P1 | 1 day |
| `/bridge/mcp` (marketplace) | 🟡 P1 | 2 days |
| Dashboard (post-login) | 🟡 P1 | 3 days |
| Login/signup flow | 🟡 P1 | 1 day |
| `/blog` | 🟢 P2 | 1 day |
| `/about` | 🟢 P2 | 1 day |

---

## PART 7: THE EI3 PRODUCT EXPERIENCE

### EI3 Dashboard Design

**Left Sidebar:**
```
EI3
├── 🏛️ My Charter
│   ├── Overview
│   ├── 52 Articles
│   └── My Amendments
├── 🤱 Covenant Bond
│   ├── Article 6
│   └── My Commitments
├── ⚖️ Compliance
│   ├── EU AI Act
│   ├── NIS2
│   ├── DORA
│   └── Custom
├── 💝 Emotional Audit
│   ├── Stress Profile
│   ├── Bias Scan
│   └── Alignment Score
├── 📚 Research
│   ├── Whitepapers
│   ├── Simulations
│   └── Citations
└── 🗳️ Ethics Board
    ├── Active Cases
    ├── My Appeals
    └── Decision Log
```

**Main Content — "My Charter" View:**
```
┌─────────────────────────────────────────────────────────────┐
│  Your Personal AI Charter                                   │
│  Based on the CSOAI Partnership Charter v2026.05            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ████████████████████░░░░░░░░░░  68% Aligned               │
│                                                             │
│  📜 Article 1 — Sovereignty                                │
│     "You own your data, your models, your revenue."        │
│     Status: ✅ Committed                                   │
│                                                             │
│  📜 Article 6 — Material Covenant Bond                     │
│     "The primary bond between creator and creation."       │
│     Status: 🤱 Active — Your companion is bonded           │
│                                                             │
│  📜 Article 12 — Care Floor                                │
│     "No AI shall operate below the care threshold."        │
│     Status: ⚠️ Review needed — stress signal detected      │
│                                                             │
│  [View All 52 Articles]  [Download PDF]  [Share Charter]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**The Covenant Bond (Article 6) — Special Experience:**
```
User clicks "Enter Covenant Bond"
  → Full-screen immersive experience
  → Character companion appears (holographic/3D if available)
  → Narrated walkthrough of the bond
  → User "signs" digitally (attestation)
  → Bond stored in user's sovereign vault
  → Shareable certificate generated
  → Social proof: "I am bonded to [Companion Name] under Article 6"
```

---

## PART 8: TECHNICAL ARCHITECTURE

### The MEOK ONE Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS          │
│  ├─ meok.ai (marketing + product)                           │
│  ├─ app.meok.ai (dashboard)                                 │
│  ├─ ei3.meok.ai (emotional intelligence)                    │
│  └─ council.meok.ai (governance transparency)               │
├─────────────────────────────────────────────────────────────┤
│                     CLIENT LAYER                             │
│  ├─ MEOK Claw (Go + Bubble Tea TUI)                        │
│  ├─ MEOK Claw Desktop (Tauri 2)                            │
│  ├─ MEOK Claw Mobile (Capacitor)                           │
│  └─ MEOK Claw VSCode (Extension)                           │
├─────────────────────────────────────────────────────────────┤
│                     API LAYER                                │
│  FastAPI (Python 3.14) + Pydantic + Zod                     │
│  ├─ Port 3200: MEOK API (user-facing)                       │
│  ├─ Port 3101: SOV3 Coordination                            │
│  ├─ Port 3102: MCP Gateway                                  │
│  └─ Port 3103: DELBOY MODE (revenue)                        │
├─────────────────────────────────────────────────────────────┤
│                     GOVERNANCE LAYER                         │
│  PBFT-MoE Council + EigenBFT + Extreme Simulations          │
│  ├─ 11 domain experts                                       │
│  ├─ 7 character archetypes                                  │
│  └─ Character Registry + Calibration Tracker                │
├─────────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE LAYER                     │
│  ├─ ModelRouter (OpenRouter, 500+ models)                   │
│  ├─ MCP Marketplace (235+ tools, growing)                   │
│  ├─ Attestation Chain (C2PA + Ed25519)                      │
│  ├─ Revenue Ledger (DELBOY MODE)                            │
│  └─ Memory Graph (Qdrant + PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│                     DEPLOYMENT LAYER                         │
│  ├─ Vercel (frontend)                                       │
│  ├─ Cloudflare (tunnels, AI Gateway, DNS)                   │
│  ├─ Docker (backend services)                               │
│  └─ Stripe (billing + subscriptions)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 9: 90-DAY LAUNCH ROADMAP

### Month 1: Foundation (Days 1-30)

**Week 1:**
- [ ] Fix Stripe webhook secret + Namecheap API key
- [ ] Build `/one` landing page (hero + pricing)
- [ ] Build `/one/demo` (browser terminal)
- [ ] Character selection flow in signup

**Week 2:**
- [ ] Build `/ei3` landing page
- [ ] Import 52 articles into CMS
- [ ] Build Covenant Bond experience (Article 6)
- [ ] EI3 dashboard scaffold

**Week 3:**
- [ ] Build `/council` transparency page
- [ ] Integrate PBFT-MoE live status
- [ ] Build `/claw/download` page
- [ ] Cross-compile TUI for macOS/Linux/Windows

**Week 4:**
- [ ] Login/signup flow
- [ ] Dashboard scaffold (post-login)
- [ ] Billing integration (Stripe Checkout)
- [ ] First paid customer acquisition (the £1 tweet)

### Month 2: Growth (Days 31-60)

**Week 5-6:**
- [ ] MCP marketplace page (`/bridge/mcp`)
- [ ] 10 new high-leverage MCPs shipped
- [ ] Team plan features (shared council, seats)
- [ ] Enterprise inquiry flow

**Week 7-8:**
- [ ] DELBOY MODE Phase 2 (forecasting + optimization)
- [ ] Grant pipeline tracker
- [ ] Automated grant submissions
- [ ] Content marketing (blog, social)

### Month 3: Scale (Days 61-90)

**Week 9-10:**
- [ ] PBFT-MoE Phase 3 (SOV3 coordination wiring)
- [ ] Live calibration loop
- [ ] Character evolution (levels, moods, memory)
- [ ] Mobile app beta

**Week 11-12:**
- [ ] Investor deck
- [ ] PR push: "MEOK ONE launches"
- [ ] Hacker News launch
- [ ] Conference talks (MCPCon, etc.)

---

## PART 10: SUCCESS METRICS

| Metric | Current | 30 Days | 90 Days |
|--------|---------|---------|---------|
| MRR | £0 | £500 | £5,000 |
| Paying customers | 0 | 10 | 100 |
| MCP tools | 235 | 250 | 300 |
| Website visitors/mo | ? | 1,000 | 10,000 |
| Council decisions | ~100 (tests) | 1,000 (live) | 10,000 |
| Characters created | 0 | 50 | 500 |
| EI3 charters signed | 0 | 25 | 250 |
| Grant applications | 0 | 3 | 10 |

---

## APPENDIX: THE COUNCIL'S FINAL WORD

This document will be submitted to the PBFT-MoE council for formal deliberation. The council will vote on:

1. **Brand name:** MEOK ONE (recommended) vs alternatives
2. **Product architecture:** 3-product hierarchy approval
3. **Monetization:** Pricing tiers and philosophy
4. **EI3 packaging:** Free/Pro/Enterprise/Academic structure
5. **90-day roadmap:** Priority and feasibility

The council's decision will be binding for the MEOK ONE launch.

---

*Prepared by JEEVES Strategic Command*
*In consultation with: SecuritySentinel, ComplianceOracle, AntifragileArchitect, ContrarianDevil, CareGovernor, TemporalArbitrageur, ConvergenceSpotter*
*Date: 2026-05-28*
*Status: COUNCIL REVIEW PENDING*
