# Site Portfolio Audit — 10 Domains
**Generated:** 2026-05-20 · curl-only methodology · portfolio average 4.3 / 10

## Master Scorecard

| # | Domain | HTTP | Sitemap | Robots | llms.txt | Title | Desc | Schema | Phone | Form | **Grade** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | templeman-opticians.com | 200 | 200 | 200 | 404 | ✓ (incl phone) | ✓ | 1 | 3 | 2 | **8/10** |
| 2 | www.cobolbridge.ai | 200 | 200 | 200 | 404 | ✓ | ✓ | 1 | 0 | 0 | **6/10** |
| 3 | councilof.ai | 200 | 200 | 200 | 404 | ✓ | ✓ | 1 | 0 | 2 | **7/10** |
| 4 | www.meok.ai | 200 | 200 | 200 | **200** | ✓ | ✓ | 3 | 1 | 0 | **9/10** ← gold standard |
| 5 | muckaway.ai | **000** | 000 | 000 | 000 | – | – | 0 | 0 | 0 | **0/10** |
| 6 | grabhire.ai | **401** | 401 | 401 | 401 | – | – | 0 | 0 | 0 | **0/10** ← Vercel auth gate! |
| 7 | planthire.ai | **000** | 000 | 000 | 000 | – | – | 0 | 0 | 0 | **0/10** |
| 8 | haulage.app | 200 | 200 | 200 | 404 | ✓ | ✓ | 1 | 0 | 1 | **7/10** |
| 9 | safetyof.ai | **000** | 000 | 000 | 000 | – | – | 0 | 0 | 0 | **0/10** |
| 10 | csoai.org | 200 | 307 | 307 | 307 | ✓ | ✓ | 1 | 0 | 1 | **6/10** |

**Live domains avg (excl. 0/10s): 7.2 / 10**

## Recommended 2-hour sprint (lifts portfolio to ~8/10)

1. **Toggle grabhire.ai public** — disable Vercel deployment protection · 2 min · **9.5 E:I**
2. **Fix csoai.org 307 loop** — sitemap/robots/llms must return 200 not redirect · 15 min · **8.5 E:I**
3. **DNS resurrect** muckaway/planthire/safetyof — already DNS-swapped at Namecheap today, just need propagation + alias · 30 min (when DNS lands) · **9.5 E:I**
4. **Drop llms.txt + Organization JSON-LD into all 8 reachable** — copy from meok.ai template · 60 min · **9.0 E:I**
5. **Add tel: + mailto to cobolbridge + councilof** — trust signal gap for B2B · 15 min · **8.0 E:I**

## Key findings

- **`meok.ai` is the gold standard** — only domain with `llms.txt` + 3 JSON-LD blocks. Use as template for all others.
- **`templeman-opticians.com`** is the only domain with proper local-business NAP density (phone in title + 3 tel refs).
- **None** of the .ai/.app B2B domains have phone numbers. Trust signal gap for enterprise buyers.
- **`csoai.org`** sitemap/robots/llms all return 307 — fixable in one Vercel config push.

## 10 cross-cutting improvements (ranked by effort:impact)

| # | Improvement | Effort | E:I |
|---|---|---|---|
| 1 | Resurrect 3 dead domains | 30min | 9.5 |
| 2 | Un-protect grabhire.ai | 2min | 9.5 |
| 3 | Add llms.txt to 8 reachable | 1hr | 9.0 |
| 4 | Fix csoai.org 307 loop | 15min | 8.5 |
| 5 | Add phone to B2B .ai/.app | 30min | 8.0 |
| 6 | Organization JSON-LD with `sameAs` across all 8 (entity graph) | 1hr | 8.0 |
| 7 | Add mailto / form to cobolbridge + 3 dead | 30min | 7.5 |
| 8 | Standardise meta description 150-160 chars | 45min | 7.0 |
| 9 | FAQPage schema on 4 B2B sites (AI overview pickup) | 2hr | 6.5 |
| 10 | Canonical + OG + Twitter card on all 7 live | 1.5hr | 6.0 |

---

## Vast.ai SOV3 status (from SSH inspection)

```
Instance: 35250795 (RTX 4070S, $0.083/hr, 17 days uptime)
SOV3:    python3 /workspace/sov3_api.py — running since May 9 (11 days)
Ollama:  up · llama3.1:8b · llama3.2:3b · nomic-embed-text
GPU:     0% utilization (SOV3 is idle / not currently hitting it)
Files:   /root has Asimov V8 robotics XML + STL files
```

**SOV3 IS running on Vast — but it's idle.** $0.083/hr × 24 × 30 = ~$60/mo with no measurable usage. Consider: pause when not in active development.
