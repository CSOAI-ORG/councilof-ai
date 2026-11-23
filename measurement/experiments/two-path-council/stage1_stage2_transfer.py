#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Public-data J-space transfer control: stage1 fit -> stage2 evaluation.

CPU-only numpy; standard logistic regression; deterministic, explicit feature
groups and no stage2 model selection. This is retrospective third-party
analysis, not independently held-out, a full J-lens fit or consciousness proof.
"""
from __future__ import annotations

import hashlib
import json
import math
from collections import Counter,defaultdict
from urllib.request import Request,urlopen

from audit_jspace_public_features import auc

SCHEMA="csoai.jspace-public-stage-transfer/0.1"
REV="b176b283b82f5b7fa786bc0c67842299cadf1803"
ROOT=f"https://huggingface.co/datasets/solarkyle/jspace-hallucination-campaign/resolve/{REV}/"
STEPS=250
LR=.2
L2=.01


def source(name,cap):
    if name not in ("stage1_features.jsonl","stage2_features.jsonl"):
        raise ValueError("source name not allowlisted")
    with urlopen(Request(ROOT+name,headers={"User-Agent":"CSOAI-public-transfer/0.1"}),timeout=60) as r:
        raw=r.read(cap+1)
    if len(raw)>cap:
        raise ValueError("source exceeded size cap")
    return raw


def rows_from_bytes(raw):
    return [json.loads(line) for line in raw.splitlines() if line.strip()]


def qualifying(rows, feature_names):
    good=[]
    missing_label=0
    invalid=0
    seen=set()
    repeated=0
    for r in rows:
        if not isinstance(r,dict) or not isinstance(r.get("example_id"),str) or not isinstance(r.get("source_dataset"),str):
            invalid+=1;continue
        if r["example_id"] in seen:
            repeated+=1;continue
        seen.add(r["example_id"])
        label=r.get("label")
        if type(label) is not int or label not in (0,1):
            missing_label+=1;continue
        feats=r.get("features")
        if not isinstance(feats,dict):
            invalid+=1;continue
        values=[]
        for f in feature_names:
            x=feats.get(f)
            values.append(float(x) if isinstance(x,(int,float)) and math.isfinite(x) else float("nan"))
        good.append((r["example_id"],r["source_dataset"],r.get("split_group"),int(label),values))
    return good,{"n_raw":len(rows),"n_valid":len(good),"missing_label":missing_label,
                 "invalid":invalid,"repeated_example_id":repeated}


def build_features(train,test,feature_names):
    import numpy as np
    training=np.asarray([r[4] for r in train],dtype=np.float64)
    testing=np.asarray([r[4] for r in test],dtype=np.float64)
    # Impute by train medians ONLY; no data from stage 2 is used to fit scale.
    med=np.nanmedian(training,axis=0)
    med=np.where(np.isfinite(med),med,0)
    training=np.where(np.isfinite(training),training,med)
    testing=np.where(np.isfinite(testing),testing,med)
    mu=np.mean(training,axis=0)
    std=np.std(training,axis=0)
    std=np.where(std>=1e-8,std,1)
    return (np.clip((training-mu)/std,-15,15),
            np.clip((testing-mu)/std,-15,15))


def train_logits(X,y,steps=STEPS,learning_rate=LR,regularization=L2):
    import numpy as np
    if not 30 <= len(y)==len(X) or not 0 < y.mean() < 1:
        raise ValueError("invalid train labels")
    w=np.zeros(X.shape[1],dtype=np.float64)
    b=float(np.log(y.mean()/(1-y.mean())))
    for _ in range(steps):
        z=np.clip(X@w+b,-30,30)
        p=1/(1+np.exp(-z))
        err=p-y
        w-=learning_rate*((X.T@err)/len(y)+regularization*w)
        b-=learning_rate*float(np.mean(err))
    return w,b


def analyse(stage1,stage2,steps=STEPS):
    import numpy as np
    first=next((r.get("features") for r in stage1 if isinstance(r,dict) and isinstance(r.get("features"),dict)),None)
    if not first:
        raise ValueError("no feature rows")
    names=sorted(first)
    if len(names)!=31:
        raise ValueError("expected exactly 31 frozen features")
    if len([x for x in names if x.startswith("bl_")])!=4:
        raise ValueError("baseline feature count changed")
    train,trainstats=qualifying(stage1,names)
    test,teststats=qualifying(stage2,names)
    train_ids={r[0] for r in train}
    overlap={r[0] for r in test}&train_ids
    if overlap:
        # Refuse to select retroactively or hide exact example overlap.
        raise ValueError(f"source contains {len(overlap)} identical labeled examples in train and test")
    if len(train)<100 or len(test)<100:
        raise ValueError("insufficient examples")
    x,z=build_features(train,test,names)
    y=np.asarray([r[3] for r in train],dtype=np.float64)
    ys=[r[3] for r in test]
    groups={
        "output_only":[i for i,f in enumerate(names) if f.startswith("bl_")],
        "workspace_only":[i for i,f in enumerate(names) if not f.startswith("bl_")],
        "combined":list(range(len(names))),
    }
    bydataset=defaultdict(list)
    for i,r in enumerate(test):
        bydataset[r[1]].append(i)
    results={}
    for key,indices in groups.items():
        w,b=train_logits(x[:,indices],y,steps)
        preds=z[:,indices]@w+b
        results[key]={
            "features":len(indices),
            "trained_on_stage1_only":True,
            "stage2_auc_overall":round(auc(preds.tolist(),ys),5),
            "stage2_auc_by_dataset":{},
        }
        for dataset,ix in sorted(bydataset.items()):
            labels=[ys[i] for i in ix]
            result=auc([float(preds[i]) for i in ix],labels)
            results[key]["stage2_auc_by_dataset"][dataset]={
               "n":len(ix),"errors":sum(labels),
               "auc":round(result,5) if result is not None and min(sum(labels),len(ix)-sum(labels))>=30 else None,
            }
    return {
        "schema":SCHEMA,
        "evidence_state":"RETROSPECTIVE_PUBLIC_TRANSFER",
        "train_source":"solarkyle/jspace-hallucination-campaign",
        "train_revision":REV,
        "train":trainstats,"test":teststats,
        "train_dataset_names":sorted({r[1] for r in train}),
        "test_dataset_names":sorted({r[1] for r in test}),
        "overlapping_dataset_names":sorted({r[1] for r in train}&{r[1] for r in test}),
        "feature_names":names,
        "training":{
          "algorithm":"fixed full-batch logistic regression (numpy)",
          "scaling":"train-only median impute, train-only standardize, clip +-15",
          "learning_rate":LR,"l2":L2,"iterations":steps,
          "labels":"1=wrong",
        },
        "results":results,
        "limits":[
         "Published source data; not independent new hidden tasks",
         "The same model generated source features; no new model inference or causal activation intervention",
         "Training and testing dataset names overlap for some sources; this is stage transfer, not universal zero-shot task transfer",
         "Error probes can learn answer-identity shortcuts; no claim of detecting model awareness or consciousness",
         "No optimization or feature selection on test labels; no CI/multiple comparison correction",
         "Model and label data rights remain with source; output contains aggregates only",
        ]
    }


def main():
    r1=source("stage1_features.jsonl",30000000)
    r2=source("stage2_features.jsonl",15000000)
    report=analyse(rows_from_bytes(r1),rows_from_bytes(r2))
    report["source_sha256"]={"stage1":hashlib.sha256(r1).hexdigest(),"stage2":hashlib.sha256(r2).hexdigest()}
    report["report_sha256"]=hashlib.sha256(json.dumps(report,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    print(json.dumps(report,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
