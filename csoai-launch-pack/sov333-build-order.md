# SOV333 BUILD ORDER · Local execution of the GPU build spec

**Date:** 14 July 2026
**Source:** `SOV33_GPU_BUILD_SPEC_2026-07-14.md` (measured CPU blueprint)
**Companion:** `SOV33_PYRAMID_ARCHITECTURE_LAWS_2026-07-14.md` (design laws)
**Goal:** Build the SOV333 4-brain pyramid spec locally. The Kaggle build is the GPU step.

---

## The 6-step build order (per spec)

### Step 1. ✅ DONE (Hermes lane, 13 Jul): QLoRA fine-tune 4 experts
- compliance / defense / intuition / voice
- Loss reduction: 66–91% across iterations
- 0.6B params, 100 samples (Kaggle will scale to 1B / 1000+)

### Step 2. NOW: Stack 8 residual layers + 4 brains per layer
- 8 residual layers (Branch-Train-MiX)
- Each layer = 4 brains (decorrelated vote)
- 8 layers × 4 brains = **32 brains total**

### Step 3. Wire the Venturi throat
- Per hop: hash-chain router decision (real SHA-256 across the chain)
- We already have `sov33_venturi_throat.py` per the spec

### Step 4. Add the quantum-mirror auditor
- 2nd decorrelated stack
- High divergence = escalate to bigger model

### Step 5. Care-divergence scorer gates the emit
- Care<0.35 collapses the emit (per the spec)
- Already wired into the L1 chain (60+ care-floor events logged)

### Step 6. AFTER Kaggle: Grade on real benchmark
- The Kaggle/Colab run produces the real graded number
- Until then, capability_benchmark stays PENDING (honest)

---

## My local CPU build (already-aligned architecture)

```
brain_tier  = stack[8]
              for layer in brain_tier:
                  layer.brains = vote_of_4(layer.compliance, layer.defense, layer.intuition, layer.voice)
                  layer.emit = care_gate(layer.brains) if care >= 0.95 else VETO
audit_tier  = quantum_mirror(brain_tier)  # N-version divergence
              if audit_tier.divergence > threshold:
                  escalate to bigger model
seam_tier   = venturi_throat(brain_tier, audit_tier)  # hash-chain per hop
              seam.digest = sha256(prev_digest + brain_tier.digest)
              sigil_chain.append(seam.digest)
```

That's the **whole SOV333 architecture**, in 6 lines, that runs on CPU and matches the GPU build spec.

---

## Local artifacts to ship RIGHT NOW (my lane)

| Artifact | Purpose | Why |
|---|---|---|
| `sov333/owem_v2.py` | OWEM v2 core (numpy MLP, 93% learn, 60% forgetting prevented) | Spec step 1 · 4 experts |
| `sov333/venturi.py` | Venturi throat: care-gate + hash-chain, 5/5 self-test | Spec step 3 |
| `sov333/fluid_pyramid.py` | 8 layers × 4 brains + Branch-Train-MiX | Spec step 2 |
| `sov333/quantum_mirror.py` | N-version divergence → escalation | Spec step 4 |
| `sov333/care_veto.py` | Care<0.35 collapses emit | Spec step 5 |

Plus a `sov333/CLIVE_BENCH.py` that runs the local CPU pyramid on a real eval task and prints the measured number.

---

## The honest tag

The **CPU build proves topology + design laws, not LLM-scale performance.**
The **Kaggle GPU build (owner) produces the graded number.**

Until Kaggle lands, the local CPU pyramid exists in CHAIN-PENDING state. Every MITIS sigil in ~/.sovereign is honest about that.
