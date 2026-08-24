---
title: GSPC Governance Leaderboard
emoji: ⚖️
colorFrom: emerald
colorTo: green
sdk: gradio
sdk_version: 6.15.1
app_file: app.py
python_version: "3.12"
short_description: Signed GSPC board — 13 measured of 14. PR submissions welcome.
pinned: false
license: mit
---

# GSPC Governance Leaderboard

First-of-niche **governance measurement** leaderboard on Hugging Face — post–Open LLM Leaderboard vacuum (retired Jun 2025).

## What this is

- **Measurement, not certification.** Scores trace to frozen item banks on `csoai/gspc-*` datasets.
- **13 measured of 14** GSPC registry axes. Live board: `GET https://councilof.ai/api/gspc`
- **PR submissions** update `csoai/gspc-leaderboard-results` (see `scripts/hf-submit-result.mjs` in the main repo).

## What this is not

- Not a general-purpose LLM chat leaderboard.
- Not an operator-ranked Elo page. Separation is McNemar/Wilson on published harnesses only.
- Not a compliance badge.

## DOI

Concept DOI for the measurement programme: [10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104)  
Per-dataset DOIs: assign via Hugging Face Hub → Settings → Dataset card → Digital Object Identifier (DataCite).

## Submit a result

```bash
# From councilof-ai repo after cloning a result JSON:
node scripts/hf-submit-result.mjs results/my-model-gspc.json
```

Requires `HF_TOKEN` with write access to `csoai/gspc-leaderboard-results`.
