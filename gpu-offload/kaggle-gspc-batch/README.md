# kaggle-gspc-batch: Measure-named GSPC batches on Kaggle's free 2x T4

Workflow: `.github/workflows/kaggle-gspc-batch.yml` (manual, plus a one-time schedule for G3-Kaggle on 2026-10-17).

| file | what it is |
|---|---|
| `batches/<id>.tsv` / `.md` | the batch exactly as Measure named it (tags + full manifest sha256) |
| `dedup_guard.py` | fails closed if a batch contains a model with a run of record (G2 group, B1014 newmodels) or a moving alias |
| `runner.py` | runs inside the kernel: pull, re-check digest (moved = SKIPPED), frozen generator configs, serial worker, Measure's G2 gate |
| `build_kernel.py` | builds a single-file private kernel with the kit embedded (sha256-pinned); checks 2x T4 and ollama 0.35.0 |
| `code/` | frozen worker `ea59a9de…` and playlist generator `b8268c90…` (byte-identical to the G2 kit) |
| `banks/` | the 7 frozen G2 banks (`SHA256SUMS`); the same items are public at `csoai/gspc-*` on Hugging Face |

Rules: compute only. Nothing here signs, writes a board or stamps MEASURED. Gate-passing runs
(`CARD_CANDIDATE_UNSIGNED`) are copied to the private intake `csoai/runpod-gspc-intake` with the
existing `scripts/runpod_gspc_push_to_hf.py`; `runpod-intake.yml` and Measure decide admission.
G3 is its own comparison group (2x T4), never paired or tied with G2 (RTX PRO 4500).
Hosted-API (Kaggle Benchmarks) results are not eligible for cards under this method.

Shards: the batch is split in three (a/b/c, about 3.5–4 GPU-hours each) so each fits one Kaggle
session and one Actions job. A shard still running after 320 min is harvested later with `mode=harvest`.
