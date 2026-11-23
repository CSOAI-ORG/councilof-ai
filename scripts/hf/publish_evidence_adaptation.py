#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Publish ORIGINAL GSPC × MEOK research release with privacy gates and exact-byte replay.

Only releases the curated public summary under research/releases/... on a
workflow_dispatch from protected master. No HF secret in PR CI, no raw
historical keys, private tasks, personal data or third-party model files.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO="csoai/gspc-meok-evidence-adaptation-lab"
REL="research/releases/evidence-adaptation-2026-11-23"
FILE_NAMES=("README.md","WHITEPAPER.md","METHODS.md","data/research_observations.jsonl")
ALLOWED_STATES={
 "PUBLIC_SOURCE_OBSERVATION","RETROSPECTIVE_PUBLIC_REUSE",
 "RETROSPECTIVE_OWNER_SOURCE_AUDIT","PUBLIC_SOURCE_RULE_TEST",
 "RETROSPECTIVE_SOURCE_RECOMPUTATION","SYNTHETIC",
}


def sha(b:bytes)->str:
    return hashlib.sha256(b).hexdigest()


def canonical(obj)->bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()


def validate_rows(raw:bytes)->list:
    if not 0<len(raw)<=128_000:
        raise ValueError("research observations missing or too big")
    rows=[]
    ids=set()
    keys={"observation_id","observed_on","evidence_state","topic","metric",
          "numeric_value","denominator","unit","source_url","limitations"}
    for line in raw.splitlines():
        if not line.strip():continue
        row=json.loads(line)
        if not isinstance(row,dict) or set(row)!=keys:
            raise ValueError("unknown/missing research column")
        if not isinstance(row["observation_id"],str) or row["observation_id"] in ids:
            raise ValueError("duplicate observation key")
        ids.add(row["observation_id"])
        if row["evidence_state"] not in ALLOWED_STATES or not isinstance(row["limitations"],str) or len(row["limitations"])<12:
            raise ValueError("unsupported evidence state or undisclosed limitation")
        if (not isinstance(row["numeric_value"],(int,float)) or isinstance(row["numeric_value"],bool)
            or not math.isfinite(row["numeric_value"])):
            raise ValueError("invalid measured numerical value")
        n=row["denominator"]
        if n is not None and (type(n) is not int or n<=0):
            raise ValueError("bad sample denominator")
        if row["unit"]=="AUROC" and not 0<=row["numeric_value"]<=1:
            raise ValueError("AUROC out of range")
        if row["unit"] in ("keys","tasks","records","axes") and row["numeric_value"]<0:
            raise ValueError("negative count")
        if not isinstance(row["source_url"],str) or not row["source_url"].startswith("https://"):
            raise ValueError("source URL missing")
        if not isinstance(row["observed_on"],str) or not row["observed_on"].startswith("2026-11-"):
            raise ValueError("source observation date not in research release")
        rows.append(row)
    if len(rows)<20:
        raise ValueError("insufficient traceable observation records")
    return rows


