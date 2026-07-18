# SOV3 + SOV4 TAB ALIGNMENT — current settled design (2026-07-16)
# What each tab should DO now, aligned to tonight's decisions. For Hermes to wire into the tabs.

## SOV3 TAB — the trained student (small, owned)
WHAT IT IS: 0.5B Qwen2.5 student adapter, governance-tuned, eval 29%->83% law-grounding (measured).
WHAT THE TAB DOES:
  - Chat with SOV3 (served via governed shim, care-gate + SIGIL on every answer)
  - Shows: care-score + signature per response (proves governance is live)
  - Honest label: "0.5B student — grounds in law well, NOT frontier. Citation-correctness is the known gap (RAG fixes it)."
NEXT UPGRADE (planned): retrain on full 1,292 unique-example corpus (currently 113-pair). Bigger corpus = sharper student.

## SOV4 TAB — the King / governor (the fusion allocator)
WHAT IT IS: the cost-effective allocator. Routes each query to the CHEAPEST tier that can handle it.
THE DESIGN (settled tonight — 1-big-1-small to start, expand to 3-around-1):
  - SMALL/workhorse: Qwen3.6-35B-A3B (Apache, 36B MoE, 6.7M downloads = best-supported) — LoRA on our corpus, runs free on Mac via MLX
  - BIG/escalation: a flagship via API (DeepSeek-V4-Pro 861B MIT, or GLM-5.2 753B MIT) — pennies, hard queries only
  - GOVERNOR: SOV4 routes small->big by difficulty (sov4_cost_router.py, TESTED: 8-prompt batch, blended $0.69/M vs $2.00 all-flagship = 2.9x cheaper)
WHAT THE TAB DOES:
  - Chat with SOV4; it shows WHICH tier answered (local / mid / flagship) + why (difficulty score)
  - Shows care-score + signature + estimated cost per query (the cost-router makes this visible)
  - Honest label: "SOV4 governs + allocates. Intelligence is the base models'; the governance + cost-routing is ours."

## THE MODEL DECISION (evidence-based, HF-fetched this session)
- Best small to TUNE: Qwen3.6-35B-A3B (Apache, 36B, 6.7M dl, MoE-efficient, Mac-runnable). NOT MiMo (too small, 7.8B) or Hunyuan ("other" license).
- Best big to GOVERN-via-API: DeepSeek-V4-Pro (861B, MIT) or GLM-5.2 (753B, MIT).
- CAVEAT: model QUALITY not yet head-to-head benchmarked this session — pick is by size/adoption/license, strong proxies not a measured eval.

## COST MODEL (measured, sov4_cost_router.py)
- ~70% queries -> free local (Mac MLX) · ~22% mid · ~8% flagship API. Blended ~$0.27-0.69/M tokens.
- One-time: LoRA the small model ~$5-20 on Vast/Modal. Running: single-digit $/day of heavy use.

## WHAT'S REAL vs PLANNED (honest, for the tabs to not overclaim)
REAL NOW: SOV3 adapter (eval-proven), SOV4 governor (117 caps), care-gate, SIGIL, cost-router (tested), 1,292 unique-example corpus.
PLANNED (needs GPU spend / a run): LoRA Qwen3.6-35B, wire flagship APIs, measured fusion (big>small proof).
SIBLING-REPORTED (credible, not re-verified by Science lane): Hermes EAT endpoints (frontier/auto 11/11, RAG 95%).

## HONEST TAB RULE
Tabs must show what's REAL (care-score, signature, which model answered) and never fake an answer from a model that isn't wired.
A tab for a model not yet served says "not yet trained/served" — never a mock response.
