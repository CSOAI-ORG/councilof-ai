#!/usr/bin/env python3
"""Real open-weight classifier false-alarm measurement on NotInject (339 benign prompts).
All source parquet files must match SHA256; observed scores are not a production
guard decision, legal determination, independent benchmark or GSPC admission.
"""
import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime,timezone
import importlib.util

ROOT=Path(__file__).resolve().parent
SOURCES={
    "NotInject_one":"5b1d3a8ec341205305efd8c6d2cabeb5ba0f594dd8726b08ee7fde1a46ddc6ec",
    "NotInject_two":"a5a8c1b3b851b0b5acc3b6caf8bfee26d7da631b2967dd31ca90358df8883feb",
    "NotInject_three":"d5c685b123570c092a0f374ba6bdf324b2026d905a2751a243eb2bb360d411a8",
}
REV="847ae76cf8fea5ed325429e569ae8cfef022d2e0"
DATASET="leolee99/NotInject"
MODEL_REV="2efc2ed5abecd21eb45c2506d231a65d6e392b85"
MODEL_SHA="61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d"

def get_inference():
    spec=importlib.util.spec_from_file_location("turkish_guard_pinned", ROOT/"turkish_guard_observed.py")
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def read_rows(folder):
    import pyarrow.parquet as pq
    sections=[]
    for name,pinned in SOURCES.items():
        data=(Path(folder)/(name+".parquet")).read_bytes()
        if hashlib.sha256(data).hexdigest()!=pinned:raise ValueError("source parquet drift for "+name)
        rows=pq.read_table(Path(folder)/(name+".parquet")).to_pylist()
        if len(rows)!=113 or any(not isinstance(row.get("prompt"),str) or not row["prompt"] for row in rows):
            raise ValueError("unexpected NotInject source schema or row count")
        sections.append((name,[{"text":row["prompt"],"label":0} for row in rows]))
    return sections

def build(sections,model_dir):
    guard=get_inference()
    if guard.MODEL_SHA!=MODEL_SHA:raise ValueError("weights pin drift")
    cases=[]
    source_stats={}
    total_ms=0
    for name,rows in sections:
        score,ms=guard.eval_model(rows,model_dir,batch_size=16)
        n=len(score);fp=sum(x["prediction"] for x in score)
        cases.extend({"source":name,"i":x["i"],"prediction":x["prediction"],"score":x["score"],"text_sha256":x["text_sha256"]} for x in score)
        source_stats[name]={"n":n,"false_alarms":fp,"false_alarm_rate":round(fp/n,6),"wilson95":guard.wilson(fp,n)}
        total_ms+=ms
    if len(cases)!=339:raise ValueError("missing hard negatives")
    c=hashlib.sha256(json.dumps(cases,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    fp=sum(x["prediction"] for x in cases)
    return {
      "schema":"csoai.notinject-hard-negative-observation/0.1",
      "realm":"OBSERVED_MODEL_OUTPUTS_ONLY","observed_at":datetime.now(timezone.utc).isoformat(),
      "dataset":DATASET,"dataset_revision":REV,"parquet_sha256":SOURCES,
      "license":"MIT per dataset metadata; no raw prompts redistributed",
      "model":"Horizon-Labs/prompt-injection-guard-small",
      "model_revision":MODEL_REV,"weights_sha256":MODEL_SHA,
      "inference_method":"pinned scripts/research/turkish_guard_observed.py:eval_model",
      "threshold":0.5,"benign_count":339,"false_alarms":fp,
      "false_alarm_rate":round(fp/339,6),"false_alarm_wilson95":guard.wilson(fp,339),
      "subgroups":source_stats,
      "derived_case_metadata_sha256":c,"inference_ms_excluding_model_load":round(total_ms,1),
      "not_a_blind_holdout":True,"externally_adjudicated_labels":False,
      "direct_agent_effect_tested":False,"gspc_admitted":False,
      "external_recipient_accepted":False,
      "limits":[
        "Benign only, published hard negatives: no attack-recall denominator.",
        "Publisher-derived label assumptions are not independently adjudicated.",
        "Model may have evaluated or trained on comparable public prompts.",
        "No prompt text redistributed, no rights to imply vendor endorsement.",
        "Observed model classifications do not show production action refusal or human authorization."
      ]
    }

def main():
    arg=argparse.ArgumentParser()
    arg.add_argument("--data-dir",required=True)
    arg.add_argument("--model-dir",required=True)
    arg.add_argument("--output",required=True)
    v=arg.parse_args()
    result=build(read_rows(v.data_dir),v.model_dir)
    with open(v.output,"x",encoding="utf8") as f:json.dump(result,f,indent=2,sort_keys=True);f.write("\n")
    print(json.dumps({"rows":result["benign_count"],"false_alarms":result["false_alarms"],"false_alarm_rate":result["false_alarm_rate"],"subgroups":result["subgroups"]}))

if __name__=="__main__":main()
