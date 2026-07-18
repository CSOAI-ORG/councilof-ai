# MEOK / openmoe.ai — Master Architectures, Brains & Breakthroughs
**2026-06-16 · grounded in a real code audit + deep research (4 parallel agents, ~50 sources)**

---

## 0. The one-line reframe (the actual breakthrough)

> **Your instinct "layers are missing downwards" is correct — but the missing layers are NOT more King→General→Queen agent tiers. They are L3–L8 *beneath each worker*: in-worker decomposition → executable skills → real tool/environment grounding → an external verifier gate → retrieval → shared blackboard.**

Adding agent tiers downward *multiplies* error (0.85¹⁰ ≈ 20% success). Adding L3–L8 *injects information the worker couldn't produce itself*. The 33×33×33 fractal makes the system worse, not deeper. Depth that pays = grounding + verification at the leaves, not more middle-managers.

---

## 1. Honest rundown — what actually exists (code audit, not memory)

**Real depth: `King → Queen → Council → model call → ⛔ bottoms out`. Two productive levels, not a fractal.**

| Claim | Reality |
|---|---|
| 28–33 independent hives | **1 engine + 29 `stack.yml` config files**. Not 29 stacks. |
| Queens use their domain MCP tools (the "data moat") | ❌ **Tools are string-interpolated into the prompt, never called.** `hive_queen.py:253` injects `"Tools you can draw on: {tools}"`; `tunnels.safe_call` is built but **not on the queen's path**. L5 MCPs aren't even running (`:8000` empty). **This is the #1 gap.** |
| Self-improving (BFT → vote → RLF till 100/100) | ⚠️ **Wired, never closed.** `olm_tournament.py` is an honest A/B harness with a real metric — but the only run on disk is `before:0, after:0 → INCONCLUSIVE`. No round N+1 ever beat round N on real data. |
| 12-expert BFT council | ✅ Real deliberation (11 lens reviewers, safety=veto/quality=vote, `f=⌊(n-1)/3⌋`) — **but on the free VM config the "12 experts" are one 3B model in 12 prompt hats.** Diversity is prompt-diversity, not model-diversity. |
| 33×33×33 nodes | **Nominal.** Real ceiling: ~12 model calls/mission (cloud key) or 1–2 (local VM). |
| openmoe-bft is the canonical BFT | ❌ `~/openmoe-bft` (234 test fns) **is never imported** by the running engine. meok-one's "harmony" is a *different* `horus.horus_and_harmony`. Two unrelated BFT impls; the "align" decision was never executed. |

**Net:** genuinely-coded, honest, 2-level router→council system that *deliberates* for real — but **talks, doesn't do** (no tool execution), and has **never proven self-improvement**.

---

## 2. The ideal downward stack (what to build beneath each worker)

Top-to-bottom. The bottom layers are **not agents** — they are machinery.

| Layer | Role | MEOK status |
|---|---|---|
| L0 Orchestrator/router | per-task depth/width + **token budget**; match topology to task | partial (king routes, no budget) |
| L1 Supervisor (Generals/Queens) | decompose → sub-goals; one node masks its subtree | ✅ exists |
| L2 Worker | reason→act on one bounded sub-task | ✅ (the council/model) |
| **L3 In-worker decomposition** | plan-and-solve as *prompting inside the worker*, not a new agent | ❌ missing |
| **L4 Tool/skill layer** | executable, retrievable skills + MCP servers | ❌ **declared, not wired** |
| **L5 Environment grounding (leaf)** | code exec, real API calls, the ReAct observe step | ❌ missing |
| **L6 Verifier/critic gate** | check leaf output vs an **external** signal before it bubbles up | ❌ missing |
| **L7 Retrieval** | facts outside the weights | ⚠️ pgvector exists, not on hive path |
| **L8 Blackboard + skill store** | shared state; successful routines written back as code skills | ⚠️ honeycomb ≈ partial |

**The depth you're missing is L3–L8, beneath the worker — not L1.5, another agent tier.**

