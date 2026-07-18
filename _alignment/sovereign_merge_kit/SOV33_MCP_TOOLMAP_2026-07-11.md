# SOV33 MCP tool-map — VERIFIED by live calls (2026-07-11)
_Catalog method names do NOT always match the server. Probe before citing. NEVER probe a mutating method with a no-arg call — it EXECUTES it._

## LIVE, ran clean (4): sovereign_health_check, sovereign_rundown, sovereign_ingest_run*, vault_stats
  *sovereign_ingest_run is STATE-CHANGING (rebuilds corpus 8.55MB/1093 src, 47 QA, retrains OLM) — ran live this session. Do NOT classify-probe it with no-args again.
## LIVE, real but need args (8): analyze_care_patterns, apply_resonance, analyze_sentiment(errors-abstract), detect_intent, register_agent, zamba_ask, zamba_ingest, vault_search
## UNKNOWN under guessed names (7): detect_over_reliance, issue_article50_passport, assert_compliance, log_execution, oowm_status, oowm_evolve, guardian_check_game
  -> governance-assert / OOWM / passport exist (per group listing) but NOT under these names; find real names before routing work.

## Corrections logged:
- Zamba (Mamba fast-lane) is LIVE on the hive (zamba_ask/zamba_ingest) — NOT "pending model pull".
- Probe-by-calling is UNSAFE for mutating methods; use schema introspection, not no-arg execution.
- NOT AGI: intelligence is borrowed from base models; ingest retrains the ROUTER+small NNs, not cognition.
