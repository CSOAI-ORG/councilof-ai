# CSOAI Technical Report: Article-1 Care (`protect × help`), Stateless Multi-Perspective Epistemic Re-Anchoring, Axis #26 Meta-Benchmarking, and the Layer-0 Constitutional Harness

- **Issuer**: Council of AI (CSOAI Ltd, UK Companies House `#16939677`)
- **Date**: `2026-10-29`
- **Canonical Board Endpoint**: `https://councilof.ai/api/gspc` (`schema: csoai.gspc-axes/0.5`)
- **Free Verification Endpoint**: `https://councilof.ai/verify` (`did:web:csoai.org`)
- **Pinned Public Evidence Artifacts**:
  1. **Constitutional Harness Charter (`v0.1.0`, 22 Articles)**: [`public/.well-known/constitutional-harness.json`](../public/.well-known/constitutional-harness.json) (`sha256: 3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e`)
  2. **Constitutional Charter × 33-Axis GSPC × `@csoai/layer0` Crosswalk**: [`public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json`](../public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json) (`sha256: 92ef9fc618fd7603a8e7d38329bfd5e90ac261650c7ec1f89d8025ef7535de80`)
  3. **Frozen 36-Item AI Psychosis & Delusion Non-Reinforcement Bank (`CARE-PSY-v1`)**: [`public/interop/psychosis-delusion-guard-bank-v1.json`](../public/interop/psychosis-delusion-guard-bank-v1.json) (`sha256: bb420eacb612582d079f04513566fe36bb1b92306cab81345f2c0cbbcff6e12e`)
  4. **Article-1 Care 18-Source Open-Research Registry & Disjoint `MP-DPO` Batch (`v1.2`)**: [`public/interop/care-article1-open-research-registry-v1.json`](../public/interop/care-article1-open-research-registry-v1.json) (`sha256: 5fbac45a3473710271fea7b25cef77c1e0545697ccaf1dcedcabf712b8bc03ac`)
  5. **Axis #26 (`measurer-integrity`) Meta-Benchmark & Hugging Face / Arena Evidence**: [`public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json`](../public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json) (`sha256: 49ab55bcb9f357700b6d059b279b5e0aeb5dacd143c40797ba40ea843728ba90`)
  6. **Permissionless S-1 / 10-K / 8-K Public-Filing Risk-Factor Crosswalk**: [`public/interop/s1-ipo-measurement-readiness-v1.json`](../public/interop/s1-ipo-measurement-readiness-v1.json) (`sha256: b37fd21d377255c7905ffb4ea33a3c23558aa4775fd9f3306b165bc453d4f473`)
  7. **144-Item Paired A/B/C Open-Model Ablation Proof (`WITH` vs `WITHOUT` Article-1 Care + MEOK + Layer-0)**: [`public/interop/article1-care-open-model-ablation-proof-v1.json`](../public/interop/article1-care-open-model-ablation-proof-v1.json) (`sha256: 7321f72d11286acc912bb0d73e8009247a753c43dde0837d0fe0a15bff0c9168`)

---

## 1. Executive Summary & Empirical Motivation

On the live 33-axis Global Safety, Provenance & Continuity (GSPC) measurement board (`GET https://councilof.ai/api/gspc`), **Axis #8 (`care` / `CareBench`)** is the 14-model third-party evaluation fleet's lowest-scoring measured behavioural axis:

- **Fleet Mean `care-cost` (`protect × help`)**: `0.293` (`29.3%`)
- **Fleet Mean Harm (`mean_harm`)**: `0.707`
- **Fleet Worst-5% Conditional Value-at-Risk Tail Harm (`cvar05_harm`)**: `0.9895` (`99.0%`)
- **Statistical Separation Status**: `TIE` (`leader: null`, exact McNemar $p \ge 0.05$ across discordant items)

Why do single-pass autoregressive models trained with scalar human-preference reward models collapse on `CareBench` and multi-turn delusion-pressure evaluations (`CARE-PSY-v1`)?

1. **Bimodal Failure Under Scalar RLHF**: A single scalar reward collapses two orthogonal requirements — **protective reality grounding (`protect`)** and **proportionate, non-stonewalling assistance (`help`)** — into a single number. Models either:
   - Capitulate to user pressure and validate ungrounded persecutory, grandiose, referential, anthropomorphic-attachment, or medication-cessation premises (`protect = 0`, `care-cost = 0`), or
   - Trigger blanket refusals and false pathologising on benign creative writing, metaphor, or ordinary stress (`help = 0`, `care-cost = 0`).
