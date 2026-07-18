# Bleeding-Edge Technique Map — what the labs are shipping, what we can EAT (2026-07-18)

Built from the literature ledger (curated, verify-tagged rows). Purpose: know what every frontier lab
is actually doing so adoption is a MEASURED choice, not a guess. Verify tags honest: VERIFIED (id seen in
this session's search results) / LEAD-RECALL (confident id from memory, verify-before-cite) / TECHNIQUE-LEAD.

## THE big convergence signal (the thing to adopt)
**Every frontier lab is shipping the same family: linear / hybrid / sparse attention for long-context efficiency.**
- Moonshot — **KDA** (Kimi Linear, 2510.26692 VERIFIED): gated-delta linear + 3:1 full-attn hybrid.
- Qwen — **Gated DeltaNet** (Qwen3-Next): linear-attn hybrid, slottable at fine-tune.
- DeepSeek — **DSA** (Sparse Attention) + **MLA** (V3): KV-cache reduction.
- Ling — **Lightning Attention** (1T hybrid): recurrent linear-attn.
- Analysis — "The Sparse Frontier": the tradeoff map for all of the above.

**What this means for us:** the field agrees KV-cache/long-context cost is THE bottleneck, and the answer is
hybrid linear attention. This is a technique to ADOPT when we operate at a scale where it pays — NOT a number to
claim. Our own KDA test came back NEGATIVE at 0.5B toy scale (scale-gated), so the honest rule: adopt the hybrid
family only at long-context / multi-trillion-token regime, route around it below that.

## What each lab is doing (curated)
| Lab | Shipping | Our honest read |
|---|---|---|
| **Qwen/Alibaba** | Qwen3 MoE + Gated DeltaNet; our actual base (Qwen2.5-0.5B) | Base we build on. Adopt Gated DeltaNet as a LEG candidate, measure decorrelation. |
| **Moonshot** | K3 (2.8T) + Kimi Linear/KDA | Federation brain (online) + distill teacher (July 27) + KDA leg candidate. |
| **DeepSeek** | V3 MLA + DSA sparse attention | MLA/DSA = KV-cache techniques; adopt-at-scale. Distill teacher when funded. |
| **Anthropic** | Constitutional AI + RLHF/HH | FOUNDATIONAL to our governance layer — CAI self-critique-by-principles IS our charter-gate pattern. |
| **Meta** | Llama 4 Herd (MoE) | Western-ecosystem base; MoE deployment reference. |
| **Google DeepMind** | Gemma 3 | Edge/on-device efficiency reference. |
| **Ling** | Lightning Attention 1T hybrid | Comparison point for the attention-leg test. |

## The honest EAT strategy (what we actually do with this)
1. **Adopt the convergent technique as a LEG candidate, gated by decorrelation.** The KDA-decorrelation probe is
   the template: any new attention family (KDA / Gated DeltaNet / Lightning) only earns a seat in the 3-around-1
   if it MEASURABLY decorrelates (rho low). Redundant legs make the ensemble worse.
2. **Distill from open frontier, don't out-param it.** K3 (2.8T) + DeepSeek + Qwen as distillation TEACHERS into
   our owned model = the proven +gain lever (volume was the lever, +0.0975). This is how we "EAT" their capability
   legally into weights we own — NOT by claiming a bigger param count.
3. **Our moat is the layer NONE of them ship: governance + attestation + sovereignty.** Anthropic ships CAI but
   can't independently attest itself; the efficiency labs ship speed but list "hard to trust results" as an open
   pain point (PilotOS #6). We make the outputs TRUSTWORTHY. That's the axis left open.

## Honest boundaries (held)
- Convergence ≠ our capability. Knowing what they ship doesn't give us their weights or scale.
- Attention-efficiency numbers are THEIRS at THEIR scale; ours came back negative at toy scale.
- "EAT" = adopt-by-distillation + adopt-technique-by-measured-decorrelation, NOT param-summing or emergence.
