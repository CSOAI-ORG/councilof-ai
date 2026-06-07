# MEOK E2E audit (run on GCP, off the Mac)

Target: https://meok-one.35.242.143.249.sslip.io
Method: warm-up + 3 retries @ 30s; live=200&>=120B&keyword, partial=200 thin, broken=non-200

## MEOK ONE surfaces & APIs

| surface | status | http | bytes | s |
|---|---|---|---|---|
| OS shell | ✅ live | 200 | 63248 | 0.02 |
| DOME | ✅ live | 200 | 35973 | 0.02 |
| Gaming HUD | ✅ live | 200 | 21177 | 0.02 |
| Onboarding (hatch) | ✅ live | 200 | 24499 | 0.02 |
| Avatar | ✅ live | 200 | 45879 | 0.02 |
| Tools panel | ✅ live | 200 | 6174 | 0.02 |
| MCP Registry page | ✅ live | 200 | 6322 | 0.02 |
| health | 🟡 partial | 200 | 50 | 0.02 |
| characters | ✅ live | 200 | 5560 | 0.02 |
| agents (council) | ✅ live | 200 | 847 | 0.02 |
| marketplace | ✅ live | 200 | 1126 | 0.02 |
| vitals/care | ✅ live | 200 | 219 | 0.02 |
| SIGIL recent | ✅ live | 200 | 1289 | 0.02 |
| SIGIL verify | 🟡 partial | 200 | 92 | 0.02 |
| SIGIL manifest | ✅ live | 200 | 1237 | 0.02 |
| MCP tools catalogue | ✅ live | 200 | 13979 | 0.02 |
| tiers (free/local/paid) | ✅ live | 200 | 592 | 0.02 |
| pricing | ✅ live | 200 | 1319 | 0.02 |
| products | ✅ live | 200 | 2734 | 0.02 |
| EXPORT (Free->Local seam) | ✅ live | 200 | 3423 | 0.04 |
| think (chat) | ✅ live | 200 | 833 | 5.41 |
| sovereign council (BFT) | ✅ live | 200 | 3474 | 7.04 |
| forecast | ✅ live | 200 | 578 | 2.27 |
| law applicable | 🔴 broken | 404 | 0 | 0.02 |
| auth anon | ✅ live | 200 | 224 | 0.02 |
| MCP bridge -> SOV3 | ✅ live | 200 | 10609 | 0.03 |

## Flagship domains

| domain | status | http | bytes | s |
|---|---|---|---|---|
| meok.ai | ✅ live | 200 | 202384 | 0.08 |
| councilof.ai | ✅ live | 200 | 22461 | 0.02 |
| csoai.org | ✅ live | 200 | 372503 | 0.03 |
| safetyof.ai | ✅ live | 200 | 17675 | 0.02 |
| proofof.ai | ✅ live | 200 | 11698 | 0.19 |
| aquaponics.app | ✅ live | 200 | 17159 | 0.06 |
| haulage.app | ✅ live | 200 | 9687 | 0.13 |
| optimobile.ai | ✅ live | 200 | 22625 | 0.05 |
| biasdetectionof.ai | ✅ live | 200 | 2787 | 0.03 |
| fishkeeper.ai | ✅ live | 200 | 9457 | 0.05 |

## Summary

- ✅ live: **33/36**  · 🟡 partial: 2  · 🔴 broken: 1
- surfaces/APIs: 23/26 live
- domains: 10/10 live

**Broken (need attention):**
- 🔴 law applicable — http 404, 0B

**Partial (thin/placeholder):**
- 🟡 health — http 200, 50B
- 🟡 SIGIL verify — http 200, 92B

_(raw JSON: /tmp/meok_e2e_audit.json)_

---

## Post-audit corrections (the 3 flags were all probe artifacts, not bugs)

| flagged | reality | corrected |
|---|---|---|
| 🔴 law/applicable 404 | it's a **GET** route; the script probed **POST** | ✅ live (returns real region-aware law data) |
| 🟡 health 50 B | health is *meant* to be terse (`{"status":"ok"}`) | ✅ live (byte-threshold false flag) |
| 🟡 SIGIL verify 92 B | verify returns a small `{intact:true,…}` with the keyword | ✅ live (byte-threshold false flag) |

### TRUE result: **36/36 live** — every MEOK ONE surface, every core API (incl. the new
Free→Local export seam + SOV3 council/BFT + MCP bridge→SOV3), and all 10 flagship domains
respond with real payloads. No broken surfaces. (Methodology lesson repeated: rigorous probes
still need method/threshold awareness — three "failures" were the harness, not the product.)

### Honest caveats that a green health-sweep does NOT cover
- This proves **reachability + real payloads**, not deep correctness of every answer.
- **Mobile = PWA only** (no native iOS/Android app / app-store) — unchanged.
- **OpenMOE / standalone OpenSIGIL = concept**, not shipped — unchanged.
- Cold-start latency on first uncached call (~6 s) is real UX friction (warm = 0.02 s here, since
  the audit ran on GCP next to the box) — a warmup ping would smooth first loads.
