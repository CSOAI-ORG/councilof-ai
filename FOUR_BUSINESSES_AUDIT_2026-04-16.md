# 🎯 E2E AUDIT: 4 CORE BUSINESSES
## Complete Assessment + Execution Plan
**Date:** April 16, 2026  
**Auditor:** JEEVES (MEOK AI Labs)  
**Scope:** csoai.org × meok.ai × cobolbridge.ai × proofof.ai

---

## 📊 EXECUTIVE SUMMARY

| Business | Domain | Status | Revenue Ready | Blocker |
|----------|--------|--------|---------------|---------|
| **CSOAI** | csoai.org | 🟡 85% | Almost | DNS + Stripe Live |
| **MEOK** | meok.ai | 🟡 80% | Almost | DNS + Stripe Live |
| **COBOL Bridge** | cobolbridge.ai | 🟡 70% | No website | Build site + DNS |
| **ProofOf.AI** | proofof.ai | 🔴 40% | No website | Build from scratch |

**Combined Revenue Potential:** £5,000-50,000 MRR within 6 months

---

## 1️⃣ CSOAI.ORG — The Governance Arm

### ✅ WHAT'S WORKING
| Component | Status | Details |
|-----------|--------|---------|
| **Website** | ✅ Complete | ~/CSOAI-CORP/vercel-sites/csoai-org/ |
| | | - index.html (2,498 lines, full brand) |
| | | - pricing.html with Stripe links |
| | | - certification/ (CASA tracks) |
| | | - 52-article charter |
| **Vercel** | ✅ Deployed | prj_T9nqKwDGm0FHrq8nF6m9LcuwELh2 |
| **Stripe Products** | ✅ Ready | 22 products configured |
| | | - CASA certs: £2,500-25,000 |
| | | - Bundles: £99-499/mo |
| **MCP Servers** | ✅ Built | ai-self-audit, eu-ai-act-compliance |
| **GitHub** | ✅ Live | CSOAI-ORG (208 repos) |

### 🔴 CRITICAL GAPS
| Gap | Impact | Fix Time |
|-----|--------|----------|
| **DNS not pointing to Vercel** | 🔴 Site unreachable | 5 min |
| **Stripe in TEST mode** | 🔴 Cannot take payments | 30 min |
| **James Castle has access** | 🔴 Security risk | 15 min |

### 💰 REVENUE STREAMS
1. **CASA Certifications** — £2,500-25,000 (one-time)
2. **Governance Bundles** — £99-499/mo
3. **EU AI Act Consulting** — £2,000-15,000/project
4. **MCP Subscriptions** — £9-79/mo per server

---

## 2️⃣ MEOK.AI — The Consumer AI OS

### ✅ WHAT'S WORKING
| Component | Status | Details |
|-----------|--------|---------|
| **Website** | ✅ Complete | ~/clawd/meok/ui/website/ |
| | | - index.html (418 lines) |
| | | - pricing.html (£12-29/mo) |
| | | - 18 pages total |
| **Vercel** | ✅ Deployed | prj_uyQUG4G4FQPCwVjMDmBYYLaeBp7G |
| **Next.js App** | ✅ Built | ~/clawd/meok/ui/ (full Next.js 14) |
| **MCP Servers** | ✅ 182 built | ~/clawd/mcp-marketplace/ |
| **Stripe Products** | ✅ Ready | 182 products configured |
| **PyPI Stubs** | ✅ Ready | meok-* prefix reserved |

### 🔴 CRITICAL GAPS
| Gap | Impact | Fix Time |
|-----|--------|----------|
| **DNS not pointing to Vercel** | 🔴 Site unreachable | 5 min |
| **Stripe in TEST mode** | 🔴 Cannot take payments | 30 min |
| **6 pricing mismatches** | 🟡 Over/under charging | 1 hour |
| **No Dockerfiles** | 🟡 Cannot list on Glama | 4 hours |

### 💰 REVENUE STREAMS
1. **MEOK Core Pack** — £49/mo (flagship)
2. **Individual MCPs** — £9-199/mo
3. **MEOK Pro/Business** — £99-299/mo
4. **API Credits** — £9-99 packs

---

## 3️⃣ COBOLBRIDGE.AI — Legacy Modernization