### The 5 techniques that make depth pay (non-negotiable)
1. **Per-node context isolation + compressed return** — every child gets a fresh bounded context, returns a *summary not its trace*. (Anthropic: +90.2%; token spend explained ~80% of the gain.)
2. **Verify/ground at every leaf against the *real environment*, never another LLM's opinion.** Intrinsic self-reflection is *net-negative*; external-signal verification recovers ~96% of errors; ReAct grounding cut hallucination 56%→6%.
3. **Typed contracts between levels** (objective, output schema, tool scope, **termination condition**) — fixes the two biggest multi-agent failure buckets.
4. **Effort-scaled, bounded fan-out** — budget depth/width per query; centralized coordination held error to 4.4× vs 17.2× decentralized.
5. **Agent-as-tool recursion + a persistent code-skill spine** (Voyager: 3.3× more capability, zero-shot transfer).

---

## 3. The brain configs — the "many MEOK mindsets" to A/B

Organizing fact: **only MoE adds capability without extra forward passes; every other brain multiplies inference, and token spend explains ~80% of multi-agent gains.** So each config must beat *single strong model + best-of-N at the same token budget*.

| # | Config | When it wins | Real jump? | Build on Mac+VM+Ollama |
|---|---|---|---|---|
| **B0** | **MoE long-CoT reasoner + RAG + tools** (baseline bar) | general reasoning/code/agentic | ✅ the new default | R1-distill/Qwen3-MoE on VM; Mac holds pgvector RAG |
| **B1** | **Verifier + best-of-N** ⭐ | anything checkable | ✅ **highest ROI**; verifier beats vote and gap *grows with N* | sample N=4–8, score with a **deterministic checker** (free) or small judge |
| **B2** | **Supervisor–worker** (your King→Queens) | breadth-first, decomposable, read-heavy | ✅ *only* there; loses on coding | already built — reserve for research jobs |
| **B3** | **Mixture-of-Agents** (your openmoe/ShadowArena) | open-ended generation/drafting | ✅ niche; open-models MoA beat GPT-4o on AlpacaEval | orchestrate heterogeneous Ollama proposers |
| **B4** | **Constitution critic** | compliance/policy conformance | ✅ cheap, on-product | 2nd pass with the literal regulation clauses as rubric |
| B5 | Tree/Graph-of-Thought | literal search problems | niche, 5–100× cost | on-demand tool only |
| B6 | Heterogeneous debate | factuality cross-check only | mostly debunked vs self-consistency | gate vs self-consistency |

**Dropped from the A/B set:** Mamba/SSM (efficiency, not capability — *loses* on verbatim citation/recall, your core task) and JEPA/world-models (robotics, not text). Park them with quantum.

**Cross-cutting:** for every multi-model method, **heterogeneity (different base models) is the only active ingredient.** Your "12 nodes = one 3B in 12 hats" gets ~0 of this. Fix = real model diversity per seat (cloud key or bigger host).

---

## 4. Self-improvement — the reframe that makes it real

**Blunt verdict: the skeleton is right; "100/100" and "BFT" are unsound as stated.**

- **"RLF till 100/100"** optimizes the *judge*, not the goal. Pure self-feedback on reasoning is flat-to-negative; self-rewarding saturates in ~3 iterations; pushing a proxy past its peak *degrades* quality. → **Reframe: loop until a HELD-OUT, ground-truth metric plateaus.** Drop "100/100."
- **"BFT vote of 28 queens"** — LLM samples have *correlated* errors (ρ≈0.39 → 9 judges ≈ 2.2 effective votes). That voids the f<n/3 accounting. → **Call answer-selection "ensemble voting," measure ρ/n_eff, reserve "BFT" for the orchestration/anti-prompt-injection layer where it's genuinely real.**
- **Gates** are exactly as strong as the cost of faking their signal. LLM-judge gates are forgeable; **runnable-test / schema-validates / attestation-verifies / wheel-imports gates are real.**

