#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Evidence-conditioned, nonvoting research referee for PUBLIC GSPC board claims.

Checks a preregistered aggregate rule over independently parsed public board
bytes. Does not grade GSPC tasks, authenticate the publisher, call real council
agents, approve humans or confer BFT/measurement authority.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import urllib.request

SCHEMA="csoai.gspc-readonly-rule-referee/0.1"
RULE_ID="gspc-public-axis-count-v0.1"
FIELDS=("axes","measured_axes","model_comparison_axes","separated_leaders","ties","untested")
CANONICAL_SOURCE="https://councilof.ai/api/gspc"
RULE_SPEC={
    "id":RULE_ID,
    "inputs":"public GSPC axes JSON schema version and unique axis entries",
    "purpose":"verify a claim about the publisher's reported row counts, not truth",
    "fields":list(FIELDS),
    "counts":"sum exact JSON axis row predicates after uniqueness and status checks",
    "negative_control":"false numerical claim must be DISSENT even with 12 advisory votes",
    "source_authentication":"not established by a network GET or hash alone",
}
def canonical(x):
    return json.dumps(x,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode("utf-8")
def sha(raw):
    return hashlib.sha256(raw).hexdigest()
RULE_SHA256=sha(canonical(RULE_SPEC))


def aggregates(raw):
    if not isinstance(raw,bytes) or not 0 < len(raw) <= 2_000_000:
        raise ValueError("invalid bounded board source")
    source=json.loads(raw)
    if not isinstance(source,dict) or not str(source.get("schema","")).startswith("csoai.gspc-axes/"):
        raise ValueError("unexpected source schema")
    axes=source.get("axes")
    if not isinstance(axes,list):
        raise ValueError("missing axes")
    seen=set()
    kinds={"model-comparison","deterministic-facts","measured-subject"}
    states={"MEASURED","UNMEASURED","UNCHECKABLE"}
    seps={"SEPARATED","TIE","UNTESTED",None}
    for a in axes:
        if not isinstance(a,dict) or not isinstance(a.get("axis"),str) or not a["axis"] or a["axis"] in seen:
            raise ValueError("invalid or duplicate public axis")
        seen.add(a["axis"])
        if a.get("kind") not in kinds or a.get("status") not in states:
            raise ValueError("unknown public kind or measurement status")
        if a.get("separation") not in seps:
            raise ValueError("invalid separation state")
        if a["kind"]!="model-comparison" and a.get("separation") is not None:
            raise ValueError("separation improperly applied to nonmodel axis")
    values={
        "axes":len(axes),
        "measured_axes":sum(a["status"]=="MEASURED" for a in axes),
        "model_comparison_axes":sum(a["kind"]=="model-comparison" for a in axes),
        "separated_leaders":sum(a.get("separation")=="SEPARATED" for a in axes),
        "ties":sum(a.get("separation")=="TIE" for a in axes),
        "untested":sum(a.get("separation")=="UNTESTED" for a in axes),
    }
    return values


def judge(raw,proposal,advisory=None):
    """CANNOT_REPRODUCE for invalid inputs; DISSENT for falsified numeric claim."""
    if advisory is None:
        advisory={"declared_votes":0,"advisory_concur":0}
    # Advisory votes are explicitly UNAUTHENTICATED; never influence verdict.
    if (not isinstance(advisory,dict) or set(advisory)!={"declared_votes","advisory_concur"} or
        type(advisory["declared_votes"]) is not int or type(advisory["advisory_concur"]) is not int or
        not 0<=advisory["advisory_concur"]<=advisory["declared_votes"]<=12):
        raise ValueError("invalid synthetic/advisory vote totals")
    receipt={
      "schema":SCHEMA,
      "rule_id":RULE_ID,
      "rule_sha256":RULE_SHA256,
      "source_sha256":sha(raw) if isinstance(raw,bytes) else None,
      "source_authentication":"NOT_ESTABLISHED",
      "panel":"NOT_CONVENED",
      "independent_reviewers":0,
      "advisory_positions_unverified":advisory,
      "human_approval":"NOT_ESTABLISHED",
      "new_gspc_measurement":False,
      "ruling_authority":"NONE",
    }
    try:
        if (not isinstance(proposal,dict) or set(proposal)!={"rule_id","rule_sha256","source_sha256","field","asserted"} or
            proposal["rule_id"]!=RULE_ID or proposal["rule_sha256"]!=RULE_SHA256 or
            proposal["source_sha256"]!=receipt["source_sha256"] or
            proposal["field"] not in FIELDS or type(proposal["asserted"]) is not int or proposal["asserted"]<0):
            raise ValueError("unregistered/invalid rule or source binding")
        counts=aggregates(raw)
        observed=counts[proposal["field"]]
        match=observed==proposal["asserted"]
        receipt.update({
          "field":proposal["field"],
          "asserted":proposal["asserted"],
          "derived_public_source_value":observed,
          "verdict":"CONCUR" if match else "DISSENT",
          "reason_code":"SOURCE_COUNT_MATCH" if match else "ASSERTION_CONTRADICTS_SOURCE",
        })
    except (ValueError,KeyError,TypeError,UnicodeDecodeError,OverflowError,json.JSONDecodeError) as e:
        receipt.update({
          "field":proposal.get("field") if isinstance(proposal,dict) and isinstance(proposal.get("field"),str) else None,
          "asserted":None,"derived_public_source_value":None,
          "verdict":"CANNOT_REPRODUCE",
          "reason_code":"INPUT_SOURCE_OR_RULE_NOT_QUALIFIED",
        })
    receipt["result_sha256"]=sha(canonical(receipt))
    return receipt


def get_public():
    req=urllib.request.Request(CANONICAL_SOURCE,headers={"User-Agent":"CSOAI-public-referee-study/0.1"})
    with urllib.request.urlopen(req,timeout=20) as r:
        if r.status!=200 or not r.headers.get("Content-Type","").startswith("application/json"):
            raise ValueError("public source unavailable or not JSON")
        raw=r.read(2_000_001)
    if len(raw)>2_000_000:
        raise ValueError("public board too large")
    return raw


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--public",action="store_true",help="fetch publisher's public board read-only")
    p.add_argument("--field",choices=FIELDS,required=True)
    p.add_argument("--asserted",type=int,required=True)
    p.add_argument("--advisory-concur",type=int,default=0)
    a=p.parse_args()
    if not a.public:
        p.error("public read-only mode is required")
    raw=get_public()
    prop={"rule_id":RULE_ID,"rule_sha256":RULE_SHA256,"source_sha256":sha(raw),
          "field":a.field,"asserted":a.asserted}
    result=judge(raw,prop,{"declared_votes":12,"advisory_concur":a.advisory_concur})
    print(json.dumps(result,indent=2,sort_keys=True))
    if result["verdict"]=="CANNOT_REPRODUCE":
        raise SystemExit(2)


if __name__=="__main__":
    main()