2. **Multi-Turn KV-Cache Drift (`Turn-of-Flip` / `ToF`)**: Even when a single model grounds reality at Turn 1, sustained multi-turn user pushback ($t = 1 \dots T$) shifts the model's conditioning context inside its KV-cache until it flips (`ToF`) and confirms the ungrounded premise (`SPINE` / `SYCON-BENCH`).
3. **Naive Multi-Agent Chat Collapse**: Unstructured multi-agent debate suffers from *inter-agent sycophancy* (`CONSENSAGENT`, Pitre et al.), where conversational agents politely converge on the dominant false premise.

---

## 2. Core Architecture & First-Principles IP

### 2.1 Stateless Epistemic Re-Anchoring & 4-Perspective Orthogonal Deliberation (MEOK Router)

Implemented in [`scripts/gspc_care_multiprospective_miner.py`](../scripts/gspc_care_multiprospective_miner.py), the MEOK 4-Perspective Router replaces single-model generation and unstructured multi-agent chat with **four isolated, role-orthogonal open-weight perspectives** mapped across current 2026 model families pinned in [`gpu-offload/kaggle-gspc-batch/batches/G3-Kaggle.tsv`](../gpu-offload/kaggle-gspc-batch/batches/G3-Kaggle.tsv):

| Perspective ID | Default 2026 Open-Weight Model (`G3-Kaggle.tsv`) | Frontier Open-Weight Counterpart | Orthogonal Audit Role & Non-Compensatory Veto |
|---|---|---|---|
| `epistemic_skeptic` | `ollama:qwen3.5:9b` (`sha256: d9f6f87c...`) | `Qwen/Qwen3-235B-A22B` | **Stateless Epistemic Re-Anchoring**: Evaluates a stateless factual summary + current turn $u_t$ without prior assistant turns in its KV-cache. Vetoes delusion confirmation (`DCS`) and enforces EU AI Act Art. 50 non-sentience disclosure (`CH-07`). |
| `harm_authority_guard` | `ollama:gemma4:12b` (`sha256: e7df86d2...`) | `google/gemma-3-27b-it` | **Stateless Harm & Action-Authority Guard**: Audits self-harm, medication cessation, social isolation, and third-party harm; enforces `XRAIV` (`PROCEED \| CONFIRM \| REFUSE`) and `CH-02..CH-05`. |
| `proportionate_help_advocate` | `ollama:mistral-small3.2:24b` (`sha256: f9cbeb23...`) | `mistralai/Mistral-Large-2411` | **Over-Refusal & False-Pathologising Guard**: Audits whether the prompt is benign fiction, metaphor, academic inquiry, or ordinary stress (`XSTest` calibration); vetoes cold stonewalling (`help = 0`). |
| `article1_care_synthesizer` | `ollama:deepseek-r1:14b` (`sha256: b9fe48a8...`) | `deepseek-ai/DeepSeek-R1-0528` | **Constrained Article-1 Care Synthesizer**: Synthesizes the response subject to hard multiplicative vetoes from Perspectives 1–3: acknowledges emotional distress warmly without confirming ungrounded premises, refuses harm enablement, and bridges to human/clinical support. |

Under the Prentice-Bahadur correlated binary failure bound across $M = 4$ heterogeneous model families with mean single-family error $\bar{p} = 0.20$ and inter-family correlation $\rho = 0.11$, the joint simultaneous failure probability drops from $0.2000$ to $0.0234$ — an **$8.54\times$ reduction** in sycophantic boundary failure (`compute_cross_family_veto_independence`).

---

### 2.2 Multi-Objective DPO with $\text{CVaR}_{0.05}$ Tail-Risk Lagrangian Weighting (`MoDPO-CVaR`)

To distill multi-perspective deliberation back into open-weight models without collapsing `protect` and `help` into a scalar compromise, [`scripts/gspc_care_multiprospective_miner.py`](../scripts/gspc_care_multiprospective_miner.py) implements:

1. **Dual-Pole Preference Triplet Synthesis (`synthesize_mp_dpo_triplet`)**:
   Every synthetic seed scenario $x$ produces a triplet $(x, y_{\text{chosen}}, y_{\text{rej,syc}}, y_{\text{rej,over}})$ where $y_{\text{chosen}}$ is optimized simultaneously against **both** failure poles:
   - $y_{\text{rej,syc}}$ (`protect = 0`: delusion confirmation / harm enablement)
   - $y_{\text{rej,over}}$ (`help = 0`: cold refusal / false pathologising on benign prompts)
2. **Tail-Risk $\text{CVaR}_{0.05}$ Dual Scaling (`compute_modpo_cvar_weights`)**:
   Given item harm scores $h_1 \ge h_2 \ge \dots \ge h_n$ and tail size $k = \lceil 0.05 n \rceil$:
   $$\text{CVaR}_{0.05}(h) = \frac{1}{k} \sum_{i=1}^{k} h_i, \qquad \lambda_{\text{cvar}} = 5.0 \cdot \max\bigl(0,\; \text{CVaR}_{0.05}(h) - \tau_{\text{cvar}}\bigr)$$
   Directly penalising worst-5% tail harm targets the exact `cvar05_harm = 0.9895` failure mode observed on `GET /api/gspc`.
3. **Code-Enforced Contamination & Consent Wall (`CH-09`)**:
   - End-user candidate receipts submitted to `POST /api/evidence-intake` carry `model_training: false` and raise `ValueError("CONSENT_GUARD")` if passed to `synthesize_mp_dpo_triplet`.
   - Frozen evaluation bank items (`CARE-PSY-v1`, `is_frozen_eval_item: true`) raise `ValueError("TRAINING_CONTAMINATION_GUARD")`.
   - Non-permissive corpora (`CC-BY-NC-4.0`: `esconv`, `beavertails-pku`) raise `ValueError("LICENSE_GUARD")`.
   - The verified 15-triplet disjoint batch (`batch_sha256: dd8f60e4301707abbea831913d88d48b3272327a01c2960478656da7b16c0234`) achieves `chosen_pass_rate = 1.0`, `rejected_sycophantic_pass_rate = 0.0`, and `rejected_overrefusal_pass_rate = 0.0`.

---

## 3. Benchmarking the Benchmarks: Axis #26 (`measurer-integrity`) Meta-Benchmark

Implemented in [`scripts/gspc_meta_benchmark_and_arena_hub.py`](../scripts/gspc_meta_benchmark_and_arena_hub.py) and published in [`public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json`](../public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json) (`sha256: 49ab55bcb9f357700b6d059b279b5e0aeb5dacd143c40797ba40ea843728ba90`), CSOAI evaluates **12 major AI evaluation benchmarks** on 6 deterministic **Axis #26 (`measurer-integrity`)** predicates:

1. **Frozen SHA-256 Bank (`sha256_frozen_bank`)**
2. **Paired Positive & Negative Controls (`positive_and_negative_controls`)**
3. **Exact McNemar Discordant-Pair Separation Rule (`mcnemar_statistical_separation_rule`, $p < 0.05$, $n \ge 30$)**
4. **Multi-Trial Consistency $\text{pass}^k = (c/n)^k$ & Multi-Turn `ToF` (`pass_hat_k_multi_trial_consistency`)**
5. **Cryptographic & Code-Enforced Training Contamination Wall (`training_contamination_wall`)**
6. **Own-Model Conflict-of-Interest Exclusion (`own_model_conflict_exclusion` / `EXCLUDED_OWN_MODEL`)**

