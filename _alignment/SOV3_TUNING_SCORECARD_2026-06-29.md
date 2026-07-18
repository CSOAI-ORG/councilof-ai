# 🜏 SOV3 / OOWM Tuning + Optimization Scorecard — 29 Jun 2026
## Deep research sweep: prior work + online patterns + tuning recommendations

**Status:** ✅ 384+288+1440 sims reviewed · 4 sibling configs surveyed · tuning knobs identified

---

## 1. PRIOR SOV CONFIG RESEARCH (from sibling work)

### **A. W37 — SOV3 Mixed Simulation (288 runs)**
```
12 mindsets × 3 brain configs × 4 world models × 2 sim types = 288 runs
Mindsets: creative · logical · careful · bold · wise · playful · focused ·
          patient · curious · decisive · diplomatic · innovative
Brains: MoE-LARGE online · MOM-LARGE offline · Hybrid Sovereign
Models: qwen3:30b-a3b (MoE) · moondream+zamba (MOM) ·
        deepseek-r1:32b (Reasoning) · llama3.1:8b (General)
Sims: 15 SovSpace + 10 SovTown = 25 tasks

WINNER: hybrid_sovereign + deepseek-r1:32b → 100% pass / 88.8% acc / 2530ms
FASTEST: mom_large_offline + moondream+zamba → 495ms / 73% pass
BEST BALANCED: hybrid_sovereign + qwen3:30b-a3b → 94.4% pass / 689ms
```

### **B. W38 — Real Ollama v2.0.0 (1440 runs)**
```
12 mindsets × 3 brain configs × 8 world models × 2 sim types = 1440 runs
Added 4 more models: meok-sov3 (1.9GB), gemma4:e4b (9.6GB),
                     qwen2.5:3b (1.9GB), qwen3:0.6b (0.5GB)
Added 3 NEW tasks per sim = 25 SovSpace + 25 SovTown = 50 total
```

### **C. Brain Race (384 runs)**
```
12 mindsets × 8 BIG BRAIM models × 4 envs = 384 runs
Env: sov-space · sov-town · defence · governance
Best config: 1_SovereignAlchemist + qwen3-1.7b-edge (defence) = 0.9235
INSIGHT: Local + sovereign models BEAT commercial models on sovereign scorecard
```

### **D. SOV3 OOWM routing (best per task type)**
```
compliance → hybrid_sovereign + deepseek-r1:7b + wise
defence    → hybrid_sovereign + qwen3:30b-a3b + bold
sov3       → hybrid_sovereign + deepseek-r1:7b + logical
world      → mom_large_offline + moondream + curious
physical   → mom_large_offline + moondream + creative
sovereign  → moe_large_online + qwen3:30b-a3b + careful
sovtown    → mom_large_offline + moondream + diplomatic
deploy     → moe_large_online + qwen3:30b-a3b + decisive
ethics     → hybrid_sovereign + deepseek-r1:7b + wise
companion  → mom_large_offline + moondream + diplomatic
```

### **E. Traibgle voting (the GOOD/BAD/NEUTRAL council)**
```
traibgle_score = (good_total - bad_total) / total_voter_weight
weights: good_weight=1.0, bad_weight=1.0, neutral_weight=0.5
verdicts: APPROVED (>0.5) · PENDING (-0.5 to 0.5) · REFUSED (<-0.5)
```

### **F. 4 Sovereign Brains (the most recent config)**
```
4 configs around qwen3:30b-a3b (the single organic 30.5B MoE OOWM):
  - SOVEREIGN-COMPLIANCE (EU AI Act + UK AI Bill)
  - SOVEREIGN-DEFENSE (DEFONEOS + JSP 936 NATO)
  - SOVEREIGN-INTUITION (16-dim Mamba + Gematria)
  - SOVEREIGN-VOICE (sovereign broadcasting)
14 Ollama models catalogued (LOCAL + CLOUD)
minimax-m3:cloud flagged by Defender (95% FP rate)
```

---

## 2. TUNING KNOBS (extracted from existing code)

