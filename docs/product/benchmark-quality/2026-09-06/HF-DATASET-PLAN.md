# Hugging Face dataset plan — `csoai/benchmark-quality-register`

The repo id already exists as a target in `scripts/export-benchmark-quality.mjs`, which
exports the **v0.1** register (benchmarks). This plan adds v1 (publishers) as a second config
rather than a second dataset.

## The trap to avoid first

**One format per dataset.** Mixed `.jsonl` and `.parquet` configs fail on the viewer with a
misleading "corrupt parquet" error. Everything below is `.jsonl`, one format, no exceptions.
`/splits` is the signal that the viewer is happy; `is-valid` lags and must not be used as the
gate.

## Configs

| config | one row is | rows (6 Sep 2026) |
|---|---|---|
| `predicates-v1` | one predicate definition: id, group, question, evaluable_from, evidence_type, why, pattern, recompute, narrowed_after_run_1, directional | 35 |
| `cells-2026-09-06` | one publisher × predicate cell: publisher, predicate_id, group, result, source_url, url_requested, http_status, fetched, sha256, bytes, matched, context, reason, self_assessed | 280 |
| `artifacts-2026-09-06` | one fetched artifact: publisher, key, url_requested, url_effective, http_status, content_type, bytes, fetched, sha256 | 24 |

A new run adds `cells-<date>` and `artifacts-<date>`. Nothing is ever overwritten; a corrected
cell lands in a new dated config with the correction ledger id on it.

## Card

- **Licence:** CC-BY-4.0, in the YAML front matter as a machine-readable id, not only in prose.
  We fail `results_licence_stated_on_board` on our own board; failing it on our own dataset
  card as well would be the same defect twice.
- **The first paragraph carries the disclaimers**, not a footer: unsolicited; no subject
  participated; public artifacts only; no score, no ranking, counts unweighted and
  non-exhaustive; not a certification; one row is self-assessed and flagged.
- **The reproduction block is the second thing on the card:**
  ```
  git clone <repo> && python3 scripts/benchmark_quality/register.py --check
  python3 scripts/benchmark_quality/register.py --explain <publisher>:<predicate>
  ```
- **The `narrowed_after_run_1` field gets a section of its own.** Five patterns were changed
  after the first run because they matched a newsletter button, an asset hash, a top-p
  parameter, a docs-toolchain issue tracker and a ranked model's licence. Publishing the list
  of our own false positives is the part of this dataset that is hard to fake.
- Link back to `/interop/benchmark-quality/index.json` and to the corrections ledger.

## Push path

- Local CLI token has org-`csoai` `repo.write`; the Actions token does not and returns 403 on
  main. Push from the CLI, or the config lands as a stranded draft.
- After the push, check `/splits` returns the three configs. Do not report the dataset as live
  off a 200 from the repo page.

## What must never be in the dataset

Prices. Any comparative field. Any total presented as a score. Any column that invites `ORDER
BY`. A `rank` column would undo the whole file.
