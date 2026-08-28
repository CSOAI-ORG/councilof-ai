# HF org `csoai` dataset index (NEXT_300 #251)

Observed Hub (2026-08-28), admin: Nicholastempleman. Product surface on councilof.ai for labour/economy indices remains **UNMEASURED** (`GET /api/indices`). Never invent MEASURED labour scores. See `docs/HF_LABOUR_INDEX_HONESTY.md`.

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

## Staged dedicated packs (upload 🔄 — needs `HF_TOKEN`)

Pre-upload: `npm run verify:staged-hf` · runbook: `docs/HF_UPLOAD_RUNBOOK.md`

| Staged pack | Target repo | NEXT_300 |
|-------------|-------------|----------|
| `datasets/labour-economy-unmeasured/` | `csoai/labour-economy-unmeasured` | #139, #253 |
| `datasets/rwa-testnet-unmeasured/` | `csoai/rwa-testnet-unmeasured` | #186 |

Hub `stat` (2026-08-28): both target repos **missing**. Per-slot UNMEASURED README cards above are **not** a substitute for the unified staged manifests — upload when write token works (`npm run hf:upload-staged`).

See also `datasets/UPLOAD_DEFERRED.md` (overnight batch status).
