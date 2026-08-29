# HF upload runbook (NEXT_300 #139, #186, #253)

Staged local packs — **UNMEASURED only**. Never upload invented MEASURED labour scores.

## Prerequisites (pick one path)

### A — Write token (can create Hub repos)

```bash
hf auth login   # write token with contribute-repos
hf auth whoami  # must show csoai org admin
npm run verify:staged-hf
npm run hf:upload-staged   # HF_UPLOAD_MODE=token (default)
```

Optional token files: `/run/secrets/HF_TOKEN`, `.hf_token`, `.secrets/HF_TOKEN`.

CI: set repository/org Actions secret `HF_TOKEN`, then `workflow_dispatch` **hf-upload-staged** (`auth=token` or `auto`).

### B — Trusted Publisher OIDC (no long-lived secret)

Hub JWT **cannot** `create_repo`. Owner one-time:

1. Create empty public datasets (web UI or any write session):
   - `csoai/labour-economy-unmeasured`
   - `csoai/rwa-testnet-unmeasured`
2. On each repo **Settings → Trusted Publishers**, add GitHub Actions:
   - `repository` = `CSOAI-ORG/councilof-ai`
   - `workflow` = `hf-upload-staged.yml`
   - optional: pin `branch` = `cursor/instruments-catalog-7fb8` (or `main` after merge)
3. Actions → **hf-upload-staged** → Run workflow → `auth=oidc` (or `auto` when no `HF_TOKEN`).

Workflow uses `permissions.id-token: write` and per-pack `HF_OIDC_RESOURCE=datasets/csoai/…`. Soft-skips if publishers are not configured yet (packs stay staged).

## MCP note

MCP OAuth (`hf_whoami`) may show **admin** on `csoai` and scopes including `contribute-repos`, but:

- `hf_fs` MCP is **read-only** (ls/cat/stat/search — no upload).
- Shell `hf` still needs path A or path B.

Until upload succeeds, keep packs staged and leave #139/#186/#253 as 🔄. See `datasets/UPLOAD_DEFERRED.md`.

## Pre-upload verify (no token required)

```bash
npm run verify:staged-hf   # assert measured_score null in staged JSON
```

Hub repos are **missing** until create+upload (or empty create + OIDC upload) succeeds.

## #139 / #253 — `csoai/labour-economy-unmeasured`

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
- Tick #139/#186/#253 in `docs/NEXT_300_MOVES.md` only after `hf_fs stat` shows repos exist.
