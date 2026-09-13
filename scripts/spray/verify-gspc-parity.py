#!/usr/bin/env python3
"""Download and verify exact GSPC snapshot parity across Hugging Face and Kaggle."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import tempfile
import urllib.request
import zipfile
from pathlib import Path

FILES = ("README.md", "board.json", "root.json", "SNAPSHOT.json", "gspc-axes.csv",
         "gspc-axes.jsonl", "check-board.sh", "manifest.jsonl")
HF = "https://huggingface.co/datasets/csoai/gspc-board/resolve/main/snapshot"
KAGGLE = "https://www.kaggle.com/api/v1/datasets/download/nicktempleman/csoai-gspc-living-board"
LIVE_ROOT = "https://councilof.ai/root.json"
UA = "csoai-gspc-parity-verifier/1 (+https://github.com/CSOAI-ORG/councilof-ai)"


def get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_hf() -> dict[str, bytes]:
    return {name: get(f"{HF}/{name}?download=true") for name in FILES}


def read_kaggle() -> dict[str, bytes]:
    with zipfile.ZipFile(io.BytesIO(get(KAGGLE))) as archive:
        names = {Path(name).name: name for name in archive.namelist() if not name.endswith("/")}
        missing = set(FILES) - set(names)
        if missing:
            raise ValueError(f"Kaggle archive lacks {sorted(missing)}")
        return {name: archive.read(names[name]) for name in FILES}


def validate(label: str, files: dict[str, bytes]) -> dict:
    snapshot = json.loads(files["SNAPSHOT.json"])
    root = json.loads(files["root.json"])
    required = ("as_of", "card_count", "merkle_root", "root_sha256")
    if any(key not in snapshot for key in required):
        raise ValueError(f"{label} SNAPSHOT.json lacks a required root field")
    if snapshot["root_sha256"] != sha(files["root.json"]):
        raise ValueError(f"{label} root_sha256 does not match root.json bytes")
    if (snapshot["as_of"], snapshot["card_count"], snapshot["merkle_root"]) != (
        root.get("as_of"), root.get("card_count"), root.get("merkle_root")
    ):
        raise ValueError(f"{label} SNAPSHOT.json and root.json disagree")
    if root.get("card_count") != len(root.get("card_sha256", [])):
        raise ValueError(f"{label} card_count does not equal len(card_sha256)")
    manifest = {row["file"]: row for row in map(json.loads, files["manifest.jsonl"].splitlines())}
    expected = set(FILES) - {"manifest.jsonl"}
    if set(manifest) != expected:
        raise ValueError(f"{label} manifest names disagree: {sorted(set(manifest) ^ expected)}")
    for name, row in manifest.items():
        if row.get("bytes") != len(files[name]) or row.get("sha256") != sha(files[name]):
            raise ValueError(f"{label} manifest entry for {name} does not match its bytes")
    return {key: snapshot[key] for key in required}


def kaggle_behind(hf: dict[str, bytes], kaggle: dict[str, bytes]) -> bool:
    """True when Kaggle's downloadable archive still carries an OLDER snapshot than Hugging Face.

    Kaggle creates a version immediately but its public download keeps serving the previous
    archive for minutes (seen 2026-09-13 16:50Z: version created, archive still as_of 06:03).
    Judging parity in that window turns a lag into a red. A read that is behind is waited on
    (bounded); a read that is EQUAL in as_of but different in bytes is a real mismatch and is
    never waited on."""
    try:
        h = json.loads(hf["SNAPSHOT.json"]).get("as_of") or ""
        k = json.loads(kaggle["SNAPSHOT.json"]).get("as_of") or ""
    except Exception:  # noqa: BLE001
        return False
    return bool(h and k and k < h)


def verify(*, require_live: bool = True, kaggle_wait_seconds: int = 0, poll_seconds: int = 30, sleep=None) -> dict:
    import time
    sleep = sleep or time.sleep
    hf, kaggle = read_hf(), read_kaggle()
    waited = 0
    while kaggle_behind(hf, kaggle) and waited < kaggle_wait_seconds:
        sleep(poll_seconds)
        waited += poll_seconds
        kaggle = read_kaggle()
    hf_tuple, kaggle_tuple = validate("Hugging Face", hf), validate("Kaggle", kaggle)
    mismatches = [name for name in FILES if hf[name] != kaggle[name]]
    if mismatches:
        lag = " (Kaggle's archive is still behind after the bounded wait)" if kaggle_behind(hf, kaggle) else ""
        raise ValueError(f"snapshot parity failed; byte mismatches: {mismatches}{lag}")
    if hf_tuple != kaggle_tuple:
        raise ValueError("snapshot parity failed; root tuples disagree")
    if require_live and hf["root.json"] != get(LIVE_ROOT):
        raise ValueError("mirrored root.json is not byte-identical to the current Council root")
    return {
        "kind": "csoai.gspc-snapshot-parity/1",
        "state": "EXTERNALLY_VERIFIED",
        **hf_tuple,
        "files": {name: {"bytes": len(hf[name]), "sha256": sha(hf[name])} for name in FILES},
        "urls": {"huggingface": HF.rsplit("/resolve/", 1)[0] + "/tree/main/snapshot",
                 "kaggle": "https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board"},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-stale-live-root", action="store_true",
                        help="verify mirror parity without requiring current Council root bytes")
    parser.add_argument("--report", help="write the verified result as JSON")
    parser.add_argument("--kaggle-wait-seconds", type=int, default=0,
                        help="if Kaggle's archive is BEHIND Hugging Face (older as_of), re-read it for up to this long before judging")
    args = parser.parse_args()
    result = verify(require_live=not args.allow_stale_live_root, kaggle_wait_seconds=args.kaggle_wait_seconds)
    body = json.dumps(result, indent=1, ensure_ascii=False) + "\n"
    if args.report:
        Path(args.report).write_text(body, encoding="utf-8")
    print(body, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