def stage(root:Path,source_sha:str,stage_dir:Path)->dict:
    src=root/REL
    staged=[]
    digests={}
    for name in FILE_NAMES:
        p=src/name
        if not p.is_file() or p.is_symlink() or not 10<p.stat().st_size<300_000:
            raise ValueError("missing/oversize/unsafe release source: "+name)
        b=p.read_bytes()
        b.decode("utf-8")
        d=stage_dir/name
        d.parent.mkdir(parents=True,exist_ok=True)
        d.write_bytes(b)
        digests[name]=sha(b)
        staged.append(name)
    rows=validate_rows((stage_dir/"data/research_observations.jsonl").read_bytes())
    readme=(stage_dir/"README.md").read_text()
    paper=(stage_dir/"WHITEPAPER.md").read_text()
    if "license: cc-by-4.0" not in readme or "not peer reviewed" not in paper.lower():
        raise ValueError("publication must disclose licence and lack of peer review")
    if "12/12" not in paper or "answer" not in paper.lower():
        raise ValueError("historical council validity caveat absent")
    manifest={
       "schema":"csoai.gspc-meok-research-release/0.1",
       "release_date":"2026-11-23",
       "evidence_state":"RESEARCH_ONLY",
       "source_repository":"CSOAI-ORG/councilof-ai",
       "source_commit_sha":source_sha,
       "source_subdir":REL,
       "file_sha256":dict(sorted(digests.items())),
       "n_research_observations":len(rows),
       "licence_narrative":"CC-BY-4.0",
       "is_certification":False,
       "independent_peer_review":"NOT_ESTABLISHED",
       "hidden_bank_generalisation":"NOT_ESTABLISHED",
       "live_human_authority":"NOT_ESTABLISHED",
       "outside_user_effect":"NOT_MEASURED",
       "publish_target":REPO,
       "source_of_truth":"GitHub protected master, not HF mirror",
    }
    manifest["manifest_sha256"]=sha(canonical(manifest))
    (stage_dir/"manifest.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    return manifest


def privacy_gate(root:Path,path:Path):
    cmd=[sys.executable,str(root/"scripts/privacy/publication_gate.py"),
         "--label","gspc-meok-research-whitepaper",str(path)]
    subprocess.run(cmd,cwd=root,check=True)


def publish(path:Path,manifest:dict):
    if os.environ.get("GITHUB_REF")!="refs/heads/master" or os.environ.get("GITHUB_EVENT_NAME")!="workflow_dispatch":
        raise RuntimeError("release requires explicitly dispatched protected master workflow")
    token=(os.environ.get("HF_TOKEN") or "").strip()
    if not token:
        raise RuntimeError("No authorised HF_TOKEN; refusing upload")
    from huggingface_hub import HfApi,hf_hub_download
    api=HfApi(token=token)
    api.create_repo(repo_id=REPO,repo_type="dataset",private=False,exist_ok=True)
    commit=api.upload_folder(
        folder_path=str(path),repo_id=REPO,repo_type="dataset",
        commit_message="research: verifiable evidence-adaptation lab release 2026-11-23",
    )
    revision=getattr(commit,"oid",None) or api.repo_info(repo_id=REPO,repo_type="dataset").sha
    if not revision or len(revision)!=40:
        raise RuntimeError("HF commit revision not returned")
    expected={**manifest["file_sha256"],"manifest.json":sha((path/"manifest.json").read_bytes())}
    for name,digest in sorted(expected.items()):
        downloaded=hf_hub_download(repo_id=REPO,filename=name,repo_type="dataset",
                                   revision=revision,token=token,force_download=True)
        if sha(Path(downloaded).read_bytes())!=digest:
            raise RuntimeError("Published HF bytes do not match local bytes: "+name)
        print("VERIFIED",name,digest)
    print(json.dumps({"publication":"VERIFIED_EXACT_BYTES",
        "dataset":"https://huggingface.co/datasets/"+REPO,
        "hf_commit_sha":revision,
        "source_commit_sha":manifest["source_commit_sha"],
        "manifest_sha256":manifest["manifest_sha256"],
        "n_files":len(expected)},sort_keys=True))


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    group=ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--check",action="store_true")
    group.add_argument("--publish",action="store_true")
    a=ap.parse_args()
    root=Path(__file__).resolve().parents[2]
    source_sha=(os.environ.get("GITHUB_SHA") or "PREVIEW_UNBOUND").strip()
    if a.publish:
        if os.environ.get("GITHUB_REF")!="refs/heads/master":
            raise SystemExit("Not protected master: refusing publication")
        required=root/"measurement/experiments/two-path-council/HISTORICAL-3AROUND1-AUDIT-2026-11-23.md"
        if not required.is_file():
            raise SystemExit("Canonical historical correction source not merged; refusal")
        if len(source_sha)!=40 or any(c not in "0123456789abcdef" for c in source_sha):
            raise SystemExit("No protected GitHub source commit")
    with tempfile.TemporaryDirectory(prefix="csoai-hf-research-release-") as tmp:
        dest=Path(tmp)
        manifest=stage(root,source_sha,dest)
        privacy_gate(root,dest)
        if a.check:
            print(json.dumps({"state":"READY_AFTER_SOURCE_GATES","n_observations":manifest["n_research_observations"],
                 "source_commit":manifest["source_commit_sha"],"manifest_sha256":manifest["manifest_sha256"]},sort_keys=True))
            return 0
        publish(dest,manifest)
    return 0


if __name__=="__main__":
    sys.exit(main())
