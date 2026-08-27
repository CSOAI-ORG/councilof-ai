# HF upload runbook (NEXT_300 #139, #186, #253)

Staged local packs — **UNMEASURED only**. Never upload invented MEASURED labour scores.

## Prerequisites

```bash
hf auth login   # write token with contribute-repos
hf auth whoami  # must show csoai org admin
```

MCP OAuth (`hf_whoami`) may read Hub but **CLI write** still needs `hf auth login` or `HF_TOKEN`.

## Pre-upload verify (no token required)

```bash
npm run verify:staged-hf   # assert measured_score null in staged JSON
```

Hub repos are **missing** until upload succeeds (`hf_fs stat hf://datasets/csoai/labour-economy-unmeasured` → not found).

## #139 — `csoai/labour-economy-unmeasured`

```bash
hf repos create csoai/labour-economy-unmeasured --type dataset --exist-ok
hf upload csoai/labour-economy-unmeasured datasets/labour-economy-unmeasured \
  --repo-type dataset \
  --commit-message "UNMEASURED labour/economy manifest — measured_score null"
```

Files: `README.md` (dataset card), `labour-economy-unmeasured.json`.

## #186 — `csoai/rwa-testnet-unmeasured`

```bash
hf repos create csoai/rwa-testnet-unmeasured --type dataset --exist-ok
hf upload csoai/rwa-testnet-unmeasured datasets/rwa-testnet-unmeasured \
  --repo-type dataset \
  --commit-message "TESTNET UNMEASURED RWA catalog — no fake MEASURED scores"
```

Label in README: **TESTNET** · `measured_score: null`.

## Post-upload honesty

- Update `docs/HF_ORG_DATASET_INDEX.md` with repo URLs.
- If Hub `csoai/rwa-attest` MEASURED-INDEX files conflict with OS UNMEASURED product, keep `C-2026-0826-01` live.
- Tick #139/#186 in `docs/NEXT_300_MOVES.md` only after `hf_fs stat` shows repos exist.
