# MEOK E2E audit (run on GCP, off the Mac)

Target: https://meok-one.35.242.143.249.sslip.io
Method: warm-up + 3 retries @ 30s; live=200&>=120B&keyword, partial=200 thin, broken=non-200

## MEOK ONE surfaces & APIs

| surface | status | http | bytes | s |
|---|---|---|---|---|
| OS shell | ✅ live | 200 | 63248 | 0.02 |
| DOME | ✅ live | 200 | 35973 | 0.02 |
| Gaming HUD | ✅ live | 200 | 21177 | 0.03 |
| Onboarding (hatch) | ✅ live | 200 | 24499 | 0.02 |
| Avatar | ✅ live | 200 | 45879 | 0.02 |
| Tools panel | ✅ live | 200 | 6174 | 0.02 |
| MCP Registry page | ✅ live | 200 | 6322 | 0.02 |
| health | ✅ live | 200 | 50 | 0.02 |
| characters | ✅ live | 200 | 5560 | 0.02 |
| agents (council) | ✅ live | 200 | 847 | 0.02 |
| marketplace | ✅ live | 200 | 1126 | 0.01 |
| vitals/care | ✅ live | 200 | 219 | 0.02 |
| SIGIL recent | ✅ live | 200 | 1247 | 0.01 |
| SIGIL verify | ✅ live | 200 | 92 | 0.02 |
| SIGIL manifest | ✅ live | 200 | 1237 | 0.01 |
| MCP tools catalogue | ✅ live | 200 | 13979 | 0.02 |
| tiers (free/local/paid) | ✅ live | 200 | 592 | 0.02 |
| pricing | ✅ live | 200 | 1319 | 0.02 |
| products | ✅ live | 200 | 2734 | 0.01 |
| EXPORT (Free->Local seam) | ✅ live | 200 | 3423 | 0.04 |
| think (chat) | ✅ live | 200 | 893 | 10.52 |
| sovereign council (BFT) | ✅ live | 200 | 3585 | 5.3 |
| forecast | ✅ live | 200 | 312 | 0.22 |
| law applicable | ✅ live | 200 | 2687 | 0.02 |
| auth anon | ✅ live | 200 | 224 | 0.02 |
| MCP bridge -> SOV3 | ✅ live | 200 | 10935 | 0.03 |

## Flagship domains

| domain | status | http | bytes | s |
|---|---|---|---|---|
| meok.ai | ✅ live | 200 | 202384 | 0.17 |
| councilof.ai | ✅ live | 200 | 22461 | 0.03 |
| csoai.org | ✅ live | 200 | 372503 | 0.04 |
| safetyof.ai | ✅ live | 200 | 17675 | 0.03 |
| proofof.ai | ✅ live | 200 | 11698 | 0.17 |
| aquaponics.app | ✅ live | 200 | 17159 | 0.06 |
| haulage.app | ✅ live | 200 | 3895 | 0.02 |
| optimobile.ai | ✅ live | 200 | 22625 | 0.11 |
| biasdetectionof.ai | ✅ live | 200 | 2787 | 0.03 |
| fishkeeper.ai | ✅ live | 200 | 9457 | 0.06 |

## Summary

- ✅ live: **36/36**  · 🟡 partial: 0  · 🔴 broken: 0
- surfaces/APIs: 26/26 live
- domains: 10/10 live

_(raw JSON: /tmp/meok_e2e_audit.json)_
