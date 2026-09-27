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
STATIC_BASELINES={
    "/.well-known/agent-card.json": PUBLIC/".well-known/agent-card.json",
    "/verifier/verify_receipt.py": PUBLIC/"verifier/verify_receipt.py",
}
def approved_static_upgrades()->dict[str,dict[str,Any]]:
    distribution=json.loads((PUBLIC/"layer0-distribution.json").read_text())
    out={}
    for row in distribution.get("release_candidate_static_changes") or []:
        path=str(row.get("path") or "")
        if not path.startswith("/"):
            continue
        out[path]={
            "path":PUBLIC/path.lstrip("/"),
            "pre_release_sha256":row.get("pre_release_sha256"),
            "candidate_sha256":row.get("candidate_sha256"),
            "reason":row.get("reason"),
        }
    return out

def sha256(data: bytes)->str:
    return hashlib.sha256(data).hexdigest()

def content_id(value: Any)->str:
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return sha256(raw)

def verify_local_index(name: str, local: bytes)->dict[str,Any]:
    row={
        "path":"/"+name,
        "status":"LOCAL_CANDIDATE",
        "bytes":len(local),
        "local_sha256":sha256(local),
        "content_id_valid":False,
    }
    try:
        doc=json.loads(local)
        got=doc.get("content_id")
        body=dict(doc); body.pop("content_id",None)
        row["content_id_valid"]=bool(got) and got==content_id(body)
        row["content_id"]=got
    except Exception as exc:
        row["parse_error"]=str(exc)
    return row

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
            continue
        if row.get("approved_upgrade"):
            if row.get("exact_match") is True:
                continue
            if row.get("sha256")==row.get("pre_release_sha256"):
                errors.append(f'{row.get("path")}: approved static upgrade not deployed yet')
            else:
                errors.append(f'{row.get("path")}: approved static upgrade live bytes match neither pre-release nor committed candidate')
            continue
        if row.get("exact_required") and row.get("exact_match") is not True:
            errors.append(f'{row.get("path")}: deployed static baseline bytes do not match committed candidate')
    return errors

def release_contract_errors(distribution: dict[str,Any])->list[str]:
    errors=[]
    parity=((distribution.get("surface_parity") or {}).get("a2a") or {})
    gate=((distribution.get("release_gate") or {}).get("source_surface_parity_state"))
    state=parity.get("state")
    if state and state!="CONSISTENT":
        errors.append(
            "source/live A2A contract parity is "
            + str(state)
            + ": declared_only="
            + json.dumps(parity.get("declared_only") or [],sort_keys=True)
            + " observed_only="
            + json.dumps(parity.get("observed_only") or [],sort_keys=True)
        )
    if gate and gate!="CONSISTENT":
        errors.append(f"release source-surface parity gate is {gate}")
    return errors


