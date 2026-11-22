---
license: cc-by-4.0
pretty_name: Held-out governance counter-bank v1 (GSPC)
tags: [gspc, measurement, council-of-ai, eu-ai-act, held-out, counter-bank]
size_categories:
- n<1K
language:
- en
---

# Held-out governance counter-bank v1 — METHOD

**Date:** 2026-11-02 · **n=60** (50 de-contaminated paraphrases + 10 handcrafted near-miss pairs) · balance: 16 HIGH_RISK / 15 LIMITED_RISK / 17 MINIMAL_RISK / 12 PROHIBITED · majority baseline 28.3%

## Why
The estate's best number — `meok-canonical-v1` at 100% on `csoai/gspc-gov` (n=150) — is partly definitional: the arbiter's rules encode 125 phrases that appear verbatim in the bank (reconciliation audit: 96/237 verbatim matches). A held-out counter-bank converts that number into an honest generalization claim.

## Method
1. **Source:** `csoai/gspc-gov` train split (public, CC-BY-4.0), n=237.
2. **De-contamination:** exclude every item matching any of the 125 `txt.includes(...)` arbiter patterns from `meok-ensemble.mjs`.
3. **Conservative paraphrase:** lexical equivalences on tier-neutral tokens only (`company→firm`, `deploys→puts into operation`, `app→tool`, …). Never touched: protected statutory keywords (workplace, education, credit, biometric, emotion, scraping, social scoring, elections, justice, migration, infrastructure, …), negations, scope words (`only/unless/solely`), numbers. Items whose paraphrase equals the source are skipped (only true paraphrases enter).
4. **Near-miss pairs (handcrafted, labels justified inline in the JSONL `source` field):** surface-similar items whose labels follow from the statutory cascade — e.g. workplace emotion recognition (Art.5 → PROHIBITED) vs a disclosed consumer mood mirror (Art.50 → LIMITED_RISK); live public biometric ID (Art.5 → PROHIBITED) vs post-event judicially-authorised face search (Annex III → HIGH_RISK); CV auto-rejection (Annex III → HIGH_RISK) vs personal newsletter ranking (MINIMAL_RISK).

## Results (2026-11-02, signed records 07-51 / 07-52 / 07-54 UTC)
| Model | Original bank | **Counter-bank (held-out)** | Interpretation |
|---|---|---|---|
| `meok-canonical-v1` (statutory arbiter) | 100% (n=150) | **85.0%** | verbatim-phrase dependence quantified: −15pp; still strong, and still an arbiter, never a model |
| `meok-gspc-qwen3-1.7b` overlay+structured | 56.0% (n=100) | **50.0%** | **the recipe generalizes** (+21.7pp over held-out baseline, −6pp transfer cost) |
| `qwen3:1.7b` raw structured | 32.0% | **33.3%** | baseline-consistent (±1pp) |

## Limitations (stated, per doctrine)
- The paraphraser is rule-based and conservative; it does not test deep re-wording.
- Handcrafted labels were assigned by the author against the statutory cascade, not independently adjudicated.
- One paraphrase family; a v2 should add multiple independent families (LLM-rewritten with human label audit) before any external claim.
- The counter-bank measures generalization of THIS recipe to THIS distribution shift. It is measurement, not certification.

## Reproduce
`python3 -I build_counter_bank.py` regenerates the bank deterministically from the public source bank + the arbiter source. Measure with `MEOK_ITEMS_FILE=counter-bank-v1.jsonl node meok-measure.mjs` (+ `MEOK_STRUCTURED=1`).

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Citation

```bibtex
@misc{csoai_gspc_gov_counter_v1_2026,
  title        = {Held-out governance counter-bank v1 (GSPC)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-gov-counter-v1}},
  url          = {https://huggingface.co/datasets/csoai/gspc-gov-counter-v1}
}
```

<!-- csoai-card-fixes:end -->