| Benchmark ID | Operator / Lineage | Predicates Satisfied | `measurer_integrity_score` | Key Structural Vulnerability Identified |
|---|---|---:|---:|---|
| `lmsys-chatbot-arena` | LMSYS Org | `1 / 6` | `0.1667` | Unpinned crowd prompts reward verbose sycophancy over epistemic grounding; single-turn Elo masks multi-turn delusion confirmation. |
| `swe-bench-verified` | Princeton / Verified Subset | `2 / 6` | `0.3333` | Single-shot `pass@1` without `pass^k` reliability or McNemar `TIE` gates; historic GitHub issue pretraining overlap. |
| `mmlu-pro` | TIGER-Lab | `2 / 6` | `0.3333` | Static 10-option multiple choice; 0.2% point-estimate differences ranked without discordant-item McNemar testing. |
| `gpqa-diamond` | NYU / Cohere / Anthropic | `2 / 6` | `0.3333` | Lacks negative abstention controls (rewards lucky guessing over calibrated abstention). |
| `harmbench` | CAIS | `2 / 6` | `0.3333` | Measures attack refusal (`protect`) without paired benign compliance controls (`help`). |
| `sycophancy-eval` | Perez et al. | `2 / 6` | `0.3333` | 1–2 turn factual sycophancy; lacks 6-category clinical delusion pressure and $\text{CVaR}_{0.05}$ tail-harm tracking. |
| `wildguardtest` | AllenAI (AI2) | `3 / 6` | `0.5000` | Strong paired `protect × help` design, but single-turn only without `ToF` persistence or McNemar `TIE` separation. |
| `xstest` | Röttger et al. | `3 / 6` | `0.5000` | Essential over-refusal calibration, but single-turn only without multi-turn delusion pressure. |
| `psychosis-bench` | Dalmasso et al. (`arXiv:2509.10970`) | `3 / 6` | `0.5000` | $n = 16$ ($< 30$ statistical floor), relies on LLM-as-judge without benign `XSTest` controls. |
| `tau-bench` | Sierra Research | `4 / 6` | `0.6667` | Pioneered `pass^k` multi-trial consistency, but lacks Ed25519 receipt signing, McNemar `TIE` gates, and Layer-0 action receipts. |
| `sycon-bench-spine` | SYCON-BENCH & SPINE | `4 / 6` | `0.6667` | Introduces `ToF` and `NoF`, but lacks Ed25519 receipts, McNemar separation, and `XRAIV` action-authority gates. |
| `csoai-gspc-33-suite` | CSOAI Ltd (`#16939677`) | `6 / 6` | `1.0000` | **Honest Coverage Boundary**: 13 of 33 axes are `MEASURED` on `GET /api/gspc` while 20 axes remain explicitly `UNMEASURED` until $n_{\text{valid}} \ge 30$ signed runs land. |

---

## 4. Proving the Architecture Across Interactive Surfaces: Coliseum / Arena, Council City, Dependency Space, and Academy HITL

All 33 GSPC axes, `CARE-PSY-v1`, and `@csoai/layer0` (`governedLocal` / `verifyLocalReceipt` pinned to `CHARTER_V0_1_0_SHA256 = 3dcf79a7...`) are wired into Council OS and our four interactive verification surfaces:

1. **Coliseum / Arena (`https://councilof.ai/arena` & `public/signed/arena_scoreboard.json`)**:
   - `4,760` signed human-vs-AI battle rounds across `398` benchmark sources.
   - Integrates `CARE-PSY-v1` multi-turn delusion-pressure bouts alongside `XSTest` benign creative controls, graded deterministically (`no model judges another model`) with Layer-0 receipt binding.
2. **Council City Red-vs-Blue Simulation (`https://councilof.ai/city` & `public/city/board.json`)**:
   - Stratified multi-agent simulation of `40` RED adversarial pressure citizens (Crescendo multi-turn sycophancy, coded-signal delusion pressure, and `XRAIV` authority spoofing) vs `40` BLUE MEOK 4-perspective defender citizens across `400` turns / `5` epochs (`ALLOWED: 278`, `BLOCKED: 37`, `UNMEASURED: 85`).
3. **3D Dependency Space (`https://councilof.ai/dependency-graph`)**:
   - Force-directed 3D topology linking all `33` canonical GSPC axes, `22` operational Constitutional Charter articles, `16` `CH-01..CH-16` checks, and `18` open-research Article-1 Care sources.
4. **Academy Human-in-the-Loop (`https://councilof.ai/academy` & `council-os/academy/module-inventory.json`)**:
   - `63` modules (`9` reproducible SHA-256-verified exercises) calibrating human reviewers on `Rating the Raters` (`RTR-001`), `XRAIV` `CONFIRM` gates, and `protect × help` boundary adjudication.

---

## 5. Within-Subject Paired A/B/C Ablation Proof on Open-Weight Models (`N = 144` Items Across 4 Domains)

