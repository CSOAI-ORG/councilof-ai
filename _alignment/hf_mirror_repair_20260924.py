#!/usr/bin/env python3
"""One-time, compare-and-swap repair of eight stale public HF mirror files.

The current live Council site and the pinned RunPod source commit must agree with
the triage's expected SHA-256 for every byte. No local mirror-lane file is read.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from huggingface_hub import CommitOperationAdd, HfApi


TRIAGE = pathlib.Path("/Users/nicholas/clawd/_alignment/MIRROR_DRIFT_TRIAGE_2026-09-24.json")
RECEIPT = pathlib.Path("/Users/nicholas/clawd/_alignment/HF_MIRROR_REPAIR_2026-09-24.json")
REPO = "csoai/councilof-ai-mirror"
PINNED_SOURCE = "680a0a90ec11ddef6fd800daa8f7ae04116602b2"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0.0.0"
TARGETS = (
    "financial-axes.json",
    "financial-measure-compact.json",
    "financial-measure-run-ai-adoption-components.json",
    "financial-measure-run-labour-components.json",
    "footprint-packages.json",
    "mill-receipt-readiness.json",
    "root-witness-latest.json",
    "root-witness-pointer.json",
)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        return response.read()


def write_receipt(data: dict) -> None:
    RECEIPT.parent.mkdir(parents=True, exist_ok=True)
    temp = RECEIPT.with_suffix(".json.tmp")
    temp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")
    os.replace(temp, RECEIPT)


def main() -> int:
    triage = json.loads(TRIAGE.read_text())
    if triage.get("runpod_bare_master_observed") != PINNED_SOURCE:
        raise RuntimeError("triage source commit changed; refusing upload")
    rows = {r["path"].removeprefix("interop/"): r for r in triage["rows"]}
    receipt: dict = {
        "schema": "csoai.hf-mirror-repair/0.1",
        "started_at": now(),
        "source_runpod_bare_master": PINNED_SOURCE,
        "hf_repo": REPO,
        "state": "PREFLIGHT",
        "files": [],
    }
    write_receipt(receipt)

    source: dict[str, bytes] = {}
    for name in TARGETS:
        row = rows[name]
        if row["classification"] != "STALE_HF_MIRROR_LOCAL_SOURCE_BEHIND_CANONICAL":
            raise RuntimeError(f"unapproved row classification: {name}")
        url = f"https://councilof.ai/interop/{urllib.parse.quote(name)}"
        data = read(url)
        expected = row["proof"]["runpod_master_sha256"]
        if sha(data) != expected or sha(data) != row["cloudflare"]["sha256"]:
            raise RuntimeError(f"site/source digest disagreement: {name}")
        source[name] = data
        receipt["files"].append({
            "path": f"interop/{name}",
            "hf_path": f"interop__{name}",
            "canonical_url": url,
            "sha256": expected,
            "bytes": len(data),
        })

    api = HfApi()
    base = api.repo_info(REPO, repo_type="dataset").sha
    receipt["hf_parent_commit"] = base
    write_receipt(receipt)
    pending = []
    for f in receipt["files"]:
        name = f["path"].removeprefix("interop/")
        public = f"https://huggingface.co/datasets/{REPO}/resolve/main/{f['hf_path']}"
        previous = read(public)
        f["hf_before_sha256"] = sha(previous)
        if sha(previous) != f["sha256"]:
            pending.append(name)
    if not pending:
        receipt["state"] = "ALREADY_CURRENT"
        receipt["completed_at"] = now()
        write_receipt(receipt)
        print(json.dumps({"state": receipt["state"], "files": len(TARGETS), "hf_commit": base}))
        return 0

    token_result = subprocess.run(
        ["security", "find-generic-password", "-s", "meok-keystone", "-a", "HF_TOKEN", "-w"],
        capture_output=True,
        check=True,
    )
    token = token_result.stdout.strip().decode()
    if not token:
        raise RuntimeError("HF keychain token absent")
    writer = HfApi(token=token)
    operations = [
        CommitOperationAdd(path_in_repo=f"interop__{name}", path_or_fileobj=io.BytesIO(source[name]))
        for name in pending
    ]
    info = writer.create_commit(
        repo_id=REPO,
        repo_type="dataset",
        operations=operations,
        parent_commit=base,
        commit_message=f"Sync {len(pending)} evidence files to served Council source",
        commit_description=f"Source commit: {PINNED_SOURCE}. Each uploaded byte was checked against the served Council URL and its source digest.",
    )
    receipt["hf_commit"] = info.oid
    receipt["state"] = "COMMITTED_AWAITING_READBACK"
    write_receipt(receipt)

    for f in receipt["files"]:
        public = f"https://huggingface.co/datasets/{REPO}/resolve/main/{f['hf_path']}"
        for attempt in range(6):
            data = read(public)
            f["hf_public_sha256"] = sha(data)
            f["hf_public_bytes"] = len(data)
            if sha(data) == f["sha256"]:
                f["state"] = "VERIFIED_MATCHING_DIGEST"
                break
            if attempt < 5:
                time.sleep(4)
        else:
            f["state"] = "REACHABLE_DIGEST_MISMATCH"
        write_receipt(receipt)
    receipt["state"] = (
        "PUBLIC_READBACK_VERIFIED"
        if all(f["state"] == "VERIFIED_MATCHING_DIGEST" for f in receipt["files"])
        else "READBACK_MISMATCH"
    )
    receipt["completed_at"] = now()
    write_receipt(receipt)
    print(json.dumps({"state": receipt["state"], "files": len(TARGETS),
                      "uploaded": len(pending), "hf_commit": info.oid}))
    return 0 if receipt["state"] == "PUBLIC_READBACK_VERIFIED" else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"HF mirror repair stopped: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(2)