def validate_predeploy_rows(index_rows: list[dict[str,Any]], baseline_rows: list[dict[str,Any]])->list[str]:
    errors=[]
    for row in index_rows:
        if row.get("content_id_valid") is not True:
            errors.append(f'{row.get("path")}: local candidate content_id invalid')
    for row in baseline_rows:
        if row.get("status")!=200:
            errors.append(f'{row.get("path")}: existing live surface regressed to {row.get("status")}')
            continue
        if row.get("approved_upgrade"):
            if row.get("local_sha256")!=row.get("candidate_sha256"):
                errors.append(f'{row.get("path")}: approved candidate hash does not match release declaration')
                continue
            remote_sha=row.get("sha256")
            if remote_sha not in {row.get("pre_release_sha256"), row.get("candidate_sha256")}:
                errors.append(f'{row.get("path")}: live bytes match neither pre-release nor approved candidate')
            continue
        if row.get("exact_required") and row.get("exact_match") is not True:
            errors.append(f'{row.get("path")}: deployed static baseline bytes do not match committed candidate')
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
    errs=validate_rows([good],[{"path":"/static","status":200,"exact_required":True,"exact_match":False}])
    if not any("static baseline bytes" in e for e in errs):
        failures.append("static baseline byte drift did not fail")
    errs=validate_rows([good],[{"path":"/upgrade","status":200,"approved_upgrade":True,"exact_match":False,"sha256":"old","pre_release_sha256":"old"}])
    if not any("approved static upgrade not deployed yet" in e for e in errs):
        failures.append("approved pre-release upgrade did not hold")
    errs=validate_rows([good],[{"path":"/upgrade","status":200,"approved_upgrade":True,"exact_match":False,"sha256":"unexpected","pre_release_sha256":"old"}])
    if not any("neither pre-release nor committed candidate" in e for e in errs):
        failures.append("unexpected approved-upgrade drift did not fail")

    local_doc={"schema":"fixture","value":1}
    local_doc["content_id"]=content_id(local_doc)
    local_bytes=(json.dumps(local_doc,sort_keys=True)+"\n").encode()
    local_row=verify_local_index("candidate.json",local_bytes)
    if validate_predeploy_rows([local_row],[]):
        failures.append("valid local candidate preflight failed")
    broken_local=dict(local_row); broken_local["content_id_valid"]=False
    errs=validate_predeploy_rows([broken_local],[])
    if not any("content_id invalid" in e for e in errs):
        failures.append("corrupt local candidate did not fail predeploy")
    upgrade_ready={
        "path":"/quickstart.json","status":200,"approved_upgrade":True,
        "sha256":"old","pre_release_sha256":"old",
        "candidate_sha256":"new","local_sha256":"new",
    }
    if validate_predeploy_rows([local_row],[upgrade_ready]):
        failures.append("approved pre-release static upgrade did not pass predeploy")
    bad_upgrade={**upgrade_ready,"sha256":"unexpected"}
    errs=validate_predeploy_rows([local_row],[bad_upgrade])
    if not any("neither pre-release nor approved candidate" in e for e in errs):
        failures.append("unexpected live upgrade drift did not fail predeploy")

    if release_contract_errors({
        "surface_parity":{"a2a":{"state":"CONSISTENT","declared_only":[],"observed_only":[]}},
        "release_gate":{"source_surface_parity_state":"CONSISTENT"},
    }):
        failures.append("consistent source/live parity fixture failed")
    errs=release_contract_errors({
        "surface_parity":{"a2a":{"state":"INCONSISTENT","declared_only":[],"observed_only":["live-only"]}},
        "release_gate":{"source_surface_parity_state":"HOLD_SOURCE_SURFACE_DIVERGENCE"},
    })
    if not any("A2A contract parity" in e and "live-only" in e for e in errs):
        failures.append("source/live A2A drift did not produce explicit release error")
    if not any("HOLD_SOURCE_SURFACE_DIVERGENCE" in e for e in errs):
        failures.append("source-surface parity gate HOLD did not produce explicit release error")
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
    ap.add_argument(
        "--static-preflight",
        action="store_true",
        help="verify the four indexes plus committed static baseline files; skips dynamic /api surfaces",
    )
    args=ap.parse_args()
    if args.indexes_only and args.static_preflight:
        ap.error("--indexes-only and --static-preflight are mutually exclusive")

    if args.selftest:
        failures=selftest()
        if failures:
            print(json.dumps({"state":"FAIL","failures":failures},indent=2))
            return 2
        print(json.dumps({"state":"PASS","selftest":"public release readback goes red on index drift, static baseline byte drift, and baseline regression"},indent=2))
        return 0

    origin=args.origin.rstrip("/")
    index_rows=[]
    if args.indexes_only or args.static_preflight:
        for name in INDEXES:
            local=(PUBLIC/name).read_bytes()
            index_rows.append(verify_local_index(name,local))
    else:
        for name in INDEXES:
            local=(PUBLIC/name).read_bytes()
            status,remote,content_type=fetch(origin+"/"+name)
            row=verify_exact(name,status,remote,local)
            row["content_type"]=content_type
            index_rows.append(row)

    baseline_rows=[]
    if not args.indexes_only:
        approved_upgrades=approved_static_upgrades()
        distribution=json.loads((PUBLIC/"layer0-distribution.json").read_text())
        x402_expected_sha=(((distribution.get("source_observations") or {}).get("x402") or {}).get("sha256"))
        baseline_paths=(
            list(STATIC_BASELINES)+list(approved_upgrades)
            if args.static_preflight else BASELINE_SURFACES
        )
        for path in baseline_paths:
            status,remote,content_type=fetch(origin+path)
            upgrade=approved_upgrades.get(path)
            remote_sha=sha256(remote)
            dynamic_x402=(path=="/.well-known/x402.json" and bool(x402_expected_sha))
            row={
                "path":path,
                "status":status,
                "bytes":len(remote),
                "sha256":remote_sha,
                "content_type":content_type,
                "exact_required":path in STATIC_BASELINES or dynamic_x402,
                "approved_upgrade":upgrade is not None,
            }
            if dynamic_x402:
                row["expected_sha256"]=x402_expected_sha
                row["exact_match"]=status==200 and remote_sha==x402_expected_sha
                row["baseline_kind"]="dynamic_manifest_bound_to_release_observation"
            local_path=STATIC_BASELINES.get(path) or (upgrade or {}).get("path")
            if local_path is not None:
                local=local_path.read_bytes()
                row["local_sha256"]=sha256(local)
                row["exact_match"]=status==200 and remote==local
            if upgrade is not None:
                row["pre_release_sha256"]=upgrade["pre_release_sha256"]
                row["candidate_sha256"]=upgrade["candidate_sha256"]
                row["upgrade_reason"]=upgrade["reason"]
            baseline_rows.append(row)

    errors=(
        validate_predeploy_rows(index_rows,baseline_rows)
        if args.indexes_only or args.static_preflight
        else validate_rows(index_rows,baseline_rows)
    )
    distribution_doc=json.loads((PUBLIC/"layer0-distribution.json").read_text())
    errors.extend(release_contract_errors(distribution_doc))
    out={
        "schema":"csoai.public-index-release-readback/0.1",
        "origin":origin,
        "state":"PASS" if not errors else "HOLD",
        "indexes":index_rows,
        "baseline_surfaces":baseline_rows,
        "errors":errors,
        "mode":(
            "LOCAL_INDEX_CANDIDATE_PREFLIGHT" if args.indexes_only else
            "STATIC_CANDIDATE_PREFLIGHT" if args.static_preflight else
            "FULL_RELEASE_READBACK"
        ),
        "law":(
            "local index preflight proves candidate byte integrity only and cannot accept production deployment"
            if args.indexes_only else
            "static preflight proves local index integrity plus non-regression/approved-upgrade bounds on existing static live surfaces; it cannot accept production deployment"
            if args.static_preflight else
            "deployment is not accepted until the four new index bytes match the committed release, static baseline contracts match committed bytes, and dynamic baseline surfaces remain reachable"
        ),
    }
    print(json.dumps(out,indent=2,sort_keys=True))
    return 0 if not errors else 1

if __name__=="__main__":
    raise SystemExit(main())
