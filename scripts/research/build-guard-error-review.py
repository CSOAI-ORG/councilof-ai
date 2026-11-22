#!/usr/bin/env python3
"""Construct a source-pinned prompt-guard error review queue without raw prompts.

Never fine-tune/optimise a detector on its own published test split and call
the next measurement independent. This queue is for gap analysis only.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent
module=importlib.util.spec_from_file_location("external_guard",ROOT/"external-guard-benchmark.py")
bench=importlib.util.module_from_spec(module);module.loader.exec_module(bench)

def require(ok,msg):
    if not ok:raise ValueError(msg)

def build(current,baseline):
    cm=bench.validate(current)
    bm=bench.validate(baseline)
    require(current["dataset_revision"]==baseline["dataset_revision"] and
            current["data_sha256"]==baseline["data_sha256"] and
            current["model_revision"]==baseline["model_revision"] and
            current["model_file_sha256"]==baseline["model_file_sha256"] and
            current["normalizer_sha256"]==baseline["normalizer_sha256"],
            "attempted to compare unpinned model or data")
    for c,b in zip(current["cases"],baseline["cases"]):
        require(c["input_sha256"]==b["input_sha256"] and c["label"]==b["label"],"case identity drift")
    def wrong(x):return x["predicted"]!=x["label"]
    missing=[{"id":r["id"],"input_sha256":r["input_sha256"],"score":r["score"],
              "label":r["label"],"predicted":r["predicted"],
              "error":"FALSE_NEGATIVE" if r["label"]==1 else "FALSE_POSITIVE"}
             for r in current["cases"] if wrong(r)]
    regressions=[r["id"] for r,b in zip(current["cases"],baseline["cases"])
                 if wrong(r) and not wrong(b)]
    recoveries=[r["id"] for r,b in zip(current["cases"],baseline["cases"])
                if not wrong(r) and wrong(b)]
    return {
        "schema":"csoai.guard-observed-errors/0.1",
        "basis":"THIRD_PARTY_LABELS_NOT_BLIND_OR_ADJUDICATED",
        "model_revision":current["model_revision"],
        "dataset_revision":current["dataset_revision"],
        "data_sha256":current["data_sha256"],
        "baseline_record_observed_at":baseline["observed_at"],
        "current_record_observed_at":current["observed_at"],
        "baseline_counts":bm,"current_counts":cm,
        "n_errors":len(missing),
        "errors":missing,
        "changed_from_baseline":{
            "regression_case_ids":regressions,"recovery_case_ids":recoveries,
            "n_regressions":len(regressions),"n_recoveries":len(recoveries)},
        "scope":{
            "gspc_admitted":False,"independent_review":"NOT_CONDUCTED",
            "raw_source_text_redistributed":False,
            "training_on_this_test_split_authorized":False,
            "automated_model_retraining_performed":False
        },
        "limitations":[
            "Benchmark source has been evaluated by model publisher; not unseen holdout.",
            "Error queue is a researcher triage candidate, not a fresh training set.",
            "Threshold sensitivity on same split is exploratory, not a deployment recommendation.",
            "No human-adjudicated source labels, production tool effects or independent certification."
        ]
    }

def main():
    a=argparse.ArgumentParser()
    a.add_argument("mode",choices=["build","verify"])
    a.add_argument("--current",required=True)
    a.add_argument("--baseline",required=True)
    a.add_argument("--output",required=True)
    args=a.parse_args()
    current=json.loads(Path(args.current).read_text())
    baseline=json.loads(Path(args.baseline).read_text())
    expected=build(current,baseline)
    if args.mode=="build":
        with Path(args.output).open("x") as f:json.dump(expected,f,indent=2,sort_keys=True);f.write("\n")
    else:
        stored=json.loads(Path(args.output).read_text())
        require(stored==expected,"error queue cannot be reconstructed")
    print(json.dumps({"mode":args.mode,"n_errors":expected["n_errors"],
                      "false_negative":expected["current_counts"]["fn"],
                      "false_positive":expected["current_counts"]["fp"],
                      "regressions":expected["changed_from_baseline"]["n_regressions"],
                      "recoveries":expected["changed_from_baseline"]["n_recoveries"],
                      "source_verified_here":False}))

if __name__=="__main__":
    try:main()
    except (ValueError,OSError,KeyError,TypeError,json.JSONDecodeError) as e:
        print("UNCHECKABLE:",e,file=sys.stderr);sys.exit(2)
