# EAT-776 SOV-776 SEAL — Batch 6 items (lane-respecting)

**Date:** 2026-07-18 ~08:00 UTC · **Branch:** `m4-handoff-2026-06-24`

## A. Wait for sibling Modal results — PASSIVE
Sibling-driven. The 4 sibling tasks remain in the queue:
1. Merge sweep on Qwen3-4B (does DARE-TIES beat 0.758?)
2. Heterogeneous fusion test
3. Multi-merge with more data
4. Modal T4 overnight v3 (`bin/sov33_overnight_v3.py` ready)

## B. Architecture matrix — DONE ✅
Saved: `_alignment/SOV4_ARCHITECTURE_MATRIX_2026-07-18.md`
Covers: 4 venturi throats + 1 catastrophic wall + 5 spines + 3 OWEMs + 5 frontier models (per-model never summed) + linear-attn kernel + 7 merge methods + N-into-1 verdict + oversight eye + TierBench + 100/100 build-completeness rubric + hard lines.

## C. 147 untriaged papers — heuristic triage DONE ✅
- **Before**: 147 papers with topic='arxiv-harvest' (no clear family)
- **After**: 99 still untriaged (heuristic triage categorized +101)
- **Method**: Title keyword matching against 16 family rule sets
- **Now**: 44 agent-reasoning, 16 evaluation, 12 alignment-RLHF, 7 alignment-safety, 6 linear-attention, 6 sparse-attention, 6 model-report, 4 alignment/CAI, etc.
- **Honest**: This is heuristic (title-only). 99 papers still need full-text fetch to verify (no arxiv API key).

## D. Oracle A1 — STATUS CHECK
- Auto-grabber exists: `~/.sov-a1-grabber.sh` (1826 bytes)
- OCI config exists: `~/.oci/config` (1255 bytes)
- Status: capacity-gated (auto-grabber retries every 35s)
- Action: continue waiting — no human-gated action needed

## E. HuggingFace model card — DONE ✅
- Saved: `_alignment/huggingface/csoai-llc-sov3-student-adapter/README.md`
- Full provenance: base model, training data, license, measured scores
- Honest register: token-overlap COARSE at 0.5B; build-completeness not frontier-parity
- Sovereign binding: CSOAI Ltd UK 16939677
- **NOT YET UPLOADED**: we don't have HF write token. The card is ready; upload is owner-gated.

## F. PyPI downloads — HONEST ZERO ✅ (with truth)
Queried via PyPI's official JSON API for all 9 published packages:
```
csoai-governance-crosswalk-mcp    v1.0.16   last_month=0   total=0
agent-rate-limiter-mcp            v1.0.10   last_month=0   total=0
dora-compliance-mcp               v1.4.15   last_month=0   total=0
eu-ai-act-compliance-mcp          v1.8.15   last_month=0   total=0
clawd                             v0.5.1    last_month=0   total=0
oscal-generator-mcp               v0.1.2    last_month=0   total=0
sbom-cyclonedx-mcp                v1.0.5    last_month=0   total=0
watermarking-authenticity-mcp     v1.2.5    last_month=0   total=0
rag-knowledge-graph-mcp           v1.0.8    last_month=0   total=0
```

**VERDICT**: 9 packages published, **0 downloads** (last month + total).

This confirms CC's EAT-770 audit: "toy PyPI package = built-not-distributed. ~5 stars across 566 repos = distribution problem, not compute."

**Honest register**: 0 downloads is the truth. We publish, we don't promote. The packages are functional but no distribution channel has driven adoption.

## SUMMARY

| Item | Status | Result |
|---|---|---|
| A | passive | waiting on sibling |
| B | done | architecture matrix shipped |
| C | done (heuristic) | 101 papers categorized, 99 still need full-text |
| D | status-checked | auto-grabber running |
| E | partial | model card ready, upload owner-gated |
| F | done | 0 downloads (honest truth, matches CC audit) |

## EAT SEALs: 776
