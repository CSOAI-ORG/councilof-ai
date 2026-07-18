# MASTER IMPROVEMENT PLAN — From Scaffold to 100/100
## 2026-05-14 | Comprehensive Audit Results

---

## CURRENT STATE SCORES

### Websites
| Project | Brand | Content | UX | SEO | Revenue | Prod | **Total** | Priority |
|---------|-------|---------|-----|-----|---------|------|-----------|----------|
| safetyofai | 8 | 8 | 7 | 7 | 7 | 7 | **44/60** | Polish to 60/60 |
| templeman-opticians | 8 | 9 | 8 | 9 | 6 | 5 | **45/60** | Polish to 60/60 |
| industrial-hire-ai | 5 | 4 | 4 | 3 | 2 | 3 | **21/60** | Rebuild |
| meok-ai-frontend | 4 | 3 | 3 | 2 | 1 | 2 | **15/60** | Rebuild |
| fishkeeper-ai | 3 | 2 | 3 | 1 | 1 | 2 | **12/60** | Rebuild or kill |
| koikeeper-ai | 3 | 2 | 3 | 1 | 1 | 2 | **12/60** | Merge into fishkeeper |
| diyhelp.ai | 3 | 2 | 3 | 1 | 1 | 2 | **12/60** | Rebuild or kill |
| pokerhud.ai | 2 | 1 | 3 | 1 | 1 | 2 | **10/60** | Domain flip |
| loopfactory.ai | 2 | 1 | 3 | 1 | 1 | 2 | **10/60** | Domain flip |
| suicidestop.ai | 2 | 1 | 3 | 1 | 1 | 2 | **10/60** | Crisis page only |

### MCP Servers (Top 5)
| Server | Grade | Key Issue |
|--------|-------|-----------|
| eu-ai-act-compliance | A- | Best-in-class, needs functional tests |
| care-membrane | B+ | No try/except on imports, 12-param tools |
| gdpr-compliance-ai | B | No FTS5, generic README |
| iso-27001-ai | B | No FTS5, generic README |
| csoai-governance-crosswalk | B- | Returns raw markdown, 2500 lines of data in code |

### Revenue Infrastructure
| System | Readiness | Blocker |
|--------|-----------|---------|
| Stripe Checkout | 30% | Price IDs placeholder, buttons unwired |
| Landing Pages | 40% | 1 static HTML, placeholder links |
| Email Outreach | 20% | No SMTP credentials, never run |
| Content Pipeline | 15% | No API credentials, nothing posted |
| Brand Consistency | 25% | No shared design system |

---

## COMPETITIVE BENCHMARK (What 100/100 Looks Like)

| Competitor | Design Score | Key Pattern |
|-----------|-------------|-------------|
| Vanta | 98/100 | "Agentic Trust Platform", 4-tier pricing, 16K customers |
| Lakera | 96/100 | Gamification (Gandalf), sub-50ms latency, Check Point acquired |
| OneTrust | 95/100 | "AI-Ready Governance Platform™", 14K customers, Gartner MQ |
| Drata | 92/100 | Space theme, "Agentic AI", 8K customers |
| Protect AI | 90/100 | Palo Alto acquired, open-source strategy |

**Key patterns:**
- "Agentic" is table-stakes framing
- Quantified social proof ("2,000 hrs saved") > logos alone
- Free tier / freemium drives adoption
- Analyst recognition (Gartner, Forrester) is king
- Dark-themed security aesthetic is standard

---

## PHASE 1: CRITICAL FIXES (This Week)

### 1.1 Fix Consumer Clone Brand Names (30 min)
**Affects:** fishkeeper, koikeeper, diyhelp, pokerhud, loopfactory, suicidestop

Each project needs:
- `layout.tsx`: Change metadata from "MEOK AI" to correct brand name
- `layout.tsx`: Change nav from "MEOK.AI" to correct brand
- `layout.tsx`: Change footer from "MEOK AI" to correct brand
- `package.json`: Change name from "meok-ai-frontend" to correct name
- Delete `app/` directory at root (conflicts with `src/app/`)

### 1.2 Fix Broken READMEs
- muckaway-ai-mcp: Fix broken title and empty description
- planthire-ai-mcp: Add real content

### 1.3 Wire SafetyOf.AI Stripe Buttons (1 hour)
- Connect pricing page buttons to `/api/stripe-checkout`
- Uncomment webhook signature verification
- Create `/success` page
- Configure real price IDs (after Stripe Live Mode)

