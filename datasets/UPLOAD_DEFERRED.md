# Upload complete — NEXT_300 #139 / #186 / #253

**Status:** ✅ Hub live (2026-08-29). Local packs remain the source of truth for re-verify / re-upload.

| Check | Result |
|-------|--------|
| `npm run verify:staged-hf` | ✅ (measured_score null · dataset-card YAML) |
| `hf_fs stat hf://datasets/csoai/labour-economy-unmeasured` | ✅ exists |
| `hf_fs stat hf://datasets/csoai/rwa-testnet-unmeasured` | ✅ exists |
| Upload | ✅ `npm run hf:upload-staged` (token) |

Hub:

- https://huggingface.co/datasets/csoai/labour-economy-unmeasured
- https://huggingface.co/datasets/csoai/rwa-testnet-unmeasured

Never invent MEASURED labour scores. Index: `docs/HF_ORG_DATASET_INDEX.md`. Runbook: `docs/HF_UPLOAD_RUNBOOK.md`.

Owner tracker [#887](https://github.com/CSOAI-ORG/councilof-ai/issues/887) — **closed** after Hub live + tip ticks.
