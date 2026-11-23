#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Public repeated-observation consistency audit across frozen GSPC cells.

A model×axis×item key can appear in multiple cells. Conflicting grades are
observed variation, NOT necessarily temporal drift, model self-modification,
new neural training, or a fault in the original grader.
"""
from __future__ import annotations
import hashlib
import json
from collections import Counter,defaultdict

from error_complementarity import fetch,jsonl,ROOT,REVISION
from urllib.request import Request,urlopen

SCHEMA="csoai.gspc-repeated-observation-audit/0.1"


def digest(obj):
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":")).encode()).hexdigest()


def analyse(measurements,items,cells):
    if not all(isinstance(d,list) for d in (measurements,items,cells)):
        raise ValueError("lists required")
    item_index={}
    for x in items:
        if not isinstance(x,dict):
            raise ValueError("invalid item")
        key=(x.get("axis"),x.get("item_id"))
        if key in item_index:
            raise ValueError("duplicate item")
        item_index[key]=x.get("expected")
    cell_index={}
    for c in cells:
        if not isinstance(c,dict) or not isinstance(c.get("cell"),str):
            raise ValueError("invalid cell")
        if c["cell"] in cell_index:
            raise ValueError("duplicate cell")
        cell_index[c["cell"]]=c
    groups=defaultdict(list)
    excluded=Counter()
    for r in measurements:
        if not isinstance(r,dict):
            excluded["not_dict"]+=1;continue
        key=(r.get("axis"),r.get("model"),r.get("item_id"))
        if not isinstance(key[1],str) or not key[1]:
            excluded["unattributed_model"]+=1;continue
        if (key[0],key[2]) not in item_index or r.get("expected")!=item_index[(key[0],key[2])]:
            excluded["missing_or_mismatched_item"]+=1;continue
        if type(r.get("ok")) is not bool:
            excluded["ungraded"]+=1;continue
        c=cell_index.get(r.get("cell"))
        if c is None or c.get("axis")!=key[0] or c.get("model")!=key[1]:
            excluded["missing_or_mismatched_cell"]+=1;continue
        if c.get("bank_sha256")!=r.get("bank_sha256",c.get("bank_sha256")):
            excluded["bank_identity_conflict"]+=1;continue
        groups[key].append((r,c))
    repeats={k:v for k,v in groups.items() if len(v)>1}
    grade_conflicts={}
    output_conflicts={}
    for k,v in repeats.items():
        if len({r["ok"] for r,c in v})>1:
            grade_conflicts[k]=v
        if len({str(r.get("observed")) for r,c in v})>1:
            output_conflicts[k]=v
    classes=Counter()
    byaxis=Counter()
    missing=Counter()
    n_distinct_cells=0
    for k,rows in grade_conflicts.items():
        byaxis[k[0]]+=1
        revisions={c.get("model_hf_revision") for r,c in rows}
        routes={c.get("provider_route") for r,c in rows}
        banks={c.get("bank_sha256") for r,c in rows}
        if None in revisions or "" in revisions:missing["model_revision_missing_in_grade_conflicts"]+=1
        if None in routes or "" in routes:missing["provider_route_missing_in_grade_conflicts"]+=1
        if None in banks or "" in banks:missing["bank_sha_missing_in_grade_conflicts"]+=1
        n_distinct_cells+=int(len({r["cell"] for r,c in rows})>1)
        variation=(
            "BANK_CHANGED" if len(banks)>1 else
            "REVISION_CHANGED" if len(revisions)>1 else
            "ROUTE_CHANGED" if len(routes)>1 else
            "SAME_RECORDED_METADATA"
        )
        classes[variation]+=1
    result={
        "schema":SCHEMA,"state":"RETROSPECTIVE_PUBLIC_REUSE",
        "source_revision":REVISION,
        "n_measurement_rows":len(measurements),
        "n_items":len(items),"n_cells":len(cells),
        "n_eligible_model_axis_item_keys":len(groups),
        "n_keys_observed_in_multiple_cells":len(repeats),
        "n_rows_in_repeated_keys":sum(len(v) for v in repeats.values()),
        "n_grade_conflict_keys":len(grade_conflicts),
        "n_observed_output_conflict_keys":len(output_conflicts),
        "n_grade_conflicts_with_multiple_cell_ids":n_distinct_cells,
        "grade_conflicts_by_axis":dict(sorted(byaxis.items())),
        "grade_conflicts_by_recorded_metadata":dict(sorted(classes.items())),
        "missing_metadata_in_grade_conflicts":dict(sorted(missing.items())),
        "excluded_rows_by_reason":dict(sorted(excluded.items())),
        "temporal_ordering":"NOT_ESTABLISHED",
        "individual_end_user_effect":"NOT_MEASURED",
        "model_weight_adaptation":"NOT_ESTABLISHED",
        "referee_independence":"NOT_ESTABLISHED",
        "caveats":[
            "Repeated item labels are not repeated independent experiments",
            "Equal recorded revision/route/bank does not prove identical runtime settings or weights",
            "A changed provider route is not proof the model improved or degraded",
            "Archive lacks per-row reliable test chronology and user/outcome IDs",
            "The same GSPC historical grading field is reused; the grader is NOT reimplemented",
            "These are candidate reproducibility signals, not a new live GSPC axis or certification",
        ],
    }
    result["report_sha256"]=digest(result)
    return result


def main():
    measurements=fetch("gspc_measurements.jsonl")
    items=fetch("gspc_items.jsonl")
    req=Request(ROOT+"gspc_cells.jsonl",headers={"User-Agent":"CSOAI-repeatability-research/0.1"})
    with urlopen(req,timeout=60) as r:
        cells=r.read(2_000_001)
    if len(cells)>2_000_000:
        raise ValueError("oversize public cells")
    result=analyse(jsonl(measurements),jsonl(items),jsonl(cells))
    result["source_file_sha256"]={
       "measurements":hashlib.sha256(measurements).hexdigest(),
       "items":hashlib.sha256(items).hexdigest(),
       "cells":hashlib.sha256(cells).hexdigest(),
    }
    result.pop("report_sha256")
    result["report_sha256"]=digest(result)
    print(json.dumps(result,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
