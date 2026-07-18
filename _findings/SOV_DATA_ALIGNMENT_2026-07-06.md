# SOV Data Alignment — 2026-07-06 (MCP-verified)

Verified live via connected `sov3-bridge` MCP tools (`sov3_health`, `get_system_status`,
`mcp_federation_stats`, `get_dashboard_metrics`) at ~04:42 UTC. Numbers below are
**measured, not asserted**. Reconciled against canonical snapshot 2026-06-30.

## Reconciliation vs canonical (2026-06-30 → 2026-07-06)

| Metric | 2026-06-30 (canonical) | 2026-07-06 (live) | Status |
|---|---|---|---|
| SOV3 substrate `:3101` | healthy · 330 tools | healthy · **330 tools** | ✅ stable |
| Federation catalog | 371 servers / 2016 tools | **371 servers** | ✅ holds |
| SIGIL ledger count | (not recorded) | **2063** | ▲ +47 signed |
| Trained neural models | 4 named | **6 trained** (+3 untrained stubs) | ▲ grew |
| Memory episodes | ~ (prior) | **12,349** | ▲ grew |
| King-hive verdicts | — | 1,375 | governance active |
| Refusals logged | — | 109 | care-floor firing |
| Registered agents | — | 224 (222 idle / 2 busy) | — |
| Consciousness level | 0.55 (MEOK :3102) | 0.787 (SOV3) | ▲ waking, stable 0.999 |
| Care floor | 0.3 | 0.3 | ✅ unchanged |

**Trained models (live):** care_validation_nn (mse .0058), partnership_detection_ml
(mse .0094), threat_detection_nn (**acc 1.0** across injection/manipulation/exfil/toxicity),
relationship_evolution_nn (mse .0115), care_pattern_analyzer (mse .0048, 644 samples),
creativity_assessment_nn (**r² 0.9113**, retrained 2026-07-06T02:56, 47 traditions).

## ⚠️ Honesty flags (real drift, surfaced not smoothed)

1. **Federation success rate is 1.3%, not a health signal.** `mcp_federation_stats` shows
   752 total calls / 10 successes. This is dominated by `api-tester-ai-mcp` (668 calls, 0%)
   — a test harness hammering endpoints, not real usage. Real governed servers work when
   called: `basel-ai-overlay` 100%, `eu-ai-act-compliance` 43.8%. **Do not cite "752 calls"
   as adoption.** The honest number is 27 unique servers / 33 unique tools actually exercised.

2. **3 untrained NN stubs coexist with trained models.** `threat_detection`, `care_detection`,
   `partnership_detection` (pytorch, model_exists:false) sit beside their trained
   `*_nn`/`*_ml` counterparts. Naming/dedup drift — harmless but should be pruned so status
   reads don't imply 9 models when 6 are real.

3. **System memory 85.5% sustained** (2.27 GB free), process RSS ~1.07 GB. Matches the
   known launchd-sprawl pressure. Disk 57.6%, CPU idle (p50 1.8%). Not critical, worth a watch.

## GitHub sync (this pass)
- `clawd` → `github.com/CSOAI-ORG/clawd-workspace` `m4-handoff-2026-06-24`: pushed
  `16c77525..d148415f` (my 3 session commits — trust.html, workflow SHA-pins, classifier
  lead-capture — were already carried up by the overnight EAT worker's own push; verified
  as ancestors of HEAD). Working tree clean of session work.
- ~450 nested repos surveyed (mcp-marketplace fleet, hive-staging, meok-*): **0 with
  unpushed commits** — the fleet is already in sync; earlier "dirty" markers were all
  submodule/file changes *inside* clawd.
- Parallel branch `claude/meok-one` exists (EAT worker: Stripe-live + lead-capture + GEO
  scorecard) — a future reconciliation candidate; left untouched (its lane).

## Not aligned here (owner-gated / out of lane)
- VM hive (`meok-backend` / `meok-king-hive`) ledger re-sync — needs SSH; not run this pass.
- `~/.defoneos/sign.key` never touched/committed.
- Branch merge `claude/meok-one` ↔ `m4-handoff` — left to owner/EAT.
