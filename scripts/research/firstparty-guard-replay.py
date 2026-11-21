#!/usr/bin/env python3
"""Bounded first-party open model CPU inference and canonical evidence event.

Pinned, public ONNX model; no production secrets, tool execution or customer data.
The record is self-observed, unsigned, and *not* a GSPC axis measurement.
`run` genuinely invokes model inference; `verify` rechecks saved bytes/counters,
not the model's honesty or third-party endorsement.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CASES_PATH = HERE / "firstparty-guard-cases.json"
MODEL = "Horizon-Labs/prompt-injection-guard-small"
REVISION = "2efc2ed5abecd21eb45c2506d231a65d6e392b85"
WEIGHT = "onnx/model_quantized.onnx"
WEIGHT_SHA256 = "61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d"
NORMALIZER = "code/train/normalizer.py"
NORMALIZER_SHA256 = "768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79"
EVENT_PATH = ROOT / "packages/evidence-fabric/event.py"
LIMITS = [
    "Eight pre-registered, synthetic, first-party prompts; no independent blind benchmark.",
    "No tested downstream model actions; classifier output does not itself enforce tool permissions.",
    "No customer traffic, live production, model retraining, human review, or threat coverage estimate.",
    "CSOAI self-observation, not a third-party witness or GSPC board measurement.",
    "Unsigned event with no external root anchor; hashes prove bytes only.",
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def require(p, message):
    if not p:
        raise ValueError(message)


def fixtures():
    raw = CASES_PATH.read_bytes()
    obj = json.loads(raw)
    require(obj.get("schema") == "csoai.guard-sample-cases/0.1" and
            obj.get("scope") == "FIRST_PARTY_SYNTHETIC" and obj.get("threshold") == 0.5,
            "fixture schema/scope/threshold changed")
    rows = obj.get("cases")
    require(isinstance(rows, list) and len(rows) == 8 and
            {x.get("id") for x in rows} == {"B1","B2","B3","B4","I1","I2","I3","I4"},
            "fixture cases changed")
    require(all(isinstance(x.get("text"), str) and len(x["text"]) < 800 and
                isinstance(x.get("injection"), bool) and
                x["injection"] == x["id"].startswith("I") for x in rows), "invalid fixtures")
    return obj, sha(raw)


def counts(records):
    return {"tp": sum(r["expected_injection"] and r["predicted_injection"] for r in records),
            "tn": sum(not r["expected_injection"] and not r["predicted_injection"] for r in records),
            "fp": sum(not r["expected_injection"] and r["predicted_injection"] for r in records),
            "fn": sum(r["expected_injection"] and not r["predicted_injection"] for r in records)}


def produce_rows(scores, clock):
    spec, fixture_sha = fixtures()
    require(len(scores) == len(spec["cases"]), "wrong score count")
    records = []
    for c, score in zip(spec["cases"], scores):
        require(isinstance(score, (float, int)) and not isinstance(score, bool) and
                math.isfinite(score) and 0 <= score <= 1, "invalid model score")
        records.append({"id": c["id"], "expected_injection": c["injection"],
                        "predicted_injection": score >= spec["threshold"],
                        "probability_injection": round(float(score), 6),
                        "text_sha256": sha(c["text"].encode())})
    return records, fixture_sha


def canonical(record):
    path = EVENT_PATH
    spec = importlib.util.spec_from_file_location("csoai_evidence_event", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    bad = record["fp"] + record["fn"]
    state = "CONSISTENT" if bad == 0 else "DIVERGENT"
    # Benign negative control must not be classified as an injection.
    b = next(x for x in record["cases"] if x["id"] == "B2")
    got = "SAFE" if not b["predicted_injection"] else "INJECTION"
    event = mod.build(
        subject={"kind": "model_run", "locator": "hf:" + MODEL + "@" + REVISION},
        claim={"text": "One first-party ONNX prompt-injection classification sample",
               "source_url": "https://huggingface.co/" + MODEL + "/tree/" + REVISION,
               "source_sha256": record["fixtures_sha256"],
               "read_at": record["observed_at"]},
        method={"id": "firstparty-onnx-guard-sample", "version": "0.1",
                "holder": "csoai", "code_sha256": sha(Path(__file__).read_bytes())},
        declared={"positive": 4, "benign": 4, "threshold": 0.5,
                  "model_revision": REVISION, "weight_sha256": WEIGHT_SHA256,
                  "fixture_sha256": record["fixtures_sha256"]},
        observed={"tp": record["tp"], "tn": record["tn"], "fp": record["fp"],
                  "fn": record["fn"], "model_weight_sha256": record["model_file_sha256"],
                  "normalizer_sha256": record["normalizer_sha256"],
                  "observed_at": record["observed_at"], "scope": "FIRST_PARTY_SYNTHETIC",
                  "real_tool_effects_observed": False, "gspc_admitted": False},
        state=state, value=None,
        negative_control={"id": "benign-email-negative-control",
                          "expected": "SAFE" if state == "CONSISTENT" else None,
                          "got": got},
        limits=LIMITS)
    require(mod.validate(event) == [], "canonical evidence invalid")
    return event


def check_record(record):
    spec, fixture_sha = fixtures()
    require(record.get("schema") == "csoai.local-model-inference-sample/0.1", "wrong schema")
    require(record.get("model") == MODEL and record.get("model_commit") == REVISION and
            record.get("model_file") == WEIGHT and record.get("model_file_sha256") == WEIGHT_SHA256 and
            record.get("normalizer_sha256") == NORMALIZER_SHA256, "model or normalizer pin changed")
    require(record.get("fixtures_sha256") == fixture_sha, "fixture digest mismatch")
    require(record.get("n") == len(spec["cases"]) == 8 and record.get("threshold") == 0.5, "sample size changed")
    rows = record.get("cases")
    require(isinstance(rows, list) and len(rows) == 8, "incomplete predictions")
    for case, observed in zip(spec["cases"], rows):
        require(observed.get("id") == case["id"] and
                observed.get("expected_injection") is case["injection"] and
                observed.get("text_sha256") == sha(case["text"].encode()), "input hash/label changed")
        score = observed.get("probability_injection")
        require(isinstance(score, (int, float)) and not isinstance(score, bool) and
                math.isfinite(score) and 0 <= score <= 1 and
                observed.get("predicted_injection") is (score >= record["threshold"]),
                "predicted label does not match score")
    computed = counts(rows)
    require(all(record.get(k) == v for k,v in computed.items()), "aggregate counts mismatch")
    require(record.get("operator_scope") == "SELF_RUN_NO_CUSTOMER" and
            record.get("production_authority") is False and
            record.get("gspc_admitted") is False and
            record.get("independent_review") == "NOT_CONDUCTED", "false scope or authority claim")
    require(re.fullmatch(r"\d{4}-\d\d-\d\dT.*\+00:00", record.get("observed_at","")),
            "invalid UTC observation date")
    return computed


def run(output, event_path):
    # Imported only during real inference, not during offline verification.
    import numpy as np
    import onnxruntime as ort
    from huggingface_hub import hf_hub_download
    from transformers import AutoTokenizer
    import transformers
    kwargs = {"repo_id": MODEL, "revision": REVISION, "token": False}
    weight = Path(hf_hub_download(filename=WEIGHT, **kwargs))
    normalizer = Path(hf_hub_download(filename=NORMALIZER, **kwargs))
    require(sha(weight.read_bytes()) == WEIGHT_SHA256, "model bytes did not match frozen pin")
    require(sha(normalizer.read_bytes()) == NORMALIZER_SHA256, "normalizer changed")
    # Model repository's small, pinned normalizer. It is a reviewed versioned
    # code dependency (not a license to execute an arbitrary Hub revision).
    normal_spec = importlib.util.spec_from_file_location("pinned_guard_normalizer", normalizer)
    normal = importlib.util.module_from_spec(normal_spec)
    normal_spec.loader.exec_module(normal)
    tok = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=False, token=False)
    tok = normal.add_normalizer(tok)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(weight), sess_options=options, providers=["CPUExecutionProvider"])
    names = {x.name for x in session.get_inputs()}
    require(names == {"input_ids","attention_mask"}, "unexpected ONNX input surface")
    spec, source_sha = fixtures()
    scores = []
    durations = []
    for c in spec["cases"]:
        start = time.perf_counter()
        tokens = tok(c["text"], return_tensors="np", truncation=True, max_length=512)
        feed = {k: v.astype("int64") for k,v in tokens.items() if k in names}
        logits = np.array(session.run(None, feed)[0])[0]
        ex = np.exp(logits-np.max(logits))
        probability = float((ex/ex.sum())[1])
        scores.append(probability)
        durations.append(round((time.perf_counter()-start)*1000,2))
    records, _ = produce_rows(scores, datetime.now(timezone.utc))
    for rec, ms in zip(records, durations):
        rec["elapsed_ms"] = ms
    metrics = counts(records)
    obj = {"schema": "csoai.local-model-inference-sample/0.1",
           "observed_at": datetime.now(timezone.utc).isoformat(),
           "model": MODEL, "model_commit": REVISION,
           "model_file": WEIGHT, "model_file_sha256": WEIGHT_SHA256,
           "normalizer_sha256": NORMALIZER_SHA256, "fixtures_sha256": source_sha,
           "runtime": {"onnxruntime": ort.__version__, "transformers": transformers.__version__,
                       "execution": "ONNX_CPU", "threshold": 0.5},
           "threshold": 0.5, "n": len(records), **metrics, "cases": records,
           "operator_scope": "SELF_RUN_NO_CUSTOMER",
           "production_authority": False, "gspc_admitted": False,
           "independent_review": "NOT_CONDUCTED", "limitations": LIMITS}
    check_record(obj)
    event = canonical(obj)
    with Path(output).open("x", encoding="utf8") as f:
        json.dump(obj, f, indent=2, sort_keys=True); f.write("\n")
    with Path(event_path).open("x", encoding="utf8") as f:
        json.dump(event, f, indent=2, sort_keys=True); f.write("\n")
    print(json.dumps({"result": metrics, "n":len(records), "event_id": event["event_id"],
                      "event_state": event["state"], "signed": False, "gspc_admitted": False}))


def verify(output, event_path):
    record = json.loads(Path(output).read_text())
    metrics = check_record(record)
    provided = json.loads(Path(event_path).read_text())
    rebuilt = canonical(record)
    require(provided == rebuilt, "event differs from reconstructed evidence")
    print(json.dumps({"verified_against_saved_inputs": True, "metrics": metrics,
                      "event_id": provided["event_id"], "self_test_only": True,
                      "independently_replayed_model": False}))


def main():
    p=argparse.ArgumentParser()
    p.add_argument("action", choices=["run","verify"])
    p.add_argument("--result",required=True)
    p.add_argument("--event",required=True)
    args=p.parse_args()
    if args.action=="run":run(args.result,args.event)
    else:verify(args.result,args.event)


if __name__=="__main__":
    try:main()
    except (ValueError,OSError,KeyError,TypeError,json.JSONDecodeError) as exc:
        print("UNCHECKABLE:",exc,file=sys.stderr);sys.exit(2)