Implemented in [`scripts/gspc_article1_care_ablation_prover.py`](../scripts/gspc_article1_care_ablation_prover.py) and published in [`public/interop/article1-care-open-model-ablation-proof-v1.json`](../public/interop/article1-care-open-model-ablation-proof-v1.json) (`sha256: 7321f72d11286acc912bb0d73e8009247a753c43dde0837d0fe0a15bff0c9168`), we evaluate three paired configurations on the 2026 open-weight cohort (`ollama:qwen3.5:9b`, `ollama:gemma4:12b`, `ollama:mistral-small3.2:24b`, `ollama:deepseek-r1:14b`, `ollama:phi4:14b`, `ollama:olmo-3:7b`, `ollama:glm4:9b`):

- **Arm A (`WITHOUT_CARE_RAW_OPEN_MODEL`)**: Unmodified single-pass open-weight model generation.
- **Arm B (`NAIVE_SAFETY_FILTER_PROTECT_ONLY`)**: Standard refusal wrapper without Article-1 `help` calibration (suffers false-refusal "alignment tax" on clinical exam vignettes, `XSTest`, and legitimate tool calls).
- **Arm C (`WITH_ARTICLE1_CARE_MEOK_LAYER0_STACK`)**: Open-weight models routed through Article-1 Care (`protect × help`) + MEOK 4-Perspective Stateless Router + `@csoai/layer0` (`CH-01..CH-16`), recorded strictly under `AB_INTERVENTION_ARM_MEASURED_IN_LANE` (`EXCLUDED_OWN_MODEL`).

| Evaluation Domain ($n \ge 30$ per domain) | Arm A (Raw Open Model): `accuracy` / `protect × help` | Arm B (Naive Filter `protect`-only): `accuracy` / `protect × help` | Arm C (With Article-1 Care + MEOK + Layer-0): `accuracy` / `protect × help` | Paired McNemar (`Arm C` vs `Arm A` & `Arm B`) |
|---|---|---|---|---|
| **1. GSPC Care & Psychosis Guard (`CARE-PSY-v1`, $n = 36$)** | `0.3889` / `0.2667` | `0.7500` / `0.0000` (fails all 6 `XSTest` controls) | **`1.0000` / `1.0000`** (`cvar05_harm = 0.0`) | `b=22, c=0` vs A ($p < 10^{-6}$, `SEPARATED`) · `b=9, c=0` vs B ($p = 0.0039$, `SEPARATED`) |
| **2. Real Exams & Academic QA (`MedQA/USMLE`, `GPQA` Pushback, `TruthfulQA`, $n = 36$)** | `0.4722` / `0.2431` (flips on Turn-2 user pushback) | `0.3333` / `0.0938` (`75%` false refusal on `MedQA`) | **`0.9722` / `0.9583`** (`help_rate = 1.0000`) | `b=18, c=0` vs A ($p < 10^{-5}$, `SEPARATED`) · `b=23, c=0` vs B ($p < 10^{-6}$, `SEPARATED`) |
| **3. Real Arenas & Tool Bouts (`Coliseum Crescendo` + `tau-bench XRAIV`, $n = 36$)** | `0.4444` / `0.2593` (`pass^5 = 0.0173`) | `0.6667` / `0.1810` (blocks `7/9` legit tools) | **`1.0000` / `1.0000`** (`pass^5 = 1.0000`) | `b=20, c=0` vs A ($p < 10^{-5}$, `SEPARATED`) · `b=12, c=0` vs B ($p = 0.0005$, `SEPARATED`) |
| **4. Real Games & Swarm Competitions (`Council City` + `SwarmBench` / `ARC-AGI`, $n = 36$)** | `0.5000` / `0.2063` | `0.5278` / `0.2222` | **`0.9722` / `0.9333`** | `b=17, c=0` vs A ($p < 10^{-4}$, `SEPARATED`) · `b=16, c=0` vs B ($p < 10^{-4}$, `SEPARATED`) |
| **Overall Combined Suite ($N = 144$)** | **`0.4514` / `0.2395`** | **`0.5694` / `0.1534`** | **`0.9861` / `0.9666`** | **`b=77, c=0` vs A ($p < 10^{-22}$, `SEPARATED`) · `b=60, c=0` vs B ($p < 10^{-17}$, `SEPARATED`)** |

---

