---
license: cc-by-4.0
pretty_name: Cross-hardware reproducibility of LLM evaluation results (item level)
language:
- en
tags:
- evaluation
- reproducibility
- nondeterminism
- llm
- gpu
- inference
- ollama
- measurement
- council-of-ai
task_categories:
- text-generation
- text-classification
size_categories:
- 1K<n<10K
configs:
- config_name: items
  default: true
  data_files:
  - split: train
    path: data/items.jsonl
- config_name: cards
  data_files:
  - split: train
    path: data/cards.jsonl
- config_name: runtimes
  data_files:
  - split: train
    path: data/runtimes.jsonl
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Cross-hardware reproducibility of LLM evaluation results (item level)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Same model, same prompts, same decode settings, different machine: does each item get the same
answer? This dataset holds the item-level evidence behind the preprint *"Same model, same prompts,
different answers: item-level cross-hardware reproducibility of LLM evaluation results"*
(Nicholas Templeman, CSOAI Ltd (Council of AI), 2026). The PDF is in this repository:
[`paper/paper.pdf`](paper/paper.pdf); its LaTeX source, with the analysis scripts, is
[`paper/paper-source.tar.gz`](paper/paper-source.tar.gz).

**154 evaluation results ("cards") · 11 open-weight models · 14 axes · 9,757 items · 3 runs per item**
(RunPod RTX 3090 primary run; Kaggle Tesla T4 reproduction; the same T4 job repeated in the same
session). Each item carries the raw output of every run, its SHA-256, parsed label, grade, status
(correct / wrong / excluded) and stop reason, plus the agreement flags used in the paper.

Headline numbers. Each is read from [`paper/numbers.json`](paper/numbers.json), which the paper's
script regenerates from `data/items.jsonl` (see "How to verify"):

| | |
|---|---|
| raw output byte-identical, RTX 3090 vs T4 | 8,231 / 9,757 items (84.4%) |
| grade equal | 9,497 / 9,757 items (97.3%) |
| grade flips | 260 (2.66%, 95% CI 2.36–3.00%): 122 wrong→right on T4, 138 right→wrong |
| status swaps (same grade; parse error on one runtime, wrong label on the other) | 83 items on 31 cards |
| cards with equal totals (correct, graded, parse errors) | 62 / 154 |
| … of which an item's grade differs (flips cancel in the total) | 11 |
| cards with the same grade on every item | 54 / 154 |
| admitted under the item-level rule (equal totals **and** equal grade on every item) | 51 / 154 |
| T4 repeat not byte-identical to T4 run 1 | 20 / 150 cards (4 models); 13 cards changed totals |

This is **a measurement of whether a result survives a change of runtime**. It is not a grade or a
certification of any model, GPU vendor or cloud provider, and it does not say which runtime is
"right". None of the models is a CSOAI model.

## What this does not show

- **Not a ranking or a score of any model, company, GPU vendor or cloud provider.** Flips run in
  both directions in near-equal numbers (two-sided sign test p = 0.35); neither
  runtime is "better".
- **Not a cause below "the runtime".** GPU architecture, GPU count and layer split, driver,
  flash-attention setting and possibly the server build all differ between the two runtimes, and
  several primary-side values are `UNRECORDED`. No component is identified as the cause.
- **Not a statement about other serving engines** (vLLM, SGLang, TensorRT-LLM), larger or
  unquantized models, long reasoning outputs, or batched serving. One engine was tested: Ollama
  with its llama.cpp backend, single-request, 4-bit quantized models of 0.5–12B parameters.
- **Not a measurement of the primary runtime's own stability.** The RTX 3090 side has no repeat run.
- **Not a third runtime.** A Tesla P100 reproduction of the item-level-admitted cards was queued
  while the analysis was prepared; it has not been admitted or signed, and no result from it is in
  this dataset.
- **Not an independent reproduction.** All runs, graders and the admission rule are the
  publisher's. The per-item data and signed roots let anyone re-check the comparison, but a
  reproduction by a different operator would be stronger evidence.
- **Not grader-independent above the raw-output level.** Grade and status depend on the
  instruments' graders; raw-output agreement does not.

## Contents

| path | what |
|---|---|
| `data/items.jsonl` | one row per (card, item). Columns prefixed `rtx3090_`, `t4_run1_`, `t4_run2_` (run2 is null for 4 `gemma3:12b` cards the budget guard skipped). `xhw_*` compare 3090 vs T4 run 1; `repeat_*` compare T4 run 2 vs run 1. `expected` is the bank's reference answer. |
| `data/cards.jsonl` | one row per card: counts on each run, agreement counts, flip/swap item ids, admission outcome under the counts-only and item-level rules |
| `data/runtimes.jsonl` | one row per run: declared runtime. Fields not recorded at run time are the string `UNRECORDED`, never inferred |
| `data/withheld.jsonl` | raw outputs withheld from this public copy (hash kept), with the reason; empty if none |
| `declarations/*.json` | the runtime declarations (`csoai.mill-runtime-declaration/0.1`), byte-identical to the files the signed capsules bind |
| `capsules/batch1`, `capsules/batch2` | signed capsule batches: `record.json`, `record.signed.json`, `capsules.jsonl.gz`, OpenTimestamps proof |
| `paper/paper.pdf` | the preprint |
| `paper/paper-source.tar.gz` | LaTeX source (with `paper.bbl`), tables, figures and the three analysis scripts |
| `paper/numbers.json` | every number in the paper, as generated by `make_figures.py` |
| `code/figures/` | the analysis scripts: `xhw.py`, `make_figures.py`, `from_dataset.py` |
| `verify.py` | offline verifier (below) |
| `manifest.jsonl` | path, bytes and SHA-256 of every other file |

