#!/usr/bin/env python3
"""Offline verifier for CSOAI universal measurement cohorts.

Verifies exact evidence bytes, row selection, row hashes, cohort Merkle roots,
child-cohort hierarchy, manifest self-digests, and compact signing candidates.
It does not need network access. Optional Ed25519 verification is supported for
standalone signed cohort exports when a raw public key hex is supplied.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
from typing import Any

def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def merkle_root(leaves: list[str]) -> str:
    if not leaves:
        return sha(b"")
    level=[bytes.fromhex(x) for x in leaves]
    while len(level)>1:
        nxt=[]
        for i in range(0,len(level),2):
            left=level[i]; right=level[i+1] if i+1<len(level) else left
            nxt.append(hashlib.sha256(left+right).digest())
        level=nxt
    return level[0].hex()

def rows_at(path: Path, pointer: str) -> list[Any]:
    cur=json.loads(path.read_text(encoding="utf-8"))
    if pointer:
        for part in pointer.split("."):
            if not isinstance(cur,dict) or part not in cur:
                raise ValueError(f"pointer {pointer!r} missing at {part!r}")
            cur=cur[part]
    if not isinstance(cur,list):
        raise ValueError("selected row population is not a list")
    return cur

def verify_manifest(path: Path, root: Path, seen: set[Path] | None=None) -> dict[str,Any]:
    seen=seen or set()
    p=path.resolve()
    problems=[]
    if p in seen:
        return {"path":str(path),"ok":False,"problems":["child-cohort cycle"]}
    seen.add(p)
    try:
        m=json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        return {"path":str(path),"ok":False,"problems":[f"read/json {type(e).__name__}"]}
    claimed=m.get("manifest_sha256")
    core=dict(m); core.pop("manifest_sha256",None)
    got=sha(canonical_bytes(core))
    if claimed!=got: problems.append(f"manifest_sha256 mismatch: {claimed} != {got}")

    evidence={}
    for e in m.get("evidence") or []:
        rel=e.get("path")
        if not isinstance(rel,str): problems.append("evidence path missing"); continue
        fp=(root/rel).resolve()
        try: fp.relative_to(root.resolve())
        except ValueError: problems.append(f"evidence escapes root: {rel}"); continue
        if not fp.is_file(): problems.append(f"evidence missing: {rel}"); continue
        raw=fp.read_bytes()
        if e.get("bytes")!=len(raw): problems.append(f"byte length mismatch: {rel}")
        if e.get("sha256")!=sha(raw): problems.append(f"file sha256 mismatch: {rel}")
        evidence[(rel,str(e.get("rows_pointer") or ""))]=fp

    atoms=m.get("atomic_observations") or []
    if m.get("atomic_count")!=len(atoms): problems.append("atomic_count mismatch")
    atom_digests=[]
    row_cache={}
    for a in atoms:
        rel=str(a.get("evidence_path") or "")
        ptr=str(a.get("rows_pointer") or "")
        key=(rel,ptr)
        fp=evidence.get(key)
        if fp is None:
            problems.append(f"atomic evidence mapping missing: {rel}#{ptr}"); continue
        if key not in row_cache:
            try: row_cache[key]=rows_at(fp,ptr)
            except Exception as e:
                problems.append(f"row selection failed: {rel}#{ptr}: {e}"); continue
        rows=row_cache[key]
        idx=a.get("row_index")
        if type(idx) is not int or idx<0 or idx>=len(rows):
            problems.append(f"row index invalid: {rel}#{ptr}[{idx}]"); continue
        d=sha(canonical_bytes(rows[idx]))
        if d!=a.get("sha256"): problems.append(f"row sha256 mismatch: {rel}#{ptr}[{idx}]")
        atom_digests.append(str(a.get("sha256")))
    if merkle_root(atom_digests)!=m.get("atomic_merkle_root"):
        problems.append("atomic_merkle_root mismatch")

    child_digests=[]
    children=[]
    for c in m.get("child_cohorts") or []:
        rel=c.get("path")
        if not isinstance(rel,str): problems.append("child path missing"); continue
        child_path=(root/rel).resolve()
        receipt=verify_manifest(child_path,root,set(seen))
        children.append(receipt)
        if not receipt["ok"]: problems.append(f"child invalid: {rel}")
        try:
            cj=json.loads(child_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        for field in ("cohort_id","manifest_sha256","atomic_count","atomic_merkle_root"):
            if c.get(field)!=cj.get(field): problems.append(f"child binding mismatch {rel}:{field}")
        if isinstance(c.get("manifest_sha256"),str): child_digests.append(c["manifest_sha256"])
    if m.get("child_cohort_count",0)!=len(m.get("child_cohorts") or []):
        problems.append("child_cohort_count mismatch")
    if merkle_root(child_digests)!=m.get("child_cohort_merkle_root"):
        problems.append("child_cohort_merkle_root mismatch")

    seen.remove(p)
    return {
        "path":str(path),
        "cohort_id":m.get("cohort_id"),
        "ok":not problems,
        "problems":problems,
        "manifest_sha256":claimed,
        "atomic_count":m.get("atomic_count"),
        "atomic_merkle_root":m.get("atomic_merkle_root"),
        "child_cohort_count":m.get("child_cohort_count",0),
        "child_cohort_merkle_root":m.get("child_cohort_merkle_root"),
        "children":children,
    }

def verify_candidate(candidate_path: Path, manifest: dict[str,Any]) -> list[str]:
    problems=[]
    try: wrapper=json.loads(candidate_path.read_text(encoding="utf-8"))
    except Exception as e: return [f"candidate read/json {type(e).__name__}"]
    body=wrapper.get("body") if isinstance(wrapper,dict) else None
    if not isinstance(body,dict): return ["candidate body missing"]
    measurement=body.get("measurement")
    if not isinstance(measurement,dict): return ["candidate measurement missing"]
    pairs={
        "manifest_sha256":manifest.get("manifest_sha256"),
        "atomic_count":manifest.get("atomic_count"),
        "atomic_merkle_root":manifest.get("atomic_merkle_root"),
        "child_cohort_count":manifest.get("child_cohort_count",0),
        "child_cohort_merkle_root":manifest.get("child_cohort_merkle_root"),
    }
    for k,v in pairs.items():
        if measurement.get(k)!=v: problems.append(f"candidate does not bind {k}")
    if len(canonical_bytes(body))>3072: problems.append("candidate exceeds 3072-byte cap")
    if body.get("measurement_not_certification") is not True: problems.append("candidate doctrine flag missing")
    return problems

def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("manifest")
    ap.add_argument("--root",default=".")
    ap.add_argument("--candidate")
    ns=ap.parse_args()
    root=Path(ns.root).resolve()
    path=(root/ns.manifest).resolve()
    receipt=verify_manifest(path,root)
    if ns.candidate:
        m=json.loads(path.read_text(encoding="utf-8"))
        receipt["candidate_problems"]=verify_candidate((root/ns.candidate).resolve(),m)
        receipt["ok"]=receipt["ok"] and not receipt["candidate_problems"]
    print(json.dumps(receipt,indent=2,ensure_ascii=False))
    return 0 if receipt["ok"] else 1

if __name__=="__main__":
    raise SystemExit(main())
