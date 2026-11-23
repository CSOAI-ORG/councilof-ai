#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Post-deploy PUBLIC correction readback: prove first observation, not publication time.

Verification input comes from the repository's existing, independent
scripts/verify_corrections_signature.py over EXACT SAME HTTP response bytes.
An HTTP GET after a successful deploy run only proves what the observer read.
A Merkle/OTS/Rekor witness timestamp cannot be silently assigned to a
correction without a verified inclusion proof and matching deployed bytes.
No signing keys, mutation, billing or private data.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any

SCHEMA="csoai.corrections-public-readback/0.1"
URL="https://councilof.ai/api/corrections"
SHA=re.compile(r"^[0-9a-f]{64}$")
HEX40=re.compile(r"^[0-9a-f]{40}$")


def canonical(obj: Any, ascii_only: bool=False)->bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":"),ensure_ascii=ascii_only).encode("utf-8")


def digest(obj: Any)->str:
    return hashlib.sha256(canonical(obj)).hexdigest()


def iso_now()->str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")


def utc(when: str)->str:
    if not isinstance(when,str):
        raise ValueError("observer UTC timestamp missing")
    parsed=dt.datetime.fromisoformat(when.replace("Z","+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("observer timestamp requires UTC timezone")
    return parsed.astimezone(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")


def classify(rows):
    if not isinstance(rows,list) or not rows:
        raise ValueError("no corrections")
    ids=set()
    summary=[]
    for r in rows:
        if not isinstance(r,dict) or not isinstance(r.get("id"),str) or not r["id"] or r["id"] in ids:
            raise ValueError("duplicate/invalid correction id")
        ids.add(r["id"])
        # ISO publication timestamps are publisher claims; do not reinterpret UNRECORDED.
        published=r.get("published_at")
        published_state=("UNRECORDED" if published in (None,"UNRECORDED","") else "SOURCE_DECLARED")
        summary.append({
            "id":r["id"],
            "record_sha256":digest(r),
            "source_published_at_state":published_state,
        })
    return sorted(summary,key=lambda x:x["id"])


def validate(response:dict, check:dict, observed_at:str, deploy_sha:str|None=None,
             deploy_run_url:str|None=None)->dict:
    observed_at=utc(observed_at)
    if not isinstance(response,dict) or response.get("schema")!="csoai.corrections/0.1":
        raise ValueError("wrong corrections source schema")
    if not isinstance(check,dict) or (check.get("state"),check.get("ed25519_verified"),
       check.get("content_id_matches"),check.get("key_pin_matches_did"))!=("VALID",True,True,True):
        raise ValueError("independent DID/Ed25519 verification must pass")
    unsigned=check.get("unsigned_wrapper_fields")
    if not isinstance(unsigned,list) or "signature" not in unsigned or len(set(unsigned))!=len(unsigned):
        raise ValueError("missing/ambiguous signature wrapper")
    signed_body={k:v for k,v in response.items() if k not in unsigned}
    signed_content_id=hashlib.sha256(canonical(signed_body,ascii_only=True)).hexdigest()
    signature=response.get("signature",{})
    att=signature.get("attestation",{}) if isinstance(signature,dict) else {}
    if (not SHA.fullmatch(signed_content_id) or
        check.get("recomputed_content_id")!=signed_content_id or
        att.get("content_id")!=signed_content_id or
        signature.get("id")!=signed_content_id):
        raise ValueError("signature check did not bind these exact response contents")
    entries=classify(response.get("corrections"))
    if deploy_sha is not None and not HEX40.fullmatch(deploy_sha):
        raise ValueError("bad triggering source commit SHA")
    if deploy_run_url is not None and (not deploy_run_url.startswith(
       "https://github.com/CSOAI-ORG/councilof-ai/actions/runs/") or len(deploy_run_url)>200):
        raise ValueError("invalid deployment-run provenance URL")
    out={
        "schema":SCHEMA,
        "evidence_state":"PUBLIC_HTTP_OBSERVATION",
        "observed_at":observed_at,
        "source_url":URL,
        "signed_body_content_sha256":signed_content_id,
        "corrections_records_sha256":digest(response["corrections"]),
        "records":entries,
        "record_count":len(entries),
        "publication_time_recorded":sum(e["source_published_at_state"]=="SOURCE_DECLARED" for e in entries),
        "publication_time_unrecorded":sum(e["source_published_at_state"]=="UNRECORDED" for e in entries),
        "signature_integrity":"VALID_UNDER_DID_DOCUMENT",
        "verification_method":"scripts/verify_corrections_signature.py over exact captured JSON; DID and Ed25519",
        "deploy_trigger_branch":"master" if deploy_sha else None,
        "deploy_trigger_source_commit":deploy_sha,
        "deploy_trigger_workflow_url":deploy_run_url,
        "deployed_bytes_mapped_to_trigger_commit":False,
        "first_publicly_seen_at_or_before":observed_at,
        "new_corrections_first_seen_in_this_run":"UNMEASURED_WITHOUT_PRIOR_CAPTURE",
        "correction_published_at_fields_backfilled":0,
        "ots_inclusion_verified_for_each_correction":False,
        "rekor_inclusion_verified_for_each_correction":False,
        "otlp_exported_to_collector":False,
        "independent_end_user_effect":"UNMEASURED",
        "limitations":[
            "First observed public readback time is only an upper bound on first publication, not an exact publish timestamp",
            "A successful triggering workflow alone does not bind this HTTP response to a particular Git SHA",
            "Content signatures and Merkle/OTS/Rekor witnesses do not establish each correction's deployment time",
            "This is a self-operated observer; not external witness or human approval",
            "The observed response supplies no record of what a third-party recipient did with the correction",
            "No historical timestamp is inferred from a later read or source commit",
        ]
    }
    out["receipt_sha256"]=digest(out)
    return out


def otlp_logs(report:dict)->dict:
    # Log envelope according to OTLP JSON structure. Instrumentation, not a measurement.
    seconds=dt.datetime.fromisoformat(report["observed_at"].replace("Z","+00:00")).timestamp()
    def attr(key,value):
        return {"key":key,"value":{"stringValue":str(value)}}
    return {"resourceLogs":[{"resource":{"attributes":[attr("service.name","csoai-public-corrections-observer")]},
      "scopeLogs":[{"scope":{"name":"csoai.corrections.public-readback","version":"0.1"},
      "logRecords":[{
        "timeUnixNano":str(round(seconds*1_000_000_000)),
        "observedTimeUnixNano":str(round(seconds*1_000_000_000)),
        "severityNumber":9,
        "severityText":"INFO",
        "body":{"stringValue":"Public corrections signature-verified source observation (not publication time)"},
        "attributes":[attr("csoai.observation.sha256",report["receipt_sha256"]),
                      attr("csoai.corrections.content_sha256",report["corrections_records_sha256"]),
                      attr("csoai.corrections.n",report["record_count"]),
                      attr("csoai.corrections.publication_unknown",report["publication_time_unrecorded"]),
                      attr("csoai.corrections.published_at_established","false")],
      }]}]}]}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--response",type=Path,required=True)
    p.add_argument("--signature-check",type=Path,required=True)
    p.add_argument("--deploy-sha")
    p.add_argument("--deploy-run-url")
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--otlp-out",type=Path,required=True)
    a=p.parse_args()
    response=a.response.read_bytes()
    if len(response)>2_000_000:
        p.error("response exceeds 2MB")
    check=a.signature_check.read_bytes()
    if len(check)>100_000:
        p.error("signature report exceeds 100KB")
    report=validate(json.loads(response),json.loads(check),iso_now(),a.deploy_sha,a.deploy_run_url)
    a.out.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    a.otlp_out.write_text(json.dumps(otlp_logs(report),indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({"state":"RECORDED_NOT_BACKFILLED","n":report["record_count"],
       "unrecorded_publication":report["publication_time_unrecorded"],
       "receipt_sha256":report["receipt_sha256"]}))


if __name__=="__main__":
    main()