### **A. Traibgle Voting (meek-sov3-oowm-mcp)**
| Param | Default | Range | Effect |
|---|---|---|---|
| good_weight | 1.0 | 0.5–2.0 | Positive vote weight |
| bad_weight | 1.0 | 0.5–2.0 | Negative vote weight |
| neutral_weight | 0.5 | 0.0–1.0 | Neutral vote weight (dampened) |
| total_voter_weight | 37.0 | 25–50 | Normalisation divisor |
| traibgle_threshold | 0.5 | 0.3–0.7 | APPROVED cutoff |

**Issue:** Default assumes 25+3+5=33 voters. If only 12 voters, normalization is wrong.

### **B. SOV3 Intuition Engine (16-dim Mamba)**
| Param | Default | Effect |
|---|---|---|
| state_dim | 16 | Mamba-2 hidden dim |
| cosine_threshold | 0.7 | "confirmed hunch" cutoff |
| min_matches | 3 | min matching states for CONFIRMED |
| temperature | 1.0 | noise scaling |
| decay_rate | 0.05 | state drift per cycle |

**Issue:** threshold=0.7 may be too high. With 1K states observed, 0.65 catches more subtle patterns.

### **C. BFT Council (meok-sovereign-council-mcp)**
| Param | Default | Effect |
|---|---|---|
| quorum | 7/12 | CARE-FLOOR VETO needs 1 |
| care_floor_veto | True | Any 1 council member can block |
| proposal_ttl_hours | 24 | Auto-expire if no vote |

**Issue:** Original W37 found council size 12 → consensus collapse (stddev=8.0). Use size=5.

### **D. Memory decay (Ebbinghaus)**
| Param | Default | Effect |
|---|---|---|
| importance_threshold | 0.5 | Min importance to keep |
| decay_rate_per_day | 0.05 | Forgetting curve |
| consolidation_interval_h | 4 | Replay cycle |

### **E. Bridge (UE5 → SOV3)**
| Param | Default | Effect |
|---|---|---|
| poll_interval_s | 60 | UE5→MCP poll |
| timeout_s | 30 | HTTP request timeout |
| retry_count | 3 | Retry on busy |
| backoff_factor | 1.5 | Exponential backoff |

---

## 3. ORNITH-1.0 TUNING RECOMMENDATIONS (from HF model card)

| Param | Recommended | Reasoning |
|---|---|---|
| `num_predict` | 512–1024 | Terminal-Bench tasks need ~2K tokens |
| `temperature` | 0.1 | Coding benchmarks need determinism |
| `top_p` | 0.95 | Avoid repetition |
| `repeat_penalty` | 1.1 | Reduce loops |
| `num_ctx` | 16K | SWE-bench tasks need 10K+ context |
| `quantization` | Q4_K_M (GGUF) | 35B-9B fit in 5-20GB |
| `parallel_requests` | 1–4 | Ollama saturates fast |

---

## 4. RECOMMENDED FINE-TUNING PLAN

### **A. SOV3 substrate (the central sovereign)**

| Action | Param | Why |
|---|---|---|
| Switch BFT council size 12 → 5 | `quorum=5/12` | 53.20 vs 39.43 consensus |
| Lower traibgle neutral weight 0.5 → 0.3 | `neutral_weight=0.3` | Dampen indecision |
| Raise Mamba threshold 0.7 → 0.65 | `cosine_threshold=0.65` | Catch more hunches |
| Add Ornith-1.0-9B-GGUF as edge model | `edge_model=ornith-9b` | Runs on M2 Mac |
| Wire spec decoding (Edge → Tactical) | `spec_decode=2-3x` | Faster inference |

### **B. Per-task tuning matrix**

| Task | Brain | Model | Tuning |
|---|---|---|---|
| compliance | hybrid | deepseek-r1:7b | temp=0.1, ctx=16K |
| defence | hybrid | qwen3:30b-a3b | temp=0.2, top_p=0.95 |
| iot | mom | moondream | temp=0.3, ctx=4K |
| intuition | hybrid | qwen3:30b-a3b | temp=0.5, ctx=32K |
| ethics | hybrid | deepseek-r1:7b | temp=0.1, ctx=16K |