### Why this is *your* edge
**Compliance is a verifiable domain.** Does the MCP wheel import? Does the attestation HMAC verify? Does the JSON validate against the schema? Does the cited Article exist? These are free, unfakeable verifiers. Your existing **"gate-protected harness that only ships importable wheels"** is *already the correct self-improvement pattern.* Generalize it. You can get measurable self-improvement where 99% of AI startups can't — because your outputs are checkable.

### The correct minimal loop
```
GENERATE N diverse (different models/prompts/tools)
 → VERIFY each vs EXTERNAL ground truth (tests/schema/attestation/oracle)
 → SELECT verified-correct (filter, don't average)
 → REINFORCE only verified trajectories (KL-anchor, accumulate data)
 → AUDIT on HELD-OUT set the loop never saw; STOP when held-out plateaus
 → MEASURE n_eff, ρ, output entropy (collapse warning)
```

---

## 5. Four composed MEOK brain-stacks to run in the tournament

Each is a distinct "mindset" — instantiate all four, A/B on a 150-prompt compliance suite, Pareto-rank quality vs cost.

- **STACK-A "Lean Reasoner"** = B0 + B1. One strong MoE model, RAG, tools, best-of-N with deterministic checkers. *The bar.* Cheapest, auditable.
- **STACK-B "Compliance Critic"** = B0 + B4 + B1. Reasoner drafts → constitution critic (regulation clauses) → deterministic verify. *On-product; likely the revenue winner.*
- **STACK-C "Deep Worker Hive"** = B2 (King→Queens) **with the L3–L8 stack wired under each queen** — queens that actually call tools, ground at leaves, verify before returning. *The fix for the real #1 gap.* Reserve for breadth-first research.
- **STACK-D "Heterogeneous MoA"** = B3 over real different Ollama models + a verifier. *For open-ended drafting; needs genuine model diversity.*

---

## 6. Breakthroughs worth stealing

1. **Recursive Language Models (RLM)** — the proven way recursion depth >1 *increases* capability: treat long context as an environment, spawn fresh sub-LLMs on sub-contexts via `llm_batch()`, **heavy data visible only at the leaves**. Beat a standard LLM at ~1.5M-char contexts. *This is the principled version of your recursive hive.*
2. **Holonic "Head masks the body"** — every node is *either atomic or itself a whole holarchy* behind one interface; recursion bottoms out "when subdivision stops being useful," with a hard depth cap as backstop. Clean way to add depth without error blow-up.
3. **Generative/process verifiers as a gate at every level** (GenRM: Best-of-N 73%→93.4%) — convert extra compute into accuracy *at every layer* instead of compounding error.
4. **Deterministic compliance verifiers** — your domain lets the verifier be *free and bias-free* (schema/citation/attestation checks). This is the single biggest unfair advantage you have.

---

## 7. Recommended Level-0 (start here, prove it, then fan out)

**ONE closed self-improving loop on real hardware, depth-capped at 3, on a checkable compliance task:**

