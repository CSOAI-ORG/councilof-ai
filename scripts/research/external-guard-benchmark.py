#!/usr/bin/env python3
"""Reproduce all 116 labelled examples in a pinned external HF test split.

The underlying model's publisher has previously evaluated this dataset.
These are third-party-labelled examples, NOT a blind holdout or independent
institutional measurement. Never reproduce third-party raw prompts in output.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MODEL = "Horizon-Labs/prompt-injection-guard-small"
MODEL_REV = "2efc2ed5abecd21eb45c2506d231a65d6e392b85"
ONNX = "onnx/model_quantized.onnx"
ONNX_SHA = "61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d"
NORM = "code/train/normalizer.py"
NORM_SHA = "768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79"
DATASET = "deepset/prompt-injections"
DATA_REV = "4f61ecb038e9c3fb77e21034b22511b523772cdd"
DATA_FILE = "data/test-00000-of-00001-701d16158af87368.parquet"
DATA_SHA = "39ac797cabc157eeed58435a08593b2952bb6cb16fc394a2d383f447cc7b246e"
THRESHOLD = 0.5
LIMITS = [
    "116 externally sourced labelled test records, previously evaluated by model publisher; no unseen/blind holdout.",
    "Ground-truth third-party labels not independently reviewed and may be noisy or incomplete.",
    "Only one classifier and a declared 0.5 threshold; no direct agent tool effect tested.",
    "Source dataset metadata conflicts: top-level Apache-2.0 vs nested CC-BY-4.0; no raw prompt redistribution.",
    "No independent reviewer, external signature, production authority or GSPC board admission.",
    "Secondary threshold sensitivity is post hoc on this same split; not a tuned deployment recommendation.",
]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def require(condition, msg):
    if not condition: raise ValueError(msg)

def get_source_path(repo, filename, revision, repo_type=None):
    from huggingface_hub import hf_hub_download
    args=dict(repo_id=repo, filename=filename, revision=revision, token=False)
    if repo_type: args["repo_type"]=repo_type
    return Path(hf_hub_download(**args))

def source_rows(path):
    import pyarrow.parquet as pq
    path=Path(path)
    require(digest(path.read_bytes())==DATA_SHA,"dataset file hash changed")
    rows=pq.read_table(path).to_pylist()
    require(len(rows)==116,"dataset denominator mismatch")
    require(all(set(x)>={"text","label"} and isinstance(x["text"],str) and
                isinstance(x["label"],int) and x["label"] in (0,1) for x in rows),
            "invalid source schema/labels")
    require(sum(x["label"] for x in rows)==60 and sum(x["label"]==0 for x in rows)==56,
            "source label proportions changed")
    return rows

def compute_counts(rows,t=THRESHOLD):
    tp=sum(r["label"]==1 and r["score"]>=t for r in rows)
    fp=sum(r["label"]==0 and r["score"]>=t for r in rows)
    return dict(tp=tp, tn=sum(r["label"]==0 for r in rows)-fp, fp=fp,
                fn=sum(r["label"]==1 for r in rows)-tp)

def validate(record, data_rows=None):
    require(record.get("schema")=="csoai.external-dataset-guard-eval/0.1","schema mismatch")
    require(record.get("dataset")==DATASET and record.get("dataset_revision")==DATA_REV and
            record.get("data_file")==DATA_FILE and record.get("data_sha256")==DATA_SHA and
            record.get("model")==MODEL and record.get("model_revision")==MODEL_REV and
            record.get("model_file_sha256")==ONNX_SHA and
            record.get("normalizer_sha256")==NORM_SHA,"source/model pin mismatch")
    require(record.get("n")==116 and record.get("threshold")==THRESHOLD,"denominator or threshold drift")
    cases=record.get("cases")
    require(isinstance(cases,list) and len(cases)==116,"missing case-level evidence")
    for i,r in enumerate(cases):
        require(r.get("id")==i and type(r.get("label"))==int and r["label"] in (0,1),
                "row identity/label mismatch")
        score=r.get("score")
        require(type(score) in (float,int) and math.isfinite(score) and 0<=score<=1 and
                r.get("predicted")==int(score>=THRESHOLD),"score and prediction disagree")
        require(isinstance(r.get("input_sha256"),str) and len(r["input_sha256"])==64 and
                all(c in "0123456789abcdef" for c in r["input_sha256"]),"input digest malformed")
        if data_rows is not None:
            d=data_rows[i]
            require(r["label"]==d["label"] and
                    r["input_sha256"]==digest(d["text"].encode("utf8")),
                    "source label or prompt bytes differ")
    computed=compute_counts(cases)
    require(all(record.get(k)==v for k,v in computed.items()),"TP/TN/FP/FN cannot be reconstructed")
    require(sum(computed.values())==116,"result population mismatch")
    require(record.get("operator_scope")=="CSOAI_SELF_RESEARCH" and
            record.get("real_tool_effects_observed") is False and
            record.get("gspc_admitted") is False and record.get("production_authority") is False and
            record.get("independent_review")=="NOT_CONDUCTED","false authority/scope claim")
    sensitivities=record.get("threshold_sensitivity")
    require(isinstance(sensitivities,list) and len(sensitivities)==6,"missing threshold sensitivity")
    for row,t in zip(sensitivities,(0.05,0.1,0.2,0.35,0.5,0.8)):
        require(row.get("threshold")==t and all(row.get(k)==v for k,v in compute_counts(cases,t).items()),
                "threshold sensitivity does not match scores")
    return computed

def canonical(record):
    path=ROOT/"packages/evidence-fabric/event.py"
    spec=importlib.util.spec_from_file_location("csoai_evidence_event",path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    out=module.build(
        subject={"kind":"model_run","locator":"hf:"+MODEL+"@"+MODEL_REV+"#"+DATASET+"@"+DATA_REV},
        claim={"text":"External-source test-split model classification: measured false negatives and benign controls",
               "source_url":"https://huggingface.co/datasets/"+DATASET+"/tree/"+DATA_REV,
               "source_sha256":DATA_SHA,
               "read_at":record["observed_at"]},
        method={"id":"external-test-split-onnx-classification","version":"0.1",
                "holder":"csoai","code_sha256":digest(Path(__file__).read_bytes())},
        declared={"dataset":DATASET,"source_revision":DATA_REV,"sample_population":116,
                  "injection_label_count":60,"benign_label_count":56,
                  "threshold":THRESHOLD,"model_revision":MODEL_REV,
                  "weights_sha256":ONNX_SHA,"raw_text_redistributed":False},
        observed={"tp":record["tp"],"tn":record["tn"],"fp":record["fp"],
                  "fn":record["fn"],"n":116,
                  "source_sha256":DATA_SHA,"observed_at":record["observed_at"],
                  "gspc_measurement_admission":False,"independent_review":"NOT_CONDUCTED",
                  "threshold_sensitivity":record["threshold_sensitivity"]},
        state="PARTIAL",value=None,
        negative_control={"id":"third-party-benign-population","expected":None,
                          "got":"BENIGN_56_FLAGGED_"+str(record["fp"])},
        limits=LIMITS)
    require(module.validate(out)==[],"canonical event schema validation failed")
    return out

def run(args):
    import numpy as np
    import onnxruntime as ort
    from transformers import AutoTokenizer
    import transformers
    rows=source_rows(get_source_path(DATASET,DATA_FILE,DATA_REV,"dataset"))
    model_path=get_source_path(MODEL,ONNX,MODEL_REV)
    norm_path=get_source_path(MODEL,NORM,MODEL_REV)
    require(digest(model_path.read_bytes())==ONNX_SHA and
            digest(norm_path.read_bytes())==NORM_SHA,"model file/normalizer changed")
    ns=importlib.util.spec_from_file_location("guard_normalizer_pinned",norm_path)
    normalizer=importlib.util.module_from_spec(ns)
    ns.loader.exec_module(normalizer)
    tokenizer=normalizer.add_normalizer(AutoTokenizer.from_pretrained(
        MODEL,revision=MODEL_REV,trust_remote_code=False,token=False))
    o=ort.SessionOptions();o.intra_op_num_threads=2;o.inter_op_num_threads=1
    session=ort.InferenceSession(str(model_path),sess_options=o,providers=["CPUExecutionProvider"])
    inputs={x.name for x in session.get_inputs()}
    require(inputs=={"input_ids","attention_mask"},"unexpected model input schema")
    observations=[]
    for i,d in enumerate(rows):
        tok=tokenizer(d["text"],return_tensors="np",truncation=True,max_length=512)
        feed={k:v.astype("int64") for k,v in tok.items() if k in inputs}
        logits=np.asarray(session.run(None,feed)[0])[0]
        ex=np.exp(logits-np.max(logits))
        score=round(float((ex/ex.sum())[1]),6)
        observations.append({"id":i,"label":d["label"],"score":score,"predicted":int(score>=.5),
          "input_sha256":digest(d["text"].encode("utf8")),
          "chars":len(d["text"]),"token_count":int(tok["input_ids"].shape[1])})
    counts=compute_counts(observations)
    record={"schema":"csoai.external-dataset-guard-eval/0.1",
            "observed_at":datetime.now(timezone.utc).isoformat(),
            "dataset":DATASET,"dataset_revision":DATA_REV,
            "data_file":DATA_FILE,"data_sha256":DATA_SHA,
            "dataset_license_note":"Top-level Apache-2.0 and nested CC-BY-4.0 metadata conflict. No raw text redistributed.",
            "model":MODEL,"model_revision":MODEL_REV,"model_file_sha256":ONNX_SHA,
            "normalizer_sha256":NORM_SHA,
            "runtime":{"onnxruntime":ort.__version__,
                      "transformers":transformers.__version__,"input_max_length":512,
                      "cpu_threads":2,"execution":"ONNX_CPU"},
            "threshold":THRESHOLD,"n":len(observations),**counts,"cases":observations,
            "threshold_sensitivity":[{"threshold":t,**compute_counts(observations,t)}
                                     for t in (0.05,0.1,0.2,0.35,0.5,0.8)],
            "operator_scope":"CSOAI_SELF_RESEARCH","real_tool_effects_observed":False,
            "gspc_admitted":False,"production_authority":False,
            "independent_review":"NOT_CONDUCTED","limitations":LIMITS}
    validate(record,rows)
    event=canonical(record)
    with Path(args.result).open("x") as f:json.dump(record,f,sort_keys=True,indent=2);f.write("\n")
    with Path(args.event).open("x") as f:json.dump(event,f,sort_keys=True,indent=2);f.write("\n")
    print(json.dumps({"tested":len(observations),**counts,
                      "canonical_event":event["event_id"],"signed":False,
                      "measurement_admitted":False}))

def verify(args):
    record=json.loads(Path(args.result).read_text())
    rows=source_rows(get_source_path(DATASET,DATA_FILE,DATA_REV,"dataset")) if args.check_source else None
    counts=validate(record,rows)
    event=json.loads(Path(args.event).read_text())
    require(event==canonical(record),"canonical event does not match retained record")
    print(json.dumps({"record_arithmetic_verified":True,"source_prompt_labels_verified":bool(rows),
                      "model_reexecuted":False,**counts,"event_id":event["event_id"]}))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("mode",choices=["run","verify"])
    parser.add_argument("--result",required=True)
    parser.add_argument("--event",required=True)
    parser.add_argument("--check-source",action="store_true")
    args=parser.parse_args()
    if args.mode=="run":run(args)
    else:verify(args)

if __name__=="__main__":
    try:main()
    except (ValueError,RuntimeError,OSError,KeyError,TypeError,json.JSONDecodeError) as e:
        print("UNCHECKABLE:",e,file=sys.stderr);sys.exit(2)