### ✅ WHAT'S WORKING
| Component | Status | Details |
|-----------|--------|---------|
| **Landing Page** | ✅ Built | ~/clawd/cobolbridge-site/index.html |
| **Vercel Project** | ✅ Created | prj_mw8hsxE1aBJyR5YtCMqjE7OAZDp9 |
| **MCP Server** | ✅ Built | ~/CSOAI-CORP/mcp-packages/cobol-bridge/ |
| **Stripe Products** | ✅ Ready | 3 tiers: £999-4,999/mo |
| **Pricing Strategy** | ✅ Clear | £199-1,999/mo (needs alignment) |

### 🔴 CRITICAL GAPS
| Gap | Impact | Fix Time |
|-----|--------|----------|
| **NO FULL WEBSITE** | 🔴 Cannot sell | 4 hours |
| **NO DNS** | 🔴 Domain parked | 5 min |
| **COBOL Bridge Pro pricing** | 🔴 £199 vs £2,499 mismatch | 30 min |
| **NO demo/transpiler UI** | 🟡 Cannot prove value | 8 hours |

### 💰 REVENUE STREAMS
1. **COBOL Bridge Pro** — £199/mo (target, currently £2,499)
2. **Enterprise** — £1,999/mo
3. **Certification** — £5,000-15,000
4. **Custom Projects** — £50,000-500,000

### 🏗️ WEBSITE NEEDED
```
cobolbridge.ai/
├── index.html (hero + stats)
├── solutions/
│   ├── cobol-to-python.html
│   ├── cobol-to-java.html
│   ├── cobol-to-go.html
│   └── api-bridge.html
├── demo.html (file upload → transpile)
├── pricing.html
├── case-studies.html
└── docs/
```

---

## 4️⃣ PROOFOF.AI — Physical AI Safety

### ✅ WHAT'S WORKING
| Component | Status | Details |
|-----------|--------|---------|
| **Core Engine** | ✅ Built | ~/clawd/sovereign-stack/proofof-ai/ |
| | | - proofof_ai_verification_node.py (228 lines) |
| | | - FastAPI + WebSocket |
| | | - Blockchain integration |
| **MCP Server** | ✅ Built | ~/clawd/mcp-marketplace/proofof-ai-mcp/ |
| | | - server.py (709 lines) |
| | | - 6 verification tools |
| **Stripe Products** | ✅ Ready | Listed in catalog |

### 🔴 CRITICAL GAPS
| Gap | Impact | Fix Time |
|-----|--------|----------|
| **NO WEBSITE AT ALL** | 🔴 Brand doesn't exist | 6 hours |
| **NO DNS** | 🔴 Domain parked | 5 min |
| **NO deployment** | 🔴 Service not running | 2 hours |
| **NO marketing materials** | 🟡 Cannot sell | 4 hours |

### 💰 REVENUE STREAMS
1. **ProofOf.AI MCP** — £19/mo
2. **Industrial Bundle** — £499/mo
3. **Robot Certification** — £5,000-50,000
4. **Enterprise Safety Audit** — £25,000-100,000

### 🏗️ WEBSITE NEEDED
```
proofof.ai/
├── index.html (deepfake + robot safety)
├── solutions/
│   ├── content-verification.html
│   ├── robot-safety.html
│   └── industrial-compliance.html
├── api.html
├── pricing.html
└── demo.html (upload image → verify)
```

---

## 🔥 CRITICAL ISSUES ACROSS ALL 4

### Security (FIX TODAY)
| Issue | Location | Action |
|-------|----------|--------|
| Hardcoded Stripe key | create-stripe-catalog.js:23 | Rotate key, use env var |
| James Castle access | Stripe, GitHub, Vercel | Remove from all |

### Financial (FIX TODAY)
| Issue | Impact | Action |
|-------|--------|--------|
| Stripe in TEST mode | £0 revenue possible | Activate live mode |
| 6 pricing mismatches | Over/under billing | Create new price IDs |
| COBOL Bridge at £2,499 | No sales at Pro tier | Adjust to £199 |

### Infrastructure (THIS WEEK)
| Issue | Impact | Action |
|-------|--------|--------|
| DNS not set (all 4) | Sites unreachable | Update Namecheap |
| No Dockerfiles | Can't list on Glama | Add to top 20 MCPs |
| No legal docs | Compliance risk | Generate privacy/terms |

---

## 📋 UNIFIED EXECUTION PLAN

### PHASE 1: FIX TODAY (4 hours) — £0 → Revenue Ready

#### Hour 1: Security & Access
- [ ] Rotate hardcoded Stripe key
- [ ] Remove James Castle from Stripe
- [ ] Remove James Castle from GitHub org
- [ ] Remove James Castle from Vercel team

