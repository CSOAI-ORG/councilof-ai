#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only crosswalk audit of PUBLIC frozen GSPC fact table (not a new benchmark).

Recomputes joined per-cell counts; checks references; measures exploratory
within-axis pairwise correctness correlation for same-item model pairs.
Does not call models, compare model leaders, publish secret prompts, or mutate
frozen data. Requires public Hugging Face network access.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
import statistics
from collections import Counter, defaultdict
from urllib.request import Request, urlopen

REPO = "https://huggingface.co/datasets/csoai/gspc-fact-table/resolve/"
DEFAULT_REV = "d0605c2495bddae7956fec5c18403d8a49fd81ac"


def fetch(rev, name):
    url = f"{REPO}{rev}/{name}"
    request = Request(url, headers={"User-Agent": "GSPC-public-ontology-audit/0.1"})
    with urlopen(request, timeout=45) as result:
        data = result.read()
    if len(data) > 25_000_000:
        raise ValueError("unexpected oversized public source")
    return data


def jsonl(raw):
    return [json.loads(line) for line in raw.splitlines() if line.strip()]


def corr(x, y):
    mx, my = statistics.mean(x), statistics.mean(y)
    ax, ay = [v-mx for v in x], [v-my for v in y]
    denom = math.sqrt(sum(v*v for v in ax)*sum(v*v for v in ay))
    return None if denom == 0 else sum(a*b for a,b in zip(ax,ay))/denom


def analyse(manifest, measurements, items, cells):
    # This projection is not a cryptographic verification of the source
    # mill-evidence cells; the manifest and all three tables can be forged.
    expected = manifest["counts"]
    counts = {"measurements": len(measurements), "items": len(items),
              "cells": len(cells)}
    errors = []
    for key, observed in counts.items():
        if observed != expected[key]:
            errors.append(f"manifest count mismatch: {key}: {observed} != {expected[key]}")
    item_keys = {(r["axis"],r["item_id"]) for r in items}
    cell_keys = {r["cell"] for r in cells}
    if len(item_keys) != len(items):
        errors.append("duplicate item-key mapping")
    if len(cell_keys) != len(cells):
        errors.append("duplicate cell-key mapping")
    cell_stats = defaultdict(lambda: [0,0,0])
    ungraded = 0
    unattributed = 0
    grade_by_model_item = defaultdict(list)
    missing_item = missing_cell = 0
    for r in measurements:
        if (r.get("axis"),r.get("item_id")) not in item_keys:
            missing_item += 1
        if r.get("cell") not in cell_keys:
            missing_cell += 1
        stats = cell_stats[r["cell"]]
        stats[0] += 1
        if r.get("ok") is None:
            ungraded += 1
        elif type(r["ok"]) is bool:
            stats[1] += 1
            stats[2] += int(r["ok"])
            if r.get("model"):
                grade_by_model_item[(r["axis"],r["model"],r["item_id"])].append(int(r["ok"]))
        else:
            errors.append("non-boolean grade")
        unattributed += int(not r.get("model"))
    mismatched_cells = []
    for r in cells:
        n_rows,n_graded,n_ok = cell_stats[r["cell"]]
        if (n_rows,n_graded,n_ok) != (r["n_rows"],r["n_graded"],r["n_ok"]):
            mismatched_cells.append(r["cell"])
    if missing_item or missing_cell:
        errors.append(f"unresolved row references: items={missing_item} cells={missing_cell}")
    if mismatched_cells:
        errors.append(f"{len(mismatched_cells)} cell count discrepancies")
    if ungraded != expected["rows_not_graded"]:
        errors.append("ungraded manifest mismatch")
    if unattributed != expected["rows_without_a_model"]:
        errors.append("unattributed manifest mismatch")
    # Exclude duplicate model×axis×item observations, rather than choosing
    # whichever run happens to appear first in a frozen table.
    ambiguous = {k for k,v in grade_by_model_item.items() if len(v)!=1}
    axis_model = defaultdict(dict)
    for (axis,model,item),observations in grade_by_model_item.items():
        if len(observations)==1:
            axis_model[(axis,model)][item]=observations[0]
    by_axis=defaultdict(list)
    for (axis,model),d in axis_model.items():
        if len(d)>=30:
            by_axis[axis].append((model,d))
    comparison={}
    for axis,models in by_axis.items():
        pairs=[]
        for (model_a,aa),(model_b,bb) in itertools.combinations(models,2):
            overlap = sorted(set(aa)&set(bb))
            if len(overlap) < 30:
                continue
            estimate = corr([aa[k] for k in overlap],[bb[k] for k in overlap])
            if estimate is not None:
                pairs.append((estimate,len(overlap)))
        if pairs:
            correlation_values=[r for r,n in pairs]
            comparison[axis] = {
                "qualifying_model_ids":len(models),
                "pairs_at_least_30_shared_graded_items":len(pairs),
                "mean_pairwise_correctness_correlation":round(statistics.mean(correlation_values),5),
                "median_pairwise_correctness_correlation":round(statistics.median(correlation_values),5),
                "min_shared_items":min(n for r,n in pairs),
                "max_shared_items":max(n for r,n in pairs),
            }
    return {
        "schema":"csoai.gspc-public-fact-ontology-audit/0.1",
        "status":"RECOMPUTED_PUBLIC_PROJECTION" if not errors else "FAILED_RECOMPUTATION",
        "not_new_model_inference":True,
        "not_held_out":True,
        "not_independent_referee":True,
        "counts":counts,
        "rows_ungraded":ungraded,
        "rows_unattributed":unattributed,
        "orphan_item_references":missing_item,
        "orphan_cell_references":missing_cell,
        "cell_count_mismatches":len(mismatched_cells),
        "duplicate_graded_model_axis_item_keys":len(ambiguous),
        "exploratory_same_axis_correctness_correlation":comparison,
        "ontology_uri":"https://councilof.ai/ns/gspc/0.1/",
        "ontology_mapped_entities":["Bank","Run","Cell"],
        "errors":errors,
        "limitations":[
            "Source manifest and tables share a publisher; recomputation does not independently authenticate truth",
            "All underlying board banks may have public-content exposure; correlations are exploratory",
            "Public cells do not establish real-time performance, improvement or model rankings",
            "A pair of models sharing a bank does not necessarily have independent errors",
            "Unattributed, ungraded and duplicate repeated observations are not silently repaired",
        ],
    }


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--revision",default=DEFAULT_REV,help="immutable public Hugging Face revision")
    args=ap.parse_args()
    names=("MANIFEST.json","gspc_measurements.jsonl","gspc_items.jsonl","gspc_cells.jsonl")
    raw={name:fetch(args.revision,name) for name in names}
    m=json.loads(raw[names[0]])
    report=analyse(m,jsonl(raw[names[1]]),jsonl(raw[names[2]]),jsonl(raw[names[3]]))
    report["source_revision"]=args.revision
    report["source_file_sha256"]={n:hashlib.sha256(raw[n]).hexdigest() for n in names}
    report["receipt_sha256"]=hashlib.sha256(json.dumps(report,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    print(json.dumps(report,indent=2,sort_keys=True))
    if report["errors"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
