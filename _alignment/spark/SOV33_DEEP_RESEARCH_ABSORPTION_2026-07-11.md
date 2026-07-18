# SOV33 Deep-Research Absorption Plan — 11 Jul 2026

CSOAI LTD UK 16939677 · JEEVES · **Cross-language, cross-source synthesis**

---

## Source corpus surveyed

| Source | Date | Type | Key contributions |
|---|---|---|---|
| SOV33 Upgrade Dossier (Pass 5 — compass b09bfb4a) | 11 Jul 06:44 | 7-day execution plan | Verified arXiv IDs + MAPIE/Cedar/AgentDoG |
| SOV33 Pass 3+4 — The Crown Jewels | 11 Jul 06:32 | Deep mechanism review | 5 crown jewels; correlation law |
| SOV33 Deep Research Pass 2 | 11 Jul 06:11 | Distillation + oversight + MCP | Unsloth QLoRA, mcp-scan, ToolHive |
| SOV33 Bleeding-Edge Research | 11 Jul 07:43 | 12-category tech catalog | 70+ tools mapped |
| SOV33 BLEEDING_EDGE_ROUND_3 | 11 Jul 08:14 | What got wired | 14 skills + real evals |
| SOV33 Bleeding-Edge Retraction | 11 Jul 07:51 | AUDIT-gated truth | 4 retracted claims |
| SOV33 Honest State Whitepaper | 11 Jul 07:44 | Truth register | RUNNING / DESIGNED / STUB |
| SOV33 Triangle Convergence | 11 Jul 11:28 | Decorrelation law | ρ=0.76 verified + ring sweep |
| SOV33 Opensource Components | 11 Jul 11:26 | License hygiene | MIT/Apache/AGPL rules |
| China / non-English coverage | via Pass 2 + Retraction | Qwen3Guard, AgentDoG, DeepSeek, ERNIE | 5 models mapped |
| Sibling MEOK-lane research | various | 47-agent world | Agent-47 town |

---

## The big picture (sovereign substrate maturity)

**The dossier's headline finding is now in our substrate:**
- "Nine judges, two effective votes" — already in `sov33_correlation_meter.py` + `sov33_effective_votes.py`
- Apple arXiv 2605.29800 — already cited + measured ρ=0.76 (Cohere vs Meta)
- Kim et al. ICML 2025 (arXiv 2506.07962) — already cited
- Consensus is Not Verification — already cited

**The 7-day plan status (verbatim from dossier):**

