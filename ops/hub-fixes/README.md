# ops/hub-fixes — Hugging Face and Kaggle front-end fixes

Prepared 20–21 Nov 2026 from a live audit of the `csoai` HF org (178 datasets, 34 Spaces, 10 models) and Kaggle `nicktempleman` (149 datasets). Nothing here has been applied yet.

Run with **Actions → hub-fixes → Run workflow**. Every task is a dry run unless `apply=true`. The workflow first prints which identity and scopes `HF_TOKEN` has (never the value).

| task | what it does | writes |
|---|---|---|
| `probe` | token identity / scope check | nothing |
| `hf-card-prs` | one **pull request per HF repo**, README.md only | HF PRs (never main) |
| `collections` | reduce 10 collections to 3 (no deletions in this workflow) | HF collections, needs `confirm_publish` |
| `flagship` | stage + validate `csoai/gspc` (41 configs); with confirm: create it **private** and open one PR | HF, needs `confirm_publish` |
| `kaggle-metadata` | replace dataset metadata (subtitle, description, tags, file/column descriptions) | **live** Kaggle pages, needs `confirm_publish` |

## HF card waves (`hf/hf_fix_manifest.csv`, column `wave`)
- `wave1` (50 repos): citation, size/task categories, limitations, front-door link. No owner ruling needed.
- `wave2-owner` (65 repos): needs an owner ruling first — licence choices, and re-enabling the dataset viewer on repos where `viewer: false` may be deliberate (e.g. councilof-ai-evidence, whose proposed configs pin hashed file names that the daily evidence sync replaces).
- `source-script` (9 repos, **not** pushed): their cards are written by scripts in this repo, so a Hub-side PR would be overwritten. Fix the generator instead: csoai/brand-assets, csoai/council-coliseum, csoai/gspc-auto-measure, csoai/gspc-auto-measure-results, csoai/gspc-benchmark-suite, csoai/gspc-board, csoai/gspc-board, csoai/gspc-lm-eval-tasks, csoai/gspc-one. Generators: `scripts/hf/polish_frontdoors.py` (deliberately sets `viewer: false` on gspc-benchmark-suite), `scripts/sync_hf_coliseum.py`, `scripts/sync_hf_gspc.py`, `scripts/surface/publish-hf-evaluation.py`, `scripts/hf/fix-card-link.py`.

Each repo folder in `hf/bundle/` holds the proposed `README.md`, a unified diff against the live card, and `VIEWER_FIX.md` where configs were added. All cards pass `huggingface_hub` RepoCard validation; proposed dataset configs were loaded locally with `datasets` (49 configs cover a schema-consistent sample only and are labelled `-sample`). The push script re-reads each live README and skips any repo whose card changed since the bundle was built.

## Security hold
`csoai/index-presence` (HF, public) and the Kaggle datasets `csoai-gspc-index-presence` and `sov-space-backup-20260727` are on hold: HF secret scanning flagged live keys in csoai machine-backup datasets on the owner's account. Nothing in this workflow touches them until the keys are rotated and the files are removed.

## Codename hold
Per AGENTS.md (no internal codenames in public output), four HF repos whose names or data paths are codenames are `wave=hold-codename` (never pushed): Nicholastempleman/govbench, sov33-benchmark, meok-sov6-abstraction-overlay, meok-sov6-overlay-standby. Kaggle `csoai-sov-estate` carries `codename_hold`. Any `*_hold` / `hold-*` marker is an unconditional skip in both push scripts.

## Exposure hold
The 24 Nov external exposure audit flagged 10 repos in these waves: home paths, private IPs, backup-shaped archives, third-party contact details or internal workspace mirrors. They are `wave=hold-exposure` and are never pushed by this script until the underlying data is cleaned: csoai-unified-33, claim-capture-census, gspc-estate, cross-ledger-supply, measurement-capsules, gspc-master, gspc-daily-reports, meok-oowm-hybrid-lab, Nicholastempleman/govbench-items, Nicholastempleman/gspc-flywheel.

## Kaggle
`kaggle/<slug>/dataset-metadata.json` for all 149 datasets (existing descriptions preserved verbatim; facts block, citation, 5–8 tags, file descriptions; column schemas only where read from an identical HF twin). 142 datasets need an owner ruling on `expectedUpdateFrequency`; the script skips rows with pending rulings. Starter notebooks exist for the top 20 (8 untested) and are not pushed by this workflow. Proposed cover images were left out of the repo.

## Owner decisions before `apply=true`
1. Licences flagged `needs_owner_ruling` in both manifests.
2. Whether the viewer should be re-enabled on each `viewer: false` repo.
3. Kaggle update frequency (recommended: `never` for dated snapshots).
4. Flagship `csoai/gspc`: private first, then public after review (default).
5. Collection deletions are not in this workflow; run `apply_collections.py --confirm --delete` by hand once the 3 kept collections look right.
