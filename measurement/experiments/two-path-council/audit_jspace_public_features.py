#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only independent recomputation of simple public J-space feature checks.

Reports predeclared score directions for ONE output-logprob baseline and ONE
internal-workspace feature, per public dataset; not a classifier retraining,
not evidence of subjective experience, not an AI consciousness score.
Never copy source rows into our repository.
"""
from __future__ import annotations

import hashlib
import json
import math
import statistics
from collections import Counter, defaultdict
from urllib.request import Request, urlopen

SCHEMA="csoai.jspace-public-feature-audit/0.1"
REVISION="b176b283b82f5b7fa786bc0c67842299cadf1803"
SOURCE=("https://huggingface.co/datasets/solarkyle/jspace-hallucination-campaign/"
        f"resolve/{REVISION}/stage2_features.jsonl")
MAX_BYTES=15000000


def auc(scores, labels):
    """Mann-Whitney AUC with average ranks for ties. label==1 is error."""
    if len(scores)!=len(labels) or len(scores)<2 or set(labels)!={0,1}:
        return None
    pairs=sorted(zip(scores,labels),key=lambda t:t[0])
    ranksum=0.
    i=0
    while i<len(pairs):
        j=i+1
        while j<len(pairs) and pairs[j][0]==pairs[i][0]:
            j+=1
        rank=(i+1+j)/2
        ranksum+=rank*sum(label for _,label in pairs[i:j])
        i=j
    n1=sum(labels)
    n0=len(labels)-n1
    return (ranksum-n1*(n1+1)/2)/(n0*n1)


def analyse(rows):
    if not isinstance(rows,list):
        raise ValueError("rows must be a list")
    grouped=defaultdict(list)
    seen=set()
    duplicates=invalid=missing=0
    for r in rows:
        if not isinstance(r,dict):
            invalid+=1; continue
        identity=r.get("example_id")
        group=r.get("source_dataset")
        if not isinstance(identity,str) or not identity or not isinstance(group,str) or not group:
            invalid+=1;continue
        if identity in seen:
            duplicates+=1;continue
        seen.add(identity)
        label=r.get("label")
        if type(label) is not int or label not in (0,1):
            missing+=1;grouped[group].append((None,None,None));continue
        features=r.get("features")
        if not isinstance(features,dict):
            invalid+=1;continue
        bl=features.get("bl_mean_logprob")
        ws=features.get("ws_mean_entropy")
        # Fixed directions in advance. Low logprob = higher error risk;
        # high lens-entropy = higher error risk. No model training.
        if not all(isinstance(x,(int,float)) and math.isfinite(x) for x in (bl,ws)):
            invalid+=1;continue
        grouped[group].append((int(label),float(-bl),float(ws)))
    result={}
    for name, records in sorted(grouped.items()):
        good=[r for r in records if r[0] is not None]
        labels=[r[0] for r in good]
        total=len(records)
        errors=sum(labels)
        clean=len(labels)-errors
        result[name]={
            "n_total":total,
            "n_labeled":len(good),
            "n_missing_label":total-len(good),
            "n_errors":errors,"n_correct":clean,
            "error_fraction":round(errors/len(good),5) if good else None,
            "metric_eligible":errors>=30 and clean>=30,
            "one_class_labels":not bool(errors and clean),
            "auc_logprob_only":round(auc([r[1] for r in good],labels),5) if errors>=30 and clean>=30 else None,
            "auc_workspace_entropy_only":round(auc([r[2] for r in good],labels),5) if errors>=30 and clean>=30 else None,
        }
    return {
        "schema":SCHEMA,"state":"PUBLIC_THIRD_PARTY_REANALYSIS",
        "n_input_rows":len(rows),"n_unique_rows":len(seen),
        "duplicate_example_ids":duplicates,"invalid_rows":invalid,
        "missing_labels":missing,"source_revision":REVISION,
        "score_directions":{
            "output_baseline":"-bl_mean_logprob; larger means more predicted errors",
            "workspace_signal":"ws_mean_entropy; larger means more predicted errors",
        },
        "datasets":result,
        "limitations":[
            "Third-party model outputs, not new model calls or independently re-graded ground truth",
            "Descriptive AUC with fixed directions and no trained classifier or uncertainty interval",
            "Missing labels excluded from AUC and counted separately",
            "Identical answer-label mappings may inflate AUC even if output is not truly introspective",
            "Dataset-specific AUCs do not establish general transfer or subjective consciousness",
            "J-space layer features require compatible open-weight access, not only text-only API calls",
        ]
    }


def download():
    with urlopen(Request(SOURCE,headers={"User-Agent":"CSOAI-jspace-public-audit/0.1"}),timeout=45) as r:
        raw=r.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:
        raise ValueError("public feature data size cap exceeded")
    return raw


def main():
    raw=download()
    rows=[json.loads(line) for line in raw.splitlines() if line.strip()]
    report=analyse(rows)
    report["source_sha256"]=hashlib.sha256(raw).hexdigest()
    report["report_sha256"]=hashlib.sha256(json.dumps(report,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    print(json.dumps(report,indent=2,sort_keys=True))
    if report["invalid_rows"] or report["duplicate_example_ids"]:
        raise SystemExit(2)


if __name__=="__main__":
    main()
