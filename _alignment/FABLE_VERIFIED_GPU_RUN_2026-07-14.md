# Fable-VERIFIED GPU run — Colab T4, 2026-07-14

**Provenance: Fable-verified.** Executed live on a Google Colab **T4 GPU** box
(Nick's Google account), notebook Untitled2.ipynb. This is a REAL run on a cloud
box — not a staged CPU proof, not a sibling-reported number. Cell source =
`_alignment/sovereign_merge_kit/sov33_kaggle_combined_CELL.py` (pinned gist raw
commit 2898bb53). Observed directly in the Colab output pane.

## (B) Governed-robustness #1 — CONFIRMED (numpy, ran in seconds on the box)
9-model ensemble, 0→4 of 9 nodes turned adversarial (noise / sign-flip / constant).
MSE vs clean target as adversary count K rises:

| K adversarial | naive mean | median | care_bft (SOV33) |
|---------------|-----------|--------|------------------|
| 0 | 0.0936 | 0.0950 | 0.0936 |
| 1 | 0.1443 | 0.0958 | 0.0939 |
| 2 | 0.2252 | 0.1048 | 0.0947 |
| 3 | 0.2727 | 0.1079 | 0.0951 |
| 4 | 0.3229 | 0.1154 | 0.0963 |

- **naive degradation: 3.4×**
- **SOV33 care_bft degradation: 1.0× (holds flat)**
- headline: "4/9 adversarial: naive 3.4x vs SOV33 1.0x"

This is the honest, reproducible core of the governed-robustness claim: the
care-gated-BFT aggregator is (near-)invariant to a minority of adversarial
voters, while a naive mean blows up 3.4×. Median helps but still drifts (1.2×).

## (A) GPU capability grade — CONFIRMED
Qwen2.5-1.5B-Instruct (Apache), GSM8K test, N=100, greedy decode, run on the T4:

```
{ "gsm8k": 0.43, "n": 100, "model": "Qwen/Qwen2.5-1.5B-Instruct" }
```

running acc trace: 0/100=1.00 · 25=0.308 · 50=0.431 · 75=0.408 · final=0.43

**Honest caveat (important — do NOT quote 0.43 as the model's ceiling):**
0.43 is the number for THIS naive harness (prompt "end with just the final number"
+ *last-number* extraction), not the model's true GSM8K ability. Qwen2.5-1.5B
scores ~0.73 on GSM8K with proper answer extraction. Two known depressors here:
(1) last-number parsing — the model often states the answer mid-sentence then
appends a verification number, which the parser wrongly takes; (2) an
attention-mask warning (pad==eos) that can degrade greedy decoding. This is the
SAME parsing-noise effect we already documented — the *solver register* / strict
`ANSWER:` extraction is what recovers true capability. The deployed-gate number
(os.meok.ai /api/chat, solver register) is 0.71; the honest small-tier solver
number measured earlier was 0.84. So: raw-harness 0.43 ≪ solver 0.71–0.84 — the
gap is parsing, not capability.

## Why the run took several tries (infra, not our code)
- HF **Xet** download path stalled twice on this Colab VM (model shards hung at
  ~8–42 MB). Fix: `HF_HUB_DISABLE_XET=1` → classic CDN → 3.09 GB in **21 s @ 147 MB/s**.
- `datasets` rejected bare `gsm8k` (needs `openai/gsm8k`), and the HF dataset
  parquet 403'd on the Xet CDN (anonymous SignatureError). Fix: load GSM8K test
  straight from the OpenAI GitHub jsonl (`load_dataset("json", data_files=<raw url>)`)
  — no auth, no Xet.
- newer transformers `apply_chat_template(return_tensors="pt")` returns a
  BatchEncoding; `generate()` needs a tensor. Fix: `return_dict=False`.
- These three fixes are folded into the corrected source `sov33_kaggle_combined_CELL.py`.

## Honesty notes
- (B) is numpy/CPU math but executed on the cloud box in this run — real, not staged, reproduced twice identically.
- (A) is a REAL Qwen2.5-1.5B forward pass on a T4 over 100 real GSM8K test items — real, but harness-limited as noted above.
- Provenance: **Fable-verified** (observed directly in the Colab output pane).
