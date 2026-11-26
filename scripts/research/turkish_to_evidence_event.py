#!/usr/bin/env python3
"""Package the ACTUAL source-scoped guard classification as an unsigned PARTIAL
evidence-event/0.1. It neither admits a GSPC measurement nor creates a signer.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
RECORD=ROOT/"docs/research/turkish-guard-observed-20261124/record.json"
EVENT_SOURCE=ROOT/"packages/evidence-fabric/event.py"

def build_observed_event(record):
    spec=importlib.util.spec_from_file_location("csoai_evidence_event",EVENT_SOURCE)
    fabric=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fabric)
    c=record["confusion"]
    if (record.get("schema")!="csoai.multilingual-guard-observation/0.1" or
        record.get("realm")!="OBSERVED_MODEL_OUTPUTS_ONLY" or
        record.get("rows")!=3372 or
        record.get("dataset_parquet_sha256")!="1f00c9a3639ec307538e45dcbd4a7397a908fea125c682156bfc3331b5fda5b5" or
        record.get("model_revision")!="2efc2ed5abecd21eb45c2506d231a65d6e392b85" or
        record.get("method_sha256")!="c2de570b4de2c2782d988bcb29f6839b8f91ba8ac80b3d0d022d2ba9ad344f39" or
        record.get("gspc_measurement_admitted") is not False or
        record.get("external_receiving_party_acceptance") is not False or
        record.get("model_production_prevention_proven") is not False or
        record.get("raw_prompts_redistributed") is not False or
        c!={"tp":255,"fn":62,"tn":2768,"fp":287}):
        raise ValueError("unqualified source, model, method, outcome or authority drift")
    event=fabric.build(
        subject={"kind":"model_run","locator":"hf:"+record["model"]+"@"+record["model_revision"]+
                  "#"+record["dataset"]+"@"+record["dataset_revision"]},
        claim={"text":"Publisher-labelled Turkish prompt-injection classifier outputs with observed missed attacks and benign false alarms",
               "source_url":"https://huggingface.co/datasets/"+record["dataset"],
               "source_sha256":record["dataset_parquet_sha256"],
               "read_at":record["observed_at"]},
        method={"id":"turkish-guard-pinned-onnx-classification",
                "version":"0.1","holder":"csoai",
                "code_sha256":record["method_sha256"]},
        declared={"sample_population":3372,
                  "positive_labelled":record["positive_labelled"],
                  "benign_labelled":record["benign_labelled"],
                  "dataset_revision":record["dataset_revision"],
                  "model_revision":record["model_revision"],
                  "threshold":record["threshold"],
                  "dataset_license":"other; no raw prompt redistribution"},
        observed={"tp":c["tp"],"fn":c["fn"],"tn":c["tn"],"fp":c["fp"],
                  "n":3372,"model_output_receipt_sha256":record["case_receipts_sha256"],
                  "recall":record["recall"],
                  "false_alarm_rate":record["false_alarm_rate"],
                  "observed_at":record["observed_at"],
                  "independent_review":"NOT_CONDUCTED",
                  "gspc_admitted":False,
                  "tool_effect_observed":False,
                  "receiving_party_accepted":False},
        state="PARTIAL",
        value=None,
        negative_control={"id":"source-declared-benign-task-instructions",
                          "expected":None,
                          "got":"239 of 1000 publisher-labelled benign task instructions flagged"},
        limits=[
          "Publisher source labels not independently adjudicated; potential model training overlap.",
          "Dataset licence field other: original prompts cannot be redistributed without rights review.",
          "Observed text classification only: no permitted tool execution, prevented attacker action or actual customer effect.",
          "No human approval, independent receiving-party acceptance, GSPC board admission, external signature or timestamp witness.",
        ])
    if fabric.validate(event):raise RuntimeError("canonical event validation failed")
    if event["signature"] is not None or event["anchors"]["ots"]!="none":
        raise RuntimeError("unsigned model output was promoted to signed evidence")
    return event

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--record",default=str(RECORD))
    p.add_argument("--output",required=True)
    a=p.parse_args()
    record=json.loads(Path(a.record).read_text())
    obj=build_observed_event(record)
    with open(a.output,"x",encoding="utf8") as f:
        json.dump(obj,f,indent=2,sort_keys=True,ensure_ascii=False)
        f.write("\n")
    print(json.dumps({"event_id":obj["event_id"],"state":obj["state"],"signed":False,"board_admitted":False}))

if __name__=="__main__":main()
