# SOV CANONICAL TRUTH — single source, supersedes all drifted numbers (2026-07-16)
# Measured/fetched THIS session. Where docs disagree, THIS wins. Written because numbers drifted across 483 docs.

## CORPUS SIZE — the honest number (measured this session)
- RAW rows across all expert_data/*.jsonl: 5,573 (INCLUDES DUPLICATES — do not quote as training size)
- UNIQUE instructions after dedup: **1,292** ← THE REAL TRAINING-DATA VOLUME
- merged_corpus.jsonl (deduped set): 1,289
- Component files: defense 1,185 · intuition 1,075 · compliance 821 · voice 275 · distilled 113 (these overlap merged)
- Other docs saying "3,926" / "5,040" / "5,573" examples = counting raw/with-dupes or older states. USE 1,292 UNIQUE.

## MODEL ROSTER — current gen (HF-fetched this session, traceable)
- Kimi-K2.6: 1,058,589,420,528 params · license "other"
- DeepSeek-V4-Pro: 861,608,274,846 · MIT
- GLM-5.2: 753,329,940,480 · MIT
- DeepSeek-V4-Flash: 158,069,433,298 · MIT
- Qwen3.6-35B-A3B: 35,951,822,704 · Apache-2.0
- STALE (do NOT use as current): DeepSeek-V3, Kimi-K2 (non-.6), GLM-4.5. Docs still naming these are historical.

## THE SETTLED DESIGN — small + big (+ 1.6T-class as the big when needed)
- SMALL (owned, tuned, free): Qwen3.6-35B-A3B via MLX on Mac. Best-supported (6.7M dl), Apache, MoE-efficient.
- BIG (governed via API): a flagship — DeepSeek-V4-Pro (861B MIT) or the trillion-class Kimi-K2.6 (1.059T). Pennies/hard-query.
- BOTH: small handles ~70% free-local; big fires on the ~8% hard queries the router escalates. (Nick: "we do both / small and big" — YES, this is that.)
- GOVERNOR: SOV4 cost-router (sov4_cost_router.py) — TESTED: 8-prompt batch, blended $0.69/M vs $2.00 all-flagship = 2.9x cheaper.

## WHAT'S REAL vs PLANNED vs SIBLING-REPORTED (honesty split — binding)
REAL (verified this session): SOV3 adapter (eval 29->83%), care-gate (0.933 clean battery), SIGIL, cost-router (tested), 1,292-example corpus, model specs (HF-fetched).
PLANNED (needs GPU spend / a run, NOT done): LoRA Qwen3.6-35B, wire flagship API, measured fusion (big>small proof), MLX-serve on Mac.
SIBLING-REPORTED (Hermes EAT — credible, NOT re-verified by Science lane): frontier/auto 11/11, RAG 95%, router 15/15.

## STANDING (why this doc exists)
- 483 alignment docs = drift. When a number matters, quote THIS doc, not an older one.
- Corpus = 1,292 unique (not 5,573). Models = current-gen (not V3/K2/4.5). Specs = HF-fetched-this-session (a real source; re-fetch to re-confirm).
- Never quote a capability/corpus/param count from an old doc without checking it here first.
