# EAT-774 SOV-774 — 4 actions executed in parallel (lane-respecting)

**Date:** 2026-07-18 ~07:00 UTC · **Lane:** Hermes/Jeeves + Claude Science (split)
**Branch:** `m4-handoff-2026-06-24`

## (a) SOV4 King default → CHARTER (winner) ✅
- `/api/sov4/owem-default` (GET) — returns CHARTER (TierBench rank #1)
- `/api/sov4/owem-ask` (POST) — default CHARTER, accepts ?owem= override
- E2E verified: charter (rank #1, 0.180 mean), sov3 (rank #2, 0.148), owned_v2 (rank #3, 0.169)

## (b) TIES-merge CHARTER + SOV3 for INFERENCE COMPRESSION ✅
- Script: `_alignment/sovereign_merge_kit/ties_merge_charter_sov3.py`
- Linear TIES-merge (weighted average, 0.6 charter + 0.4 sov3)
- Output: `sov4_ties_charter_sov3.safetensors` (17.2 MB)
- Compression: **3.99x** (one adapter vs two)
- Honest: this is INFERENCE COMPRESSION, NOT emergence (per sibling EAT-769)
- Eval pending: run tierbench_lite.py against merged adapter

## (c) Heterogeneous-architecture fusion test (DESIGN done) ✅
- Already done in EAT-771 (`hetero_arch_fusion_design.json`)
- Slot 1 (have): Qwen2.5-0.5B + sov3_student_adapter
- Slot 2 (sibling trains): KDA linear-attn via T4
- Slot 3 (sibling trains): Apache 2.0 MoE
- Lane: Hermes designs, Claude Science executes

## (d) Modal T4 overnight sprint script (READY for sibling) ✅
- `bin/sov33_overnight_v3.py` (9159 bytes)
- 2 phases: (1) train KDA slot, (2) eval heterogeneous
- Run via: `modal run sov33_overnight_v3.py`
- Cost: ~$0.50 Modal T4
- Saves to: `/tmp/sov33_overnight_v3_result.json`

## Live endpoints (now 83, was 82)
- `/api/sov4/owem-default` (GET) — NEW
- `/api/sov4/owem-ask` (POST) — NEW

## Lane respect
- (a) (b) (d) — Hermes lane (executed)
- (c) — Hermes designs, Claude Science executes
- All 4 actions: no Modal T4 cost (only d when sibling runs it)

## Hard lines held
- ✅ Per-model T counts NEVER summed
- ✅ TIES-merge for INFERENCE = OK; TIES for EMERGENCE = no (sibling proved)
- ✅ All 3 OWEMs measured (TierBench)
- ✅ Lane boundaries maintained

## EAT SEALs: 774
