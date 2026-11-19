#!/usr/bin/env python3
"""Refuse a release whose latest card-root proof is absent from the OTS manifest.

This is an offline byte check. BITCOIN means a parsed attestation only; no chain
verification, signing, stamping, publication, or network request happens here.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
from maintain_card_ots import parse  # noqa: E402
from maintain_card_root_ots import _validate_root  # noqa: E402
from ots_manifest_rebuild import SCHEMA, build  # noqa: E402

ROOT_URL = re.compile(r"/interop/card-root-[0-9]{4}-[0-9]{2}-[0-9]{2}(?:-[a-f0-9]{12})?\.json\Z")
HEX = re.compile(r"[a-f0-9]{64}\Z")


def _raw(path: Path, limit: int) -> bytes:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > limit:
        raise ValueError(f"missing, symlinked, or oversized release file: {path}")
    return path.read_bytes()


def verify(public: Path) -> dict:
    public = public.absolute()
    pointer = json.loads(_raw(public / "interop/card-root-latest.json", 8192))
    if pointer.get("schema") != "csoai.card-root-pointer/1":
        raise ValueError("unsupported card-root pointer")
    root_url = pointer.get("root_url")
    if not isinstance(root_url, str) or not ROOT_URL.fullmatch(root_url):
        raise ValueError("unsafe or malformed card-root URL")
    ots_url = root_url + ".ots"
    if pointer.get("ots_url") != ots_url:
        raise ValueError("pointer OTS URL does not name the exact root")
    expected = pointer.get("root_sha256")
    if not isinstance(expected, str) or not HEX.fullmatch(expected):
        raise ValueError("malformed pointer root digest")
    root_raw = _raw(public / root_url.lstrip("/"), 4_194_304)
    actual = hashlib.sha256(root_raw).hexdigest()
    if actual != expected:
        raise ValueError("pointer root digest differs from root bytes")
    root_doc = _validate_root(root_raw)
    if pointer.get("n_leaves") != root_doc["n_leaves"]:
        raise ValueError("pointer leaf count differs from root")
    proof_raw = _raw(public / ots_url.lstrip("/"), 1_048_576)
    parse(proof_raw, actual)  # official detached parser; SHA-256 root binding and EOF required

    manifest = json.loads(_raw(public / "interop/ots/manifest.json", 4_194_304))
    if manifest.get("schema") != SCHEMA:
        raise ValueError("unsupported OTS manifest")
    dirs = [public / "interop", public / "interop/ots"]
    if not all(d.is_dir() and not d.is_symlink() for d in dirs):
        raise ValueError("OTS scan directory absent or symlinked")
    derived, _, rejected = build(dirs, public)
    if rejected:
        raise ValueError("a served .ots file does not parse")
    # as_of records the last content change; an unchanged manifest need not be
    # rewritten every hour. Everything else must equal a fresh scan of the bytes.
    without_time = lambda doc: {k: v for k, v in doc.items() if k != "as_of"}
    if without_time(manifest) != without_time(derived):
        raise ValueError("OTS manifest differs from current proof bytes; rebuild before release")
    rows = [row for row in manifest["proofs"] if row.get("path") == ots_url]
    if len(rows) != 1 or rows[0].get("subject") != root_url or not rows[0].get("subject_present"):
        raise ValueError("latest root proof missing from OTS manifest")
    if rows[0].get("sha256_of_proof") != hashlib.sha256(proof_raw).hexdigest():
        raise ValueError("latest root proof digest differs from OTS manifest")
    return {"state": "VALID_PREIMAGE_ONLY", "root_url": root_url, "root_sha256": actual,
            "ots_url": ots_url, "ots_state": rows[0]["state"],
            "manifest_proofs": manifest["counts"]["proofs"], "chain_verified": False}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--public-dir", required=True, type=Path)
    args = ap.parse_args(argv)
    try:
        result = verify(args.public_dir)
    except Exception as exc:
        print(json.dumps({"state": "FAILED_CLOSED", "reason": str(exc), "error": type(exc).__name__}))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