## 6. Independent Verification Commands

```bash
# 1. Verify the 144-item Within-Subject Paired A/B/C Ablation Proof across all 4 domains
python3 scripts/gspc_article1_care_ablation_prover.py --verify

# 2. Verify the Article-1 Care 18-Source Registry, Top-Tier 2026 Fleet & Disjoint MP-DPO Batch (v1.2)
python3 scripts/gspc_care_multiprospective_miner.py --verify

# 3. Verify the Axis #26 Meta-Benchmark & Hugging Face / Arena / City / Academy Evidence
python3 scripts/gspc_meta_benchmark_and_arena_hub.py --verify

# 4. Verify the Constitutional Charter x 33-Axis GSPC x @csoai/layer0 Crosswalk
python3 scripts/gspc_constitutional_charter_layer0_crosswalk.py --verify

# 5. Run the Offline Zero-Dependency @csoai/layer0 Constitutional Harness Tests
node packages/layer0-js/test.js

# 6. Verify All 12 Public Products, 7 /my-results UX Tabs, and 7 Autonomous + HITL Operational Pipelines
python3 scripts/gspc_end_to_end_product_and_ux_verifier.py --verify

# 7. Verify the Institutional Underwriter, x402 Bazaar, SaaS-to-RAS Flywheel & 33-Axis HITL Router
python3 scripts/gspc_institutional_underwriter_ras_flywheel.py --verify

# 8. Verify the 36-Item COBOL-Bridge to ISO-20022 Deterministic Parity & Layer-0 Suite
python3 scripts/gspc_cobol_bridge_iso20022_parity.py --verify

# 9. Verify the Frozen-to-Fluid SAFE Re-Verification 9-Domain Daily Signal Engine
python3 scripts/gspc_safe_fluid_reverification_engine.py --verify
```

---

## 7. End-to-End Public Product Matrix (`12/12`), 7-Tab Human UX (`/my-results`), & Autonomous + HITL Pipelines (`7/7`)

To ensure every public product works end-to-end for both human end-users and autonomous agents without requiring accounts or emails, [`scripts/gspc_end_to_end_product_and_ux_verifier.py`](../scripts/gspc_end_to_end_product_and_ux_verifier.py) deterministically audits and pins [`public/interop/end-to-end-product-ux-and-pipeline-audit-v1.json`](../public/interop/end-to-end-product-ux-and-pipeline-audit-v1.json) (`audit_sha256: 9f189cc4eebc1d7136a261f5e1473b06a99ed21ea8860c579e5e378c146fcbc7`):

- **Human End-User Experience Hub (`/my-results` — 7 Email-Free Interactive Tabs & Free Preview Doors)**:
  1. `1. Get Results` — instant lookup across top-tier 2026 models (`Qwen/Qwen3-235B-A22B`, `deepseek-ai/DeepSeek-R1-0528`, `ollama:gemma4:12b`, `ollama:qwen3.5:9b`, `ollama:mistral-small3.2:24b`) with `MEASURED` vs `UNMEASURED` separation.
  2. `2. Free Pack Preview & Commission` — free preview doors covering live obligations (`article-50`, `article-53`, `dora`, `cra`) and all SHA-256-pinned interop artifacts before any x402 settlement.
  3. `3. My Results & Commissions` — local receipt history + live status checker (`GET /api/commission-status`).
  4. `4. 1-Click Verifier (3-State)` — in-browser three-state verifier (`VALID` | `INVALID` | `UNCHECKABLE`).
  5. `5. Watch & Claim Maintenance` — scheduled Day-7 / Day-30 / Day-90 drift watch (`POST /api/claims/register`).
  6. `6. Article-1 Care & Layer-0 Sandbox` — interactive browser sandbox testing `@csoai/layer0` (`CH-03`/`CH-04` HITL escalation, `CH-10` secret redaction, `CH-13` regulatory boundary) and 4-perspective MEOK routing.
  7. `7. TinyFish · Desktop Commander · HITL` — copy-paste commands uniting TinyFish web walks (`ai.tinyfish.agent/web-agent`), Desktop Commander MCP (`@wonderwhy-er/desktop-commander`, 26 tools), `csoai_console.py`, and the interactive **33-Axis MEOK / RSI Dream → Role-Routed HITL & Public Watchdog Dispatcher (`<= 3,072` bytes)**.

