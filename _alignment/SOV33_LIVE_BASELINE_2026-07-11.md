# SOV33 LIVE BASELINE — verified via MCP :3101 (2026-07-11)
_Real `sovereign_rundown` + `sovereign_health_check` calls — not stubs. Honest RUNNING/BROKEN/OVERFIT tags._

## Health: HEALTHY (v2.0.0)
- neural_models=6, memory_store=connected, audit_logger=connected, agent_registry=connected, consciousness=active

## Consciousness: JAGRAT (waking), care_intensity=0.35 (= the real Care-Floor value)

## Neural models (ALL report trained:true — but metrics are IN-SAMPLE)
| model | reported metric | honest read |
|---|---|---|
| creativity_assessment_nn | r2=0.9113 | genuinely strong (the one solid NN) |
| care_pattern_analyzer | mse 0.0047 | strong |
| relationship_evolution_nn | mae 0.0752 | strong |
| threat_detection_nn | accuracy 1.0 | OVERFIT signal — in-sample on ~212 rows; held-out UNPROVEN |
| care_validation_nn | mse 0.0021 | OVERFIT signal — suspiciously low; tiny sample |
| partnership_detection_ml | mae 0.1919 | weak even in-sample |

**Correction (binding):** neither "0.45" nor the hive's "1.0" is a defensible threat-NN score.
In-sample metrics look strong; held-out generalization is untested; small samples => overfit.
Fix = flywheel label accumulation (held-out real deny/breach labels), NOT re-citing an in-sample number.

## Agents: 106 total (34 active, 28 busy, 44 idle), avg trust 0.771, avg performance 0.50

## Creativity engine: 30 bisociation links, QD archive coverage 2.9% (7/240 cells)

## Known BROKEN / STUB (verified by calling)
- memory: "stats unavailable" (health says connected, but stats endpoint errors)
- analyze_sentiment: errors — "Can't instantiate abstract class SentimentAnalysisNN" (unfinished)
- 313 MCP methods = MIX of live / stub / PHASE-roadmap; verify each by calling before citing

## Real self-training loop (callable, not local re-implementation)
- `sovereign_ingest_run` — pulls live 61K-msg history + _alignment + handoffs, rebuilds curated corpus (6.45MB/914 src) + sovereign_train.jsonl (83 QA), auto-retrains OLM. THIS is "keep training SOV".

## Routing rule going forward
Hive = executor (ingest/retrain, SIGIL, governance-assert, detection, Zamba/Mamba).
Me = orchestrator + verifier (call, check real response, catch stubs).
Hermes = backend. sov-world/Zamba/Cesium = visual/render testing.

## CORRECTIONS (verified read-only calls, 2026-07-11 later pass)
- **Memory is NOT broken** — get_memory_stats returns 17,088 episodes (avg importance 0.206, care 0.27). The earlier "stats unavailable" was ONE wrong endpoint in sovereign_rundown, not the store. Memory persistence WORKS. (Corrects prior "#1 blocker: memory half-broken".)
- **Zamba/Mamba is LIVE** — zamba_status: Mamba-2 SSM 16-dim + Transformer qwen2.5:3b, history_len 87. zamba_ask answers for real. Caveat: 3B transformer half = modest/generic quality. NOT pending.
- **OOWM status/think DON'T exist on the live server** — sov_oowm_status + sov_oowm_think both "Unknown mind tool" despite full catalog schemas. The OOWM "central substrate" is more DOCUMENTED than DEPLOYED. (3rd confirmed catalog-vs-server divergence.)
- **ingest correction** — sovereign_ingest_run output evidences ONLY ingest/corpus-build (sources/corpus_mb/qa_pairs); the OLM-retrain step is in the tool's DESCRIPTION, not confirmed by the call's return.
