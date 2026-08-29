# HF org `csoai` dataset index (NEXT_300 #251)

Observed Hub (2026-08-29), admin: Nicholastempleman. Product surface on councilof.ai for labour/economy indices remains **UNMEASURED** (`GET /api/indices`). Never invent MEASURED labour scores. See `docs/HF_LABOUR_INDEX_HONESTY.md`.

## Live honesty / gap surfaces

| Dataset | Role |
|---------|------|
| `csoai/gspc-boards` | MEASURED board dumps |
| `csoai/gspc-ai-economy-index` | UNMEASURED empty-slot card (README only) |
| `csoai/gspc-human-labour-index` | UNMEASURED empty-slot card (README only) |
| `csoai/gspc-humanoid-labour-index` | UNMEASURED empty-slot card (README only) |
| `csoai/gspc-gap-index` | Weekly UNSIGNED gap tape (`current.json`) |
| `csoai/rwa-attest` | RWA REPORTED/attest corpus (+ experimental index JSON — not product MEASURED) |
| `csoai/rwa-onchain-measurement` | On-chain RWA measurement notes |
| `csoai/measured-vs-reported` | Register honesty |
| others (`gspc-*`, `signed-fleet-*`, `living-catalog`) | axis/corpus/fleet/catalog |

## Dedicated UNMEASURED packs (NEXT_300 #139 / #186 / #253) ✅ live

Uploaded 2026-08-29 via `npm run hf:upload-staged` (token). Verified with `hf_fs stat` — both repos **exist**. All `measured_score` null.

| Pack (repo root) | Hub repo | NEXT_300 | Contents |
|------------------|----------|----------|----------|
| `datasets/labour-economy-unmeasured/` | [`csoai/labour-economy-unmeasured`](https://huggingface.co/datasets/csoai/labour-economy-unmeasured) | #139, #253 | `README.md`, `labour-economy-unmeasured.json` |
| `datasets/rwa-testnet-unmeasured/` | [`csoai/rwa-testnet-unmeasured`](https://huggingface.co/datasets/csoai/rwa-testnet-unmeasured) | #186 | `README.md`, `catalog.json` (TESTNET) |

Local re-verify: `npm run verify:staged-hf`. Re-upload / CI: `docs/HF_UPLOAD_RUNBOOK.md` · `.github/workflows/hf-upload-staged.yml`.

Per-slot UNMEASURED README cards (`gspc-*-labour-index`, `gspc-ai-economy-index`) remain complementary empty-slot cards — not substitutes for these unified manifests.
