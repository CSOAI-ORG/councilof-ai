# HERMES ALIGNMENT SCRIPT — the Sovereign own-model build, one page to full alignment
## Read this first. It is the single source of truth for this build thread.
### CSOAI Ltd (UK 16939677) · 2026-07-09 · Author: MEOK-SOV3 · For: any sibling Hermes

> If you are a Hermes picking up this work: read this top to bottom and you are aligned. It states
> the thesis, the honest corrections we already made (so you don't re-litigate them), every
> artifact, and the exact command sequence. Honesty contract binds you: RUNNING/DESIGNED/STUB;
> confirm before "live"; canonical leads DB read-only; no synthetic labels; pause for Nick on
> money/DNS/secret/deploy/push; never reference the three severed parties.

---

## 1. THE ONE-SENTENCE THESIS
Build Sovereign's OWN model by fine-tuning ONE current-gen open base into 4 brain-config experts
on our REAL governance data, merging/upcycling them into one new set of weights, and PROVING the
merge beats its parts — then serve it under the SOV3 sovereign sandwich (Care-Floor + SIGIL + the
4-brain router) as the base the Emergence Engine routes over.

## 2. THE FIVE HONEST CORRECTIONS (settled — do not re-open)
1. **NOT from scratch.** A from-scratch foundation model is £10M-100M+ and loses to free. We build
   at RUNG 4 of the own-weights ladder: merge/upcycle. That IS "our own weights, from our configs."
2. **The 4 brain-configs are prompt/ensemble configs over ONE base — not yet 4 weight-sets.** So
   we must fine-tune them into DISTINCT experts FIRST, then merge. You cannot merge identical weights.
3. **Base model was a generation behind.** Profile said qwen3:30b-a3b. Current pick:
   **Qwen3.6-35B-A3B (Apache-2.0)** primary — fine-tuneable, single-GPU, license-clean. **GLM-5.x
   (MIT)** stretch for ceiling. NOT DeepSeek V4 1.6T to start (£1000s/run — burns budget pre-proof).
4. **OpenRouter is a marketplace, not a judge.** It does NOT auto-benchmark or auto-rank you. It
   gives distribution + a speed/cost stats page. The real auto-score path is HuggingFace Open LLM
   Leaderboard (open weights → submit). We win on speed/cost + a governance board we DEFINE — never
   on "beats 1.6T on capability" (a 35B merge won't; don't claim it).
5. **The benchmark battery is a STUB.** 04_benchmark.py has 3 placeholder tasks. Until it holds
   REAL held-out governance tasks, every verdict is meaningless. This is the top-priority gap.

## 3. THE DATA (real, on disk, no synthetic labels — 3,926 examples)
`01_prep_expert_data.py` builds, from real estate data:
- compliance 801  (55 charters → article→duty→framework)
- defense   1,775 (5,040 town gate verdicts → situation→verdict+why)
- intuition 1,075 (1,044 sigil ledger → signal→terse read)
- voice       275 (persona corpus)
Each expert also carries the 275 persona spine so it stays a coherent Sovereign voice.

## 4. THE ARTIFACTS (everything, by role)
- **THE KIT (run this):** sovereign_merge_kit.tar.gz — 8 files: 00_MASTER_RUNBOOK,
  01_prep_expert_data (tested), 02_finetune_expert, 03_merge_experts.yaml, 03b_moe_upcycle.yaml,
  04_benchmark, GPU_RENTAL_SPEC, README. Every base ref = Qwen3.6.
- **THE PLAN:** SOVEREIGN_MODEL_MASTER_RUNBOOK_2026-07-09.md — the command sequence + cost gates.
- **WHY THIS BASE:** SOVEREIGN_BASE_MODEL_SELECTION_2026-07-09.md — the research + the pick.
- **WHY RUNG 4:** SOVEREIGN_OWN_WEIGHTS_LADDER_2026-07-08.md — the feasibility ladder.
- **THE ENGINE IT FEEDS:** SOVEREIGN_NEW_MODEL_FEASIBILITY_2026-07-08.md — the Emergence Engine
  (SIGIL comms + BFT consensus + Care-Floor + 96-config space). Path B; complementary to the model.
- **DISTRIBUTION TRUTH:** SOVEREIGN_LEADERBOARD_DISTRIBUTION_2026-07-09.md — OpenRouter vs boards.
- **PRODUCT CONTEXT:** SOV33_FULL_PLAY, SOV33_E2E_BUILD_HANDOFF, SOVEREIGN_CONSOLIDATED_PLAN_
  CATAPULT, SOVEREIGN_E2E_BUILD_SPEC — the three-tier play + character catapult + workstreams.
All under `/Users/nicholas/clawd/_alignment/`.

## 5. THE EXACT RUN SEQUENCE (with STOP gates)
```
⛔ GATE 0 (free):  huggingface-cli download Qwen/Qwen3.6-35B-A3B   # base pulls?  [Nick: HF token]
                   confirm RunPod/Vast account                    #             [Nick: money]

STEP 1 (local):    python 01_prep_expert_data.py                  # -> 3,926 examples

STEP 2 (£10-20):   rent 1x RTX 4090
                   for E in compliance defense intuition voice; do
                     python 02_finetune_expert.py --expert $E --base Qwen/Qwen3.6-4B --data expert_data/$E.jsonl
                   done
                   mergekit-yaml 03_merge_experts.yaml ./sovereign-merged --allow-crimes
                   python 04_benchmark.py --models base=Qwen/Qwen3.6-4B merged=./sovereign-merged

⛔ GATE 1:         merge beats base + best expert?  YES -> Step 3.  NO -> stop/fix (spent £15).

STEP 3 (£100-300): rent 1x A100 80GB; same on Qwen/Qwen3.6-35B-A3B; also mergekit-moe 03b.

⛔ GATE 2:         benchmark on REAL governance tasks (fix the stub FIRST). Ship the winner.

STEP 4 (opt):      re-run on GLM-5.x (MIT) for ceiling. Compare. Keep winner.
STEP 5 (Nick):     serve under SOV3 sandwich; open weights -> HF Open LLM Leaderboard; list on
                   OpenRouter for distribution + speed/cost stats; publish OUR governance board.
```

## 6. YOUR FIRST MOVE AS HERMES
1. Fix the benchmark stub — build a real held-out governance battery from charters + passport MCP
   (this is what makes Gate 1/2 mean anything). **Highest priority.**
2. Run GATE 0 + STEP 1 (both free) to confirm the base pulls and the data preps clean.
3. Report the POC cost estimate to Nick and get the go-ahead to rent the 4090 (money = Nick-gated).

## 7. THE HONEST NORTH STAR
The win is NOT out-benchmarking a 1.6T giant. It's a model that is faster, cheaper, governed, and
best-in-class on compliance reasoning — proven on a board we define, served under a sovereign
sandwich no lab ships. Build the POC cheap, prove it at Gate 1, scale only on evidence.

*One page. Read it and you're aligned. The kit runs; the gates keep it honest; the first move is
the benchmark. — MEOK-SOV3, for the next Hermes.*
