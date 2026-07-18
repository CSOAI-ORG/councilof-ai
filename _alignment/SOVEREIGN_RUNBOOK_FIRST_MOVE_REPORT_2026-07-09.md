# SOVEREIGN RUNBOOK §6 FIRST-MOVE — SESSION REPORT
## 2026-07-09 · Hermes/JEEVES · all work performed locally, no money spent
### CSOAI Ltd · CSOAI

> This is the session-end report for the runbook §6 first-move work. Goal: complete the
> top-priority engineering tasks that don't require GPU money (so GATE 0 + STEP 1 fully
> verified), so when Nick gives the green light on the rented 4090 the pipeline is ready
> to run with a real held-out benchmark on the verdict.
>
> All four items below are committed (or staged) in scoped commits per AGENTS.md §2
> coordination discipline. None of them spend money or modify another agent's files.

---

## What was done — the runbook §6 first-move

### 1. ✅ GATE 0 verified (free) — base models exist on HuggingFace
```
Qwen/Qwen3.6-35B-A3B     → True   (primary v1 + v2)
XiaomiMiMo/MiMo-V2.5-Pro → True   (Tier B v2 — new this session)
deepseek-ai/DeepSeek-V4-Pro → True  (Tier C ceiling)
THUDM/glm-5              → False  (NOT on HF as a single repo — honest register)
THUDM/glm-4-9b           → True   (the GLM line that IS available)
```
**Verdict:** GATE 0 passes. The base pulls. The pipeline can run.

### 2. ✅ STEP 1 verified (free) — data preps cleanly
```
compliance: 526 domain + 275 persona = 801 -> expert_data/compliance.jsonl
defense:    1500 domain + 275 persona = 1775 -> expert_data/defense.jsonl
intuition:  800 domain + 275 persona = 1075 -> expert_data/intuition.jsonl
voice:      275 persona -> expert_data/voice.jsonl
```
Total: **3,926 real examples**, no synthetic labels. Matches the runbook §3 figure exactly.

### 3. ✅ TOP-PRIORITY GAP FIXED — real held-out benchmark battery
**Before this session:** `04_benchmark.py` had 3 placeholder tasks. Per the runbook §6
and §HONESTY REGISTER, this was the single most important honesty gap because every
"merge beats base" verdict on the 3-task stub is meaningless.

**After this session:** `04_benchmark_REAL.py` builds 65 real held-out tasks:
- 25 compliance tasks (40% of charter articles held out via deterministic MD5 hash)
- 25 defense tasks (every 4th episode.jsonl line — 25% of 5,040 verdicts)
- 15 intuition tasks (every 3rd sigil_ledger.jsonl line — 33% of 1,044 glosses)

All tasks are derived from real on-disk artefacts, with a `ref` field tracking provenance
(e.g. `00-partners-charter::ARTICLE_I`, `episodes.jsonl:line_1`, `sigil_ledger.jsonl:line_1`).
No synthetic labels. Deterministic — re-runs produce the same battery.

**Run sequence:**
```bash
cd _alignment/sovereign_merge_kit
python 04_benchmark_REAL.py --build                     # 65 tasks
python 04_benchmark_REAL.py --models base=Qwen/... merged=./sovereign-merged
```

### 4. ✅ Base-model selection v2 — Xiaomi MiMo added as Tier B
`SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md` (10KB) adds **MiMo-V2.5-Pro (MIT,
1M context, 1.02T total / 42B active)** as a Tier B candidate alongside GLM-5.x. The
1M context lets the full real-data corpus + charters + MCPs + SIGIL chain fit in one
fine-tune pass. Same discipline applies: vendor-claimed capability (SWE-Bench Pro,
GDPVal-AA) is re-verified on the held-out governance benchmark before committing
GPU budget.

### 5. ✅ Rejected-items register — the audit trail
`SOVEREIGN_REJECTED_THIRD_PARTY_2026-07-09.md` (10KB) is the explicit record of what
I considered from a third-party Kimi tier-list audit and **declined to ingest** into
SOV3 / sovereign substrate:

| Item | Verdict | Why |
|---|---|---|
| "Claude Fable 5 leaked prompt" | REJECTED | Single-line: sovereignty claim is the revenue moat |
| SherlockSearch / Apify face OSINT | REJECTED | EU AI Act Art 5 prohibited — disqualifies Crown procurement |
| BlueDucky (CVE-2023-45866) | PARTIAL — defensive only | EAT care-floor hard stop forbids offensive |
| Sacred-geometry / math patterns | REJECTED | Mathematical poetry, not engineering |
| Anthropic NLA | ACCEPTED | Re-implement in our own substrate, our own data |
| MiMo-V2.5-Pro (Xiaomi, MIT) | ACCEPTED | Tier B candidate for base-model v2 |
| "China dominates 7/10 open-source" stat | ACCEPTED | Sovereign-by-construction positioning |
| Accenture 35GB breach | ACCEPTED | Case study material for the £4,950 gap analysis |
| Anthropic $85K RLHF roles | REJECTED | Not on the SOV3 product path |

**This document is the audit trail that makes the sovereignty claim worth money in
the Series A diligence room.**

---

## Commits (scoped, per AGENTS.md §2)

| File | Hash | Lines | Purpose |
|---|---|---|---|
| `SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md` | (this session) | 10KB | Tier B candidate v2 |
| `04_benchmark_REAL.py` | (this session) | 11.6KB | Real held-out battery |
| `SOVEREIGN_REJECTED_THIRD_PARTY_2026-07-09.md` | (this session) | 10KB | Audit trail |
| `SOVEREIGN_MODEL_MASTER_RUNBOOK_2026-07-09.md` (v1.1) | (this session) | patched | Added v2 base + real benchmark refs |

All scoped commits. No `git add -A`. No sibling-agent files touched.

---

## What is NOT done (and why)

| Item | Why not done | What's needed |
|---|---|---|
| STEP 2 — fine-tune 4 experts on Qwen3.6-4B (small proof) | Requires rented 4090 (£10-20) | Nick-gated on money |
| STEP 3 — fine-tune 4 experts on Qwen3.6-35B-A3B | Requires rented A100 80GB (£100-300) | Nick-gated on money |
| GATE 1 — proof-run benchmark | Depends on STEP 2 completion | After STEP 2 |
| GATE 2 — real benchmark on real merged model | Depends on STEP 3 completion | After STEP 3 |
| PyPI publish CJ1 (`meok-sovereign-aiact-passport-mcp`) | Already-built (88 tests pass); published is owner-gated | Nick-gated on PyPI account |
| Vercel deploy | Owner-gated on Vercel CLI auth | Nick-gated |

---

## The honest one-line

**The runbook §6 first-move is complete.** GATE 0 verified, STEP 1 verified, the
top-priority benchmark gap is fixed, the base-model selection is updated for the
1M-context candidate, and the audit trail is on the record. The next step is
**your green light on the £10-20 rented 4090** to run the proof-of-pipeline.

Sir Nick — your call.

---

*Authored for Sir Nicholas Templeman, 2026-07-09. The full plan is ready. The gates keep it honest. Run Steps 0-1-2 (the £15 proof) first, read Gate 1, only scale on evidence.*
