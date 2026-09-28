#!/usr/bin/env python3
"""Close the claim-maintenance loop without silently broadening a measurement.

Input is one claim-watch receipt. Source outages stay observations; actual source
changes for the Ondo/Chainlink registry trigger a registry-bounded remeasurement.
The controller never edits prior registry bytes. It builds a superseding candidate,
optionally signs it with the board signer, optionally submits exact bytes to OTS
calendars, and writes a machine-readable maintenance receipt for every outcome.
"""
from __future__ import annotations
import argparse, datetime as dt, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

KNOWN = ("CL-1","CL-2","CL-3","CL-4","CL-5","ON-1","ON-2","ON-3")
NON_TRIGGER_KINDS = {"source_not_reachable_this_run"}

def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def registry_claim_ids(doc: dict) -> set[str]:
    out=set()
    for sv in (doc.get("subjects") or {}).values():
        for c in sv.get("claims") or []:
            if c.get("id"): out.add(c["id"])
    for c in doc.get("claims") or []:
        if c.get("id"): out.add(c["id"])
    return out

def live_heads(repo: Path) -> list[Path]:
    d=repo/"public"/"claims"
    files=[p for p in sorted(d.glob("claimreg-*.json")) if not p.name.endswith(".signed.json")]
    parsed={}
    superseded=set()
    for p in files:
        try: j=load(p)
        except Exception: continue
        parsed[p]=j
        sup=j.get("supersedes") or {}
        if isinstance(sup,dict) and sup.get("file"):
            superseded.add(str(sup["file"]).split("/")[-1])
    return [p for p in parsed if p.name not in superseded]

def ondo_head(repo: Path) -> Path:
    heads=[]
    for p in live_heads(repo):
        try: ids=registry_claim_ids(load(p))
        except Exception: continue
        if ids.intersection(KNOWN):
            heads.append(p)
    if len(heads)!=1:
        raise RuntimeError(f"expected one live Ondo/Chainlink registry head, found {[p.name for p in heads]}")
    return heads[0]

def plan(receipt: dict) -> dict:
    changes=receipt.get("observed_changes_requiring_review") or []
    trigger=[]
    held=[]
    for ch in changes:
        cid=ch.get("claim")
        kind=ch.get("kind")
        if kind in NON_TRIGGER_KINDS:
            held.append({"claim":cid,"kind":kind,"reason":"transport/read failure is not evidence of a changed claim"})
        elif cid in KNOWN:
            trigger.append({"claim":cid,"kind":kind})
        else:
            held.append({"claim":cid,"kind":kind,"reason":"no executable claim harness is registered for this claim id"})
    impacted=sorted({x["claim"] for x in trigger})
    return {
        "watch_run_id": receipt.get("run_id"),
        "observed_changes": len(changes),
        "triggering_changes": trigger,
        "impacted_claims": impacted,
        "held_for_review": held,
        "action": "REMEASURE_REGISTRY" if impacted else "NO_REMEASUREMENT",
        "scope": list(KNOWN) if impacted else [],
        "scope_reason": ("the current assembler emits a complete superseding registry snapshot; "
                         "therefore only the affected registry is rerun, never the full estate") if impacted else None,
    }

def run(cmd:list[str], cwd:Path) -> subprocess.CompletedProcess:
    return subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)

