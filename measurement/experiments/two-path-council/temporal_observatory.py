#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""GSPC read-only temporal observatory: publication events != new model measurements.

The output is an unsigned, non-authoritative research snapshot of a public board.
No personal data, private reports, user identifiers, model prompts or credentials
are read. A repeated GET cannot constitute a new benchmark run.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import urllib.request
from collections import Counter
from pathlib import Path

SCHEMA = "csoai.gspc-temporal-observer/0.1"
DELTA_SCHEMA = "csoai.gspc-temporal-diff/0.1"
BOARD = "https://councilof.ai/api/gspc"
VALID_KINDS = {"model-comparison", "deterministic-facts", "measured-subject"}
VALID_SEPARATIONS = {"SEPARATED", "TIE", "UNTESTED", None}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def iso_utc(value):
    if not isinstance(value, str):
        raise ValueError("snapshot timestamp required")
    parsed = dt.datetime.fromisoformat(value.replace("Z","+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timezone required")
    return parsed.astimezone(dt.timezone.utc).isoformat().replace("+00:00","Z")


def project(raw, observed_at):
    if not isinstance(raw, bytes) or len(raw) > 2_000_000 or not raw:
        raise ValueError("board bytes missing or too large")
    data = json.loads(raw)
    if not isinstance(data, dict) or not isinstance(data.get("axes"), list):
        raise ValueError("invalid board structure")
    if not str(data.get("schema", "")).startswith("csoai.gspc-axes/"):
        raise ValueError("unsupported source schema")
    axes={}
    for item in data["axes"]:
        if not isinstance(item,dict):
            raise ValueError("invalid axis")
        name,kind,family=item.get("axis"),item.get("kind"),item.get("family")
        if not isinstance(name,str) or not name or len(name)>128 or name in axes:
            raise ValueError("duplicate or invalid axis name")
        if kind not in VALID_KINDS or not isinstance(family,str) or not family:
            raise ValueError("invalid family or kind")
        status = item.get("status")
        if status not in ("MEASURED","UNMEASURED","UNCHECKABLE"):
            raise ValueError("unknown status")
        n=item.get("n")
        if type(n) is not int or n<0:
            raise ValueError("invalid sample count")
        sep=item.get("separation")
        if sep not in VALID_SEPARATIONS:
            raise ValueError("invalid separation state")
        if kind!="model-comparison" and sep is not None:
            raise ValueError("non-model axis cannot have model leaderboard separation")
        axes[name]={
            "family":family,
            "kind":kind,
            "status":status,
            "n":n,
            "separation":sep,
            "method_status":item.get("method_status"),
            # Fingerprint source timing/lineage fields, never turn retrieval into run time.
            "measurement_metadata_sha256":sha(canonical({
                k:item.get(k) for k in (
                    "measurement_time","facts_as_of","historical_measurement_record",
                    "bank_sha256","bank","model_hf_revision",
                ) if k in item
            })),
        }
    categories=Counter(a["kind"] for a in axes.values())
    out={
        "schema":SCHEMA,
        "state":"PUBLIC_SOURCE_OBSERVATION",
        "observed_at":iso_utc(observed_at),
        "source_url":BOARD,
        "source_schema":data["schema"],
        "source_bytes_sha256":sha(raw),
        "source_content_sha256":sha(canonical(data)),
        "n_axes":len(axes),
        "n_measured_declared":sum(a["status"]=="MEASURED" for a in axes.values()),
        "n_separated_model_axes":sum(a["separation"]=="SEPARATED" for a in axes.values()),
        "axis_kinds":dict(sorted(categories.items())),
        "axes":dict(sorted(axes.items())),
        "not_new_measurement":True,
        "no_human_outcome_derived":True,
        "limitations":[
            "Retrieval date is not the timestamp of a source evaluation",
            "Board states and n are publisher declarations, not independently graded facts",
            "No demographic, human-competence, user-outcome or causal inference",
            "Not a replacement for signature verification or the canonical GSPC grader",
        ],
    }
    out["receipt_sha256"]=sha(canonical(out))
    return out


def verify_snapshot(s):
    if not isinstance(s,dict) or s.get("schema")!=SCHEMA:
        raise ValueError("unrecognised snapshot schema")
    if s.get("not_new_measurement") is not True or s.get("no_human_outcome_derived") is not True:
        raise ValueError("unsafe snapshot claims")
    claim=s.get("receipt_sha256")
    if not isinstance(claim,str) or sha(canonical({k:v for k,v in s.items() if k!="receipt_sha256"}))!=claim:
        raise ValueError("snapshot checksum mismatch")
    iso_utc(s["observed_at"])
    if len(s.get("axes",{}))!=s.get("n_axes"):
        raise ValueError("snapshot axis count mismatch")


def compare(before, after):
    verify_snapshot(before)
    verify_snapshot(after)
    ta=dt.datetime.fromisoformat(after["observed_at"].replace("Z","+00:00"))
    tb=dt.datetime.fromisoformat(before["observed_at"].replace("Z","+00:00"))
    if ta<=tb:
        raise ValueError("comparison must move forward in observation time")
    old=before["axes"]
    new=after["axes"]
    created=sorted(set(new)-set(old))
    removed=sorted(set(old)-set(new))
    changed={}
    for axis in sorted(set(old)&set(new)):
        if old[axis]!=new[axis]:
            changed[axis]={k:{"before":old[axis].get(k),"after":new[axis].get(k)}
                for k in sorted(set(old[axis])|set(new[axis]))
                if old[axis].get(k)!=new[axis].get(k)}
    identical_source = before["source_content_sha256"]==after["source_content_sha256"]
    if identical_source and (created or removed or changed):
        raise ValueError("same source digest with contradictory projection")
    out={
        "schema":DELTA_SCHEMA,
        "state":"PUBLIC_BOARD_DIFF_NOT_BENCHMARK",
        "before_receipt":before["receipt_sha256"],
        "after_receipt":after["receipt_sha256"],
        "before_observed_at":before["observed_at"],
        "after_observed_at":after["observed_at"],
        "same_source_content":identical_source,
        "added_axis_names":created,
        "removed_axis_names":removed,
        "changed_axis_fields":changed,
        "n_changed_axes":len(changed),
        "new_model_runs_verified":None,
        "new_human_outcomes_verified":None,
        "independent_measurement_verified":False,
        "conclusion":("REOBSERVATION_NO_SOURCE_CHANGE" if identical_source else
                      "BOARD_SOURCE_CHANGED_FURTHER_EVIDENCE_REQUIRED"),
        "limitations":[
            "Only a source diff: no model invocation or customer outcome was observed",
            "Model/source changes and causal effects cannot be inferred from this diff",
            "GSPC signed-card, instrument and provenance checks are separate and required",
        ]
    }
    out["receipt_sha256"]=sha(canonical(out))
    return out


def capture(observed_at):
    req=urllib.request.Request(BOARD,headers={"User-Agent":"CSOAI-GSPC-temporal-observer/0.1"})
    with urllib.request.urlopen(req,timeout=20) as response:
        if response.status!=200 or not response.headers.get("content-type","").startswith("application/json"):
            raise ValueError("non-JSON/200 response")
        raw=response.read(2_000_001)
    return project(raw,observed_at)


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--capture",action="store_true",help="GET only; output aggregate research observation JSON")
    ap.add_argument("--compare",nargs=2,metavar=("EARLIER","LATER"))
    ap.add_argument("--observed-at",help="explicit UTC observation time with timezone")
    args=ap.parse_args()
    if args.capture == bool(args.compare):
        ap.error("choose exactly one of --capture or --compare")
    if args.capture:
        if not args.observed_at:
            ap.error("--observed-at is required; avoid fabricated times")
        data=capture(args.observed_at)
    else:
        a,b=(json.loads(Path(p).read_text()) for p in args.compare)
        data=compare(a,b)
    print(json.dumps(data,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
