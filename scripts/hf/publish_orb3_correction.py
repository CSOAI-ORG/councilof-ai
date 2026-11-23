#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Protected-master correction of ORB-III curriculum card with pinned HF readback.

Original historical signed results are never edited. If the live Hugging Face
README has changed from our verified 23 Nov baseline, refuse the overwrite.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

REPO="csoai/hitl-academy-orb3"
SOURCE="ops/hub-fixes/hf/bundle/csoai__hitl-academy-orb3__dataset/README.md"
BASELINE_SHA256="329b275fb6f1c8ad94bea996da839d165aff9cabd7778a36c7285390b828ea5e"
SCHEMA="csoai.orb3-curriculum-correction-release/0.1"
MARKERS=[
    "Evidence-status correction proposed 23 November 2026",
    "answer-bearing metadata",
    "not a blinded independent evaluation",
    "A software signature is not proof",
    "issues/4737",
    "HITL companion status",
    "NOT_VERIFIED",
    "execution authority false",
    "dc8cee6781b6d02f",
]

def sha(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()

def source_bytes(root:Path)->bytes:
    file=root/SOURCE
    if not file.is_file() or file.is_symlink() or not 1000<file.stat().st_size<100_000:
        raise ValueError("reviewed source card unavailable/unsafe")
    data=file.read_bytes()
    text=data.decode("utf-8")
    for marker in MARKERS:
        if marker not in text:
            raise ValueError("required source correction missing: "+marker)
    for obsolete in (
        "3-Around-1 Bidirectional Triad = 100.0% (32/32",
        "Real review queue: 676 artefacts, 664 PENDING",
        "only a named, trained human can move",
    ):
        if obsolete in text:
            raise ValueError("unqualified old claim remains")
    return data

def privacy_gate(root:Path,card:Path):
    subprocess.run([sys.executable,str(root/"scripts/privacy/publication_gate.py"),
                    "--label","orb3-public-curriculum-correction",str(card)],
                   check=True,cwd=root)

def classify_remote(current:bytes,expected:bytes)->str:
    if current==expected:
        return "ALREADY_CORRECTED"
    if sha(current)!=BASELINE_SHA256:
        return "REFUSE_REMOTE_CHANGED"
    text=current.decode("utf-8")
    if "100.0% (32/32" not in text or "dc8cee6781b6d02f" not in text:
        return "REFUSE_UNEXPECTED_BASELINE"
    return "BASELINE_ELIGIBLE"

def publish(root:Path,expected:bytes)->dict:
    if os.environ.get("GITHUB_REF")!="refs/heads/master" or os.environ.get("GITHUB_EVENT_NAME") not in ("workflow_dispatch","push"):
        raise ValueError("only reviewed protected-master push or explicit dispatch may publish")
    token=(os.environ.get("HF_TOKEN") or "").strip()
    if not token:
        raise ValueError("HF_TOKEN absent")
    from huggingface_hub import HfApi,hf_hub_download
    api=HfApi(token=token)
    before=api.repo_info(repo_id=REPO,repo_type="dataset")
    rev=before.sha
    if not rev or len(rev)!=40:
        raise RuntimeError("unable to pin existing HF revision")
    path=hf_hub_download(repo_id=REPO,filename="README.md",
                         revision=rev,repo_type="dataset",token=token,force_download=True)
    previous=Path(path).read_bytes()
    condition=classify_remote(previous,expected)
    if condition.startswith("REFUSE_"):
        raise RuntimeError("HF README changed since pinned public baseline; no overwrite")
    if condition=="ALREADY_CORRECTED":
        new_rev=rev
        state="ALREADY_CORRECTED_EXACT_BYTES"
    else:
        commit=api.upload_file(path_or_fileobj=expected,path_in_repo="README.md",
             repo_id=REPO,repo_type="dataset",parent_commit=rev,
             commit_message="docs(orb3): qualify historical label exposure and HITL authority")
        new_rev=getattr(commit,"oid",None)
        if not new_rev or len(new_rev)!=40:
            raise RuntimeError("HF commit revision absent")
        state="PUBLISHED_SOURCE_CORRECTION"
    after=hf_hub_download(repo_id=REPO,filename="README.md",
       revision=new_rev,repo_type="dataset",token=token,force_download=True)
    if Path(after).read_bytes()!=expected:
        raise RuntimeError("public card byte readback mismatch")
    receipt={
        "schema":SCHEMA,"publication_state":state,
        "target":"https://huggingface.co/datasets/"+REPO,
        "file":"README.md","baseline_sha256":BASELINE_SHA256,
        "reviewed_source_sha256":sha(expected),
        "previous_hf_revision":rev,"published_hf_revision":new_rev,
        "source_git_sha":os.environ.get("GITHUB_SHA"),
        "public_exact_bytes_verified":True,
        "original_signed_historical_record_untouched":True,
        "human_identity_or_authority_verified":False,
        "independent_blinded_council_accuracy_verified":False,
    }
    print(json.dumps(receipt,sort_keys=True))
    return receipt

def main():
    p=argparse.ArgumentParser(description=__doc__)
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--check",action="store_true")
    group.add_argument("--publish",action="store_true")
    p.add_argument("--receipt-out",type=Path)
    args=p.parse_args()
    root=Path(__file__).resolve().parents[2]
    expected=source_bytes(root)
    privacy_gate(root,root/SOURCE)
    if args.check:
        print(json.dumps({"state":"REVIEWED_SOURCE_READY",
              "source_sha256":sha(expected),
              "baseline_sha256":BASELINE_SHA256},sort_keys=True))
        return 0
    receipt=publish(root,expected)
    if args.receipt_out:
        args.receipt_out.write_text(json.dumps(receipt,indent=2,sort_keys=True)+"\n")
    return 0

if __name__=="__main__":
    sys.exit(main())
