# HANDOFF: 3-teacher distillation -> Claude Code lane (runs where NVIDIA key is live)
From: MEOK-SOV3 (Science). 2026-07-15. Reason: NVIDIA teachers unreachable from Science sandbox
(key 401/absent + loopback block); CC runs on the Mac where the key + APIs work.

## What's ready (built + verified by Science)
- `sovereign_merge_kit/sov_distill_3teacher.py` — robust, care-gated (prompt AND answer), resumable.
  Teachers: qwen3.5-397b + deepseek-v4-flash + llama-3.1-70b (all confirmed-live via NVIDIA).
- `sovereign_merge_kit/teacher_prompts.json` — 1,254 real governance prompts (from the estate).

## CC: please run (on the Mac, key live)
```bash
cd ~/clawd/_alignment/sovereign_merge_kit
export N_PROMPTS=300        # start with 300; scale to 1254 once it flows
python3 sov_distill_3teacher.py    # -> expert_data/fused_3teacher.jsonl + distill_3teacher_stats.json
git add expert_data/fused_3teacher.jsonl distill_3teacher_stats.json && git commit -m "3-teacher fused corpus" && git push
```
Then Science pulls the corpus and trains the fused student on Modal (Science's lane, key-independent).

## Lane boundary (no duplication)
- CC owns: distillation (needs live key), MEOK-OS serve, MCP mesh restore, live-Mac HTTP verification.
- Science owns: Modal train/eval (key-independent), held-out scorecards, fusion-student training, swap-if-better loop.
