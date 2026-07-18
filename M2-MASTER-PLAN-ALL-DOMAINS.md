# MASTER PLAN — All Safety/AI Domains | M2 Takeover
## From code on disk to revenue live on the internet
*Created: 2026-05-31 | Controller: Kilo (M2) | Source: SMB mount at /Users/iokfarm/m4/*

---

## STATUS SNAPSHOT (Live Checks)

### 🟢 LIVE (11 domains)
| Domain | Code | Notes |
|--------|------|-------|
| councilof.ai | 200 | AI governance hero — needs Stripe |
| csoai.org | 200 | "FAA for AI" — 172-page static site live |
| proofof.ai | 200 → www | Deepfake detection, monetized |
| safetyof.ai | 200 | Safety posture — DNS was broken, now fixed |
| suicidestop.ai | 200 | Crisis page only |
| planthire.ai | 200 | Construction equipment |
| muckaway.ai | 200 | Waste management |
| haulage.app | 200 | Trade hub |
| grabhire.ai | 200 | Labour hire |
| templeman-opticians.com | 200 | Real business, £2.5-5K/mo |
| fishkeeper.ai | 200 (redirect) | → meok.ai |
| koikeeper.ai | 200 (redirect) | → meok.ai |

### 🔴 DEAD (7 domains)
| Domain | Dir on M4 | Action |
|--------|-----------|--------|
| diyhelp.ai | ~/diyhelp.ai | Deploy to Vercel |
| loopfactory.ai | ~/loopfactory.ai | Deploy to Vercel |
| pokerhud.ai | ~/pokerhud.ai | Deploy to Vercel |
| industrial-hire-ai.com | ~/industrial-hire-ai | Deploy to Vercel |
| industrial-domains.com | ~/industrial-domains | Deploy to Vercel |
| asisecurity-portal.com | ~/asisecurity-portal | Deploy to Vercel |
| optomobile.ai | ~/Desktop/... | No DNS records + no site |

---

## PHASE 1: IMMEDIATE (Today) — Deploy Dead Domains

### 1.1 Fix Vercel Auth
**Blocker:** Need Vercel token to deploy from M2 or M4.
- On M4: vercel token is at `~/.vercel/config.json` and Vercel is authenticated
- **Option A**: SSH into M4 and deploy from there (Vercel already authed)
- **Option B**: Create token at vercel.com/account/tokens, use from M2
- **Action**: Run `ssh nicholas@192.168.50.105 "cd ~/diyhelp.ai && vercel --prod --yes"` for each dead domain

### 1.2 Deploy Dead Domains from M4 (SSH)
```bash
ssh nicholas@192.168.50.105 'bash -c "
  cd ~/diyhelp.ai && vercel --prod --yes 2>&1 | tail -1
  cd ~/loopfactory.ai && vercel --prod --yes 2>&1 | tail -1
  cd ~/pokerhud.ai && vercel --prod --yes 2>&1 | tail -1
  cd ~/industrial-hire-ai && vercel --prod --yes 2>&1 | tail -1
  cd ~/industrial-domains && vercel --prod --yes 2>&1 | tail -1
  cd ~/asisecurity-portal && vercel --prod --yes 2>&1 | tail -1
"'
```

### 1.3 Fix DNS for Broken Domains
| Domain | Fix |
|--------|-----|
| optomobile.ai | Add A record at Namecheap → 76.76.21.21 |
| safetyof.ai | Verify Vercel alias correct in dashboard |
| csoai.org | Already live — verify 172-page deploy up-to-date |

### 1.4 Free M4 Disk Space (CRITICAL — 2.2GB free)
```bash
ssh nicholas@192.168.50.105 'bash -c "
  # Clear CSOAI zips (41MB each)
  rm ~/Desktop/CSOAI.zip
  rm ~/Desktop/Kimi_Agent_Global\ Dominance\ Strategy.zip
  # Clear large .docx strategy files not needed on disk (can re-gen)
  rm -f ~/*.docx
  # Clear Downloads
  rm -rf ~/Downloads/*.zip ~/Downloads/*.dmg
  # Prune npm cache
  rm -rf ~/.npm/_cacache
  # Clear Docker cache
  docker system prune -af 2>/dev/null
"'
```

---

## PHASE 2: CONTENT & BRANDING (Week 1)

### 2.1 Fix Consumer Clone Brand Names
**Affects:** diyhelp.ai, loopfactory.ai, pokerhud.ai, fishkeeper-ai, koikeeper-ai, industrial-hire-ai
**Problem:** All cloned from meok-ai-frontend with "MEOK AI" branding everywhere
**Fix per domain:**
- layout.tsx: metadata title from "MEOK AI" → correct brand name
- layout.tsx: nav/footer from "MEOK.AI" → correct brand
- package.json: project name correct
- Any MEOK imagery/logo → domain-specific

### 2.2 Complete safetyof.ai to 60/60
Currently scored 44/60. Needs:
- Mobile hamburger menu
- Customer testimonials section
- Framework-specific landing pages
- Interactive free compliance scan demo
- Trust Center page
- Fix TypeScript errors (remove `ignoreBuildErrors`)
- JSON-LD structured data
- OG images for social sharing

### 2.3 Build SEO Foundation
For all 13 domains:
- sitemap.xml with all pages
- robots.txt allowing all crawlers
- JSON-LD Organization/WebSite schema
- OG image + Twitter cards
- Meta descriptions on every page

### 2.4 Design System Unification
- Color palette: Gold (#c9a84c) theme for CSOAI/council, custom for consumer domains
- Shared component library
- Tailwind preset from ~/meok-brand/tailwind-preset.js

---

## PHASE 3: REVENUE ACTIVATION (Week 1-2)

### 3.1 Stripe Live Mode
**Current:** Stripe CLI NOT authed, npm NOT authed
**Actions:**
- Complete Stripe identity verification (Nick — browser)
- Create 4 live products:
  1. councilof.ai — AI Governance SaaS (£499-4,990/mo)
  2. safetyof.ai — Compliance Scan (£299-1,499/mo)
  3. csoai.org — Institutional Certification (£1,999-9,999/mo)
  4. proofof.ai — Deepfake Detection (£79-499/mo)
- Wire Stripe buttons on all domain pricing pages
- Configure webhooks
- Create /success and /cancel pages

### 3.2 CouncilOf.AI Revenue (Priority #1)
**Current:** 200 live, 0 revenue. B2B AI governance SaaS potential.
**Action:**
- Add tiered pricing page (£499/£1,499/£4,990 per month)
- Stripe checkout integration
- Agent catalogue marketplace browsing
- Free tier → paid conversion funnel
- Target: £148K ARR

### 3.3 Grant Pipeline Processing
**Existing grants in ~/grants/:**
- adopt-round-7 — EU Adopt AI
- agriscale — Agriculture AI
- dsit-ai-assurance — UK AI assurance
- nlnet-ngi-zero — NLnet €50K

**Additional targets:**
- Innovate UK Smart Grant (£250K)
- DASA Defence AI (£150K-300K)
- Solana Foundation Grant

### 3.4 Email Outreach
- Configure SMTP (Gmail app password or SendGrid)
- Load 50 fintech prospects into outreach database
- Create email templates for councilof.ai B2B
- Automated follow-up sequence

---

## PHASE 4: CSOAI ECOSYSTEM BUILD-OUT (Week 2-3)

### 4.1 CSOAI.ORG 172-Page Platform
**Current:** ~172 TSX files built, Vite 7, deploy-ready in ~/clawd/csoai-platform/
**Needs:**
- Vercel deploy to app.csoai.org (SPA routing configured)
- Verify all 52 charter articles serve
- Add Stripe checkout for institutional certification
- Add ASSTI benchmark live demo
- Crosswalk pages for all 30 frameworks (EU AI Act, NIST, GDPR, DORA, etc.)

### 4.2 CouncilOf.AI — Governance SaaS
- Agent catalogue marketplace
- BFT council visualization
- Free compliance scan → paid audit
- Verification badges for enterprises

### 4.3 SafetyOf.AI — Compliance Engine
- Free 5-min AI Safety Posture Score
- Paid: Full audit report (£299-1,499)
- Framework-specific deep-dives (13 frameworks)
- MCP compliance server integration

---

## PHASE 5: CONTENT & MARKETING (Week 3-4)

### 5.1 Content Pipeline
- 3 blog posts/week on AI governance, MCP compliance
- Weekly LinkedIn newsletter
- Reddit (r/MachineLearning, r/artificial)
- Hacker News launch

### 5.2 MCP Distribution
- Submit all 324 MCP servers to Smithery (19 already pending)
- Submit to Glama marketplace
- Create `npx meok-setup` installer for Claude Desktop/Cursor/VS Code
- Blog post: "324 MCP Servers for AI Governance — The Definitive Collection"

### 5.3 Social Proof Building
- GitHub stars for csoai-governance repos
- Smithery install counts (target: 500 week 4)
- LinkedIn connections (target: 100 week 4)
- Enterprise testimonials

---

## PHASE 6: SCALE & DOMINATE (Month 2-3)

### 6.1 Global Brand Architecture
```
MEOK (M4)              ← Consumer: £12-29/mo, emotional AI OS
CSoAI (M2)              ← B2B: £299-9,999/mo, governance standard
CouncilOf.AI (M2)       ← B2B SaaS: £499-4,990/mo, compliance marketplace
SafetyOf.AI (M2)        ← B2B: £299-1,499/mo, posture scanning
COBOL Bridge (M4)       ← Enterprise: £1,999-9,999/mo, legacy modernization
Trade Trio (M4)          ← SME: £200-500/mo, construction/waste/hire
```

### 6.2 SAAS/MCO/ACP/A2A/LIB2B Infrastructure
- A2A governance bridge (Agent-to-Agent protocol)
- ACP WebSocket + SIGIL protocol
- MCO marketplace consolidation
- SAAS multi-tenant deployment
- LIB2B integration layer

### 6.3 Revenue Targets
| Phase | KPI | Target |
|-------|-----|--------|
| P1 | Domains live | 13/13 |
| P2 | Content SEO | 40/60 avg score |
| P3 | MRR | £5K |
| P4 | Smithery installs | 500 |
| P5 | LinkedIn following | 500 |
| P6 | Annualized | £100K+ ARR |

---

## COMMAND REFERENCE

### Quick Deploy from M2 (via M4 SSH)
```bash
# Deploy a single domain
ssh nicholas@192.168.50.105 "cd ~/diyhelp.ai && vercel --prod --yes"

# Fix broken domain DNS (Namecheap API)
ssh nicholas@192.168.50.105 "source ~/.secrets/namecheap-api.env && python3 -c '...'"

# Check domain live status
curl -s -o /dev/null -w "%{http_code}\n" https://diyhelp.ai

# Check what a domain serves
curl -s https://diyhelp.ai | head -20
```

### M2 Local Paths
```
# M4 files via SMB mount
/Users/iokfarm/m4/councilof-ai/
/Users/iokfarm/m4/safetyofai/
/Users/iokfarm/m4/CSOAI-CORP/
/Users/iokfarm/m4/CSOAI-Research-Institute/
/Users/iokfarm/m4/diyhelp.ai/
/Users/iokfarm/m4/loopfactory.ai/
/Users/iokfarm/m4/pokerhud.ai/
/Users/iokfarm/m4/suicidestop.ai/
/Users/iokfarm/m4/fishkeeper-ai/
/Users/iokfarm/m4/koikeeper-ai/
/Users/iokfarm/m4/industrial-hire-ai/
/Users/iokfarm/m4/industrial-domains/
/Users/iokfarm/m4/asisecurity-portal/
/Users/iokfarm/m4/Desktop/CSOAI/
/Users/iokfarm/m4/Desktop/CSOAI 2/
/Users/iokfarm/m4/Desktop/MEOK CSOAI/

# Architecture docs
/Users/iokfarm/m4-archives/

# Alignment memory
/Users/iokfarm/ECOSYSTEM-ALIGNMENT.md
```

---

## TOP 5 ACTIONS NOW

| # | Action | Why | How |
|---|--------|-----|-----|
| 1 | **Deploy 7 dead domains** | They have code but aren't serving | SSH into M4, `vercel --prod --yes` on each |
| 2 | **Free M4 disk space** | 2.2GB free — system at risk | Clear zips, .docx, npm cache, Docker |
| 3 | **Fix consumer brand names** | All show "MEOK AI" branding | Edit layout.tsx metadata per domain |
| 4 | **Add Stripe to councilof.ai** | $0 revenue on a live B2B SaaS | Pricing page + checkout integration |
| 5 | **Fix safetyof.ai DNS** | Was serving wrong content | Verify Vercel domain alias |

---

*This plan replaces the M4's domain burden. M4 now handles meok only.*
*All safety/AI governance domains managed from M2 via SMB bridge + SSH.*