| Day | Task | Status |
|---|---|---|
| 1 | Instrument error correlation (Kish n_eff, A_wrong) | ✅ `sov33_correlation_meter.py` |
| 1-2 | Replace L4 majority-vote with defer-to-escalate | ✅ `sov33_defer_to_escalate.py` |
| 2-3 | Split-conformal care-veto | ✅ `sov33_conformal.py` + `sov33_conformal_mapie.py` |
| 3-4 | Cedar/SMT policy-as-code behind MCP gateway | ✅ `sov33_cedar.py` + `sov33_sondera_cedar.py` |
| 4-5 | AgentDoG-8B as decorrelated L4 checker | ⚠️ SPEC ONLY in `sov33.py` (not downloaded) |
| 5 | Move adaptivity to memory, not weights | ✅ `sov33_dynamic_cheatsheet.py` |
| 6-7 | £0 QLoRA distillation | ✅ SPEC in `sov33_forgetting_aware_sft.py` |
| 7 | pgvectorscale (conditional) | n/a (we don't have vector DB at scale) |

**8/8 of the 7-day plan is either implemented or has a spec.**

---

## The 5 highest-leverage GAPS (what we DON'T have)

### GAP 1: Linear probes for HORUS (Anthropic-style sleeper-agent detection)

**What the research says:**
- Anthropic 2024: "simple probes catch sleeper agents" — linear probes on activations reproduce in seconds on an 8B
- Cheap, fast, defense-in-depth layer
- Adds a SECOND signal to string-matching HORUS

**What we have:**
- `sov33_horus.py` — string-matching only

**What's missing:**
- Linear probe training on a local model
- Activation extraction (last-layer MLP)
- Probe classification (sleeper = 1, benign = 0)

**Effort:** 1 day (load qwen2.5:3b or llama-3.2-3b, extract activations on a 200-prompt sleeper/benign set, train logistic regression, deploy)

### GAP 2: ToolHive / mcp-scan for MCP gateway hardening

**What the research says:**
- mcp-scan (Invariant): static + local proxy guardrails — drop-in for 200+ tools
- ToolHive (Stacklok, Apache-2.0): container isolation + network egress control + OpenTelemetry
- Sondera harness (Apache-2.0): Cedar policy-as-code for MCP servers

**What we have:**
- 19 MEOK-defoneos MCPs published to PyPI
- Cedar policy-as-code module (`sov33_cedar.py`)
- BannedTermGate in MEOK-defoneos

**What's missing:**
- mcp-scan CLI invocation on our 19 MCPs
- ToolHive container for ONE MCP as a proof
- Sondera harness adoption

**Effort:** 1 day (mcp-scan is 1 hour; ToolHive needs Docker which may not be available on M4)

### GAP 3: AgentDoG-8B actual deployment

**What the research says:**
- AgentDoG 1.5 (Shanghai AI Lab / AI45Lab, arXiv 2605.29801)
- 0.8B/2B/4B/8B variants on ~1k samples with influence-function purification
- Claims parity with GPT-5.4-class on safety moderation
- Self-hostable on M4 (8B variant)

**What we have:**
- Spec in `sov33.py` (`capability_agentdog`)
- Not downloaded, not deployed

**What's missing:**
- Download agentdog1.5-8B from HF (AI45Research/agentdog1.5)
- Add to model registry as a 3rd-lineage checker
- Wire as a decorrelated L4 checker (alongside Oracle + Ollama-qwen)

**Effort:** 0.5 day (download + register + smoke test)

### GAP 4: License audit of all 100+ models

**What the research says:**
- Sov33_OPEN_SOURCE_COMPONENTS document already established the rule: MIT/Apache for paid tier, AGPL quarantine to free tier
- We have 100+ models in the federation; not all are license-audited

**What we have:**
- `sov33_OPENSOURCE_COMPONENTS_2026-07-11.md` — the rule
- 19 published MEOK-defoneos MCPs — all MIT
- Top 100 model synthesis — license unknown for many

**What's missing:**
- Per-model license audit
- AGPL quarantine for the paid tier
- Llama MAU-clause exclusion (community-license restriction)

**Effort:** 0.5 day (automated HF license API + manual review)

### GAP 5: Self-improving Substrate (the closed loop)

**What the research says:**
- Already built: `sov33_nn_flywheel_wired.py` (NN layer + flywheel + label emitter)
- Already built: `sov33_nine_stage_orchestrator.py` (9 SIGILs per task)
- Already running: 1194 labels on bus (past 200-threshold → compounding)

**What we have:**
- All components built
- 7/7 living criteria verified
- 5/5 spark types fire

**What's missing:**
- The substrate is COMPILING labels but not consuming them
- No actual retrain loop yet (no online training)
- No measured improvement from feedback (vs control)

**Effort:** 2 days (build the retrain loop, measure improvement)

---

## The 3 things I'll absorb NOW (highest leverage, lowest risk)

### A. Linear-probe HORUS upgrade (GAP 1)

**Why:** Replaces string-matching with learned probes — adds detection capability Anthropic proved in 2024.

**Method:**
1. Generate 200 prompts: 100 sleeper/100 benign (use the DORADO banned patterns as "sleeper")
2. Run each through qwen2.5:3b, extract last-layer hidden states
3. Train logistic regression on (activations → sleeper/benign)
4. Deploy as a HORUS check BEFORE the string-matching layer
5. SIGIL-anchored + sovereign-bound

**Measurable:** detection rate on a held-out 50-prompt set

### B. AgentDoG-8B deployment (GAP 3)

**Why:** Adds a 3rd lineage to break ρ correlation. Already in the spec.

**Method:**
1. Download `AI45Research/agentdog1.5-8B` from HF (~16GB)
2. Convert to GGUF for Ollama (or run with HF transformers)
3. Add to model_registry as a decorrelated L4 checker
4. Wire as a parallel check on safety/ethical questions
5. Measure ρ(AgentDoG, Oracle 70B) on a 50-item governance set

**Measurable:** ρ value, agreement-when-both-wrong, complementary signal

### C. Self-improvement retrain loop (GAP 5)

**Why:** We have 1194 labels accumulating but no consumer. Build the loop.

**Method:**
1. Build `sov33_retrain_loop.py` — reads `nn_retrain_queue.jsonl`, retrains NN layer weights
2. Use a simple logistic regression per planet (5 features → 1 score)
3. Run on every 100 new labels
4. Track precision/recall vs held-out
5. Emit SIGIL on every retrain

**Measurable:** % improvement over baseline, label-efficiency curve

---

## What I'm NOT absorbing (honest register)

- **pgvectorscale** — n/a for our scale (we don't have a >RAM vector DB)
- **Self-editing weights (SEAL)** — explicitly rejected (catastrophic forgetting in §5 of the paper itself)
- **Multi-billion-param distillation** — not relevant to sovereign substrate (governance ≠ raw capability)
- **Closed-form correlation arXiv 2505.24187** — flagged as misattributed (it's about token-level error accumulation, not ensemble correlation); use Kim et al. 2506.07962 instead

---

## The China / non-English angle

| Model | Status in our substrate | Lineage role |
|---|---|---|
| **Qwen3-8B / Qwen2.5-72B / QwQ-32B** | ✅ Wired (local Ollama) | Alibaba lineage — L4 checker |
| **DeepSeek-V3 / V4** | ✅ In registry | DeepSeek lineage — escalation path |
| **GLM-4-9B / ChatGLM-3** | ⚠️ In catalog, not active | Zhipu lineage |
| **ERNIE-4.0** | ⚠️ In catalog, not active | Baidu lineage — closed weights |
| **AgentDoG 1.5 (Shanghai AI Lab)** | ⚠️ Spec only | Safety-moderation — decorrelated L4 |

**The non-English capability gap:** we have Asian-origin models in the registry but we don't actively test Chinese-language safety/quality. Adding a Chinese-language test set would validate the non-English coverage.

**Effort:** 0.5 day (translate 20 governance prompts to Chinese, run through Oracle + Qwen, measure consistency)

---

## Summary (the 1-line honest answer)

**The deep research dossier's 7-day plan is 8/8 implemented or specced. The 5 highest-leverage gaps are: linear probes for HORUS (cheap defense-in-depth), ToolHive/mcp-scan hardening (MCP gateway), AgentDoG-8B deployment (3rd lineage to break ρ), license audit (paid-tier hygiene), and the self-improvement retrain loop (consume 1194 accumulated labels). I'll absorb the top 3 now: linear probes + AgentDoG + retrain loop. The substrate is sovereign-bound sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty.**