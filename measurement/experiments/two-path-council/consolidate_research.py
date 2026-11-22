#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""GSPC × MEOK research-rail consolidation: read-only, state-preserving.

Compose heterogeneous existing experiment reports while forbidding promotion of
synthetic, public reanalysis or historical outputs into a new live GSPC score.
This is NOT a new canonical evidence schema or a signed evidence event.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

SCHEMA="csoai.gspc-hybrid-research-index/0.1"
# This mapping deliberately has no measured/certified/approved state.
ACCEPT={
 "two_path":("csoai.gspc-two-path-council/0.1","evidence_state","SYNTHETIC"),
 "historical":("csoai.gspc-historical-12-voter-panel/0.1","evidence_state","RETROSPECTIVE_PUBLIC_REUSE"),
 "fact":("csoai.gspc-public-fact-ontology-audit/0.1","status","RECOMPUTED_PUBLIC_PROJECTION"),
 "trajectory":("csoai.meok-trajectory-control-research/0.1","evidence_state","SYNTHETIC"),
 "blind":("csoai.blind-target-control/0.1","state","SYNTHETIC"),
 "jspace":("csoai.jspace-public-feature-audit/0.1","state","PUBLIC_THIRD_PARTY_REANALYSIS"),
}


def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":")).encode()

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def validate_record(kind, report):
    if kind not in ACCEPT or not isinstance(report,dict):
        raise ValueError("unsupported kind or record")
    schema,field,state=ACCEPT[kind]
    if report.get("schema")!=schema or report.get(field)!=state:
        raise ValueError(f"{kind}: schema or evidence-state mismatch; no silent promotion")
    if kind=="fact" and (report.get("errors") or report.get("cell_count_mismatches",1)!=0):
        raise ValueError("public fact replay failed")
    if kind=="blind" and report.get("randomisation")!="deterministic synthetic PRNG":
        raise ValueError("unverified live blind targets cannot be composed as synthetic")
    if kind=="historical" and report.get("not_blind") is not True:
        raise ValueError("historical public bank must declare not blind")
    if kind=="jspace" and report.get("source_revision")!="b176b283b82f5b7fa786bc0c67842299cadf1803":
        raise ValueError("unexpected third-party J-space source revision")
    if kind=="two_path" and report.get("independent_referee_established") is not False:
        raise ValueError("unsupported independent referee claim")
    if kind=="trajectory" and report.get("not_live_agent") is not True:
        raise ValueError("unsupported live-agent claim")
    if "receipt_sha256" in report or "report_sha256" in report:
        key="receipt_sha256" if "receipt_sha256" in report else "report_sha256"
        claimed=report[key]
        rest={k:v for k,v in report.items() if k!=key}
        if claimed!=digest(canonical(rest)):
            raise ValueError(f"{kind}: self-reported receipt digest mismatch")
    return {"kind":kind,"schema":schema,"state":state}


def compose(reports):
    if set(reports)!=set(ACCEPT):
        raise ValueError(f"need exactly six supported kinds: {sorted(ACCEPT)}")
    entries=[]
    for kind,record in sorted(reports.items()):
        checked=validate_record(kind,record)
        entries.append({
            **checked,
            "report_sha256":digest(canonical(record)),
            "original_receipt_sha256":record.get("receipt_sha256",record.get("report_sha256")),
            "source_identity":record.get("source_revision"),
        })
    result={
        "schema":SCHEMA,
        "state":"RESEARCH_COMPOSITE_UNVERIFIED",
        "gspc_board_mutations":0,
        "meok_policy_mutations":0,
        "independent_external_verifications":0,
        "n_entries":len(entries),
        "entries":entries,
        "assertion_boundary":[
            "Six report types joined, NOT six independent scientific confirmations",
            "Synthetic controls remain synthetic; archived public model outputs remain public",
            "No consciousness or extrasensory-access conclusion follows from this index",
            "Candidate only: existing csoai.evidence-event/0.1 admission and HITL policy remain separate",
        ],
    }
    result["index_sha256"]=digest(canonical(result))
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report",action="append",required=True,metavar="KIND=PATH")
    args=parser.parse_args()
    reports={}
    for item in args.report:
        if "=" not in item:
            parser.error("report must be KIND=PATH")
        kind,path=item.split("=",1)
        if kind in reports or kind not in ACCEPT:
            parser.error("duplicate/unsupported report kind")
        file=Path(path)
        if file.is_symlink() or not file.is_file() or file.stat().st_size>2000000:
            parser.error("report must be a regular bounded file, not a symlink")
        reports[kind]=json.loads(file.read_text())
    print(json.dumps(compose(reports),indent=2,sort_keys=True))


if __name__=="__main__":
    main()