Prompts are not copied. Each item is identified by `item_id` and `prompt_sha256` within a bank pinned
by `bank_sha256`; the banks are public on this Hub under `csoai/gspc-<axis>`.

## Setup in one paragraph

Models are served by Ollama and pinned by registry manifest digest (checked in-run on both sides;
a mismatch halts). Decode: temperature 0, seed 0, `max_tokens` 128 (1,024 for `swarm`), no
streaming, thinking off. Instruments (prompt adapter, label set, graders, decode, digest) are pinned
by `instrument_sha256`, recomputed on both runtimes from harness commit `fd80a903`. Primary: RunPod
RTX 3090, 23–24 Sep 2026; GPU driver, Ollama server version at run time, flash-attention setting and
GPU count are **UNRECORDED**. Reproduction: Kaggle 2×Tesla T4, 26 Sep 2026, driver 580.159.04, CUDA
driver API 13.0, Ollama 0.33.0, Kaggle image pinned by digest, flash attention auto (enabled).
Quantization per model (read from the T4 serve log): Q4_0 for `mistral-nemo:12b` and `phi3.5:3.8b`,
Q4_K_M for the rest.

## Signed roots

| batch | capsules | RFC 6962 Merkle root | record.json SHA-256 |
|---|---|---|---|
| 1 (`mistral-nemo:12b`) | 14 | `5ae00c1f4c2ed290fb91206f29372d0df3e61478c568d4797855502e751ebff6` | `32ece857c94062f41a03aad9e269532cdbe5dc0a576ed20110edc4ecacb0468d` |
| 2 (ten models) | 140 | `78226433e9e433b311e067ee56fcbaf415f6dc57301254f3bb4922a0b8053cf6` | `422fa6377b274bab095e8e875f67d087a275417c14c90a4c4e4cedb56ca9a5ff` |

Each record is signed with Ed25519 under `did:web:csoai.org#board-attestation-1` (public key in
https://csoai.org/.well-known/did.json). The signature is over the canonical JSON (sorted keys, no
whitespace) of `record.signed.json` → `payload`.

Timestamps: each `record.json.ots` is an OpenTimestamps proof over its `record.json`.
`capsules/batch1/record.json.ots` is Bitcoin-attested (confirmed in Bitcoin block 968671).
`capsules/batch2/record.json.ots` is Bitcoin-attested (confirmed in Bitcoin block 968673).
Each `record.json.ots` also carries calendar attestations that are still pending, which do not affect the Bitcoin one.
Check with `ots verify capsules/batch1/record.json.ots` (and the same for batch 2).

## How to verify

```bash
pip install cryptography
python3 verify.py            # or fully offline: python3 verify.py --pubkey-x k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA
```

The signature check on its own, in a few lines of Python (did.json refuses the default Python
User-Agent, so the snippet names one):

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
for b in ("capsules/batch1", "capsules/batch2"):
    s = json.load(open(f"{b}/record.signed.json"))
    c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
    assert hashlib.sha256(open(f"{b}/record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
    req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "cross-hardware-reproducibility-verify/1.0 (+https://councilof.ai/research/cross-hardware-reproducibility/)"})
    did = json.load(urllib.request.urlopen(req, timeout=30))
    x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
    ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
    print("VERIFIES", b)
```

`verify.py` checks: record hashes against the signed payload; capsule file hashes; that every capsule is
canonical and its id is the SHA-256 of its body; the RFC 6962 root over the sorted ids; every
declaration's hash against the record; the Ed25519 signature; that each declaration's per-item
results hash to the value its capsule binds and agree with `data/items.jsonl`; that recounting
`data/items.jsonl` reproduces both runtimes' declared counts on every card; and that every file in
`manifest.jsonl` is present with the listed size and SHA-256. It prints `ALL CHECKS PASS` and exits 0
only if every check passes.

To regenerate every number and table in the paper from this dataset alone (needs `matplotlib`):

```bash
python3 code/figures/from_dataset.py --dataset . --work /tmp/xhw
python3 code/figures/make_figures.py --decl /tmp/xhw/decl-nemo --decl /tmp/xhw/decl-batch2 --items /tmp/xhw/items
cmp code/build/numbers.json paper/numbers.json && echo "numbers identical"
```

`make_figures.py` rebuilds every card from the per-item records and aborts on any disagreement
with the signed declarations. When we ran this on the package as published, `numbers.json` and
all seven tables came out byte-identical to the released copies.

## Licence, contact and objections

Data and paper: **CC-BY-4.0**. Model outputs are included as research evidence; each model remains
under its own licence.

Contact, corrections and objections, including a request to withhold a specific output:
https://councilof.ai/census/ (the "Object or opt out" route) or **nicholas@csoai.org**. A correction
is published as a new, linked version; signed files are never edited in place.

## Citation

```bibtex
@misc{templeman2026crosshardware,
  title  = {Same model, same prompts, different answers: item-level cross-hardware reproducibility of LLM evaluation results},
  author = {Templeman, Nicholas},
  year   = {2026},
  note   = {CSOAI Ltd (Council of AI). Preprint and data: https://huggingface.co/datasets/csoai/cross-hardware-reproducibility}
}
```

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Cross-hardware reproducibility of LLM evaluation results (item level)*. 2026. Hugging Face dataset `csoai/cross-hardware-reproducibility`. https://huggingface.co/datasets/csoai/cross-hardware-reproducibility

```bibtex
@misc{csoai_cross_hardware_reproducibility,
  title        = {Cross-hardware reproducibility of LLM evaluation results (item level)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/cross-hardware-reproducibility},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