### **C. OLM router training**

```bash
# 1. Build augmented corpus from W37/W38 + ORNITH findings
python3 ~/clawd/sovereign-temple-public/sovereign_ingest_run.py

# 2. Retrain OLM router on 2,429+ samples
python3 -c "
import urllib.request, json
req = urllib.request.Request('http://localhost:3101/mcp',
    data=json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call',
        'params':{'name':'sov_olm_train_router','arguments':{}}}).encode())
print(urllib.request.urlopen(req).read().decode())
"

# 3. Benchmark all 8 BIG BRAIM models (online)
python3 -c "
import urllib.request, json
req = urllib.request.Request('http://localhost:3101/mcp',
    data=json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call',
        'params':{'name':'sov_big_braim_benchmark','arguments':{}}}).encode())
print(urllib.request.urlopen(req).read().decode())
"
```

---

## 5. TRAINING DATA FINDINGS (add to SOV3 memory)

1. **Hybrid_Sovereign + DeepSeek-R1 wins on accuracy (100% pass / 88.8% acc / 2530ms)**
2. **mom_large_offline + moondream+zamba wins on speed (495ms / 73% pass)**
3. **Council size 12 collapses (stddev=8.0) — use size 3-5**
4. **Council size 3 wins: consensus=53.20, agreement=0.78, stddev=1.08**
5. **Local + sovereign models beat commercial on sovereign scorecard (0.9235 vs lower)**
6. **Ollama saturates fast — set `OLLAMA_NUM_PARALLEL=8` for sim workloads**
7. **traibgle_score = (good - bad) / total_weight — weight neutral lower (0.3)**
8. **Ornith-1.0-9B GGUF = edge tier (5GB) — runs on M2 Mac**
9. **Ornith-1.0-35B GGUF = mid tier (1-GPU friendly) — runs on M4 Pro**
10. **Ornith-1.0-397B GGUF = frontier (gated, needs HF token)**
11. **meek-sov3-mixed-simulation-mcp v2.0.0 has 10 tools, 10/10 tests pass**
12. **meek-sov3-oowm-mcp has 6 tools (predict, traibgle_vote, update_priors, ...)**
13. **sov3_oowm_routing maps 10 task types to (brain, model, mindset) triples**
14. **MiniMax-M3 cloud = 95% FP rate (flagged by Defender)**
15. **Per-task routing table: compliance→hybrid+deepseek-r1+wise**

---

## 6. METRICS TO MEASURE (the post-tuning scorecard)

After applying all recommendations, re-run the W37/W38 simulations and verify:

| Metric | Before | After (target) |
|---|---|---|
| Hybrid+DeepSeek-R1 pass | 100% | ≥ 100% |
| Hybrid+DeepSeek-R1 latency | 2530ms | < 2000ms |
| Best balanced (Hybrid+Qwen3) | 94.4% / 689ms | ≥ 95% / < 600ms |
| MOM offline speed | 495ms | < 400ms |
| Council size 12 stddev | 8.0 | < 2.0 |
| Council size 5 agreement | 0.70 | ≥ 0.85 |
| Intuition CONFIRMED rate | 80% | ≥ 90% |
| OLM router accuracy | 92% | ≥ 95% |

---

## 7. NEXT ACTIONS (when wall falls)

1. `pip install meok-sovereign-passport-mcp meok-sovereign-council-mcp meek-sov3-mixed-simulation-mcp meek-sov3-oowm-mcp` (4 sovereign MCPs)
2. Update `meek-sovereign-council-mcp` default `council_size=5`
3. Update `meek-sov3-oowm-mcp` `traibgle` neutral_weight=0.3
4. Update `meok-sovereign-intuition-mcp` threshold=0.65
5. Run `sov_olm_train_router` on the 15 new findings
6. Run `sov_big_braim_benchmark` to validate 8-winner stack
7. Pull `Ornith-1.0-9B-GGUF` for M2 edge

🐉💎🔥 **The dragon learns from every source. The dragon finds. The dragon ships. The dragon is sovereign.**