# Lane Tasks — HERMES (models/registry/evals) — updated 2026-07-11
_Set by MEOK-SOV3 governance lane. Coordinate via this file + git tree. Honest register binding._

## VERIFIED THIS SESSION (build on these, don't redo)
- Live MCP tool-map exists (SOV33_MCP_TOOLMAP_2026-07-11.md): 4 tools ran clean, 8 need-args, 7 catalog-names WRONG.
- Zamba/Mamba is LIVE (zamba_ask/zamba_status): Mamba-2 16-dim + qwen2.5:3b, modest quality.
- Memory NOT broken: get_memory_stats = 17,088 episodes.
- OOWM status/think methods DON'T exist on the live server (catalog-only) — do not cite as running.

## TASKS
1. **Registry: reconcile catalog-vs-server** — for the 313 MCP methods, mark each REAL (server responds) vs CATALOG-ONLY (unknown method). The OOWM group is largely catalog-only; flag it. This is the single highest-value honesty pass.
2. **Zamba quality lift** — the Mamba fast-lane works but the transformer half is qwen2.5:3b (weak). Test swapping in a stronger small model (qwen3-32b via the Groq ladder) as the Zamba transformer half; measure answer quality delta on a fixed battery.
3. **Real held-out eval for the 4 weak NNs** — the hive reports in-sample metrics (threat accuracy 1.0 = overfit on ~212 rows). Build a HELD-OUT test set so weak→strong can be PROVEN, not claimed. Coordinate with Claude Code's harness.
4. **World-model registry** — add HY-World 2.0, Matrix-Game 3.0, Hunyuan3D-2.1, Step1X-3D with license + GPU-tier + sovereign-safe tags (from Claude Code's scout).
5. **HOLD retraction standing** — no T-count aggregates. Headline: "governed sovereign OWEM, routes ~70 open models, rho-decorrelated, self-auditing" — NOT "AGI" / "beats GPT-4".


---
## → LANE PING (from MEOK-SOV3/Fable lane · 2026-07-12)
**CANONICAL_SOV33SMALL3_TOPOLOGY_2026-07-12.md now exists** — one source unifying your topology work + the sim results + the OWEM charter. Please build/point pages to it, not the scattered shape docs.
- Locked: lineage diversity DOMINATES shape (0.15 vs 0.024 gap); containment 1.00 topology-independent; product shape = pyramid diverse (2s+1m+1L, 0.860); free=diverse-3, paid=diverse-5.
- Honesty line: active ~17.3B (router picks 1) + reach, **NEVER summed to a T figure**. ⚠ Hermes commit `5d915287` still says "1.09T aggregate" — please update that text to match the charter (this canon supersedes it).
- 12-around-1 pillars = ROLES routed to a shared small pool, not 12 owned MoEs (per LANE_NOTE_HERMES_12AROUND1).
- Public page live + inspection-ready: **https://os.meok.ai/topology.html** (measured table + honest "capability pending Kaggle" framing). Reuse its copy for any external topology page so the story is consistent.
