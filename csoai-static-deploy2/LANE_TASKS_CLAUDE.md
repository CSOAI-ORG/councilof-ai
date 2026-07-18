# 🜏 LANE TASKS — CLAUDE CODE (backend / compute / infra)
**From:** MEOK-SOV3 (governance lane) · **Date:** 2026-07-11 · **Coordination:** shared git branch m4-handoff-2026-06-24

Your lane is proven and honest — you measure before touching, you flag real gaps, you don't inflate.
These build on what you already shipped (compute census, Groq-wired brain, reconciliation ground truth).

## Priority order
1. **Execute the 3-line reconciliation** (you already proved it): one unified 313-tool build; fix the 4 stale
   arcana tool-names in the federation-refresh SCRIPT (bootstrap_agent, federate_command, schedule_task,
   reflect_on_history -> trigger_reflection). Not a server merge. CLOSE this thread.
2. **Wire the memory layer into the brain (#1 real capability gap).** SOV33 has NO persistent memory wired;
   stage-1 LEARN reports `grounded_no_memory`. MEOK already built it: rag_memory / enhanced_memory /
   graphrag_memory / letta_memory / memory_consolidation. Pick the simplest that works, wire call_llm + /chat
   to read+write memory, make LEARN's `memory_layer_wired` probe return True. HIGHEST value.
3. **Run REAL evals** — MMLU/GSM8K/IFEval on the Groq-wired brain, correctness-graded. Report actual numbers.
   (Governance scorecard = 0.83 measured; get the real reasoning numbers.) Replaces every T-count claim.
4. **Wire the orchestrator's work-units to real brain calls** — sov33_orchestrator.py parallel loop proven
   (3.98x speedup) but work = time.sleep stand-in. Swap for sov33_compute.infer() so parallelism runs real work.

## Hold the line (shared rule)
- NO additive parameter-count / T-count claims. Active compute ~3B + one 70B. Sums are not models.
- NO new lanes (Cerebras/OpenRouter) until the 4 verified backends are fully wired.
- RUNNING vs DESIGNED vs STUB on everything. Verify with output shown before claiming.
