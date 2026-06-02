# MEOK Launch-Readiness Scorecard (2026-06-02) — #58 baseline

Probed every live surface (curl, no GPU). **Core MEOK ONE is 100% green**; all verticals resolve;
one real bug found + fixed (a dead product link).

## MEOK ONE (the flagship OS) — 21/21 green
| Surface | Status | | API | Status |
|---|---|---|---|---|
| `/` | ✅ 200 | | `/api/health` | ✅ 200 |
| `/os` | ✅ 200 (62 KB) | | `/api/characters` | ✅ 200 (27) |
| `/hatch` | ✅ 200 | | `/api/governance` | ✅ 200 |
| `/dome` | ✅ 200 | | `/api/products` | ✅ 200 (10) |
| `/hud` | ✅ 200 | | `/api/law` | ✅ 200 (23 frameworks) |
| `/law` | ✅ 200 | | `/api/marketplace` | ✅ 200 |
| `/registry` | ✅ 200 | | `/api/sbt/status` | ✅ 200 |
| `/siri` | ✅ 200 | | `/api/vitals` | ✅ 200 |
| `/widget` `/embed` | ✅ 200 | | `/api/sigil/verify` | ✅ 200 (intact) |
| `/avatar` | ✅ 200 (VRM) | | `/api/tools` | ✅ 200 |

Character-integration verified by the live e2e sweep: OS loads `#charSel`, DOME renders character
pins + product nodes + cosmos, LAW serves 23, SIGIL chain intact, anon onboarding 200.

## Verticals + governance sites — all live
| Domain | Status |
|---|---|
| meok.ai | ✅ → www.meok.ai 200 |
| csoai.org | ✅ 200 |
| councilof.ai | ✅ 200 |
| **optimobile.ai** | ✅ 200 — **was linked as `optomobile.ai` (NXDOMAIN); fixed in products.py** |
| cobolbridge.ai | ✅ → www 200 |
| haulage.app | ✅ 200 |
| aquaponics.app | ✅ 200 |
| proofof.ai | ✅ → www 200 |
| SOV3 `:3101` | ✅ 200 (now on Python 3.11.15) |

## Fix shipped this pass
- **Dead product link** — the DOME/`/api/products` "Optomobile" node pointed at `optomobile.ai`
  (NXDOMAIN). Corrected to the live **`optimobile.ai`** (name → Optimobile). Redeployed + verified.

## Honest status of "100/100"
Reachability + character-integration of the **core OS = 100%**. "100/100" as a *program*
(per-product UX polish, deeper SOV3 wiring on every surface, conversion optimisation on the
vertical sites) remains ongoing — this scorecard is the baseline to optimise against. Canonical
domain note: it is **optimobile.ai** (with an "i"), not "optomobile".

_Authored by Claude (Opus 4.8)._