def write_receipt(path:Path, doc:dict):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo",type=Path,default=Path(__file__).resolve().parents[2])
    ap.add_argument("--watch-receipt",type=Path,required=True)
    ap.add_argument("--out",type=Path,required=True)
    ap.add_argument("--execute",action="store_true")
    ap.add_argument("--require-signature",action="store_true")
    ap.add_argument("--token-file",type=Path,default=Path("/workspace/secrets/board-sign-pod-token"))
    ap.add_argument("--stamp",action="store_true")
    ap.add_argument("--stage-public",action="store_true")
    a=ap.parse_args()
    repo=a.repo.resolve()
    receipt=load(a.watch_receipt)
    pl=plan(receipt)
    rid=(receipt.get("run_id") or dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    work=a.out/f"run-{rid}"
    outrec=work/"maintenance-receipt.json"
    result={
        "schema":"csoai.claim-maintenance-receipt/0.1",
        "created_utc":dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00","Z"),
        "source_watch_receipt":{"path":str(a.watch_receipt),"sha256":sha256(a.watch_receipt)},
        "plan":pl,
        "state":"PLANNED",
        "publication_state":"NOT_PUBLISHED",
        "signature_state":"NOT_ATTEMPTED",
        "timestamp_state":"NOT_ATTEMPTED",
    }
    if not a.execute:
        write_receipt(outrec,result); print(outrec); return 0
    if pl["action"]=="NO_REMEASUREMENT":
        result["state"]="NO_ACTION_REQUIRED"
        write_receipt(outrec,result); print(outrec); return 0

    prior=ondo_head(repo)
    meas=work/"measurement"
    meas.mkdir(parents=True,exist_ok=True)
    cp=run([sys.executable,str(repo/"scripts/claims/run_all.py"),str(meas),*KNOWN],repo)
    result["remeasurement"]={"returncode":cp.returncode,"stdout_tail":cp.stdout[-3000:],"stderr_tail":cp.stderr[-3000:]}
    if cp.returncode:
        result["state"]="REMEASUREMENT_FAILED"; write_receipt(outrec,result); return cp.returncode

    candidate=work/"candidate"; candidate.mkdir(parents=True,exist_ok=True)
    stamp=dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    reg=candidate/f"claimreg-ondo-chainlink-maintenance-{stamp}.json"
    cp=run([sys.executable,str(repo/"scripts/claims/build_rev2.py"),str(meas),str(reg),"--prior",str(prior)],repo)
    result["assembly"]={"returncode":cp.returncode,"stdout_tail":cp.stdout[-3000:],"stderr_tail":cp.stderr[-3000:]}
    if cp.returncode:
        result["state"]="ASSEMBLY_FAILED"; write_receipt(outrec,result); return cp.returncode
    result["candidate"]={"registry":str(reg),"sha256":sha256(reg),"supersedes":prior.name}
    result["state"]="CANDIDATE_BUILT"

    tok=os.environ.get("BOARD_SIGN_POD_TOKEN","").strip()
    token_path=a.token_file.expanduser()
    if tok or token_path.is_file():
        cmd=[sys.executable,str(repo/"scripts/claims/sign_registry.py"),str(reg)]
        if not tok: cmd += ["--token-file",str(token_path)]
        cp=run(cmd,repo)
        result["signature"]={"returncode":cp.returncode,"stdout_tail":cp.stdout[-2500:],"stderr_tail":cp.stderr[-2500:]}
        side=reg.with_suffix(".signed.json")
        if cp.returncode or not side.is_file():
            result["signature_state"]="FAILED"
            result["state"]="SIGNATURE_FAILED"
            write_receipt(outrec,result)
            return cp.returncode or 4
        result["signature_state"]="VERIFIED"
        result["candidate"]["signed_sidecar"]=str(side)
        result["candidate"]["signed_sha256"]=sha256(side)
        result["state"]="SIGNED_CANDIDATE"
    elif a.require_signature:
        result["signature_state"]="MISSING_AUTHORITY"
        result["state"]="SIGNATURE_BLOCKED"
        write_receipt(outrec,result); return 5
    else:
        result["signature_state"]="NOT_ATTEMPTED_NO_TOKEN"

    if a.stamp:
        files=[str(reg)]
        side=reg.with_suffix(".signed.json")
        if side.is_file(): files.append(str(side))
        cp=run([sys.executable,str(repo/"scripts/ots_stamp_new.py"),*files,"--out-dir",str(candidate)],repo)
        result["timestamp"]={"returncode":cp.returncode,"stdout_tail":cp.stdout[-2500:],"stderr_tail":cp.stderr[-2500:]}
        result["timestamp_state"]="PENDING_CALENDAR_COMMITMENT" if cp.returncode==0 else "STAMP_FAILED"
        if cp.returncode:
            result["state"]="TIMESTAMP_SUBMISSION_FAILED"; write_receipt(outrec,result); return cp.returncode

    result["publication_state"]="CANDIDATE_READY_FOR_ATOMIC_PUBLISH"
    result["state"]="READY_TO_PUBLISH"
    if a.stage_public:
        pub=repo/"public"/"claims"
        pub.mkdir(parents=True,exist_ok=True)
        staged=[]
        for src in [reg, reg.with_suffix(".signed.json"), Path(str(reg)+".ots"), Path(str(reg.with_suffix(".signed.json"))+".ots")]:
            if src.is_file():
                dst=pub/src.name
                shutil.copy2(src,dst); staged.append("/claims/"+dst.name)
        mdir=pub/"maintenance"; (mdir/"receipts").mkdir(parents=True,exist_ok=True)
        result["publication_state"]="STAGED_IN_REPO_NOT_YET_PUBLIC"
        result["staged_public_paths"]=staged
        result["candidate"]["registry"]="/claims/"+reg.name
        if reg.with_suffix(".signed.json").is_file():
            result["candidate"]["signed_sidecar"]="/claims/"+reg.with_suffix(".signed.json").name
        write_receipt(outrec,result)
        shutil.copy2(outrec,mdir/"latest-receipt.json")
        shutil.copy2(outrec,mdir/"receipts"/f"{rid}.json")
    else:
        write_receipt(outrec,result)
    print(json.dumps({"state":result["state"],"registry":result["candidate"]["registry"],"receipt":str(outrec)},sort_keys=True))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
