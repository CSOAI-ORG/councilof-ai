# GSPC top-100 — Section A (prepared to the launch line, NOT launched)

**Status: DISCOVERED.** No model has been run. No axis measured. Nothing here is
MEASURED until a card signs green through GHA (`#board-attestation-1`) and verifies VALID.

## What is frozen
`frozen-top100.json` — 100 HF text-generation models, open-licence slice, by downloads.

**Exact filter** (reproducible): `HfApi.list_models(pipeline_tag="text-generation",
sort="downloads")`, then keep the first 100 whose HF `license:` tag is in
`{apache-2.0, mit, bsd*, cc-by-4.0, cc-by-sa-4.0, cc0-1.0, cc-by-3.0, mpl-2.0,
gpl-3.0, lgpl-3.0}`. 138 scanned to collect 100 hits. cc-by-nc* excluded
(non-commercial ≠ open); Llama/Gemma community licences excluded (not OSI-open).

- Licence histogram: **75 apache-2.0, 25 mit**.
- **66** vLLM-servable candidates; **34** flagged GGUF/quant/derivative repos that a
  plain vLLM HF load will reject (need a serving adapter). This materially changes cost.
- Downloads are a Hub snapshot at `as_of`, not a quality signal.

## Smoke test — the prove-one gate (`smoke_axis_job.py`)
One axis, one HF Job, vLLM offline batch: per-item rows → **deterministic** grade
(exact/regex gold, **no model-as-judge**) → one **unsigned** card-v0 atom per model
→ GHA sign → verify VALID. Report wall-clock + $ BEFORE fanning out to the other 21.

## Two gates that BLOCK launch (owner decisions)

1. **Spend authorization.** HF Jobs is *technically enabled* — the Jobs API answers,
   `hf jobs hardware` returns, user is Pro + `canPay`, org `csoai` plan=team + `canPay`.
   There is no missing payment method. But launching a Job spends real money on a
   payment method on file, which requires the **owner's own explicit go-ahead** — a
   task instruction is not that authorization. Nothing was launched.

2. **Frozen banks not in this checkout.** The canonical 22 frozen axis banks are the
   input to `agents-repo/agents/board_v2.py`, a repo not present here. This checkout
   has only axis descriptors (`content/axis/*.md`) and one bench pack
   (`public/packs/eu-article-50/provbench.json`). Mount the real frozen bank before
   any measurement counts.

## Cost — do not under-quote
`t4-small` = **$0.40/hr** ($0.0067/min). Model **load** dominates, not inference.
100 distinct repos loaded sequentially on one T4 (34 of which a plain vLLM load
rejects) is realistically a few dollars and may exceed one hour — **not $0.60**.
The $0.60 figure only holds for a small subset (e.g. the 10 smallest servable
models). Prove on a subset, measure the real wall-clock + $, then decide fan-out.

## Launch command (owner, after explicit spend approval)
```
hf jobs run --flavor t4-small --secrets HF_TOKEN -d ./harness/gspc-top100 \
  python:3.12 hf jobs uv run harness/gspc-top100/smoke_axis_job.py \
  --axis det --bank <FROZEN_AXIS_BANK> --limit-models 10
```
Start with `--limit-models 10` for the true ~$0.60 smoke; drop it only after the
subset proves per-item rows + deterministic grade + one atom that signs VALID via GHA.