1. Wire **L4–L6 under one queen**: make a queen actually *call* its MCP tools (close the #1 gap), ground at the leaf, and pass through an **external verifier gate** (does the attestation verify / wheel import / schema validate).
2. Run **best-of-N (B1)** with that deterministic verifier.
3. Log a **held-out** ground-truth metric across rounds. Prove round N+1 > round N.
4. Only then fan out to more queens / depth. Cap fan-out by budget.

**If that one loop doesn't measurably improve, 33 hives just multiplies a loop that doesn't work.** Get one queen that *does* (not talks) and *provably improves*, then the fractal earns its depth.

---

---

## 8. MASTER INDEX — the canonical map (disk + GitHub)

**One sentence:** there is **ONE engine** — `~/clawd/meok-one/meok_one/` (live `:3200`, `council_nodes:36`). A **King** (`hive_king.py`) routes to **29 Queens**, each = that same engine parameterised by a `stack.yml`. Every reply is audited by **Horus** (12-lens, `/api/horus`) and reconciled by **Harmony** (`/api/harmony`). **SOV3** (`:3101`, 9 neural nets) = memory/honeycomb + governance fallback. `~/openmoe-bft` = a *separate, unwired* BFT/tournament library (234 tests, not on PyPI).

### Canonical files (build targets)
- **Engine:** `~/clawd/meok-one/meok_one/` — `hive_king.py`, `hive_queen.py`, `sovereign.py` (LIVE BFT council), `brains.py`, `bft_lab.py` (6 A/B architectures), `horus.py` (auditor+harmony), `olm_tournament.py` (self-improve harness), `olm_federation.py`, `fleet_indexer.py`
- **Hives:** `~/hive-staging/<name>-hive/stack.yml` × 29 (mirrored as `CSOAI-ORG/<name>-hive`)
- **Memory/neural:** `~/clawd/sovereign-temple/neural_core/` (SOV3, :3101)
- **Unwired challenger:** `~/openmoe-bft/` (ShadowArena, BFTLedger, DebateRound)

### The 29 hives
flagship: **meok-hive**. governance (12): compliance-gateway, csoai, councilof, proofof, accountabilityof, transparencyof, ethicalgovernanceof, safetyof, agisafe, asisecurity, biasdetectionof, dataprivacyof. verticals (13): fishkeeper, koikeeper, landlaw, optimobile, cobolbridge, commercialvehicle, grabhire, muckaway, planthire, diyhelp, pokerhud, socialmediamananger *(sic)*, loopfactory. infra (3): openMCP, openmoe, sandbox(empty).

### stack.yml: 7 layers declared, 3 honoured
`load_hive()` reads **only L5 `tools:` + L6 `scope`/`character` + `tier`**. **L1 drift / L2 history / L3 knowledge-graph / L4 agent-memory / L7 presentation are written but NOT wired.** This is the biggest spec-vs-reality drift — and the L4/L5 tool layer being inert is the #1 gap from §1.

### GitHub: 532 repos (CSOAI-ORG)
334 `*-mcp` compliance servers (~271 on PyPI) · 29 `*-hive` · 24 `meok-*` (canonical engine = **meok-one**, app = meok-ai) · 3 OpenMoE/MoE · 2 sovereign · 2 robotics · ~106 sites/infra/bare-MCP.

### Top drift to fix (canonical pick)
1. **2 BFT impls** — LIVE `meok-one/sovereign.py` (canonical) vs unwired `openmoe-bft` → either wire openmoe-bft in or stop citing it as canonical.
2. **openmoe_bft duplicated byte-identical** — `~/openmoe-bft/` (canonical) vs `~/clawd/openmoe/` (snapshot).
3. **Council count "12/33/36"** — runtime truth = 12-node deliberation; 33 is synthetic; 36 is the server's advertised aggregate.
4. **King→Queen** — one canonical pair (`meok-one`), 6 deprecated dupes archived in `_deprecated_hive_dupes/`.
5. **Brand triplets** — site/hive/test of the same brand (proofof-ai/proofofai, councilof-ai/councilof-hive, fishkeeper×3).

### Plans: ~160 active / ~35 superseded. Canonical masters
`MASTER_PLAN_3DOMAINS_TO_JUL4_2026-06-15.md` · this doc · `MEOK_HIVES_NEMESIS_TO_JULY4_2026-06-15.md` · `OLM_SOVEREIGN_HIVE_2026-06-11.md` · `MEOK_33_WEEKS_2026-06-10.md` · `MASTER-REVENUE-PLAN.md` · `~/openmoe-bft/MASTER_PLAN_MIRROR_TOURNAMENT.md`. Nemesis (Mamba-3 SSM+MoE, 33-agent BFT) = 3–5yr north-star, parked.

### Local model pool
`gemma4:e4b`, `gemma3:4b`, `meok-sov3` (fine-tune), `llama3.2:3b`, `qwen2.5:3b`, `qwen3:0.6b`, `nomic-embed-text`, `moondream`.

