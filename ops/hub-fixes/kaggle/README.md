# kaggle_fix_bundle (prepared 2026-11-20, nothing published)

One folder per public dataset of Kaggle user nicktempleman (149).
- dataset-metadata.json: full replacement metadata for `kaggle datasets metadata <ref> --update -p <dir>`.
- live-metadata-at-prep.json: live metadata read anonymously at prep time (used by the stale-check in push_kaggle.py).
- FIELDS.md: per-file field reference (JSON/JSONL fields cannot carry column descriptions on Kaggle). Not uploaded.
- cover-proposal.png: optional cover, uploaded only with `push_kaggle.py --with-cover`.
- notebook/: starter.ipynb + kernel-metadata.json (top-20 by downloads). The tested notebooks include their executed outputs.

See ../kaggle_fix_manifest.csv for needs_owner_ruling, columns_source and notebook_tested; see ../kaggle_rubric.md for the schema and scoring basis.
Publishing: `python push_kaggle.py` (dry run) -> review -> `python push_kaggle.py --confirm-publish [--accept-owner-rulings] [--notebooks] [--with-cover]`.
Kaggle updates go live immediately; there is no PR/review step.