### 1.4 Fix SafetyOf.AI TypeScript Errors
- Remove `ignoreBuildErrors: true` from next.config
- Fix actual TypeScript errors

---

## PHASE 2: QUALITY UPGRADES (Week 1-2)

### 2.1 MCP Server Quality
For each of the top 19 servers:
- Write 10+ functional tests per server
- Add Pydantic input validation
- Add `meok_labs` branding to all responses
- Fix csoai-governance-crosswalk to return structured dicts
- Extract 2500 lines of data from csoai server.py to SQLite
- Add HMAC attestation to all compliance servers
- Rewrite generic READMEs with real examples

### 2.2 Website SEO
For safetyofai and templeman-opticians:
- Add JSON-LD structured data
- Add OG images
- Add sitemap.xml and robots.txt
- Fix heading hierarchy
- Add meta descriptions to all pages

### 2.3 Templeman Opticians
- Replace `[PHONE]` placeholders
- Configure Formspree
- Add OG/Twitter meta tags
- Add ARIA labels

---

## PHASE 3: REVENUE ACTIVATION (Week 2-3)

### 3.1 Stripe Live Mode
- Complete identity verification
- Create 4 live products
- Configure webhooks
- Update all env vars

### 3.2 Email Automation
- Configure SMTP (Gmail app password or SendGrid)
- Load 50 fintech prospects into outreach.db
- Fix days_to_deadline to be dynamic
- Add unsubscribe mechanism
- Add GDPR compliance footer

### 3.3 Content Pipeline
- Configure Twitter API credentials
- Update content library (stale since May 4)
- Start posting 3x/day
- Recreate LinkedIn profile
- Post first 3 LinkedIn posts

### 3.4 Landing Pages
- Fix MEOK pricing page Stripe links
- Create COBOL Bridge landing page
- Create ProofOf.AI landing page
- Add analytics (Plausible or Vercel Analytics)

---

## PHASE 4: BRANDING & DESIGN (Week 3-4)

### 4.1 Shared Design System
Create `@meok-ui/tokens` package with:
- Color palette (unified across all projects)
- Typography scale (Inter + Fira Code)
- Spacing system
- Component primitives (Button, Card, Input, Badge)
- Dark/light theme CSS variables

### 4.2 Consumer Cluster Strategy
**Decision needed:** Kill or differentiate?

**Option A: Kill 5, keep 2** (Recommended)
- Keep: fishkeeper.ai (merge koikeeper into it as premium tier)
- Keep: diyhelp.ai (if differentiated with real DIY content)
- Kill/domain-flip: pokerhud.ai, loopfactory.ai, suicidestop.ai

**Option B: Differentiate all 7**
- Each needs unique design, content, and features
- 7x the work for marginal revenue
- Consumer AI is low-margin (£4.99-7.99/mo)

### 4.3 SafetyOf.AI to 60/60
- Add mobile hamburger menu
- Add customer testimonials section
- Add framework-specific landing pages (EU AI Act, ISO 27001, etc.)
- Add interactive demo (free compliance scan)
- Add Trust Center page
- Remove `ignoreBuildErrors`

---

## PHASE 5: SCALE (Month 2-3)

### 5.1 MCP Distribution
- Submit all 218 servers with smithery.yaml to Smithery
- Submit to Glama (web-based)
- Create `npx meok-setup` installer for Claude Desktop/Cursor/VS Code
- Write blog post: "235 MCP Servers for AI Governance"

### 5.2 Content Marketing
- 3 blog posts/week on MCP compliance
- Weekly LinkedIn newsletter
- Reddit posts (r/MachineLearning, r/artificial)
- Hacker News launch

### 5.3 Sales Pipeline
- 50 fintech outreach (Clearscore, Zopa, Monzo, Starling)
- 10 Loom videos/week
- 5 discovery calls/week
- Target: 1 deal/week at £5K

### 5.4 Grants
- NLnet (€50K) — most accessible
- Innovate UK Smart Grant (£250K) — application drafted
- DASA (£150K-300K) — defence AI

---

## METRICS TRACKER

| Metric | Current | Week 1 | Week 4 | Week 12 |
|--------|---------|--------|--------|---------|
| MRR | £0 | £0 | £5K | £25K |
| Smithery uses | 0 | 50 | 500 | 5K |
| Website scores (avg) | 18/60 | 25/60 | 40/60 | 55/60 |
| MCP test coverage | 0% | 10% | 50% | 80% |
| LinkedIn connections | 0 | 25 | 100 | 500 |
| Sales calls | 0 | 3 | 10 | 30 |
| Deals closed | 0 | 0 | 1 | 5 |
