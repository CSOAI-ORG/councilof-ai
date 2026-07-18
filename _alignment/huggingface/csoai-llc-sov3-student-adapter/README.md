---
license: mit
language: en
tags:
- sovereign-ai
- compliance
- charter
- qwen2.5
- 0.5b
- peft
- lora
- CSOAI
base_model: Qwen/Qwen2.5-0.5B-Instruct
pipeline_tag: text-generation
---

# sov3-student-adapter (csoai-llc / CSOAI Ltd UK 16939677)

This is the **sov3-student-adapter** LoRA — a Charter-compliance fine-tune of Qwen2.5-0.5B-Instruct.
Trained by the Sovereign Substrate Operator (CSOAI Ltd UK 16939677) as part of the SOV4 General-Capabilities E2E program (EAT-760+).

## Spec

- **Base model**: Qwen/Qwen2.5-0.5B-Instruct (Apache 2.0)
- **Adapter type**: LoRA, r=16, alpha=32, dropout=0.05
- **Target modules**: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
- **Training data**: 113 pairs (Charter + governance Q&A) — see `_alignment/sovereign_merge_kit/distill_charter_qa.jsonl`
- **License**: MIT

## Measured results

| Benchmark | Score | Source |
|---|---|---|
| TierBench (40-prompt governance) | **mean=0.148** (rank #3 of 3 OWEMs) | EAT-773 |
| Eval24 (24-prompt governance) | **20/24 = 83.3%** | EAT-763 |
| Skippable (tau=0.30) | 7.5% | EAT-773 |

## Honesty register

- Token-overlap is **COARSE** at 0.5B scale.
- All 3 OWEMs are toy-scale; CHARTER (rank #1) was selected as default.
- This adapter is **NOT** frontier-parity. It's a **build-completeness** artifact for the SOV4 substrate.
- TIES-merge with CHARTER (rank #1) → 3.99x compression (EAT-774, INFERENCE COMPRESSION not emergence).

## Sovereign binding

- **Operator**: CSOAI Ltd UK 16939677 (UK-registered, Ed25519 wallet)
- **Substrate**: Sovereign Substrate Operator (Tier A immutable articles)
- **Hard lines**: No face-rec / AUKUS-without-letter / defonos / T-count-aggregate

## Provenance

Every model output is intended to be passed through `proofof-site/api/sov4/care-floor` and `proofof-site/api/sov4/owem-ask` for SIGIL-attested compliance verification.

## Inference

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
m = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
p = PeftModel.from_pretrained(m, "csoai-llc/sov3-student-adapter")
```

## Citation

```
@software{csoai_sov3_student_adapter_2026,
  author = {CSOAI Ltd UK 16939677},
  title = {sov3-student-adapter: Charter-compliance LoRA for Qwen2.5-0.5B-Instruct},
  year = {2026},
  url = {https://github.com/CSOAI-ORG/sovereign-substrate}
}
```