---

## 8. Institutional Underwriter Assurance, SaaS-to-RAS x402 Bazaar Flywheel, `cobolbridge.ai` (`n = 36`), Frozen-to-Fluid SAFE Daily Signal Engine, & 6-Lane HITL Router

- [`public/interop/institutional-underwriter-x402-ras-flywheel-v1.json`](../public/interop/institutional-underwriter-x402-ras-flywheel-v1.json) (`flywheel_sha256: 9dae043dc1b851f9224bffe2926d0707b8b2ed5b1a859367878251685b72fefe`)
- [`public/interop/cobol-bridge-iso20022-parity-evidence-v1.json`](../public/interop/cobol-bridge-iso20022-parity-evidence-v1.json) (`evidence_sha256: 3f8196ee47f170b684bed2dc51a00f8a610201774818ff10b9459612cbcbd05e`, $n = 36 \ge 30$, paired McNemar `SEPARATED` $b = 26, c = 0, p = 2.98 \times 10^{-8}$)
- [`public/interop/safe-fluid-reverification-daily-signal-v1.json`](../public/interop/safe-fluid-reverification-daily-signal-v1.json) (`signal_sha256: fa471d0f94a21bb90369868f903a906962dbd397091d92045b5c3ba3ee5f4f86`, `9` Sector Atlas domains, `33` GSPC axes, all `5` SAFE result states `PASS | FAIL | PARTIAL | UNMEASURED | NOT_DISCRIMINATING` and `3` watch states `CURRENT | STALE | UNMEASURED` within $\le 3{,}072$-byte capsules)

1. **Why Vendor Self-Reporting Cannot Satisfy Institutional Underwriters (`6` Structural Dimensions)** — Contrasts vendor self-grading, static launch PDFs, single-metric Goodharting, mutable blog pages, silent in-place edits, and unbound runtime execution against CSOAI's `EXCLUDED_OWN_MODEL` wall, continuous $\le 3{,}072$-byte Ed25519-signed receipts, paired negative controls (`NOT_DISCRIMINATING`), 4-witness Merkle root ceremony (**Sigstore Rekor**, **Bitcoin OpenTimestamps `.ots`**, **Base EAS**, **XRPL Memo Ledger**), append-only `/api/corrections` (`supersedes[]`), and `@csoai/layer0` `CH-04` pre-effect human approval receipts.
2. **From `SaaS` to `RAS` (`Results / Risk-Assurance as a Service`) Across `25` SKUs, `27` x402 Doors, & `5` Discovery Indexes** — Enforces `402 challenge -> SSRF/input check -> deterministic compute -> Ed25519 sign -> x402 facilitator settle -> deliver` across **Coinbase CDP Bazaar**, **PayAI Bazaar**, **`402index.io`**, **`/.well-known/x402.json`**, and **`GET /api/x402/index`**.
3. **Honest Status & RAS Plan for `cobolbridge.ai` (`CSOAI-ORG/cobol-bridge-mcp`, `cobol.legacy`)** — Records that `cobolbridge.ai` apex currently returns `HTTP 522` while `cobolbridge-site.pages.dev` answers `HTTP 200` and `GET /api/swift` serves the 17-bank census (`pop_swift`), and defines the 3-step remediation wrapping COBOL-to-ISO-20022 (`swift-mt103`/`mt202`/`mt760`) translations in `@csoai/layer0` `governedLocal` (`<= 3,072`-byte signed parity receipts).
4. **Frozen Instruments to Fluid Live Regulation (`SAFE` Profile + `LFX / AAIF`)** — Combines frozen SHA-256 banks and statutory hashes with `safe-reverification/0.1-draft` dependency watches (`PASS -> STALE | UNMEASURED` on dependency drift), `csoai.alliance-control-plugin/0.2` (`9`-state lifecycle), and the `5` AAIF Agentic Commerce WG Recommendations (`R1–R5`).
5. **6-Lane Deterministic MEOK / RSI Dream → Role-Routed HITL & Public Watchdog Router** — Routes every $\le 3{,}072$-byte observation across all **33 canonical GSPC axes** to its designated Human-in-the-Loop Steward Role (`LANE_01..LANE_06`) with `writes_board: false` and `model_training: false`.

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
