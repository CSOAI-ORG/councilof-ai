#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"public"
ORIGIN="https://councilof.ai"

INDEXES=[
    "layer0-drive-through.json",
    "eat-flywheel.json",
    "layer0-distribution.json",
    "progress-index.json",
]

BASELINE_SURFACES=[
    "/.well-known/x402.json",
    "/.well-known/agent-card.json",
    "/api/revenue",
    "/quickstart.json",
    "/verifier/verify_receipt.py",
]

def sha256(data: bytes)->str:
    return hashlib.sha256(data).hexdigest()

def fetch(url: str)->tuple[int,bytes,str|None]:
    req=urllib.request.Request(
        url,
        headers={"User-Agent":"CSOAI-public-index-readback/0.1","Accept":"*/*"},
    )
    try:
        with urllib.request.urlopen(req,timeout=20) as resp:
            return resp.status,resp.read(),resp.headers.get("Content-Type")
    except urllib.error.HTTPError as e:
        return e.code,e.read(),e.headers.get("Content-Type")

def verify_exact(name: str, status: int, remote: bytes, local: bytes)->dict[str,Any]:
    return {
        "path":"/"+name,
        "status":status,
        "remote_sha256":sha256(remote),
        "local_sha256":sha256(local),
        "bytes":len(remote),
        "exact_match":status==200 and remote==local,
    }

def validate_rows(index_rows: list[dict[str,Any]], baseline_rows: list[dict[str,Any]])->list[str]:
    errors=[]
    for row in index_rows:
        if row.get("status")!=200:
            errors.append(f'{row.get("path")}: expected 200, got {row.get("status")}')
        if row.get("exact_match") is not True:
            errors.append(f'{row.get("path")}: deployed bytes do not match committed release bytes')
    for row in baseline_rows:
        if row.get("status")!=200:
            errors.append(f'{row.get("path")}: existing live surface regressed to {row.get("status")}')
    return errors

def selftest()->list[str]:
    failures=[]
    local=b'{"schema":"fixture"}\n'
    good=verify_exact("x.json",200,local,local)
    bad_status=verify_exact("x.json",404,b"",local)
    bad_bytes=verify_exact("x.json",200,b'other',local)
    if validate_rows([good],[{"path":"/baseline","status":200}]):
        failures.append("valid readback fixture failed")
    errs=validate_rows([bad_status],[{"path":"/baseline","status":200}])
    if not any("expected 200" in e for e in errs):
        failures.append("404 index did not fail")
    errs=validate_rows([bad_bytes],[{"path":"/baseline","status":200}])
    if not any("do not match" in e for e in errs):
        failures.append("byte mismatch did not fail")
    errs=validate_rows([good],[{"path":"/baseline","status":503}])
    if not any("regressed" in e for e in errs):
        failures.append("baseline regression did not fail")
    return failures

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--origin",default=ORIGIN)
    ap.add_argument("--selftest",action="store_true")
    ap.add_argument(
        "--indexes-only",
        action="store_true",
        help="verify only the four release-candidate index bytes; for local/static preflight only",
    )
    args=ap.parse_args()

    if args.selftest:
        failures=selftest()
        if failures:
            print(json.dumps({"state":"FAIL","failures":failures},indent=2))
            return 2
        print(json.dumps({"state":"PASS","selftest":"public release readback goes red on 404, byte drift, and baseline regression"},indent=2))
        return 0

    origin=args.origin.rstrip("/")
    index_rows=[]
    for name in INDEXES:
        local=(PUBLIC/name).read_bytes()
        status,remote,content_type=fetch(origin+"/"+name)
        row=verify_exact(name,status,remote,local)
        row["content_type"]=content_type
        index_rows.append(row)

    baseline_rows=[]
    if not args.indexes_only:
        for path in BASELINE_SURFACES:
            status,remote,content_type=fetch(origin+path)
            baseline_rows.append({
                "path":path,
                "status":status,
                "bytes":len(remote),
                "sha256":sha256(remote),
                "content_type":content_type,
            })

    errors=validate_rows(index_rows,baseline_rows)
    out={
        "schema":"csoai.public-index-release-readback/0.1",
        "origin":origin,
        "state":"PASS" if not errors else "HOLD",
        "indexes":index_rows,
        "baseline_surfaces":baseline_rows,
        "errors":errors,
        "mode":"INDEXES_ONLY_PREFLIGHT" if args.indexes_only else "FULL_RELEASE_READBACK",
        "law":(
            "indexes-only is a preflight and cannot accept production deployment"
            if args.indexes_only else
            "deployment is not accepted until the four new index bytes match the committed release and the five pre-existing live surfaces remain reachable"
        ),
    }
    print(json.dumps(out,indent=2,sort_keys=True))
    return 0 if not errors else 1

if __name__=="__main__":
    raise SystemExit(main())
