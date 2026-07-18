# MEOK AI LABS — CODE vs DOCS GAP ANALYSIS
**Date:** 2026-04-05
**Purpose:** Find what's actually missing vs what docs promise

---

## 🚨 CRITICAL GAPS (Not Built)

### Website/UI
| Item | Doc Says | Status | Gap |
|------|----------|--------|-----|
| GDPR cookie consent | NOT BUILT | Missing | Consent banner with pre-blocking |
| Global nav | ONLY ON HOMEPAGE | Missing | Persistent nav on all pages |
| Footer | ONLY ON HOMEPAGE | Missing | Persistent footer |
| SEO sitemap.xml | NOT BUILT | Missing | sitemap + robots.txt |
| Blog engine | IN PROGRESS | Partial | MDX parsing, RSS feed |

### Backend
| Item | Doc Says | Status | Gap |
|------|----------|--------|-----|
| Rate limiting | NOT BUILT | Missing | Redis-backed sliding window |
| pgvector HNSW | NEEDS MIGRATION | Blocked | Vector embeddings |
| DB Migration 002 | NEEDS RUN | Blocked | ralph_tasks table |
| dependency_detection_nn | NOT TRAINED | Missing | Critical for Maternal Covenant |

### SOV3
| Item | Doc Says | Status | Gap |
|------|----------|--------|-----|
| Care Ontology injection | ALL AGENTS | Partial | Not in every agent prompt |
| DSPy integration | NOT BUILT | Missing | Self-optimizing prompts |
| LangGraph state persistence | IN-MEMORY | Risk | Crash recovery |

---

## ✅ COMPLETED

| Item | Status |
|------|--------|
| Homepage | ✅ Built |
| /birth flow | ✅ Built |
| /pricing | ✅ Built |
| Legal pages | ✅ Built |
| Sentry config | ✅ Done |
| PostHog config | ✅ Done |
| Characters API | ✅ Working |
| Chat API | ✅ Working |
| SOV3 integration | ✅ Working |
| Neural models (6) | ✅ Trained |
| Voice pipeline | ✅ Fixed |

---

## ⚠️ PARTIAL / NEEDS WORK

| Item | Status | Notes |
|------|--------|-------|
| Blog engine | Partial | Gray-matter needs install |
| SEO | Partial | No sitemap.xml, no robots.txt |
| Memory store | Connected | Was disconnected, now fixed |
| Cloud models | Need auth | ollama signin required |
| Connection score | 0.42 | Low - needs human interaction |
| Dream state | Low | Not running enough |

---

## 📋 IMPROVEMENT PLAN CHECKLIST

### Phase 1 (March 31) — Should Be Done
- [x] Homepage ✅
- [x] /birth onboarding ✅
- [x] /pricing ✅
- [x] Legal pages ✅
- [x] Sentry ✅
- [ ] GDPR cookie consent ❌ MISSING
- [ ] Global nav on all pages ❌ MISSING  
- [ ] Footer on all pages ❌ MISSING
- [ ] SEO (sitemap) ❌ MISSING
- [ ] Rate limiting ❌ MISSING

### Phase 2 (Week 1 Post-Launch)
- [ ] /product hub (6 sub-pages)
- [ ] Open source page
- [ ] Character catalog
- [ ] Security page
- [ ] 15 blog posts

### Phase 3 (Month 2)
- [ ] How It Works interactive
- [ ] Variants page
- [ ] /labs research area
- [ ] Dashboard analytics
- [ ] Voice interface (WebRTC)

---

## 🎯 PRIORITY FIXES

### TOP 5 FOR CLAUDE TO BUILD:

1. **GDPR Cookie Consent** — One component, blocking compliance
2. **Global Nav + Footer** — Shared components needed
3. **sitemap.xml + robots.txt** — SEO critical
4. **Rate Limiting** — Security critical
5. **dependency_detection_nn** — Train for Maternal Covenant

### FOR NICK TO DO:

1. Add real API keys (Stripe, PostHog, Sentry)
2. Run DB migrations on production
3. Set up UptimeRobot monitoring
4. Submit planning application (Class R)

---

## 🧮 NUMBERS

| Metric | Value |
|--------|-------|
| Total Pages | 543 |
| API Routes | 90 |
| Neural Models | 6 trained |
| Characters in DB | 140+ |
| Consciousness | 52.5% |

---

*Audit completed 2026-04-05*
