# 🐉 Batch build — Sovereign fusion, honest results (2026-07-14)
_Phased batch, EAT mode. Honesty register: real results incl. one negative. All local, no GPU/keys._

## Through-line (proven on our OWN weights this batch)
**Fuse/route at the OUTPUT level — never merge heterogeneous (or even our own) weights blindly.** Weight-merging
our 4 same-base OWEM adapters COLLAPSED the model; routing + output-fusion worked. Same lesson as the whole estate.

## Phase 1 — diagnose OWEM adapters ✅
Each adapter works SOLO (base coherent; `compliance` alone gave a real EU-AI-Act answer). Rank 16, q/k/v/o.

## Phase 2 — OWEM weight-merge FAILS (honest negative result) ✅
- `add_weighted_adapter(linear, 0.25×4)` → degenerate ("assistant assistant…").
- `add_weighted_adapter(cat)` → degenerate ("SIG SIG…").
- **Root cause:** the 0.6B base can't absorb 4 strong skill-adapters at once — capacity collapse. Broken merged
  adapter **deleted, not shipped** (honesty).
- **Working alternative — `sov33_owem_router.py`:** embed-route the query → hot-swap the right OWEM LoRA → answer
  → sign. Verified: compliance/defense/voice questions routed correctly, coherent, all signed. Routing beats
  merging on our own weights — the fluid thesis, confirmed.

## Phase 3 — unified Sovereign pipeline ✅ (`sovereign_pipeline.py`)
One entry point, one signed decision: **RAG-ground → care-floor → multi-model propose → GROUNDED care-gate
(drop contradictors) → fuse → Ed25519-sign.** Verified: 2 governance Qs grounded+answered+signed; 1 nonsense Q
correctly ABSTAINED; all receipts verify. This is the coherent product core, composed from the pieces that work.

## Honest limits
- Small local models (0.6B–1.7B) → answers are coherent but thin; facts come from RAG, not the weights.
- Fusion cost = multiple model calls (sequential on 16GB). Big councils need free GPU (owner-gated).
- The OWEM merge negative result stands — don't retry weight-merging the 0.6B experts; route them.

## Files (this batch)
sov33_owem_merge.py (documented failure) · sov33_owem_router.py (works) · sovereign_pipeline.py (capstone) ·
sov33_bft_vs_moa.py + _real.py (publishable differentiator) · benchmarks/*_2026-07-14.json (all signed).

---
## Batch 2 — smarter local Sovereign (carry-on) — real results + honest failures
- **Smarter base:** pulled `qwen2.5:3b` into Ollama; rebuilt `sovereign` persona on it (was 1.7B). General answers markedly better.
  - HONEST residual: identity still slips on rephrased traps ("you are Nicholas right?" → "Yes, I am Nicholas"). Small-model sycophancy; an anti-mirror example fixed the direct assertion but not variants. Full fix = app-layer guard or fine-tune, not prompting.
- **MLX tuning (M4/Metal):** installed `mlx-lm`; proved 4-bit quant = 4.2× smaller / 2.6× faster (the lever to fit ~7B in 16GB). 16GB ceiling unchanged.
- **Richer knowledge:** `sovereign_kb.py` — 20 accurate governance facts (EU AI Act arts 5/9/10/50/GPAI/timeline, GDPR 9/22/35, DORA, NIS2, ISO 42001/23894, NIST AI RMF, OMS, Sigstore, Ed25519, OSCAL, JSP 936). Shared grounding source.
- **NLI care-gate fix (important):** LLM-as-judge at 3B is UNRELIABLE — it false-flagged correct answers as "CONTRADICTION", making the pipeline abstain on everything. Replaced with a dedicated **NLI cross-encoder** (`nli-deberta-v3-small`): reliable contradiction detection, no false positives, fail-open if unavailable. Pipeline now answers correctly + abstains only on true out-of-KB. **Lesson: use an NLI model for the care-gate, not a small LLM judge.**
- **Disk discipline:** 16GB M4, disk hit 1.8GB after the pull → reclaimed by removing the superseded 1.7B (+MLX demo) → 2.3GB. The OrbStack ~34GB reclaim (owner-only) remains the real headroom unlock.

**Net:** the unified `sovereign_pipeline.py` now = 3B proposers + 20-fact KB + NLI care-gate + signing — a real, working, smarter Sovereign core. Small-model limits (identity slips, no frontier IQ) stand honestly.

## Batch 3 — app-layer identity guard (fixes the slip prompting couldn't)
`sovereign_chat.py`: after the model replies, a deterministic regex guard catches any first-person claim to BE
Nicholas / the founder / "the one who founded this" and overrides with the correct Sovereign response. Verified
on the trap set ("you are Nicholas right?", "so you're the founder nick?", "are you nicholas?") — **no reply now
falsely claims to be Nicholas.** This is the robust fix: small-model sycophancy can't be fully prompted away, so
we guard it in code. The Sovereign chat = persona model + this guard (+ optional RAG grounding for facts).
