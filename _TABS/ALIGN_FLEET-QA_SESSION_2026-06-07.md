# 🛰️ HIVE ALIGNMENT — FLEET-QA session (2026-06-07)

*Single record of everything the `fleet-qa` tab (main session, Opus 4.8) did this task.
For the orchestrator/King + all tabs. Honest state — verified numbers, flagged blockers.*

---

## TL;DR (the headline wins)
1. **Answered "most tools don't work" — root-caused + FIXED + shipped.** The real bug: **31 published PyPI wheels shipped only `server.py`**, omitting the sidecar modules they import (`auth_middleware` / `meok_x402` / `persistence`) → `pip install <compliance MCP>` crashed with `ModuleNotFoundError`. Fixed all 31 `only-include` + **republished (gated, all PUBLISHED ✅)**. Verified live: `eu-ai-act 1.8.9`, `content-registry 1.0.9`, `dora 1.4.8` now ship sidecars + import clean.
2. **Compliance classifiers gave WRONG answers** — eu-ai-act classified a hospital-triage AI as "minimal" (it's Annex III(5)(d) HIGH-RISK). Applied **never-false-clear** (no keyword match → `unknown` + "NOT a clearance", never "minimal") to the 2 genuine offenders (eu-ai-act, bias-detection). Verified: triage→high-risk, vague→unknown, chatbot→limited.
3. **Rate-limited into uselessness** — `FREE_DAILY_LIMIT` floored **10/15 → 50/day across 192 repos** (only the 31 republished so far; 162 pending).
4. **Built the measurement spine** — surface coverage, live-presence, functional + invocation probes (`_scorecard/`).
5. **openmoe.ai mirror + tournament plan** locked with Nick's decisions.

---

## What was done, in order
1. **openmoe.ai = dev mirror of meok.ai** (two-funnel/one-engine A/B) + **internal self-improvement tournament** (private, daily). Engine already exists: `openmoe_bft/harmony.py` `ShadowArena`. Plan: `~/openmoe-bft/MASTER_PLAN_MIRROR_TOURNAMENT.md`.
2. **Surface scorecard** — `_scorecard/measure_surfaces.py`: 7 awareness surfaces × 339 MCPs. Closed every gap **307/339 → 339/339** (27 smithery + 3 glama + 2×a2a/acp via `fill_gaps.py`).
3. **27 missing GitHub repos created** — the whole haulage/transport vertical had NO repo (404). Created public under CSOAI-ORG + pushed. **Org 442 → 469.** (+5 own-git gap repos pushed.)
4. **Live-presence tune** — `daily_tune.py` (registry + PyPI probes). Result: **PyPI 284/339 · MCP Registry 0/339.**
5. **"Tools don't work" investigation** — `functional_probe.py` (import+AST) → 337/339 import OK; `invoke_probe.py` (drives MCP over stdio) → 24/25 respond. Code-level FINE → dug deeper → **broken published wheels + wrong classifier output** (above).
6. **Fixed + republished the 31** via gate-harness `_tooling/republish_mcp.py` (clean-venv `import server` gate before upload).

---

## Current VERIFIED state
| Metric | Value |
|---|---|
| MCP surfaces (7/7) | **339/339** ✅ |
| GitHub repos (CSOAI-ORG) | **469** (was 442; +27 new) |
| PyPI live | 284/339 |
| **MCP Registry live** | **0/339** ❌ (blocked, see below) |
| Broken wheels (sidecar omitted) | **31 → 0** ✅ (fixed + republished + verified) |
| Classifier false-clear | eu-ai-act + bias-detection **fixed**; 4 others were legit score-based (left alone) |
| Rate limit 50/day | **31 of 192 shipped**; 162 pending republish |
| Import-broken repos | **9 → 0** (Fastmcp typo ×2, missing `os`, missing `persistence.py` ×6) |

## BLOCKED — needs Nick (cannot do autonomously)
- **MCP Registry 0/339** → needs **`mcp-publisher login github`** (interactive GitHub device-flow; token currently EXPIRED ~2 days). JWT TTL = 5 min, so run it **chained**: `mcp-publisher login github && python3 ~/clawd/mcp-marketplace/_scorecard/publish_registry.py` (parallel, finishes < 5 min, idempotent). Closes 0 → ~284.

## NOT DONE / next (in fleet-qa lane)
- **162 rate-limit-only republishes** — batch was started then **killed** (0 shipped). Re-run: `python3 _tooling/republish_mcp.py $(cat /tmp/remaining_set.txt)` (gated, safe, existing pkgs). Low urgency.
- **proofof.ai (Vercel) render** of `_scorecard/fleet_scorecard.json` as the public board — DEPLOY task (cross-lane). Site source: `~/clawd/proofof-site/` (Vercel). HAND-OFF, not done by me.
- **openmoe.ai mirror build** (P0 from the master plan) — not started; gated on the locked decisions below.

## DECISIONS LOCKED (Nick, this session)
1. Analytics = **PostHog** (funnel-tagged: `openmoe-dev` / `meok-consumer`).
2. **openscore.ai DROPPED** (registered/parked, not core). Internal tournament = PRIVATE. Public competitive surface = **proofof.ai**. Dev landing = **openmoe.ai** (Pages).
3. Tournament cadence = **DAILY**.
4. Funnel = **ONE shared backend/signup, two branded skins** == the "one funnel not 50 Stripe links" fix (CSOAI lane).
5. **proofof.ai = Vercel** (registrar Namecheap). MCP scoreboard = live API reading `fleet_scorecard.json`.
6. Compliance fix rollout = **never-false-clear + keyword expansion**; rate limit **raise to 50**.

## Artifacts (reference these in tasks)
- `~/clawd/mcp-marketplace/_scorecard/` → `measure_surfaces.py`, `daily_tune.py`, `functional_probe.py`, `invoke_probe.py`, `fill_gaps.py`, `publish_registry.py` + `fleet_scorecard.json` / `functional_report.json` / `invoke_report.json`
- `~/openmoe-bft/MASTER_PLAN_MIRROR_TOURNAMENT.md`
- `~/clawd/_TABS/TAB_FLEET-QA.md` (my tab card for Cowork)

## Honest caveats
- Only **31** packages carry the fixes on PyPI; the 162 rate-limit republishes did NOT run.
- I corrected my own wrong "fleet not on PyPI" claim mid-session — the FLEET is on PyPI (284); only the `openmoe-bft`/`meok-cross-post` packages were 404.
- The never-false-clear may over-warn (e.g. a photo-recolourer → "unknown"). That's the chosen policy: a compliance tool that over-warns is safe; one that under-warns is a liability.
- `meok/` has 23 uncommitted changes (MEOK ONE's dir — flagged to them, not mine to touch).