#### Hour 2: Stripe Activation
- [ ] Activate Stripe live mode
- [ ] Verify identity
- [ ] Add bank account
- [ ] Create 214 products via script

#### Hour 3: DNS Fix (All 4 Domains)
```bash
# Namecheap → Custom DNS
ns1.vercel-dns.com
ns2.vercel-dns.com
```
- [ ] csoai.org
- [ ] meok.ai
- [ ] cobolbridge.ai
- [ ] proofof.ai

#### Hour 4: Pricing Alignment
- [ ] Fix 6 mismatched prices
- [ ] Create MEOK Core Pack product
- [ ] Adjust COBOL Bridge Pro to £199

### PHASE 2: BUILD MISSING SITES (2 days) — Revenue Ready → Live

#### Day 1: COBOL Bridge Website
- [ ] Build 6-page site
- [ ] Deploy to Vercel
- [ ] Add Stripe checkout links
- [ ] Connect domain

#### Day 2: ProofOf.AI Website
- [ ] Build 5-page site
- [ ] Deploy verification node
- [ ] Add demo upload feature
- [ ] Connect domain

### PHASE 3: OPTIMIZE (1 week) — Live → Scaling

#### MCP Distribution
- [ ] Add Dockerfiles to top 20 MCPs
- [ ] Submit to Glama
- [ ] Submit to Smithery
- [ ] Publish 50 to PyPI

#### Marketing
- [ ] Launch EU AI Act campaign
- [ ] Publish certification guides
- [ ] Create demo videos
- [ ] SEO optimization

#### Operations
- [ ] Deploy Vast.ai serverless
- [ ] Set up monitoring
- [ ] Fix GitHub Actions
- [ ] Legal docs

---

## 💰 REVENUE PROJECTIONS

### Conservative Path
| Month | CSOAI | MEOK | COBOL | ProofOf | Total MRR |
|-------|-------|------|-------|---------|-----------|
| 1 | £500 | £1,000 | £0 | £0 | £1,500 |
| 3 | £2,000 | £5,000 | £1,000 | £500 | £8,500 |
| 6 | £5,000 | £15,000 | £5,000 | £2,000 | £27,000 |
| 12 | £10,000 | £40,000 | £15,000 | £5,000 | £70,000 |

### Aggressive Path
| Month | CSOAI | MEOK | COBOL | ProofOf | Total MRR |
|-------|-------|------|-------|---------|-----------|
| 1 | £1,000 | £2,000 | £500 | £200 | £3,700 |
| 3 | £5,000 | £15,000 | £5,000 | £2,000 | £27,000 |
| 6 | £15,000 | £50,000 | £20,000 | £8,000 | £93,000 |
| 12 | £30,000 | £100,000 | £50,000 | £20,000 | £200,000 |

**Year 1 Total:** £84K - £2.4M depending on execution

---

## 🎯 PRIORITY MATRIX

### DO NOW (Today)
1. Rotate Stripe key
2. Activate Stripe live mode
3. Fix DNS for all 4 domains
4. Remove James Castle access

### DO THIS WEEK
5. Build cobolbridge.ai website
6. Build proofof.ai website
7. Fix pricing mismatches
8. Add Dockerfiles to top MCPs

### DO THIS MONTH
9. Submit to Glama/Smithery
10. Publish 50 PyPI packages
11. Launch EU AI Act campaign
12. Hit £5,000 MRR

---

## 📁 FILE LOCATIONS

### Existing Assets
```
~/CSOAI-CORP/vercel-sites/csoai-org/     ← CSOAI website
~/clawd/meok/ui/website/                  ← MEOK website
~/clawd/cobolbridge-site/                 ← COBOL landing page
~/clawd/sovereign-stack/proofof-ai/       ← ProofOf engine
~/clawd/mcp-marketplace/                  ← 208 MCP servers
~/clawd/unified-portfolio-catalog/        ← Stripe catalog
```

### To Be Created
```
~/clawd/cobolbridge-site/full-website/    ← Build this
~/clawd/proofof-site/                     ← Build this
```

---

## ✅ SUCCESS METRICS

| Metric | Current | 30 Days | 90 Days |
|--------|---------|---------|---------|
| Live websites | 2 | 4 | 4 |
| Stripe revenue | £0 | £5,000 | £25,000 |
| MCP customers | 0 | 100 | 500 |
| PyPI packages | 0 | 50 | 150 |
| GitHub stars | ~50 | 200 | 1,000 |

---

**AUDIT COMPLETE ✅**

Ready to execute. What's first, Sir?
