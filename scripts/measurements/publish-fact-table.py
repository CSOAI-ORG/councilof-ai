#!/usr/bin/env python3
"""Publish the GSPC fact table as a queryable dataset (parquet + index + README).

WHY
---
The estate's measurements are one table, but they were published as 664 per-cell files whose
NAMES carry only a truncated axis and a content hash — the model is inside the file. A reader
who wants "how did model X do on axis Y" cannot find the cell without opening every file, and
cannot read the corpus as a table. The published projection that did exist
(csoai/gspc-peritem-rows-2026-08-12) is a LOSSY FROZEN subset: 15,580 rows over 19 models,
against the 20,517 rows over 57 models the estate actually holds.

So this publishes the joined table with a parquet copy of each file, so the Hub's dataset viewer
can query it, and an index that names the authoritative copy of every cell.

WHAT IT WRITES
--------------
  gspc_measurements.jsonl / .parquet   20,517 rows - one per (model, axis, item)
  gspc_items.jsonl / .parquet              807 rows - the item universe
  gspc_cells.jsonl / .parquet              677 rows - the cell index, with each cell's digest
  README.md                              the dataset card, with one config per axis
  MANIFEST.json                          counts, the source digest, and what is NOT here

WHAT IT DOES NOT DO
-------------------
It does not re-grade anything, does not re-run anything, and does not publish a score it did not
read. It does not claim that a model is good, or better than another.

    python3 scripts/measurements/publish-fact-table.py --table public/interop/gspc-fact-table \
        --repo csoai/gspc-fact-table
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SITE = "https://councilof.ai"
TABLES = ("gspc_measurements", "gspc_items", "gspc_cells")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def write_parquet(rows: list[dict], out: Path) -> None:
    import pyarrow as pa
    import pyarrow.parquet as pq

    # A stable column order and an explicit schema: the parquet is a VIEW of the jsonl, and a
    # reader must not have to guess which field is a string and which is a number.
    columns: list[str] = []
    types: dict[str, str] = {}
    for r in rows:
        for k, v in r.items():
            if k not in types:
                columns.append(k)
                types[k] = "null" if v is None else type(v).__name__
    schema = pa.schema([
        pa.field(c,
                 pa.bool_() if types[c] == "bool" else
                 pa.int64() if types[c] == "int" else
                 pa.float64() if types[c] == "float" else
                 pa.string(),
                 nullable=True)
        for c in columns
    ])
    arrays = []
    for c in columns:
        values = [r.get(c) for r in rows]
        if types[c] == "bool":
            arrays.append(pa.array(values, type=pa.bool_()))
        elif types[c] == "int":
            arrays.append(pa.array(values, type=pa.int64()))
        elif types[c] == "float":
            arrays.append(pa.array(values, type=pa.float64()))
        elif types[c] == "null":
            arrays.append(pa.array([None] * len(rows), type=pa.string()))
        else:
            arrays.append(pa.array([None if v is None else str(v) for v in values], type=pa.string()))
    table = pa.Table.from_arrays(arrays, schema=schema)
    pq.write_table(table, out, compression="zstd")


def readme_for(table: Path, manifest: dict) -> str:
    axes = sorted({r["axis"] for r in read_jsonl(table / "gspc_measurements.jsonl")})
    configs = "\n".join(
        f"- config_name: {a}\n  data_files:\n  - gspc_measurements.parquet"
        for a in axes)
    return f"""---
license: cc-by-4.0
language:
- en
pretty_name: GSPC fact table — every measurement the Council of AI holds, joined
size_categories:
- 10K<n<100K
task_categories:
- text-classification
tags:
- gspc
- council-of-ai
- llm-evaluation
- ai-governance
- ai-safety
- mcnemar
- reproducibility
configs:
{configs}
---

# GSPC fact table — every measurement the Council of AI holds, joined

> **Start here — free verify:** <{SITE}/gspc-verify/> · **Full catalog:** <{SITE}/catalog.json> ·
> Methodology: <{SITE}/methodology/> · **Live board:** <{SITE}/api/gspc> ·
> Measurement, not certification.

## What this is

One long-format table of every measurement the Council of AI holds, joined from the per-cell
evidence, with the item universe it refers to and an index of the cells it came from.

| file | rows | what a row is |
|---|---|---|
| `gspc_measurements.jsonl` / `.parquet` | {manifest['counts']['measurements']} | one measurement: a model, an axis, an item, what it answered, and whether it was right |
| `gspc_items.jsonl` / `.parquet` | {manifest['counts']['items']} | one item of a bank: its text digest, its expected label, the bank it came from and its digest |
| `gspc_cells.jsonl` / `.parquet` | {manifest['counts']['cells']} | one evidence cell: the file it came from, that file's own sha256, the model, the axis and the cell's accuracy |
| `MANIFEST.json` | — | the counts, the source digest, and what this dataset does NOT contain |

