#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Public GSPC error-complementarity observatory (read-only).

Evaluates error intersections across model identifiers on matched public items.
The "either correct" measure is a privileged ORACLE UPPER BOUND, not an
implementable referee or measured user benefit. Nothing is trained or graded.
"""
from __future__ import annotations
import hashlib
import itertools
import json
import math
import statistics
from collections import defaultdict
from urllib.request import Request,urlopen

REVISION="d0605c2495bddae7956fec5c18403d8a49fd81ac"
ROOT=f"https://huggingface.co/datasets/csoai/gspc-fact-table/resolve/{REVISION}/"
SCHEMA="csoai.gspc-public-error-complementarity/0.1"


def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def fetch(name,cap=15_000_000):
    if name not in ("gspc_measurements.jsonl","gspc_items.jsonl"):
        raise ValueError("unknown public source")
    with urlopen(Request(ROOT+name,headers={"User-Agent":"CSOAI-public-correlation-research/0.1"}),timeout=60) as r:
        raw=r.read(cap+1)
    if len(raw)>cap:
        raise ValueError("public source too large")
    return raw

def jsonl(blob):
    return [json.loads(line) for line in blob.splitlines() if line.strip()]


def analyse(measurements, items, min_overlap=30):
    if not isinstance(measurements,list) or not isinstance(items,list):
        raise ValueError("expected list inputs")
    if not 30<=min_overlap<=1000:
        raise ValueError("invalid minimum overlap")
    key_counts=defaultdict(int)
    item_valid={}
    for x in items:
        key=(x.get("axis"),x.get("item_id"))
        if key in item_valid:
            raise ValueError("duplicate item key")
        item_valid[key]=x.get("expected")
    raw=defaultdict(list)
    n_excluded=0
    for r in measurements:
        if not isinstance(r,dict):
            n_excluded+=1;continue
        axis,model,item=r.get("axis"),r.get("model"),r.get("item_id")
        if ((axis,item) not in item_valid or type(r.get("ok")) is not bool or
            not isinstance(model,str) or not model or
            r.get("expected")!=item_valid[(axis,item)]):
            n_excluded+=1;continue
        raw[(axis,model,item)].append(bool(r["ok"]))
    ambiguous={k for k,v in raw.items() if len(v)!=1}
    bymodel=defaultdict(dict)
    for (axis,model,item),observations in raw.items():
        if len(observations)==1:
            bymodel[(axis,model)][item]=observations[0]
    byaxis=defaultdict(list)
    for (axis,model),mapping in bymodel.items():
        if len(mapping)>=min_overlap:
            byaxis[axis].append((model,mapping))
    axes={}
    for axis, models in sorted(byaxis.items()):
        pairs=[]
        for (ma,da),(mb,db) in itertools.combinations(sorted(models),2):
            common=sorted(set(da)&set(db))
            if len(common)<min_overlap:
                continue
            n=len(common)
            a=[da[k] for k in common]
            b=[db[k] for k in common]
            aa=sum(a); bb=sum(b)
            both=sum(x and y for x,y in zip(a,b))
            neither=sum(not x and not y for x,y in zip(a,b))
            rescue=sum(x!=y for x,y in zip(a,b))
            pairs.append({
                "model_a":ma,"model_b":mb,"n_shared_public_items":n,
                "single_a":round(aa/n,5),
                "single_b":round(bb/n,5),
                "both_correct":round(both/n,5),
                "both_wrong":round(neither/n,5),
                "complementary_disagreements":round(rescue/n,5),
                "either_correct_oracle_ceiling":round((n-neither)/n,5),
            })
        if not pairs:
            continue
        # Predeclared: choose by coverage then lexical, never choose by outcomes.
        coverage_choice=sorted(pairs,key=lambda p:(-p["n_shared_public_items"],p["model_a"],p["model_b"]))[0]
        axes[axis]={
            "models_with_at_least_30_graded_rows":len(models),
            "n_qualifying_pairs":len(pairs),
            "n_min_shared_items":min(p["n_shared_public_items"] for p in pairs),
            "median_both_wrong_fraction":round(statistics.median(p["both_wrong"] for p in pairs),5),
            "median_oracle_ceiling":round(statistics.median(p["either_correct_oracle_ceiling"] for p in pairs),5),
            "mean_complementary_disagreements":round(statistics.mean(p["complementary_disagreements"] for p in pairs),5),
            "max_both_wrong_fraction_observed":round(max(p["both_wrong"] for p in pairs),5),
            "coverage_selected_pair":coverage_choice,
        }
    report={
        "schema":SCHEMA,
        "evidence_state":"RETROSPECTIVE_PUBLIC_REUSE",
        "source_revision":REVISION,
        "n_measurement_rows":len(measurements),
        "n_item_rows":len(items),
        "excluded_rows":n_excluded,
        "excluded_duplicated_model_axis_item_keys":len(ambiguous),
        "axes":axes,
        "n_eligible_axes":len(axes),
        "methods":{
           "pair_selection":"highest shared unique graded-item count, then model ID lexical; NEVER selected by accuracy",
           "expected":"observed original item-level boolean ok; canonical grader not rerun",
           "either_correct":"not an actionable council decision; an oracle with access to ground truth would be required",
           "missingness":"exclude unattributed, ungraded, repeated, or item-inconsistent observations",
        },
        "limitations":[
            "No new model prompts or independent ground-truth review",
            "All data are public historical GSPC observations; not held-out",
            "Pairwise comparisons share models and items, hence are statistically dependent",
            "No retrospective best-pair selection as a deployable policy",
            "Neither model votes, error separation nor model names establish BFT or authenticated diversity",
            "No human identity, user interaction, model-training change or temporal drift can be inferred",
        ]
    }
    report["report_sha256"]=hashlib.sha256(canonical(report)).hexdigest()
    return report


def main():
    a=fetch("gspc_measurements.jsonl")
    b=fetch("gspc_items.jsonl")
    report=analyse(jsonl(a),jsonl(b))
    report["source_file_sha256"]={"measurements":hashlib.sha256(a).hexdigest(),
                                  "items":hashlib.sha256(b).hexdigest()}
    # include the immutable source hashes in the final report's digest
    report.pop("report_sha256")
    report["report_sha256"]=hashlib.sha256(canonical(report)).hexdigest()
    print(json.dumps(report,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