## Why it exists

The measurements were published as {manifest['counts']['cells']} per-cell files whose NAMES carry
only a truncated axis and a content hash — **the model is inside the file**. A reader who wanted
"how did model X do on axis Y" could not find the cell without opening every file, could not join
the cells without reading all of them, and could not read the corpus as a table. The projection
that did exist (`csoai/gspc-peritem-rows-2026-08-12`) is a **lossy, frozen subset**: 15,580 rows
over 19 models, against the {manifest['counts']['measurements']} rows over {manifest['counts']['models']} models
the estate actually holds — and it dropped the prompt, the model revision, the provider route and
the elapsed time, which are the fields that make a row auditable.

## How to re-derive a number

```
# every cell's accuracy, from the table alone
gspc_cells.jsonl -> n_ok / n_graded
```

The test that proves it: `scripts/measurements/gspc-fact-table.node-test.mjs` — every cell's
accuracy re-derives from the fact table, every measurement resolves to an item, the item counts
re-derive, the table has exactly as many rows as the evidence has, every cell is indexed once with
the digest of its own bytes, and no canary string reaches the output.

## What this does not establish

- **That a model is good, or better than another.** One run per cell, on one bank, at one time.
- **That a row is right.** It is what the grader recorded, with the grader's own label.
- **That the cells are comparable across axes.** They are different banks, different item counts,
  different item selection. The axis is in every row; a cross-axis comparison is the reader's
  judgement to make and defend.
- **That the corpus is complete.** {manifest['counts']['rows_without_a_model']} rows carry no model
  (their cell is knowable only by opening the file) and {manifest['counts']['rows_not_graded']} carry no
  grade. Both counts are in `MANIFEST.json`. They are published as they are, not dropped.

## Provenance

Source: `public/interop/mill-evidence/` in
<https://github.com/CSOAI-ORG/councilof-ai> — {manifest['source']['cell_files']} cell files,
{manifest['source']['source_rows']} source rows, source digest
`{manifest['source']['source_digest']}`. Generated by
`scripts/measurements/build-gspc-fact-table.mjs`; generator commit
`{manifest['generator_commit']}`. Licence CC-BY-4.0.
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--table", required=True, type=Path, help="the built fact table directory")
    ap.add_argument("--repo", required=True, help="HF dataset id, e.g. csoai/gspc-fact-table")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    table = a.table.resolve()
    manifest = json.loads((table / "MANIFEST.json").read_text())

    for name in TABLES:
        rows = read_jsonl(table / f"{name}.jsonl")
        write_parquet(rows, table / f"{name}.parquet")
        print(f"parquet: {name}.parquet ({len(rows)} rows)")
    (table / "README.md").write_text(readme_for(table, manifest), encoding="utf-8")
    print("README.md written")

    if a.dry_run:
        return 0

    from huggingface_hub import HfApi

    api = HfApi(token=os.environ.get("HF_TOKEN") or None)
    api.create_repo(repo_id=a.repo, repo_type="dataset", exist_ok=True, private=False)

    # Stage what is published, and publish ONLY that. The parquet and the README are
    # publication artefacts; the repo keeps the jsonl and the manifest. AppleDouble (._*)
    # sidecar files are never data and are never published: a macOS tar of the table used to
    # carry them into the dataset, and they are not a thing a reader should have to ignore.
    with tempfile.TemporaryDirectory() as d:
        stage = Path(d) / "stage"
        stage.mkdir()
        for name in TABLES:
            shutil.copy2(table / f"{name}.jsonl", stage / f"{name}.jsonl")
            shutil.copy2(table / f"{name}.parquet", stage / f"{name}.parquet")
        shutil.copy2(table / "MANIFEST.json", stage / "MANIFEST.json")
        shutil.copy2(table / "README.md", stage / "README.md")
        api.upload_folder(
            folder_path=str(stage),
            path_in_repo="",
            repo_id=a.repo,
            repo_type="dataset",
            commit_message=f"GSPC fact table: {manifest['counts']['measurements']} measurement(s), "
                           f"{manifest['counts']['items']} item(s), {manifest['counts']['cells']} cell(s) "
                           f"from {manifest['source']['source_digest'][:16]}",
        )
    print("published:", f"https://huggingface.co/datasets/{a.repo}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
